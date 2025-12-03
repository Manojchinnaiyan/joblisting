package email

import (
	"bytes"
	"fmt"
	"html/template"

	"gopkg.in/gomail.v2"
)

// EmailConfig holds email configuration
type EmailConfig struct {
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	FromEmail    string
	FromName     string
}

// EmailService handles email sending
type EmailService struct {
	config *EmailConfig
}

// NewEmailService creates a new email service
func NewEmailService(config *EmailConfig) *EmailService {
	return &EmailService{config: config}
}

// SendEmail sends an email
func (s *EmailService) SendEmail(to, subject, htmlBody, textBody string) error {
	m := gomail.NewMessage()
	m.SetHeader("From", fmt.Sprintf("%s <%s>", s.config.FromName, s.config.FromEmail))
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/plain", textBody)
	m.AddAlternative("text/html", htmlBody)

	d := gomail.NewDialer(s.config.SMTPHost, s.config.SMTPPort, s.config.SMTPUser, s.config.SMTPPassword)

	return d.DialAndSend(m)
}

// renderTemplate renders an HTML template
func renderTemplate(templateStr string, data interface{}) (string, error) {
	tmpl, err := template.New("email").Parse(templateStr)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

// EmailData holds data for email templates
type EmailData struct {
	Name              string
	Email             string
	Token             string
	VerificationURL   string
	ResetURL          string
	LoginIP           string
	LoginTime         string
	CompanyName       string
	SupportEmail      string
	Year              int
}

// Verification email template
const verificationEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{.CompanyName}}!</h1>
        </div>
        <div class="content">
            <h2>Hello {{.Name}},</h2>
            <p>Thank you for registering with {{.CompanyName}}. To complete your registration, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
                <a href="{{.VerificationURL}}?token={{.Token}}" class="button">Verify Email Address</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
                {{.VerificationURL}}?token={{.Token}}
            </p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>&copy; {{.Year}} {{.CompanyName}}. All rights reserved.</p>
            <p>If you have any questions, contact us at {{.SupportEmail}}</p>
        </div>
    </div>
</body>
</html>
`

// Password reset email template
const passwordResetEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background-color: #FEF3C7; padding: 15px; border-left: 4px solid #F59E0B; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hello {{.Name}},</h2>
            <p>We received a request to reset the password for your {{.CompanyName}} account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
                <a href="{{.ResetURL}}?token={{.Token}}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
                {{.ResetURL}}?token={{.Token}}
            </p>
            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p>This password reset link will expire in 1 hour for security reasons.</p>
                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
        </div>
        <div class="footer">
            <p>&copy; {{.Year}} {{.CompanyName}}. All rights reserved.</p>
            <p>If you have any questions, contact us at {{.SupportEmail}}</p>
        </div>
    </div>
</body>
</html>
`

