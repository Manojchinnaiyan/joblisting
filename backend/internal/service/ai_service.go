package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"job-platform/internal/dto"
	"log"
	"net/http"
	neturl "net/url"
	"os"
	"regexp"
	"strings"
	"time"

	"golang.org/x/net/html"
)

// extractAllLinks extracts all <a> href links from HTML using proper HTML parsing
func extractAllLinks(htmlContent string, baseURL string) []dto.ExtractedJobLink {
	var links []dto.ExtractedJobLink

	doc, err := html.Parse(strings.NewReader(htmlContent))
	if err != nil {
		log.Printf("⚠️ HTML parse error: %v", err)
		return links
	}

	// Parse base URL for resolving relative URLs
	base, err := neturl.Parse(baseURL)
	if err != nil {
		log.Printf("⚠️ Base URL parse error: %v", err)
		return links
	}

	var traverse func(*html.Node)
	traverse = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "a" {
			var href, title string
			for _, attr := range n.Attr {
				if attr.Key == "href" {
					href = attr.Val
				}
				if attr.Key == "title" || attr.Key == "aria-label" {
					title = attr.Val
				}
			}

			if href != "" {
				// Get text content of the link as title if not set
				if title == "" {
					title = getTextContent(n)
				}

				// Resolve relative URLs
				fullURL := resolveURL(href, base)
				if fullURL != "" {
					links = append(links, dto.ExtractedJobLink{
						URL:   fullURL,
						Title: strings.TrimSpace(title),
					})
				}
			}
		}

		for c := n.FirstChild; c != nil; c = c.NextSibling {
			traverse(c)
		}
	}

	traverse(doc)
	return links
}

// getTextContent extracts text content from an HTML node
func getTextContent(n *html.Node) string {
	var text strings.Builder
	var traverse func(*html.Node)
	traverse = func(n *html.Node) {
		if n.Type == html.TextNode {
			text.WriteString(n.Data)
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			traverse(c)
		}
	}
	traverse(n)
	return strings.TrimSpace(text.String())
}

// resolveURL resolves a relative URL against a base URL
func resolveURL(href string, base *neturl.URL) string {
	// Skip empty, javascript, and anchor-only links
	if href == "" || strings.HasPrefix(href, "javascript:") || strings.HasPrefix(href, "#") || strings.HasPrefix(href, "mailto:") {
		return ""
	}

	parsed, err := neturl.Parse(href)
	if err != nil {
		return ""
	}

	resolved := base.ResolveReference(parsed)
	return resolved.String()
}

// AIService handles AI-powered extraction from HTML content
type AIService struct {
	apiKey     string
	httpClient *http.Client
}

// NewAIService creates a new AI service instance
func NewAIService() *AIService {
	apiKey := os.Getenv("ANTHROPIC_API_KEY")
	return &AIService{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 120 * time.Second, // Increased for parallel operations
		},
	}
}

// ExtractedJob represents the extracted job data from AI
type ExtractedJob struct {
	Title           string   `json:"title"`
	Company         string   `json:"company"`
	CompanyLogo     string   `json:"company_logo"`
	Location        string   `json:"location"`
	City            string   `json:"city"`
	State           string   `json:"state"`
	Country         string   `json:"country"`
	Description     string   `json:"description"`
	Requirements    string   `json:"requirements"`
	Salary          string   `json:"salary"`
	JobType         string   `json:"job_type"`
	ExperienceLevel string   `json:"experience_level"`
	Skills          []string `json:"skills"`
	Benefits        []string `json:"benefits"`
}

// ClaudeRequest represents the request to Claude API
type ClaudeRequest struct {
	Model     string          `json:"model"`
	MaxTokens int             `json:"max_tokens"`
	Messages  []ClaudeMessage `json:"messages"`
}

// ClaudeMessage represents a message in Claude API
type ClaudeMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ClaudeResponse represents the response from Claude API
type ClaudeResponse struct {
	ID      string `json:"id"`
	Type    string `json:"type"`
	Role    string `json:"role"`
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
	Model        string `json:"model"`
	StopReason   string `json:"stop_reason"`
	StopSequence string `json:"stop_sequence"`
	Usage        struct {
		InputTokens  int `json:"input_tokens"`
		OutputTokens int `json:"output_tokens"`
	} `json:"usage"`
}

