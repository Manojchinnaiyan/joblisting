package middleware

import (
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORS() gin.HandlerFunc {
	// Default allowed origins
	allowedOrigins := []string{
		"http://localhost:3000",
		"http://localhost:5173",
	}

	// Add FRONTEND_URL from environment if set
	if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
		allowedOrigins = append(allowedOrigins, frontendURL)
	}

	// Add ADMIN_FRONTEND_URL from environment if set
	if adminURL := os.Getenv("ADMIN_FRONTEND_URL"); adminURL != "" {
		allowedOrigins = append(allowedOrigins, adminURL)
	}

	// Add any additional CORS origins from CORS_ORIGINS env var (comma-separated)
	if corsOrigins := os.Getenv("CORS_ORIGINS"); corsOrigins != "" {
		origins := strings.Split(corsOrigins, ",")
		for _, origin := range origins {
			origin = strings.TrimSpace(origin)
			if origin != "" {
				allowedOrigins = append(allowedOrigins, origin)
			}
		}
	}

	return cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	})
}
