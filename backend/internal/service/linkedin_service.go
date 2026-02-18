package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
)

// LinkedInService handles LinkedIn OAuth and posting
type LinkedInService struct {
	tokenRepo  *repository.LinkedInTokenRepository
	postRepo   *repository.LinkedInPostRepository
	cmsService *CMSService
	config     LinkedInConfig
}

type LinkedInConfig struct {
	ClientID     string
	ClientSecret string
	RedirectURL  string
	FrontendURL  string
}

// LinkedIn API response structs

type linkedInTokenResponse struct {
	AccessToken  string `json:"access_token"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
}

type linkedInOrgResponse struct {
	Elements []struct {
		ID            int    `json:"id"`
		VanityName    string `json:"vanityName"`
		LocalizedName string `json:"localizedName"`
	} `json:"elements"`
}

type linkedInUserInfoResponse struct {
	Sub   string `json:"sub"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type linkedInPostResponse struct {
	ID string `json:"id"`
}

type linkedInErrorResponse struct {
	Message string `json:"message"`
	Status  int    `json:"status"`
}

func NewLinkedInService(
	tokenRepo *repository.LinkedInTokenRepository,
	postRepo *repository.LinkedInPostRepository,
	cmsService *CMSService,
	config LinkedInConfig,
) *LinkedInService {
	return &LinkedInService{
		tokenRepo:  tokenRepo,
		postRepo:   postRepo,
		cmsService: cmsService,
		config:     config,
	}
}

// GetAuthURL generates the LinkedIn OAuth authorization URL
func (s *LinkedInService) GetAuthURL(state string) string {
	baseURL := "https://www.linkedin.com/oauth/v2/authorization"
	params := url.Values{}
	params.Add("response_type", "code")
	params.Add("client_id", s.config.ClientID)
	params.Add("redirect_uri", s.config.RedirectURL)
	params.Add("state", state)
	params.Add("scope", "openid profile email w_organization_social r_organization_social")

	return fmt.Sprintf("%s?%s", baseURL, params.Encode())
}

// ExchangeCode exchanges the authorization code for tokens
func (s *LinkedInService) ExchangeCode(ctx context.Context, code string) (*linkedInTokenResponse, error) {
	tokenURL := "https://www.linkedin.com/oauth/v2/accessToken"

	data := url.Values{}
	data.Set("grant_type", "authorization_code")
	data.Set("code", code)
	data.Set("client_id", s.config.ClientID)
	data.Set("client_secret", s.config.ClientSecret)
	data.Set("redirect_uri", s.config.RedirectURL)

	resp, err := http.PostForm(tokenURL, data)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("token exchange failed (status %d): %s", resp.StatusCode, string(body))
	}

	var tokenResp linkedInTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, fmt.Errorf("failed to decode token response: %w", err)
	}

	return &tokenResp, nil
}

// RefreshAccessToken refreshes an expired access token
func (s *LinkedInService) RefreshAccessToken(ctx context.Context, refreshToken string) (*linkedInTokenResponse, error) {
	tokenURL := "https://www.linkedin.com/oauth/v2/accessToken"

	data := url.Values{}
	data.Set("grant_type", "refresh_token")
	data.Set("refresh_token", refreshToken)
	data.Set("client_id", s.config.ClientID)
	data.Set("client_secret", s.config.ClientSecret)

	resp, err := http.PostForm(tokenURL, data)
	if err != nil {
		return nil, fmt.Errorf("failed to refresh token: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("token refresh failed (status %d): %s", resp.StatusCode, string(body))
	}

	var tokenResp linkedInTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return nil, fmt.Errorf("failed to decode refresh response: %w", err)
	}

	return &tokenResp, nil
}

