package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

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
			Timeout: 60 * time.Second,
		},
	}
}

// ExtractedJob represents the extracted job data from AI
type ExtractedJob struct {
	Title           string   `json:"title"`
	Company         string   `json:"company"`
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
2. For job_type, map common terms: "full-time" -> "FULL_TIME", "part-time" -> "PART_TIME", etc.
3. For experience_level, infer from years required or job level mentioned
4. For skills, extract ONLY specific, concrete skills such as:
   - Technical tools and software (e.g., "Excel", "Power BI", "SAP", "AutoCAD")
   - Programming languages (e.g., "Python", "JavaScript", "SQL")
   - Frameworks and platforms (e.g., "React", "AWS", "Kubernetes")
   - Certifications (e.g., "NEBOSH", "PMP", "CPA", "Six Sigma")
   - Industry-specific tools (e.g., "Salesforce", "Telematics", "ERP Systems")
   - Methodologies (e.g., "Agile", "Scrum", "Lean")
   DO NOT include generic soft skills like "communication", "teamwork", "leadership", "problem-solving", "written", "verbal", etc.
   Keep skills concise (1-3 words each), capitalize properly
5. Keep the description in HTML format if it was HTML
6. Be thorough and extract all relevant information
7. Return ONLY valid JSON, no markdown formatting or extra text`, url, cleanedHTML)

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
		return nil, fmt.Errorf("Claude API error (status %d): %s", resp.StatusCode, string(body))
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
