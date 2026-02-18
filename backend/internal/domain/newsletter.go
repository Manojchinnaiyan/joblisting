package domain

import (
	"time"

	"github.com/google/uuid"
)

type NewsletterSubscription struct {
	ID             uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email          string     `gorm:"uniqueIndex;not null" json:"email"`
	Token          string     `gorm:"uniqueIndex;not null" json:"-"`
	SubscribedAt   time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"subscribed_at"`
	UnsubscribedAt *time.Time `json:"unsubscribed_at,omitempty"`
	CreatedAt      time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt      time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

func (NewsletterSubscription) TableName() string {
	return "newsletter_subscriptions"
}
