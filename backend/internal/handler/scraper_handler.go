package handler

import (
	"encoding/json"
	"errors"
	"job-platform/internal/domain"
	"job-platform/internal/dto"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// ScraperHandler handles scraper-related HTTP requests
type ScraperHandler struct {
	scraperService *service.ScraperService
	jobService     *service.JobService
}

// NewScraperHandler creates a new scraper handler
func NewScraperHandler(scraperService *service.ScraperService, jobService *service.JobService) *ScraperHandler {
	return &ScraperHandler{
		scraperService: scraperService,
		jobService:     jobService,
	}
}

// PreviewJobFromURL handles POST /admin/jobs/scrape/preview
// @Summary Preview job from URL
// @Description Scrape a job URL and return extracted data for preview
// @Tags Admin Jobs
// @Accept json
// @Produce json
// @Param request body dto.ScrapeJobRequest true "Scrape request"
// @Success 200 {object} dto.ScrapePreviewResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/jobs/scrape/preview [post]
func (h *ScraperHandler) PreviewJobFromURL(c *gin.Context) {
	var req dto.ScrapeJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Invalid request: "+err.Error()))
		return
	}

	// Validate URL format
	if !strings.HasPrefix(req.URL, "http://") && !strings.HasPrefix(req.URL, "https://") {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: URL must start with http:// or https://"))
		return
	}

	// Scrape the job
	scrapedJob, warnings, err := h.scraperService.ScrapeJobURL(c.Request.Context(), req.URL)
	if err != nil {
		response.InternalError(c, errors.New("SCRAPE_ERROR: "+err.Error()))
		return
	}

	c.JSON(http.StatusOK, dto.ScrapePreviewResponse{
		Success:    true,
		ScrapedJob: *scrapedJob,
		Warnings:   warnings,
	})
}

// CreateJobFromScrapedData handles POST /admin/jobs/scrape/create
// @Summary Create job from scraped data
// @Description Create a new job from scraped and optionally edited data
// @Tags Admin Jobs
// @Accept json
// @Produce json
// @Param request body dto.CreateFromScrapedRequest true "Create from scraped request"
// @Success 201 {object} dto.JobResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/jobs/scrape/create [post]
func (h *ScraperHandler) CreateJobFromScrapedData(c *gin.Context) {
	var req dto.CreateFromScrapedRequest
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

	adminID, ok := userID.(uuid.UUID)
	if !ok {
		response.InternalError(c, errors.New("INTERNAL_ERROR: Invalid user ID format"))
		return
	}

	// Apply edits if provided
	scrapedData := req.ScrapedData
	if req.Edits != nil {
		h.applyEdits(&scrapedData, req.Edits)
	}

	// Validate required fields
	if scrapedData.Title == "" {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Job title is required"))
		return
	}
	if scrapedData.Company == "" {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Company name is required"))
		return
	}
	if scrapedData.Description == "" {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Job description is required"))
		return
	}

	// Convert scraped data to AdminCreateJobInput
	input := h.scrapedDataToInput(&scrapedData)

	// Store scraped data as JSON
	scrapedDataJSON, _ := json.Marshal(scrapedData)
	scrapedDataStr := string(scrapedDataJSON)
	input.ScrapedData = &scrapedDataStr
	input.ScrapeStatus = "scraped"
	input.OriginalURL = &scrapedData.OriginalURL

	// Create the job using admin service
	createdJob, err := h.jobService.AdminCreateJob(adminID, input)
	if err != nil {
		response.InternalError(c, errors.New("CREATE_ERROR: Failed to create job: "+err.Error()))
		return
	}

	response.Created(c, "Job created successfully from scraped data", dto.ToJobResponse(createdJob, nil))
}

// BulkScrapeJobs handles POST /admin/jobs/scrape/bulk
// @Summary Bulk scrape jobs from URLs
// @Description Scrape multiple job URLs and return extracted data
// @Tags Admin Jobs
// @Accept json
// @Produce json
// @Param request body dto.BulkScrapeRequest true "Bulk scrape request"
// @Success 200 {object} dto.BulkScrapeResponse
// @Failure 400 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/jobs/scrape/bulk [post]
func (h *ScraperHandler) BulkScrapeJobs(c *gin.Context) {
	var req dto.BulkScrapeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Invalid request: "+err.Error()))
		return
	}

	if len(req.URLs) == 0 {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: At least one URL is required"))
		return
	}

	if len(req.URLs) > 10 {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Maximum 10 URLs allowed per request"))
		return
	}

	// Validate all URLs
	for _, url := range req.URLs {
		if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
			response.BadRequest(c, errors.New("VALIDATION_ERROR: All URLs must start with http:// or https://: "+url))
			return
		}
	}

	// Perform bulk scraping
	results := h.scraperService.BulkScrapeJobs(c.Request.Context(), req.URLs)

	response.OK(c, "Bulk scraping completed", results)
}

// TestScrape handles POST /admin/jobs/scrape/test
// @Summary Test scraping a URL
// @Description Test scraping a URL without saving
// @Tags Admin Jobs
// @Accept json
// @Produce json
// @Param request body dto.ScrapeJobRequest true "Scrape request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} response.ErrorResponse
// @Failure 500 {object} response.ErrorResponse
// @Router /admin/jobs/scrape/test [post]
func (h *ScraperHandler) TestScrape(c *gin.Context) {
	var req dto.ScrapeJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, errors.New("VALIDATION_ERROR: Invalid request: "+err.Error()))
		return
	}

	// Just call preview - same logic
	scrapedJob, warnings, err := h.scraperService.ScrapeJobURL(c.Request.Context(), req.URL)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":     true,
		"scraped_job": scrapedJob,
		"warnings":    warnings,
	})
}

