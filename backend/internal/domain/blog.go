package domain

import (
	"time"

	"github.com/google/uuid"
)

// BlogStatus represents the status of a blog post
type BlogStatus string

const (
	BlogStatusDraft     BlogStatus = "draft"
	BlogStatusPublished BlogStatus = "published"
	BlogStatusArchived  BlogStatus = "archived"
)

// Blog represents a blog post
type Blog struct {
	ID              uuid.UUID    `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Title           string       `gorm:"size:200;not null" json:"title"`
	Slug            string       `gorm:"size:250;uniqueIndex;not null" json:"slug"`
	Excerpt         *string      `gorm:"type:text" json:"excerpt,omitempty"`
	Content         string       `gorm:"type:text;not null" json:"content"`
	FeaturedImage   *string      `gorm:"size:500" json:"featured_image,omitempty"`
	MetaTitle       *string      `gorm:"size:200" json:"meta_title,omitempty"`
	MetaDescription *string      `gorm:"size:500" json:"meta_description,omitempty"`
	MetaKeywords    *string      `gorm:"size:500" json:"meta_keywords,omitempty"`
	AuthorID        uuid.UUID    `gorm:"type:uuid;not null;index" json:"author_id"`
	CategoryID      *uuid.UUID   `gorm:"type:uuid;index" json:"category_id,omitempty"`
	Status          BlogStatus   `gorm:"type:blog_status;not null;default:'draft'" json:"status"`
	PublishedAt     *time.Time   `json:"published_at,omitempty"`
	ViewCount       int          `gorm:"default:0" json:"view_count"`
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`

	// Relationships
	Author   *User         `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	Category *BlogCategory `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Tags     []BlogTag     `gorm:"many2many:blog_post_tags;" json:"tags,omitempty"`
}

// TableName specifies the table name for Blog
func (Blog) TableName() string {
	return "blogs"
}

// IsPublished returns true if the blog is published
func (b *Blog) IsPublished() bool {
	return b.Status == BlogStatusPublished
}

// BlogCategory represents a blog category
type BlogCategory struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name        string    `gorm:"size:100;uniqueIndex;not null" json:"name"`
	Slug        string    `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	Description *string   `gorm:"type:text" json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TableName specifies the table name for BlogCategory
func (BlogCategory) TableName() string {
	return "blog_categories"
}

// BlogTag represents a blog tag
type BlogTag struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name      string    `gorm:"size:100;uniqueIndex;not null" json:"name"`
	Slug      string    `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	CreatedAt time.Time `json:"created_at"`
}

// TableName specifies the table name for BlogTag
func (BlogTag) TableName() string {
	return "blog_tags"
}

// BlogPostTag represents the many-to-many junction table
type BlogPostTag struct {
	BlogID uuid.UUID `gorm:"type:uuid;primaryKey" json:"blog_id"`
	TagID  uuid.UUID `gorm:"type:uuid;primaryKey" json:"tag_id"`
}

// TableName specifies the table name for BlogPostTag
func (BlogPostTag) TableName() string {
	return "blog_post_tags"
}

// CreateBlogRequest represents the request to create a blog post
type CreateBlogRequest struct {
	Title           string      `json:"title" binding:"required,min=3,max=200"`
	Excerpt         *string     `json:"excerpt,omitempty"`
	Content         string      `json:"content" binding:"required,min=10"`
	FeaturedImage   *string     `json:"featured_image,omitempty"`
	MetaTitle       *string     `json:"meta_title,omitempty"`
	MetaDescription *string     `json:"meta_description,omitempty"`
	MetaKeywords    *string     `json:"meta_keywords,omitempty"`
	CategoryID      *uuid.UUID  `json:"category_id,omitempty"`
	Status          BlogStatus  `json:"status" binding:"required,oneof=draft published archived"`
	TagIDs          []uuid.UUID `json:"tag_ids,omitempty"`
}

// UpdateBlogRequest represents the request to update a blog post
type UpdateBlogRequest struct {
	Title           *string     `json:"title,omitempty" binding:"omitempty,min=3,max=200"`
	Excerpt         *string     `json:"excerpt,omitempty"`
	Content         *string     `json:"content,omitempty" binding:"omitempty,min=10"`
	FeaturedImage   *string     `json:"featured_image,omitempty"`
	MetaTitle       *string     `json:"meta_title,omitempty"`
	MetaDescription *string     `json:"meta_description,omitempty"`
	MetaKeywords    *string     `json:"meta_keywords,omitempty"`
	CategoryID      *uuid.UUID  `json:"category_id,omitempty"`
	Status          *BlogStatus `json:"status,omitempty" binding:"omitempty,oneof=draft published archived"`
	TagIDs          *[]uuid.UUID `json:"tag_ids,omitempty"`
}

// BlogListResponse represents a paginated list of blogs
type BlogListResponse struct {
	Blogs      []Blog `json:"blogs"`
	Total      int64  `json:"total"`
	Page       int    `json:"page"`
	PageSize   int    `json:"page_size"`
	TotalPages int    `json:"total_pages"`
}

// BlogFilters represents filters for listing blogs
type BlogFilters struct {
	Status     *BlogStatus `json:"status,omitempty"`
	CategoryID *uuid.UUID  `json:"category_id,omitempty"`
	AuthorID   *uuid.UUID  `json:"author_id,omitempty"`
	Search     *string     `json:"search,omitempty"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	SortBy     string      `json:"sort_by"`
	SortOrder  string      `json:"sort_order"`
}

// CreateCategoryRequest represents the request to create a category
type CreateCategoryRequest struct {
	Name        string  `json:"name" binding:"required,min=2,max=100"`
	Description *string `json:"description,omitempty"`
}

// UpdateCategoryRequest represents the request to update a category
type UpdateCategoryRequest struct {
	Name        *string `json:"name,omitempty" binding:"omitempty,min=2,max=100"`
	Description *string `json:"description,omitempty"`
}

// CreateTagRequest represents the request to create a tag
type CreateTagRequest struct {
	Name string `json:"name" binding:"required,min=2,max=100"`
}
