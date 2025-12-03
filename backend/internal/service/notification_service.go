package service

import (
	"context"
	"encoding/json"
	"fmt"
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"time"

	"github.com/google/uuid"
)

// NotificationService handles notification business logic
type NotificationService struct {
	notificationRepo *repository.NotificationRepository
	preferencesRepo  *repository.NotificationPreferencesRepository
}

// NewNotificationService creates a new notification service
func NewNotificationService(
	notificationRepo *repository.NotificationRepository,
	preferencesRepo *repository.NotificationPreferencesRepository,
) *NotificationService {
	return &NotificationService{
		notificationRepo: notificationRepo,
		preferencesRepo:  preferencesRepo,
	}
}

// CreateNotificationInput represents input for creating a notification
type CreateNotificationInput struct {
	UserID  uuid.UUID
	Type    domain.NotificationType
	Title   string
	Message string
	Link    *string
	Data    map[string]interface{}
}

// CreateNotification creates a notification for a user based on their preferences
func (s *NotificationService) CreateNotification(ctx context.Context, input CreateNotificationInput) (*domain.Notification, error) {
	// Get user preferences
	prefs, err := s.preferencesRepo.GetOrCreate(input.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get preferences: %w", err)
	}

	// Check if user wants in-app notifications for this type
	if !s.shouldSendInApp(prefs, input.Type) {
		return nil, nil // User opted out of this notification type
	}

	// Convert data to JSON
	var dataJSON []byte
	if input.Data != nil {
		dataJSON, err = json.Marshal(input.Data)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal data: %w", err)
		}
	}

	notification := &domain.Notification{
		ID:        uuid.New(),
		UserID:    input.UserID,
		Type:      input.Type,
		Title:     input.Title,
		Message:   input.Message,
		Link:      input.Link,
		Data:      dataJSON,
		IsRead:    false,
		CreatedAt: time.Now(),
	}

	if err := s.notificationRepo.Create(notification); err != nil {
		return nil, fmt.Errorf("failed to create notification: %w", err)
	}

	return notification, nil
}

// shouldSendInApp checks if in-app notifications are enabled for a notification type
func (s *NotificationService) shouldSendInApp(prefs *domain.NotificationPreferences, notifType domain.NotificationType) bool {
	switch notifType {
	case domain.NotificationApplicationStatus:
		return prefs.AppApplicationStatus
	case domain.NotificationNewApplication:
		return prefs.AppNewApplication
	case domain.NotificationNewJobFromCompany:
		return prefs.AppNewJob
	case domain.NotificationJobExpiring:
		return prefs.AppJobExpiring
	case domain.NotificationProfileViewed:
		return prefs.AppProfileViewed
	case domain.NotificationCompanyReview:
		return prefs.AppCompanyReview
	case domain.NotificationTeamInvitation:
		return prefs.AppTeamInvitation
	case domain.NotificationJobApproved, domain.NotificationJobRejected:
		return prefs.AppJobModeration
	case domain.NotificationCompanyVerified, domain.NotificationCompanyRejected:
		return prefs.AppCompanyVerification
	default:
		return true
	}
}

// ShouldSendEmail checks if email notifications are enabled for a notification type
func (s *NotificationService) ShouldSendEmail(prefs *domain.NotificationPreferences, notifType domain.NotificationType) bool {
	switch notifType {
	case domain.NotificationApplicationStatus:
		return prefs.EmailApplicationStatus
	case domain.NotificationNewApplication:
		return prefs.EmailNewApplication
	case domain.NotificationNewJobFromCompany:
		return prefs.EmailNewJob
	case domain.NotificationJobExpiring:
		return prefs.EmailJobExpiring
	case domain.NotificationProfileViewed:
		return prefs.EmailProfileViewed
	case domain.NotificationCompanyReview:
		return prefs.EmailCompanyReview
	case domain.NotificationTeamInvitation:
		return prefs.EmailTeamInvitation
	case domain.NotificationJobApproved, domain.NotificationJobRejected:
		return prefs.EmailJobModeration
	case domain.NotificationCompanyVerified, domain.NotificationCompanyRejected:
		return prefs.EmailCompanyVerification
	default:
		return true
	}
}

// GetNotifications retrieves notifications for a user
func (s *NotificationService) GetNotifications(ctx context.Context, userID uuid.UUID, page, perPage int) ([]*domain.Notification, int64, error) {
	offset := (page - 1) * perPage
	return s.notificationRepo.GetByUserID(userID, perPage, offset)
}

// GetUnreadNotifications retrieves unread notifications for a user
func (s *NotificationService) GetUnreadNotifications(ctx context.Context, userID uuid.UUID, page, perPage int) ([]*domain.Notification, int64, error) {
	offset := (page - 1) * perPage
	return s.notificationRepo.GetUnreadByUserID(userID, perPage, offset)
}

// GetUnreadCount returns the count of unread notifications
func (s *NotificationService) GetUnreadCount(ctx context.Context, userID uuid.UUID) (int64, error) {
	return s.notificationRepo.GetUnreadCount(userID)
}

