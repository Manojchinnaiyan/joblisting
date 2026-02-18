package repository

import (
	"job-platform/internal/domain"

	"gorm.io/gorm"
)

type NewsletterRepository struct {
	db *gorm.DB
}

func NewNewsletterRepository(db *gorm.DB) *NewsletterRepository {
	return &NewsletterRepository{db: db}
}

func (r *NewsletterRepository) Create(sub *domain.NewsletterSubscription) error {
	return r.db.Create(sub).Error
}

func (r *NewsletterRepository) GetByEmail(email string) (*domain.NewsletterSubscription, error) {
	var sub domain.NewsletterSubscription
	err := r.db.Where("email = ?", email).First(&sub).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (r *NewsletterRepository) GetByToken(token string) (*domain.NewsletterSubscription, error) {
	var sub domain.NewsletterSubscription
	err := r.db.Where("token = ?", token).First(&sub).Error
	if err != nil {
		return nil, err
	}
	return &sub, nil
}

func (r *NewsletterRepository) ExistsByEmail(email string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.NewsletterSubscription{}).
		Where("email = ? AND unsubscribed_at IS NULL", email).
		Count(&count).Error
	return count > 0, err
}

func (r *NewsletterRepository) Update(sub *domain.NewsletterSubscription) error {
	return r.db.Save(sub).Error
}

func (r *NewsletterRepository) GetAllActive(limit, offset int) ([]*domain.NewsletterSubscription, int64, error) {
	var subs []*domain.NewsletterSubscription
	var total int64

	query := r.db.Model(&domain.NewsletterSubscription{}).Where("unsubscribed_at IS NULL")

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&subs).Error

	return subs, total, err
}

func (r *NewsletterRepository) CountActive() (int64, error) {
	var count int64
	err := r.db.Model(&domain.NewsletterSubscription{}).
		Where("unsubscribed_at IS NULL").
		Count(&count).Error
	return count, err
}
