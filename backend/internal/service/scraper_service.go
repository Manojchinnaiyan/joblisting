package service

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"job-platform/internal/dto"
	"log"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/PuerkitoBio/goquery"
	"github.com/chromedp/cdproto/network"
	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
	"github.com/gocolly/colly/v2"
	"golang.org/x/net/html"
)

// ScraperService handles web scraping for job postings
type ScraperService struct {
	aiService             *AIService
	httpClient            *http.Client
	flareSolverrURL       string
	lastCapturedRequests  map[string]*CapturedAPIRequest // Stores captured API requests for pagination
}

// FlareSolverr request/response types
type flareSolverrRequest struct {
	Cmd        string `json:"cmd"`
	URL        string `json:"url"`
	MaxTimeout int    `json:"maxTimeout"`
}

type flareSolverrResponse struct {
	Status   string `json:"status"`
	Message  string `json:"message"`
	Solution struct {
		URL       string `json:"url"`
		Status    int    `json:"status"`
		Response  string `json:"response"`
		Cookies   []struct {
			Name   string `json:"name"`
			Value  string `json:"value"`
			Domain string `json:"domain"`
		} `json:"cookies"`
		UserAgent string `json:"userAgent"`
	} `json:"solution"`
}

// NewScraperService creates a new scraper service instance
func NewScraperService(aiService *AIService) *ScraperService {
	// Check for FlareSolverr URL (Docker: job_flaresolverr, local: localhost)
	flareSolverrURL := os.Getenv("FLARESOLVERR_URL")
	if flareSolverrURL == "" {
		flareSolverrURL = "http://localhost:8191/v1"
	}

	return &ScraperService{
		aiService: aiService,
		httpClient: &http.Client{
			Timeout: 120 * time.Second, // Longer timeout for FlareSolverr
		},
		flareSolverrURL: flareSolverrURL,
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

	var html string
	var apiJobData map[string]interface{}

	// Check if this is a known SPA site that requires API capture
	if s.isSPAJobDetailSite(jobURL) {
		// For SPA sites, use chromedp with network capture to get API data
		log.Printf("🔄 Detected SPA site, using network capture for: %s", jobURL)
		spaHTML, capturedData, spaErr := s.scrapeJobDetailWithNetworkCapture(ctx, jobURL)
		if spaErr != nil {
			log.Printf("⚠️ SPA scrape failed: %v, falling back to regular scrape", spaErr)
		} else {
			html = spaHTML
			if capturedData != nil {
				apiJobData = capturedData
				log.Printf("✅ Captured API job data for SPA site")
			}
		}
	}

	// If we don't have HTML yet, scrape it
	if html == "" {
		var scrapeErr error
		html, scrapeErr = s.scrapeHTML(ctx, jobURL)
		if scrapeErr != nil {
			return nil, nil, fmt.Errorf("failed to scrape page: %w", scrapeErr)
		}
	}

	if len(html) < 100 {
		return nil, nil, fmt.Errorf("page content too short, might be blocked or empty")
	}

	// Check if AI service is configured
	if !s.aiService.IsConfigured() {
		return nil, nil, fmt.Errorf("AI service not configured: ANTHROPIC_API_KEY environment variable not set")
	}

	// If we have API job data, convert it to extracted job format
	var extractedJob *ExtractedJob
	if apiJobData != nil {
		extractedJob = s.convertAPIDataToExtractedJob(apiJobData, jobURL)
		log.Printf("📋 Converted API data: title=%s, location=%s", extractedJob.Title, extractedJob.Location)
	}

	// Extract job details using AI (will enhance API data if available)
	if extractedJob == nil || extractedJob.Title == "" || extractedJob.Description == "" {
		aiExtracted, aiErr := s.aiService.ExtractJobFromHTML(ctx, html, jobURL)
		if aiErr != nil {
			if extractedJob != nil && extractedJob.Title != "" {
				// Use API data even if AI fails
				log.Printf("⚠️ AI extraction failed but have API data: %v", aiErr)
			} else {
				return nil, nil, fmt.Errorf("failed to extract job details: %w", aiErr)
			}
		} else {
			// Merge AI data with API data (API data takes precedence for structured fields)
			if extractedJob == nil {
				extractedJob = aiExtracted
			} else {
				// Fill in missing fields from AI
				if extractedJob.Description == "" {
					extractedJob.Description = aiExtracted.Description
				}
				if extractedJob.Requirements == "" {
					extractedJob.Requirements = aiExtracted.Requirements
				}
				if len(extractedJob.Skills) == 0 {
					extractedJob.Skills = aiExtracted.Skills
				}
				if len(extractedJob.Benefits) == 0 {
					extractedJob.Benefits = aiExtracted.Benefits
				}
				if extractedJob.Salary == "" {
					extractedJob.Salary = aiExtracted.Salary
				}
			}
		}
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
// It tries: colly (fast) -> chromedp (JS) -> FlareSolverr (Cloudflare bypass)
func (s *ScraperService) scrapeHTML(ctx context.Context, jobURL string) (string, error) {
	// First try with colly (faster for static pages)
	html, err := s.scrapeWithColly(ctx, jobURL)
	if err != nil {
		// If we got a 403/blocking error, try with headless browser which is harder to detect
		if strings.Contains(err.Error(), "403") || strings.Contains(err.Error(), "blocking") {
			log.Printf("⚠️ Colly blocked (403), falling back to ChromeDP for: %s", jobURL)
			jsHTML, jsErr := s.scrapeWithChromedp(ctx, jobURL)
			if jsErr != nil {
				// If chromedp also fails (Cloudflare), try FlareSolverr
				if strings.Contains(jsErr.Error(), "cloudflare") {
					log.Printf("⚠️ ChromeDP blocked by Cloudflare, trying FlareSolverr for: %s", jobURL)
					fsHTML, fsErr := s.scrapeWithFlareSolverr(ctx, jobURL)
					if fsErr != nil {
						return "", fmt.Errorf("all methods failed: colly: %v, chromedp: %v, flaresolverr: %v", err, jsErr, fsErr)
					}
					return fsHTML, nil
				}
				return "", fmt.Errorf("both colly and chromedp failed: colly: %v, chromedp: %v", err, jsErr)
			}
			return jsHTML, nil
		}
		return "", err
	}

	// Check if the page content looks like it needs JavaScript rendering
	// Common indicators: empty body, placeholder widgets, or very short content
	if s.needsJavaScriptRendering(html) {
		// Fall back to headless browser
		jsHTML, jsErr := s.scrapeWithChromedp(ctx, jobURL)
		if jsErr != nil {
			// If chromedp fails with Cloudflare, try FlareSolverr
			if strings.Contains(jsErr.Error(), "cloudflare") {
				log.Printf("⚠️ ChromeDP blocked by Cloudflare, trying FlareSolverr for: %s", jobURL)
				fsHTML, fsErr := s.scrapeWithFlareSolverr(ctx, jobURL)
				if fsErr == nil {
					return fsHTML, nil
				}
			}
			// If chromedp fails, return the original HTML (better than nothing)
			return html, nil
		}
		return jsHTML, nil
	}

	return html, nil
}

// scrapeWithFlareSolverr uses FlareSolverr to bypass Cloudflare protection
func (s *ScraperService) scrapeWithFlareSolverr(ctx context.Context, jobURL string) (string, error) {
	reqBody := flareSolverrRequest{
		Cmd:        "request.get",
		URL:        jobURL,
		MaxTimeout: 60000, // 60 seconds
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.flareSolverrURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("flaresolverr request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	var fsResp flareSolverrResponse
	if err := json.Unmarshal(body, &fsResp); err != nil {
		return "", fmt.Errorf("failed to parse response: %w", err)
	}

	if fsResp.Status != "ok" {
		return "", fmt.Errorf("flaresolverr error: %s", fsResp.Message)
	}

	if fsResp.Solution.Response == "" {
		return "", fmt.Errorf("flaresolverr returned empty response")
	}

	log.Printf("✅ FlareSolverr successfully bypassed Cloudflare for: %s", jobURL)
	return fsResp.Solution.Response, nil
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
		colly.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"),
		colly.AllowURLRevisit(),
	)

	// Set timeout from context
	c.SetRequestTimeout(30 * time.Second)

	// Add realistic browser headers to avoid detection
	c.OnRequest(func(r *colly.Request) {
		r.Headers.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8")
		r.Headers.Set("Accept-Language", "en-US,en;q=0.9")
		r.Headers.Set("Accept-Encoding", "gzip, deflate, br")
		r.Headers.Set("Connection", "keep-alive")
		r.Headers.Set("Upgrade-Insecure-Requests", "1")
		r.Headers.Set("Sec-Fetch-Dest", "document")
		r.Headers.Set("Sec-Fetch-Mode", "navigate")
		r.Headers.Set("Sec-Fetch-Site", "none")
		r.Headers.Set("Sec-Fetch-User", "?1")
		r.Headers.Set("Sec-Ch-Ua", `"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"`)
		r.Headers.Set("Sec-Ch-Ua-Mobile", "?0")
		r.Headers.Set("Sec-Ch-Ua-Platform", `"Windows"`)
		r.Headers.Set("Cache-Control", "max-age=0")
	})

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
	// Build allocator options with enhanced anti-detection
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", "new"), // Use new headless mode (harder to detect)
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-extensions", true),
		chromedp.Flag("disable-background-networking", true),
		chromedp.Flag("disable-software-rasterizer", true),
		chromedp.Flag("disable-setuid-sandbox", true),
		chromedp.Flag("disable-blink-features", "AutomationControlled"), // Hide automation
		chromedp.Flag("exclude-switches", "enable-automation"),          // Remove automation switch
		chromedp.Flag("disable-infobars", true),                         // Hide "Chrome is being controlled" bar
		chromedp.WindowSize(1920, 1080),                                 // Realistic window size
		chromedp.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"),
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

	// Set overall timeout (longer to handle Cloudflare challenges)
	timeoutCtx, timeoutCancel := context.WithTimeout(browserCtx, 60*time.Second)
	defer timeoutCancel()

	var html string

	// Navigate and wait for content to load with anti-detection scripts
	err := chromedp.Run(timeoutCtx,
		// Inject anti-detection scripts before navigation
		chromedp.ActionFunc(func(ctx context.Context) error {
			// Override navigator.webdriver to hide automation
			return chromedp.Evaluate(`
				Object.defineProperty(navigator, 'webdriver', {
					get: () => undefined
				});
				// Override Chrome automation properties
				window.chrome = {
					runtime: {}
				};
				// Override permissions
				const originalQuery = window.navigator.permissions.query;
				window.navigator.permissions.query = (parameters) => (
					parameters.name === 'notifications' ?
						Promise.resolve({ state: Notification.permission }) :
						originalQuery(parameters)
				);
			`, nil).Do(ctx)
		}),
		chromedp.Navigate(jobURL),
		// Wait for the page to be fully loaded
		chromedp.WaitReady("body"),
		// Wait for Cloudflare challenge to complete (if present)
		chromedp.ActionFunc(func(ctx context.Context) error {
			return s.waitForCloudflareChallenge(ctx)
		}),
		// Get the full HTML
		chromedp.OuterHTML("html", &html),
	)

	if err != nil {
		return "", fmt.Errorf("chromedp failed: %w", err)
	}

	// Check if we're still on a Cloudflare page
	if s.isCloudflareChallengePage(html) {
		return "", fmt.Errorf("cloudflare protection detected - site requires manual verification")
	}

	return html, nil
}

// waitForCloudflareChallenge waits for Cloudflare challenge to complete
func (s *ScraperService) waitForCloudflareChallenge(ctx context.Context) error {
	// Check for Cloudflare challenge indicators and wait for them to resolve
	for i := 0; i < 10; i++ { // Max 10 iterations (~10 seconds)
		var isChallenge bool
		err := chromedp.Evaluate(`
			(function() {
				// Check for Cloudflare challenge indicators
				const html = document.documentElement.outerHTML.toLowerCase();
				const title = document.title.toLowerCase();

				// Cloudflare challenge indicators
				const indicators = [
					'checking your browser',
					'just a moment',
					'please wait',
					'cf-browser-verification',
					'cf_chl_prog',
					'challenge-running',
					'ray id'
				];

				for (const indicator of indicators) {
					if (html.includes(indicator) || title.includes(indicator)) {
						return true;
					}
				}
				return false;
			})()
		`, &isChallenge).Do(ctx)

		if err != nil {
			return err
		}

		if !isChallenge {
			// Challenge complete or no challenge present
			return nil
		}

		// Wait a bit and check again
		time.Sleep(1 * time.Second)
	}

	return nil // Continue anyway after max wait
}

// isCloudflareChallengePage checks if the HTML is a Cloudflare challenge page
func (s *ScraperService) isCloudflareChallengePage(html string) bool {
	lowerHTML := strings.ToLower(html)
	indicators := []string{
		"checking your browser",
		"just a moment",
		"cf-browser-verification",
		"challenge-platform",
		"cloudflare ray id",
		"verify you are human",
	}

	for _, indicator := range indicators {
		if strings.Contains(lowerHTML, indicator) {
			return true
		}
	}
	return false
}

// waitForJobListings waits for job listing content to load on dynamic pages
func (s *ScraperService) waitForJobListings(ctx context.Context) error {
	// Wait for common job listing indicators to appear
	// This handles sites that load job cards via AJAX
	for i := 0; i < 15; i++ { // Max 15 iterations (~15 seconds)
		var hasJobContent bool
		err := chromedp.Evaluate(`
			(function() {
				const html = document.documentElement.outerHTML.toLowerCase();

				// Check for common job listing indicators
				const indicators = [
					// Job card elements
					'job-card',
					'job-listing',
					'job-result',
					'job-item',
					'position-card',
					'career-card',
					'vacancy-card',
					'search-result-item',
					'requisition-card',
					// Common class patterns
					'jobsearch',
					'job-search-result',
					'jobs-list',
					'job-list-item',
					// Data attributes
					'data-job-id',
					'data-requisition',
					'data-job',
					// Common job URL patterns in href
					'/job/',
					'/jobs/',
					'/position/',
					'/career/',
					// Job titles pattern
					'<h2',
					'<h3',
					'job-title',
					'position-title'
				];

				for (const indicator of indicators) {
					if (html.includes(indicator)) {
						return true;
					}
				}

				// Also check if there are any list items that could be jobs
				const listItems = document.querySelectorAll('li, article, div[role="listitem"]');
				if (listItems.length > 5) {
					return true;
				}

				return false;
			})()
		`, &hasJobContent).Do(ctx)

		if err != nil {
			return err
		}

		if hasJobContent {
			log.Printf("✅ Job listings content detected")
			return nil
		}

		// Wait a bit and check again
		time.Sleep(1 * time.Second)
	}

	log.Printf("⚠️ No job listing content detected after waiting, proceeding anyway")
	return nil // Continue anyway after max wait
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

// ExtractJobLinks extracts job links from a listing page with pagination support
func (s *ScraperService) ExtractJobLinks(ctx context.Context, listingURL string) (result *dto.ExtractLinksResponse, err error) {
	// Panic recovery
	defer func() {
		if r := recover(); r != nil {
			log.Printf("❌ PANIC in ExtractJobLinks: %v", r)
			err = fmt.Errorf("panic during extraction: %v", r)
		}
	}()

	log.Printf("📋 ExtractJobLinks: Starting for URL: %s", listingURL)

	// Parse the base URL to construct absolute URLs
	parsedURL, err := url.Parse(listingURL)
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %w", err)
	}
	baseURL := fmt.Sprintf("%s://%s", parsedURL.Scheme, parsedURL.Host)

	// Collect all job links across pages
	allLinks := make(map[string]dto.ExtractedJobLink) // Use map for deduplication
	maxPages := 10                                     // Limit to prevent infinite loops
	currentURL := listingURL

	for page := 1; page <= maxPages; page++ {
		log.Printf("🌐 Scraping page %d: %s", page, currentURL)

		var html string
		var scrapeErr error

		// Try scraping methods in order: colly -> chromedp -> FlareSolverr
		html, scrapeErr = s.scrapeWithColly(ctx, currentURL)
		if scrapeErr != nil {
			// If colly fails (403 or other error), fall back to ChromeDP with pagination support
			log.Printf("⚠️ Colly failed for page %d: %v, trying ChromeDP...", page, scrapeErr)
			html, scrapeErr = s.scrapeListingPageWithPagination(ctx, currentURL, page)
			if scrapeErr != nil {
				// If ChromeDP fails with Cloudflare, try FlareSolverr
				if strings.Contains(scrapeErr.Error(), "cloudflare") {
					log.Printf("⚠️ ChromeDP blocked by Cloudflare for page %d, trying FlareSolverr...", page)
					html, scrapeErr = s.scrapeWithFlareSolverr(ctx, currentURL)
				}
				if scrapeErr != nil {
					if page == 1 {
						return nil, fmt.Errorf("failed to scrape listing page: %w", scrapeErr)
					}
					// Non-first page failed, just stop pagination
					log.Printf("⚠️ Page %d scrape failed, stopping: %v", page, scrapeErr)
					break
				}
			}
		} else {
			// Colly succeeded, but check if it needs JS rendering
			if s.needsJavaScriptRendering(html) {
				log.Printf("⚠️ Page %d needs JS rendering, using ChromeDP...", page)
				jsHTML, jsErr := s.scrapeListingPageWithPagination(ctx, currentURL, page)
				if jsErr != nil && strings.Contains(jsErr.Error(), "cloudflare") {
					// Try FlareSolverr for Cloudflare-protected pages
					log.Printf("⚠️ ChromeDP blocked by Cloudflare, trying FlareSolverr...")
					jsHTML, jsErr = s.scrapeWithFlareSolverr(ctx, currentURL)
				}
				if jsErr == nil {
					html = jsHTML
				}
			}
		}

		log.Printf("✅ Page %d scraped, HTML size: %d bytes", page, len(html))

		// Extract job links from this page
		links, extractErr := s.aiService.ExtractJobLinksFromHTML(ctx, html, baseURL)
		if extractErr != nil {
			log.Printf("⚠️ Failed to extract links from page %d: %v", page, extractErr)
			if page == 1 {
				return nil, fmt.Errorf("failed to extract job links: %w", extractErr)
			}
			break
		}

		// Add new links to our collection
		newLinksCount := 0
		for _, link := range links {
			if _, exists := allLinks[link.URL]; !exists {
				allLinks[link.URL] = link
				newLinksCount++
			}
		}
		log.Printf("📊 Page %d: found %d links (%d new)", page, len(links), newLinksCount)

		// If we found no new links, we've probably reached the end
		if newLinksCount == 0 && page > 1 {
			log.Printf("🛑 No new links found on page %d, stopping pagination", page)
			break
		}

		// Try to find next page URL
		nextURL := s.findNextPageURL(html, currentURL, baseURL, page)
		if nextURL == "" {
			log.Printf("🛑 No next page found after page %d", page)
			break
		}

		currentURL = nextURL
		// Small delay between pages to be respectful
		time.Sleep(1 * time.Second)
	}

	// Convert map to slice
	var finalLinks []dto.ExtractedJobLink
	for _, link := range allLinks {
		finalLinks = append(finalLinks, link)
	}

	log.Printf("✅ ExtractJobLinks completed: found %d total unique links", len(finalLinks))

	return &dto.ExtractLinksResponse{
		Success:   true,
		SourceURL: listingURL,
		Links:     finalLinks,
		Total:     len(finalLinks),
	}, nil
}

// findNextPageURL tries to find the URL for the next page of results
func (s *ScraperService) findNextPageURL(htmlContent string, currentURL string, baseURL string, currentPage int) string {
	parsedCurrent, _ := url.Parse(currentURL)
	q := parsedCurrent.Query()

	// Strategy 1: Handle common offset/from patterns first (most reliable)
	// Many modern sites use ?from=0, ?from=10, ?from=20 pattern
	if q.Has("from") {
		currentFrom := 0
		fmt.Sscanf(q.Get("from"), "%d", &currentFrom)
		// Assume 10 items per page (common default)
		q.Set("from", fmt.Sprintf("%d", currentFrom+10))
		parsedCurrent.RawQuery = q.Encode()
		log.Printf("📄 Next page URL (from pattern): %s", parsedCurrent.String())
		return parsedCurrent.String()
	}

	// Strategy 2: Handle offset parameter
	if q.Has("offset") {
		currentOffset := 0
		fmt.Sscanf(q.Get("offset"), "%d", &currentOffset)
		q.Set("offset", fmt.Sprintf("%d", currentOffset+10))
		parsedCurrent.RawQuery = q.Encode()
		log.Printf("📄 Next page URL (offset pattern): %s", parsedCurrent.String())
		return parsedCurrent.String()
	}

	// Strategy 3: Handle page number parameter
	pageParams := []string{"page", "p", "pg", "pageNumber", "pageNo"}
	for _, param := range pageParams {
		if q.Has(param) {
			currentPage := 1
			fmt.Sscanf(q.Get(param), "%d", &currentPage)
			q.Set(param, fmt.Sprintf("%d", currentPage+1))
			parsedCurrent.RawQuery = q.Encode()
			log.Printf("📄 Next page URL (page pattern): %s", parsedCurrent.String())
			return parsedCurrent.String()
		}
	}

	// Strategy 4: Handle start parameter (some sites use start=0, start=10, etc.)
	if q.Has("start") {
		currentStart := 0
		fmt.Sscanf(q.Get("start"), "%d", &currentStart)
		q.Set("start", fmt.Sprintf("%d", currentStart+10))
		parsedCurrent.RawQuery = q.Encode()
		log.Printf("📄 Next page URL (start pattern): %s", parsedCurrent.String())
		return parsedCurrent.String()
	}

	// Strategy 5: Parse HTML to find actual next page links
	doc, err := html.Parse(strings.NewReader(htmlContent))
	if err != nil {
		return ""
	}

	// Look for pagination links with href containing page/from/offset patterns
	var findPaginationLink func(*html.Node) string
	findPaginationLink = func(n *html.Node) string {
		if n.Type == html.ElementNode && n.Data == "a" {
			href := ""
			text := strings.TrimSpace(getHTMLNodeText(n))
			ariaLabel := ""

			for _, attr := range n.Attr {
				switch attr.Key {
				case "href":
					href = attr.Val
				case "aria-label":
					ariaLabel = strings.ToLower(attr.Val)
				}
			}

			// Skip empty or javascript hrefs
			if href == "" || href == "#" || strings.HasPrefix(href, "javascript:") {
				goto next
			}

			// Check for "next page" aria-label (common accessibility pattern)
			if strings.Contains(ariaLabel, "next") && strings.Contains(ariaLabel, "page") {
				resolved := resolveURLString(href, baseURL)
				log.Printf("📄 Found next page link (aria-label): %s", resolved)
				return resolved
			}

			// Check if link text is exactly the next page number
			nextPageStr := fmt.Sprintf("%d", currentPage+1)
			if text == nextPageStr {
				resolved := resolveURLString(href, baseURL)
				log.Printf("📄 Found page %d link: %s", currentPage+1, resolved)
				return resolved
			}
		}

	next:
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			if result := findPaginationLink(c); result != "" {
				return result
			}
		}
		return ""
	}

	if pageURL := findPaginationLink(doc); pageURL != "" {
		return pageURL
	}

	// Strategy 6: If no pagination params exist, try adding common ones for first pagination
	if currentPage == 1 {
		// Try adding ?from=10 (common pattern for page 2)
		q.Set("from", "10")
		parsedCurrent.RawQuery = q.Encode()
		log.Printf("📄 Trying first pagination with from=10: %s", parsedCurrent.String())
		return parsedCurrent.String()
	}

	log.Printf("📄 No pagination pattern found for page %d", currentPage+1)
	return ""
}

// getHTMLNodeText extracts text content from an HTML node
func getHTMLNodeText(n *html.Node) string {
	var text strings.Builder
	var traverse func(*html.Node)
	traverse = func(node *html.Node) {
		if node.Type == html.TextNode {
			text.WriteString(node.Data)
		}
		for c := node.FirstChild; c != nil; c = c.NextSibling {
			traverse(c)
		}
	}
	traverse(n)
	return text.String()
}

// resolveURLString resolves a relative URL against a base URL
func resolveURLString(href string, baseURL string) string {
	if strings.HasPrefix(href, "http://") || strings.HasPrefix(href, "https://") {
		return href
	}
	base, err := url.Parse(baseURL)
	if err != nil {
		return ""
	}
	ref, err := url.Parse(href)
	if err != nil {
		return ""
	}
	return base.ResolveReference(ref).String()
}

// scrapeListingPageWithPagination scrapes a listing page with scroll and click behavior
func (s *ScraperService) scrapeListingPageWithPagination(ctx context.Context, listingURL string, pageNum int) (string, error) {
	// Build allocator options with enhanced anti-detection
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", "new"), // Use new headless mode (harder to detect)
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-extensions", true),
		chromedp.Flag("disable-background-networking", true),
		chromedp.Flag("disable-software-rasterizer", true),
		chromedp.Flag("disable-setuid-sandbox", true),
		chromedp.Flag("disable-blink-features", "AutomationControlled"), // Hide automation
		chromedp.Flag("exclude-switches", "enable-automation"),          // Remove automation switch
		chromedp.Flag("disable-infobars", true),                         // Hide "Chrome is being controlled" bar
		chromedp.WindowSize(1920, 1080),                                 // Realistic window size
		chromedp.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"),
	)

	// Check for custom Chrome path (for Docker/Alpine)
	if chromePath := os.Getenv("CHROME_BIN"); chromePath != "" {
		opts = append(opts, chromedp.ExecPath(chromePath))
	}

	allocCtx, allocCancel := chromedp.NewExecAllocator(ctx, opts...)
	defer allocCancel()

	browserCtx, browserCancel := chromedp.NewContext(allocCtx)
	defer browserCancel()

	timeoutCtx, timeoutCancel := context.WithTimeout(browserCtx, 60*time.Second)
	defer timeoutCancel()

	var htmlContent string

	// Navigate and scroll to load lazy content with anti-detection
	err := chromedp.Run(timeoutCtx,
		// Inject anti-detection scripts before navigation
		chromedp.ActionFunc(func(ctx context.Context) error {
			return chromedp.Evaluate(`
				Object.defineProperty(navigator, 'webdriver', {
					get: () => undefined
				});
				window.chrome = { runtime: {} };
			`, nil).Do(ctx)
		}),
		chromedp.Navigate(listingURL),
		chromedp.WaitReady("body"),
		// Wait for Cloudflare challenge to complete (if present)
		chromedp.ActionFunc(func(ctx context.Context) error {
			return s.waitForCloudflareChallenge(ctx)
		}),
		// Wait for dynamic content to load (job cards, listings, etc.)
		chromedp.ActionFunc(func(ctx context.Context) error {
			return s.waitForJobListings(ctx)
		}),
		// Scroll to load lazy content
		chromedp.Evaluate(`
			(async () => {
				const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
				for (let i = 0; i < 5; i++) {
					window.scrollTo(0, document.body.scrollHeight * (i + 1) / 5);
					await delay(500);
				}
				window.scrollTo(0, 0);
			})()
		`, nil),
		chromedp.Sleep(3*time.Second), // Wait longer for AJAX content
		chromedp.OuterHTML("html", &htmlContent),
	)

	if err != nil {
		return "", fmt.Errorf("chromedp pagination scrape failed: %w", err)
	}

	// Check if we're still on a Cloudflare page
	if s.isCloudflareChallengePage(htmlContent) {
		return "", fmt.Errorf("cloudflare protection detected - site requires manual verification")
	}

	return htmlContent, nil
}

// APIJobListing represents job data extracted from an API response
type APIJobListing struct {
	ID          string                 `json:"id"`
	Title       string                 `json:"title"`
	URL         string                 `json:"url"`
	Company     string                 `json:"company"`
	Location    string                 `json:"location"`
	Department  string                 `json:"department"`
	Description string                 `json:"description"`
	RawData     map[string]interface{} `json:"raw_data"`
}

// PageAnalysisResult represents the result of analyzing a career page
type PageAnalysisResult struct {
	SourceType       string                 `json:"source_type"`        // "api", "html", "mixed"
	JobLoadingMethod string                 `json:"job_loading_method"` // "static", "ajax", "iframe", "api", "unknown"
	APIEndpoints     []string               `json:"api_endpoints"`      // Detected API endpoints
	APIJobListings   []APIJobListing        `json:"api_job_listings"`   // Jobs from API
	HTMLJobLinks     []dto.ExtractedJobLink `json:"html_job_links"`     // Jobs from HTML
	TotalJobs        int                    `json:"total_jobs"`
	HasPagination    bool                   `json:"has_pagination"`
	PaginationType   string                 `json:"pagination_type"`    // "offset", "cursor", "page", "none"
	TotalFromAPI     int                    `json:"total_from_api"`     // Total count reported by API
}

// APIPaginationInfo holds detected pagination information from an API response
type APIPaginationInfo struct {
	TotalCount     int                    `json:"total_count"`
	PageSize       int                    `json:"page_size"`
	CurrentPage    int                    `json:"current_page"`
	CurrentOffset  int                    `json:"current_offset"`
	HasMore        bool                   `json:"has_more"`
	PaginationType string                 `json:"pagination_type"` // "offset", "page", "cursor"
	NextCursor     string                 `json:"next_cursor"`
	OriginalURL    string                 `json:"original_url"`
	RequestMethod  string                 `json:"request_method"`  // GET or POST
	RequestBody    string                 `json:"request_body"`    // For POST requests (JSON string)
	RequestHeaders map[string]string      `json:"request_headers"` // Original request headers
}

// CapturedAPIRequest stores info about a captured API request
type CapturedAPIRequest struct {
	URL          string
	Method       string
	PostData     string
	Headers      map[string]string
	ResponseBody string
}

// AnalyzeCareerPage analyzes a career page to detect job source type and extract jobs
// This method intercepts network requests to detect API calls and extract job data
func (s *ScraperService) AnalyzeCareerPage(ctx context.Context, pageURL string) (*PageAnalysisResult, error) {
	log.Printf("🔍 AnalyzeCareerPage: Starting analysis for %s", pageURL)

	result := &PageAnalysisResult{
		SourceType:     "html", // Default to HTML
		APIEndpoints:   []string{},
		APIJobListings: []APIJobListing{},
		HTMLJobLinks:   []dto.ExtractedJobLink{},
	}

	// Parse base URL
	parsedURL, err := url.Parse(pageURL)
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %w", err)
	}
	baseURL := fmt.Sprintf("%s://%s", parsedURL.Scheme, parsedURL.Host)

	// Use ChromeDP with network interception to capture API calls
	apiResponses, htmlContent, err := s.scrapeWithNetworkCapture(ctx, pageURL)
	if err != nil {
		log.Printf("⚠️ Network capture failed, falling back to HTML-only: %v", err)
		// Fall back to regular HTML scraping
		htmlContent, err = s.scrapeHTML(ctx, pageURL)
		if err != nil {
			return nil, fmt.Errorf("failed to scrape page: %w", err)
		}
	}

	// Analyze captured API responses for job data and pagination
	// Since we clicked through pagination, we should have multiple API responses captured
	var bestPaginationInfo *APIPaginationInfo
	seenJobIDs := make(map[string]bool) // Track unique jobs by ID or URL

	if len(apiResponses) > 0 {
		log.Printf("📊 Processing %d captured API responses", len(apiResponses))
		for endpoint, responseBody := range apiResponses {
			jobs := s.extractJobsFromAPIResponse(responseBody, baseURL)
			if len(jobs) > 0 {
				log.Printf("✅ Found %d jobs from API endpoint: %s", len(jobs), endpoint)
				result.APIEndpoints = append(result.APIEndpoints, endpoint)

				// Detect pagination info (for reporting)
				paginationInfo := s.detectAPIPagination(responseBody, endpoint)
				if paginationInfo != nil {
					log.Printf("📊 API reports total: %d, pageSize: %d, type: %s",
						paginationInfo.TotalCount, paginationInfo.PageSize, paginationInfo.PaginationType)

					// Keep track of the best pagination info
					if bestPaginationInfo == nil || paginationInfo.TotalCount > bestPaginationInfo.TotalCount {
						bestPaginationInfo = paginationInfo
					}
					result.TotalFromAPI = paginationInfo.TotalCount
					result.HasPagination = paginationInfo.HasMore || paginationInfo.TotalCount > len(jobs)
					result.PaginationType = paginationInfo.PaginationType
				}

				// Add unique jobs only (de-duplicate by ID or URL)
				for _, job := range jobs {
					jobKey := job.ID
					if jobKey == "" {
						jobKey = job.URL
					}
					if jobKey == "" {
						jobKey = job.Title // Last resort
					}
					if jobKey != "" && !seenJobIDs[jobKey] {
						seenJobIDs[jobKey] = true
						result.APIJobListings = append(result.APIJobListings, job)
					}
				}
			}
		}
		log.Printf("📊 Total unique API jobs extracted: %d", len(result.APIJobListings))
	}

	// If browser pagination clicking didn't capture all jobs, try API replay as fallback
	if bestPaginationInfo != nil && bestPaginationInfo.TotalCount > len(result.APIJobListings) {
		log.Printf("ℹ️ API reports %d total jobs, we extracted %d from captured responses",
			bestPaginationInfo.TotalCount, len(result.APIJobListings))

		// Calculate how many we're missing
		missingJobs := bestPaginationInfo.TotalCount - len(result.APIJobListings)
		capturedPercentage := float64(len(result.APIJobListings)) / float64(bestPaginationInfo.TotalCount) * 100

		log.Printf("📊 Missing %d jobs (captured %.1f%% of total)", missingJobs, capturedPercentage)

		// If we captured less than 80% of jobs, try to fetch remaining via API replay
		if capturedPercentage < 80 {
			log.Printf("🔄 Attempting API replay to fetch remaining jobs...")
			allJobs, err := s.fetchAllPaginatedJobs(ctx, bestPaginationInfo, result.APIJobListings, baseURL)
			if err != nil {
				log.Printf("⚠️ API replay failed: %v", err)
			} else if len(allJobs) > len(result.APIJobListings) {
				log.Printf("✅ API replay fetched %d additional jobs (total: %d)", len(allJobs)-len(result.APIJobListings), len(allJobs))
				result.APIJobListings = allJobs
			}
		}
	}

	// Also extract HTML links as fallback
	if htmlContent != "" {
		links, err := s.aiService.ExtractJobLinksFromHTML(ctx, htmlContent, baseURL)
		if err == nil {
			result.HTMLJobLinks = links
		}

		// Analyze page structure to understand job loading method
		analysis := s.aiService.DetectJobLoadingMethod(htmlContent, baseURL)
		if analysis != nil {
			result.JobLoadingMethod = analysis.JobLoadingMethod
			if analysis.JobLoadingMethod != "unknown" && analysis.JobLoadingMethod != "static" {
				log.Printf("📋 Page analysis: jobs loaded via %s (endpoint: %s, pagination: %s)",
					analysis.JobLoadingMethod, analysis.AJAXEndpoint, analysis.PaginationType)
			}
		}
	}

	// Match API jobs with HTML links by title to get correct URLs
	// This helps when API doesn't provide URLs but HTML does
	if len(result.APIJobListings) > 0 && len(result.HTMLJobLinks) > 0 {
		titleToURL := make(map[string]string)
		for _, link := range result.HTMLJobLinks {
			// Normalize title for matching
			normalizedTitle := strings.ToLower(strings.TrimSpace(link.Title))
			if normalizedTitle != "" {
				titleToURL[normalizedTitle] = link.URL
			}
		}

		for i := range result.APIJobListings {
			if result.APIJobListings[i].URL == "" {
				normalizedTitle := strings.ToLower(strings.TrimSpace(result.APIJobListings[i].Title))
				if url, found := titleToURL[normalizedTitle]; found {
					result.APIJobListings[i].URL = url
					log.Printf("✅ Matched API job '%s' with HTML URL: %s", result.APIJobListings[i].Title, url)
				}
			}
		}
	}

	// Determine source type based on what we found
	if len(result.APIJobListings) > 0 && len(result.HTMLJobLinks) > 0 {
		result.SourceType = "mixed"
	} else if len(result.APIJobListings) > 0 {
		result.SourceType = "api"
	} else {
		result.SourceType = "html"
	}

	// Calculate total unique jobs - prefer jobs with URLs
	jobURLs := make(map[string]bool)
	for _, job := range result.APIJobListings {
		if job.URL != "" {
			jobURLs[job.URL] = true
		}
	}
	// Only add HTML links if:
	// 1. We have API jobs (HTML provides additional context)
	// 2. OR we have no API jobs and HTML links look like real job pages (contain job patterns)
	if len(result.APIJobListings) > 0 {
		// We have API jobs, use HTML links for URL matching only (already done above)
		// Don't add them as separate jobs
	} else if len(result.HTMLJobLinks) > 0 {
		// No API jobs, check if HTML links look legitimate
		// Only count them if they have proper job URL patterns
		validHTMLJobs := 0
		for _, link := range result.HTMLJobLinks {
			lowerURL := strings.ToLower(link.URL)
			// Must have clear job patterns
			hasJobPattern := strings.Contains(lowerURL, "/job/") ||
				strings.Contains(lowerURL, "/jobs/") ||
				strings.Contains(lowerURL, "/job-detail") ||
				strings.Contains(lowerURL, "/jobdetail") ||
				strings.Contains(lowerURL, "/position/") ||
				strings.Contains(lowerURL, "/careers/job") ||
				strings.Contains(lowerURL, "/vacancy/") ||
				strings.Contains(lowerURL, "/opening/") ||
				strings.Contains(lowerURL, "jobid=") ||
				strings.Contains(lowerURL, "job_id=") ||
				strings.Contains(lowerURL, "requisitionid=")
			if hasJobPattern {
				jobURLs[link.URL] = true
				validHTMLJobs++
			}
		}
		if validHTMLJobs == 0 {
			log.Printf("⚠️ No valid job links found in HTML (links didn't match job URL patterns)")
			result.HTMLJobLinks = nil // Clear invalid links
		} else {
			log.Printf("✅ Found %d valid job links in HTML out of %d total", validHTMLJobs, len(result.HTMLJobLinks))
		}
	}
	result.TotalJobs = len(jobURLs)

	// If we detected Drupal AJAX but got no jobs, try to manually trigger and fetch the Drupal views
	if result.JobLoadingMethod == "ajax" && result.TotalJobs == 0 {
		log.Printf("📋 Drupal AJAX detected but no jobs found - trying to trigger Drupal views manually")
		drupalJobs := s.tryFetchDrupalViewsAjax(ctx, pageURL, htmlContent)
		if len(drupalJobs) > 0 {
			log.Printf("✅ Fetched %d jobs from Drupal Views AJAX", len(drupalJobs))
			result.APIJobListings = drupalJobs
			result.SourceType = "api"
			result.TotalJobs = len(drupalJobs)
		}
	}

	log.Printf("📊 AnalyzeCareerPage complete: source=%s, api_jobs=%d, html_links=%d, total=%d, api_reported_total=%d",
		result.SourceType, len(result.APIJobListings), len(result.HTMLJobLinks), result.TotalJobs, result.TotalFromAPI)

	return result, nil
}

// scrapeWithNetworkCapture uses ChromeDP with CDP Network domain to capture all XHR/Fetch requests
// Returns map of URL -> CapturedAPIRequest with full request details
func (s *ScraperService) scrapeWithNetworkCapture(ctx context.Context, pageURL string) (map[string]string, string, error) {
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", "new"),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-extensions", true),
		chromedp.Flag("disable-blink-features", "AutomationControlled"),
		chromedp.Flag("exclude-switches", "enable-automation"),
		chromedp.WindowSize(1920, 1080),
		chromedp.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"),
	)

	if chromePath := os.Getenv("CHROME_BIN"); chromePath != "" {
		opts = append(opts, chromedp.ExecPath(chromePath))
	}

	allocCtx, allocCancel := chromedp.NewExecAllocator(ctx, opts...)
	defer allocCancel()

	browserCtx, browserCancel := chromedp.NewContext(allocCtx)
	defer browserCancel()

	timeoutCtx, timeoutCancel := context.WithTimeout(browserCtx, 120*time.Second)
	defer timeoutCancel()

	// Map to store captured API responses (simple format for backward compatibility)
	apiResponses := make(map[string]string)
	var apiResponsesMutex sync.Mutex

	// Map to store full request details for pagination support
	capturedRequests := make(map[string]*CapturedAPIRequest)
	var capturedRequestsMutex sync.Mutex

	// Map to track request IDs to request details for response matching
	requestDetails := make(map[string]*CapturedAPIRequest)
	var requestDetailsMutex sync.Mutex

	// Set up CDP Network event listeners BEFORE navigation
	chromedp.ListenTarget(timeoutCtx, func(ev interface{}) {
		switch e := ev.(type) {
		case *network.EventRequestWillBeSent:
			// Track all XHR/Fetch requests with full details
			if e.Type == network.ResourceTypeXHR || e.Type == network.ResourceTypeFetch {
				reqDetails := &CapturedAPIRequest{
					URL:     e.Request.URL,
					Method:  e.Request.Method,
					Headers: make(map[string]string),
				}

				// Capture POST data if present (from HasPostData flag)
				if e.Request.HasPostData {
					// Try PostDataEntries first
					if len(e.Request.PostDataEntries) > 0 {
						var postDataParts []string
						for _, entry := range e.Request.PostDataEntries {
							if entry.Bytes != "" {
								postDataParts = append(postDataParts, entry.Bytes)
							}
						}
						reqDetails.PostData = strings.Join(postDataParts, "")
						if reqDetails.PostData != "" {
							log.Printf("📝 POST data from entries for %s: %s", reqDetails.URL, reqDetails.PostData[:min(200, len(reqDetails.PostData))])
						}
					}

					// If PostDataEntries is empty but HasPostData is true, try to get it
					// Run async but with a retry mechanism
					if reqDetails.PostData == "" {
						requestID := e.RequestID
						go func(reqID network.RequestID, details *CapturedAPIRequest) {
							// Try multiple times with small delays
							for attempt := 0; attempt < 5; attempt++ {
								time.Sleep(time.Duration(100*(attempt+1)) * time.Millisecond)
								err := chromedp.Run(timeoutCtx, chromedp.ActionFunc(func(ctx context.Context) error {
									postData, err := network.GetRequestPostData(reqID).Do(ctx)
									if err != nil {
										return err
									}
									details.PostData = postData
									return nil
								}))
								if err == nil && details.PostData != "" {
									log.Printf("📝 Captured POST data for %s (attempt %d): %s",
										details.URL, attempt+1, details.PostData[:min(200, len(details.PostData))])

									// Also update capturedRequests map
									capturedRequestsMutex.Lock()
									if existing, exists := capturedRequests[details.URL]; exists {
										existing.PostData = details.PostData
									}
									capturedRequestsMutex.Unlock()
									return
								}
							}
							log.Printf("⚠️ Failed to get POST data for %s after 5 attempts", details.URL)
						}(requestID, reqDetails)
					}
				}

				// Capture important headers
				for k, v := range e.Request.Headers {
					if str, ok := v.(string); ok {
						reqDetails.Headers[k] = str
					}
				}

				requestDetailsMutex.Lock()
				requestDetails[string(e.RequestID)] = reqDetails
				requestDetailsMutex.Unlock()
				log.Printf("🌐 Network request: %s %s (hasPostData: %v, method: %s)", e.Request.Method, e.Request.URL, e.Request.HasPostData, e.Request.Method)
			}
		case *network.EventResponseReceived:
			// Check if this is a JSON response we're interested in
			if e.Type == network.ResourceTypeXHR || e.Type == network.ResourceTypeFetch {
				contentType := e.Response.MimeType
				if strings.Contains(contentType, "json") || strings.Contains(contentType, "javascript") {
					requestDetailsMutex.Lock()
					reqDetails := requestDetails[string(e.RequestID)]
					requestDetailsMutex.Unlock()

					if reqDetails != nil {
						log.Printf("📥 JSON response from: %s (status: %d, method: %s)", reqDetails.URL, e.Response.Status, reqDetails.Method)
					}
				}
			}
		case *network.EventLoadingFinished:
			// Get response body when loading is finished
			requestDetailsMutex.Lock()
			reqDetails := requestDetails[string(e.RequestID)]
			requestDetailsMutex.Unlock()

			if reqDetails != nil {
				go func(requestID network.RequestID, details *CapturedAPIRequest) {
					// Get response body using CDP
					var body string
					err := chromedp.Run(timeoutCtx, chromedp.ActionFunc(func(ctx context.Context) error {
						result, err := network.GetResponseBody(requestID).Do(ctx)
						if err != nil {
							return err
						}
						body = string(result)
						return nil
					}))

					if err == nil && len(body) > 0 {
						lowerBody := strings.ToLower(body)
						lowerURL := strings.ToLower(details.URL)

						// Check for Drupal AJAX endpoints (they return HTML-in-JSON)
						isDrupalAjax := strings.Contains(lowerURL, "/views/ajax") ||
							strings.Contains(lowerURL, "drupal_ajax") ||
							strings.Contains(lowerURL, "_wrapper_format=drupal")

						// Check if response looks like job data (JSON API format)
						hasJobKeywords := strings.Contains(lowerBody, "\"job") ||
							strings.Contains(lowerBody, "\"position") ||
							strings.Contains(lowerBody, "\"title\"") ||
							strings.Contains(lowerBody, "\"requisition") ||
							strings.Contains(lowerBody, "\"opening") ||
							strings.Contains(lowerBody, "\"posting") ||
							strings.Contains(lowerBody, "\"vacancy") ||
							strings.Contains(lowerBody, "\"career") ||
							strings.Contains(lowerBody, "jobid") ||
							strings.Contains(lowerBody, "job_id") ||
							strings.Contains(lowerBody, "jobtitle") ||
							strings.Contains(lowerBody, "job_title")

						// Check for HTML job content (for Drupal AJAX responses containing HTML)
						hasHTMLJobContent := strings.Contains(lowerBody, "job-title") ||
							strings.Contains(lowerBody, "job-listing") ||
							strings.Contains(lowerBody, "job-card") ||
							strings.Contains(lowerBody, "job-item") ||
							strings.Contains(lowerBody, "career-") ||
							strings.Contains(lowerBody, "views-row") ||
							strings.Contains(lowerBody, "openings") ||
							strings.Contains(lowerBody, "vacancy") ||
							strings.Contains(lowerBody, "apply now") ||
							strings.Contains(lowerBody, "apply-now") ||
							strings.Contains(lowerBody, "view details") ||
							strings.Contains(lowerBody, "view-details")

						if hasJobKeywords || (isDrupalAjax && hasHTMLJobContent) {
							if isDrupalAjax {
								log.Printf("🔷 Drupal AJAX response detected: %s", details.URL)
							}

							// Limit size to prevent memory issues
							if len(body) > 1000000 {
								body = body[:1000000]
							}

							apiResponsesMutex.Lock()
							apiResponses[details.URL] = body
							apiResponsesMutex.Unlock()

							// Also store full request details
							capturedRequestsMutex.Lock()
							details.ResponseBody = body
							capturedRequests[details.URL] = details
							capturedRequestsMutex.Unlock()

							log.Printf("✅ Captured job API response: %s (size: %d, method: %s, hasPostData: %v)",
								details.URL, len(body), details.Method, details.PostData != "")
						}
					}
				}(e.RequestID, reqDetails)
			}
		}
	})

	// Enable network tracking BEFORE navigation
	if err := chromedp.Run(timeoutCtx,
		network.Enable(),
		chromedp.ActionFunc(func(ctx context.Context) error {
			return chromedp.Evaluate(`
				Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
				window.chrome = { runtime: {} };
			`, nil).Do(ctx)
		}),
	); err != nil {
		return nil, "", fmt.Errorf("failed to enable network: %w", err)
	}

	// Inject JS interceptors BEFORE navigation using addScriptToEvaluateOnNewDocument
	// This ensures the script runs before any page JavaScript
	jsInterceptorScript := `
		// Set up global capture arrays
		window.__capturedResponses = window.__capturedResponses || [];
		window.__capturedRequests = window.__capturedRequests || {};

		// Intercept fetch BEFORE any requests are made
		if (!window.__fetchIntercepted) {
			window.__fetchIntercepted = true;
			const originalFetch = window.fetch;
			window.fetch = async function(...args) {
				const url = typeof args[0] === 'string' ? args[0] : args[0].url;
				let method = 'GET';
				let postData = null;

				if (args[1]) {
					method = args[1].method || 'GET';
					if (args[1].body) {
						postData = typeof args[1].body === 'string' ? args[1].body : JSON.stringify(args[1].body);
					}
				}

				const response = await originalFetch.apply(this, args);
				try {
					const clonedResponse = response.clone();
					const contentType = clonedResponse.headers.get('content-type') || '';
					const lowerURL = url.toLowerCase();

					// Check for Drupal AJAX endpoints
					const isDrupalAjax = lowerURL.includes('/views/ajax') ||
						lowerURL.includes('drupal_ajax') ||
						lowerURL.includes('_wrapper_format=drupal');

					if (contentType.includes('json') || isDrupalAjax) {
						const text = await clonedResponse.text();
						const lowerText = text.toLowerCase();

						// Check for JSON job keywords
						const hasJobKeywords = lowerText.includes('"job') ||
							lowerText.includes('"position') ||
							lowerText.includes('"title"') ||
							lowerText.includes('jobid') ||
							lowerText.includes('job_id') ||
							lowerText.includes('hits');

						// Check for HTML job content (Drupal returns HTML in JSON)
						const hasHTMLJobContent = lowerText.includes('job-title') ||
							lowerText.includes('job-listing') ||
							lowerText.includes('job-card') ||
							lowerText.includes('views-row') ||
							lowerText.includes('openings') ||
							lowerText.includes('apply now') ||
							lowerText.includes('view details');

						if (hasJobKeywords || (isDrupalAjax && hasHTMLJobContent)) {
							console.log('[JobScraper] Fetch captured job response from:', url, 'isDrupal:', isDrupalAjax);
							window.__capturedResponses.push({
								url: url,
								body: text.substring(0, 500000),
								method: method,
								postData: postData ? postData.substring(0, 10000) : null,
								isDrupalAjax: isDrupalAjax
							});
							window.__capturedRequests[url] = {
								method: method,
								postData: postData ? postData.substring(0, 10000) : null
							};
						}
					}
				} catch (e) { console.error('[JobScraper] Fetch capture error:', e); }
				return response;
			};
		}

		// Intercept XMLHttpRequest BEFORE any requests are made
		if (!window.__xhrIntercepted) {
			window.__xhrIntercepted = true;
			const originalXHROpen = XMLHttpRequest.prototype.open;
			const originalXHRSend = XMLHttpRequest.prototype.send;

			XMLHttpRequest.prototype.open = function(method, url, ...args) {
				this.__url = url;
				this.__method = method;
				return originalXHROpen.apply(this, [method, url, ...args]);
			};

			XMLHttpRequest.prototype.send = function(body) {
				this.__postData = body;
				this.addEventListener('load', function() {
					try {
						const contentType = this.getResponseHeader('content-type') || '';
						const url = this.__url || '';
						const lowerURL = url.toLowerCase();

						// Check for Drupal AJAX endpoints
						const isDrupalAjax = lowerURL.includes('/views/ajax') ||
							lowerURL.includes('drupal_ajax') ||
							lowerURL.includes('_wrapper_format=drupal');

						if ((contentType.includes('json') || isDrupalAjax) && this.responseText) {
							const lowerText = this.responseText.toLowerCase();

							// Check for JSON job keywords
							const hasJobKeywords = lowerText.includes('"job') ||
								lowerText.includes('"position') ||
								lowerText.includes('"title"') ||
								lowerText.includes('jobid') ||
								lowerText.includes('job_id') ||
								lowerText.includes('hits');

							// Check for HTML job content (Drupal returns HTML in JSON)
							const hasHTMLJobContent = lowerText.includes('job-title') ||
								lowerText.includes('job-listing') ||
								lowerText.includes('job-card') ||
								lowerText.includes('views-row') ||
								lowerText.includes('openings') ||
								lowerText.includes('apply now') ||
								lowerText.includes('view details');

							if (hasJobKeywords || (isDrupalAjax && hasHTMLJobContent)) {
								console.log('[JobScraper] Captured job response from:', url, 'isDrupal:', isDrupalAjax);
								window.__capturedResponses.push({
									url: url,
									body: this.responseText.substring(0, 500000),
									method: this.__method,
									postData: this.__postData ? (typeof this.__postData === 'string' ? this.__postData.substring(0, 10000) : null) : null,
									isDrupalAjax: isDrupalAjax
								});
								window.__capturedRequests[url] = {
									method: this.__method,
									postData: this.__postData ? (typeof this.__postData === 'string' ? this.__postData.substring(0, 10000) : null) : null
								};
							}
						}
					} catch (e) { console.error('[JobScraper] XHR capture error:', e); }
				});
				return originalXHRSend.call(this, body);
			};
		}
	`

	// Use page.AddScriptToEvaluateOnNewDocument to inject before page loads
	if err := chromedp.Run(timeoutCtx,
		chromedp.ActionFunc(func(ctx context.Context) error {
			_, err := page.AddScriptToEvaluateOnNewDocument(jsInterceptorScript).Do(ctx)
			return err
		}),
	); err != nil {
		log.Printf("⚠️ Failed to inject early JS interceptors: %v", err)
	}

	var htmlContent string

	// Navigate and wait for content
	err := chromedp.Run(timeoutCtx,
		chromedp.Navigate(pageURL),
		chromedp.WaitReady("body"),
		// Wait for Cloudflare if present
		chromedp.ActionFunc(func(ctx context.Context) error {
			return s.waitForCloudflareChallenge(ctx)
		}),
		// Wait for job content to load
		chromedp.ActionFunc(func(ctx context.Context) error {
			return s.waitForJobListings(ctx)
		}),
		// Wait a bit for initial API calls to complete
		chromedp.Sleep(3*time.Second),
	)

	if err != nil {
		return nil, "", fmt.Errorf("chromedp navigation failed: %w", err)
	}

	// First, try to scroll to the URL fragment if present (e.g., #engineering-job-section)
	if strings.Contains(pageURL, "#") {
		fragment := pageURL[strings.LastIndex(pageURL, "#")+1:]
		log.Printf("🎯 URL has fragment: #%s, scrolling to it", fragment)
		err = chromedp.Run(timeoutCtx,
			chromedp.Evaluate(fmt.Sprintf(`
				(() => {
					const el = document.getElementById('%s');
					if (el) {
						el.scrollIntoView({ behavior: 'instant', block: 'start' });
						return 'scrolled';
					}
					return 'not found';
				})()
			`, fragment), nil),
			chromedp.Sleep(3*time.Second),
		)
		if err != nil {
			log.Printf("⚠️ Failed to scroll to fragment: %v", err)
		} else {
			log.Printf("✅ Scrolled to fragment #%s, waiting for AJAX...", fragment)
		}
	}

	// Try to scroll to job-related sections to trigger Drupal AJAX loads
	// Using synchronous scroll with separate sleeps for proper timing
	err = chromedp.Run(timeoutCtx,
		chromedp.Evaluate(`
			(() => {
				// Find job-related sections
				const jobSections = document.querySelectorAll(
					'[id*="job"], [id*="career"], [id*="opening"], [id*="position"], ' +
					'[class*="job-section"], [class*="career-section"], [class*="jobs-listing"], ' +
					'[class*="views-element"], [data-drupal-selector], ' +
					'.view-careers, .view-jobs, .views-infinite-scroll-content-wrapper, ' +
					'#engineering-job-section, #careers-section, #jobs-section'
				);

				let scrolled = [];
				for (const section of jobSections) {
					if (section.offsetHeight > 0) {
						scrolled.push(section.id || section.className.substring(0, 30));
						section.scrollIntoView({ behavior: 'instant', block: 'center' });
					}
				}
				return 'Found ' + jobSections.length + ' sections, scrolled to: ' + scrolled.join(', ');
			})()
		`, nil),
		chromedp.Sleep(3*time.Second), // Wait for AJAX after scrolling to sections
	)

	if err != nil {
		log.Printf("⚠️ Section scroll failed: %v", err)
	}

	// Scroll through the page to trigger lazy loading
	err = chromedp.Run(timeoutCtx,
		chromedp.Evaluate(`
			(() => {
				// Scroll down in steps
				const totalHeight = document.body.scrollHeight;
				for (let i = 1; i <= 10; i++) {
					window.scrollTo(0, totalHeight * i / 10);
				}
				window.scrollTo(0, 0);
				return 'scrolled';
			})()
		`, nil),
		chromedp.Sleep(2*time.Second),
	)

	if err != nil {
		log.Printf("⚠️ Page scroll failed: %v", err)
	}

	// Universal pagination strategy that works for any website:
	// 1. Aggressive scrolling to trigger lazy loading
	// 2. Click "load more" / "next" buttons
	// 3. Track API responses captured (not DOM changes)
	err = chromedp.Run(timeoutCtx,
		chromedp.Evaluate(`
			(async () => {
				const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
				let totalClicks = 0;
				let noProgressCount = 0;

				// Track captured API responses to know when we're done
				const getResponseCount = () => (window.__capturedResponses || []).length;
				let lastResponseCount = getResponseCount();

				console.log('[JobScraper] Starting universal pagination...');

				// Step 1: Aggressive scrolling to trigger lazy loading / infinite scroll
				console.log('[JobScraper] Phase 1: Scrolling to trigger lazy loading...');
				for (let i = 0; i < 15; i++) {
					const beforeScroll = document.body.scrollHeight;
					window.scrollTo(0, document.body.scrollHeight);
					await delay(1000);

					// Check if new content loaded
					const afterScroll = document.body.scrollHeight;
					const newResponses = getResponseCount();

					if (afterScroll > beforeScroll + 50 || newResponses > lastResponseCount) {
						console.log('[JobScraper] Scroll triggered new content');
						lastResponseCount = newResponses;
						noProgressCount = 0;
					} else {
						noProgressCount++;
						if (noProgressCount >= 3) break;
					}
				}

				// Step 2: Find and click pagination/load-more buttons
				console.log('[JobScraper] Phase 2: Looking for pagination buttons...');

				// Universal function to find clickable "next/more" elements
				const findNextButton = () => {
					const allClickable = Array.from(document.querySelectorAll('button, a, [role="button"], [onclick]'));

					for (const el of allClickable) {
						if (!el || el.offsetParent === null) continue;
						if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
						if (el.classList.contains('disabled') || el.classList.contains('active')) continue;

						const text = (el.textContent || '').trim().toLowerCase();
						const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
						const className = (el.className || '').toLowerCase();
						const title = (el.getAttribute('title') || '').toLowerCase();

						// Check for "next", "more", arrow symbols
						const indicators = [
							text.includes('next'),
							text.includes('more'),
							text.includes('load'),
							text.includes('show'),
							text === '>',
							text === '»',
							text === '→',
							text === '›',
							ariaLabel.includes('next'),
							ariaLabel.includes('more'),
							ariaLabel.includes('forward'),
							className.includes('next'),
							className.includes('more'),
							className.includes('load'),
							className.includes('forward'),
							title.includes('next'),
						];

						if (indicators.some(Boolean)) {
							return el;
						}

						// Check for SVG arrow icons
						const svg = el.querySelector('svg');
						if (svg) {
							const svgClass = (svg.className?.baseVal || svg.getAttribute('class') || '').toLowerCase();
							const path = svg.querySelector('path');
							const pathD = path?.getAttribute('d') || '';
							// Common arrow path patterns or class names
							if (svgClass.includes('right') || svgClass.includes('next') ||
								svgClass.includes('arrow') || svgClass.includes('chevron') ||
								pathD.includes('l5') || pathD.includes('L5')) {
								// Make sure it's on the right side (not back button)
								const rect = el.getBoundingClientRect();
								if (rect.left > window.innerWidth / 2) {
									return el;
								}
							}
						}
					}

					// Also check for page numbers
					const pageNumbers = Array.from(document.querySelectorAll('button, a')).filter(el => {
						const text = (el.textContent || '').trim();
						return /^\d+$/.test(text) && !el.classList.contains('active') && !el.classList.contains('current');
					});

					// Find the lowest unvisited page number > 1
					let nextPage = null;
					let minPage = Infinity;
					for (const el of pageNumbers) {
						const num = parseInt(el.textContent.trim());
						if (num > 1 && num < minPage && el.offsetParent !== null) {
							minPage = num;
							nextPage = el;
						}
					}

					return nextPage;
				};

				noProgressCount = 0;
				for (let attempt = 0; attempt < 25; attempt++) {
					const beforeResponses = getResponseCount();
					const btn = findNextButton();

					if (btn) {
						btn.scrollIntoView({ behavior: 'instant', block: 'center' });
						await delay(300);
						btn.click();
						totalClicks++;
						console.log('[JobScraper] Clicked button:', (btn.textContent || '').trim().substring(0, 30) || 'arrow/icon');
						await delay(2500);

						const afterResponses = getResponseCount();
						if (afterResponses > beforeResponses) {
							console.log('[JobScraper] New API responses captured:', afterResponses - beforeResponses);
							noProgressCount = 0;
						} else {
							noProgressCount++;
						}
					} else {
						// No button found, try scrolling
						window.scrollTo(0, document.body.scrollHeight);
						await delay(1500);
						noProgressCount++;
					}

					// Stop if no progress for 3 attempts
					if (noProgressCount >= 3) {
						console.log('[JobScraper] No more progress, stopping');
						break;
					}
				}

				// Final scroll to top
				window.scrollTo(0, 0);
				await delay(500);

				console.log('[JobScraper] Pagination complete. Clicks:', totalClicks, 'Total API responses:', getResponseCount());
				return { clicks: totalClicks, responses: getResponseCount() };
			})()
		`, nil),
		chromedp.Sleep(3*time.Second),
	)

	if err != nil {
		log.Printf("⚠️ Load more click failed: %v", err)
	}

	// Also inject JS interceptors to capture any subsequent calls with POST data
	err = chromedp.Run(timeoutCtx,
		chromedp.Evaluate(`
			(function() {
				window.__capturedResponses = window.__capturedResponses || [];
				window.__capturedRequests = window.__capturedRequests || {};

				// Intercept fetch
				if (!window.__fetchIntercepted) {
					window.__fetchIntercepted = true;
					const originalFetch = window.fetch;
					window.fetch = async function(...args) {
						// Capture request details
						const url = typeof args[0] === 'string' ? args[0] : args[0].url;
						let method = 'GET';
						let postData = null;

						if (args[1]) {
							method = args[1].method || 'GET';
							if (args[1].body) {
								postData = typeof args[1].body === 'string' ? args[1].body : JSON.stringify(args[1].body);
							}
						}

						const response = await originalFetch.apply(this, args);
						try {
							const clonedResponse = response.clone();
							const contentType = clonedResponse.headers.get('content-type') || '';
							if (contentType.includes('json')) {
								const text = await clonedResponse.text();
								const lowerText = text.toLowerCase();
								if (lowerText.includes('"job') ||
									lowerText.includes('"position') ||
									lowerText.includes('"title"') ||
									lowerText.includes('jobid') ||
									lowerText.includes('job_id')) {
									window.__capturedResponses.push({
										url: url,
										body: text.substring(0, 500000),
										method: method,
										postData: postData ? postData.substring(0, 10000) : null
									});
									// Also store request details separately
									window.__capturedRequests[url] = {
										method: method,
										postData: postData ? postData.substring(0, 10000) : null
									};
								}
							}
						} catch (e) {}
						return response;
					};
				}

				// Intercept XMLHttpRequest
				if (!window.__xhrIntercepted) {
					window.__xhrIntercepted = true;
					const originalXHROpen = XMLHttpRequest.prototype.open;
					const originalXHRSend = XMLHttpRequest.prototype.send;

					XMLHttpRequest.prototype.open = function(method, url, ...args) {
						this.__url = url;
						this.__method = method;
						return originalXHROpen.apply(this, [method, url, ...args]);
					};

					XMLHttpRequest.prototype.send = function(body) {
						this.__postData = body;
						this.addEventListener('load', function() {
							try {
								const contentType = this.getResponseHeader('content-type') || '';
								if (contentType.includes('json') && this.responseText) {
									const lowerText = this.responseText.toLowerCase();
									if (lowerText.includes('"job') ||
										lowerText.includes('"position') ||
										lowerText.includes('"title"') ||
										lowerText.includes('jobid') ||
										lowerText.includes('job_id')) {
										window.__capturedResponses.push({
											url: this.__url,
											body: this.responseText.substring(0, 500000),
											method: this.__method,
											postData: this.__postData ? (typeof this.__postData === 'string' ? this.__postData.substring(0, 10000) : null) : null
										});
										// Also store request details separately
										window.__capturedRequests[this.__url] = {
											method: this.__method,
											postData: this.__postData ? (typeof this.__postData === 'string' ? this.__postData.substring(0, 10000) : null) : null
										};
									}
								}
							} catch (e) {}
						});
						return originalXHRSend.call(this, body);
					};
				}
			})();
		`, nil),
		chromedp.Sleep(2*time.Second),
	)

	// Get any JS-captured responses
	var jsResponses string
	chromedp.Run(timeoutCtx,
		chromedp.Evaluate(`JSON.stringify(window.__capturedResponses || [])`, &jsResponses),
	)

	// Parse JS captured responses (includes Method and PostData now)
	// IMPORTANT: We store ALL responses, not just unique URLs, since pagination may
	// use the same URL with different POST body (e.g., Elasticsearch-style pagination)
	var captured []struct {
		URL      string `json:"url"`
		Body     string `json:"body"`
		Method   string `json:"method"`
		PostData string `json:"postData"`
	}
	if err := json.Unmarshal([]byte(jsResponses), &captured); err == nil {
		log.Printf("📡 JS-Captured %d API responses total", len(captured))
		for i, c := range captured {
			// Use index-based key to store ALL responses (even from same URL with different POST data)
			responseKey := fmt.Sprintf("%s#%d", c.URL, i)

			apiResponsesMutex.Lock()
			apiResponses[responseKey] = c.Body
			log.Printf("📡 JS-Captured API response #%d from: %s (size: %d, method: %s, hasPostData: %v)",
				i+1, c.URL, len(c.Body), c.Method, c.PostData != "")
			apiResponsesMutex.Unlock()

			// Also store full request details
			capturedRequestsMutex.Lock()
			capturedRequests[responseKey] = &CapturedAPIRequest{
				URL:          c.URL,
				Method:       c.Method,
				PostData:     c.PostData,
				ResponseBody: c.Body,
			}
			if c.PostData != "" {
				log.Printf("📝 JS-Captured POST data for %s: %s", c.URL, c.PostData[:min(300, len(c.PostData))])
			}
			capturedRequestsMutex.Unlock()
		}
	}

	// Give time for any remaining network requests and POST data capture
	chromedp.Run(timeoutCtx, chromedp.Sleep(3*time.Second))

	// Now get the actual HTML content
	err = chromedp.Run(timeoutCtx,
		chromedp.OuterHTML("html", &htmlContent),
	)
	if err != nil {
		return apiResponses, "", fmt.Errorf("failed to get HTML: %w", err)
	}

	log.Printf("📊 Total API responses captured: %d", len(apiResponses))
	for url := range apiResponses {
		log.Printf("   - %s", url)
	}

	// Log captured request details for debugging
	log.Printf("📊 Total captured requests with details: %d", len(capturedRequests))
	for url, req := range capturedRequests {
		hasPostData := req.PostData != ""
		log.Printf("   - %s (method: %s, hasPostData: %v, postDataLen: %d)", url, req.Method, hasPostData, len(req.PostData))
		if hasPostData && len(req.PostData) > 0 {
			log.Printf("     POST data preview: %s", req.PostData[:min(300, len(req.PostData))])
		}
	}

	// Store captured requests in a package-level variable for pagination use
	s.lastCapturedRequests = capturedRequests

	return apiResponses, htmlContent, nil
}

