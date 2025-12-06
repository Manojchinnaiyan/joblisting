package repository

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BlogRepository handles blog database operations
type BlogRepository struct {
	db *gorm.DB
}

// NewBlogRepository creates a new blog repository
func NewBlogRepository(db *gorm.DB) *BlogRepository {
	return &BlogRepository{db: db}
}

// Create creates a new blog post
func (r *BlogRepository) Create(blog *domain.Blog) error {
	if blog.ID == uuid.Nil {
		blog.ID = uuid.New()
	}
	if blog.Status == domain.BlogStatusPublished && blog.PublishedAt == nil {
		now := time.Now()
		blog.PublishedAt = &now
	}
	return r.db.Create(blog).Error
}

// GetByID retrieves a blog by ID with relations
func (r *BlogRepository) GetByID(id uuid.UUID) (*domain.Blog, error) {
	var blog domain.Blog
	err := r.db.Preload("Author").Preload("Category").Preload("Tags").
		Where("id = ?", id).First(&blog).Error
	if err != nil {
		return nil, err
	}
	return &blog, nil
}

// GetBySlug retrieves a blog by slug with relations
func (r *BlogRepository) GetBySlug(slug string) (*domain.Blog, error) {
	var blog domain.Blog
	err := r.db.Preload("Author").Preload("Category").Preload("Tags").
		Where("slug = ?", slug).First(&blog).Error
	if err != nil {
		return nil, err
	}
	return &blog, nil
}

// List retrieves paginated list of blogs with filters
func (r *BlogRepository) List(filters domain.BlogFilters) ([]domain.Blog, int64, error) {
	var blogs []domain.Blog
	var total int64

	query := r.db.Model(&domain.Blog{})

	// Apply filters
	if filters.Status != nil {
		query = query.Where("status = ?", *filters.Status)
	}
	if filters.CategoryID != nil {
		query = query.Where("category_id = ?", *filters.CategoryID)
	}
	if filters.AuthorID != nil {
		query = query.Where("author_id = ?", *filters.AuthorID)
	}
	if filters.Search != nil && *filters.Search != "" {
		searchTerm := "%" + *filters.Search + "%"
		query = query.Where("title ILIKE ? OR content ILIKE ?", searchTerm, searchTerm)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply sorting
	sortBy := filters.SortBy
	if sortBy == "" {
		sortBy = "created_at"
	}
	sortOrder := filters.SortOrder
	if sortOrder == "" {
		sortOrder = "DESC"
	}
	query = query.Order(sortBy + " " + sortOrder)

	// Apply pagination
	if filters.PageSize <= 0 {
		filters.PageSize = 10
	}
	if filters.Page <= 0 {
		filters.Page = 1
	}
	offset := (filters.Page - 1) * filters.PageSize
	query = query.Offset(offset).Limit(filters.PageSize)

	// Preload relations and get results
	if err := query.Preload("Author").Preload("Category").Preload("Tags").Find(&blogs).Error; err != nil {
		return nil, 0, err
	}

	return blogs, total, nil
}

// Update updates a blog post
func (r *BlogRepository) Update(id uuid.UUID, updates map[string]interface{}) error {
	updates["updated_at"] = time.Now()
	return r.db.Model(&domain.Blog{}).Where("id = ?", id).Updates(updates).Error
}

// Delete deletes a blog post
func (r *BlogRepository) Delete(id uuid.UUID) error {
	// First remove all tag associations
	if err := r.db.Where("blog_id = ?", id).Delete(&domain.BlogPostTag{}).Error; err != nil {
		return err
	}
	// Then delete the blog
	return r.db.Where("id = ?", id).Delete(&domain.Blog{}).Error
}

// IncrementViewCount increments the view count of a blog
func (r *BlogRepository) IncrementViewCount(id uuid.UUID) error {
	return r.db.Model(&domain.Blog{}).Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + 1")).Error
}

// SlugExists checks if a slug already exists
func (r *BlogRepository) SlugExists(slug string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.Blog{}).Where("slug = ?", slug).Count(&count).Error
	return count > 0, err
}

// ============= Category Methods =============

// CreateCategory creates a new blog category
func (r *BlogRepository) CreateCategory(category *domain.BlogCategory) error {
	if category.ID == uuid.Nil {
		category.ID = uuid.New()
	}
	return r.db.Create(category).Error
}

// GetCategories retrieves all blog categories
func (r *BlogRepository) GetCategories() ([]domain.BlogCategory, error) {
	var categories []domain.BlogCategory
	err := r.db.Order("name ASC").Find(&categories).Error
	return categories, err
}

