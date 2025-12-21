package service

import (
	"context"
	"fmt"
	"job-platform/internal/dto"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/chromedp/chromedp"
	"github.com/gocolly/colly/v2"
)

// ScraperService handles web scraping for job postings
type ScraperService struct {
	aiService  *AIService
	httpClient *http.Client
}

// NewScraperService creates a new scraper service instance
func NewScraperService(aiService *AIService) *ScraperService {
	return &ScraperService{
		aiService: aiService,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// ScrapeJobURL scrapes a job posting from the given URL
func (s *ScraperService) ScrapeJobURL(ctx context.Context, jobURL string) (*dto.ScrapedJobResponse, []string, error) {
	warnings := []string{}

	// Validate URL
	parsedURL, err := url.Parse(jobURL)
	if err != nil {
		return nil, nil, fmt.Errorf("invalid URL: %w", err)
	}

	if parsedURL.Scheme != "http" && parsedURL.Scheme != "https" {
		return nil, nil, fmt.Errorf("URL must use http or https scheme")
	}

	// Scrape the page HTML
	html, err := s.scrapeHTML(ctx, jobURL)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to scrape page: %w", err)
	}

	if len(html) < 100 {
		return nil, nil, fmt.Errorf("page content too short, might be blocked or empty")
	}

	// Check if AI service is configured
	if !s.aiService.IsConfigured() {
		return nil, nil, fmt.Errorf("AI service not configured: ANTHROPIC_API_KEY environment variable not set")
	}

	// Extract job details using AI
	extractedJob, err := s.aiService.ExtractJobFromHTML(ctx, html, jobURL)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to extract job details: %w", err)
	}

	// Validate extracted data and collect warnings
	if extractedJob.Title == "" {
		warnings = append(warnings, "Job title could not be extracted")
	}
	if extractedJob.Company == "" {
		warnings = append(warnings, "Company name could not be extracted")
	}
	if extractedJob.Description == "" {
		warnings = append(warnings, "Job description could not be extracted")
	}
	if extractedJob.Salary == "" {
		warnings = append(warnings, "Salary information not found")
	}
	if len(extractedJob.Skills) == 0 {
		warnings = append(warnings, "No skills could be extracted")
	}

	// Map job type to our format
	jobType := s.mapJobType(extractedJob.JobType)
	experienceLevel := s.mapExperienceLevel(extractedJob.ExperienceLevel)

	response := &dto.ScrapedJobResponse{
		Title:           extractedJob.Title,
		Company:         extractedJob.Company,
		CompanyLogo:     extractedJob.CompanyLogo,
		Location:        extractedJob.Location,
		City:            extractedJob.City,
		State:           extractedJob.State,
		Country:         extractedJob.Country,
		Description:     extractedJob.Description,
		Requirements:    extractedJob.Requirements,
		Salary:          extractedJob.Salary,
		JobType:         jobType,
		ExperienceLevel: experienceLevel,
		Skills:          extractedJob.Skills,
		Benefits:        extractedJob.Benefits,
		OriginalURL:     jobURL,
	}

	return response, warnings, nil
}

// scrapeHTML fetches the HTML content from a URL
// It first tries with colly (fast), then falls back to chromedp for JS-heavy pages
func (s *ScraperService) scrapeHTML(ctx context.Context, jobURL string) (string, error) {
	// First try with colly (faster for static pages)
	html, err := s.scrapeWithColly(ctx, jobURL)
	if err != nil {
		return "", err
	}

	// Check if the page content looks like it needs JavaScript rendering
	// Common indicators: empty body, placeholder widgets, or very short content
	if s.needsJavaScriptRendering(html) {
		// Fall back to headless browser
		jsHTML, jsErr := s.scrapeWithChromedp(ctx, jobURL)
		if jsErr != nil {
			// If chromedp fails, return the original HTML (better than nothing)
			return html, nil
		}
		return jsHTML, nil
	}

	return html, nil
}

