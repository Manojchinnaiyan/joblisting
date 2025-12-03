package middleware

import (
	"job-platform/internal/domain"
	"job-platform/internal/service"
	"job-platform/internal/util/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// EmployerOnly ensures only employers can access the endpoint
func EmployerOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, err := GetUserFromContext(c)
		if err != nil {
			response.Unauthorized(c, err)
			c.Abort()
			return
		}

		if user.Role != domain.RoleEmployer {
			response.Forbidden(c, domain.ErrEmployerOnly)
			c.Abort()
			return
		}

		c.Next()
	}
}

// JobSeekerOnly ensures only job seekers can access the endpoint
func JobSeekerOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, err := GetUserFromContext(c)
		if err != nil {
			response.Unauthorized(c, err)
			c.Abort()
			return
		}

		if user.Role != domain.RoleJobSeeker {
			response.Forbidden(c, domain.ErrJobSeekerOnly)
			c.Abort()
			return
		}

		c.Next()
	}
}

// AdminOnly ensures only admins can access the endpoint
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, err := GetUserFromContext(c)
		if err != nil {
			response.Unauthorized(c, err)
			c.Abort()
			return
		}

		if user.Role != domain.RoleAdmin {
			response.Forbidden(c, domain.ErrAdminOnly)
			c.Abort()
			return
		}

		c.Next()
	}
}

// JobOwnerOnly ensures only the job owner (employer) can access the job
func JobOwnerOnly(jobService *service.JobService) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, err := GetUserFromContext(c)
		if err != nil {
			response.Unauthorized(c, err)
			c.Abort()
			return
		}

		// Check if user is employer
		if user.Role != domain.RoleEmployer {
			response.Forbidden(c, domain.ErrEmployerOnly)
			c.Abort()
			return
		}

		// Get job ID from URL parameter
		jobIDStr := c.Param("id")
		jobID, err := uuid.Parse(jobIDStr)
		if err != nil {
			response.BadRequest(c, domain.ErrInvalidJobID)
			c.Abort()
			return
		}

		// Get job
		job, err := jobService.GetJobByID(jobID)
		if err != nil {
			if err == domain.ErrJobNotFound {
				response.NotFound(c, err)
				c.Abort()
				return
			}
			response.InternalError(c, err)
			c.Abort()
			return
		}

		// Verify ownership
		if job.EmployerID != user.ID {
			response.Forbidden(c, domain.ErrJobNotOwnedByEmployer)
			c.Abort()
			return
		}

		// Store job in context for handlers to use (avoiding duplicate queries)
		c.Set("job", job)

		c.Next()
	}
}

// ApplicationAccessMiddleware ensures user has access to the application
// - Applicant can view their own application
// - Employer can view applications for their jobs
// - Admin can view all applications
func ApplicationAccessMiddleware(applicationService *service.ApplicationService, jobService *service.JobService) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, err := GetUserFromContext(c)
		if err != nil {
			response.Unauthorized(c, err)
			c.Abort()
			return
		}

		// Get application ID from URL parameter
		appIDStr := c.Param("id")
		appID, err := uuid.Parse(appIDStr)
		if err != nil {
			response.BadRequest(c, domain.ErrInvalidID)
			c.Abort()
			return
		}

		// Get application (with user access check)
		application, err := applicationService.GetApplicationByID(appID, user.ID)
		if err != nil {
			if err == domain.ErrApplicationNotFound {
				response.NotFound(c, err)
				c.Abort()
				return
			}
			response.InternalError(c, err)
			c.Abort()
			return
		}

		// Check access based on role
		switch user.Role {
		case domain.RoleAdmin:
			// Admin can access all applications
			break

		case domain.RoleJobSeeker:
			// Job seeker can only access their own applications
			if application.ApplicantID != user.ID {
				response.Forbidden(c, domain.ErrApplicationNotFound)
				c.Abort()
				return
			}

		case domain.RoleEmployer:
			// Employer can only access applications for their jobs
			if application.Job.EmployerID != user.ID {
				response.Forbidden(c, domain.ErrApplicationNotFound)
				c.Abort()
				return
			}

		default:
			response.Forbidden(c, domain.ErrForbidden)
			c.Abort()
			return
		}

		// Store application in context for handlers to use (avoiding duplicate queries)
		c.Set("application", application)

		c.Next()
	}
}

// JobApplicationAccessMiddleware ensures employer owns the job for application management
func JobApplicationAccessMiddleware(jobService *service.JobService) gin.HandlerFunc {
	return func(c *gin.Context) {
		user, err := GetUserFromContext(c)
		if err != nil {
			response.Unauthorized(c, err)
			c.Abort()
			return
		}

		// Check if user is employer
		if user.Role != domain.RoleEmployer {
			response.Forbidden(c, domain.ErrEmployerOnly)
			c.Abort()
			return
		}

		// Get job ID from URL parameter
		jobIDStr := c.Param("id")
		jobID, err := uuid.Parse(jobIDStr)
		if err != nil {
			response.BadRequest(c, domain.ErrInvalidJobID)
			c.Abort()
			return
		}

		// Get job
		job, err := jobService.GetJobByID(jobID)
		if err != nil {
			if err == domain.ErrJobNotFound {
				response.NotFound(c, err)
				c.Abort()
				return
			}
			response.InternalError(c, err)
			c.Abort()
			return
		}

		// Verify ownership
		if job.EmployerID != user.ID {
			response.Forbidden(c, domain.ErrJobNotOwnedByEmployer)
			c.Abort()
			return
		}

		// Store job in context
		c.Set("job", job)

		c.Next()
	}
}

// GetJobFromContext retrieves job from gin context (set by middleware)
func GetJobFromContext(c *gin.Context) (*domain.Job, error) {
	jobVal, exists := c.Get("job")
	if !exists {
		return nil, domain.ErrJobNotFound
	}

	job, ok := jobVal.(*domain.Job)
	if !ok {
		return nil, domain.ErrJobNotFound
	}

	return job, nil
}

// GetApplicationFromContext retrieves application from gin context (set by middleware)
func GetApplicationFromContext(c *gin.Context) (*domain.Application, error) {
	appVal, exists := c.Get("application")
	if !exists {
		return nil, domain.ErrApplicationNotFound
	}

	application, ok := appVal.(*domain.Application)
	if !ok {
		return nil, domain.ErrApplicationNotFound
	}

	return application, nil
}