// ExtractJobFromHTML extracts job details from HTML content using Claude AI
func (s *AIService) ExtractJobFromHTML(ctx context.Context, html string, url string) (*ExtractedJob, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("ANTHROPIC_API_KEY environment variable not set")
	}

	// Clean and truncate HTML to avoid token limits
	cleanedHTML := s.cleanHTML(html)
	if len(cleanedHTML) > 50000 {
		cleanedHTML = cleanedHTML[:50000]
	}

	prompt := fmt.Sprintf(`You are a job posting extraction assistant. Extract job details from this HTML page.

URL: %s

HTML content:
%s

Extract and return a JSON object with these exact fields:
{
  "title": "Job title",
  "company": "Company name",
  "company_logo": "URL of company logo image (look for img tags with src containing logo, company name, or in header/nav areas)",
  "location": "Full location string (city, state, country or remote)",
  "city": "City name only",
  "state": "State/Province name only",
  "country": "Country name only",
  "description": "Full job description (keep HTML formatting if present)",
  "requirements": "Required qualifications and requirements",
  "salary": "Salary range if mentioned (e.g., '$100,000 - $150,000')",
  "job_type": "One of: FULL_TIME, PART_TIME, CONTRACT, FREELANCE, INTERNSHIP",
  "experience_level": "One of: ENTRY, MID, SENIOR, LEAD, EXECUTIVE",
  "skills": ["Array", "of", "specific", "skills"],
  "benefits": ["Array", "of", "benefits", "if", "mentioned"]
}

Rules:
1. If a field is not found, use empty string "" or empty array []
2. For company_logo, look for image URLs that contain the company logo. Check:
   - <img> tags with "logo" in class, id, alt, or src attributes
   - Images in the header, nav, or company info sections
   - Open Graph meta tags (og:image) that might contain company branding
   - Return the full absolute URL (starting with http:// or https://)
3. For job_type, map common terms: "full-time" -> "FULL_TIME", "part-time" -> "PART_TIME", etc.
4. For experience_level, infer from years required or job level mentioned
5. For skills, extract ONLY specific, concrete skills such as:
   - Technical tools and software (e.g., "Excel", "Power BI", "SAP", "AutoCAD")
   - Programming languages (e.g., "Python", "JavaScript", "SQL")
   - Frameworks and platforms (e.g., "React", "AWS", "Kubernetes")
   - Certifications (e.g., "NEBOSH", "PMP", "CPA", "Six Sigma")
   - Industry-specific tools (e.g., "Salesforce", "Telematics", "ERP Systems")
   - Methodologies (e.g., "Agile", "Scrum", "Lean")
   DO NOT include generic soft skills like "communication", "teamwork", "leadership", "problem-solving", "written", "verbal", etc.
   Keep skills concise (1-3 words each), capitalize properly
6. Keep the description in HTML format if it was HTML
7. Be thorough and extract all relevant information
8. Return ONLY valid JSON, no markdown formatting or extra text`, url, cleanedHTML)

	request := ClaudeRequest{
		Model:     "claude-3-haiku-20240307",
		MaxTokens: 4000,
		Messages: []ClaudeMessage{
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	requestBody, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.anthropic.com/v1/messages", bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-api-key", s.apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call Claude API: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("claude API error (status %d): %s", resp.StatusCode, string(body))
	}

	var claudeResp ClaudeResponse
	if err := json.Unmarshal(body, &claudeResp); err != nil {
		return nil, fmt.Errorf("failed to parse Claude response: %w", err)
	}

	if len(claudeResp.Content) == 0 {
		return nil, fmt.Errorf("empty response from Claude API")
	}

	// Extract JSON from response text
	responseText := claudeResp.Content[0].Text
	jsonStr := s.extractJSON(responseText)

	var extractedJob ExtractedJob
	if err := json.Unmarshal([]byte(jsonStr), &extractedJob); err != nil {
		return nil, fmt.Errorf("failed to parse extracted job data: %w (response: %s)", err, responseText)
	}

	return &extractedJob, nil
}

