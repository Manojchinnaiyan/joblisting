package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"job-platform/internal/domain"
	"job-platform/internal/dto"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"net/http"
	neturl "net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// BlogScraperHandler handles blog scraping and AI generation requests
type BlogScraperHandler struct {
	aiService      *service.AIService
	scraperService *service.ScraperService
	blogService    *service.BlogService
	unsplashAPIKey string
}

// NewBlogScraperHandler creates a new blog scraper handler
func NewBlogScraperHandler(aiService *service.AIService, scraperService *service.ScraperService, blogService *service.BlogService) *BlogScraperHandler {
	return &BlogScraperHandler{
		aiService:      aiService,
		scraperService: scraperService,
		blogService:    blogService,
		unsplashAPIKey: os.Getenv("UNSPLASH_ACCESS_KEY"),
	}
}

// GenerateBlogPreview handles POST /admin/blogs/generate/preview
// @Summary Generate blog preview from URL or prompt
// @Description Uses AI to generate a blog post from a URL's content or a user prompt
// @Tags Admin Blogs
// @Accept json
// @Produce json
// @Param request body dto.GenerateBlogRequest true "Generate blog request"
// @Success 200 {object} dto.BlogPreviewResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/blogs/generate/preview [post]
func (h *BlogScraperHandler) GenerateBlogPreview(c *gin.Context) {
	var req dto.GenerateBlogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Invalid request: "+err.Error()))
		return
	}

	// Validate: either URL or prompt must be provided
	if req.URL == "" && req.Prompt == "" {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Either URL or prompt must be provided"))
		return
	}

	// If only prompt provided (no URL), validate prompt length
	if req.URL == "" && len(req.Prompt) < 10 {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Prompt must be at least 10 characters when no URL is provided"))
		return
	}

	ctx := c.Request.Context()
	var generatedBlog *service.GeneratedBlog
	var err error
	var warnings []string
	sourceURL := ""

	// If URL is provided, scrape content and generate blog from it
	if req.URL != "" {
		// Validate URL format
		if !strings.HasPrefix(req.URL, "http://") && !strings.HasPrefix(req.URL, "https://") {
			response.BadRequest(c, errors.New("VALIDATION_ERROR: URL must start with http:// or https://"))
			return
		}
		sourceURL = req.URL

		// Scrape the URL content
		htmlContent, scrapeErr := h.scraperService.ScrapeHTMLSimple(ctx, req.URL)
		if scrapeErr != nil {
			warnings = append(warnings, "Could not scrape URL content, generating from prompt only: "+scrapeErr.Error())
			// Fall back to prompt-only generation if prompt provided
			if req.Prompt != "" {
				generatedBlog, err = h.aiService.GenerateBlogFromPrompt(ctx, req.Prompt, req.TargetTone, req.TargetLength)
			} else {
				response.InternalError(c, errors.New("SCRAPE_ERROR: Failed to scrape URL and no prompt provided: "+scrapeErr.Error()))
				return
			}
		} else {
			// Generate blog from scraped content
			// If no prompt provided, use a default instruction
			prompt := req.Prompt
			if prompt == "" {
				prompt = "Create an informative and engaging blog post based on this content. Rewrite it in your own words, making it easy to understand and SEO-friendly."
			}
			generatedBlog, err = h.aiService.GenerateBlogFromURLContent(ctx, htmlContent, req.URL, prompt, req.TargetTone, req.TargetLength)
		}
	} else {
		// Generate blog from prompt only
		generatedBlog, err = h.aiService.GenerateBlogFromPrompt(ctx, req.Prompt, req.TargetTone, req.TargetLength)
	}

	if err != nil {
		fmt.Printf("[BlogGenerator] GENERATION_ERROR: %v\n", err)
		response.InternalError(c, errors.New("GENERATION_ERROR: "+err.Error()))
		return
	}

	// Search for images using the suggested search term
	var imageOptions []dto.UnsplashImage
	if generatedBlog.ImageSearchTerm != "" {
		if h.unsplashAPIKey != "" {
			// Use Unsplash API if key is available
			images, imgErr := h.searchUnsplashImages(generatedBlog.ImageSearchTerm, 6)
			if imgErr != nil {
				warnings = append(warnings, "Could not fetch images from API: "+imgErr.Error())
				// Fall back to direct URL images
				imageOptions = h.generateDirectUnsplashImages(generatedBlog.ImageSearchTerm, 6)
			} else {
				imageOptions = images
			}
		} else {
			// Use direct Unsplash Source URLs (no API key needed)
			imageOptions = h.generateDirectUnsplashImages(generatedBlog.ImageSearchTerm, 6)
		}
	}

	// Get the first image as featured image if available
	featuredImage := ""
	if len(imageOptions) > 0 {
		featuredImage = imageOptions[0].URL
	}

	c.JSON(http.StatusOK, dto.BlogPreviewResponse{
		Success: true,
		GeneratedBlog: dto.GeneratedBlogResponse{
			Title:           generatedBlog.Title,
			Slug:            generatedBlog.Slug,
			Excerpt:         generatedBlog.Excerpt,
			Content:         generatedBlog.Content,
			FeaturedImage:   featuredImage,
			MetaTitle:       generatedBlog.MetaTitle,
			MetaDescription: generatedBlog.MetaDescription,
			MetaKeywords:    generatedBlog.MetaKeywords,
			SuggestedTags:   generatedBlog.SuggestedTags,
			SourceURL:       sourceURL,
			ImageSearchTerm: generatedBlog.ImageSearchTerm,
		},
		Warnings:     warnings,
		ImageOptions: imageOptions,
	})
}