// ResolveOrganizationID resolves a vanity name to a numeric organization ID
func (s *LinkedInService) ResolveOrganizationID(ctx context.Context, accessToken, vanityName string) (string, string, error) {
	apiURL := fmt.Sprintf("https://api.linkedin.com/rest/organizations?q=vanityName&vanityName=%s", url.QueryEscape(vanityName))

	req, err := http.NewRequestWithContext(ctx, "GET", apiURL, nil)
	if err != nil {
		return "", "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("LinkedIn-Version", "202602")
	req.Header.Set("X-Restli-Protocol-Version", "2.0.0")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("failed to resolve organization: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", "", fmt.Errorf("organization lookup failed (status %d): %s", resp.StatusCode, string(body))
	}

	var orgResp linkedInOrgResponse
	if err := json.NewDecoder(resp.Body).Decode(&orgResp); err != nil {
		return "", "", fmt.Errorf("failed to decode org response: %w", err)
	}

	if len(orgResp.Elements) == 0 {
		return "", "", fmt.Errorf("organization not found for vanity name: %s", vanityName)
	}

	orgID := fmt.Sprintf("%d", orgResp.Elements[0].ID)
	orgName := orgResp.Elements[0].LocalizedName

	return orgID, orgName, nil
}

// GetMemberProfile gets the authenticated member's profile info via userinfo
func (s *LinkedInService) GetMemberProfile(ctx context.Context, accessToken string) (*linkedInUserInfoResponse, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.linkedin.com/v2/userinfo", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create userinfo request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to get userinfo: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("userinfo failed (status %d): %s", resp.StatusCode, string(body))
	}

	var userInfo linkedInUserInfoResponse
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("failed to decode userinfo: %w", err)
	}

	return &userInfo, nil
}

// HandleCallback processes the OAuth callback and stores the token
func (s *LinkedInService) HandleCallback(ctx context.Context, code string, adminUserID uuid.UUID) (*domain.LinkedInToken, error) {
	// Exchange code for tokens
	tokenResp, err := s.ExchangeCode(ctx, code)
	if err != nil {
		return nil, err
	}

	// Resolve organization ID from vanity name
	orgID, orgName, err := s.ResolveOrganizationID(ctx, tokenResp.AccessToken, "jobsworld-in")
	if err != nil {
		log.Printf("Warning: could not resolve organization: %v", err)
		orgID = ""
		orgName = ""
	}

	// Deactivate any existing active tokens
	if err := s.tokenRepo.DeactivateAll(); err != nil {
		return nil, fmt.Errorf("failed to deactivate existing tokens: %w", err)
	}

	// Calculate expiry times
	expiresAt := time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)
	refreshExpiresAt := time.Now().Add(365 * 24 * time.Hour) // LinkedIn refresh tokens last ~1 year

	// Store the new token
	token := &domain.LinkedInToken{
		ID:                 uuid.New(),
		OrganizationID:     orgID,
		OrganizationVanity: "jobsworld-in",
		OrganizationName:   orgName,
		AccessToken:        tokenResp.AccessToken,
		TokenType:          "Bearer",
		Scopes:             tokenResp.Scope,
		ExpiresAt:          expiresAt,
		IsActive:           true,
		ConnectedBy:        &adminUserID,
	}

	if tokenResp.RefreshToken != "" {
		token.RefreshToken = &tokenResp.RefreshToken
		token.RefreshTokenExpiresAt = &refreshExpiresAt
	}

	if err := s.tokenRepo.Create(token); err != nil {
		return nil, fmt.Errorf("failed to store token: %w", err)
	}

	return token, nil
}

// GetConnectionStatus returns the current LinkedIn connection status
func (s *LinkedInService) GetConnectionStatus() (*domain.LinkedInConnectionStatusResponse, error) {
	token, err := s.tokenRepo.GetActiveToken()
	if err != nil {
		return &domain.LinkedInConnectionStatusResponse{Connected: false}, nil
	}

	return &domain.LinkedInConnectionStatusResponse{
		Connected:        true,
		OrganizationID:   token.OrganizationID,
		OrganizationName: token.OrganizationName,
		ExpiresAt:        &token.ExpiresAt,
		ConnectedAt:      &token.CreatedAt,
	}, nil
}

// Disconnect deactivates the LinkedIn connection
func (s *LinkedInService) Disconnect() error {
	return s.tokenRepo.DeactivateAll()
}

// ensureValidToken gets the active token and refreshes it if needed
func (s *LinkedInService) ensureValidToken(ctx context.Context) (*domain.LinkedInToken, error) {
	token, err := s.tokenRepo.GetActiveToken()
	if err != nil {
		return nil, fmt.Errorf("no active LinkedIn connection")
	}

	// If token expires within 7 days, try to refresh
	if token.ExpiresWithinDays(7) && token.RefreshToken != nil {
		refreshResp, err := s.RefreshAccessToken(ctx, *token.RefreshToken)
		if err != nil {
			// If refresh fails and token is already expired, return error
			if token.IsExpired() {
				token.IsActive = false
				s.tokenRepo.Update(token)
				return nil, fmt.Errorf("LinkedIn token expired and refresh failed: %w", err)
			}
			// Token not yet expired, continue with current token
			log.Printf("Warning: token refresh failed, using existing token: %v", err)
			return token, nil
		}

		// Update token with refreshed values
		token.AccessToken = refreshResp.AccessToken
		token.ExpiresAt = time.Now().Add(time.Duration(refreshResp.ExpiresIn) * time.Second)
		if refreshResp.RefreshToken != "" {
			token.RefreshToken = &refreshResp.RefreshToken
			refreshExpiresAt := time.Now().Add(365 * 24 * time.Hour)
			token.RefreshTokenExpiresAt = &refreshExpiresAt
		}

		if err := s.tokenRepo.Update(token); err != nil {
			log.Printf("Warning: failed to update refreshed token: %v", err)
		}
	} else if token.IsExpired() {
		token.IsActive = false
		s.tokenRepo.Update(token)
		return nil, fmt.Errorf("LinkedIn token expired and no refresh token available")
	}

	return token, nil
}

