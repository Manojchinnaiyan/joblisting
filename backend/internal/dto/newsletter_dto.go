package dto

import (
	"job-platform/internal/domain"
	"time"
)

// ============================================================
// REQUEST DTOs
// ============================================================

type SubscribeNewsletterRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// ============================================================
// RESPONSE DTOs
// ============================================================

type NewsletterSubscriptionResponse struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	SubscribedAt time.Time `json:"subscribed_at"`
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

func ToNewsletterSubscriptionResponse(sub *domain.NewsletterSubscription) NewsletterSubscriptionResponse {
	return NewsletterSubscriptionResponse{
		ID:           sub.ID.String(),
		Email:        sub.Email,
		SubscribedAt: sub.SubscribedAt,
	}
}