// CreateBlogFromGenerated handles POST /admin/blogs/generate/create
// @Summary Create blog from generated data
// @Description Creates a new blog post from AI-generated and optionally edited data
// @Tags Admin Blogs
// @Accept json
// @Produce json
// @Param request body dto.CreateFromGeneratedRequest true "Create from generated request"
// @Success 201 {object} domain.Blog
// @Failure 400 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/blogs/generate/create [post]
func (h *BlogScraperHandler) CreateBlogFromGenerated(c *gin.Context) {
	var req dto.CreateFromGeneratedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Invalid request: "+err.Error()))
		return
	}

	// Get admin user from context
	userID, exists := c.Get("user_id")
	if !exists {
		response.Unauthorized(c, domain.ErrUnauthorized)
		return
	}

	authorID, ok := userID.(uuid.UUID)
	if !ok {
		response.InternalError(c, errors.New("INTERNAL_ERROR: Invalid user ID format"))
		return
	}

	// Apply edits if provided
	generatedData := req.GeneratedData
	if req.Edits != nil {
		h.applyEdits(&generatedData, req.Edits)
	}

	// Validate required fields
	if generatedData.Title == "" {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Blog title is required"))
		return
	}
	if generatedData.Content == "" {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Blog content is required"))
		return
	}

	// Determine status
	status := domain.BlogStatusDraft
	if req.Status == "published" {
		status = domain.BlogStatusPublished
	}

	// Parse category ID if provided
	var categoryID *uuid.UUID
	if req.CategoryID != "" {
		catID, err := uuid.Parse(req.CategoryID)
		if err == nil {
			categoryID = &catID
		}
	}

	// Parse tag IDs
	var tagIDs []uuid.UUID
	for _, tagIDStr := range req.TagIDs {
		tagID, err := uuid.Parse(tagIDStr)
		if err == nil {
			tagIDs = append(tagIDs, tagID)
		}
	}

	// Create the blog
	createReq := domain.CreateBlogRequest{
		Title:           generatedData.Title,
		Excerpt:         &generatedData.Excerpt,
		Content:         generatedData.Content,
		FeaturedImage:   &generatedData.FeaturedImage,
		MetaTitle:       &generatedData.MetaTitle,
		MetaDescription: &generatedData.MetaDescription,
		MetaKeywords:    &generatedData.MetaKeywords,
		CategoryID:      categoryID,
		Status:          status,
		TagIDs:          tagIDs,
	}

	blog, err := h.blogService.CreateBlog(createReq, authorID)
	if err != nil {
		response.InternalError(c, errors.New("CREATE_ERROR: Failed to create blog: "+err.Error()))
		return
	}

	response.Created(c, "Blog created successfully from generated data", blog)
}

// SearchImages handles POST /admin/blogs/generate/images
// @Summary Search for images from Unsplash
// @Description Searches Unsplash for free images based on a query
// @Tags Admin Blogs
// @Accept json
// @Produce json
// @Param request body dto.SearchImagesRequest true "Search images request"
// @Success 200 {object} dto.SearchImagesResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/blogs/generate/images [post]
func (h *BlogScraperHandler) SearchImages(c *gin.Context) {
	var req dto.SearchImagesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Invalid request: "+err.Error()))
		return
	}

	if h.unsplashAPIKey == "" {
		response.InternalError(c, errors.New("CONFIG_ERROR: Unsplash API key not configured"))
		return
	}

	perPage := req.PerPage
	if perPage <= 0 || perPage > 30 {
		perPage = 6
	}

	images, err := h.searchUnsplashImages(req.Query, perPage)
	if err != nil {
		response.InternalError(c, errors.New("SEARCH_ERROR: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.SearchImagesResponse{
		Success: true,
		Images:  images,
		Total:   len(images),
	})
}

// SimplifyContent handles POST /admin/blogs/generate/simplify
// @Summary Simplify blog content
// @Description Uses AI to simplify and make blog content more readable
// @Tags Admin Blogs
// @Accept json
// @Produce json
// @Param request body dto.SimplifyContentRequest true "Simplify content request"
// @Success 200 {object} dto.SimplifyContentResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/blogs/generate/simplify [post]
func (h *BlogScraperHandler) SimplifyContent(c *gin.Context) {
	var req dto.SimplifyContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Invalid request: "+err.Error()))
		return
	}

	ctx := c.Request.Context()
	originalLength := len(req.Content)

	simplifiedContent, err := h.aiService.SimplifyBlogContent(ctx, req.Content, req.TargetTone)
	if err != nil {
		response.InternalError(c, errors.New("SIMPLIFY_ERROR: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.SimplifyContentResponse{
		Success:           true,
		SimplifiedContent: simplifiedContent,
		OriginalLength:    originalLength,
		SimplifiedLength:  len(simplifiedContent),
	})
}