// createLinkedInPost calls the LinkedIn API to create a post
func (s *LinkedInService) createLinkedInPost(ctx context.Context, accessToken, authorID, text, link, title, description string) (string, error) {
	apiURL := "https://api.linkedin.com/rest/posts"

	postBody := map[string]interface{}{
		"author":         fmt.Sprintf("urn:li:organization:%s", authorID),
		"commentary":     text,
		"visibility":     "PUBLIC",
		"lifecycleState": "PUBLISHED",
		"distribution": map[string]interface{}{
			"feedDistribution":               "MAIN_FEED",
			"targetEntities":                 []interface{}{},
			"thirdPartyDistributionChannels": []interface{}{},
		},
		"isReshareDisabledByAuthor": false,
	}

	// Add article content if link is provided
	if link != "" {
		articleTitle := title
		if articleTitle == "" {
			articleTitle = "Check this out"
		}
		article := map[string]interface{}{
			"source": link,
			"title":  articleTitle,
		}
		if description != "" {
			article["description"] = description
		}
		postBody["content"] = map[string]interface{}{
			"article": article,
		}
	}

	jsonBody, err := json.Marshal(postBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal post body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("LinkedIn-Version", "202602")
	req.Header.Set("X-Restli-Protocol-Version", "2.0.0")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to create LinkedIn post: %w", err)
	}
	defer resp.Body.Close()

	// LinkedIn returns 201 for successful post creation
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("LinkedIn post failed (status %d): %s", resp.StatusCode, string(body))
	}

	// Get the post ID from the x-restli-id header
	postID := resp.Header.Get("x-restli-id")
	if postID == "" {
		// Try to parse from response body
		var postResp linkedInPostResponse
		body, _ := io.ReadAll(resp.Body)
		json.Unmarshal(body, &postResp)
		postID = postResp.ID
	}

	return postID, nil
}

// formatJobPost creates the LinkedIn post text for a job
func (s *LinkedInService) formatJobPost(job *domain.Job) (string, string, string) {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("We're Hiring: %s", job.Title))
	if job.CompanyName != "" {
		sb.WriteString(fmt.Sprintf(" at %s", job.CompanyName))
	}
	sb.WriteString("\n\n")

	if job.Location != "" {
		sb.WriteString(fmt.Sprintf("Location: %s\n", job.Location))
	}
	sb.WriteString(fmt.Sprintf("Type: %s\n", strings.ReplaceAll(string(job.JobType), "_", " ")))
	sb.WriteString(fmt.Sprintf("Experience: %s\n", string(job.ExperienceLevel)))

	if job.ShortDescription != "" {
		desc := job.ShortDescription
		if len(desc) > 200 {
			desc = desc[:200] + "..."
		}
		sb.WriteString(fmt.Sprintf("\n%s\n", desc))
	}

	link := fmt.Sprintf("%s/jobs/%s", s.config.FrontendURL, job.Slug)
	sb.WriteString(fmt.Sprintf("\nApply now on JobsWorld!\n"))

	// Add hashtags
	sb.WriteString("\n#hiring #jobs #careers")
	if job.Location != "" {
		location := strings.ReplaceAll(job.Location, " ", "")
		location = strings.ReplaceAll(location, ",", "")
		sb.WriteString(fmt.Sprintf(" #%s", location))
	}

	desc := job.ShortDescription
	if len(desc) > 256 {
		desc = desc[:256] + "..."
	}

	return sb.String(), link, desc
}

