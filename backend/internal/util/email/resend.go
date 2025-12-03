package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// ResendConfig holds Resend API configuration
type ResendConfig struct {
	APIKey   string
	FromEmail string
	FromName  string
}

// ResendService handles email sending via Resend API
type ResendService struct {
	config *ResendConfig
	client *http.Client
}

// NewResendService creates a new Resend email service
func NewResendService(config *ResendConfig) *ResendService {
	return &ResendService{
		config: config,
		client: &http.Client{},
	}
}

// ResendEmailRequest represents Resend API request
type ResendEmailRequest struct {
	From    string `json:"from"`
	To      []string `json:"to"`
	Subject string `json:"subject"`
	HTML    string `json:"html"`
	Text    string `json:"text,omitempty"`
}

// ResendEmailResponse represents Resend API response
type ResendEmailResponse struct {
	ID    string `json:"id"`
	Error string `json:"error,omitempty"`
}

// SendEmail sends an email via Resend API
func (s *ResendService) SendEmail(to, subject, htmlBody, textBody string) error {
	reqBody := ResendEmailRequest{
		From:    fmt.Sprintf("%s <%s>", s.config.FromName, s.config.FromEmail),
		To:      []string{to},
		Subject: subject,
		HTML:    htmlBody,
		Text:    textBody,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+s.config.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errResp ResendEmailResponse
		if err := json.Unmarshal(body, &errResp); err == nil && errResp.Error != "" {
			return fmt.Errorf("resend API error: %s", errResp.Error)
		}
		return fmt.Errorf("resend API error: status %d, body: %s", resp.StatusCode, string(body))
	}

	var response ResendEmailResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	return nil
}

// SendVerificationEmail sends email verification
func (s *ResendService) SendVerificationEmail(data EmailData) error {
	html, err := renderTemplate(verificationEmailTemplate, data)
	if err != nil {
		return err
	}

	text := fmt.Sprintf("Hello %s,\n\nPlease verify your email by visiting: %s?token=%s\n\nThis link expires in 24 hours.",
		data.Name, data.VerificationURL, data.Token)

	return s.SendEmail(data.Email, "Verify Your Email - "+data.CompanyName, html, text)
}

// SendPasswordResetEmail sends password reset email
func (s *ResendService) SendPasswordResetEmail(data EmailData) error {
	html, err := renderTemplate(passwordResetEmailTemplate, data)
	if err != nil {
		return err
	}

	text := fmt.Sprintf("Hello %s,\n\nReset your password by visiting: %s?token=%s\n\nThis link expires in 1 hour.",
		data.Name, data.ResetURL, data.Token)

	return s.SendEmail(data.Email, "Password Reset Request - "+data.CompanyName, html, text)
}

// SendWelcomeEmail sends welcome email after verification
func (s *ResendService) SendWelcomeEmail(data EmailData) error {
	html, err := renderTemplate(welcomeEmailTemplate, data)
	if err != nil {
		return err
	}

	text := fmt.Sprintf("Hello %s,\n\nWelcome to %s! Your email has been verified successfully.",
		data.Name, data.CompanyName)

	return s.SendEmail(data.Email, "Welcome to "+data.CompanyName, html, text)
}

// SendPasswordChangedEmail sends password changed confirmation
func (s *ResendService) SendPasswordChangedEmail(data EmailData) error {
	html, err := renderTemplate(passwordChangedEmailTemplate, data)
	if err != nil {
		return err
	}

	text := fmt.Sprintf("Hello %s,\n\nYour password was changed at %s.\n\nIf this wasn't you, contact support at %s",
		data.Name, data.LoginTime, data.SupportEmail)

	return s.SendEmail(data.Email, "Password Changed - "+data.CompanyName, html, text)
}

// SendAccountLockedEmail sends account locked notification
func (s *ResendService) SendAccountLockedEmail(data EmailData) error {
	html, err := renderTemplate(accountLockedEmailTemplate, data)
	if err != nil {
		return err
	}

	text := fmt.Sprintf("Hello %s,\n\nYour account has been locked due to multiple failed login attempts from IP: %s at %s.\n\nIt will be unlocked in 15 minutes.",
		data.Name, data.LoginIP, data.LoginTime)

	return s.SendEmail(data.Email, "Account Locked - "+data.CompanyName, html, text)
}

// SendAdminLoginAlert sends admin login alert
func (s *ResendService) SendAdminLoginAlert(data EmailData) error {
	html, err := renderTemplate(adminLoginAlertTemplate, data)
	if err != nil {
		return err
	}

	text := fmt.Sprintf("Admin login detected: %s from IP %s at %s",
		data.Email, data.LoginIP, data.LoginTime)

	return s.SendEmail(data.Email, "Admin Login Alert - "+data.CompanyName, html, text)
}