// cleanHTML removes scripts, styles, and unnecessary whitespace from HTML
func (s *AIService) cleanHTML(html string) string {
	// Remove script tags and content
	scriptRegex := regexp.MustCompile(`(?is)<script[^>]*>.*?</script>`)
	html = scriptRegex.ReplaceAllString(html, "")

	// Remove style tags and content
	styleRegex := regexp.MustCompile(`(?is)<style[^>]*>.*?</style>`)
	html = styleRegex.ReplaceAllString(html, "")

	// Remove comments
	commentRegex := regexp.MustCompile(`(?is)<!--.*?-->`)
	html = commentRegex.ReplaceAllString(html, "")

	// Remove SVG tags
	svgRegex := regexp.MustCompile(`(?is)<svg[^>]*>.*?</svg>`)
	html = svgRegex.ReplaceAllString(html, "")

	// Remove noscript tags
	noscriptRegex := regexp.MustCompile(`(?is)<noscript[^>]*>.*?</noscript>`)
	html = noscriptRegex.ReplaceAllString(html, "")

	// Remove header and footer navigation (common noise)
	headerRegex := regexp.MustCompile(`(?is)<header[^>]*>.*?</header>`)
	html = headerRegex.ReplaceAllString(html, "")

	footerRegex := regexp.MustCompile(`(?is)<footer[^>]*>.*?</footer>`)
	html = footerRegex.ReplaceAllString(html, "")

	// Collapse multiple whitespace
	whitespaceRegex := regexp.MustCompile(`\s+`)
	html = whitespaceRegex.ReplaceAllString(html, " ")

	return strings.TrimSpace(html)
}

// extractJSON extracts JSON object from text that might contain markdown or other content
func (s *AIService) extractJSON(text string) string {
	// Try to find JSON in markdown code blocks first
	codeBlockRegex := regexp.MustCompile("(?s)```(?:json)?\\s*({.*})\\s*```")
	if matches := codeBlockRegex.FindStringSubmatch(text); len(matches) > 1 {
		return matches[1]
	}

	// Find the first { and last } to extract the JSON object
	// This handles nested objects and arrays properly
	start := strings.Index(text, "{")
	if start == -1 {
		return text
	}

	// Find matching closing brace by counting braces
	depth := 0
	inString := false
	escaped := false
	end := -1

	for i := start; i < len(text); i++ {
		c := text[i]

		if escaped {
			escaped = false
			continue
		}

		if c == '\\' && inString {
			escaped = true
			continue
		}

		if c == '"' && !escaped {
			inString = !inString
			continue
		}

		if !inString {
			if c == '{' {
				depth++
			} else if c == '}' {
				depth--
				if depth == 0 {
					end = i + 1
					break
				}
			}
		}
	}

	if end > start {
		return text[start:end]
	}

	// Return as-is if no JSON pattern found
	return text
}

// IsConfigured returns true if the AI service has the required API key
func (s *AIService) IsConfigured() bool {
	return s.apiKey != ""
}

// ExtractedJobLink represents a job link extracted from a listing page
type ExtractedJobLink struct {
	URL   string `json:"url"`
	Title string `json:"title"`
}

// ExtractJobLinksFromHTML extracts job links from a listing page HTML using HTML parsing
// No AI needed - just proper HTML parsing to extract all links and filter for job URLs
func (s *AIService) ExtractJobLinksFromHTML(ctx context.Context, htmlContent string, baseURL string) ([]dto.ExtractedJobLink, error) {
	log.Printf("🔍 ExtractJobLinksFromHTML: Starting extraction for %s (HTML size: %d bytes)", baseURL, len(htmlContent))

	// Extract all links using HTML parser
	allLinks := extractAllLinks(htmlContent, baseURL)
	log.Printf("📊 Found %d total links in HTML", len(allLinks))

	// Deduplicate and filter for job detail URLs only
	seen := make(map[string]bool)
	var jobLinks []dto.ExtractedJobLink

	for _, link := range allLinks {
		if link.URL == "" || seen[link.URL] {
			continue
		}

		// Filter for job detail pages only
		if s.isValidJobDetailURL(link.URL) {
			seen[link.URL] = true
			jobLinks = append(jobLinks, link)
		}
	}

	log.Printf("🎯 Final job links: %d", len(jobLinks))
	// Log first few links for debugging
	for i, link := range jobLinks {
		if i < 5 {
			log.Printf("   Link %d: %s - %s", i+1, link.Title, link.URL)
		}
	}

	return jobLinks, nil
}