// MarkAsRead marks a notification as read
func (s *NotificationService) MarkAsRead(ctx context.Context, id, userID uuid.UUID) error {
	return s.notificationRepo.MarkAsRead(id, userID)
}

// MarkAllAsRead marks all notifications as read for a user
func (s *NotificationService) MarkAllAsRead(ctx context.Context, userID uuid.UUID) error {
	return s.notificationRepo.MarkAllAsRead(userID)
}

// Delete deletes a notification
func (s *NotificationService) Delete(ctx context.Context, id, userID uuid.UUID) error {
	return s.notificationRepo.Delete(id, userID)
}

// ClearRead deletes all read notifications for a user
func (s *NotificationService) ClearRead(ctx context.Context, userID uuid.UUID) error {
	return s.notificationRepo.DeleteAllRead(userID)
}

// GetPreferences retrieves notification preferences for a user
func (s *NotificationService) GetPreferences(ctx context.Context, userID uuid.UUID) (*domain.NotificationPreferences, error) {
	return s.preferencesRepo.GetOrCreate(userID)
}

// UpdatePreferences updates notification preferences for a user
func (s *NotificationService) UpdatePreferences(ctx context.Context, prefs *domain.NotificationPreferences) error {
	return s.preferencesRepo.Upsert(prefs)
}

// NotifyApplicationStatusChange sends notification when application status changes
func (s *NotificationService) NotifyApplicationStatusChange(
	ctx context.Context,
	applicantID uuid.UUID,
	jobID uuid.UUID,
	applicationID uuid.UUID,
	jobTitle string,
	newStatus string,
) error {
	link := fmt.Sprintf("/dashboard/applications/%s", applicationID)

	_, err := s.CreateNotification(ctx, CreateNotificationInput{
		UserID:  applicantID,
		Type:    domain.NotificationApplicationStatus,
		Title:   "Application Status Updated",
		Message: fmt.Sprintf("Your application for %s has been updated to %s", jobTitle, newStatus),
		Link:    &link,
		Data: map[string]interface{}{
			"job_id":         jobID.String(),
			"application_id": applicationID.String(),
			"status":         newStatus,
		},
	})

	return err
}

// NotifyNewApplication sends notification when a new application is received
func (s *NotificationService) NotifyNewApplication(
	ctx context.Context,
	employerID uuid.UUID,
	jobID uuid.UUID,
	applicationID uuid.UUID,
	jobTitle string,
	applicantName string,
) error {
	link := fmt.Sprintf("/employer/applications/%s", applicationID)

	_, err := s.CreateNotification(ctx, CreateNotificationInput{
		UserID:  employerID,
		Type:    domain.NotificationNewApplication,
		Title:   "New Application Received",
		Message: fmt.Sprintf("%s applied to %s", applicantName, jobTitle),
		Link:    &link,
		Data: map[string]interface{}{
			"job_id":         jobID.String(),
			"application_id": applicationID.String(),
		},
	})

	return err
}

// NotifyNewJobFromFollowedCompany sends notification when a followed company posts a new job
func (s *NotificationService) NotifyNewJobFromFollowedCompany(
	ctx context.Context,
	userID uuid.UUID,
	jobID uuid.UUID,
	companyID uuid.UUID,
	jobTitle string,
	jobSlug string,
	companyName string,
) error {
	link := fmt.Sprintf("/jobs/%s", jobSlug)

	_, err := s.CreateNotification(ctx, CreateNotificationInput{
		UserID:  userID,
		Type:    domain.NotificationNewJobFromCompany,
		Title:   "New Job Posted",
		Message: fmt.Sprintf("%s posted a new job: %s", companyName, jobTitle),
		Link:    &link,
		Data: map[string]interface{}{
			"job_id":     jobID.String(),
			"company_id": companyID.String(),
		},
	})

	return err
}

// NotifyJobExpiringSoon sends notification when a job is about to expire
func (s *NotificationService) NotifyJobExpiringSoon(
	ctx context.Context,
	employerID uuid.UUID,
	jobID uuid.UUID,
	jobTitle string,
	daysUntilExpiry int,
) error {
	link := fmt.Sprintf("/employer/jobs/%s", jobID)

	_, err := s.CreateNotification(ctx, CreateNotificationInput{
		UserID:  employerID,
		Type:    domain.NotificationJobExpiring,
		Title:   "Job Expiring Soon",
		Message: fmt.Sprintf("Your job posting '%s' will expire in %d days", jobTitle, daysUntilExpiry),
		Link:    &link,
		Data: map[string]interface{}{
			"job_id":           jobID.String(),
			"days_until_expiry": daysUntilExpiry,
		},
	})

	return err
}