// extractJobsFromAPIResponse parses a JSON API response and extracts job listings
func (s *ScraperService) extractJobsFromAPIResponse(responseBody string, baseURL string) []APIJobListing {
	var jobs []APIJobListing

	// Try to parse as JSON
	var data interface{}
	if err := json.Unmarshal([]byte(responseBody), &data); err != nil {
		log.Printf("⚠️ Failed to parse API response as JSON: %v", err)
		return jobs
	}

	// Check if this is a Drupal AJAX response (array of commands)
	if dataArray, ok := data.([]interface{}); ok {
		isDrupalAjax := false
		for _, item := range dataArray {
			if itemMap, ok := item.(map[string]interface{}); ok {
				if command, ok := itemMap["command"].(string); ok {
					if command == "insert" || command == "replaceWith" || command == "replace" {
						isDrupalAjax = true
						// Extract HTML from the "data" field
						if htmlData, ok := itemMap["data"].(string); ok && len(htmlData) > 0 {
							log.Printf("🔷 Drupal AJAX: Extracting jobs from HTML insert command")
							drupalJobs := s.extractJobsFromDrupalHTML(htmlData, baseURL)
							jobs = append(jobs, drupalJobs...)
						}
					}
				}
			}
		}
		if isDrupalAjax && len(jobs) > 0 {
			log.Printf("🔷 Extracted %d jobs from Drupal AJAX response", len(jobs))
			return jobs
		}
	}

	// Log top-level structure for debugging
	if dataMap, ok := data.(map[string]interface{}); ok {
		var keys []string
		for k := range dataMap {
			keys = append(keys, k)
		}
		log.Printf("📋 API response top-level keys: %v", keys)
	}

	// Recursively search for job arrays in the response
	jobs = s.findJobsInJSON(data, baseURL)

	return jobs
}

