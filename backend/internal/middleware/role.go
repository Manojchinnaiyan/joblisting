package middleware

import (
	"job-platform/internal/domain"
	"job-platform/internal/util/response"

	"github.com/gin-gonic/gin"
)

// RoleMiddleware checks if user has required role
func RoleMiddleware(allowedRoles ...domain.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user role from context (set by AuthMiddleware)
		roleVal, exists := c.Get("user_role")
		if !exists {
			response.Forbidden(c, domain.ErrForbidden)
			c.Abort()
			return
		}

		userRole, ok := roleVal.(domain.UserRole)
		if !ok {
			response.Forbidden(c, domain.ErrForbidden)
			c.Abort()
			return
		}

		// Check if user role is in allowed roles
		hasPermission := false
		for _, role := range allowedRoles {
			if userRole == role {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			response.Forbidden(c, domain.ErrForbidden)
			c.Abort()
			return
		}

		c.Next()
	}
}

// AdminMiddleware ensures user is an admin
func AdminMiddleware() gin.HandlerFunc {
	return RoleMiddleware(domain.RoleAdmin)
}

// EmployerMiddleware ensures user is an employer
func EmployerMiddleware() gin.HandlerFunc {
	return RoleMiddleware(domain.RoleEmployer)
}

// JobSeekerMiddleware ensures user is a job seeker
func JobSeekerMiddleware() gin.HandlerFunc {
	return RoleMiddleware(domain.RoleJobSeeker)
}

// EmployerOrAdminMiddleware allows both employers and admins
func EmployerOrAdminMiddleware() gin.HandlerFunc {
	return RoleMiddleware(domain.RoleEmployer, domain.RoleAdmin)
}