// NotifyProfileViewed sends notification when a profile is viewed
func (s *NotificationService) NotifyProfileViewed(
	ctx context.Context,
	profileOwnerID uuid.UUID,
	viewerName string,
	viewerCompany string,
) error {
	link := "/dashboard/profile-views"

	message := fmt.Sprintf("%s viewed your profile", viewerName)
	if viewerCompany != "" {
		message = fmt.Sprintf("%s from %s viewed your profile", viewerName, viewerCompany)
	}

	_, err := s.CreateNotification(ctx, CreateNotificationInput{
		UserID:  profileOwnerID,
		Type:    domain.NotificationProfileViewed,
		Title:   "Profile Viewed",
		Message: message,
		Link:    &link,
		Data: map[string]interface{}{
			"viewer_name":    viewerName,
			"viewer_company": viewerCompany,
		},
	})

	return err
}

// NotifyCompanyReviewPosted sends notification when a review is posted on a company
func (s *NotificationService) NotifyCompanyReviewPosted(
	ctx context.Context,
	companyOwnerID uuid.UUID,
	companyID uuid.UUID,
	companySlug string,
	reviewerName string,
	rating int,
) error {
	link := fmt.Sprintf("/employer/company/reviews")

	_, err := s.CreateNotification(ctx, CreateNotificationInput{
		UserID:  companyOwnerID,
		Type:    domain.NotificationCompanyReview,
		Title:   "New Company Review",
		Message: fmt.Sprintf("%s left a %d-star review on your company", reviewerName, rating),
		Link:    &link,
		Data: map[string]interface{}{
			"company_id":   companyID.String(),
			"rating":       rating,
			"reviewer_name": reviewerName,
		},
	})

	return err
}

// NotifyTeamInvitation sends notification when a user is invited to join a company team
func (s *NotificationService) NotifyTeamInvitation(
	ctx context.Context,
	inviteeID uuid.UUID,
	companyID uuid.UUID,
	companyName string,
	inviterName string,
	role string,
) error {
	link := "/invitations/me"

	_, err := s.CreateNotification(ctx, CreateNotificationInput{
		UserID:  inviteeID,
		Type:    domain.NotificationTeamInvitation,
		Title:   "Team Invitation",
		Message: fmt.Sprintf("%s invited you to join %s as %s", inviterName, companyName, role),
		Link:    &link,
		Data: map[string]interface{}{
			"company_id":   companyID.String(),
			"company_name": companyName,
			"role":         role,
		},
	})

	return err
}

// NotifyJobApproved sends notification when a job is approved by admin
func (s *NotificationService) NotifyJobApproved(
	ctx context.Context,
	employerID uuid.UUID,
	jobID uuid.UUID,
	jobTitle string,
	jobSlug string,
) error {
	link := fmt.Sprintf("/jobs/%s", jobSlug)

	_, err := s.CreateNotification(ctx, CreateNotificationInput{
		UserID:  employerID,
		Type:    domain.NotificationJobApproved,
		Title:   "Job Approved",
		Message: fmt.Sprintf("Your job posting '%s' has been approved and is now live", jobTitle),
		Link:    &link,
		Data: map[string]interface{}{
			"job_id": jobID.String(),
		},
	})

	return err
}

// NotifyJobRejected sends notification when a job is rejected by admin
func (s *NotificationService) NotifyJobRejected(
	ctx context.Context,
	employerID uuid.UUID,
	jobID uuid.UUID,
	jobTitle string,
	reason string,
) error {
	link := fmt.Sprintf("/employer/jobs/%s", jobID)

	_, err := s.CreateNotification(ctx, CreateNotificationInput{
		UserID:  employerID,
		Type:    domain.NotificationJobRejected,
		Title:   "Job Rejected",
		Message: fmt.Sprintf("Your job posting '%s' was not approved: %s", jobTitle, reason),
		Link:    &link,
		Data: map[string]interface{}{
			"job_id": jobID.String(),
			"reason": reason,
		},
	})

	return err
}

// NotifyCompanyVerified sends notification when a company is verified
func (s *NotificationService) NotifyCompanyVerified(
	ctx context.Context,
	ownerID uuid.UUID,
	companyID uuid.UUID,
	companyName string,
) error {
	link := "/employer/company"

	_, err := s.CreateNotification(ctx, CreateNotificationInput{
		UserID:  ownerID,
		Type:    domain.NotificationCompanyVerified,
		Title:   "Company Verified",
		Message: fmt.Sprintf("Your company '%s' has been verified!", companyName),
		Link:    &link,
		Data: map[string]interface{}{
			"company_id": companyID.String(),
		},
	})

	return err
}

// NotifyCompanyRejected sends notification when a company verification is rejected
func (s *NotificationService) NotifyCompanyRejected(
	ctx context.Context,
	ownerID uuid.UUID,
	companyID uuid.UUID,
	companyName string,
	reason string,
) error {
	link := "/employer/company"

	_, err := s.CreateNotification(ctx, CreateNotificationInput{
		UserID:  ownerID,
		Type:    domain.NotificationCompanyRejected,
		Title:   "Company Verification Rejected",
		Message: fmt.Sprintf("Your company '%s' verification was rejected: %s", companyName, reason),
		Link:    &link,
		Data: map[string]interface{}{
			"company_id": companyID.String(),
			"reason":     reason,
		},
	})

	return err
}