// formatBlogPost creates the LinkedIn post text for a blog
func (s *LinkedInService) formatBlogPost(blog *domain.Blog) (string, string, string) {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("New on our blog: %s\n\n", blog.Title))

	if blog.Excerpt != nil && *blog.Excerpt != "" {
		excerpt := *blog.Excerpt
		if len(excerpt) > 200 {
			excerpt = excerpt[:200] + "..."
		}
		sb.WriteString(fmt.Sprintf("%s\n", excerpt))
	}

	link := fmt.Sprintf("%s/blog/%s", s.config.FrontendURL, blog.Slug)
	sb.WriteString("\nRead more on JobsWorld!")
	sb.WriteString("\n\n#careers #jobsworld #blog")

	blogDesc := ""
	if blog.Excerpt != nil && *blog.Excerpt != "" {
		blogDesc = *blog.Excerpt
		if len(blogDesc) > 256 {
			blogDesc = blogDesc[:256] + "..."
		}
	}

	return sb.String(), link, blogDesc
}

// PostJob posts a job to LinkedIn
func (s *LinkedInService) PostJob(ctx context.Context, job *domain.Job, triggerType string, postedBy *uuid.UUID) (*domain.LinkedInPost, error) {
	token, err := s.ensureValidToken(ctx)
	if err != nil {
		return nil, err
	}

	// Check if already posted
	if posted, _ := s.postRepo.IsJobPosted(job.ID); posted {
		return nil, fmt.Errorf("this job has already been posted to LinkedIn")
	}

	text, link, desc := s.formatJobPost(job)

	// Create post record
	post := &domain.LinkedInPost{
		ID:             uuid.New(),
		ContentType:    domain.LinkedInContentTypeJob,
		JobID:          &job.ID,
		OrganizationID: token.OrganizationID,
		PostText:       text,
		PostLink:       link,
		TriggerType:    triggerType,
		Status:         domain.LinkedInPostStatusPending,
		PostedBy:       postedBy,
	}

	if err := s.postRepo.Create(post); err != nil {
		return nil, fmt.Errorf("failed to create post record: %w", err)
	}

	// Call LinkedIn API
	postID, err := s.createLinkedInPost(ctx, token.AccessToken, token.OrganizationID, text, link, job.Title, desc)
	if err != nil {
		post.Status = domain.LinkedInPostStatusFailed
		post.ErrorMessage = err.Error()
		s.postRepo.Update(post)
		return post, err
	}

	// Update post record with success
	now := time.Now()
	post.Status = domain.LinkedInPostStatusPosted
	post.LinkedInPostID = postID
	post.PostedAt = &now
	s.postRepo.Update(post)

	return post, nil
}

// PostBlog posts a blog to LinkedIn
func (s *LinkedInService) PostBlog(ctx context.Context, blog *domain.Blog, triggerType string, postedBy *uuid.UUID) (*domain.LinkedInPost, error) {
	token, err := s.ensureValidToken(ctx)
	if err != nil {
		return nil, err
	}

	// Check if already posted
	if posted, _ := s.postRepo.IsBlogPosted(blog.ID); posted {
		return nil, fmt.Errorf("this blog has already been posted to LinkedIn")
	}

	text, link, desc := s.formatBlogPost(blog)

	// Create post record
	post := &domain.LinkedInPost{
		ID:             uuid.New(),
		ContentType:    domain.LinkedInContentTypeBlog,
		BlogID:         &blog.ID,
		OrganizationID: token.OrganizationID,
		PostText:       text,
		PostLink:       link,
		TriggerType:    triggerType,
		Status:         domain.LinkedInPostStatusPending,
		PostedBy:       postedBy,
	}

	if err := s.postRepo.Create(post); err != nil {
		return nil, fmt.Errorf("failed to create post record: %w", err)
	}

	// Call LinkedIn API
	postID, err := s.createLinkedInPost(ctx, token.AccessToken, token.OrganizationID, text, link, blog.Title, desc)
	if err != nil {
		post.Status = domain.LinkedInPostStatusFailed
		post.ErrorMessage = err.Error()
		s.postRepo.Update(post)
		return post, err
	}

	// Update post record with success
	now := time.Now()
	post.Status = domain.LinkedInPostStatusPosted
	post.LinkedInPostID = postID
	post.PostedAt = &now
	s.postRepo.Update(post)

	return post, nil
}