// applyEdits applies manual edits to scraped data
func (h *ScraperHandler) applyEdits(data *dto.ScrapedJobResponse, edits map[string]interface{}) {
	if title, ok := edits["title"].(string); ok && title != "" {
		data.Title = title
	}
	if company, ok := edits["company"].(string); ok && company != "" {
		data.Company = company
	}
	if companyLogo, ok := edits["company_logo"].(string); ok {
		data.CompanyLogo = companyLogo
	}
	if location, ok := edits["location"].(string); ok && location != "" {
		data.Location = location
	}
	if city, ok := edits["city"].(string); ok {
		data.City = city
	}
	if state, ok := edits["state"].(string); ok {
		data.State = state
	}
	if country, ok := edits["country"].(string); ok {
		data.Country = country
	}
	if description, ok := edits["description"].(string); ok && description != "" {
		data.Description = description
	}
	if requirements, ok := edits["requirements"].(string); ok {
		data.Requirements = requirements
	}
	if salary, ok := edits["salary"].(string); ok {
		data.Salary = salary
	}
	if jobType, ok := edits["job_type"].(string); ok && jobType != "" {
		data.JobType = jobType
	}
	if experienceLevel, ok := edits["experience_level"].(string); ok && experienceLevel != "" {
		data.ExperienceLevel = experienceLevel
	}
	if skills, ok := edits["skills"].([]interface{}); ok {
		stringSkills := make([]string, 0, len(skills))
		for _, s := range skills {
			if str, ok := s.(string); ok {
				stringSkills = append(stringSkills, str)
			}
		}
		data.Skills = stringSkills
	}
	if benefits, ok := edits["benefits"].([]interface{}); ok {
		stringBenefits := make([]string, 0, len(benefits))
		for _, b := range benefits {
			if str, ok := b.(string); ok {
				stringBenefits = append(stringBenefits, str)
			}
		}
		data.Benefits = stringBenefits
	}
}

// scrapedDataToInput converts scraped data to AdminCreateJobInput
func (h *ScraperHandler) scrapedDataToInput(data *dto.ScrapedJobResponse) service.AdminCreateJobInput {
	// Map job type
	jobType := domain.JobTypeFullTime
	switch data.JobType {
	case "FULL_TIME":
		jobType = domain.JobTypeFullTime
	case "PART_TIME":
		jobType = domain.JobTypePartTime
	case "CONTRACT":
		jobType = domain.JobTypeContract
	case "FREELANCE":
		jobType = domain.JobTypeFreelance
	case "INTERNSHIP":
		jobType = domain.JobTypeInternship
	}

	// Map experience level
	experienceLevel := domain.ExperienceLevelMid
	switch data.ExperienceLevel {
	case "ENTRY":
		experienceLevel = domain.ExperienceLevelEntry
	case "MID":
		experienceLevel = domain.ExperienceLevelMid
	case "SENIOR":
		experienceLevel = domain.ExperienceLevelSenior
	case "LEAD":
		experienceLevel = domain.ExperienceLevelLead
	case "EXECUTIVE":
		experienceLevel = domain.ExperienceLevelExecutive
	}

	// Create description that includes requirements if present
	description := data.Description
	if data.Requirements != "" && !strings.Contains(data.Description, data.Requirements) {
		description = description + "\n\n<h3>Requirements</h3>\n" + data.Requirements
	}

	// Determine location string
	location := data.Location
	if location == "" {
		parts := []string{}
		if data.City != "" {
			parts = append(parts, data.City)
		}
		if data.State != "" {
			parts = append(parts, data.State)
		}
		if data.Country != "" {
			parts = append(parts, data.Country)
		}
		location = strings.Join(parts, ", ")
		if location == "" {
			location = "Remote"
		}
	}

	return service.AdminCreateJobInput{
		CreateJobInput: service.CreateJobInput{
			Title:            data.Title,
			Description:      description,
			ShortDescription: h.generateShortDescription(description),
			JobType:          jobType,
			ExperienceLevel:  experienceLevel,
			WorkplaceType:    domain.WorkplaceTypeOnsite, // Default, can be updated
			Location:         location,
			City:             data.City,
			State:            data.State,
			Country:          data.Country,
			Skills:           data.Skills,
			Benefits:         data.Benefits,
		},
		CompanyName:    data.Company,
		CompanyLogoURL: data.CompanyLogo,
		Status:         "ACTIVE",
	}
}

// generateShortDescription creates a short description from the full description
func (h *ScraperHandler) generateShortDescription(description string) string {
	// Strip HTML tags for short description
	text := h.stripHTMLTags(description)
	// Truncate to 300 characters
	if len(text) > 300 {
		text = text[:297] + "..."
	}
	return text
}

// stripHTMLTags removes HTML tags from a string
func (h *ScraperHandler) stripHTMLTags(html string) string {
	// Simple HTML tag stripping - for more complex cases, use a proper library
	result := html
	// Remove HTML tags
	for {
		start := strings.Index(result, "<")
		if start == -1 {
			break
		}
		end := strings.Index(result[start:], ">")
		if end == -1 {
			break
		}
		result = result[:start] + " " + result[start+end+1:]
	}
	// Collapse multiple spaces
	for strings.Contains(result, "  ") {
		result = strings.ReplaceAll(result, "  ", " ")
	}
	return strings.TrimSpace(result)
}
