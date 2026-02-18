package domain

import (
	"time"

	"github.com/google/uuid"
)

// LinkedIn content types
const (
	LinkedInContentTypeJob    = "job"
	LinkedInContentTypeBlog   = "blog"
	LinkedInContentTypeCustom = "custom"
)

// LinkedIn trigger types
const (
	LinkedInTriggerAuto   = "auto"
	LinkedInTriggerManual = "manual"
)

// LinkedIn post statuses
const (
	LinkedInPostStatusPending = "pending"
	LinkedInPostStatusPosted  = "posted"
	LinkedInPostStatusFailed  = "failed"
)

// LinkedInToken represents stored OAuth credentials for LinkedIn
type LinkedInToken struct {
	ID                    uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	OrganizationID        string     `gorm:"size:100;not null" json:"organization_id"`
	OrganizationVanity    string     `gorm:"size:100;not null" json:"organization_vanity"`
	OrganizationName      string     `gorm:"size:255" json:"organization_name"`
	AccessToken           string     `gorm:"type:text;not null" json:"-"`
	RefreshToken          *string    `gorm:"type:text" json:"-"`
	TokenType             string     `gorm:"size:50;default:'Bearer'" json:"token_type"`
	Scopes                string     `gorm:"size:500" json:"scopes"`
	ExpiresAt             time.Time  `gorm:"not null" json:"expires_at"`
	RefreshTokenExpiresAt *time.Time `json:"refresh_token_expires_at,omitempty"`
	IsActive              bool       `gorm:"default:true" json:"is_active"`
	ConnectedBy           *uuid.UUID `gorm:"type:uuid" json:"connected_by,omitempty"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
}

func (LinkedInToken) TableName() string {
	return "linkedin_tokens"
}

// IsExpired returns true if the access token has expired
func (t *LinkedInToken) IsExpired() bool {
	return time.Now().After(t.ExpiresAt)
}

// ExpiresWithinDays returns true if the token expires within the given days
func (t *LinkedInToken) ExpiresWithinDays(days int) bool {
	return time.Now().Add(time.Duration(days) * 24 * time.Hour).After(t.ExpiresAt)
}

// LinkedInPost represents a post made to LinkedIn
type LinkedInPost struct {
	ID              uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ContentType     string     `gorm:"size:20;not null" json:"content_type"`
	JobID           *uuid.UUID `gorm:"type:uuid" json:"job_id,omitempty"`
	BlogID          *uuid.UUID `gorm:"type:uuid" json:"blog_id,omitempty"`
	LinkedInPostID  string     `gorm:"column:linkedin_post_id;size:255" json:"linkedin_post_id,omitempty"`
	LinkedInPostURL string     `gorm:"column:linkedin_post_url;size:500" json:"linkedin_post_url,omitempty"`
	OrganizationID  string     `gorm:"size:100;not null" json:"organization_id"`
	PostText        string     `gorm:"type:text;not null" json:"post_text"`
	PostLink        string     `gorm:"size:500" json:"post_link,omitempty"`
	TriggerType     string     `gorm:"size:20;not null" json:"trigger_type"`
	Status          string     `gorm:"size:20;not null;default:'pending'" json:"status"`
	ErrorMessage    string     `gorm:"type:text" json:"error_message,omitempty"`
	PostedBy        *uuid.UUID `gorm:"type:uuid" json:"posted_by,omitempty"`
	PostedAt        *time.Time `json:"posted_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`

	// Relationships (for preloading)
	Job  *Job  `gorm:"foreignKey:JobID" json:"job,omitempty"`
	Blog *Blog `gorm:"foreignKey:BlogID" json:"blog,omitempty"`
}

func (LinkedInPost) TableName() string {
	return "linkedin_posts"
}

// LinkedIn request/response DTOs

type LinkedInCustomPostRequest struct {
	Text string `json:"text" binding:"required,min=1,max=3000"`
	Link string `json:"link" binding:"omitempty,url"`
}

type LinkedInConnectionStatusResponse struct {
	Connected        bool       `json:"connected"`
	OrganizationID   string     `json:"organization_id,omitempty"`
	OrganizationName string     `json:"organization_name,omitempty"`
	ExpiresAt        *time.Time `json:"expires_at,omitempty"`
	ConnectedAt      *time.Time `json:"connected_at,omitempty"`
}

type LinkedInAutoPostSettings struct {
	AutoPostJobs  bool `json:"auto_post_jobs"`
	AutoPostBlogs bool `json:"auto_post_blogs"`
}

type LinkedInCallbackRequest struct {
	Code  string `json:"code" binding:"required"`
	State string `json:"state"`
}
