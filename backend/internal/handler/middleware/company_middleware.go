package middleware

import (
	"job-platform/internal/domain"
	"job-platform/internal/service"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// CompanyMiddleware handles company-related middleware
type CompanyMiddleware struct {
	companyService *service.CompanyService
	teamService    *service.TeamService
}

// NewCompanyMiddleware creates a new company middleware
func NewCompanyMiddleware(
	companyService *service.CompanyService,
	teamService *service.TeamService,
) *CompanyMiddleware {
	return &CompanyMiddleware{
		companyService: companyService,
		teamService:    teamService,
	}
}

// CompanyExists checks if a company exists and adds it to context
func (m *CompanyMiddleware) CompanyExists() gin.HandlerFunc {
	return func(c *gin.Context) {
		companyID := c.Param("company_id")
		if companyID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "company_id is required"})
			c.Abort()
			return
		}

		id, err := uuid.Parse(companyID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid company_id"})
			c.Abort()
			return
		}

		company, err := m.companyService.GetCompanyByID(id)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": domain.ErrCompanyNotFound.Error()})
			c.Abort()
			return
		}

		c.Set("company", company)
		c.Set("company_id", id)
		c.Next()
	}
}

// CompanyExistsBySlug checks if a company exists by slug and adds it to context
func (m *CompanyMiddleware) CompanyExistsBySlug() gin.HandlerFunc {
	return func(c *gin.Context) {
		slug := c.Param("slug")
		if slug == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "slug is required"})
			c.Abort()
			return
		}

		company, err := m.companyService.GetCompanyBySlug(slug)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": domain.ErrCompanyNotFound.Error()})
			c.Abort()
			return
		}

		c.Set("company", company)
		c.Set("company_id", company.ID)
		c.Next()
	}
}

// IsCompanyOwner checks if the authenticated user is the company owner
func (m *CompanyMiddleware) IsCompanyOwner() gin.HandlerFunc {
	return func(c *gin.Context) {
		// user_id is set as uuid.UUID by AuthMiddleware, not as string
		userIDVal, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
			c.Abort()
			return
		}

		uid, ok := userIDVal.(uuid.UUID)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user_id"})
			c.Abort()
			return
		}

		companyID, exists := c.Get("company_id")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "company_id not found in context"})
			c.Abort()
			return
		}

		cid := companyID.(uuid.UUID)
		isOwner, err := m.teamService.IsOwner(cid, uid)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check ownership"})
			c.Abort()
			return
		}

		if !isOwner {
			c.JSON(http.StatusForbidden, gin.H{"error": domain.ErrNotCompanyOwner.Error()})
			c.Abort()
			return
		}

		c.Next()
	}
}

// IsTeamMember checks if the authenticated user is a team member
func (m *CompanyMiddleware) IsTeamMember() gin.HandlerFunc {
	return func(c *gin.Context) {
		// user_id is set as uuid.UUID by AuthMiddleware, not as string
		userIDVal, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
			c.Abort()
			return
		}

		uid, ok := userIDVal.(uuid.UUID)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user_id"})
			c.Abort()
			return
		}

		companyID, exists := c.Get("company_id")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "company_id not found in context"})
			c.Abort()
			return
		}

		cid := companyID.(uuid.UUID)
		isMember, err := m.teamService.IsTeamMember(cid, uid)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check team membership"})
			c.Abort()
			return
		}

		if !isMember {
			c.JSON(http.StatusForbidden, gin.H{"error": domain.ErrInsufficientPermissions.Error()})
			c.Abort()
			return
		}

		// Get team member and add to context
		member, err := m.teamService.GetTeamMemberByCompanyAndUser(cid, uid)
		if err == nil {
			c.Set("team_member", member)
		}

		c.Next()
	}
}

// CanManageTeam checks if the user can manage team members
func (m *CompanyMiddleware) CanManageTeam() gin.HandlerFunc {
	return func(c *gin.Context) {
		// user_id is set as uuid.UUID by AuthMiddleware, not as string
		userIDVal, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
			c.Abort()
			return
		}

		uid, ok := userIDVal.(uuid.UUID)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user_id"})
			c.Abort()
			return
		}

		companyID, exists := c.Get("company_id")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "company_id not found in context"})
			c.Abort()
			return
		}

		cid := companyID.(uuid.UUID)
		canManage, err := m.teamService.CanManageTeam(cid, uid)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check permissions"})
			c.Abort()
			return
		}

		if !canManage {
			c.JSON(http.StatusForbidden, gin.H{"error": domain.ErrInsufficientPermissions.Error()})
			c.Abort()
			return
		}

		c.Next()
	}
}

// CanEditCompany checks if the user can edit company profile
func (m *CompanyMiddleware) CanEditCompany() gin.HandlerFunc {
	return func(c *gin.Context) {
		// user_id is set as uuid.UUID by AuthMiddleware, not as string
		userIDVal, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
			c.Abort()
			return
		}

		uid, ok := userIDVal.(uuid.UUID)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user_id"})
			c.Abort()
			return
		}

		companyID, exists := c.Get("company_id")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "company_id not found in context"})
			c.Abort()
			return
		}

		cid := companyID.(uuid.UUID)
		canEdit, err := m.teamService.CanEditCompany(cid, uid)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check permissions"})
			c.Abort()
			return
		}

		if !canEdit {
			c.JSON(http.StatusForbidden, gin.H{"error": domain.ErrInsufficientPermissions.Error()})
			c.Abort()
			return
		}

		c.Next()
	}
}

// CanPostJobs checks if the user can post jobs for the company
func (m *CompanyMiddleware) CanPostJobs() gin.HandlerFunc {
	return func(c *gin.Context) {
		// user_id is set as uuid.UUID by AuthMiddleware, not as string
		userIDVal, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
			c.Abort()
			return
		}

		uid, ok := userIDVal.(uuid.UUID)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user_id"})
			c.Abort()
			return
		}

		companyID, exists := c.Get("company_id")
		if !exists {
			c.JSON(http.StatusBadRequest, gin.H{"error": "company_id not found in context"})
			c.Abort()
			return
		}

		cid := companyID.(uuid.UUID)
		canPost, err := m.teamService.CanPostJobs(cid, uid)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check permissions"})
			c.Abort()
			return
		}

		if !canPost {
			c.JSON(http.StatusForbidden, gin.H{"error": domain.ErrInsufficientPermissions.Error()})
			c.Abort()
			return
		}

		c.Next()
	}
}

// HasUserCompany checks if the authenticated user has a company
func (m *CompanyMiddleware) HasUserCompany() gin.HandlerFunc {
	return func(c *gin.Context) {
		// user_id is set as uuid.UUID by AuthMiddleware, not as string
		userIDVal, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
			c.Abort()
			return
		}

		uid, ok := userIDVal.(uuid.UUID)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user_id"})
			c.Abort()
			return
		}

		company, err := m.companyService.GetUserCompany(uid)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": domain.ErrCompanyNotFound.Error()})
			c.Abort()
			return
		}

		c.Set("company", company)
		c.Set("company_id", company.ID)
		c.Next()
	}
}
