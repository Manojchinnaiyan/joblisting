package handler

import (
	"net/http"
	"strconv"

	"job-platform/internal/domain"
	"job-platform/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// BlogHandler handles blog-related HTTP requests
type BlogHandler struct {
	blogService *service.BlogService
}

// NewBlogHandler creates a new blog handler
func NewBlogHandler(blogService *service.BlogService) *BlogHandler {
	return &BlogHandler{blogService: blogService}
}

// ============= Admin Endpoints =============

// CreateBlog creates a new blog post (admin only)
func (h *BlogHandler) CreateBlog(c *gin.Context) {
	var req domain.CreateBlogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get author ID from context (set by auth middleware)
	userIDVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	authorID, ok := userIDVal.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	blog, err := h.blogService.CreateBlog(req, authorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, blog)
}

// UpdateBlog updates a blog post (admin only)
func (h *BlogHandler) UpdateBlog(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid blog ID"})
		return
	}

	var req domain.UpdateBlogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	blog, err := h.blogService.UpdateBlog(id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, blog)
}

// DeleteBlog deletes a blog post (admin only)
func (h *BlogHandler) DeleteBlog(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid blog ID"})
		return
	}

	if err := h.blogService.DeleteBlog(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// PublishBlog publishes a blog post (admin only)
func (h *BlogHandler) PublishBlog(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid blog ID"})
		return
	}

	if err := h.blogService.PublishBlog(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	blog, err := h.blogService.GetBlog(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, blog)
}

// UnpublishBlog unpublishes a blog post (admin only)
func (h *BlogHandler) UnpublishBlog(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid blog ID"})
		return
	}

	if err := h.blogService.UnpublishBlog(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	blog, err := h.blogService.GetBlog(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, blog)
}

// AdminListBlogs lists all blogs including drafts (admin only)
func (h *BlogHandler) AdminListBlogs(c *gin.Context) {
	filters := h.parseFilters(c)

	response, err := h.blogService.ListBlogs(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// AdminGetBlog gets a blog by ID (admin only) - includes drafts
func (h *BlogHandler) AdminGetBlog(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid blog ID"})
		return
	}

	blog, err := h.blogService.GetBlog(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "blog not found"})
		return
	}

	c.JSON(http.StatusOK, blog)
}

// ============= Category Management (Admin) =============

// CreateCategory creates a new blog category (admin only)
func (h *BlogHandler) CreateCategory(c *gin.Context) {
	var req domain.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category, err := h.blogService.CreateCategory(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, category)
}

// UpdateCategory updates a blog category (admin only)
func (h *BlogHandler) UpdateCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	var req domain.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category, err := h.blogService.UpdateCategory(id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, category)
}

// DeleteCategory deletes a blog category (admin only)
func (h *BlogHandler) DeleteCategory(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid category ID"})
		return
	}

	if err := h.blogService.DeleteCategory(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// ============= Tag Management (Admin) =============

// CreateTag creates a new blog tag (admin only)
func (h *BlogHandler) CreateTag(c *gin.Context) {
	var req domain.CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tag, err := h.blogService.CreateTag(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tag)
}

// DeleteTag deletes a blog tag (admin only)
func (h *BlogHandler) DeleteTag(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tag ID"})
		return
	}

	if err := h.blogService.DeleteTag(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

// ============= Public Endpoints =============

// GetBlog gets a blog by ID (public - published only)
func (h *BlogHandler) GetBlog(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid blog ID"})
		return
	}

	blog, err := h.blogService.GetBlog(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "blog not found"})
		return
	}

	// Only show published blogs to public
	if blog.Status != domain.BlogStatusPublished {
		c.JSON(http.StatusNotFound, gin.H{"error": "blog not found"})
		return
	}

	// Increment view count
	_ = h.blogService.IncrementViewCount(id)

	c.JSON(http.StatusOK, blog)
}

// GetBlogBySlug gets a blog by slug (public - published only)
func (h *BlogHandler) GetBlogBySlug(c *gin.Context) {
	slug := c.Param("slug")

	blog, err := h.blogService.GetBlogBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "blog not found"})
		return
	}

	// Only show published blogs to public
	if blog.Status != domain.BlogStatusPublished {
		c.JSON(http.StatusNotFound, gin.H{"error": "blog not found"})
		return
	}

	// Increment view count
	_ = h.blogService.IncrementViewCount(blog.ID)

	c.JSON(http.StatusOK, blog)
}

// ListBlogs lists published blogs only (public)
func (h *BlogHandler) ListBlogs(c *gin.Context) {
	filters := h.parseFilters(c)

	// Force status filter to "published" only for public access
	published := domain.BlogStatusPublished
	filters.Status = &published

	response, err := h.blogService.ListBlogs(filters)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetCategories lists all blog categories (public)
func (h *BlogHandler) GetCategories(c *gin.Context) {
	categories, err := h.blogService.GetCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, categories)
}

// GetTags lists all blog tags (public)
func (h *BlogHandler) GetTags(c *gin.Context) {
	tags, err := h.blogService.GetTags()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tags)
}

// ============= Helper Methods =============

// parseFilters parses query parameters into BlogFilters
func (h *BlogHandler) parseFilters(c *gin.Context) domain.BlogFilters {
	filters := domain.BlogFilters{}

	// Parse page
	if pageStr := c.Query("page"); pageStr != "" {
		if page, err := strconv.Atoi(pageStr); err == nil && page > 0 {
			filters.Page = page
		}
	}
	if filters.Page == 0 {
		filters.Page = 1
	}

	// Parse page_size
	if pageSizeStr := c.Query("page_size"); pageSizeStr != "" {
		if pageSize, err := strconv.Atoi(pageSizeStr); err == nil && pageSize > 0 {
			filters.PageSize = pageSize
		}
	}
	if filters.PageSize == 0 {
		filters.PageSize = 10
	}

	// Parse status
	if statusStr := c.Query("status"); statusStr != "" {
		status := domain.BlogStatus(statusStr)
		filters.Status = &status
	}

	// Parse category_id
	if categoryIDStr := c.Query("category_id"); categoryIDStr != "" {
		if categoryID, err := uuid.Parse(categoryIDStr); err == nil {
			filters.CategoryID = &categoryID
		}
	}

	// Parse search
	if search := c.Query("search"); search != "" {
		filters.Search = &search
	}

	// Parse sort_by
	if sortBy := c.Query("sort_by"); sortBy != "" {
		filters.SortBy = sortBy
	}

	// Parse sort_order
	if sortOrder := c.Query("sort_order"); sortOrder != "" {
		filters.SortOrder = sortOrder
	}

	return filters
}
