package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

// NotificationType represents the type of notification
type NotificationType string

const (
	NotificationApplicationStatus    NotificationType = "APPLICATION_STATUS_CHANGE"
	NotificationNewApplication       NotificationType = "NEW_APPLICATION"
	NotificationNewJobFromCompany    NotificationType = "NEW_JOB_FROM_FOLLOWED_COMPANY"
	NotificationJobExpiring          NotificationType = "JOB_EXPIRING_SOON"
	NotificationProfileViewed        NotificationType = "PROFILE_VIEWED"
	NotificationCompanyReview        NotificationType = "COMPANY_REVIEW_POSTED"
	NotificationTeamInvitation       NotificationType = "TEAM_INVITATION"
	NotificationJobApproved          NotificationType = "JOB_APPROVED"
	NotificationJobRejected          NotificationType = "JOB_REJECTED"
	NotificationCompanyVerified      NotificationType = "COMPANY_VERIFIED"
	NotificationCompanyRejected      NotificationType = "COMPANY_REJECTED"
)

// Notification represents an in-app notification for a user
type Notification struct {
	ID        uuid.UUID        `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID        `gorm:"type:uuid;not null;index" json:"user_id"`
	Type      NotificationType `gorm:"type:notification_type;not null" json:"type"`
	Title     string           `gorm:"type:varchar(255);not null" json:"title"`
	Message   string           `gorm:"type:text;not null" json:"message"`
	Link      *string          `gorm:"type:varchar(500)" json:"link,omitempty"`
	Data      datatypes.JSON   `gorm:"type:jsonb" json:"data,omitempty"`
	IsRead    bool             `gorm:"default:false" json:"is_read"`
	ReadAt    *time.Time       `json:"read_at,omitempty"`
	CreatedAt time.Time        `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`

	// Relationships
	User User `gorm:"foreignKey:UserID" json:"-"`
}

// TableName specifies the table name for Notification
func (Notification) TableName() string {
	return "notifications"
}

// NotificationPreferences stores user notification preferences
type NotificationPreferences struct {
	UserID uuid.UUID `gorm:"type:uuid;primary_key" json:"user_id"`

	// Email notifications
	EmailApplicationStatus   bool `gorm:"default:true" json:"email_application_status"`
	EmailNewApplication      bool `gorm:"default:true" json:"email_new_application"`
	EmailNewJob              bool `gorm:"default:true" json:"email_new_job"`
	EmailJobExpiring         bool `gorm:"default:true" json:"email_job_expiring"`
	EmailProfileViewed       bool `gorm:"default:false" json:"email_profile_viewed"`
	EmailCompanyReview       bool `gorm:"default:true" json:"email_company_review"`
	EmailTeamInvitation      bool `gorm:"default:true" json:"email_team_invitation"`
	EmailJobModeration       bool `gorm:"default:true" json:"email_job_moderation"`
	EmailCompanyVerification bool `gorm:"default:true" json:"email_company_verification"`

	// In-app notifications
	AppApplicationStatus   bool `gorm:"default:true" json:"app_application_status"`
	AppNewApplication      bool `gorm:"default:true" json:"app_new_application"`
	AppNewJob              bool `gorm:"default:true" json:"app_new_job"`
	AppJobExpiring         bool `gorm:"default:true" json:"app_job_expiring"`
	AppProfileViewed       bool `gorm:"default:true" json:"app_profile_viewed"`
	AppCompanyReview       bool `gorm:"default:true" json:"app_company_review"`
	AppTeamInvitation      bool `gorm:"default:true" json:"app_team_invitation"`
	AppJobModeration       bool `gorm:"default:true" json:"app_job_moderation"`
	AppCompanyVerification bool `gorm:"default:true" json:"app_company_verification"`

	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`

	// Relationships
	User User `gorm:"foreignKey:UserID" json:"-"`
}

// TableName specifies the table name for NotificationPreferences
func (NotificationPreferences) TableName() string {
	return "notification_preferences"
}

// NewDefaultNotificationPreferences creates default notification preferences for a user
func NewDefaultNotificationPreferences(userID uuid.UUID) *NotificationPreferences {
	now := time.Now()
	return &NotificationPreferences{
		UserID: userID,

		// Email defaults
		EmailApplicationStatus:   true,
		EmailNewApplication:      true,
		EmailNewJob:              true,
		EmailJobExpiring:         true,
		EmailProfileViewed:       false,
		EmailCompanyReview:       true,
		EmailTeamInvitation:      true,
		EmailJobModeration:       true,
		EmailCompanyVerification: true,

		// In-app defaults
		AppApplicationStatus:   true,
		AppNewApplication:      true,
		AppNewJob:              true,
		AppJobExpiring:         true,
		AppProfileViewed:       true,
		AppCompanyReview:       true,
		AppTeamInvitation:      true,
		AppJobModeration:       true,
		AppCompanyVerification: true,

		CreatedAt: now,
		UpdatedAt: now,
	}
}