// searchUnsplashImages searches for images on Unsplash
func (h *BlogScraperHandler) searchUnsplashImages(query string, perPage int) ([]dto.UnsplashImage, error) {
	if h.unsplashAPIKey == "" {
		return nil, fmt.Errorf("unsplash API key not configured")
	}

	// Build request URL
	baseURL := "https://api.unsplash.com/search/photos"
	params := neturl.Values{}
	params.Set("query", query)
	params.Set("per_page", fmt.Sprintf("%d", perPage))
	params.Set("orientation", "landscape")
	params.Set("content_filter", "high") // Safe for work filter

	reqURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())

	// Create request
	req, err := http.NewRequest("GET", reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Client-ID "+h.unsplashAPIKey)
	req.Header.Set("Accept-Version", "v1")

	// Make request
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch images: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("unsplash API error (status %d): %s", resp.StatusCode, string(body))
	}

	// Parse response
	var result struct {
		Results []struct {
			ID          string `json:"id"`
			Width       int    `json:"width"`
			Height      int    `json:"height"`
			Description string `json:"description"`
			AltDescription string `json:"alt_description"`
			URLs        struct {
				Raw     string `json:"raw"`
				Full    string `json:"full"`
				Regular string `json:"regular"`
				Small   string `json:"small"`
				Thumb   string `json:"thumb"`
			} `json:"urls"`
			Links struct {
				Download string `json:"download_location"`
			} `json:"links"`
			User struct {
				Name  string `json:"name"`
				Links struct {
					HTML string `json:"html"`
				} `json:"links"`
			} `json:"user"`
		} `json:"results"`
		Total int `json:"total"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Convert to our format
	var images []dto.UnsplashImage
	for _, img := range result.Results {
		altText := img.AltDescription
		if altText == "" {
			altText = img.Description
		}
		if altText == "" {
			altText = query
		}

		images = append(images, dto.UnsplashImage{
			ID:           img.ID,
			URL:          img.URLs.Regular,
			ThumbURL:     img.URLs.Thumb,
			DownloadURL:  img.Links.Download,
			AltText:      altText,
			Photographer: img.User.Name,
			ProfileURL:   img.User.Links.HTML,
			Width:        img.Width,
			Height:       img.Height,
		})
	}

	return images, nil
}

// generateDirectUnsplashImages generates image options using Lorem Picsum
// This is a reliable free service that doesn't require an API key
func (h *BlogScraperHandler) generateDirectUnsplashImages(query string, count int) []dto.UnsplashImage {
	var images []dto.UnsplashImage

	// Use Lorem Picsum - a reliable free image service
	// Each unique seed gives a different consistent image
	// Format: https://picsum.photos/seed/{seed}/{width}/{height}
	for i := 0; i < count; i++ {
		// Create a seed from the query + index to get consistent but varied images
		seed := fmt.Sprintf("%s-%d", query, i)
		imageURL := fmt.Sprintf("https://picsum.photos/seed/%s/1200/800", neturl.QueryEscape(seed))
		thumbURL := fmt.Sprintf("https://picsum.photos/seed/%s/400/300", neturl.QueryEscape(seed))

		images = append(images, dto.UnsplashImage{
			ID:           fmt.Sprintf("picsum-%d", i),
			URL:          imageURL,
			ThumbURL:     thumbURL,
			DownloadURL:  imageURL,
			AltText:      query,
			Photographer: "Lorem Picsum",
			ProfileURL:   "https://picsum.photos",
			Width:        1200,
			Height:       800,
		})
	}

	return images
}

// applyEdits applies manual edits to generated data
func (h *BlogScraperHandler) applyEdits(data *dto.GeneratedBlogResponse, edits map[string]interface{}) {
	if title, ok := edits["title"].(string); ok && title != "" {
		data.Title = title
	}
	if slug, ok := edits["slug"].(string); ok && slug != "" {
		data.Slug = slug
	}
	if excerpt, ok := edits["excerpt"].(string); ok {
		data.Excerpt = excerpt
	}
	if content, ok := edits["content"].(string); ok && content != "" {
		data.Content = content
	}
	if featuredImage, ok := edits["featured_image"].(string); ok {
		data.FeaturedImage = featuredImage
	}
	if metaTitle, ok := edits["meta_title"].(string); ok {
		data.MetaTitle = metaTitle
	}
	if metaDescription, ok := edits["meta_description"].(string); ok {
		data.MetaDescription = metaDescription
	}
	if metaKeywords, ok := edits["meta_keywords"].(string); ok {
		data.MetaKeywords = metaKeywords
	}
	if tags, ok := edits["suggested_tags"].([]interface{}); ok {
		stringTags := make([]string, 0, len(tags))
		for _, t := range tags {
			if str, ok := t.(string); ok {
				stringTags = append(stringTags, str)
			}
		}
		data.SuggestedTags = stringTags
	}
}
