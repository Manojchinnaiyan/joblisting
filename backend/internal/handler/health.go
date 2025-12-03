package handler

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type HealthHandler struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewHealthHandler(db *gorm.DB, redis *redis.Client) *HealthHandler {
	return &HealthHandler{
		db:    db,
		redis: redis,
	}
}

type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Services  map[string]string `json:"services"`
}

func (h *HealthHandler) Check(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	services := make(map[string]string)

	// Check PostgreSQL
	sqlDB, err := h.db.DB()
	if err != nil || sqlDB.PingContext(ctx) != nil {
		services["postgres"] = "unhealthy"
	} else {
		services["postgres"] = "healthy"
	}

	// Check Redis
	if err := h.redis.Ping(ctx).Err(); err != nil {
		services["redis"] = "unhealthy"
	} else {
		services["redis"] = "healthy"
	}

	// Determine overall status
	status := "healthy"
	for _, v := range services {
		if v == "unhealthy" {
			status = "unhealthy"
			break
		}
	}

	response := HealthResponse{
		Status:    status,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Services:  services,
	}

	statusCode := http.StatusOK
	if status == "unhealthy" {
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, response)
}

func (h *HealthHandler) Readiness(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ready",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}

func (h *HealthHandler) Liveness(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "alive",
		"time":   time.Now().UTC().Format(time.RFC3339),
	})
}
