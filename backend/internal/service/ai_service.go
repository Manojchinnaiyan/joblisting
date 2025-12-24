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
// Also extracts job URLs from data attributes and embedded JSON for modern JS-heavy sites
func extractAllLinks(htmlContent string, baseURL string) []dto.ExtractedJobLink {
	var links []dto.ExtractedJobLink

	// Parse base URL for resolving relative URLs
	base, err := neturl.Parse(baseURL)
	if err != nil {
		log.Printf("⚠️ Base URL parse error: %v", err)
		return links
	}

	doc, err := html.Parse(strings.NewReader(htmlContent))
	if err != nil {
		log.Printf("⚠️ HTML parse error: %v", err)
		return links
	}

	var traverse func(*html.Node)
	traverse = func(n *html.Node) {
		if n.Type == html.ElementNode {
			var href, title string

			// Check for standard <a> tags
			if n.Data == "a" {
				for _, attr := range n.Attr {
					if attr.Key == "href" {
						href = attr.Val
					}
					if attr.Key == "title" || attr.Key == "aria-label" {
						title = attr.Val
					}
				}
			}

			// Also check for data attributes that might contain job URLs
			// Many modern sites use data-href, data-url, data-job-url, etc.
			for _, attr := range n.Attr {
				if strings.HasPrefix(attr.Key, "data-") && (strings.Contains(attr.Key, "href") ||
					strings.Contains(attr.Key, "url") || strings.Contains(attr.Key, "link")) {
					if href == "" && strings.HasPrefix(attr.Val, "/") || strings.HasPrefix(attr.Val, "http") {
						href = attr.Val
					}
				}
				// Extract title from data attributes too
				if strings.HasPrefix(attr.Key, "data-") && (strings.Contains(attr.Key, "title") ||
					strings.Contains(attr.Key, "name") || strings.Contains(attr.Key, "position")) {
					if title == "" {
						title = attr.Val
					}
				}
			}

			if href != "" {
				// Get text content of the element as title if not set
				if title == "" {
					title = getTextContent(n)
				}

				// Resolve relative URLs
				fullURL := resolveURL(href, base)
				if fullURL != "" {
					finalTitle := strings.TrimSpace(title)

					// If title is generic (like "View Job", "Apply", "Learn More"), extract from URL slug
					genericTitles := []string{"view job", "apply", "apply now", "learn more", "read more", "see details", "view details", "view", "details"}
					lowerTitle := strings.ToLower(finalTitle)
					isGeneric := finalTitle == "" || len(finalTitle) < 3
					for _, generic := range genericTitles {
						if lowerTitle == generic || strings.HasPrefix(lowerTitle, generic+" ") {
							isGeneric = true
							break
						}
					}

					if isGeneric {
						// Try to extract a meaningful title from the URL path
						extractedTitle := extractTitleFromURLSlug(fullURL)
						if extractedTitle != "" {
							finalTitle = extractedTitle
						}
					}

					links = append(links, dto.ExtractedJobLink{
						URL:   fullURL,
						Title: finalTitle,
					})
				}
			}
		}

		for c := n.FirstChild; c != nil; c = c.NextSibling {
			traverse(c)
		}
	}

	traverse(doc)

	// Also extract job URLs from embedded JSON/JavaScript
	// Many sites embed job data in script tags
	embeddedLinks := extractJobURLsFromEmbeddedData(htmlContent, base)
	links = append(links, embeddedLinks...)

	return links
}

// extractJobURLsFromEmbeddedData extracts job URLs from embedded JSON and JavaScript
func extractJobURLsFromEmbeddedData(htmlContent string, base *neturl.URL) []dto.ExtractedJobLink {
	var links []dto.ExtractedJobLink

	// Pattern 1: Look for JSON-LD structured data
	jsonLDPattern := regexp.MustCompile(`(?s)<script[^>]*type=["']application/ld\+json["'][^>]*>(.*?)</script>`)
	matches := jsonLDPattern.FindAllStringSubmatch(htmlContent, -1)
	for _, match := range matches {
		if len(match) > 1 {
			// Try to extract job URLs from JSON-LD
			extracted := extractURLsFromJSON(match[1], base)
			links = append(links, extracted...)
		}
	}

	// Pattern 2: Look for job URLs in JavaScript objects/arrays
	// Common patterns: "url": "/en/job/...", href: "/jobs/..."
	urlPatterns := []string{
		`"url"\s*:\s*"(/[^"]*(?:job|position|career)[^"]*)"`,
		`"href"\s*:\s*"(/[^"]*(?:job|position|career)[^"]*)"`,
		`"link"\s*:\s*"(/[^"]*(?:job|position|career)[^"]*)"`,
		`"jobUrl"\s*:\s*"(/[^"]*)"`,
		`"detailUrl"\s*:\s*"(/[^"]*)"`,
		`"applyUrl"\s*:\s*"([^"]*)"`,
	}

	for _, pattern := range urlPatterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindAllStringSubmatch(htmlContent, -1)
		for _, match := range matches {
			if len(match) > 1 {
				fullURL := resolveURL(match[1], base)
				if fullURL != "" {
					links = append(links, dto.ExtractedJobLink{
						URL:   fullURL,
						Title: "", // Will try to extract title later
					})
				}
			}
		}
	}

	// Pattern 3: Look for job IDs that can be converted to URLs
	// Many sites use patterns like: jobId: "12345" or data-job-id="12345"
	jobIDPattern := regexp.MustCompile(`(?:jobId|job-id|job_id|requisitionId|req-id)["']?\s*[:=]\s*["']?(\d{5,})["']?`)
	jobIDMatches := jobIDPattern.FindAllStringSubmatch(htmlContent, -1)
	for _, match := range jobIDMatches {
		if len(match) > 1 {
			// Construct potential job URL based on the base URL pattern
			jobID := match[1]
			// Try common URL patterns
			potentialURLs := []string{
				fmt.Sprintf("/en/job/%s", jobID),
				fmt.Sprintf("/job/%s", jobID),
				fmt.Sprintf("/jobs/%s", jobID),
			}
			for _, potentialURL := range potentialURLs {
				fullURL := resolveURL(potentialURL, base)
				if fullURL != "" {
					links = append(links, dto.ExtractedJobLink{
						URL:   fullURL,
						Title: "",
					})
				}
			}
		}
	}

	// Pattern 4: Look for onclick handlers with job URLs
	// e.g., onclick="window.location='/job/12345'" or onclick="navigateTo('/jobs/title-123')"
	onclickPatterns := []string{
		`onclick=["'][^"']*(?:location|href|navigate)[^"']*=["']?([^"'\s]+job[^"'\s)]+)`,
		`onclick=["'][^"']*\(["']([^"']+job[^"']+)["']\)`,
	}
	for _, pattern := range onclickPatterns {
		re := regexp.MustCompile(pattern)
		matches := re.FindAllStringSubmatch(htmlContent, -1)
		for _, match := range matches {
			if len(match) > 1 {
				fullURL := resolveURL(match[1], base)
				if fullURL != "" {
					links = append(links, dto.ExtractedJobLink{
						URL:   fullURL,
						Title: "",
					})
				}
			}
		}
	}

	// Pattern 5: Look for full URLs in the content that match job patterns
	// This catches URLs embedded anywhere in the HTML
	fullURLPattern := regexp.MustCompile(`https?://[^\s"'<>]+/(?:job|jobs|position|career)/[^\s"'<>]+`)
	fullURLMatches := fullURLPattern.FindAllString(htmlContent, -1)
	for _, urlStr := range fullURLMatches {
		// Clean up the URL (remove trailing punctuation)
		urlStr = strings.TrimRight(urlStr, ".,;:!?)]}")
		links = append(links, dto.ExtractedJobLink{
			URL:   urlStr,
			Title: "",
		})
	}

	return links
}

