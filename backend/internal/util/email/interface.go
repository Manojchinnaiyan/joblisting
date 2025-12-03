package email

// EmailSender is an interface for sending emails
// Both SMTP and Resend implementations satisfy this interface
type EmailSender interface {
	SendVerificationEmail(data EmailData) error
	SendPasswordResetEmail(data EmailData) error
	SendWelcomeEmail(data EmailData) error
	SendPasswordChangedEmail(data EmailData) error
	SendAccountLockedEmail(data EmailData) error
	SendAdminLoginAlert(data EmailData) error
}
