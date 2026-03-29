package service

import (
	"context"
	"encoding/json"
	"fmt"
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"regexp"
	"strings"
)

const chatSystemPrompt = `You are JobsWorld Assistant, an AI career helper for JobsWorld.in — a job aggregation platform for developers and tech professionals.

You help job seekers find relevant jobs and give practical career advice.

When the user wants to find, search, or see jobs (e.g. "show me Go jobs", "find remote React positions", "backend roles in Bangalore", "what jobs are there for freshers"), respond with a friendly message AND include a search block at the very end:

<SEARCH>{"skills":["Go","PostgreSQL"],"keywords":"golang backend engineer","experience_level":"","location":"","remote":false}</SEARCH>

Search block fields:
- skills: specific technical skills mentioned (empty array if none)
- keywords: main search term to match title/description
- experience_level: one of "ENTRY", "MID", "SENIOR", "LEAD", "EXECUTIVE" — or empty string
- location: city or region (empty string if not specified or if remote)
- remote: true only if user explicitly asks for remote jobs

For general questions (career advice, salary info, how to improve a skill, platform questions), answer helpfully WITHOUT the <SEARCH> block.

Keep replies concise — 2-4 sentences. Be warm and encouraging.`

// ChatMessage is a single turn in the conversation
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ChatSearchIntent holds the extracted job search parameters from Claude's response
type ChatSearchIntent struct {
	Skills          []string `json:"skills"`
	Keywords        string   `json:"keywords"`
	ExperienceLevel string   `json:"experience_level"`
	Location        string   `json:"location"`
	Remote          bool     `json:"remote"`
}

// ChatResponse is returned to the client
type ChatResponse struct {
	Reply  string       `json:"reply"`
	Jobs   []domain.Job `json:"jobs,omitempty"`
	Intent string       `json:"intent"` // "job_search" | "general"
}

// ChatService processes chat messages using Claude AI
type ChatService struct {
	aiService *AIService
	jobRepo   *repository.JobRepository
}

// NewChatService creates a new chat service
func NewChatService(aiService *AIService, jobRepo *repository.JobRepository) *ChatService {
	return &ChatService{aiService: aiService, jobRepo: jobRepo}
}

var searchBlockRe = regexp.MustCompile(`(?s)<SEARCH>(.*?)</SEARCH>`)

// ProcessMessage sends the user message + history to Claude and returns a reply with optional jobs
func (s *ChatService) ProcessMessage(ctx context.Context, message string, history []ChatMessage) (*ChatResponse, error) {
	if s.aiService.apiKey == "" {
		return nil, fmt.Errorf("ANTHROPIC_API_KEY not set")
	}

	// Build messages array: system-primed history + new user message
	messages := make([]interface{}, 0, len(history)+1)
	for _, h := range history {
		messages = append(messages, map[string]interface{}{
			"role":    h.Role,
			"content": h.Content,
		})
	}
	messages = append(messages, map[string]interface{}{
		"role":    "user",
		"content": message,
	})

	requestBody := map[string]interface{}{
		"model":      "claude-3-haiku-20240307",
		"max_tokens": 1024,
		"system":     chatSystemPrompt,
		"messages":   messages,
	}

	reqBytes, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	claudeResp, err := s.aiService.callClaudeAPIWithRetry(ctx, reqBytes)
	if err != nil {
		return nil, err
	}

	raw := strings.TrimSpace(claudeResp.Content[0].Text)

	// Extract <SEARCH> block if present
	match := searchBlockRe.FindStringSubmatch(raw)
	reply := strings.TrimSpace(searchBlockRe.ReplaceAllString(raw, ""))

	if match == nil {
		return &ChatResponse{Reply: reply, Intent: "general"}, nil
	}

	// Parse search intent
	var intent ChatSearchIntent
	if err := json.Unmarshal([]byte(strings.TrimSpace(match[1])), &intent); err != nil {
		// Malformed search block — return reply without jobs
		return &ChatResponse{Reply: reply, Intent: "general"}, nil
	}

	jobs, err := s.jobRepo.FindBySkills(intent.Skills, intent.ExperienceLevel, intent.Keywords, intent.Remote, intent.Location, 10)
	if err != nil {
		// Don't fail the whole request if job lookup fails
		return &ChatResponse{Reply: reply, Intent: "job_search"}, nil
	}

	return &ChatResponse{Reply: reply, Jobs: jobs, Intent: "job_search"}, nil
}