// extractURLsFromJSON extracts job URLs from JSON content
func extractURLsFromJSON(jsonContent string, base *neturl.URL) []dto.ExtractedJobLink {
	var links []dto.ExtractedJobLink

	// Try to parse as JSON and extract URLs
	var data interface{}
	if err := json.Unmarshal([]byte(jsonContent), &data); err != nil {
		return links
	}

	// Recursively find URL fields
	var extractURLs func(interface{})
	extractURLs = func(v interface{}) {
		switch val := v.(type) {
		case map[string]interface{}:
			// Look for URL-like fields
			for key, value := range val {
				lowerKey := strings.ToLower(key)
				if lowerKey == "url" || lowerKey == "href" || lowerKey == "link" ||
					strings.Contains(lowerKey, "joburl") || strings.Contains(lowerKey, "applyurl") {
					if urlStr, ok := value.(string); ok {
						fullURL := resolveURL(urlStr, base)
						if fullURL != "" {
							title := ""
							if t, ok := val["title"].(string); ok {
								title = t
							} else if t, ok := val["name"].(string); ok {
								title = t
							}
							links = append(links, dto.ExtractedJobLink{
								URL:   fullURL,
								Title: title,
							})
						}
					}
				}
				extractURLs(value)
			}
		case []interface{}:
			for _, item := range val {
				extractURLs(item)
			}
		}
	}

	extractURLs(data)
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

// callClaudeAPIWithRetry makes a request to Claude API with exponential backoff retry
// for handling rate limits (429) and overload errors (529)
func (s *AIService) callClaudeAPIWithRetry(ctx context.Context, requestBody []byte) (*ClaudeResponse, error) {
	maxRetries := 5
	baseDelay := 2 * time.Second

	var lastErr error
	for attempt := 0; attempt < maxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff with jitter
			delay := baseDelay * time.Duration(1<<uint(attempt-1)) // 2s, 4s, 8s, 16s, 32s
			// Add some jitter (0-25% of delay)
			jitter := time.Duration(float64(delay) * 0.25 * float64(attempt) / float64(maxRetries))
			totalDelay := delay + jitter

			log.Printf("⏳ Claude API retry %d/%d after %v (previous error: %v)", attempt+1, maxRetries, totalDelay, lastErr)

			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(totalDelay):
			}
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
			lastErr = fmt.Errorf("failed to call Claude API: %w", err)
			continue
		}

		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			lastErr = fmt.Errorf("failed to read response: %w", err)
			continue
		}

		// Check for retryable status codes
		if resp.StatusCode == 429 || resp.StatusCode == 529 {
			// Rate limit (429) or overload (529) - retry with backoff
			statusName := "rate_limit"
			if resp.StatusCode == 529 {
				statusName = "overload"
			}
			lastErr = fmt.Errorf("claude API %s (status %d): %s", statusName, resp.StatusCode, string(body))
			log.Printf("⚠️ Claude API %s error (attempt %d/%d): %s", statusName, attempt+1, maxRetries, string(body))
			continue
		}

		if resp.StatusCode != http.StatusOK {
			// Non-retryable error
			return nil, fmt.Errorf("claude API error (status %d): %s", resp.StatusCode, string(body))
		}

		var claudeResp ClaudeResponse
		if err := json.Unmarshal(body, &claudeResp); err != nil {
			return nil, fmt.Errorf("failed to parse Claude response: %w", err)
		}

		if len(claudeResp.Content) == 0 {
			return nil, fmt.Errorf("empty response from Claude API")
		}

		return &claudeResp, nil
	}

	return nil, fmt.Errorf("claude API failed after %d retries: %w", maxRetries, lastErr)
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

	// Use retry logic for rate limits and overload errors
	claudeResp, err := s.callClaudeAPIWithRetry(ctx, requestBody)
	if err != nil {
		return nil, err
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
		return s.sanitizeJSONNewlines(matches[1])
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
		return s.sanitizeJSONNewlines(text[start:end])
	}

	// Return as-is if no JSON pattern found
	return text
}

