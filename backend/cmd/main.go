package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"job-platform/internal/config"
	"job-platform/internal/cron"
	"job-platform/internal/database"
	"job-platform/internal/repository"
	"job-platform/internal/router"
	"job-platform/internal/service"
	"job-platform/internal/storage"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Set Gin mode
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize PostgreSQL
	db, err := database.NewPostgres(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}
	log.Println("✅ Connected to PostgreSQL")

	// Initialize Redis
	redisClient, err := database.NewRedis(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	log.Println("✅ Connected to Redis")

	// Initialize MinIO
	minioConfig := &storage.MinioConfig{
		Endpoint:        cfg.MinioEndpoint,
		AccessKey:       cfg.MinioAccessKey,
		SecretKey:       cfg.MinioSecretKey,
		UseSSL:          cfg.MinioUseSSL,
		BucketResumes:   cfg.MinioBucketResumes,
		BucketAvatars:   cfg.MinioBucketAvatars,
		BucketCerts:     cfg.MinioBucketCerts,
		BucketPortfolio: cfg.MinioBucketPortfolios,
	}

	minioClient, err := storage.NewMinioClient(minioConfig)
	if err != nil {
		log.Fatalf("Failed to connect to MinIO: %v", err)
	}
	log.Println("✅ Connected to MinIO")

	// Initialize MinIO buckets
	if err := minioClient.InitBuckets(); err != nil {
		log.Printf("⚠️  Warning: Failed to initialize MinIO buckets (buckets may already exist): %v", err)
	} else {
		log.Println("✅ MinIO buckets initialized")
	}

	// Setup router with MinIO client
	r := router.SetupRouter(cfg, db, redisClient, minioClient)

	// Initialize job repositories and services for cron
	jobRepo := repository.NewJobRepository(db)
	jobCategoryRepo := repository.NewJobCategoryRepository(db)
	applicationRepo := repository.NewApplicationRepository(db)
	jobViewRepo := repository.NewJobViewRepository(db)
	userRepo := repository.NewUserRepository(db)

	jobService := service.NewJobService(
		jobRepo,
		jobCategoryRepo,
		applicationRepo,
		jobViewRepo,
		userRepo,
		db,
		&service.JobConfig{
			ExpiryDays:             30,
			ExpiryWarningDays:      7,
			MaxFreeJobsPerEmployer: 5,
			ModerationEnabled:      false,
			DefaultExpiryDays:      30,
		},
	)

	// Start cron scheduler
	cronScheduler := cron.NewJobCronScheduler(jobService)
	cronScheduler.Start()

	// Create HTTP server
	addr := fmt.Sprintf("%s:%s", cfg.AppHost, cfg.AppPort)
	srv := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("🚀 Server starting on %s", addr)
		log.Printf("📊 Environment: %s", cfg.AppEnv)
		log.Printf("🔗 Health check: http://localhost:%s/health", cfg.AppPort)
		log.Printf("📚 API Base: http://localhost:%s/api/v1", cfg.AppPort)

		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("🛑 Shutting down server...")

	// Stop cron scheduler
	cronScheduler.Stop()

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("✅ Server exited gracefully")
}
