package handler

import (
	"job-platform/internal/domain"
	"job-platform/internal/middleware"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// AdminUserHandler handles admin user management endpoints
type AdminUserHandler struct {
	adminService *service.AdminService
	userService  *service.UserService
}

// NewAdminUserHandler creates a new admin user handler
func NewAdminUserHandler(
	adminService *service.AdminService,
	userService *service.UserService,
) *AdminUserHandler {
	return &AdminUserHandler{
		adminService: adminService,
		userService:  userService,
	}
}

// CreateAdminRequest represents create admin request
type CreateAdminRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	FirstName string `json:"first_name" binding:"required,min=2,max=50"`
	LastName  string `json:"last_name" binding:"required,min=2,max=50"`
}

// UpdateUserRequest represents update user request
type UpdateUserRequest struct {
	FirstName string              `json:"first_name,omitempty"`
	LastName  string              `json:"last_name,omitempty"`
	Status    *domain.UserStatus  `json:"status,omitempty"`
}

// ListUsers retrieves paginated list of users
func (h *AdminUserHandler) ListUsers(c *gin.Context) {
	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}

	// Parse filters
	filters := make(map[string]interface{})
	if role := c.Query("role"); role != "" {
		filters["role"] = role
	}
	if status := c.Query("status"); status != "" {
		filters["status"] = status
	}
	if search := c.Query("search"); search != "" {
		filters["search"] = search
	}

	// Get users
	users, total, err := h.adminService.GetAllUsers(filters, page, perPage)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Calculate total pages
	totalPages := int(total) / perPage
	if int(total)%perPage > 0 {
		totalPages++
	}

	response.Paginated(c, "Users retrieved successfully", users, response.PaginationMeta{
		CurrentPage: page,
		PerPage:     perPage,
		Total:       total,
		TotalPages:  totalPages,
	})
}

// GetUser retrieves a specific user
func (h *AdminUserHandler) GetUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidToken)
		return
	}

	user, profile, err := h.adminService.GetUserDetails(userID)
	if err != nil {
		response.NotFound(c, domain.ErrUserNotFound)
		return
	}

	response.OK(c, "User retrieved successfully", gin.H{
		"user": gin.H{
			"id":                    user.ID,
			"email":                 user.Email,
			"first_name":            user.FirstName,
			"last_name":             user.LastName,
			"role":                  user.Role,
			"status":                user.Status,
			"auth_provider":         user.AuthProvider,
			"email_verified":        user.EmailVerified,
			"email_verified_at":     user.EmailVerifiedAt,
			"two_factor_enabled":    user.TwoFactorEnabled,
			"failed_login_attempts": user.FailedLoginAttempts,
			"locked_until":          user.LockedUntil,
			"last_login_at":         user.LastLoginAt,
			"last_login_ip":         user.LastLoginIP,
			"created_at":            user.CreatedAt,
			"updated_at":            user.UpdatedAt,
		},
		"profile": profile,
	})
}

// UpdateUser updates a user
func (h *AdminUserHandler) UpdateUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidToken)
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Get user
	user, err := h.userService.GetByID(userID)
	if err != nil {
		response.NotFound(c, domain.ErrUserNotFound)
		return
	}

	// Update fields
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.Status != nil {
		user.Status = *req.Status
	}

	// Save
	if err := h.userService.Update(user); err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "User updated successfully", gin.H{
		"user": gin.H{
			"id":         user.ID,
			"email":      user.Email,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"role":       user.Role,
			"status":     user.Status,
		},
	})
}

// DeleteUser soft deletes a user
func (h *AdminUserHandler) DeleteUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidToken)
		return
	}

	// Check if trying to delete self
	currentUserID, _ := middleware.GetUserIDFromContext(c)
	if currentUserID == userID {
		response.BadRequest(c, domain.NewErrorCode("CANNOT_DELETE_SELF", "Cannot delete your own account", nil))
		return
	}

	if err := h.userService.Delete(userID); err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "User deleted successfully", nil)
}

// SuspendUser suspends a user account
func (h *AdminUserHandler) SuspendUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidToken)
		return
	}

	// Check if trying to suspend self
	currentUserID, _ := middleware.GetUserIDFromContext(c)
	if currentUserID == userID {
		response.BadRequest(c, domain.NewErrorCode("CANNOT_SUSPEND_SELF", "Cannot suspend your own account", nil))
		return
	}

	if err := h.userService.Suspend(userID); err != nil {
		response.InternalError(c, err)
		return
	}

	// Revoke all sessions
	h.adminService.RevokeSessions(userID)

	response.OK(c, "User suspended successfully", nil)
}

// ActivateUser activates a suspended user account
func (h *AdminUserHandler) ActivateUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidToken)
		return
	}

	if err := h.userService.Activate(userID); err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "User activated successfully", nil)
}

// CreateAdmin creates a new admin user
func (h *AdminUserHandler) CreateAdmin(c *gin.Context) {
	var req CreateAdminRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err)
		return
	}

	// Get current admin ID
	currentUserID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		response.Unauthorized(c, err)
		return
	}

	// Create admin
	admin, err := h.adminService.CreateAdmin(
		req.Email,
		req.Password,
		req.FirstName,
		req.LastName,
		currentUserID,
	)

	if err != nil {
		if err == domain.ErrEmailAlreadyExists {
			response.Error(c, 409, err, nil)
			return
		}
		if err == domain.ErrWeakPassword {
			response.BadRequest(c, err)
			return
		}
		response.InternalError(c, err)
		return
	}

	response.Created(c, "Admin created successfully", gin.H{
		"admin": gin.H{
			"id":         admin.ID,
			"email":      admin.Email,
			"first_name": admin.FirstName,
			"last_name":  admin.LastName,
			"role":       admin.Role,
		},
	})
}

// GetLoginHistory retrieves login history for a user
func (h *AdminUserHandler) GetLoginHistory(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidToken)
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit < 1 || limit > 100 {
		limit = 50
	}

	history, err := h.adminService.GetLoginHistory(userID, limit)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Login history retrieved successfully", gin.H{
		"history": history,
	})
}

// RevokeSessions revokes all active sessions for a user
func (h *AdminUserHandler) RevokeSessions(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		response.BadRequest(c, domain.ErrInvalidToken)
		return
	}

	if err := h.adminService.RevokeSessions(userID); err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "All sessions revoked successfully", nil)
}