// sanitizeJSONNewlines attempts to fix JSON with literal newlines inside string values
// Claude sometimes returns JSON with actual newlines in strings instead of \n
// This function tries standard parsing first, then falls back to manual sanitization
func (s *AIService) sanitizeJSONNewlines(jsonStr string) string {
	// First, try to parse as-is - Go's json decoder can handle some formatting
	var test interface{}
	if err := json.Unmarshal([]byte(jsonStr), &test); err == nil {
		// JSON is already valid, return as-is
		return jsonStr
	}

	// If parsing failed, try to fix common issues
	// Replace literal newlines/tabs inside strings with escaped versions
	var result strings.Builder
	result.Grow(len(jsonStr) + 200)

	inString := false
	i := 0
	for i < len(jsonStr) {
		c := jsonStr[i]

		// Handle escape sequences
		if c == '\\' && inString && i+1 < len(jsonStr) {
			// This is an escape sequence, copy both characters
			result.WriteByte(c)
			i++
			if i < len(jsonStr) {
				result.WriteByte(jsonStr[i])
			}
			i++
			continue
		}

		// Track string boundaries
		if c == '"' {
			inString = !inString
			result.WriteByte(c)
			i++
			continue
		}

		// Handle literal newlines/tabs inside strings
		if inString {
			switch c {
			case '\n':
				result.WriteString("\\n")
			case '\r':
				result.WriteString("\\r")
			case '\t':
				result.WriteString("\\t")
			default:
				result.WriteByte(c)
			}
		} else {
			result.WriteByte(c)
		}
		i++
	}

	return result.String()
}