// isValidJobDetailURL checks if a URL looks like a job detail page, not a listing/category page
func (s *AIService) isValidJobDetailURL(urlStr string) bool {
	lowerURL := strings.ToLower(urlStr)

	// Exclude obvious non-job pages
	excludePatterns := []string{
		"linkedin.com",
		"facebook.com",
		"twitter.com",
		"instagram.com",
		"youtube.com",
		"/login",
		"/signin",
		"/sign-in",
		"/register",
		"/signup",
		"/sign-up",
		"/privacy",
		"/terms",
		"/cookie",
		"/contact",
		"/faq",
	}

	for _, pattern := range excludePatterns {
		if strings.Contains(lowerURL, pattern) {
			return false
		}
	}

	// Exclude category/listing pages (URLs ending with category names)
	categoryPatterns := []string{
		"-jobs$",        // ends with -jobs
		"-jobs/$",       // ends with -jobs/
		"-jobs?",        // -jobs with query params
		"/jobs$",        // ends with just /jobs
		"/jobs/$",       // ends with /jobs/
		"/careers$",     // ends with /careers
		"/careers/$",    // ends with /careers/
	}

	for _, pattern := range categoryPatterns {
		matched, _ := regexp.MatchString(pattern, lowerURL)
		if matched {
			return false
		}
	}

	// Check for search/filter query params that indicate listing pages
	if strings.Contains(lowerURL, "?") {
		queryPart := lowerURL[strings.Index(lowerURL, "?"):]
		filterParams := []string{"category=", "location=", "keyword=", "search=", "filter=", "type=", "page=", "offset=", "sort="}
		for _, param := range filterParams {
			if strings.Contains(queryPart, param) {
				return false
			}
		}
	}

	// Must contain /job/ pattern with something after it (job ID or slug)
	// This works for most career sites:
	// - Cisco: /global/en/job/1447037/title
	// - Workday: /job/title/JR-12345
	// - Greenhouse: /jobs/12345
	// - Lever: /jobs/uuid-here
	// - Generic: /job/12345, /jobs/title-12345

	jobPatterns := []string{
		"/job/",
		"/jobs/",
		"/position/",
		"/positions/",
		"/requisition/",
		"/opening/",
		"/vacancy/",
		"/opportunity/",
		"/posting/",
	}

	hasJobPattern := false
	for _, pattern := range jobPatterns {
		if strings.Contains(lowerURL, pattern) {
			hasJobPattern = true
			break
		}
	}

	if !hasJobPattern {
		return false
	}

	// Check that there's something meaningful after the job pattern (ID or slug)
	// URLs like /job/1234567 or /jobs/software-engineer-12345 are valid
	// But /jobs/ alone or /jobs/search are not

	// Look for numeric ID in URL path
	parts := strings.Split(urlStr, "/")
	for _, part := range parts {
		// Skip empty parts and common non-ID segments
		if part == "" || part == "job" || part == "jobs" || part == "en" || part == "global" {
			continue
		}
		// Check for numeric ID (5+ digits)
		if len(part) >= 5 && isNumeric(part) {
			return true
		}
		// Check for job ID patterns like JR-12345, REQ12345
		upperPart := strings.ToUpper(part)
		if strings.HasPrefix(upperPart, "JR-") || strings.HasPrefix(upperPart, "JR") ||
			strings.HasPrefix(upperPart, "REQ-") || strings.HasPrefix(upperPart, "REQ") ||
			strings.HasPrefix(upperPart, "R-") {
			return true
		}
		// Check for UUID pattern (for Lever-style URLs)
		if len(part) >= 32 && strings.Count(part, "-") >= 4 {
			return true
		}
		// Check for slug with numbers (e.g., software-engineer-12345)
		if strings.Contains(part, "-") && containsNumber(part) {
			return true
		}
	}

	// If URL has /job/ or /jobs/ followed by a reasonable slug (not just category names)
	// Accept it as potentially valid
	for _, pattern := range jobPatterns {
		idx := strings.Index(lowerURL, pattern)
		if idx >= 0 {
			afterPattern := lowerURL[idx+len(pattern):]
			// Remove trailing slash and query params
			if slashIdx := strings.Index(afterPattern, "?"); slashIdx >= 0 {
				afterPattern = afterPattern[:slashIdx]
			}
			afterPattern = strings.Trim(afterPattern, "/")
			// If there's meaningful content after /job/ that's not a category name
			if len(afterPattern) > 0 && !strings.HasSuffix(afterPattern, "-jobs") {
				return true
			}
		}
	}

	return false
}

// containsNumber checks if a string contains at least one digit
func containsNumber(s string) bool {
	for _, c := range s {
		if c >= '0' && c <= '9' {
			return true
		}
	}
	return false
}

// isNumeric checks if a string contains only digits
func isNumeric(s string) bool {
	for _, c := range s {
		if c < '0' || c > '9' {
			return false
		}
	}
	return len(s) > 0
}