// extractJobsFromDrupalHTML extracts job listings from HTML content returned by Drupal AJAX
func (s *ScraperService) extractJobsFromDrupalHTML(htmlContent string, baseURL string) []APIJobListing {
	var jobs []APIJobListing

	// Parse the HTML content
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(htmlContent))
	if err != nil {
		log.Printf("⚠️ Failed to parse Drupal HTML: %v", err)
		return jobs
	}

	// Look for job-related links in the HTML
	// Common patterns for job listings
	selectors := []string{
		"a[href*='/job/']",
		"a[href*='/jobs/']",
		"a[href*='/career']",
		"a[href*='/opening']",
		"a[href*='/position']",
		"a.job-link",
		".job-title a",
		".job-listing a",
		".views-row a[href*='career']",
		".views-row a[href*='job']",
		"article a[href]",
		".career-listing a",
		"[class*='job'] a[href]",
		"[class*='career'] a[href]",
	}

	seenURLs := make(map[string]bool)

	for _, selector := range selectors {
		doc.Find(selector).Each(func(i int, sel *goquery.Selection) {
			href, exists := sel.Attr("href")
			if !exists || href == "" {
				return
			}

			// Build absolute URL
			jobURL := href
			if !strings.HasPrefix(href, "http") {
				if strings.HasPrefix(href, "/") {
					jobURL = strings.TrimRight(baseURL, "/") + href
				} else {
					jobURL = strings.TrimRight(baseURL, "/") + "/" + href
				}
			}

			// Skip already seen URLs
			if seenURLs[jobURL] {
				return
			}
			seenURLs[jobURL] = true

			// Get title from link text or parent elements
			title := strings.TrimSpace(sel.Text())
			if title == "" || len(title) < 5 {
				// Try parent element
				title = strings.TrimSpace(sel.Parent().Text())
			}
			if title == "" || len(title) < 5 {
				// Try closest heading
				sel.Closest(".views-row, article, .job-item, [class*='job']").Find("h2, h3, h4, .title").Each(func(j int, heading *goquery.Selection) {
					if title == "" || len(title) < 5 {
						title = strings.TrimSpace(heading.Text())
					}
				})
			}

			// Clean up title
			title = regexp.MustCompile(`\s+`).ReplaceAllString(title, " ")
			if len(title) > 200 {
				title = title[:200]
			}

			if title != "" && len(title) >= 5 {
				jobs = append(jobs, APIJobListing{
					Title: title,
					URL:   jobURL,
				})
			}
		})
	}

	// If no jobs found with specific selectors, try a more generic approach
	if len(jobs) == 0 {
		// Look for any link that looks like a job URL
		doc.Find("a[href]").Each(func(i int, sel *goquery.Selection) {
			href, _ := sel.Attr("href")
			lowerHref := strings.ToLower(href)

			// Check if it looks like a job URL
			isJobURL := strings.Contains(lowerHref, "/job") ||
				strings.Contains(lowerHref, "/career") ||
				strings.Contains(lowerHref, "/opening") ||
				strings.Contains(lowerHref, "/position") ||
				strings.Contains(lowerHref, "/vacancy")

			if !isJobURL {
				return
			}

			// Build absolute URL
			jobURL := href
			if !strings.HasPrefix(href, "http") {
				if strings.HasPrefix(href, "/") {
					jobURL = strings.TrimRight(baseURL, "/") + href
				} else {
					jobURL = strings.TrimRight(baseURL, "/") + "/" + href
				}
			}

			if seenURLs[jobURL] {
				return
			}
			seenURLs[jobURL] = true

			title := strings.TrimSpace(sel.Text())
			title = regexp.MustCompile(`\s+`).ReplaceAllString(title, " ")
			if len(title) > 200 {
				title = title[:200]
			}

			if title != "" && len(title) >= 3 {
				jobs = append(jobs, APIJobListing{
					Title: title,
					URL:   jobURL,
				})
			}
		})
	}

	log.Printf("🔷 Drupal HTML extraction found %d job links", len(jobs))
	return jobs
}