// GetCategoryByID retrieves a category by ID
func (r *BlogRepository) GetCategoryByID(id uuid.UUID) (*domain.BlogCategory, error) {
	var category domain.BlogCategory
	err := r.db.Where("id = ?", id).First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

// GetCategoryBySlug retrieves a category by slug
func (r *BlogRepository) GetCategoryBySlug(slug string) (*domain.BlogCategory, error) {
	var category domain.BlogCategory
	err := r.db.Where("slug = ?", slug).First(&category).Error
	if err != nil {
		return nil, err
	}
	return &category, nil
}

// UpdateCategory updates a blog category
func (r *BlogRepository) UpdateCategory(id uuid.UUID, updates map[string]interface{}) error {
	updates["updated_at"] = time.Now()
	return r.db.Model(&domain.BlogCategory{}).Where("id = ?", id).Updates(updates).Error
}

// DeleteCategory deletes a blog category
func (r *BlogRepository) DeleteCategory(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.BlogCategory{}).Error
}

// CategorySlugExists checks if a category slug already exists
func (r *BlogRepository) CategorySlugExists(slug string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.BlogCategory{}).Where("slug = ?", slug).Count(&count).Error
	return count > 0, err
}

// ============= Tag Methods =============

// CreateTag creates a new blog tag
func (r *BlogRepository) CreateTag(tag *domain.BlogTag) error {
	if tag.ID == uuid.Nil {
		tag.ID = uuid.New()
	}
	return r.db.Create(tag).Error
}

// GetTags retrieves all blog tags
func (r *BlogRepository) GetTags() ([]domain.BlogTag, error) {
	var tags []domain.BlogTag
	err := r.db.Order("name ASC").Find(&tags).Error
	return tags, err
}

// GetTagByID retrieves a tag by ID
func (r *BlogRepository) GetTagByID(id uuid.UUID) (*domain.BlogTag, error) {
	var tag domain.BlogTag
	err := r.db.Where("id = ?", id).First(&tag).Error
	if err != nil {
		return nil, err
	}
	return &tag, nil
}

// GetTagBySlug retrieves a tag by slug
func (r *BlogRepository) GetTagBySlug(slug string) (*domain.BlogTag, error) {
	var tag domain.BlogTag
	err := r.db.Where("slug = ?", slug).First(&tag).Error
	if err != nil {
		return nil, err
	}
	return &tag, nil
}

// DeleteTag deletes a blog tag
func (r *BlogRepository) DeleteTag(id uuid.UUID) error {
	// First remove all blog associations
	if err := r.db.Where("tag_id = ?", id).Delete(&domain.BlogPostTag{}).Error; err != nil {
		return err
	}
	// Then delete the tag
	return r.db.Where("id = ?", id).Delete(&domain.BlogTag{}).Error
}

// TagSlugExists checks if a tag slug already exists
func (r *BlogRepository) TagSlugExists(slug string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.BlogTag{}).Where("slug = ?", slug).Count(&count).Error
	return count > 0, err
}

// ============= Blog-Tag Relationship Methods =============

// AddTagsToBlog adds tags to a blog post
func (r *BlogRepository) AddTagsToBlog(blogID uuid.UUID, tagIDs []uuid.UUID) error {
	for _, tagID := range tagIDs {
		blogPostTag := domain.BlogPostTag{
			BlogID: blogID,
			TagID:  tagID,
		}
		if err := r.db.Create(&blogPostTag).Error; err != nil {
			return err
		}
	}
	return nil
}

// RemoveAllTagsFromBlog removes all tags from a blog post
func (r *BlogRepository) RemoveAllTagsFromBlog(blogID uuid.UUID) error {
	return r.db.Where("blog_id = ?", blogID).Delete(&domain.BlogPostTag{}).Error
}

// GetTagsForBlog retrieves all tags for a blog post
func (r *BlogRepository) GetTagsForBlog(blogID uuid.UUID) ([]domain.BlogTag, error) {
	var tags []domain.BlogTag
	err := r.db.Table("blog_tags").
		Joins("JOIN blog_post_tags ON blog_tags.id = blog_post_tags.tag_id").
		Where("blog_post_tags.blog_id = ?", blogID).
		Find(&tags).Error
	return tags, err
}

// GetTagsByIDs retrieves tags by their IDs
func (r *BlogRepository) GetTagsByIDs(tagIDs []uuid.UUID) ([]domain.BlogTag, error) {
	var tags []domain.BlogTag
	err := r.db.Where("id IN ?", tagIDs).Find(&tags).Error
	return tags, err
}
