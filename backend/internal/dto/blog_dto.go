package dto

// ============================================================
// BLOG SCRAPER/GENERATOR DTOs
// ============================================================

// GenerateBlogRequest represents a request to generate a blog from URL or prompt
type GenerateBlogRequest struct {
	URL          string `json:"url,omitempty"`           // Optional URL to scrape content from
	Prompt       string `json:"prompt,omitempty"`        // User prompt for blog generation (optional if URL provided)
	CategoryID   string `json:"category_id,omitempty"`   // Optional category ID
	TargetTone   string `json:"target_tone,omitempty"`   // e.g., professional, casual, educational
	TargetLength string `json:"target_length,omitempty"` // e.g., short, medium, long
}

// GeneratedBlogResponse represents the AI-generated blog content
type GeneratedBlogResponse struct {
	Title           string   `json:"title"`
	Slug            string   `json:"slug"`
	Excerpt         string   `json:"excerpt"`
	Content         string   `json:"content"`                    // Full HTML content
	FeaturedImage   string   `json:"featured_image,omitempty"`   // Suggested image URL from Unsplash
	MetaTitle       string   `json:"meta_title"`
	MetaDescription string   `json:"meta_description"`
	MetaKeywords    string   `json:"meta_keywords"`
	SuggestedTags   []string `json:"suggested_tags,omitempty"`
	SourceURL       string   `json:"source_url,omitempty"`       // Original URL if scraped
	ImageSearchTerm string   `json:"image_search_term,omitempty"` // Search term used for image
}

// BlogPreviewResponse represents the response for blog generation preview
type BlogPreviewResponse struct {
	Success       bool                  `json:"success"`
	GeneratedBlog GeneratedBlogResponse `json:"generated_blog"`
	Warnings      []string              `json:"warnings,omitempty"`
	ImageOptions  []UnsplashImage       `json:"image_options,omitempty"` // Multiple image options
}

// CreateFromGeneratedRequest represents a request to create blog from generated data
type CreateFromGeneratedRequest struct {
	GeneratedData GeneratedBlogResponse  `json:"generated_data" binding:"required"`
	Edits         map[string]interface{} `json:"edits,omitempty"`
	CategoryID    string                 `json:"category_id,omitempty"`
	TagIDs        []string               `json:"tag_ids,omitempty"`
	Status        string                 `json:"status,omitempty"` // draft or published
}

// UnsplashImage represents an image from Unsplash
type UnsplashImage struct {
	ID           string `json:"id"`
	URL          string `json:"url"`           // Regular size URL
	ThumbURL     string `json:"thumb_url"`     // Thumbnail URL
	DownloadURL  string `json:"download_url"`  // Download URL (for attribution)
	AltText      string `json:"alt_text"`
	Photographer string `json:"photographer"`
	ProfileURL   string `json:"profile_url"`   // Photographer profile URL
	Width        int    `json:"width"`
	Height       int    `json:"height"`
}

// SearchImagesRequest represents a request to search for images
type SearchImagesRequest struct {
	Query   string `json:"query" binding:"required,min=2"`
	PerPage int    `json:"per_page,omitempty"` // Default 6
}

// SearchImagesResponse represents the response for image search
type SearchImagesResponse struct {
	Success bool            `json:"success"`
	Images  []UnsplashImage `json:"images"`
	Total   int             `json:"total"`
}

// SimplifyContentRequest represents a request to simplify content
type SimplifyContentRequest struct {
	Content    string `json:"content" binding:"required,min=10"`
	TargetTone string `json:"target_tone,omitempty"` // e.g., simple, casual, professional
}

// SimplifyContentResponse represents the response for content simplification
type SimplifyContentResponse struct {
	Success           bool   `json:"success"`
	SimplifiedContent string `json:"simplified_content"`
	OriginalLength    int    `json:"original_length"`
	SimplifiedLength  int    `json:"simplified_length"`
}