// detectAPIPagination analyzes an API response to detect pagination info
func (s *ScraperService) detectAPIPagination(responseBody string, requestURL string) *APIPaginationInfo {
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(responseBody), &data); err != nil {
		return nil
	}

	info := &APIPaginationInfo{
		OriginalURL: requestURL,
	}

	// Detect total count - check various common field names
	totalFields := []string{
		"total", "totalHits", "total_hits", "totalCount", "total_count",
		"totalResults", "total_results", "count", "numFound", "num_found",
		"totalItems", "total_items", "recordsTotal", "records_total",
		"totalRecords", "total_records", "resultCount", "result_count",
		"hits", "numberOfResults", "number_of_results",
	}

	for _, field := range totalFields {
		if val := s.getNestedValue(data, field); val != nil {
			switch v := val.(type) {
			case float64:
				info.TotalCount = int(v)
			case int:
				info.TotalCount = v
			case int64:
				info.TotalCount = int(v)
			}
			if info.TotalCount > 0 {
				log.Printf("📊 Detected total count: %d from field '%s'", info.TotalCount, field)
				break
			}
		}
	}

	// Check for Elasticsearch-style hits.total structure
	if info.TotalCount == 0 {
		if hits, ok := data["hits"].(map[string]interface{}); ok {
			if total, ok := hits["total"]; ok {
				switch t := total.(type) {
				case float64:
					info.TotalCount = int(t)
				case int:
					info.TotalCount = t
				case map[string]interface{}:
					// Elasticsearch 7+ style: hits.total.value
					if val, ok := t["value"].(float64); ok {
						info.TotalCount = int(val)
					}
				}
				if info.TotalCount > 0 {
					log.Printf("📊 Detected total count: %d from hits.total (Elasticsearch)", info.TotalCount)
				}
			}
		}
	}

	// If not found at top level, try to find total in deeply nested structures
	if info.TotalCount == 0 {
		info.TotalCount = s.findTotalInJSON(data)
		if info.TotalCount > 0 {
			log.Printf("📊 Detected total count: %d from deep search", info.TotalCount)
		}
	}

	// Detect page size
	pageSizeFields := []string{
		"pageSize", "page_size", "size", "limit", "perPage", "per_page",
		"itemsPerPage", "items_per_page", "resultsPerPage", "results_per_page",
	}

	for _, field := range pageSizeFields {
		if val := s.getNestedValue(data, field); val != nil {
			switch v := val.(type) {
			case float64:
				info.PageSize = int(v)
			case int:
				info.PageSize = v
			}
			if info.PageSize > 0 {
				log.Printf("📊 Detected page size: %d from field '%s'", info.PageSize, field)
				break
			}
		}
	}

	// Detect current page/offset
	pageFields := []string{"page", "pageNumber", "page_number", "currentPage", "current_page"}
	for _, field := range pageFields {
		if val := s.getNestedValue(data, field); val != nil {
			switch v := val.(type) {
			case float64:
				info.CurrentPage = int(v)
				info.PaginationType = "page"
			case int:
				info.CurrentPage = v
				info.PaginationType = "page"
			}
			if info.CurrentPage > 0 {
				break
			}
		}
	}

	offsetFields := []string{"offset", "from", "start", "skip"}
	for _, field := range offsetFields {
		if val := s.getNestedValue(data, field); val != nil {
			switch v := val.(type) {
			case float64:
				info.CurrentOffset = int(v)
				info.PaginationType = "offset"
			case int:
				info.CurrentOffset = v
				info.PaginationType = "offset"
			}
			if info.CurrentOffset >= 0 && info.PaginationType == "offset" {
				break
			}
		}
	}

	// Detect cursor pagination
	cursorFields := []string{"cursor", "nextCursor", "next_cursor", "nextToken", "next_token", "after"}
	for _, field := range cursorFields {
		if val := s.getNestedValue(data, field); val != nil {
			if cursor, ok := val.(string); ok && cursor != "" {
				info.NextCursor = cursor
				info.PaginationType = "cursor"
				break
			}
		}
	}

	// Check if there's more data
	moreFields := []string{"hasMore", "has_more", "hasNext", "has_next", "moreResults", "more_results"}
	for _, field := range moreFields {
		if val := s.getNestedValue(data, field); val != nil {
			if hasMore, ok := val.(bool); ok {
				info.HasMore = hasMore
				break
			}
		}
	}

	// Infer if there's more based on total vs page size
	if info.TotalCount > 0 && info.PageSize > 0 {
		currentCount := info.CurrentOffset + info.PageSize
		if info.CurrentPage > 0 {
			currentCount = info.CurrentPage * info.PageSize
		}
		info.HasMore = currentCount < info.TotalCount
	}

	// Default pagination type if we have total but couldn't detect type
	if info.TotalCount > 0 && info.PaginationType == "" {
		// Check URL for pagination params
		if strings.Contains(requestURL, "from=") || strings.Contains(requestURL, "offset=") {
			info.PaginationType = "offset"
		} else if strings.Contains(requestURL, "page=") {
			info.PaginationType = "page"
		} else {
			info.PaginationType = "offset" // Default assumption
		}
	}

	if info.TotalCount == 0 {
		return nil
	}

	return info
}

