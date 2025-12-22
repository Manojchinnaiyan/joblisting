package router

import (
	"job-platform/internal/config"
	"job-platform/internal/handler"
	handlerMiddleware "job-platform/internal/handler/middleware"
	"job-platform/internal/middleware"
	"job-platform/internal/repository"
	"job-platform/internal/service"
	"job-platform/internal/storage"
	"job-platform/internal/util/email"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func SetupRouter(cfg *config.Config, db *gorm.DB, redis *redis.Client, minioClient *storage.MinioClient) *gin.Engine {
	r := gin.Default()

	// Middleware
	r.Use(middleware.CORS())

	// Initialize repositories
	userRepo := repository.NewUserRepository(db)
	tokenRepo := repository.NewTokenRepository(db)
	profileRepo := repository.NewProfileRepository(db)
	loginHistoryRepo := repository.NewLoginHistoryRepository(db)
	passwordHistoryRepo := repository.NewPasswordHistoryRepository(db)
	adminSettingsRepo := repository.NewAdminSettingsRepository(db)

	// Profile management repositories
	resumeRepo := repository.NewResumeRepository(db)
	workExperienceRepo := repository.NewWorkExperienceRepository(db)
	educationRepo := repository.NewEducationRepository(db)
	userSkillRepo := repository.NewUserSkillRepository(db)
	certificationRepo := repository.NewCertificationRepository(db)
	portfolioRepo := repository.NewPortfolioRepository(db)

	// Saved candidate repository
	savedCandidateRepo := repository.NewSavedCandidateRepository(db)

	// Company management repositories
	companyRepo := repository.NewCompanyRepository(db)
	teamRepo := repository.NewTeamRepository(db)
	invitationRepo := repository.NewInvitationRepository(db)
	locationRepo := repository.NewLocationRepository(db)
	benefitRepo := repository.NewBenefitRepository(db)
	mediaRepo := repository.NewMediaRepository(db)
	reviewRepo := repository.NewReviewRepository(db)
	followerRepo := repository.NewFollowerRepository(db)

	// Job management repositories
	jobRepo := repository.NewJobRepository(db)
	applicationRepo := repository.NewApplicationRepository(db)
	applicationStatusHistoryRepo := repository.NewApplicationStatusHistoryRepository(db)
	savedJobRepo := repository.NewSavedJobRepository(db)
	jobCategoryRepo := repository.NewJobCategoryRepository(db)
	jobViewRepo := repository.NewJobViewRepository(db)

	// Notification repositories
	notificationRepo := repository.NewNotificationRepository(db)
	notificationPrefsRepo := repository.NewNotificationPreferencesRepository(db)

	// Parse duration strings
	emailVerificationExpiry, _ := config.ParseDuration(cfg.EmailVerificationExpiry)
	passwordResetExpiry, _ := config.ParseDuration(cfg.PasswordResetExpiry)
	jwtAccessExpiry, _ := config.ParseDuration(cfg.JWTAccessExpiry)
	jwtRefreshExpiry, _ := config.ParseDuration(cfg.JWTRefreshExpiry)
	jwtAdminExpiry, _ := config.ParseDuration(cfg.JWTAdminExpiry)

	// Initialize email service based on provider
	var emailService email.EmailSender

	if cfg.EmailProvider == "RESEND" {
		emailService = email.NewResendService(&email.ResendConfig{
			APIKey:    cfg.ResendAPIKey,
			FromEmail: cfg.ResendFromEmail,
			FromName:  cfg.ResendFromName,
		})
	} else {
		// Default to SMTP
		emailService = email.NewEmailService(&email.EmailConfig{
			SMTPHost:     cfg.SMTPHost,
			SMTPPort:     cfg.SMTPPort,
			SMTPUser:     cfg.SMTPUser,
			SMTPPassword: cfg.SMTPPassword,
			FromEmail:    cfg.EmailFrom,
			FromName:     "Job Platform",
		})
	}

	// Initialize services
	tokenService := service.NewTokenService(
		tokenRepo,
		cfg.JWTSecret,
		jwtAccessExpiry,
		jwtRefreshExpiry,
		jwtAdminExpiry,
	)

	authService := service.NewAuthService(
		userRepo,
		tokenRepo,
		profileRepo,
		loginHistoryRepo,
		passwordHistoryRepo,
		tokenService,
		emailService,
		db,
		&service.AuthConfig{
			EmailVerificationExpiry: emailVerificationExpiry,
			PasswordResetExpiry:     passwordResetExpiry,
			MaxLoginAttempts:        cfg.MaxLoginAttempts,
		},
	)

	userService := service.NewUserService(userRepo, profileRepo)

	adminService := service.NewAdminService(
		userRepo,
		profileRepo,
		tokenRepo,
		loginHistoryRepo,
		tokenService,
		emailService,
		db,
		&service.AdminConfig{
			AdminEmailDomain: cfg.AdminEmailDomain,
			CompanyName:      "Job Platform",
			SupportEmail:     cfg.EmailFrom,
			BcryptCost:       cfg.BcryptCost,
		},
	)

	cmsService := service.NewCMSService(adminSettingsRepo)

	googleOAuthService := service.NewGoogleOAuthService(
		userRepo,
		profileRepo,
		loginHistoryRepo,
		tokenService,
		db,
		cfg.GoogleClientID,
		cfg.GoogleClientSecret,
		cfg.GoogleRedirectURL,
	)

	// Job management services
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

	applicationService := service.NewApplicationService(
		applicationRepo,
		applicationStatusHistoryRepo,
		jobRepo,
		userRepo,
		db,
	)

	savedJobService := service.NewSavedJobService(savedJobRepo, jobRepo)
	jobCategoryService := service.NewJobCategoryService(jobCategoryRepo)

	// Profile management services
	profileService := service.NewProfileService(profileRepo, resumeRepo, workExperienceRepo, educationRepo, userSkillRepo, db)
	skillService := service.NewSkillService(userSkillRepo, profileService)
	experienceService := service.NewWorkExperienceService(workExperienceRepo, profileService)
	educationService := service.NewEducationService(educationRepo, profileService)
	certificationService := service.NewCertificationService(certificationRepo, profileService)
	portfolioService := service.NewPortfolioService(portfolioRepo, profileService, minioClient)
	resumeService := service.NewResumeService(resumeRepo, profileService, minioClient, db, cfg.MaxResumesPerUser, 10, 24, "resumes")

	// Candidate search service
	candidateSearchService := service.NewCandidateSearchService(profileRepo, savedCandidateRepo, userRepo)

	// Company management services
	companyService := service.NewCompanyService(companyRepo, teamRepo, locationRepo, benefitRepo, mediaRepo, reviewRepo, followerRepo, minioClient)
	teamService := service.NewTeamService(teamRepo, companyRepo)
	invitationService := service.NewInvitationService(invitationRepo, teamRepo, companyRepo)
	locationService := service.NewLocationService(locationRepo, companyRepo)
	benefitService := service.NewBenefitService(benefitRepo, companyRepo)
	mediaService := service.NewMediaService(mediaRepo, companyRepo, minioClient)
	reviewService := service.NewReviewService(reviewRepo, companyRepo, teamRepo)
	followerService := service.NewFollowerService(followerRepo, companyRepo)
	analyticsService := service.NewAnalyticsService(companyRepo, reviewRepo, followerRepo, teamRepo, locationRepo)

	// Notification service
	notificationService := service.NewNotificationService(notificationRepo, notificationPrefsRepo)

	// Blog service
	blogRepo := repository.NewBlogRepository(db)
	blogService := service.NewBlogService(blogRepo)

	// Scraper services
	aiService := service.NewAIService()
	scraperService := service.NewScraperService(aiService)

	// Set notification service on application service (to avoid circular dependency)
	applicationService.SetNotificationService(notificationService)

	// Initialize handlers
	healthHandler := handler.NewHealthHandler(db, redis)
	authHandler := handler.NewAuthHandler(authService, tokenService, userService)
	adminAuthHandler := handler.NewAdminAuthHandler(adminService, tokenService)
	adminUserHandler := handler.NewAdminUserHandler(adminService, userService)
	adminCMSHandler := handler.NewAdminCMSHandler(cmsService)
	adminAnalyticsHandler := handler.NewAdminAnalyticsHandler(userService, adminService, jobRepo, companyRepo, applicationRepo, reviewRepo)
	oauthHandler := handler.NewOAuthHandler(googleOAuthService, cfg)

	// Job management handlers
	jobHandler := handler.NewJobHandler(jobService, jobCategoryService, savedJobService)
	jobSeekerHandler := handler.NewJobSeekerHandler(applicationService, savedJobService, jobService)
	employerJobHandler := handler.NewEmployerJobHandler(jobService, applicationService)
	adminJobHandler := handler.NewAdminJobHandler(jobService, applicationService, jobCategoryService)

	// Profile management handlers
	profileHandler := handler.NewProfileHandler(profileService, userService, minioClient)
	skillHandler := handler.NewSkillHandler(skillService)
	experienceHandler := handler.NewExperienceHandler(experienceService)
	educationHandler := handler.NewEducationHandler(educationService)
	certificationHandler := handler.NewCertificationHandler(certificationService)
	portfolioHandler := handler.NewPortfolioHandler(portfolioService)
	resumeHandler := handler.NewResumeHandler(resumeService)

	// Company management handlers
	publicCompanyHandler := handler.NewPublicCompanyHandler(companyService, locationService, benefitService, mediaService, reviewService, followerService)
	jobSeekerCompanyHandler := handler.NewJobSeekerCompanyHandler(followerService, reviewService, companyService)
	employerCompanyHandler := handler.NewEmployerCompanyHandler(companyService, teamService, locationService, benefitService, mediaService, reviewService, followerService)
	invitationHandler := handler.NewInvitationHandler(invitationService, teamService)
	adminCompanyHandler := handler.NewAdminCompanyHandler(companyService, reviewService, analyticsService)

	// Employer candidate handler
	employerCandidateHandler := handler.NewEmployerCandidateHandler(candidateSearchService, profileService, userService, skillService)

	// Notification handler
	notificationHandler := handler.NewNotificationHandler(notificationService)

	// Blog handler
	blogHandler := handler.NewBlogHandler(blogService)

	// Scraper handler
	scraperHandler := handler.NewScraperHandler(scraperService, jobService)

	// Import queue service and handler
	importQueueService := service.NewImportQueueService(scraperService, jobService)
	importQueueHandler := handler.NewImportQueueHandler(importQueueService)

	// Initialize middleware
	authMiddleware := middleware.AuthMiddleware(tokenService, userService)
	companyMiddleware := handlerMiddleware.NewCompanyMiddleware(companyService, teamService)
	adminMiddleware := middleware.AdminMiddleware()
	loginRateLimitMiddleware := middleware.LoginRateLimitMiddleware(redis)
	emailRateLimitMiddleware := middleware.EmailRateLimitMiddleware(redis)
	generalRateLimitMiddleware := middleware.RateLimitMiddleware(redis, 100, 1*time.Minute)

	// Health routes (no prefix)
	r.GET("/health", healthHandler.Check)
	r.GET("/health/ready", healthHandler.Readiness)
	r.GET("/health/live", healthHandler.Liveness)

	// API v1 routes
	v1 := r.Group("/api/v1")
	{
		// Welcome endpoint
		v1.GET("/", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"message": "Welcome to Job Platform API",
				"version": "1.0.0",
				"status":  "running",
			})
		})

		// ==================== Public Auth Routes ====================
		auth := v1.Group("/auth")
		{
			// Registration & Login
			auth.POST("/register", generalRateLimitMiddleware, authHandler.Register)
			auth.POST("/login", loginRateLimitMiddleware, authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)

			// Email Verification
			auth.GET("/verify-email", authHandler.VerifyEmail)
			auth.POST("/resend-verification", emailRateLimitMiddleware, authHandler.ResendVerification)

			// Password Reset
			auth.POST("/forgot-password", emailRateLimitMiddleware, authHandler.ForgotPassword)
			auth.POST("/reset-password", authHandler.ResetPassword)

			// Google OAuth - routes under /auth/oauth/google
			oauth := auth.Group("/oauth")
			{
				oauth.GET("/google", oauthHandler.GetGoogleAuthURL)           // Redirect to Google
				oauth.GET("/google/url", oauthHandler.GetGoogleAuthURLJSON)   // Get URL as JSON (for SPA)
				oauth.GET("/google/callback", oauthHandler.GoogleCallbackRedirect) // Callback from Google (redirect)
				oauth.POST("/google/callback", oauthHandler.GoogleCallback)    // Callback from SPA
			}

			// Google OAuth - direct routes under /auth/google (for compatibility with Google Console URI)
			auth.GET("/google/callback", oauthHandler.GoogleCallbackRedirect) // Callback from Google (redirect)
		}

		// ==================== Protected Auth Routes ====================
		authProtected := v1.Group("/auth")
		authProtected.Use(authMiddleware)
		{
			// User Info & Profile
			authProtected.GET("/me", authHandler.GetMe)
			authProtected.POST("/change-password", authHandler.ChangePassword)
			authProtected.POST("/logout", authHandler.Logout)

			// OAuth Account Linking
			authProtected.POST("/oauth/google/link", oauthHandler.LinkGoogleAccount)
			authProtected.DELETE("/oauth/google/unlink", oauthHandler.UnlinkGoogleAccount)
		}

		// ==================== Admin Auth Routes ====================
		adminAuth := v1.Group("/admin/auth")
		{
			// Admin Login (with 2FA)
			adminAuth.POST("/login", loginRateLimitMiddleware, adminAuthHandler.Login)
			adminAuth.POST("/verify-2fa", adminAuthHandler.Verify2FA)
			adminAuth.POST("/refresh", adminAuthHandler.RefreshToken)
		}

		// ==================== Protected Admin Auth Routes ====================
		adminAuthProtected := v1.Group("/admin/auth")
		adminAuthProtected.Use(authMiddleware, adminMiddleware)
		{
			adminAuthProtected.GET("/me", adminAuthHandler.GetMe)
			adminAuthProtected.PUT("/profile", adminAuthHandler.UpdateProfile)
			adminAuthProtected.POST("/logout", adminAuthHandler.Logout)
			adminAuthProtected.POST("/enable-2fa", adminAuthHandler.Enable2FA)
			adminAuthProtected.POST("/disable-2fa", adminAuthHandler.Disable2FA)
		}

		// ==================== Admin User Management Routes ====================
		adminUsers := v1.Group("/admin/users")
		adminUsers.Use(authMiddleware, adminMiddleware)
		{
			adminUsers.GET("", adminUserHandler.ListUsers)
			// Static routes must come BEFORE dynamic :id routes
			adminUsers.POST("/create-admin", adminUserHandler.CreateAdmin)
			// Dynamic :id routes
			adminUsers.GET("/:id", adminUserHandler.GetUser)
			adminUsers.PUT("/:id", adminUserHandler.UpdateUser)
			adminUsers.DELETE("/:id", adminUserHandler.DeleteUser)
			adminUsers.POST("/:id/suspend", adminUserHandler.SuspendUser)
			adminUsers.POST("/:id/activate", adminUserHandler.ActivateUser)
			adminUsers.GET("/:id/login-history", adminUserHandler.GetLoginHistory)
			adminUsers.POST("/:id/revoke-sessions", adminUserHandler.RevokeSessions)
		}

		// ==================== Admin CMS Routes ====================
		adminCMS := v1.Group("/admin/settings")
		adminCMS.Use(authMiddleware, adminMiddleware)
		{
			adminCMS.GET("", adminCMSHandler.GetAllSettings)
			adminCMS.GET("/:key", adminCMSHandler.GetSetting)
			adminCMS.PUT("/:key", adminCMSHandler.UpdateSetting)
			adminCMS.DELETE("/:key", adminCMSHandler.DeleteSetting)
		}

		// ==================== Admin Analytics Routes ====================
		adminAnalytics := v1.Group("/admin/analytics")
		adminAnalytics.Use(authMiddleware, adminMiddleware)
		{
			adminAnalytics.GET("/dashboard", adminAnalyticsHandler.GetDashboard)
			adminAnalytics.GET("/users", adminAnalyticsHandler.GetUserStats)
			adminAnalytics.GET("/jobs", adminAnalyticsHandler.GetJobAnalytics)
			adminAnalytics.GET("/applications", adminAnalyticsHandler.GetApplicationAnalytics)
			adminAnalytics.GET("/companies", adminAnalyticsHandler.GetCompanyAnalytics)
			adminAnalytics.GET("/logins", adminAnalyticsHandler.GetLoginStats)
			adminAnalytics.GET("/security-events", adminAnalyticsHandler.GetSecurityEvents)
		}

		// ==================== Public Job Routes ====================
		jobs := v1.Group("/jobs")
		{
			// Public job listings and details
			jobs.GET("", jobHandler.ListJobs)                 // List all active jobs with pagination
			jobs.GET("/featured", jobHandler.GetFeaturedJobs) // Get featured jobs
			jobs.GET("/search", jobHandler.SearchJobs)        // Search jobs (Meilisearch)
			jobs.GET("/categories", jobHandler.GetCategories) // Get all categories (tree or flat)
			jobs.GET("/locations", jobHandler.GetLocations)   // Get all locations
			jobs.GET("/view/:slug", jobHandler.GetJobBySlug)  // Get job by slug (records view)
		}

		// ==================== Job Seeker Routes ====================
		jobSeekerJobs := v1.Group("/jobs")
		jobSeekerJobs.Use(authMiddleware, middleware.JobSeekerOnly())
		{
			// Apply to jobs
			jobSeekerJobs.POST("/:id/apply", jobSeekerHandler.ApplyToJob)
			jobSeekerJobs.GET("/:id/application", jobSeekerHandler.GetMyApplication)
			jobSeekerJobs.DELETE("/:id/application", jobSeekerHandler.WithdrawApplication)

			// Save/bookmark jobs
			jobSeekerJobs.POST("/:id/save", jobSeekerHandler.SaveJob)
			jobSeekerJobs.DELETE("/:id/save", jobSeekerHandler.UnsaveJob)
		}

		// ==================== Job Seeker "Me" Routes ====================
		// Consolidated routes under /jobseeker/me for all personal job seeker data
		jobSeekerMe := v1.Group("/jobseeker/me")
		jobSeekerMe.Use(authMiddleware, middleware.JobSeekerOnly())
		{
			// Applications
			jobSeekerMe.GET("/applications", jobSeekerHandler.GetMyApplications)
			jobSeekerMe.GET("/applications/:id", jobSeekerHandler.GetApplicationDetail)

			// Saved jobs
			jobSeekerMe.GET("/saved-jobs", jobSeekerHandler.GetSavedJobs)
			jobSeekerMe.PATCH("/saved-jobs/:id/notes", jobSeekerHandler.UpdateSavedJobNotes)

			// Profile CRUD
			jobSeekerMe.GET("/profile", profileHandler.GetMyProfile)
			jobSeekerMe.PUT("/profile", profileHandler.UpdateProfile)

			// Profile management
			jobSeekerMe.GET("/profile/completeness", profileHandler.GetProfileCompleteness)

			// Avatar management
			jobSeekerMe.POST("/avatar", profileHandler.UploadAvatar)
			jobSeekerMe.DELETE("/avatar", profileHandler.DeleteAvatar)

			// Skills management
			jobSeekerMe.GET("/skills", skillHandler.GetUserSkills)
			jobSeekerMe.POST("/skills", skillHandler.AddSkill)
			jobSeekerMe.PUT("/skills/:id", skillHandler.UpdateSkill)
			jobSeekerMe.DELETE("/skills/:id", skillHandler.DeleteSkill)
			jobSeekerMe.POST("/skills/bulk", skillHandler.BulkAddSkills)

			// Experience management
			jobSeekerMe.GET("/experiences", experienceHandler.GetUserExperiences)
			jobSeekerMe.GET("/experiences/:id", experienceHandler.GetExperience)
			jobSeekerMe.POST("/experiences", experienceHandler.CreateExperience)
			jobSeekerMe.PUT("/experiences/:id", experienceHandler.UpdateExperience)
			jobSeekerMe.DELETE("/experiences/:id", experienceHandler.DeleteExperience)

			// Education management
			jobSeekerMe.GET("/education", educationHandler.GetUserEducation)
			jobSeekerMe.GET("/education/:id", educationHandler.GetEducation)
			jobSeekerMe.POST("/education", educationHandler.CreateEducation)
			jobSeekerMe.PUT("/education/:id", educationHandler.UpdateEducation)
			jobSeekerMe.DELETE("/education/:id", educationHandler.DeleteEducation)

			// Certifications management
			jobSeekerMe.GET("/certifications", certificationHandler.GetUserCertifications)
			jobSeekerMe.GET("/certifications/:id", certificationHandler.GetCertification)
			jobSeekerMe.POST("/certifications", certificationHandler.CreateCertification)
			jobSeekerMe.PUT("/certifications/:id", certificationHandler.UpdateCertification)
			jobSeekerMe.DELETE("/certifications/:id", certificationHandler.DeleteCertification)

			// Portfolio management
			jobSeekerMe.GET("/portfolio", portfolioHandler.GetUserPortfolio)
			jobSeekerMe.GET("/portfolio/:id", portfolioHandler.GetPortfolio)
			jobSeekerMe.POST("/portfolio", portfolioHandler.CreatePortfolio)
			jobSeekerMe.PUT("/portfolio/:id", portfolioHandler.UpdatePortfolio)
			jobSeekerMe.DELETE("/portfolio/:id", portfolioHandler.DeletePortfolio)
			jobSeekerMe.PUT("/portfolio/:id/featured", portfolioHandler.SetFeatured)

			// Resume management
			jobSeekerMe.GET("/resumes", resumeHandler.GetUserResumes)
			jobSeekerMe.GET("/resumes/:id", resumeHandler.GetResume)
			jobSeekerMe.POST("/resumes", resumeHandler.UploadResume)
			jobSeekerMe.PUT("/resumes/:id", resumeHandler.UpdateResume)
			jobSeekerMe.DELETE("/resumes/:id", resumeHandler.DeleteResume)
			jobSeekerMe.PUT("/resumes/:id/primary", resumeHandler.SetPrimaryResume)
			jobSeekerMe.GET("/resumes/:id/download", resumeHandler.DownloadResume)
		}

		// ==================== Notification Routes (All Authenticated Users) ====================
		notificationRoutes := v1.Group("/me/notifications")
		notificationRoutes.Use(authMiddleware)
		{
			notificationRoutes.GET("", notificationHandler.GetNotifications)
			notificationRoutes.GET("/unread", notificationHandler.GetUnreadCount)
			notificationRoutes.PUT("/:id/read", notificationHandler.MarkAsRead)
			notificationRoutes.PUT("/read-all", notificationHandler.MarkAllAsRead)
			notificationRoutes.DELETE("/:id", notificationHandler.Delete)
			notificationRoutes.DELETE("/clear", notificationHandler.ClearRead)
		}

		notificationPrefsRoutes := v1.Group("/me/notification-preferences")
		notificationPrefsRoutes.Use(authMiddleware)
		{
			notificationPrefsRoutes.GET("", notificationHandler.GetPreferences)
			notificationPrefsRoutes.PUT("", notificationHandler.UpdatePreferences)
		}

		// ==================== Employer Job Routes ====================
		employerJobs := v1.Group("/employer/jobs")
		employerJobs.Use(authMiddleware, middleware.EmployerOnly())
		{
			// Job CRUD
			employerJobs.POST("", employerJobHandler.CreateJob)
			employerJobs.GET("", employerJobHandler.GetMyJobs)
			employerJobs.GET("/:id", employerJobHandler.GetMyJobByID)
			employerJobs.PUT("/:id", employerJobHandler.UpdateJob)
			employerJobs.DELETE("/:id", employerJobHandler.DeleteJob)

			// Job actions
			employerJobs.POST("/:id/close", employerJobHandler.CloseJob)
			employerJobs.POST("/:id/renew", employerJobHandler.RenewJob)

			// Job applications
			employerJobs.GET("/:id/applications", employerJobHandler.GetJobApplications)
			employerJobs.GET("/:id/analytics", employerJobHandler.GetJobAnalytics)
		}

		// Employer - Application management
		employerApplications := v1.Group("/employer/applications")
		employerApplications.Use(authMiddleware, middleware.EmployerOnly())
		{
			employerApplications.GET("", employerJobHandler.GetAllApplications)
			employerApplications.GET("/:id", employerJobHandler.GetApplicationDetail)
			employerApplications.PATCH("/:id/status", employerJobHandler.UpdateApplicationStatus)
			employerApplications.PATCH("/:id/notes", employerJobHandler.AddApplicationNotes)
			employerApplications.PATCH("/:id/rating", employerJobHandler.RateApplicant)
		}

		// Employer - Analytics
		employerAnalytics := v1.Group("/employer/analytics")
		employerAnalytics.Use(authMiddleware, middleware.EmployerOnly())
		{
			employerAnalytics.GET("/overview", employerJobHandler.GetOverviewAnalytics)
		}

		// Employer - Candidate Search
		employerCandidates := v1.Group("/employer/candidates")
		employerCandidates.Use(authMiddleware, middleware.EmployerOnly())
		{
			employerCandidates.GET("", employerCandidateHandler.SearchCandidates)
			employerCandidates.GET("/:id", employerCandidateHandler.GetCandidateProfile)
			employerCandidates.GET("/:id/notes", employerCandidateHandler.GetCandidateNotes)
			employerCandidates.POST("/:id/notes", employerCandidateHandler.AddCandidateNote)
		}

		// Employer - Saved Candidates
		employerSavedCandidates := v1.Group("/employer/saved-candidates")
		employerSavedCandidates.Use(authMiddleware, middleware.EmployerOnly())
		{
			employerSavedCandidates.GET("", employerCandidateHandler.GetSavedCandidates)
			employerSavedCandidates.POST("", employerCandidateHandler.SaveCandidate)
			employerSavedCandidates.PUT("/:id", employerCandidateHandler.UpdateSavedCandidate)
			employerSavedCandidates.DELETE("/:id", employerCandidateHandler.RemoveSavedCandidate)
		}

		// ==================== Admin Job Management Routes ====================
		adminJobs := v1.Group("/admin/jobs")
		adminJobs.Use(authMiddleware, adminMiddleware)
		{
			// Job management
			adminJobs.POST("", adminJobHandler.CreateJob)
			adminJobs.GET("", adminJobHandler.GetAllJobs)
			adminJobs.GET("/pending", adminJobHandler.GetPendingJobs)
			adminJobs.GET("/stats", adminJobHandler.GetJobStats)
			adminJobs.GET("/:id", adminJobHandler.GetJobByID)
			adminJobs.PUT("/:id", adminJobHandler.UpdateJob)
			adminJobs.DELETE("/:id", adminJobHandler.DeleteJob)

			// Job moderation
			adminJobs.POST("/:id/approve", adminJobHandler.ApproveJob)
			adminJobs.POST("/:id/reject", adminJobHandler.RejectJob)
			adminJobs.POST("/:id/feature", adminJobHandler.FeatureJob)
			adminJobs.POST("/:id/unfeature", adminJobHandler.UnfeatureJob)

			// Job scraping
			adminJobs.POST("/scrape/preview", scraperHandler.PreviewJobFromURL)
			adminJobs.POST("/scrape/create", scraperHandler.CreateJobFromScrapedData)
			adminJobs.POST("/scrape/bulk", scraperHandler.BulkScrapeJobs)
			adminJobs.POST("/scrape/test", scraperHandler.TestScrape)
			adminJobs.POST("/scrape/extract-links", scraperHandler.ExtractJobLinks)

			// Import queue endpoints
			adminJobs.POST("/import-queue", importQueueHandler.CreateQueue)
			adminJobs.GET("/import-queue", importQueueHandler.GetAllQueues)
			adminJobs.GET("/import-queue/:id", importQueueHandler.GetQueue)
			adminJobs.POST("/import-queue/:id/cancel", importQueueHandler.CancelQueue)
			adminJobs.POST("/import-queue/:id/cancel-job", importQueueHandler.CancelJob)
			adminJobs.POST("/import-queue/:id/retry-job", importQueueHandler.RetryJob)
			adminJobs.POST("/import-queue/:id/retry-failed", importQueueHandler.RetryFailedJobs)
			adminJobs.DELETE("/import-queue/:id", importQueueHandler.DeleteQueue)

			// Background link extraction endpoints
			adminJobs.POST("/extract-links", importQueueHandler.StartExtraction)
			adminJobs.GET("/extract-links", importQueueHandler.GetAllExtractionTasks)
			adminJobs.GET("/extract-links/:id", importQueueHandler.GetExtractionTask)
			adminJobs.DELETE("/extract-links/:id", importQueueHandler.DeleteExtractionTask)
		}

		// Admin - Application stats
		adminApplications := v1.Group("/admin/applications")
		adminApplications.Use(authMiddleware, adminMiddleware)
		{
			adminApplications.GET("/stats", adminJobHandler.GetApplicationStats)
		}

		// Admin - Category management
		adminCategories := v1.Group("/admin/categories")
		adminCategories.Use(authMiddleware, adminMiddleware)
		{
			adminCategories.GET("", adminJobHandler.GetCategories)
			adminCategories.POST("", adminJobHandler.CreateCategory)
			adminCategories.GET("/:id", adminJobHandler.GetCategoryByID)
			adminCategories.PUT("/:id", adminJobHandler.UpdateCategory)
			adminCategories.DELETE("/:id", adminJobHandler.DeleteCategory)
			adminCategories.POST("/reorder", adminJobHandler.ReorderCategories)
		}

		// ==================== Profile Routes ====================
		// Public profile routes
		profiles := v1.Group("/profiles")
		{
			profiles.GET("", profileHandler.GetPublicProfiles) // List all public profiles
		}

		// Protected profile routes
		profileProtected := v1.Group("/profile")
		profileProtected.Use(authMiddleware)
		{
			// Profile CRUD
			profileProtected.GET("", profileHandler.GetMyProfile)
			profileProtected.POST("", profileHandler.CreateProfile)
			profileProtected.PUT("", profileHandler.UpdateProfile)
			profileProtected.DELETE("", profileHandler.DeleteProfile)

			// Profile management
			profileProtected.GET("/completeness", profileHandler.GetProfileCompleteness)
			profileProtected.PUT("/visibility", profileHandler.UpdateVisibility)

			// Avatar management
			profileProtected.POST("/avatar", profileHandler.UploadAvatar)
			profileProtected.DELETE("/avatar", profileHandler.DeleteAvatar)
		}

		// View user profile by ID (protected)
		v1.GET("/profiles/:user_id", authMiddleware, profileHandler.GetProfileByUserID)

		// ==================== Public Company Routes ====================
		publicCompanies := v1.Group("/companies")
		{
			publicCompanies.GET("", publicCompanyHandler.ListCompanies)
			publicCompanies.GET("/featured", publicCompanyHandler.GetFeaturedCompanies)
			publicCompanies.GET("/industries", publicCompanyHandler.GetIndustries)
			publicCompanies.GET("/search", publicCompanyHandler.SearchCompanies)
			publicCompanies.GET("/:slug", publicCompanyHandler.GetCompanyBySlug)
			publicCompanies.GET("/:slug/reviews", publicCompanyHandler.GetCompanyReviews)
			publicCompanies.GET("/:slug/reviews/analytics", publicCompanyHandler.GetCompanyReviewAnalytics)
		}

		// ==================== Job Seeker Company Routes ====================
		jobSeekerCompanies := v1.Group("/jobseeker/companies")
		jobSeekerCompanies.Use(authMiddleware, middleware.JobSeekerOnly())
		{
			// Follow/Unfollow
			jobSeekerCompanies.POST("/:company_id/follow", jobSeekerCompanyHandler.FollowCompany)
			jobSeekerCompanies.DELETE("/:company_id/unfollow", jobSeekerCompanyHandler.UnfollowCompany)
			jobSeekerCompanies.GET("/:company_id/following", jobSeekerCompanyHandler.IsFollowing)
			jobSeekerCompanies.PUT("/:company_id/notifications", jobSeekerCompanyHandler.UpdateNotifications)
			jobSeekerCompanies.GET("/following", jobSeekerCompanyHandler.GetFollowingCompanies)

			// Reviews
			jobSeekerCompanies.POST("/:company_id/reviews", jobSeekerCompanyHandler.CreateReview)
			jobSeekerCompanies.GET("/:company_id/reviews/me", jobSeekerCompanyHandler.GetMyReview)
		}

		// Job seeker reviews management
		jobSeekerReviews := v1.Group("/jobseeker/reviews")
		jobSeekerReviews.Use(authMiddleware, middleware.JobSeekerOnly())
		{
			jobSeekerReviews.PUT("/:review_id", jobSeekerCompanyHandler.UpdateReview)
			jobSeekerReviews.DELETE("/:review_id", jobSeekerCompanyHandler.DeleteReview)
		}

		// ==================== Employer Company Routes ====================
		employerCompany := v1.Group("/employer/company")
		employerCompany.Use(authMiddleware, middleware.EmployerOnly())
		{
			// Company CRUD
			employerCompany.POST("", employerCompanyHandler.CreateCompany)
			employerCompany.GET("", companyMiddleware.HasUserCompany(), employerCompanyHandler.GetMyCompany)
			employerCompany.PUT("", companyMiddleware.HasUserCompany(), companyMiddleware.CanEditCompany(), employerCompanyHandler.UpdateCompany)
			employerCompany.DELETE("", companyMiddleware.HasUserCompany(), companyMiddleware.IsCompanyOwner(), employerCompanyHandler.DeleteCompany)

			// Logo & Cover
			employerCompany.POST("/logo", companyMiddleware.HasUserCompany(), companyMiddleware.CanEditCompany(), employerCompanyHandler.UploadLogo)
			employerCompany.POST("/cover", companyMiddleware.HasUserCompany(), companyMiddleware.CanEditCompany(), employerCompanyHandler.UploadCoverImage)

			// Stats
			employerCompany.GET("/stats", companyMiddleware.HasUserCompany(), employerCompanyHandler.GetCompanyStats)

			// Team Management
			employerCompany.GET("/team", companyMiddleware.HasUserCompany(), employerCompanyHandler.GetTeamMembers)
			employerCompany.PUT("/team/:id/role", companyMiddleware.HasUserCompany(), companyMiddleware.CanManageTeam(), employerCompanyHandler.UpdateTeamMemberRole)
			employerCompany.DELETE("/team/:id", companyMiddleware.HasUserCompany(), companyMiddleware.CanManageTeam(), employerCompanyHandler.RemoveTeamMember)
			employerCompany.POST("/team/transfer-ownership", companyMiddleware.HasUserCompany(), companyMiddleware.IsCompanyOwner(), employerCompanyHandler.TransferOwnership)

			// Locations
			employerCompany.GET("/locations", companyMiddleware.HasUserCompany(), employerCompanyHandler.GetLocations)
			employerCompany.POST("/locations", companyMiddleware.HasUserCompany(), companyMiddleware.CanEditCompany(), employerCompanyHandler.CreateLocation)
			employerCompany.PUT("/locations/:id", companyMiddleware.HasUserCompany(), companyMiddleware.CanEditCompany(), employerCompanyHandler.UpdateLocation)
			employerCompany.DELETE("/locations/:id", companyMiddleware.HasUserCompany(), companyMiddleware.CanEditCompany(), employerCompanyHandler.DeleteLocation)

			// Benefits
			employerCompany.GET("/benefits", companyMiddleware.HasUserCompany(), employerCompanyHandler.GetBenefits)
			employerCompany.POST("/benefits", companyMiddleware.HasUserCompany(), companyMiddleware.CanEditCompany(), employerCompanyHandler.CreateBenefit)
			employerCompany.PUT("/benefits/:id", companyMiddleware.HasUserCompany(), companyMiddleware.CanEditCompany(), employerCompanyHandler.UpdateBenefit)
			employerCompany.DELETE("/benefits/:id", companyMiddleware.HasUserCompany(), companyMiddleware.CanEditCompany(), employerCompanyHandler.DeleteBenefit)

			// Media
			employerCompany.GET("/media", companyMiddleware.HasUserCompany(), employerCompanyHandler.GetMedia)
			employerCompany.POST("/media/images", companyMiddleware.HasUserCompany(), companyMiddleware.CanEditCompany(), employerCompanyHandler.UploadImage)
			employerCompany.POST("/media/videos", companyMiddleware.HasUserCompany(), companyMiddleware.CanEditCompany(), employerCompanyHandler.AddVideo)
			employerCompany.PUT("/media/:id", companyMiddleware.HasUserCompany(), companyMiddleware.CanEditCompany(), employerCompanyHandler.UpdateMedia)
			employerCompany.DELETE("/media/:id", companyMiddleware.HasUserCompany(), companyMiddleware.CanEditCompany(), employerCompanyHandler.DeleteMedia)

			// Reviews
			employerCompany.GET("/reviews", companyMiddleware.HasUserCompany(), employerCompanyHandler.GetCompanyReviews)
			employerCompany.POST("/reviews/:id/respond", companyMiddleware.HasUserCompany(), companyMiddleware.IsTeamMember(), employerCompanyHandler.AddCompanyResponse)

			// Followers
			employerCompany.GET("/followers", companyMiddleware.HasUserCompany(), employerCompanyHandler.GetFollowers)

			// Invitations
			employerCompany.GET("/invitations", companyMiddleware.HasUserCompany(), companyMiddleware.CanManageTeam(), invitationHandler.GetCompanyInvitations)
			employerCompany.POST("/invitations", companyMiddleware.HasUserCompany(), companyMiddleware.CanManageTeam(), invitationHandler.CreateInvitation)
			employerCompany.DELETE("/invitations/:id", companyMiddleware.HasUserCompany(), companyMiddleware.CanManageTeam(), invitationHandler.CancelInvitation)
			employerCompany.POST("/invitations/:id/resend", companyMiddleware.HasUserCompany(), companyMiddleware.CanManageTeam(), invitationHandler.ResendInvitation)
		}

		// ==================== Invitation Routes ====================
		invitations := v1.Group("/invitations")
		{
			invitations.GET("/validate/:token", invitationHandler.ValidateInvitation)
		}

		invitationsProtected := v1.Group("/invitations")
		invitationsProtected.Use(authMiddleware)
		{
			invitationsProtected.GET("/me", invitationHandler.GetMyInvitations)
			invitationsProtected.POST("/accept/:token", invitationHandler.AcceptInvitation)
			invitationsProtected.POST("/decline/:token", invitationHandler.DeclineInvitation)
		}

		// ==================== Admin Company Routes ====================
		adminCompanies := v1.Group("/admin/companies")
		adminCompanies.Use(authMiddleware, adminMiddleware)
		{
			// List all companies
			adminCompanies.GET("", adminCompanyHandler.GetAllCompanies)

			// Verification
			adminCompanies.GET("/pending", adminCompanyHandler.GetPendingVerification)

			// Single company CRUD (must be after /pending to avoid conflict)
			adminCompanies.GET("/:id", adminCompanyHandler.GetCompanyByID)
			adminCompanies.PUT("/:id", adminCompanyHandler.UpdateCompanyAdmin)
			adminCompanies.DELETE("/:id", adminCompanyHandler.DeleteCompany)

			// Company actions (using company_id param for clarity)
			adminCompanies.POST("/:id/verify", adminCompanyHandler.VerifyCompany)
			adminCompanies.POST("/:id/unverify", adminCompanyHandler.UnverifyCompany)
			adminCompanies.POST("/:id/reject", adminCompanyHandler.RejectCompany)

			// Feature
			adminCompanies.POST("/:id/feature", adminCompanyHandler.FeatureCompany)
			adminCompanies.POST("/:id/unfeature", adminCompanyHandler.UnfeatureCompany)

			// Status
			adminCompanies.POST("/:id/suspend", adminCompanyHandler.SuspendCompany)
			adminCompanies.POST("/:id/activate", adminCompanyHandler.ActivateCompany)
		}

		// Admin Review Moderation
		adminReviews := v1.Group("/admin/reviews")
		adminReviews.Use(authMiddleware, adminMiddleware)
		{
			// List all reviews
			adminReviews.GET("", adminCompanyHandler.GetAllReviews)
			adminReviews.GET("/pending", adminCompanyHandler.GetPendingReviews)

			// Single review operations (must be after /pending to avoid conflict)
			adminReviews.GET("/:id", adminCompanyHandler.GetReviewByID)
			adminReviews.DELETE("/:id", adminCompanyHandler.DeleteReviewAdmin)
			adminReviews.POST("/:id/approve", adminCompanyHandler.ApproveReview)
			adminReviews.POST("/:id/reject", adminCompanyHandler.RejectReview)
		}

		// Admin Company Analytics
		adminCompanyAnalytics := v1.Group("/admin/analytics")
		adminCompanyAnalytics.Use(authMiddleware, adminMiddleware)
		{
			adminCompanyAnalytics.GET("/platform", adminCompanyHandler.GetPlatformStats)
			adminCompanyAnalytics.GET("/industries", adminCompanyHandler.GetIndustryStats)
			adminCompanyAnalytics.GET("/locations", adminCompanyHandler.GetLocationStats)
		}

		// ==================== Public Blog Routes ====================
		blogs := v1.Group("/blogs")
		{
			blogs.GET("", blogHandler.ListBlogs)              // List published blogs (paginated)
			blogs.GET("/:id", blogHandler.GetBlog)            // Get blog by ID (published only)
			blogs.GET("/slug/:slug", blogHandler.GetBlogBySlug) // Get blog by slug (published only)
		}

		// Public blog categories and tags
		v1.GET("/blog-categories", blogHandler.GetCategories)
		v1.GET("/blog-tags", blogHandler.GetTags)

		// ==================== Admin Blog Routes ====================
		adminBlogs := v1.Group("/admin/blogs")
		adminBlogs.Use(authMiddleware, adminMiddleware)
		{
			adminBlogs.POST("", blogHandler.CreateBlog)
			adminBlogs.GET("", blogHandler.AdminListBlogs)
			adminBlogs.GET("/:id", blogHandler.AdminGetBlog)
			adminBlogs.PUT("/:id", blogHandler.UpdateBlog)
			adminBlogs.DELETE("/:id", blogHandler.DeleteBlog)
			adminBlogs.POST("/:id/publish", blogHandler.PublishBlog)
			adminBlogs.POST("/:id/unpublish", blogHandler.UnpublishBlog)
		}

		// Admin blog categories management
		adminBlogCategories := v1.Group("/admin/blog-categories")
		adminBlogCategories.Use(authMiddleware, adminMiddleware)
		{
			adminBlogCategories.POST("", blogHandler.CreateCategory)
			adminBlogCategories.PUT("/:id", blogHandler.UpdateCategory)
			adminBlogCategories.DELETE("/:id", blogHandler.DeleteCategory)
		}

		// Admin blog tags management
		adminBlogTags := v1.Group("/admin/blog-tags")
		adminBlogTags.Use(authMiddleware, adminMiddleware)
		{
			adminBlogTags.POST("", blogHandler.CreateTag)
			adminBlogTags.DELETE("/:id", blogHandler.DeleteTag)
		}
	}

	return r
}
