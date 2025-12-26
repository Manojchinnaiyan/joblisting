package service

import (
	"fmt"
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"time"

	"github.com/google/uuid"
	"github.com/gosimple/slug"
)

// BlogService handles blog business logic
type BlogService struct {
	blogRepo *repository.BlogRepository
}

// NewBlogService creates a new blog service
func NewBlogService(blogRepo *repository.BlogRepository) *BlogService {
	return &BlogService{blogRepo: blogRepo}
}

// CreateBlog creates a new blog post
func (s *BlogService) CreateBlog(req domain.CreateBlogRequest, authorID uuid.UUID) (*domain.Blog, error) {
	// Generate slug from title
	blogSlug := slug.Make(req.Title)

	// Check if slug exists, append timestamp if duplicate
	exists, err := s.blogRepo.SlugExists(blogSlug)
	if err != nil {
		return nil, err
	}
	if exists {
		blogSlug = fmt.Sprintf("%s-%d", blogSlug, time.Now().Unix())
	}

	blog := &domain.Blog{
		Title:           req.Title,
		Slug:            blogSlug,
		Excerpt:         req.Excerpt,
		Content:         req.Content,
		FeaturedImage:   req.FeaturedImage,
		MetaTitle:       req.MetaTitle,
		MetaDescription: req.MetaDescription,
		MetaKeywords:    req.MetaKeywords,
		AuthorID:        authorID,
		CategoryID:      req.CategoryID,
		Status:          req.Status,
	}

	// Set published_at if status is published
	if req.Status == domain.BlogStatusPublished {
		now := time.Now()
		blog.PublishedAt = &now
	}

	// Create the blog
	if err := s.blogRepo.Create(blog); err != nil {
		return nil, err
	}

	// Add tags if provided
	if len(req.TagIDs) > 0 {
		if err := s.blogRepo.AddTagsToBlog(blog.ID, req.TagIDs); err != nil {
			return nil, err
		}
	}

	// Return complete blog with relations
	return s.blogRepo.GetByID(blog.ID)
}

// GetBlog retrieves a blog by ID
func (s *BlogService) GetBlog(id uuid.UUID) (*domain.Blog, error) {
	return s.blogRepo.GetByID(id)
}

// GetBlogBySlug retrieves a blog by slug
func (s *BlogService) GetBlogBySlug(slug string) (*domain.Blog, error) {
	return s.blogRepo.GetBySlug(slug)
}

// ListBlogs retrieves a paginated list of blogs
func (s *BlogService) ListBlogs(filters domain.BlogFilters) (*domain.BlogListResponse, error) {
	blogs, total, err := s.blogRepo.List(filters)
	if err != nil {
		return nil, err
	}

	// Calculate total pages
	pageSize := filters.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}
	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))

	return &domain.BlogListResponse{
		Blogs:      blogs,
		Total:      total,
		Page:       filters.Page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}, nil
}

// UpdateBlog updates a blog post
func (s *BlogService) UpdateBlog(id uuid.UUID, req domain.UpdateBlogRequest) (*domain.Blog, error) {
	// Check if blog exists
	existingBlog, err := s.blogRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	updates := make(map[string]interface{})

	// Build updates map from request
	if req.Title != nil {
		updates["title"] = *req.Title
		// Generate new slug if title changed
		newSlug := slug.Make(*req.Title)
		if newSlug != existingBlog.Slug {
			exists, err := s.blogRepo.SlugExists(newSlug)
			if err != nil {
				return nil, err
			}
			if exists {
				newSlug = fmt.Sprintf("%s-%d", newSlug, time.Now().Unix())
			}
			updates["slug"] = newSlug
		}
	}
	if req.Excerpt != nil {
		updates["excerpt"] = req.Excerpt
	}
	if req.Content != nil {
		updates["content"] = *req.Content
	}
	if req.FeaturedImage != nil {
		updates["featured_image"] = req.FeaturedImage
	}
	if req.MetaTitle != nil {
		updates["meta_title"] = req.MetaTitle
	}
	if req.MetaDescription != nil {
		updates["meta_description"] = req.MetaDescription
	}
	if req.MetaKeywords != nil {
		updates["meta_keywords"] = req.MetaKeywords
	}
	if req.CategoryID != nil {
		updates["category_id"] = req.CategoryID
	}
	if req.Status != nil {
		updates["status"] = *req.Status
		// Set published_at if status changed to published
		if *req.Status == domain.BlogStatusPublished && existingBlog.PublishedAt == nil {
			now := time.Now()
			updates["published_at"] = now
		}
	}

	// Update the blog
	if err := s.blogRepo.Update(id, updates); err != nil {
		return nil, err
	}

	// Handle tags update if provided
	if req.TagIDs != nil {
		// Remove all existing tags
		if err := s.blogRepo.RemoveAllTagsFromBlog(id); err != nil {
			return nil, err
		}
		// Add new tags
		if len(*req.TagIDs) > 0 {
			if err := s.blogRepo.AddTagsToBlog(id, *req.TagIDs); err != nil {
				return nil, err
			}
		}
	}

	// Return updated blog
	return s.blogRepo.GetByID(id)
}