// getNestedValue retrieves a value from nested map using dot notation or direct key
func (s *ScraperService) getNestedValue(data map[string]interface{}, key string) interface{} {
	// First try direct key
	if val, ok := data[key]; ok {
		return val
	}

	// Try nested paths
	nestedPaths := [][]string{
		{"meta", key},
		{"pagination", key},
		{"paging", key},
		{"data", key},
		{"result", key},
		{"response", key},
		{"hits", key},
		{"searchResults", key},
	}

	for _, path := range nestedPaths {
		current := interface{}(data)
		for _, p := range path {
			if m, ok := current.(map[string]interface{}); ok {
				current = m[p]
			} else {
				current = nil
				break
			}
		}
		if current != nil {
			return current
		}
	}

	return nil
}

// findTotalInJSON recursively searches for total count fields in JSON
func (s *ScraperService) findTotalInJSON(data interface{}) int {
	totalFields := []string{
		"total", "totalHits", "total_hits", "totalCount", "total_count",
		"totalResults", "total_results", "numFound", "num_found",
		"totalItems", "total_items", "recordsTotal", "records_total",
		"totalRecords", "total_records", "resultCount", "result_count",
		"numberOfResults", "number_of_results",
	}

	switch v := data.(type) {
	case map[string]interface{}:
		// Check for total fields at this level
		for _, field := range totalFields {
			if val, ok := v[field]; ok {
				switch num := val.(type) {
				case float64:
					if int(num) > 0 {
						return int(num)
					}
				case int:
					if num > 0 {
						return num
					}
				case int64:
					if int(num) > 0 {
						return int(num)
					}
				}
			}
		}

		// Also check for "count" but only if it's a large number (to avoid counting array lengths)
		if count, ok := v["count"]; ok {
			switch num := count.(type) {
			case float64:
				if int(num) > 10 { // Only consider if > 10 to avoid false positives
					return int(num)
				}
			case int:
				if num > 10 {
					return num
				}
			}
		}

		// Recurse into nested objects
		for _, val := range v {
			if result := s.findTotalInJSON(val); result > 0 {
				return result
			}
		}
	case []interface{}:
		// Don't count array length as total - that's usually the page results
		// But do check inside array items
		for _, item := range v {
			if result := s.findTotalInJSON(item); result > 0 {
				return result
			}
		}
	}

	return 0
}

// fetchAllPaginatedJobs fetches all pages from a paginated API
func (s *ScraperService) fetchAllPaginatedJobs(ctx context.Context, paginationInfo *APIPaginationInfo, initialJobs []APIJobListing, baseURL string) ([]APIJobListing, error) {
	if paginationInfo == nil || paginationInfo.TotalCount == 0 {
		return initialJobs, nil
	}

	allJobs := make([]APIJobListing, 0, paginationInfo.TotalCount)
	allJobs = append(allJobs, initialJobs...)

	// Calculate page size from initial results if not detected
	pageSize := paginationInfo.PageSize
	if pageSize == 0 {
		pageSize = len(initialJobs)
	}
	if pageSize == 0 {
		pageSize = 10 // Default assumption
	}

	log.Printf("📄 Initial pageSize estimate: %d (from paginationInfo: %d, initialJobs: %d)",
		pageSize, paginationInfo.PageSize, len(initialJobs))

	// Calculate how many more pages we need (may be recalculated after detecting actual page size from POST data)
	totalPages := (paginationInfo.TotalCount + pageSize - 1) / pageSize
	maxPages := 50 // Safety limit

	if totalPages > maxPages {
		log.Printf("⚠️ Total pages (%d) exceeds max (%d), limiting to %d pages", totalPages, maxPages, maxPages)
		totalPages = maxPages
	}

	log.Printf("📄 Fetching paginated API: total=%d, pageSize=%d, totalPages=%d", paginationInfo.TotalCount, pageSize, totalPages)

	// Resolve API URL to absolute if it's relative
	apiURL := paginationInfo.OriginalURL

	// Remove #index suffix from URL if present (our internal tracking suffix)
	if idx := strings.LastIndex(apiURL, "#"); idx > 0 {
		apiURL = apiURL[:idx]
	}

	// If URL is relative, resolve against baseURL
	if !strings.HasPrefix(apiURL, "http://") && !strings.HasPrefix(apiURL, "https://") {
		baseURLParsed, err := url.Parse(baseURL)
		if err == nil {
			// Build absolute URL
			if strings.HasPrefix(apiURL, "/") {
				apiURL = baseURLParsed.Scheme + "://" + baseURLParsed.Host + apiURL
			} else {
				apiURL = baseURL + "/" + apiURL
			}
			log.Printf("📝 Resolved relative API URL to: %s", apiURL)
		}
	}

	// Get captured request details if available
	// Note: Captured requests are stored with index-based keys (URL#index) so we need to search
	var capturedRequest *CapturedAPIRequest
	if s.lastCapturedRequests != nil {
		// Extract path from originalURL for matching (handles relative URLs)
		originalPath := paginationInfo.OriginalURL
		if idx := strings.LastIndex(originalPath, "#"); idx > 0 {
			originalPath = originalPath[:idx]
		}

		log.Printf("📝 Looking for captured request matching path: %s", originalPath)
		log.Printf("📝 Available captured requests: %d", len(s.lastCapturedRequests))

		// Search for matching URL by path (since keys might be relative or absolute)
		for key, req := range s.lastCapturedRequests {
			// Extract path from key (remove #index suffix and host if present)
			keyPath := key
			if idx := strings.LastIndex(keyPath, "#"); idx > 0 {
				keyPath = keyPath[:idx]
			}

			// Also extract just the path portion from full URLs
			keyPathOnly := keyPath
			if parsedKey, err := url.Parse(keyPath); err == nil && parsedKey.Host != "" {
				keyPathOnly = parsedKey.Path
			}

			// Compare paths (match if either is a suffix of the other, or exact match)
			matchesByPath := keyPath == originalPath ||
				keyPathOnly == originalPath ||
				strings.HasSuffix(keyPath, originalPath) ||
				strings.HasSuffix(originalPath, keyPath) ||
				strings.HasSuffix(keyPathOnly, originalPath)

			// Skip empty POST data (some JS interceptors capture empty `{}`)
			hasValidPostData := req.PostData != "" && req.PostData != "{}" && len(req.PostData) > 10

			log.Printf("📝 Checking key: %s, keyPath: %s, keyPathOnly: %s, matchesByPath: %v, hasPostData: %v (len=%d)",
				key, keyPath, keyPathOnly, matchesByPath, hasValidPostData, len(req.PostData))

			if matchesByPath && hasValidPostData {
				capturedRequest = req
				log.Printf("✅ Found captured POST request for pagination: %s (matched path: %s)", key, originalPath)
				break
			}
		}
	}

	// Determine if this is a POST request with body pagination
	isPostRequest := capturedRequest != nil && strings.EqualFold(capturedRequest.Method, "POST") && capturedRequest.PostData != "" && capturedRequest.PostData != "{}"
	if isPostRequest {
		log.Printf("📝 Will use POST pagination with captured request body (len=%d)", len(capturedRequest.PostData))
		log.Printf("📝 POST data preview: %s", capturedRequest.PostData[:min(200, len(capturedRequest.PostData))])

		// Try to detect actual page size from POST data (multipart or JSON)
		detectedPageSize := s.detectPageSizeFromPostData(capturedRequest.PostData)
		if detectedPageSize > 0 && detectedPageSize != pageSize {
			log.Printf("📝 Detected actual page size from POST data: %d (was: %d)", detectedPageSize, pageSize)
			pageSize = detectedPageSize
			// Recalculate total pages with correct page size
			totalPages = (paginationInfo.TotalCount + pageSize - 1) / pageSize
			if totalPages > maxPages {
				totalPages = maxPages
			}
			log.Printf("📄 Recalculated: total=%d, pageSize=%d, totalPages=%d", paginationInfo.TotalCount, pageSize, totalPages)
		}
	} else {
		log.Printf("⚠️ No captured POST request found with valid data, will try GET pagination")
	}

	// Parse resolved URL for GET pagination
	parsedURL, err := url.Parse(apiURL)
	if err != nil {
		return allJobs, fmt.Errorf("failed to parse API URL: %w", err)
	}

	// Track seen job IDs/URLs to avoid duplicates
	seenJobs := make(map[string]bool)
	for _, job := range allJobs {
		if job.URL != "" {
			seenJobs[job.URL] = true
		} else if job.ID != "" {
			seenJobs[job.ID] = true
		}
	}

	// Calculate starting offset based on already fetched jobs
	// This accounts for cases where initial capture grabbed multiple pages via scrolling
	startingOffset := len(allJobs)
	startingPage := (startingOffset / pageSize) + 1
	if startingPage < 2 {
		startingPage = 2
	}
	log.Printf("📄 Starting pagination from page %d (offset=%d) based on %d already captured jobs", startingPage, startingOffset, len(allJobs))

	// Fetch remaining pages
	for page := startingPage; page <= totalPages; page++ {
		select {
		case <-ctx.Done():
			return allJobs, ctx.Err()
		default:
		}

		// Use offset based on jobs we already have, not just page number
		offset := startingOffset + (page-startingPage)*pageSize
		var responseBody string
		var fetchErr error

		if isPostRequest {
			// Handle POST request pagination (modify the request body)
			responseBody, fetchErr = s.fetchPaginatedPOSTEndpoint(ctx, apiURL, capturedRequest, offset, page, pageSize)
		} else {
			// Handle GET request pagination (modify URL params)
			q := parsedURL.Query()

			switch paginationInfo.PaginationType {
			case "offset":
				// Check which offset param the original URL used
				if q.Has("from") {
					q.Set("from", fmt.Sprintf("%d", offset))
				} else if q.Has("start") {
					q.Set("start", fmt.Sprintf("%d", offset))
				} else if q.Has("skip") {
					q.Set("skip", fmt.Sprintf("%d", offset))
				} else {
					q.Set("offset", fmt.Sprintf("%d", offset))
				}
			case "page":
				if q.Has("pageNumber") {
					q.Set("pageNumber", fmt.Sprintf("%d", page))
				} else if q.Has("page_number") {
					q.Set("page_number", fmt.Sprintf("%d", page))
				} else {
					q.Set("page", fmt.Sprintf("%d", page))
				}
			case "cursor":
				if paginationInfo.NextCursor != "" {
					q.Set("cursor", paginationInfo.NextCursor)
				} else {
					log.Printf("⚠️ Cursor pagination requires next cursor, stopping at page %d", page-1)
					break
				}
			default:
				q.Set("offset", fmt.Sprintf("%d", offset))
			}

			parsedURL.RawQuery = q.Encode()
			paginatedURL := parsedURL.String()

			log.Printf("📥 Fetching page %d (GET): %s", page, paginatedURL)
			responseBody, fetchErr = s.fetchAPIEndpoint(ctx, paginatedURL)
		}

		if fetchErr != nil {
			log.Printf("⚠️ Failed to fetch page %d: %v", page, fetchErr)
			continue
		}

		// Extract jobs from response
		pageJobs := s.extractJobsFromAPIResponse(responseBody, baseURL)
		if len(pageJobs) == 0 {
			log.Printf("⚠️ No jobs found on page %d, stopping pagination", page)
			break
		}

		// Add unique jobs
		newCount := 0
		for _, job := range pageJobs {
			key := job.URL
			if key == "" {
				key = job.ID
			}
			if key != "" && !seenJobs[key] {
				seenJobs[key] = true
				allJobs = append(allJobs, job)
				newCount++
			}
		}

		log.Printf("✅ Page %d: found %d jobs (%d new)", page, len(pageJobs), newCount)

		// If no new jobs, we've likely reached the end
		if newCount == 0 {
			log.Printf("🛑 No new jobs on page %d, stopping pagination", page)
			break
		}

		// Update cursor if applicable
		if paginationInfo.PaginationType == "cursor" {
			newPagInfo := s.detectAPIPagination(responseBody, paginationInfo.OriginalURL)
			if newPagInfo != nil && newPagInfo.NextCursor != "" {
				paginationInfo.NextCursor = newPagInfo.NextCursor
			} else {
				break // No more cursor
			}
		}

		// Rate limiting - be respectful
		time.Sleep(500 * time.Millisecond)
	}

	log.Printf("✅ Pagination complete: fetched %d total jobs", len(allJobs))
	return allJobs, nil
}

