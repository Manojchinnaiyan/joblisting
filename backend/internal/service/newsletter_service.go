package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"job-platform/internal/domain"
	"job-platform/internal/repository"

	"github.com/google/uuid"
)

type NewsletterService struct {
	repo *repository.NewsletterRepository
}

func NewNewsletterService(repo *repository.NewsletterRepository) *NewsletterService {
	return &NewsletterService{repo: repo}
}

func (s *NewsletterService) Subscribe(ctx context.Context, email string) (*domain.NewsletterSubscription, error) {
	email = strings.ToLower(strings.TrimSpace(email))

	if email == "" {
		return nil, domain.ErrNewsletterEmailRequired
	}

	// Check if already subscribed (active)
	exists, err := s.repo.ExistsByEmail(email)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing subscription: %w", err)
	}
	if exists {
		return nil, domain.ErrNewsletterAlreadySubscribed
	}

	// Check if previously unsubscribed — re-subscribe them
	existing, err := s.repo.GetByEmail(email)
	if err == nil && existing != nil && existing.UnsubscribedAt != nil {
		existing.UnsubscribedAt = nil
		existing.SubscribedAt = time.Now()
		if err := s.repo.Update(existing); err != nil {
			return nil, fmt.Errorf("failed to re-subscribe: %w", err)
		}
		return existing, nil
	}

	// Generate unsubscribe token
	token, err := generateToken()
	if err != nil {
		return nil, fmt.Errorf("failed to generate unsubscribe token: %w", err)
	}

	sub := &domain.NewsletterSubscription{
		ID:           uuid.New(),
		Email:        email,
		Token:        token,
		SubscribedAt: time.Now(),
	}

	if err := s.repo.Create(sub); err != nil {
		return nil, fmt.Errorf("failed to create subscription: %w", err)
	}

	return sub, nil
}

func (s *NewsletterService) Unsubscribe(ctx context.Context, token string) error {
	token = strings.TrimSpace(token)
	if token == "" {
		return domain.ErrNewsletterInvalidToken
	}

	sub, err := s.repo.GetByToken(token)
	if err != nil {
		return domain.ErrNewsletterInvalidToken
	}

	if sub.UnsubscribedAt != nil {
		return nil // Already unsubscribed, idempotent
	}

	now := time.Now()
	sub.UnsubscribedAt = &now

	if err := s.repo.Update(sub); err != nil {
		return fmt.Errorf("failed to unsubscribe: %w", err)
	}

	return nil
}

func (s *NewsletterService) GetSubscribers(ctx context.Context, limit, offset int) ([]*domain.NewsletterSubscription, int64, error) {
	return s.repo.GetAllActive(limit, offset)
}

func generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