// DeleteBlog deletes a blog post
func (s *BlogService) DeleteBlog(id uuid.UUID) error {
	return s.blogRepo.Delete(id)
}

// PublishBlog publishes a blog post
func (s *BlogService) PublishBlog(id uuid.UUID) error {
	now := time.Now()
	updates := map[string]interface{}{
		"status":       domain.BlogStatusPublished,
		"published_at": now,
	}
	return s.blogRepo.Update(id, updates)
}

// UnpublishBlog unpublishes a blog post
func (s *BlogService) UnpublishBlog(id uuid.UUID) error {
	updates := map[string]interface{}{
		"status": domain.BlogStatusDraft,
	}
	return s.blogRepo.Update(id, updates)
}

// IncrementViewCount increments the view count of a blog
func (s *BlogService) IncrementViewCount(id uuid.UUID) error {
	return s.blogRepo.IncrementViewCount(id)
}

// ============= Category Methods =============

// CreateCategory creates a new blog category
func (s *BlogService) CreateCategory(req domain.CreateCategoryRequest) (*domain.BlogCategory, error) {
	categorySlug := slug.Make(req.Name)

	// Check if slug exists
	exists, err := s.blogRepo.CategorySlugExists(categorySlug)
	if err != nil {
		return nil, err
	}
	if exists {
		categorySlug = fmt.Sprintf("%s-%d", categorySlug, time.Now().Unix())
	}

	category := &domain.BlogCategory{
		Name:        req.Name,
		Slug:        categorySlug,
		Description: req.Description,
	}

	if err := s.blogRepo.CreateCategory(category); err != nil {
		return nil, err
	}

	return category, nil
}

// GetCategories retrieves all blog categories
func (s *BlogService) GetCategories() ([]domain.BlogCategory, error) {
	return s.blogRepo.GetCategories()
}

// GetCategoryByID retrieves a category by ID
func (s *BlogService) GetCategoryByID(id uuid.UUID) (*domain.BlogCategory, error) {
	return s.blogRepo.GetCategoryByID(id)
}

// UpdateCategory updates a blog category
func (s *BlogService) UpdateCategory(id uuid.UUID, req domain.UpdateCategoryRequest) (*domain.BlogCategory, error) {
	updates := make(map[string]interface{})

	if req.Name != nil {
		updates["name"] = *req.Name
		// Generate new slug if name changed
		newSlug := slug.Make(*req.Name)
		existingCategory, err := s.blogRepo.GetCategoryByID(id)
		if err != nil {
			return nil, err
		}
		if newSlug != existingCategory.Slug {
			exists, err := s.blogRepo.CategorySlugExists(newSlug)
			if err != nil {
				return nil, err
			}
			if exists {
				newSlug = fmt.Sprintf("%s-%d", newSlug, time.Now().Unix())
			}
			updates["slug"] = newSlug
		}
	}
	if req.Description != nil {
		updates["description"] = req.Description
	}

	if err := s.blogRepo.UpdateCategory(id, updates); err != nil {
		return nil, err
	}

	return s.blogRepo.GetCategoryByID(id)
}

// DeleteCategory deletes a blog category
func (s *BlogService) DeleteCategory(id uuid.UUID) error {
	return s.blogRepo.DeleteCategory(id)
}

// ============= Tag Methods =============

// CreateTag creates a new blog tag
func (s *BlogService) CreateTag(req domain.CreateTagRequest) (*domain.BlogTag, error) {
	tagSlug := slug.Make(req.Name)

	// Check if slug exists
	exists, err := s.blogRepo.TagSlugExists(tagSlug)
	if err != nil {
		return nil, err
	}
	if exists {
		tagSlug = fmt.Sprintf("%s-%d", tagSlug, time.Now().Unix())
	}

	tag := &domain.BlogTag{
		Name: req.Name,
		Slug: tagSlug,
	}

	if err := s.blogRepo.CreateTag(tag); err != nil {
		return nil, err
	}

	return tag, nil
}

// GetTags retrieves all blog tags
func (s *BlogService) GetTags() ([]domain.BlogTag, error) {
	return s.blogRepo.GetTags()
}

// GetTagByID retrieves a tag by ID
func (s *BlogService) GetTagByID(id uuid.UUID) (*domain.BlogTag, error) {
	return s.blogRepo.GetTagByID(id)
}

// DeleteTag deletes a blog tag
func (s *BlogService) DeleteTag(id uuid.UUID) error {
	return s.blogRepo.DeleteTag(id)
}

// GetAllBlogs retrieves all blogs for reindexing
func (s *BlogService) GetAllBlogs() ([]domain.Blog, error) {
	// Use list with no filters and high limit
	filters := domain.BlogFilters{
		Page:     1,
		PageSize: 10000,
	}
	blogs, _, err := s.blogRepo.List(filters)
	return blogs, err
}