// fetchPaginatedPOSTEndpoint fetches a paginated API endpoint using POST request
func (s *ScraperService) fetchPaginatedPOSTEndpoint(ctx context.Context, apiURL string, originalRequest *CapturedAPIRequest, offset int, page int, pageSize int) (string, error) {
	postDataStr := originalRequest.PostData

	// Check if POST data is base64 encoded (common for multipart form data captured from browser)
	if decoded, err := base64.StdEncoding.DecodeString(postDataStr); err == nil {
		// Successfully decoded - check if it looks like multipart form data
		if strings.Contains(string(decoded), "WebKitFormBoundary") || strings.Contains(string(decoded), "Content-Disposition") {
			postDataStr = string(decoded)
			log.Printf("📝 Decoded base64 multipart form data")
		}
	}

	// Check if this is multipart form data
	if strings.Contains(postDataStr, "WebKitFormBoundary") || strings.Contains(postDataStr, "Content-Disposition: form-data") {
		return s.fetchPaginatedMultipartEndpoint(ctx, apiURL, postDataStr, offset, pageSize)
	}

	// Parse the original POST data as JSON
	var postData map[string]interface{}
	if err := json.Unmarshal([]byte(postDataStr), &postData); err != nil {
		// If not JSON and not multipart, try URL-encoded form data
		if strings.Contains(postDataStr, "=") && strings.Contains(postDataStr, "&") {
			return s.fetchPaginatedFormURLEncodedEndpoint(ctx, apiURL, postDataStr, offset, pageSize)
		}

		// Fall back to URL-based pagination
		log.Printf("⚠️ POST data is not JSON/form, trying URL modification instead")
		parsedURL, _ := url.Parse(apiURL)
		q := parsedURL.Query()
		q.Set("from", fmt.Sprintf("%d", offset))
		parsedURL.RawQuery = q.Encode()
		return s.fetchAPIEndpoint(ctx, parsedURL.String())
	}

	// Modify pagination fields in the POST body
	// Try common pagination field names
	paginationModified := false

	// Offset-based pagination fields
	offsetFields := []string{"from", "offset", "start", "skip", "startIndex"}
	for _, field := range offsetFields {
		if _, exists := postData[field]; exists {
			postData[field] = offset
			paginationModified = true
			log.Printf("📝 Modified POST body field '%s' = %d", field, offset)
			break
		}
	}

	// Page-based pagination fields
	if !paginationModified {
		pageFields := []string{"page", "pageNumber", "page_number", "currentPage"}
		for _, field := range pageFields {
			if _, exists := postData[field]; exists {
				postData[field] = page
				paginationModified = true
				log.Printf("📝 Modified POST body field '%s' = %d", field, page)
				break
			}
		}
	}

	// If no pagination field found, try adding common ones
	if !paginationModified {
		// Check if there's a nested pagination object
		if pagination, ok := postData["pagination"].(map[string]interface{}); ok {
			if _, exists := pagination["from"]; exists {
				pagination["from"] = offset
				paginationModified = true
			} else if _, exists := pagination["offset"]; exists {
				pagination["offset"] = offset
				paginationModified = true
			} else if _, exists := pagination["page"]; exists {
				pagination["page"] = page
				paginationModified = true
			}
		}
	}

	// If still no modification, try to add 'from' field (common for Elasticsearch-style APIs)
	if !paginationModified {
		postData["from"] = offset
		log.Printf("📝 Added POST body field 'from' = %d", offset)
	}

	// Serialize the modified POST data
	modifiedPostData, err := json.Marshal(postData)
	if err != nil {
		return "", fmt.Errorf("failed to marshal modified POST data: %w", err)
	}

	log.Printf("📥 Fetching page %d (POST JSON): %s", page, apiURL)

	// Create the POST request
	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewBuffer(modifiedPostData))
	if err != nil {
		return "", fmt.Errorf("failed to create POST request: %w", err)
	}

	// Copy original headers
	for k, v := range originalRequest.Headers {
		req.Header.Set(k, v)
	}

	// Ensure content-type is set
	if req.Header.Get("Content-Type") == "" {
		req.Header.Set("Content-Type", "application/json")
	}

	// Set standard browser headers
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("POST request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	return string(body), nil
}