// PostCustom posts custom content to LinkedIn
func (s *LinkedInService) PostCustom(ctx context.Context, text, link string, postedBy *uuid.UUID) (*domain.LinkedInPost, error) {
	token, err := s.ensureValidToken(ctx)
	if err != nil {
		return nil, err
	}

	// Create post record
	post := &domain.LinkedInPost{
		ID:             uuid.New(),
		ContentType:    domain.LinkedInContentTypeCustom,
		OrganizationID: token.OrganizationID,
		PostText:       text,
		PostLink:       link,
		TriggerType:    domain.LinkedInTriggerManual,
		Status:         domain.LinkedInPostStatusPending,
		PostedBy:       postedBy,
	}

	if err := s.postRepo.Create(post); err != nil {
		return nil, fmt.Errorf("failed to create post record: %w", err)
	}

	// Call LinkedIn API — for custom posts, use first line of text as title
	customTitle := text
	if idx := strings.Index(customTitle, "\n"); idx > 0 {
		customTitle = customTitle[:idx]
	}
	if len(customTitle) > 100 {
		customTitle = customTitle[:100]
	}
	postID, err := s.createLinkedInPost(ctx, token.AccessToken, token.OrganizationID, text, link, customTitle, "")
	if err != nil {
		post.Status = domain.LinkedInPostStatusFailed
		post.ErrorMessage = err.Error()
		s.postRepo.Update(post)
		return post, err
	}

	// Update post record with success
	now := time.Now()
	post.Status = domain.LinkedInPostStatusPosted
	post.LinkedInPostID = postID
	post.PostedAt = &now
	s.postRepo.Update(post)

	return post, nil
}

// AutoPostJob handles auto-posting a job (called async from ApproveJob handler)
func (s *LinkedInService) AutoPostJob(ctx context.Context, job *domain.Job, adminUserID uuid.UUID) error {
	// Check if auto-post is enabled
	setting, err := s.cmsService.GetSetting("linkedin_auto_post_jobs")
	if err != nil || setting.Value != "true" {
		return nil // Auto-post disabled, skip silently
	}

	_, err = s.PostJob(ctx, job, domain.LinkedInTriggerAuto, &adminUserID)
	if err != nil {
		log.Printf("LinkedIn auto-post failed for job %s: %v", job.ID, err)
		return err
	}

	log.Printf("LinkedIn auto-post successful for job %s", job.ID)
	return nil
}

// AutoPostBlog handles auto-posting a blog (called async from PublishBlog handler)
func (s *LinkedInService) AutoPostBlog(ctx context.Context, blog *domain.Blog, adminUserID uuid.UUID) error {
	// Check if auto-post is enabled
	setting, err := s.cmsService.GetSetting("linkedin_auto_post_blogs")
	if err != nil || setting.Value != "true" {
		return nil // Auto-post disabled, skip silently
	}

	_, err = s.PostBlog(ctx, blog, domain.LinkedInTriggerAuto, &adminUserID)
	if err != nil {
		log.Printf("LinkedIn auto-post failed for blog %s: %v", blog.ID, err)
		return err
	}

	log.Printf("LinkedIn auto-post successful for blog %s", blog.ID)
	return nil
}

// GetAutoPostSettings returns the current auto-post settings
func (s *LinkedInService) GetAutoPostSettings() (*domain.LinkedInAutoPostSettings, error) {
	settings := &domain.LinkedInAutoPostSettings{}

	if jobSetting, err := s.cmsService.GetSetting("linkedin_auto_post_jobs"); err == nil {
		settings.AutoPostJobs = jobSetting.Value == "true"
	}
	if blogSetting, err := s.cmsService.GetSetting("linkedin_auto_post_blogs"); err == nil {
		settings.AutoPostBlogs = blogSetting.Value == "true"
	}

	return settings, nil
}

// UpdateAutoPostSettings updates auto-post toggle settings
func (s *LinkedInService) UpdateAutoPostSettings(settings *domain.LinkedInAutoPostSettings, adminUserID uuid.UUID) error {
	jobValue := "false"
	if settings.AutoPostJobs {
		jobValue = "true"
	}
	blogValue := "false"
	if settings.AutoPostBlogs {
		blogValue = "true"
	}

	desc := "LinkedIn auto-post setting"
	if err := s.cmsService.UpdateSetting("linkedin_auto_post_jobs", jobValue, &desc, adminUserID); err != nil {
		return err
	}
	return s.cmsService.UpdateSetting("linkedin_auto_post_blogs", blogValue, &desc, adminUserID)
}

// GetPostHistory returns paginated post history
func (s *LinkedInService) GetPostHistory(filters map[string]interface{}, limit, offset int) ([]domain.LinkedInPost, int64, error) {
	return s.postRepo.List(filters, limit, offset)
}