// needsJavaScriptRendering checks if the HTML content indicates JS rendering is needed
func (s *ScraperService) needsJavaScriptRendering(html string) bool {
	lowerHTML := strings.ToLower(html)

	// Check for common SPA/ATS indicators
	indicators := []string{
		"data-func-widget",      // Workday/Phenom
		"loading...",            // Generic loading states
		"please wait",           // Loading states
		"app-root",              // Angular apps
		"__next",                // Next.js apps
		"root\"></div></body>",  // Empty React root
		"phenom",                // Phenom People ATS
		"workday",               // Workday ATS
		"greenhouse",            // Greenhouse ATS
		"lever.co",              // Lever ATS
		"icims",                 // iCIMS ATS
		"taleo",                 // Taleo ATS
		"successfactors",        // SAP SuccessFactors
	}

	for _, indicator := range indicators {
		if strings.Contains(lowerHTML, indicator) {
			return true
		}
	}

	// Check if body content is suspiciously short (less than 2KB of actual content)
	// This often indicates JS-rendered content
	bodyStart := strings.Index(lowerHTML, "<body")
	bodyEnd := strings.Index(lowerHTML, "</body>")
	if bodyStart > 0 && bodyEnd > bodyStart {
		bodyContent := html[bodyStart:bodyEnd]
		// Remove script and style tags content for size check
		bodyContent = removeTagContent(bodyContent, "script")
		bodyContent = removeTagContent(bodyContent, "style")
		if len(bodyContent) < 2000 {
			return true
		}
	}

	return false
}

// removeTagContent removes content between specified tags
func removeTagContent(html, tagName string) string {
	result := html
	for {
		startTag := "<" + tagName
		endTag := "</" + tagName + ">"
		start := strings.Index(strings.ToLower(result), startTag)
		if start == -1 {
			break
		}
		end := strings.Index(strings.ToLower(result[start:]), endTag)
		if end == -1 {
			break
		}
		result = result[:start] + result[start+end+len(endTag):]
	}
	return result
}

// scrapeWithColly fetches HTML using colly (fast, no JS)
func (s *ScraperService) scrapeWithColly(ctx context.Context, jobURL string) (string, error) {
	var html string
	var scrapeErr error

	c := colly.NewCollector(
		colly.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
		colly.AllowURLRevisit(),
	)

	// Set timeout from context
	c.SetRequestTimeout(30 * time.Second)

	// Handle response
	c.OnResponse(func(r *colly.Response) {
		html = string(r.Body)
	})

	// Handle errors
	c.OnError(func(r *colly.Response, err error) {
		if r != nil && r.StatusCode == 403 {
			scrapeErr = fmt.Errorf("access denied (403) - the website may be blocking scrapers")
		} else if r != nil && r.StatusCode == 404 {
			scrapeErr = fmt.Errorf("page not found (404) - the job posting may have been removed")
		} else if r != nil && r.StatusCode >= 500 {
			scrapeErr = fmt.Errorf("server error (%d) - please try again later", r.StatusCode)
		} else {
			scrapeErr = fmt.Errorf("failed to fetch page: %w", err)
		}
	})

	// Visit the URL
	if err := c.Visit(jobURL); err != nil {
		if scrapeErr != nil {
			return "", scrapeErr
		}
		return "", fmt.Errorf("failed to visit URL: %w", err)
	}

	if scrapeErr != nil {
		return "", scrapeErr
	}

	return html, nil
}