// Welcome email template
const welcomeEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 30px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to {{.CompanyName}}!</h1>
        </div>
        <div class="content">
            <h2>Hello {{.Name}},</h2>
            <p>Your email has been successfully verified! Welcome to the {{.CompanyName}} community.</p>
            <p>You can now:</p>
            <ul>
                <li>Search and apply for jobs</li>
                <li>Create and manage your profile</li>
                <li>Upload your resume</li>
                <li>Receive job alerts</li>
            </ul>
            <p>Start exploring opportunities today!</p>
        </div>
        <div class="footer">
            <p>&copy; {{.Year}} {{.CompanyName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`

// Password changed email template
const passwordChangedEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Changed</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10B981; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .warning { background-color: #FEE2E2; padding: 15px; border-left: 4px solid #EF4444; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✓ Password Changed Successfully</h1>
        </div>
        <div class="content">
            <h2>Hello {{.Name}},</h2>
            <p>Your {{.CompanyName}} account password has been successfully changed.</p>
            <p><strong>Time:</strong> {{.LoginTime}}</p>
            <div class="warning">
                <strong>⚠️ Didn't make this change?</strong>
                <p>If you did not change your password, please contact our support team immediately at {{.SupportEmail}}</p>
            </div>
        </div>
        <div class="footer">
            <p>&copy; {{.Year}} {{.CompanyName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`

// Account locked email template
const accountLockedEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Locked</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .warning { background-color: #FEE2E2; padding: 15px; border-left: 4px solid #EF4444; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Account Temporarily Locked</h1>
        </div>
        <div class="content">
            <h2>Hello {{.Name}},</h2>
            <p>Your {{.CompanyName}} account has been temporarily locked due to multiple failed login attempts.</p>
            <div class="warning">
                <p><strong>Security Details:</strong></p>
                <ul>
                    <li>Time: {{.LoginTime}}</li>
                    <li>IP Address: {{.LoginIP}}</li>
                </ul>
                <p>Your account will be automatically unlocked after 15 minutes.</p>
            </div>
            <p>If this wasn't you, please contact support immediately.</p>
        </div>
        <div class="footer">
            <p>&copy; {{.Year}} {{.CompanyName}}. All rights reserved.</p>
            <p>Contact: {{.SupportEmail}}</p>
        </div>
    </div>
</body>
</html>
`

// Admin login alert template
const adminLoginAlertTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #7C3AED; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9f9f9; padding: 30px; }
        .info { background-color: #DBEAFE; padding: 15px; border-left: 4px solid #3B82F6; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Admin Login Notification</h1>
        </div>
        <div class="content">
            <h2>Hello {{.Name}},</h2>
            <p>An admin login was detected on your account.</p>
            <div class="info">
                <p><strong>Login Details:</strong></p>
                <ul>
                    <li>Time: {{.LoginTime}}</li>
                    <li>IP Address: {{.LoginIP}}</li>
                    <li>Account: {{.Email}}</li>
                </ul>
            </div>
            <p>If this wasn't you, please secure your account immediately.</p>
        </div>
        <div class="footer">
            <p>&copy; {{.Year}} {{.CompanyName}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`

// SendVerificationEmail sends email verification
func (s *EmailService) SendVerificationEmail(data EmailData) error {
	html, err := renderTemplate(verificationEmailTemplate, data)
	if err != nil {
		return err
	}

	text := fmt.Sprintf("Hello %s,\n\nPlease verify your email by visiting: %s?token=%s\n\nThis link expires in 24 hours.",
		data.Name, data.VerificationURL, data.Token)

	return s.SendEmail(data.Email, "Verify Your Email - "+data.CompanyName, html, text)
}

// SendPasswordResetEmail sends password reset email
func (s *EmailService) SendPasswordResetEmail(data EmailData) error {
	html, err := renderTemplate(passwordResetEmailTemplate, data)
	if err != nil {
		return err
	}

	text := fmt.Sprintf("Hello %s,\n\nReset your password by visiting: %s?token=%s\n\nThis link expires in 1 hour.",
		data.Name, data.ResetURL, data.Token)

	return s.SendEmail(data.Email, "Password Reset Request - "+data.CompanyName, html, text)
}

// SendWelcomeEmail sends welcome email after verification
func (s *EmailService) SendWelcomeEmail(data EmailData) error {
	html, err := renderTemplate(welcomeEmailTemplate, data)
	if err != nil {
		return err
	}

	text := fmt.Sprintf("Hello %s,\n\nWelcome to %s! Your email has been verified successfully.",
		data.Name, data.CompanyName)

	return s.SendEmail(data.Email, "Welcome to "+data.CompanyName, html, text)
}

// SendPasswordChangedEmail sends password changed confirmation
func (s *EmailService) SendPasswordChangedEmail(data EmailData) error {
	html, err := renderTemplate(passwordChangedEmailTemplate, data)
	if err != nil {
		return err
	}

	text := fmt.Sprintf("Hello %s,\n\nYour password was changed at %s.\n\nIf this wasn't you, contact support at %s",
		data.Name, data.LoginTime, data.SupportEmail)

	return s.SendEmail(data.Email, "Password Changed - "+data.CompanyName, html, text)
}

// SendAccountLockedEmail sends account locked notification
func (s *EmailService) SendAccountLockedEmail(data EmailData) error {
	html, err := renderTemplate(accountLockedEmailTemplate, data)
	if err != nil {
		return err
	}

	text := fmt.Sprintf("Hello %s,\n\nYour account has been locked due to multiple failed login attempts from IP: %s at %s.\n\nIt will be unlocked in 15 minutes.",
		data.Name, data.LoginIP, data.LoginTime)

	return s.SendEmail(data.Email, "Account Locked - "+data.CompanyName, html, text)
}

// SendAdminLoginAlert sends admin login alert
func (s *EmailService) SendAdminLoginAlert(data EmailData) error {
	html, err := renderTemplate(adminLoginAlertTemplate, data)
	if err != nil {
		return err
	}

	text := fmt.Sprintf("Admin login detected: %s from IP %s at %s",
		data.Email, data.LoginIP, data.LoginTime)

	return s.SendEmail(data.Email, "Admin Login Alert - "+data.CompanyName, html, text)
}