// parseGeneratedBlogManually attempts to parse the blog JSON using regex extraction
// This is a fallback when standard JSON parsing fails due to formatting issues
func (s *AIService) parseGeneratedBlogManually(jsonStr string) (*GeneratedBlog, error) {
	blog := &GeneratedBlog{}

	// Helper function to extract string value between quotes after a key
	extractString := func(key string) string {
		// Pattern: "key": "value" or "key":"value"
		pattern := regexp.MustCompile(`"` + key + `"\s*:\s*"((?:[^"\\]|\\.)*)`)
		matches := pattern.FindStringSubmatch(jsonStr)
		if len(matches) > 1 {
			// Unescape the string
			val := matches[1]
			val = strings.ReplaceAll(val, `\"`, `"`)
			val = strings.ReplaceAll(val, `\\`, `\`)
			return val
		}
		return ""
	}

	// Extract string fields
	blog.Title = extractString("title")
	blog.Slug = extractString("slug")
	blog.Excerpt = extractString("excerpt")
	blog.MetaTitle = extractString("meta_title")
	blog.MetaDescription = extractString("meta_description")
	blog.MetaKeywords = extractString("meta_keywords")
	blog.ImageSearchTerm = extractString("image_search_term")

	// Extract content field - this is the tricky one as it contains HTML
	// Find content field and extract everything until the next field
	contentPattern := regexp.MustCompile(`"content"\s*:\s*"((?:[^"\\]|\\.)*)`)
	contentMatches := contentPattern.FindStringSubmatch(jsonStr)
	if len(contentMatches) > 1 {
		content := contentMatches[1]
		content = strings.ReplaceAll(content, `\"`, `"`)
		content = strings.ReplaceAll(content, `\\n`, "\n")
		content = strings.ReplaceAll(content, `\\t`, "\t")
		content = strings.ReplaceAll(content, `\\`, `\`)
		blog.Content = content
	}

	// Extract suggested_tags array
	tagsPattern := regexp.MustCompile(`"suggested_tags"\s*:\s*\[(.*?)\]`)
	tagsMatches := tagsPattern.FindStringSubmatch(jsonStr)
	if len(tagsMatches) > 1 {
		tagStr := tagsMatches[1]
		tagPattern := regexp.MustCompile(`"([^"]+)"`)
		tagMatches := tagPattern.FindAllStringSubmatch(tagStr, -1)
		for _, m := range tagMatches {
			if len(m) > 1 {
				blog.SuggestedTags = append(blog.SuggestedTags, m[1])
			}
		}
	}

	// Validate we got at least the essential fields
	if blog.Title == "" || blog.Content == "" {
		return nil, fmt.Errorf("failed to extract essential fields from JSON")
	}

	// Generate slug if missing
	if blog.Slug == "" {
		blog.Slug = strings.ToLower(strings.ReplaceAll(blog.Title, " ", "-"))
		blog.Slug = regexp.MustCompile(`[^a-z0-9-]`).ReplaceAllString(blog.Slug, "")
	}

	return blog, nil
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

	// Debug: Log some sample URLs to understand the site's URL structure
	sampleCount := 0
	for _, link := range allLinks {
		if sampleCount < 10 && link.URL != "" && !strings.Contains(link.URL, "#") {
			log.Printf("🔗 Sample link: %s", link.URL)
			sampleCount++
		}
	}

	// Deduplicate and filter for job detail URLs only
	seen := make(map[string]bool)
	var jobLinks []dto.ExtractedJobLink

	for _, link := range allLinks {
		if link.URL == "" || seen[link.URL] {
			continue
		}

		// Filter for job detail pages only
		if s.isValidJobDetailURL(link.URL, baseURL) {
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
func (s *AIService) isValidJobDetailURL(urlStr string, baseURL string) bool {
	lowerURL := strings.ToLower(urlStr)
	lowerBaseURL := strings.ToLower(baseURL)

	// Parse base URL to get the host
	baseParsed, _ := neturl.Parse(baseURL)
	baseHost := ""
	if baseParsed != nil {
		baseHost = baseParsed.Host
	}

	// Parse the URL to check
	urlParsed, _ := neturl.Parse(urlStr)
	urlHost := ""
	if urlParsed != nil {
		urlHost = urlParsed.Host
	}

	// Must be from the same domain as the base URL (or relative)
	if urlHost != "" && baseHost != "" && urlHost != baseHost {
		return false
	}

	_ = lowerBaseURL // Used for future enhancements

	// Exclude obvious non-job pages
	excludePatterns := []string{
		// Social media
		"linkedin.com",
		"facebook.com",
		"twitter.com",
		"instagram.com",
		"youtube.com",
		// Auth pages
		"/login",
		"/signin",
		"/sign-in",
		"/register",
		"/signup",
		"/sign-up",
		// Legal/policy pages
		"/privacy",
		"/terms",
		"/cookie",
		"/legal",
		"/disclaimer",
		// General pages
		"/contact",
		"/faq",
		"/about",
		"/help",
		"/support",
		// News/reports
		"/press-release",
		"/press-releases",
		"/news",
		"/blog",
		"/annual-report",
		"/report",
		"/investor",
		"/investors",
		// Services/industry pages (not jobs)
		"-services",
		"/services/",
		"-solutions",
		"/solutions/",
		"/industries/",
		"/industry/",
		"/capabilities/",
		// Media
		"/video",
		"/webinar",
		"/podcast",
		"/event",
		"/events",
		// Marketing
		"/case-study",
		"/case-studies",
		"/whitepaper",
		"/ebook",
		"/resources",
		// Awards/recognitions
		"/awards",
		"/recognition",
		"/achievements",
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
		"/go/[^/]+/\\d+/$", // HCL-style category pages: /go/India/9553955/
		"/go/[^/]+/\\d+$",  // HCL-style category pages without trailing slash
	}

	// Direct exclusions for known category URL patterns
	categoryURLPatterns := []string{
		"/careers/engineering",
		"/careers/opportunities",
		"/careers/careers-in-",
		"/careers-in-",
		"/go/",  // HCL career site category pages
	}
	for _, pattern := range categoryURLPatterns {
		if strings.Contains(lowerURL, pattern) {
			return false
		}
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

	// Job detail URL patterns - these indicate individual job pages
	// Works for most career sites:
	// - Cisco: /global/en/job/1447037/title
	// - Workday: /job/title/JR-12345
	// - Greenhouse: /jobs/12345
	// - Lever: /jobs/uuid-here
	// - Kimberly-Clark: /en/job-detail/job-title-12345 or similar
	// - Generic: /job/12345, /jobs/title-12345

	jobPatterns := []string{
		"/job/",
		"/jobs/",
		"/job-detail/",
		"/jobdetail/",
		"/job-details/",
		"/jobdetails/",
		"/position/",
		"/positions/",
		"/requisition/",
		"/opening/",
		"/vacancy/",
		"/opportunity/",
		"/posting/",
		"/career/",
		"/careers/",
		"/careers/job/",
	}

	hasJobPattern := false
	for _, pattern := range jobPatterns {
		if strings.Contains(lowerURL, pattern) {
			hasJobPattern = true
			break
		}
	}

	// Look for numeric ID in URL path - this is a strong indicator of a job detail page
	parts := strings.Split(urlStr, "/")
	for _, part := range parts {
		// Skip empty parts and common non-ID segments
		if part == "" || part == "job" || part == "jobs" || part == "en" || part == "global" || part == "job-search" {
			continue
		}
		// Remove query params from part
		if idx := strings.Index(part, "?"); idx >= 0 {
			part = part[:idx]
		}
		// Check for numeric ID (5+ digits) - strong indicator
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
		// Check for slug with numbers at the end (e.g., software-engineer-12345)
		// But exclude year-like patterns (2020, 2021, 2022, 2023, 2024, 2025, etc.)
		if strings.Contains(part, "-") && containsNumber(part) && len(part) > 10 {
			// Extract the numeric part at the end
			numPart := ""
			for i := len(part) - 1; i >= 0; i-- {
				if part[i] >= '0' && part[i] <= '9' {
					numPart = string(part[i]) + numPart
				} else {
					break
				}
			}
			// Skip if it looks like a year (4 digits, 19xx or 20xx)
			if len(numPart) == 4 && (strings.HasPrefix(numPart, "19") || strings.HasPrefix(numPart, "20")) {
				// This is likely a year, not a job ID - continue checking other parts
				continue
			}
			// Must have at least 5 digits to be considered a job ID
			if len(numPart) >= 5 {
				return true
			}
		}
	}

	// If we found a job pattern, check for meaningful content after it
	if hasJobPattern {
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
	}

	// Also check for URLs with job-related query parameters indicating a specific job
	if strings.Contains(lowerURL, "?") {
		queryPart := lowerURL[strings.Index(lowerURL, "?"):]
		jobQueryParams := []string{"jobid=", "job_id=", "requisitionid=", "req_id=", "positionid=", "id="}
		for _, param := range jobQueryParams {
			if strings.Contains(queryPart, param) {
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

// extractTitleFromURLSlug extracts a human-readable title from a URL path slug
// For example: "/careers/test-automation-engineer" -> "Test Automation Engineer"
func extractTitleFromURLSlug(urlStr string) string {
	parsed, err := neturl.Parse(urlStr)
	if err != nil {
		return ""
	}

	path := parsed.Path
	// Remove trailing slash
	path = strings.TrimSuffix(path, "/")

	// Get the last segment of the path
	parts := strings.Split(path, "/")
	if len(parts) == 0 {
		return ""
	}

	slug := parts[len(parts)-1]
	if slug == "" && len(parts) > 1 {
		slug = parts[len(parts)-2]
	}

	// Skip if slug is too short or looks like an ID
	if len(slug) < 3 {
		return ""
	}

	// Skip pure numeric IDs
	if isNumeric(slug) {
		return ""
	}

	// Skip common non-job slugs
	skipSlugs := []string{"jobs", "careers", "job", "career", "openings", "positions", "en", "us", "global"}
	lowerSlug := strings.ToLower(slug)
	for _, skip := range skipSlugs {
		if lowerSlug == skip {
			return ""
		}
	}

	// Convert slug to title case
	// Replace hyphens and underscores with spaces
	title := strings.ReplaceAll(slug, "-", " ")
	title = strings.ReplaceAll(title, "_", " ")

	// Remove any numeric suffix (like job-title-12345)
	// But only if there's text before it
	words := strings.Fields(title)
	if len(words) > 1 {
		lastWord := words[len(words)-1]
		if isNumeric(lastWord) {
			words = words[:len(words)-1]
			title = strings.Join(words, " ")
		}
	}

	// Title case each word
	words = strings.Fields(title)
	for i, word := range words {
		if len(word) > 0 {
			words[i] = strings.ToUpper(string(word[0])) + strings.ToLower(word[1:])
		}
	}

	return strings.Join(words, " ")
}

// AIPageAnalysis contains the AI analysis of a career page structure
type AIPageAnalysis struct {
	JobsFound          bool     `json:"jobs_found"`
	JobLoadingMethod   string   `json:"job_loading_method"`   // "static", "ajax", "iframe", "api", "unknown"
	AJAXEndpoint       string   `json:"ajax_endpoint"`        // The AJAX endpoint to fetch jobs
	JobSelector        string   `json:"job_selector"`         // CSS selector for job listings
	PaginationType     string   `json:"pagination_type"`      // "click", "scroll", "url", "none"
	NextButtonSelector string   `json:"next_button_selector"`
	WaitForSelector    string   `json:"wait_for_selector"`    // Element to wait for before extracting
	Instructions       []string `json:"instructions"`         // Steps to extract jobs
	Confidence         float64  `json:"confidence"`           // 0-1 confidence score
}

// AnalyzeCareerPageWithAI uses Claude to analyze a career page and determine how to extract jobs
func (s *AIService) AnalyzeCareerPageWithAI(ctx context.Context, htmlContent string, pageURL string) (*AIPageAnalysis, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("ANTHROPIC_API_KEY not configured")
	}

	// Truncate HTML to avoid token limits - keep relevant parts
	truncatedHTML := truncateHTMLForAnalysis(htmlContent, 50000)

	prompt := fmt.Sprintf(`Analyze this career/jobs page HTML and determine how job listings are loaded.

Page URL: %s

HTML Content:
%s

Analyze the page structure and respond with a JSON object containing:
{
  "jobs_found": boolean, // Are there visible job listings in the HTML?
  "job_loading_method": string, // One of: "static" (jobs in HTML), "ajax" (loaded via AJAX), "iframe", "api", "unknown"
  "ajax_endpoint": string, // If AJAX, the endpoint URL (look for Drupal views/ajax, fetch calls, etc.)
  "job_selector": string, // CSS selector to find job listing elements
  "pagination_type": string, // "click" (click button), "scroll" (infinite scroll), "url" (change URL), "none"
  "next_button_selector": string, // CSS selector for next/load more button
  "wait_for_selector": string, // Element to wait for before extracting jobs
  "instructions": array, // Step-by-step instructions to extract jobs
  "confidence": number // 0-1 confidence in this analysis
}

Look for:
1. Drupal views settings (drupal-settings-json) with ajax_path and view configurations
2. React/Vue data attributes or state
3. Infinite scroll library configurations
4. Job listing container patterns
5. API endpoint hints in scripts

Respond ONLY with the JSON object, no other text.`, pageURL, truncatedHTML)

	request := ClaudeRequest{
		Model:     "claude-3-haiku-20240307",
		MaxTokens: 2000,
		Messages: []ClaudeMessage{
			{Role: "user", Content: prompt},
		},
	}

	requestBody, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	resp, err := s.callClaudeAPIWithRetry(ctx, requestBody)
	if err != nil {
		return nil, fmt.Errorf("Claude API call failed: %w", err)
	}

	if len(resp.Content) == 0 || resp.Content[0].Text == "" {
		return nil, fmt.Errorf("empty response from Claude")
	}

	// Parse the JSON response
	responseText := resp.Content[0].Text
	// Clean up the response - remove markdown code blocks if present
	responseText = strings.TrimPrefix(responseText, "```json")
	responseText = strings.TrimPrefix(responseText, "```")
	responseText = strings.TrimSuffix(responseText, "```")
	responseText = strings.TrimSpace(responseText)

	var result AIPageAnalysis
	if err := json.Unmarshal([]byte(responseText), &result); err != nil {
		log.Printf("⚠️ Failed to parse AI analysis response: %v\nResponse: %s", err, responseText)
		return nil, fmt.Errorf("failed to parse analysis: %w", err)
	}

	log.Printf("🤖 AI Page Analysis: method=%s, ajax_endpoint=%s, selector=%s, confidence=%.2f",
		result.JobLoadingMethod, result.AJAXEndpoint, result.JobSelector, result.Confidence)

	return &result, nil
}

// DetectJobLoadingMethod analyzes HTML to detect how jobs are loaded (without AI)
// Returns the loading method and any detected endpoints
func (s *AIService) DetectJobLoadingMethod(htmlContent string, pageURL string) *AIPageAnalysis {
	result := &AIPageAnalysis{
		JobLoadingMethod: "unknown",
		Confidence:       0.5,
	}

	lowerHTML := strings.ToLower(htmlContent)

	// Check for Drupal Views AJAX (like HCL)
	// The ajax_path is typically inside the drupal-settings-json as "ajax_path":"\/views\/ajax"
	if strings.Contains(htmlContent, "drupal-settings-json") {
		hasDrupalViews := strings.Contains(htmlContent, `"ajax_path":"\/views\/ajax"`) ||
			strings.Contains(htmlContent, `"ajax_path":"/views/ajax"`) ||
			strings.Contains(htmlContent, "views_infinite_scroll") ||
			strings.Contains(htmlContent, `"view_name":`)

		if hasDrupalViews {
			result.JobLoadingMethod = "ajax"
			result.AJAXEndpoint = "/views/ajax"
			result.PaginationType = "scroll"
			result.Confidence = 0.9

			// Try to extract view name
			viewNameRe := regexp.MustCompile(`"view_name":"([^"]+)"`)
			if matches := viewNameRe.FindStringSubmatch(htmlContent); len(matches) > 1 {
				log.Printf("📋 Detected Drupal view: %s", matches[1])
			}
			// Look for infinite scroll
			if strings.Contains(lowerHTML, "views_infinite_scroll") || strings.Contains(lowerHTML, "infinite-scroll") {
				result.PaginationType = "scroll"
			}
			log.Printf("📋 Detected Drupal Views AJAX job loading")
			return result
		}
	}

	// Check for React/Next.js data
	if strings.Contains(htmlContent, "__NEXT_DATA__") || strings.Contains(htmlContent, "window.__INITIAL_STATE__") {
		result.JobLoadingMethod = "static"
		result.Confidence = 0.8
		log.Printf("📋 Detected Next.js/React SSR job data")
		return result
	}

	// Check for common job API patterns in scripts
	apiPatterns := []struct {
		pattern  string
		endpoint string
	}{
		{`/api/jobs`, "/api/jobs"},
		{`/api/v1/jobs`, "/api/v1/jobs"},
		{`/api/careers`, "/api/careers"},
		{`/api/positions`, "/api/positions"},
		{`/api/openings`, "/api/openings"},
		{`jobs.json`, "/jobs.json"},
		{`careers.json`, "/careers.json"},
		{`/graphql`, "/graphql"},
		{`workday.com`, "workday"},
		{`greenhouse.io`, "greenhouse"},
		{`lever.co`, "lever"},
	}

	for _, p := range apiPatterns {
		if strings.Contains(lowerHTML, p.pattern) {
			result.JobLoadingMethod = "api"
			result.AJAXEndpoint = p.endpoint
			result.Confidence = 0.7
			log.Printf("📋 Detected API pattern: %s", p.pattern)
			return result
		}
	}

	// Check for iframe-based job listings
	if strings.Contains(lowerHTML, "<iframe") && (strings.Contains(lowerHTML, "career") || strings.Contains(lowerHTML, "job")) {
		result.JobLoadingMethod = "iframe"
		result.Confidence = 0.6
		// Try to extract iframe src
		iframeSrcRe := regexp.MustCompile(`<iframe[^>]+src="([^"]*(?:career|job|work)[^"]*)"`)
		if matches := iframeSrcRe.FindStringSubmatch(htmlContent); len(matches) > 1 {
			result.AJAXEndpoint = matches[1]
		}
		log.Printf("📋 Detected iframe-based job loading")
		return result
	}

	// Check for static job listings in HTML
	jobIndicators := []string{
		`class="job-`,
		`class="career-`,
		`class="position-`,
		`class="vacancy-`,
		`class="opening-`,
		`data-job`,
		`data-position`,
		`job-listing`,
		`job-card`,
		`job-item`,
		`career-item`,
	}

	staticJobCount := 0
	for _, indicator := range jobIndicators {
		if strings.Contains(lowerHTML, indicator) {
			staticJobCount++
		}
	}

	if staticJobCount >= 2 {
		result.JobLoadingMethod = "static"
		result.JobsFound = true
		result.Confidence = 0.7
		log.Printf("📋 Detected static HTML job listings (indicators: %d)", staticJobCount)
		return result
	}

	// Check for pagination patterns
	if strings.Contains(lowerHTML, "load more") || strings.Contains(lowerHTML, "loadmore") {
		result.PaginationType = "click"
		result.NextButtonSelector = ".load-more, [class*='load-more'], button:contains('Load More')"
	} else if strings.Contains(lowerHTML, "next page") || strings.Contains(lowerHTML, "pagination") {
		result.PaginationType = "click"
	} else if strings.Contains(lowerHTML, "infinite") || strings.Contains(lowerHTML, "scroll") {
		result.PaginationType = "scroll"
	}

	log.Printf("📋 Job loading method: %s (confidence: %.2f)", result.JobLoadingMethod, result.Confidence)
	return result
}

// truncateHTMLForAnalysis truncates HTML while keeping relevant parts for AI analysis
func truncateHTMLForAnalysis(html string, maxLen int) string {
	if len(html) <= maxLen {
		return html
	}

	// Try to keep the head (with scripts and settings) and some body
	headEnd := strings.Index(html, "</head>")
	if headEnd > 0 && headEnd < maxLen/2 {
		head := html[:headEnd+7]
		bodyStart := strings.Index(html, "<body")
		if bodyStart > 0 {
			remaining := maxLen - len(head) - 100
			if remaining > 0 && bodyStart+remaining < len(html) {
				return head + "\n<!-- TRUNCATED -->\n" + html[bodyStart:bodyStart+remaining] + "..."
			}
		}
	}

	// Just truncate from the beginning
	return html[:maxLen] + "..."
}

// ============================================================
// BLOG GENERATION AI FUNCTIONS
// ============================================================

// GeneratedBlog represents AI-generated blog content
type GeneratedBlog struct {
	Title           string   `json:"title"`
	Slug            string   `json:"slug"`
	Excerpt         string   `json:"excerpt"`
	Content         string   `json:"content"`
	MetaTitle       string   `json:"meta_title"`
	MetaDescription string   `json:"meta_description"`
	MetaKeywords    string   `json:"meta_keywords"`
	SuggestedTags   []string `json:"suggested_tags"`
	ImageSearchTerm string   `json:"image_search_term"`
}

// GenerateBlogFromPrompt generates a complete blog post from a user prompt
func (s *AIService) GenerateBlogFromPrompt(ctx context.Context, prompt string, targetTone string, targetLength string) (*GeneratedBlog, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("ANTHROPIC_API_KEY environment variable not set")
	}

	// Set defaults
	if targetTone == "" {
		targetTone = "professional yet approachable"
	}
	if targetLength == "" {
		targetLength = "medium (800-1200 words)"
	}

	lengthGuidance := map[string]string{
		"short":  "around 400-600 words",
		"medium": "around 800-1200 words",
		"long":   "around 1500-2000 words",
	}
	if guidance, ok := lengthGuidance[targetLength]; ok {
		targetLength = guidance
	}

	aiPrompt := fmt.Sprintf(`You are an expert blog content creator. Generate a complete, SEO-optimized blog post based on the following prompt.

USER PROMPT: %s

WRITING REQUIREMENTS:
- Tone: %s
- Length: %s
- Write in a human-readable, engaging style
- Use proper HTML formatting for the content (headings, paragraphs, lists, etc.)
- Make it SEO-friendly with relevant keywords naturally integrated
- Include practical insights and actionable information

CRITICAL JSON FORMAT REQUIREMENTS:
You MUST return a valid JSON object. All string values must have newlines escaped as \n (backslash-n), not actual line breaks.
The "content" field should have all HTML on a single logical line with \n for line breaks.

Return this exact JSON structure:
{"title":"Your title here","slug":"your-slug-here","excerpt":"Your excerpt here","content":"<h2>Heading</h2>\n<p>Paragraph text...</p>\n<h3>Subheading</h3>\n<p>More text...</p>","meta_title":"SEO title","meta_description":"SEO description","meta_keywords":"keyword1, keyword2, keyword3","suggested_tags":["tag1","tag2","tag3"],"image_search_term":"search term"}

Field descriptions:
- title: Catchy, SEO-friendly blog title (max 70 characters)
- slug: URL-friendly version of the title using lowercase and hyphens
- excerpt: Compelling summary (150-200 characters) that hooks readers
- content: Full blog content in HTML format using <h2>, <h3>, <p>, <ul>, <ol>, <strong>, <em> tags. Use \n for line breaks between tags.
- meta_title: SEO meta title (max 60 characters)
- meta_description: SEO meta description (max 155 characters)
- meta_keywords: Comma-separated relevant keywords
- suggested_tags: Array of 3-5 relevant tag strings
- image_search_term: Best search term for finding a relevant featured image

Important:
1. The content should be original, informative, and valuable to readers
2. Use proper HTML formatting in content - no markdown
3. Include at least 3 section headings (h2 or h3)
4. Return ONLY the JSON object - no markdown code blocks, no explanation
5. All newlines in string values MUST be escaped as \n`, prompt, targetTone, targetLength)

	request := ClaudeRequest{
		Model:     "claude-3-haiku-20240307",
		MaxTokens: 4096,
		Messages: []ClaudeMessage{
			{
				Role:    "user",
				Content: aiPrompt,
			},
		},
	}

	requestBody, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	claudeResp, err := s.callClaudeAPIWithRetry(ctx, requestBody)
	if err != nil {
		return nil, err
	}

	responseText := claudeResp.Content[0].Text
	jsonStr := s.extractJSON(responseText)

	var generatedBlog GeneratedBlog
	if err := json.Unmarshal([]byte(jsonStr), &generatedBlog); err != nil {
		// Standard JSON parsing failed, try manual extraction as fallback
		fmt.Printf("[AIService] Standard JSON parse failed: %v, trying manual extraction\n", err)

		manualBlog, manualErr := s.parseGeneratedBlogManually(responseText)
		if manualErr != nil {
			fmt.Printf("[AIService] Manual extraction also failed: %v\n", manualErr)
			fmt.Printf("[AIService] First 500 chars of response: %s\n", truncateString(responseText, 500))
			return nil, fmt.Errorf("failed to parse generated blog data: %w (response length: %d)", err, len(responseText))
		}

		fmt.Printf("[AIService] Manual extraction succeeded\n")
		return manualBlog, nil
	}

	return &generatedBlog, nil
}

// truncateString safely truncates a string to a maximum length
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}

// GenerateBlogFromURLContent generates a blog post based on scraped URL content
func (s *AIService) GenerateBlogFromURLContent(ctx context.Context, htmlContent string, url string, prompt string, targetTone string, targetLength string) (*GeneratedBlog, error) {
	if s.apiKey == "" {
		return nil, fmt.Errorf("ANTHROPIC_API_KEY environment variable not set")
	}

	// Clean and truncate HTML
	cleanedHTML := s.cleanHTML(htmlContent)
	if len(cleanedHTML) > 30000 {
		cleanedHTML = cleanedHTML[:30000]
	}

	// Set defaults
	if targetTone == "" {
		targetTone = "professional yet approachable"
	}
	if targetLength == "" {
		targetLength = "medium (800-1200 words)"
	}

	lengthGuidance := map[string]string{
		"short":  "around 400-600 words",
		"medium": "around 800-1200 words",
		"long":   "around 1500-2000 words",
	}
	if guidance, ok := lengthGuidance[targetLength]; ok {
		targetLength = guidance
	}

	aiPrompt := fmt.Sprintf(`You are an expert blog content creator. Generate a complete, SEO-optimized blog post based on the following source content and user instructions.

SOURCE URL: %s

SOURCE CONTENT:
%s

USER INSTRUCTIONS: %s

WRITING REQUIREMENTS:
- Tone: %s
- Length: %s
- Transform the source content into a fresh, human-readable blog post
- DO NOT simply copy the source - rewrite and improve it
- Use proper HTML formatting for the content
- Make it SEO-friendly with relevant keywords naturally integrated
- Add your own insights and structure to make it more valuable

CRITICAL JSON FORMAT REQUIREMENTS:
You MUST return a valid JSON object. All string values must have newlines escaped as \n (backslash-n), not actual line breaks.
The "content" field should have all HTML on a single logical line with \n for line breaks.

Return this exact JSON structure:
{"title":"Your title here","slug":"your-slug-here","excerpt":"Your excerpt here","content":"<h2>Heading</h2>\n<p>Paragraph text...</p>\n<h3>Subheading</h3>\n<p>More text...</p>","meta_title":"SEO title","meta_description":"SEO description","meta_keywords":"keyword1, keyword2, keyword3","suggested_tags":["tag1","tag2","tag3"],"image_search_term":"search term"}

Field descriptions:
- title: Catchy, SEO-friendly blog title (max 70 characters)
- slug: URL-friendly version of the title using lowercase and hyphens
- excerpt: Compelling summary (150-200 characters) that hooks readers
- content: Full blog content in HTML format using <h2>, <h3>, <p>, <ul>, <ol>, <strong>, <em> tags. Use \n for line breaks between tags.
- meta_title: SEO meta title (max 60 characters)
- meta_description: SEO meta description (max 155 characters)
- meta_keywords: Comma-separated relevant keywords
- suggested_tags: Array of 3-5 relevant tag strings
- image_search_term: Best search term for finding a relevant featured image

Important:
1. Create ORIGINAL content inspired by the source - don't plagiarize
2. Simplify complex information to make it accessible
3. Use proper HTML formatting in content - no markdown
4. Include at least 3 section headings (h2 or h3)
5. Return ONLY the JSON object - no markdown code blocks, no explanation
6. All newlines in string values MUST be escaped as \n`, url, cleanedHTML, prompt, targetTone, targetLength)

	request := ClaudeRequest{
		Model:     "claude-3-haiku-20240307",
		MaxTokens: 4096,
		Messages: []ClaudeMessage{
			{
				Role:    "user",
				Content: aiPrompt,
			},
		},
	}

	requestBody, err := json.Marshal(request)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	claudeResp, err := s.callClaudeAPIWithRetry(ctx, requestBody)
	if err != nil {
		return nil, err
	}

	responseText := claudeResp.Content[0].Text
	jsonStr := s.extractJSON(responseText)

	var generatedBlog GeneratedBlog
	if err := json.Unmarshal([]byte(jsonStr), &generatedBlog); err != nil {
		// Standard JSON parsing failed, try manual extraction as fallback
		fmt.Printf("[AIService] Standard JSON parse failed: %v, trying manual extraction\n", err)

		manualBlog, manualErr := s.parseGeneratedBlogManually(responseText)
		if manualErr != nil {
			fmt.Printf("[AIService] Manual extraction also failed: %v\n", manualErr)
			fmt.Printf("[AIService] First 500 chars of response: %s\n", truncateString(responseText, 500))
			return nil, fmt.Errorf("failed to parse generated blog data: %w (response length: %d)", err, len(responseText))
		}

		fmt.Printf("[AIService] Manual extraction succeeded\n")
		return manualBlog, nil
	}

	return &generatedBlog, nil
}

// SimplifyBlogContent simplifies existing blog content to make it more readable
func (s *AIService) SimplifyBlogContent(ctx context.Context, content string, targetTone string) (string, error) {
	if s.apiKey == "" {
		return "", fmt.Errorf("ANTHROPIC_API_KEY environment variable not set")
	}

	if targetTone == "" {
		targetTone = "simple and easy to understand"
	}

	aiPrompt := fmt.Sprintf(`You are an expert editor who makes complex content accessible to all readers.

CONTENT TO SIMPLIFY:
%s

REQUIREMENTS:
- Tone: %s
- Simplify complex sentences and jargon
- Keep the core information and insights
- Maintain proper HTML formatting
- Make it engaging and easy to read
- Keep approximately the same length
- Use shorter paragraphs and bullet points where appropriate

Return ONLY the simplified HTML content, nothing else. Do not add any explanation or wrapper.`, content, targetTone)

	request := ClaudeRequest{
		Model:     "claude-3-haiku-20240307",
		MaxTokens: 4096,
		Messages: []ClaudeMessage{
			{
				Role:    "user",
				Content: aiPrompt,
			},
		},
	}

	requestBody, err := json.Marshal(request)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	claudeResp, err := s.callClaudeAPIWithRetry(ctx, requestBody)
	if err != nil {
		return "", err
	}

	simplifiedContent := claudeResp.Content[0].Text
	// Remove markdown code blocks if present
	simplifiedContent = strings.TrimPrefix(simplifiedContent, "```html")
	simplifiedContent = strings.TrimPrefix(simplifiedContent, "```")
	simplifiedContent = strings.TrimSuffix(simplifiedContent, "```")
	simplifiedContent = strings.TrimSpace(simplifiedContent)

	return simplifiedContent, nil
}