// scrapeWithChromedp fetches HTML using headless Chrome (handles JavaScript)
func (s *ScraperService) scrapeWithChromedp(ctx context.Context, jobURL string) (string, error) {
	// Build allocator options
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-extensions", true),
		chromedp.Flag("disable-background-networking", true),
		chromedp.Flag("disable-software-rasterizer", true),
		chromedp.Flag("disable-setuid-sandbox", true),
		chromedp.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
	)

	// Check for custom Chrome path (for Docker/Alpine)
	if chromePath := os.Getenv("CHROME_BIN"); chromePath != "" {
		opts = append(opts, chromedp.ExecPath(chromePath))
	}

	// Create a new context with timeout
	allocCtx, allocCancel := chromedp.NewExecAllocator(ctx, opts...)
	defer allocCancel()

	// Create browser context with timeout
	browserCtx, browserCancel := chromedp.NewContext(allocCtx)
	defer browserCancel()

	// Set overall timeout
	timeoutCtx, timeoutCancel := context.WithTimeout(browserCtx, 45*time.Second)
	defer timeoutCancel()

	var html string

	// Navigate and wait for content to load
	err := chromedp.Run(timeoutCtx,
		chromedp.Navigate(jobURL),
		// Wait for the page to be fully loaded
		chromedp.WaitReady("body"),
		// Additional wait for dynamic content to load
		chromedp.Sleep(3*time.Second),
		// Get the full HTML
		chromedp.OuterHTML("html", &html),
	)

	if err != nil {
		return "", fmt.Errorf("chromedp failed: %w", err)
	}

	return html, nil
}

// mapJobType maps common job type strings to our format
func (s *ScraperService) mapJobType(jobType string) string {
	jobType = strings.ToUpper(strings.TrimSpace(jobType))
	jobType = strings.ReplaceAll(jobType, "-", "_")
	jobType = strings.ReplaceAll(jobType, " ", "_")

	switch jobType {
	case "FULL_TIME", "FULLTIME", "FULL TIME":
		return "FULL_TIME"
	case "PART_TIME", "PARTTIME", "PART TIME":
		return "PART_TIME"
	case "CONTRACT", "CONTRACTOR":
		return "CONTRACT"
	case "FREELANCE", "FREELANCER":
		return "FREELANCE"
	case "INTERNSHIP", "INTERN":
		return "INTERNSHIP"
	default:
		if jobType != "" {
			return jobType
		}
		return "FULL_TIME" // Default
	}
}

// mapExperienceLevel maps common experience level strings to our format
func (s *ScraperService) mapExperienceLevel(level string) string {
	level = strings.ToUpper(strings.TrimSpace(level))

	switch level {
	case "ENTRY", "ENTRY_LEVEL", "ENTRY-LEVEL", "JUNIOR", "ASSOCIATE":
		return "ENTRY"
	case "MID", "MID_LEVEL", "MID-LEVEL", "INTERMEDIATE":
		return "MID"
	case "SENIOR", "SENIOR_LEVEL", "SENIOR-LEVEL", "SR", "SR.":
		return "SENIOR"
	case "LEAD", "PRINCIPAL", "STAFF":
		return "LEAD"
	case "EXECUTIVE", "DIRECTOR", "VP", "C-LEVEL", "C_LEVEL":
		return "EXECUTIVE"
	default:
		if level != "" {
			return level
		}
		return "MID" // Default
	}
}

// BulkScrapeJobs scrapes multiple job URLs and returns results
func (s *ScraperService) BulkScrapeJobs(ctx context.Context, urls []string) *dto.BulkScrapeResponse {
	results := make([]dto.BulkScrapeResult, len(urls))
	successCount := 0
	failedCount := 0

	for i, jobURL := range urls {
		scrapedJob, _, err := s.ScrapeJobURL(ctx, jobURL)
		if err != nil {
			results[i] = dto.BulkScrapeResult{
				URL:     jobURL,
				Success: false,
				Error:   err.Error(),
			}
			failedCount++
		} else {
			results[i] = dto.BulkScrapeResult{
				URL:        jobURL,
				Success:    true,
				ScrapedJob: scrapedJob,
			}
			successCount++
		}

		// Add delay between requests to be respectful
		if i < len(urls)-1 {
			time.Sleep(2 * time.Second)
		}
	}

	return &dto.BulkScrapeResponse{
		Results: results,
		Total:   len(urls),
		Success: successCount,
		Failed:  failedCount,
	}
}