// fetchPaginatedMultipartEndpoint handles multipart form data pagination
func (s *ScraperService) fetchPaginatedMultipartEndpoint(ctx context.Context, apiURL string, originalFormData string, offset int, pageSize int) (string, error) {
	log.Printf("📝 Processing multipart form data for pagination (offset=%d, pageSize=%d)", offset, pageSize)

	// Parse the original multipart form data to extract fields
	formFields := make(map[string]string)

	// Find the boundary
	var boundary string
	boundaryMatch := regexp.MustCompile(`-+WebKitFormBoundary[a-zA-Z0-9]+`).FindString(originalFormData)
	if boundaryMatch != "" {
		boundary = strings.TrimPrefix(boundaryMatch, "--")
	} else {
		boundary = "WebKitFormBoundaryGenerated"
	}

	// Parse fields from multipart data
	parts := strings.Split(originalFormData, boundaryMatch)
	for _, part := range parts {
		if strings.Contains(part, "Content-Disposition: form-data;") {
			// Extract field name
			nameMatch := regexp.MustCompile(`name="([^"]+)"`).FindStringSubmatch(part)
			if len(nameMatch) > 1 {
				fieldName := nameMatch[1]
				// Extract value (after double newline)
				valueParts := strings.SplitN(part, "\r\n\r\n", 2)
				if len(valueParts) < 2 {
					valueParts = strings.SplitN(part, "\n\n", 2)
				}
				if len(valueParts) > 1 {
					value := strings.TrimSpace(valueParts[1])
					value = strings.TrimSuffix(value, "\r\n")
					value = strings.TrimSuffix(value, "\n")
					formFields[fieldName] = value
				}
			}
		}
	}

	log.Printf("📝 Parsed multipart fields: %v", formFields)

	// Modify pagination fields
	offsetFields := []string{"startIndex", "from", "offset", "start", "skip"}
	for _, field := range offsetFields {
		if _, exists := formFields[field]; exists {
			formFields[field] = fmt.Sprintf("%d", offset)
			log.Printf("📝 Modified multipart field '%s' = %d", field, offset)
			break
		}
	}

	// If no offset field exists, add startIndex (common for Accenture-style)
	foundOffset := false
	for _, field := range offsetFields {
		if _, exists := formFields[field]; exists {
			foundOffset = true
			break
		}
	}
	if !foundOffset {
		formFields["startIndex"] = fmt.Sprintf("%d", offset)
		log.Printf("📝 Added multipart field 'startIndex' = %d", offset)
	}

	// Create new multipart form data
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Set the boundary to match original format
	writer.SetBoundary(boundary)

	// Write all fields
	for name, value := range formFields {
		if err := writer.WriteField(name, value); err != nil {
			return "", fmt.Errorf("failed to write form field: %w", err)
		}
	}

	writer.Close()

	log.Printf("📥 Fetching page (POST multipart): %s (offset=%d)", apiURL, offset)

	// Create the POST request
	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, &buf)
	if err != nil {
		return "", fmt.Errorf("failed to create POST request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
	req.Header.Set("Origin", strings.TrimSuffix(apiURL, "/api/accenture/elastic/findjobs"))
	req.Header.Set("Referer", apiURL)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("POST request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("⚠️ Multipart POST returned status %d: %s", resp.StatusCode, string(body)[:min(200, len(body))])
		return "", fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	log.Printf("✅ Multipart POST successful, response size: %d", len(body))
	return string(body), nil
}

// fetchPaginatedFormURLEncodedEndpoint handles URL-encoded form data pagination
func (s *ScraperService) fetchPaginatedFormURLEncodedEndpoint(ctx context.Context, apiURL string, originalFormData string, offset int, pageSize int) (string, error) {
	// Parse original form data
	values, err := url.ParseQuery(originalFormData)
	if err != nil {
		return "", fmt.Errorf("failed to parse form data: %w", err)
	}

	// Modify pagination fields
	offsetFields := []string{"startIndex", "from", "offset", "start", "skip"}
	modified := false
	for _, field := range offsetFields {
		if values.Has(field) {
			values.Set(field, fmt.Sprintf("%d", offset))
			modified = true
			log.Printf("📝 Modified form field '%s' = %d", field, offset)
			break
		}
	}

	if !modified {
		values.Set("startIndex", fmt.Sprintf("%d", offset))
		log.Printf("📝 Added form field 'startIndex' = %d", offset)
	}

	log.Printf("📥 Fetching page (POST form-urlencoded): %s", apiURL)

	// Create the POST request
	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, strings.NewReader(values.Encode()))
	if err != nil {
		return "", fmt.Errorf("failed to create POST request: %w", err)
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("POST request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	return string(body), nil
}

// detectPageSizeFromPostData extracts the page size from POST data (multipart or JSON)
func (s *ScraperService) detectPageSizeFromPostData(postData string) int {
	// Try to decode base64 if it looks encoded
	decodedData := postData
	if decoded, err := base64.StdEncoding.DecodeString(postData); err == nil {
		if strings.Contains(string(decoded), "WebKitFormBoundary") || strings.Contains(string(decoded), "Content-Disposition") {
			decodedData = string(decoded)
		}
	}

	// Check for multipart form data
	if strings.Contains(decodedData, "WebKitFormBoundary") || strings.Contains(decodedData, "Content-Disposition: form-data") {
		// Parse multipart to find page size fields using the same parsing logic as fetchPaginatedMultipartEndpoint
		pageSizeFields := []string{"maxResultSize", "pageSize", "page_size", "size", "limit", "perPage", "per_page", "count"}

		// Find boundary
		boundaryMatch := regexp.MustCompile(`-+WebKitFormBoundary[a-zA-Z0-9]+`).FindString(decodedData)
		if boundaryMatch != "" {
			parts := strings.Split(decodedData, boundaryMatch)
			for _, part := range parts {
				if strings.Contains(part, "Content-Disposition: form-data;") {
					// Extract field name
					nameMatch := regexp.MustCompile(`name="([^"]+)"`).FindStringSubmatch(part)
					if len(nameMatch) > 1 {
						fieldName := nameMatch[1]
						// Check if this is a page size field
						for _, pageSizeField := range pageSizeFields {
							if strings.EqualFold(fieldName, pageSizeField) {
								// Extract value after the double newline
								valuePart := part[strings.Index(part, `name="`+fieldName+`"`)+len(`name="`+fieldName+`"`):]
								// Skip whitespace and newlines to get to the value
								valuePart = strings.TrimLeft(valuePart, "\r\n \t")
								// Extract numeric value
								valueMatch := regexp.MustCompile(`^(\d+)`).FindStringSubmatch(valuePart)
								if len(valueMatch) > 1 {
									var pageSize int
									fmt.Sscanf(valueMatch[1], "%d", &pageSize)
									if pageSize > 0 && pageSize <= 100 {
										log.Printf("📊 Detected page size %d from multipart field '%s'", pageSize, fieldName)
										return pageSize
									}
								}
							}
						}
					}
				}
			}
		}
		return 0
	}

	// Try JSON parsing
	var jsonData map[string]interface{}
	if err := json.Unmarshal([]byte(postData), &jsonData); err == nil {
		pageSizeFields := []string{"maxResultSize", "pageSize", "page_size", "size", "limit", "perPage", "per_page", "count"}
		for _, field := range pageSizeFields {
			if val, ok := jsonData[field]; ok {
				switch v := val.(type) {
				case float64:
					if int(v) > 0 && int(v) <= 100 {
						return int(v)
					}
				case int:
					if v > 0 && v <= 100 {
						return v
					}
				}
			}
		}
	}

	return 0
}

// fetchAPIEndpoint makes an HTTP request to fetch API data
func (s *ScraperService) fetchAPIEndpoint(ctx context.Context, apiURL string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers to mimic browser
	req.Header.Set("Accept", "application/json, text/plain, */*")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")
	req.Header.Set("Sec-Fetch-Dest", "empty")
	req.Header.Set("Sec-Fetch-Mode", "cors")
	req.Header.Set("Sec-Fetch-Site", "same-origin")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response: %w", err)
	}

	return string(body), nil
}

// findJobsInJSON recursively searches JSON data for job listings
func (s *ScraperService) findJobsInJSON(data interface{}, baseURL string) []APIJobListing {
	var jobs []APIJobListing

	switch v := data.(type) {
	case []interface{}:
		// Check if this array contains job objects
		potentialJobs := s.tryExtractJobsFromArray(v, baseURL)
		if len(potentialJobs) > 0 {
			jobs = append(jobs, potentialJobs...)
		} else {
			// Recurse into array elements
			for _, item := range v {
				jobs = append(jobs, s.findJobsInJSON(item, baseURL)...)
			}
		}
	case map[string]interface{}:
		// Check common keys that contain job arrays
		jobArrayKeys := []string{
			"jobs", "positions", "results", "data", "items", "postings",
			"openings", "vacancies", "requisitions", "jobPostings", "jobListings",
			"searchResults", "hits", "content", "records", "list",
			"jobSearchResult", "JobSearchResult", "searchResult", "SearchResult",
		}

		for _, key := range jobArrayKeys {
			if arr, ok := v[key]; ok {
				foundJobs := s.findJobsInJSON(arr, baseURL)
				if len(foundJobs) > 0 {
					jobs = append(jobs, foundJobs...)
					return jobs // Return once we find jobs
				}
			}
		}

		// Also check nested objects
		for _, value := range v {
			jobs = append(jobs, s.findJobsInJSON(value, baseURL)...)
		}
	}

	return jobs
}

// tryExtractJobsFromArray tries to extract job listings from a JSON array
func (s *ScraperService) tryExtractJobsFromArray(arr []interface{}, baseURL string) []APIJobListing {
	var jobs []APIJobListing

	// Need at least a few items to be considered a job list
	if len(arr) < 1 {
		return jobs
	}

	// Check if items look like job objects
	jobCount := 0
	for _, item := range arr {
		if obj, ok := item.(map[string]interface{}); ok {
			if s.looksLikeJobObject(obj) {
				job := s.extractJobFromObject(obj, baseURL)
				if job.Title != "" {
					jobs = append(jobs, job)
					jobCount++
				}
			}
		}
	}

	// Only return if we found multiple jobs (to avoid false positives)
	if jobCount >= 1 {
		return jobs
	}
	return nil
}

// looksLikeJobObject checks if a JSON object looks like a job posting
func (s *ScraperService) looksLikeJobObject(obj map[string]interface{}) bool {
	// Check for nested "response" object (HCL/SAP SuccessFactors pattern)
	checkObj := obj
	if response, ok := obj["response"].(map[string]interface{}); ok {
		checkObj = response
	}

	// Must have a title-like field
	titleFields := []string{"title", "name", "jobTitle", "job_title", "positionTitle", "position_title", "position",
		"unifiedStandardTitle", "standardTitle", "jobName"}
	hasTitle := false
	for _, field := range titleFields {
		if _, ok := checkObj[field]; ok {
			hasTitle = true
			break
		}
	}

	if !hasTitle {
		return false
	}

	// Should have at least one other job-related field
	jobFields := []string{
		"id", "jobId", "job_id", "requisitionId", "requisition_id",
		"location", "department", "description", "url", "href", "link",
		"company", "employmentType", "employment_type", "type",
		"postedDate", "posted_date", "datePosted", "date_posted",
		"urlTitle", "unifiedUrlTitle", "custCountryRegion", "jobRole",
	}

	count := 0
	for _, field := range jobFields {
		if _, ok := checkObj[field]; ok {
			count++
		}
	}

	return count >= 1
}

// extractJobFromObject extracts job data from a JSON object
func (s *ScraperService) extractJobFromObject(obj map[string]interface{}, baseURL string) APIJobListing {
	job := APIJobListing{
		RawData: obj,
	}

	// Check for nested "response" object (HCL/SAP SuccessFactors pattern)
	dataObj := obj
	if response, ok := obj["response"].(map[string]interface{}); ok {
		dataObj = response
	}

	// Extract ID - check multiple possible field names
	idFields := []string{"id", "jobId", "job_id", "requisitionId", "requisition_id", "reqId", "req_id",
		"positionId", "position_id", "postingId", "posting_id", "externalId", "external_id", "jobNumber", "job_number",
		"jobSeqNo", "job_seq_no", "refNumber", "ref_number", "referenceNumber", "jobRole"}
	for _, field := range idFields {
		if val, ok := dataObj[field]; ok {
			job.ID = fmt.Sprintf("%v", val)
			break
		}
	}

	// Also check nested _source for Elasticsearch-style responses
	if job.ID == "" {
		if source, ok := obj["_source"].(map[string]interface{}); ok {
			for _, field := range idFields {
				if val, ok := source[field]; ok {
					job.ID = fmt.Sprintf("%v", val)
					break
				}
			}
		}
	}

	// Extract title - including HCL/SAP SuccessFactors field names
	titleFields := []string{"title", "name", "jobTitle", "job_title", "positionTitle", "position_title", "position",
		"jobName", "job_name", "postedJobTitle", "unifiedStandardTitle", "standardTitle"}
	for _, field := range titleFields {
		if val, ok := dataObj[field].(string); ok && val != "" {
			job.Title = val
			break
		}
	}

	// Also check nested _source for Elasticsearch-style responses
	if job.Title == "" {
		if source, ok := obj["_source"].(map[string]interface{}); ok {
			for _, field := range titleFields {
				if val, ok := source[field].(string); ok && val != "" {
					job.Title = val
					break
				}
			}
		}
	}

	// Extract URL slug for HCL/SAP SuccessFactors (urlTitle or unifiedUrlTitle)
	var urlSlug string
	slugFields := []string{"urlTitle", "unifiedUrlTitle"}
	for _, field := range slugFields {
		if val, ok := dataObj[field].(string); ok && val != "" {
			urlSlug = val
			break
		}
	}

	// Build HCL-style URL if we have urlSlug and id
	if urlSlug != "" && job.ID != "" {
		// Check if this is an HCL careers site
		if strings.Contains(baseURL, "careers.hcltech.com") || strings.Contains(baseURL, "hcltech.com") {
			// HCL format: /job/{urlTitle}/{id}-en_US
			job.URL = fmt.Sprintf("https://careers.hcltech.com/job/%s/%s-en_US", urlSlug, job.ID)
		}
	}

	// Build TCS iBegin URL if we have an ID and it's a TCS site
	if job.URL == "" && job.ID != "" {
		if strings.Contains(baseURL, "ibegin.tcsapps.com") || strings.Contains(baseURL, "tcsapps.com") {
			// TCS format: /candidate/jobs/{id}
			job.URL = fmt.Sprintf("https://ibegin.tcsapps.com/candidate/jobs/%s", job.ID)
		}
	}

	// Extract URL - check many possible field names including nested structures
	urlFields := []string{"url", "href", "link", "applyUrl", "apply_url", "jobUrl", "job_url",
		"detailUrl", "detail_url", "absoluteUrl", "absolute_url", "canonicalUrl", "canonical_url",
		"pageUrl", "page_url", "jobDetailUrl", "job_detail_url", "viewUrl", "view_url",
		"path", "slug", "uri", "seoUrl", "seo_url"}
	for _, field := range urlFields {
		if val, ok := obj[field].(string); ok && val != "" {
			job.URL = s.resolveJobURL(val, baseURL, job.ID)
			break
		}
	}

	// Check for URL in nested objects like "links", "urls", "_links"
	if job.URL == "" {
		linkContainerFields := []string{"links", "urls", "_links", "meta", "metadata"}
		for _, containerField := range linkContainerFields {
			if container, ok := obj[containerField].(map[string]interface{}); ok {
				for _, field := range urlFields {
					if val, ok := container[field].(string); ok && val != "" {
						job.URL = s.resolveJobURL(val, baseURL, job.ID)
						break
					}
				}
				// Also check for "self", "detail", "view" in _links style
				selfFields := []string{"self", "detail", "view", "canonical"}
				for _, field := range selfFields {
					if link, ok := container[field]; ok {
						switch l := link.(type) {
						case string:
							job.URL = s.resolveJobURL(l, baseURL, job.ID)
						case map[string]interface{}:
							if href, ok := l["href"].(string); ok {
								job.URL = s.resolveJobURL(href, baseURL, job.ID)
							}
						}
						if job.URL != "" {
							break
						}
					}
				}
				if job.URL != "" {
					break
				}
			}
		}
	}

	// Check _source for Elasticsearch-style responses
	if job.URL == "" {
		if source, ok := obj["_source"].(map[string]interface{}); ok {
			for _, field := range urlFields {
				if val, ok := source[field].(string); ok && val != "" {
					job.URL = s.resolveJobURL(val, baseURL, job.ID)
					break
				}
			}
		}
	}

	// If still no URL found, don't generate a fake one - return empty
	// The calling code should use HTML links as a fallback
	if job.URL == "" {
		log.Printf("⚠️ No URL found for job: %s (ID: %s)", job.Title, job.ID)
	}

	// Extract location - also check dataObj for nested response pattern
	locationFields := []string{"location", "locationName", "location_name", "city", "office", "custCountryRegion"}
	for _, field := range locationFields {
		if val, ok := dataObj[field]; ok {
			switch v := val.(type) {
			case string:
				job.Location = v
			case []interface{}:
				// Array of locations (like custCountryRegion)
				if len(v) > 0 {
					if str, ok := v[0].(string); ok {
						job.Location = str
					}
				}
			case map[string]interface{}:
				// Nested location object
				if name, ok := v["name"].(string); ok {
					job.Location = name
				} else if city, ok := v["city"].(string); ok {
					job.Location = city
				}
			}
			if job.Location != "" {
				break
			}
		}
	}

	// Extract company
	companyFields := []string{"company", "companyName", "company_name", "employer", "organization"}
	for _, field := range companyFields {
		if val, ok := obj[field]; ok {
			switch v := val.(type) {
			case string:
				job.Company = v
			case map[string]interface{}:
				if name, ok := v["name"].(string); ok {
					job.Company = name
				}
			}
			if job.Company != "" {
				break
			}
		}
	}

	// Extract department - also check dataObj for nested patterns
	deptFields := []string{"department", "departmentName", "department_name", "team", "category", "functionName", "function_name"}
	for _, field := range deptFields {
		if val, ok := dataObj[field]; ok {
			switch v := val.(type) {
			case string:
				job.Department = v
			case map[string]interface{}:
				if name, ok := v["name"].(string); ok {
					job.Department = name
				}
			}
			if job.Department != "" {
				break
			}
		}
	}

	// Extract description (often truncated in list APIs) - also check dataObj
	descFields := []string{"description", "shortDescription", "short_description", "summary", "excerpt", "skills"}
	for _, field := range descFields {
		if val, ok := dataObj[field].(string); ok && val != "" {
			job.Description = val
			break
		}
	}

	// Extract experience for TCS-style APIs
	if exp, ok := dataObj["experience"].(string); ok && exp != "" {
		if job.Description != "" {
			job.Description = job.Description + " | Experience: " + exp
		} else {
			job.Description = "Experience: " + exp
		}
	}

	return job
}

// resolveJobURL resolves a job URL to an absolute URL
func (s *ScraperService) resolveJobURL(jobURL string, baseURL string, jobID string) string {
	if jobURL == "" {
		// Don't generate fake URLs - return empty so we can use HTML links as fallback
		return ""
	}

	// Handle Accenture-style URLs with {0} placeholder for locale
	// Replace {0} with the locale from baseURL or default to common locales
	if strings.Contains(jobURL, "{0}") {
		// Try to extract locale from baseURL (e.g., "in-en" from "https://www.accenture.com/in-en/careers")
		parsedBase, err := url.Parse(baseURL)
		if err == nil {
			pathParts := strings.Split(strings.Trim(parsedBase.Path, "/"), "/")
			if len(pathParts) > 0 && len(pathParts[0]) >= 2 {
				// Check if first path part looks like a locale (e.g., "in-en", "us-en")
				locale := pathParts[0]
				if strings.Contains(locale, "-") || len(locale) == 2 {
					jobURL = strings.ReplaceAll(jobURL, "{0}", locale)
				}
			}
		}
		// If still has placeholder, use a default
		if strings.Contains(jobURL, "{0}") {
			jobURL = strings.ReplaceAll(jobURL, "{0}", "in-en") // Default to in-en for Accenture
		}
	}

	// Handle other template placeholders that might exist
	jobURL = strings.ReplaceAll(jobURL, "{locale}", "in-en")
	jobURL = strings.ReplaceAll(jobURL, "{language}", "en")

	// Already absolute
	if strings.HasPrefix(jobURL, "http://") || strings.HasPrefix(jobURL, "https://") {
		return jobURL
	}

	// Relative URL
	if strings.HasPrefix(jobURL, "/") {
		return baseURL + jobURL
	}

	return baseURL + "/" + jobURL
}

// ExtractJobLinksAuto extracts job links using auto-detection (API or HTML)
func (s *ScraperService) ExtractJobLinksAuto(ctx context.Context, listingURL string) (*dto.ExtractLinksResponse, error) {
	log.Printf("🔄 ExtractJobLinksAuto: Starting auto-detection for %s", listingURL)

	// First, analyze the page
	analysis, err := s.AnalyzeCareerPage(ctx, listingURL)
	if err != nil {
		return nil, fmt.Errorf("failed to analyze page: %w", err)
	}

	// Combine results from both sources
	// Strategy: Use API job titles (more accurate) but prefer HTML URLs when available
	allLinks := make(map[string]dto.ExtractedJobLink)

	// Create a map from job ID to HTML URL for matching
	// Accenture URLs contain job IDs like "id=ATCI-5179349-S1927080_en"
	htmlURLByJobID := make(map[string]string)
	for _, link := range analysis.HTMLJobLinks {
		if link.URL != "" {
			// Extract job ID from URL if present
			if strings.Contains(link.URL, "id=") {
				parsedURL, err := url.Parse(link.URL)
				if err == nil {
					jobID := parsedURL.Query().Get("id")
					if jobID != "" {
						htmlURLByJobID[jobID] = link.URL
					}
				}
			}
		}
	}

	// First add API jobs - these have accurate titles
	for _, apiJob := range analysis.APIJobListings {
		// Try to find matching HTML URL by job ID
		finalURL := apiJob.URL
		if apiJob.ID != "" {
			if htmlURL, found := htmlURLByJobID[apiJob.ID]; found {
				finalURL = htmlURL // Use HTML URL which is more reliable
				log.Printf("✅ Matched API job '%s' (ID: %s) with HTML URL: %s", apiJob.Title, apiJob.ID, htmlURL)
			}
		}

		// Skip if URL is still invalid (contains {0} placeholder or empty)
		if finalURL == "" || strings.Contains(finalURL, "{0}") || strings.Contains(finalURL, "{") {
			log.Printf("⚠️ Skipping job with invalid URL: %s (ID: %s, URL: %s)", apiJob.Title, apiJob.ID, apiJob.URL)
			continue
		}

		if _, exists := allLinks[finalURL]; !exists {
			allLinks[finalURL] = dto.ExtractedJobLink{
				URL:   finalURL,
				Title: apiJob.Title, // Use API title which is more accurate
			}
		}
	}

	// Then add remaining HTML links that weren't matched
	for _, link := range analysis.HTMLJobLinks {
		if link.URL != "" {
			if _, exists := allLinks[link.URL]; !exists {
				// Only add if title is meaningful (not generic "Read full job description")
				title := link.Title
				if title == "" || strings.Contains(strings.ToLower(title), "read full") || strings.Contains(strings.ToLower(title), "job description") {
					// Try to extract a better title from URL
					if strings.Contains(link.URL, "title=") {
						parsedURL, err := url.Parse(link.URL)
						if err == nil {
							titleParam := parsedURL.Query().Get("title")
							if titleParam != "" {
								title = strings.ReplaceAll(titleParam, "+", " ")
							}
						}
					}
				}
				if title != "" {
					allLinks[link.URL] = dto.ExtractedJobLink{
						URL:   link.URL,
						Title: title,
					}
				}
			}
		}
	}

	// Convert to slice
	var links []dto.ExtractedJobLink
	for _, link := range allLinks {
		links = append(links, link)
	}

	message := fmt.Sprintf("Detected source: %s", analysis.SourceType)
	if len(analysis.APIEndpoints) > 0 {
		message += fmt.Sprintf(", found %d API endpoint(s)", len(analysis.APIEndpoints))
	}

	return &dto.ExtractLinksResponse{
		Success:   true,
		SourceURL: listingURL,
		Links:     links,
		Total:     len(links),
		Message:   message,
	}, nil
}

// tryFetchDrupalViewsAjax attempts to manually trigger and fetch Drupal Views AJAX content
// This is used when we detect Drupal Views AJAX job loading but the AJAX calls weren't captured
func (s *ScraperService) tryFetchDrupalViewsAjax(ctx context.Context, pageURL string, htmlContent string) []APIJobListing {
	var jobs []APIJobListing

	// Parse the URL to get base URL
	parsedURL, err := url.Parse(pageURL)
	if err != nil {
		return jobs
	}
	baseURL := fmt.Sprintf("%s://%s", parsedURL.Scheme, parsedURL.Host)

	// Look for Drupal views configuration in the HTML
	// drupalSettings.views contains view configurations
	viewNameRegex := regexp.MustCompile(`"view_name"\s*:\s*"([^"]+)"`)
	viewDisplayRegex := regexp.MustCompile(`"view_display_id"\s*:\s*"([^"]+)"`)
	viewDomIDRegex := regexp.MustCompile(`"view_dom_id"\s*:\s*"([^"]+)"`)

	viewNameMatches := viewNameRegex.FindAllStringSubmatch(htmlContent, -1)
	viewDisplayMatches := viewDisplayRegex.FindAllStringSubmatch(htmlContent, -1)
	viewDomIDMatches := viewDomIDRegex.FindAllStringSubmatch(htmlContent, -1)

	// Find views that look like job/career views
	for i, match := range viewNameMatches {
		viewName := match[1]
		lowerViewName := strings.ToLower(viewName)

		// Look for job-related view names
		if strings.Contains(lowerViewName, "job") ||
			strings.Contains(lowerViewName, "career") ||
			strings.Contains(lowerViewName, "opening") ||
			strings.Contains(lowerViewName, "position") ||
			strings.Contains(lowerViewName, "vacancy") {

			log.Printf("📋 Found Drupal job view: %s", viewName)

			viewDisplay := ""
			if i < len(viewDisplayMatches) {
				viewDisplay = viewDisplayMatches[i][1]
			}
			viewDomID := ""
			if i < len(viewDomIDMatches) {
				viewDomID = viewDomIDMatches[i][1]
			}

			// Try to fetch this view via AJAX
			viewJobs := s.fetchDrupalView(ctx, baseURL, viewName, viewDisplay, viewDomID)
			jobs = append(jobs, viewJobs...)
		}
	}

	// If no job views found, try common Drupal career view endpoints
	if len(jobs) == 0 {
		log.Printf("📋 No job views found in drupalSettings, trying common endpoints")

		// Common Drupal views for careers/jobs
		commonViews := []struct {
			name    string
			display string
		}{
			{"careers", "block_1"},
			{"jobs", "block_1"},
			{"job_listings", "block_1"},
			{"hcl_ers_career_jobs", "block_1"}, // HCL specific
			{"career_jobs", "block_1"},
			{"openings", "block_1"},
		}

		for _, view := range commonViews {
			viewJobs := s.fetchDrupalView(ctx, baseURL, view.name, view.display, "")
			if len(viewJobs) > 0 {
				log.Printf("✅ Found %d jobs from Drupal view: %s", len(viewJobs), view.name)
				jobs = append(jobs, viewJobs...)
				break // Found jobs, stop trying
			}
		}
	}

	return jobs
}

// fetchDrupalView makes a Drupal Views AJAX request to fetch view content
func (s *ScraperService) fetchDrupalView(ctx context.Context, baseURL string, viewName string, viewDisplay string, viewDomID string) []APIJobListing {
	var jobs []APIJobListing

	// Drupal Views AJAX endpoint
	ajaxURL := baseURL + "/views/ajax"

	// Build form data for Drupal AJAX request
	formData := url.Values{}
	formData.Set("view_name", viewName)
	formData.Set("view_display_id", viewDisplay)
	if viewDomID != "" {
		formData.Set("view_dom_id", viewDomID)
	}
	formData.Set("page", "0")
	formData.Set("_wrapper_format", "drupal_ajax")

	// Make the request
	req, err := http.NewRequestWithContext(ctx, "POST", ajaxURL, strings.NewReader(formData.Encode()))
	if err != nil {
		log.Printf("⚠️ Failed to create Drupal AJAX request: %v", err)
		return jobs
	}

	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Accept", "application/json, text/javascript, */*; q=0.01")
	req.Header.Set("X-Requested-With", "XMLHttpRequest")
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("⚠️ Drupal AJAX request failed: %v", err)
		return jobs
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("⚠️ Drupal AJAX returned status %d for view %s", resp.StatusCode, viewName)
		return jobs
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("⚠️ Failed to read Drupal AJAX response: %v", err)
		return jobs
	}

	// Parse the Drupal AJAX response
	// It's an array of commands like: [{"command":"insert","data":"<html>"}]
	var ajaxResponse []map[string]interface{}
	if err := json.Unmarshal(body, &ajaxResponse); err != nil {
		log.Printf("⚠️ Failed to parse Drupal AJAX response: %v", err)
		return jobs
	}

	// Extract HTML from insert commands
	for _, cmd := range ajaxResponse {
		command, ok := cmd["command"].(string)
		if !ok {
			continue
		}
		if command == "insert" || command == "replaceWith" || command == "replace" {
			if htmlData, ok := cmd["data"].(string); ok && len(htmlData) > 0 {
				log.Printf("📋 Extracting jobs from Drupal AJAX insert command (%d bytes)", len(htmlData))
				extractedJobs := s.extractJobsFromDrupalHTML(htmlData, baseURL)
				jobs = append(jobs, extractedJobs...)
			}
		}
	}

	log.Printf("📋 Fetched %d jobs from Drupal view: %s/%s", len(jobs), viewName, viewDisplay)
	return jobs
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

		// Add small delay between requests to be respectful
		if i < len(urls)-1 {
			time.Sleep(500 * time.Millisecond)
		}
	}

	return &dto.BulkScrapeResponse{
		Results: results,
		Total:   len(urls),
		Success: successCount,
		Failed:  failedCount,
	}
}

// isSPAJobDetailSite checks if a URL is from a known SPA site that requires network capture
// for job detail pages (where content is loaded via JavaScript/API calls)
func (s *ScraperService) isSPAJobDetailSite(jobURL string) bool {
	lowerURL := strings.ToLower(jobURL)

	// TCS iBegin - AngularJS SPA
	if strings.Contains(lowerURL, "ibegin.tcsapps.com") {
		return true
	}

	// HCL Tech careers - also uses dynamic loading for job details
	if strings.Contains(lowerURL, "careers.hcltech.com/job/") {
		return true
	}

	// Workday job detail pages
	if strings.Contains(lowerURL, "myworkday") || strings.Contains(lowerURL, "workday.com") {
		return true
	}

	// SAP SuccessFactors
	if strings.Contains(lowerURL, "successfactors.com") || strings.Contains(lowerURL, "jobs.sap.com") {
		return true
	}

	// Greenhouse hosted pages (some are SPAs)
	if strings.Contains(lowerURL, "boards.greenhouse.io") && strings.Contains(lowerURL, "/jobs/") {
		return true
	}

	// Lever job pages
	if strings.Contains(lowerURL, "jobs.lever.co") {
		return true
	}

	return false
}

// scrapeJobDetailWithNetworkCapture scrapes a job detail page using chromedp with network
// interception to capture API responses that contain the actual job data
func (s *ScraperService) scrapeJobDetailWithNetworkCapture(ctx context.Context, jobURL string) (string, map[string]interface{}, error) {
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", "new"),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.Flag("disable-extensions", true),
		chromedp.Flag("disable-blink-features", "AutomationControlled"),
		chromedp.Flag("exclude-switches", "enable-automation"),
		chromedp.WindowSize(1920, 1080),
		chromedp.UserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"),
	)

	if chromePath := os.Getenv("CHROME_BIN"); chromePath != "" {
		opts = append(opts, chromedp.ExecPath(chromePath))
	}

	allocCtx, allocCancel := chromedp.NewExecAllocator(ctx, opts...)
	defer allocCancel()

	browserCtx, browserCancel := chromedp.NewContext(allocCtx)
	defer browserCancel()

	timeoutCtx, timeoutCancel := context.WithTimeout(browserCtx, 60*time.Second)
	defer timeoutCancel()

	// Store captured API responses
	var capturedJobData map[string]interface{}
	var capturedMutex sync.Mutex

	// Patterns for job detail API endpoints
	jobDetailPatterns := []string{
		"/api/v1/jobs/",
		"/api/jobs/",
		"/jobs/api/",
		"/job/",
		"/position/",
		"/posting/",
		"/requisition/",
		"/career-page-api/",
		"/job-api/",
		"/details",
		"/jobdetails",
		"/job-details",
	}

	// Set up network listener
	chromedp.ListenTarget(timeoutCtx, func(ev interface{}) {
		switch e := ev.(type) {
		case *network.EventLoadingFinished:
			go func(requestID network.RequestID) {
				var body string
				err := chromedp.Run(timeoutCtx, chromedp.ActionFunc(func(ctx context.Context) error {
					result, err := network.GetResponseBody(requestID).Do(ctx)
					if err != nil {
						return err
					}
					body = string(result)
					return nil
				}))

				if err != nil || len(body) < 50 {
					return
				}

				// Try to parse as JSON
				var jsonData map[string]interface{}
				if err := json.Unmarshal([]byte(body), &jsonData); err != nil {
					// Try as array
					var arrayData []interface{}
					if json.Unmarshal([]byte(body), &arrayData) != nil {
						return
					}
					// Wrap array in object
					jsonData = map[string]interface{}{"data": arrayData}
				}

				// Check if this looks like job data
				if s.looksLikeJobDetailData(jsonData) {
					capturedMutex.Lock()
					if capturedJobData == nil {
						capturedJobData = jsonData
						log.Printf("✅ Captured job detail API response")
					}
					capturedMutex.Unlock()
				}
			}(e.RequestID)
		}
	})

	// Enable network before navigation
	if err := chromedp.Run(timeoutCtx,
		network.Enable(),
		chromedp.ActionFunc(func(ctx context.Context) error {
			return chromedp.Evaluate(`
				Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
				window.chrome = { runtime: {} };
			`, nil).Do(ctx)
		}),
	); err != nil {
		return "", nil, fmt.Errorf("failed to enable network: %w", err)
	}

	// Inject fetch interceptor
	interceptorScript := fmt.Sprintf(`
		window.__jobDetailCaptured = null;
		const jobPatterns = %s;

		if (!window.__jobDetailIntercepted) {
			window.__jobDetailIntercepted = true;
			const originalFetch = window.fetch;
			window.fetch = async function(...args) {
				const url = typeof args[0] === 'string' ? args[0] : args[0].url;
				const response = await originalFetch.apply(this, args);
				try {
					const clonedResponse = response.clone();
					const contentType = clonedResponse.headers.get('content-type') || '';
					if (contentType.includes('json')) {
						const text = await clonedResponse.text();
						const lowerURL = url.toLowerCase();
						const isJobAPI = jobPatterns.some(p => lowerURL.includes(p));
						const hasJobData = text.toLowerCase().includes('"jobtitle"') ||
							text.toLowerCase().includes('"job_title"') ||
							text.toLowerCase().includes('"title"') ||
							text.toLowerCase().includes('"description"') ||
							text.toLowerCase().includes('"location"');
						if (isJobAPI || hasJobData) {
							try {
								window.__jobDetailCaptured = JSON.parse(text);
								console.log('Captured job detail:', url);
							} catch(e) {}
						}
					}
				} catch(e) {}
				return response;
			};

			// Also intercept XMLHttpRequest
			const originalXHROpen = XMLHttpRequest.prototype.open;
			const originalXHRSend = XMLHttpRequest.prototype.send;
			XMLHttpRequest.prototype.open = function(method, url) {
				this._url = url;
				return originalXHROpen.apply(this, arguments);
			};
			XMLHttpRequest.prototype.send = function() {
				this.addEventListener('load', function() {
					try {
						const lowerURL = (this._url || '').toLowerCase();
						const contentType = this.getResponseHeader('content-type') || '';
						if (contentType.includes('json')) {
							const isJobAPI = jobPatterns.some(p => lowerURL.includes(p));
							const text = this.responseText.toLowerCase();
							const hasJobData = text.includes('"jobtitle"') ||
								text.includes('"job_title"') ||
								text.includes('"title"') ||
								text.includes('"description"');
							if (isJobAPI || hasJobData) {
								try {
									window.__jobDetailCaptured = JSON.parse(this.responseText);
								} catch(e) {}
							}
						}
					} catch(e) {}
				});
				return originalXHRSend.apply(this, arguments);
			};
		}
	`, s.jsonStringArray(jobDetailPatterns))

	// Add script to run before page load
	if _, err := page.AddScriptToEvaluateOnNewDocument(interceptorScript).Do(timeoutCtx); err != nil {
		log.Printf("⚠️ Failed to add interceptor script: %v", err)
	}

	// Navigate and wait for page to load
	var html string
	err := chromedp.Run(timeoutCtx,
		chromedp.Navigate(jobURL),
		chromedp.WaitReady("body"),
		chromedp.Sleep(3*time.Second), // Wait for SPA to render and API calls to complete
		chromedp.OuterHTML("html", &html),
	)

	if err != nil {
		return "", nil, fmt.Errorf("chromedp navigation failed: %w", err)
	}

	// Try to get captured data from JavaScript
	var jsCapture map[string]interface{}
	chromedp.Run(timeoutCtx, chromedp.Evaluate(`window.__jobDetailCaptured`, &jsCapture))

	if jsCapture != nil && len(jsCapture) > 0 {
		capturedMutex.Lock()
		if capturedJobData == nil {
			capturedJobData = jsCapture
		}
		capturedMutex.Unlock()
	}

	return html, capturedJobData, nil
}

// looksLikeJobDetailData checks if the JSON data looks like job detail information
func (s *ScraperService) looksLikeJobDetailData(data map[string]interface{}) bool {
	// Check for nested data structures
	checkData := data
	if nested, ok := data["data"].(map[string]interface{}); ok {
		checkData = nested
	}
	if nested, ok := data["job"].(map[string]interface{}); ok {
		checkData = nested
	}
	if nested, ok := data["result"].(map[string]interface{}); ok {
		checkData = nested
	}
	if nested, ok := data["response"].(map[string]interface{}); ok {
		checkData = nested
	}

	// Look for common job detail fields
	titleFields := []string{"title", "jobTitle", "job_title", "positionTitle", "position_title", "name"}
	descFields := []string{"description", "jobDescription", "job_description", "details", "content"}
	locFields := []string{"location", "city", "address", "office", "region"}

	hasTitle := false
	hasDesc := false
	hasLoc := false

	for _, field := range titleFields {
		if _, ok := checkData[field]; ok {
			hasTitle = true
			break
		}
	}

	for _, field := range descFields {
		if _, ok := checkData[field]; ok {
			hasDesc = true
			break
		}
	}

	for _, field := range locFields {
		if _, ok := checkData[field]; ok {
			hasLoc = true
			break
		}
	}

	// Need at least title + (description or location) to be considered job data
	return hasTitle && (hasDesc || hasLoc)
}

// convertAPIDataToExtractedJob converts captured API data to ExtractedJob format
func (s *ScraperService) convertAPIDataToExtractedJob(apiData map[string]interface{}, jobURL string) *ExtractedJob {
	job := &ExtractedJob{}

	// Debug: log all top-level keys in the API data
	var topKeys []string
	for k := range apiData {
		topKeys = append(topKeys, k)
	}
	log.Printf("🔍 API data top-level keys: %v", topKeys)

	// Handle nested data structures (data, job, result, response)
	data := apiData
	if nested, ok := apiData["data"].(map[string]interface{}); ok {
		data = nested
		log.Printf("🔍 Using nested 'data' object")
	}
	if nested, ok := apiData["job"].(map[string]interface{}); ok {
		data = nested
		log.Printf("🔍 Using nested 'job' object")
	}
	if nested, ok := apiData["result"].(map[string]interface{}); ok {
		data = nested
		log.Printf("🔍 Using nested 'result' object")
	}
	if nested, ok := apiData["response"].(map[string]interface{}); ok {
		data = nested
		log.Printf("🔍 Using nested 'response' object")
	}

	// Debug: log all keys in the data object we're extracting from
	var dataKeys []string
	for k := range data {
		dataKeys = append(dataKeys, k)
	}
	log.Printf("🔍 Data object keys: %v", dataKeys)

	// Extract title
	titleFields := []string{"title", "jobTitle", "job_title", "positionTitle", "position_title", "name", "unifiedStandardTitle"}
	for _, field := range titleFields {
		if val, ok := data[field].(string); ok && val != "" {
			job.Title = val
			break
		}
	}

	// Extract company
	companyFields := []string{"company", "companyName", "company_name", "employer", "organization", "businessUnit"}
	for _, field := range companyFields {
		if val, ok := data[field].(string); ok && val != "" {
			job.Company = val
			break
		}
	}

	// Handle nested company object
	if job.Company == "" {
		if companyObj, ok := data["company"].(map[string]interface{}); ok {
			if name, ok := companyObj["name"].(string); ok {
				job.Company = name
			}
		}
	}

	// Set company name based on URL for known job portals
	if job.Company == "" {
		lowerURL := strings.ToLower(jobURL)
		if strings.Contains(lowerURL, "ibegin.tcsapps.com") || strings.Contains(lowerURL, "tcs.com") {
			job.Company = "Tata Consultancy Services (TCS)"
		} else if strings.Contains(lowerURL, "careers.hcltech.com") || strings.Contains(lowerURL, "hcltech.com") {
			job.Company = "HCL Technologies"
		} else if strings.Contains(lowerURL, "infosys.com") {
			job.Company = "Infosys"
		} else if strings.Contains(lowerURL, "wipro.com") {
			job.Company = "Wipro"
		} else if strings.Contains(lowerURL, "techmahindra.com") {
			job.Company = "Tech Mahindra"
		}
	}

	// Extract location
	locFields := []string{"location", "city", "office", "region", "custCountryRegion", "workLocation"}
	for _, field := range locFields {
		if val, ok := data[field].(string); ok && val != "" {
			job.Location = val
			break
		}
	}

	// Handle location as object
	if job.Location == "" {
		if locObj, ok := data["location"].(map[string]interface{}); ok {
			parts := []string{}
			if city, ok := locObj["city"].(string); ok && city != "" {
				parts = append(parts, city)
				job.City = city
			}
			if state, ok := locObj["state"].(string); ok && state != "" {
				parts = append(parts, state)
				job.State = state
			}
			if country, ok := locObj["country"].(string); ok && country != "" {
				parts = append(parts, country)
				job.Country = country
			}
			if len(parts) > 0 {
				job.Location = strings.Join(parts, ", ")
			}
		}
	}

	// Extract description
	descFields := []string{"description", "jobDescription", "job_description", "details", "content", "summary", "overview"}
	for _, field := range descFields {
		if val, ok := data[field].(string); ok && val != "" {
			job.Description = val
			break
		}
	}

	// Extract requirements
	reqFields := []string{"requirements", "qualifications", "required_skills", "requiredSkills", "mustHave", "must_have"}
	for _, field := range reqFields {
		if val, ok := data[field].(string); ok && val != "" {
			job.Requirements = val
			break
		}
		// Handle as array
		if arr, ok := data[field].([]interface{}); ok {
			var items []string
			for _, item := range arr {
				if str, ok := item.(string); ok {
					items = append(items, str)
				}
			}
			if len(items) > 0 {
				job.Requirements = strings.Join(items, "\n")
				break
			}
		}
	}

	// Extract skills - TCS uses "skilldetail" field
	skillFields := []string{"skills", "skilldetail", "skillDetail", "skill_detail", "desiredSkills", "desired_skills", "technologies", "tech_stack", "techStack", "keywords", "tags", "skillSet", "skill_set", "techSkills", "tech_skills", "primarySkills", "secondarySkills", "requiredSkills", "required_skills"}
	for _, field := range skillFields {
		rawVal, exists := data[field]
		if !exists {
			continue
		}

		// Debug: log what we find
		log.Printf("🔍 Found '%s' field, type: %T, value: %v", field, rawVal, rawVal)

		// Handle array of strings or objects
		if arr, ok := rawVal.([]interface{}); ok {
			log.Printf("🔍 Processing '%s' as array with %d items", field, len(arr))
			for _, item := range arr {
				if str, ok := item.(string); ok && str != "" {
					job.Skills = append(job.Skills, str)
				}
				if obj, ok := item.(map[string]interface{}); ok {
					// Check common nested name patterns
					nameFields := []string{"name", "skillName", "skill_name", "title", "value", "label", "skill"}
					for _, nameField := range nameFields {
						if name, ok := obj[nameField].(string); ok && name != "" {
							job.Skills = append(job.Skills, name)
							break
						}
					}
				}
			}
			if len(job.Skills) > 0 {
				break
			}
		}

		// Handle string value
		if val, ok := rawVal.(string); ok && val != "" {
			log.Printf("🔍 Processing '%s' as string: %s", field, val)
			// Split comma-separated or semicolon-separated skills
			separators := []string{",", ";", "|", " / "}
			found := false
			for _, sep := range separators {
				if strings.Contains(val, sep) {
					parts := strings.Split(val, sep)
					for _, skill := range parts {
						skill = strings.TrimSpace(skill)
						if skill != "" && len(skill) > 1 {
							job.Skills = append(job.Skills, skill)
						}
					}
					found = true
					break
				}
			}
			// If no separator found, treat as single skill
			if !found && len(job.Skills) == 0 {
				job.Skills = append(job.Skills, strings.TrimSpace(val))
			}
			if len(job.Skills) > 0 {
				break
			}
		}

		// Handle nested object with skill info (e.g., {"name": "Human Resource", "id": 123})
		if obj, ok := rawVal.(map[string]interface{}); ok {
			log.Printf("🔍 Processing '%s' as object with keys: %v", field, obj)
			nameFields := []string{"name", "skillName", "skill_name", "title", "value", "label", "skill", "text"}
			for _, nameField := range nameFields {
				if name, ok := obj[nameField].(string); ok && name != "" {
					job.Skills = append(job.Skills, name)
					break
				}
			}
			if len(job.Skills) > 0 {
				break
			}
		}

		// Handle any other type by converting to string
		if rawVal != nil && len(job.Skills) == 0 {
			strVal := fmt.Sprintf("%v", rawVal)
			if strVal != "" && strVal != "<nil>" && strVal != "null" && len(strVal) > 1 {
				log.Printf("🔍 Converting '%s' to string: %s", field, strVal)
				job.Skills = append(job.Skills, strVal)
				break
			}
		}
	}

	// Also check for skills in description or requirements as last resort
	if len(job.Skills) == 0 {
		log.Printf("🔍 No skills found in dedicated fields, will rely on AI extraction")
	}

	// Extract job type
	typeFields := []string{"type", "jobType", "job_type", "employmentType", "employment_type", "workType"}
	for _, field := range typeFields {
		if val, ok := data[field].(string); ok && val != "" {
			job.JobType = val
			break
		}
	}

	// Extract experience level
	expFields := []string{"experience", "experienceLevel", "experience_level", "seniority", "level", "careerLevel"}
	for _, field := range expFields {
		if val, ok := data[field].(string); ok && val != "" {
			job.ExperienceLevel = val
			break
		}
	}

	// Extract salary
	salaryFields := []string{"salary", "compensation", "pay", "salaryRange", "salary_range"}
	for _, field := range salaryFields {
		if val, ok := data[field].(string); ok && val != "" {
			job.Salary = val
			break
		}
		if obj, ok := data[field].(map[string]interface{}); ok {
			parts := []string{}
			if min, ok := obj["min"]; ok {
				parts = append(parts, fmt.Sprintf("%v", min))
			}
			if max, ok := obj["max"]; ok {
				parts = append(parts, fmt.Sprintf("%v", max))
			}
			if len(parts) > 0 {
				currency := "USD"
				if c, ok := obj["currency"].(string); ok {
					currency = c
				}
				job.Salary = fmt.Sprintf("%s %s", currency, strings.Join(parts, " - "))
				break
			}
		}
	}

	// Extract benefits
	benefitFields := []string{"benefits", "perks", "offerings"}
	for _, field := range benefitFields {
		if arr, ok := data[field].([]interface{}); ok {
			for _, item := range arr {
				if str, ok := item.(string); ok && str != "" {
					job.Benefits = append(job.Benefits, str)
				}
			}
			break
		}
	}

	log.Printf("📋 Converted API data to job: title=%s, company=%s, location=%s, skills=%d",
		job.Title, job.Company, job.Location, len(job.Skills))

	return job
}

// jsonStringArray converts a slice of strings to a JSON array string
func (s *ScraperService) jsonStringArray(arr []string) string {
	bytes, _ := json.Marshal(arr)
	return string(bytes)
}
