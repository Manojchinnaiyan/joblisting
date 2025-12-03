package middleware

import (
	"job-platform/internal/domain"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AuthMiddleware validates JWT tokens
func AuthMiddleware(tokenService *service.TokenService, userService *service.UserService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Unauthorized(c, domain.ErrUnauthorized)
			c.Abort()
			return
		}

		// Extract token (format: "Bearer <token>")
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Unauthorized(c, domain.ErrUnauthorized)
			c.Abort()
			return
		}

		tokenStr := parts[1]

		// Validate token
		claims, err := tokenService.ValidateAccessToken(tokenStr)
		if err != nil {
			response.Unauthorized(c, err)
			c.Abort()
			return
		}

		// Get user from database to check current status
		user, err := userService.GetByID(claims.UserID)
		if err != nil {
			response.Unauthorized(c, domain.ErrUserNotFound)
			c.Abort()
			return
		}

		// Check if user is active
		if user.Status != domain.StatusActive {
			response.Unauthorized(c, domain.ErrAccountSuspended)
			c.Abort()
			return
		}

		// Check if email is verified (except for resend verification endpoint)
		if !user.EmailVerified && !strings.Contains(c.Request.URL.Path, "resend-verification") {
			response.Unauthorized(c, domain.ErrEmailNotVerified)
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("user_id", user.ID)
		c.Set("user_email", user.Email)
		c.Set("user_role", user.Role)
		c.Set("user", user)

		c.Next()
	}
}

// GetUserFromContext retrieves user from gin context
func GetUserFromContext(c *gin.Context) (*domain.User, error) {
	userVal, exists := c.Get("user")
	if !exists {
		return nil, domain.ErrUnauthorized
	}

	user, ok := userVal.(*domain.User)
	if !ok {
		return nil, domain.ErrUnauthorized
	}

	return user, nil
}

// GetUserIDFromContext retrieves user ID from gin context
func GetUserIDFromContext(c *gin.Context) (uuid.UUID, error) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, domain.ErrUnauthorized
	}

	userID, ok := userIDVal.(uuid.UUID)
	if !ok {
		return uuid.Nil, domain.ErrUnauthorized
	}

	return userID, nil
}
