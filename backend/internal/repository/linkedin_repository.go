package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// LinkedInTokenRepository handles LinkedIn OAuth token persistence
type LinkedInTokenRepository struct {
	db *gorm.DB
}

func NewLinkedInTokenRepository(db *gorm.DB) *LinkedInTokenRepository {
	return &LinkedInTokenRepository{db: db}
}

func (r *LinkedInTokenRepository) Create(token *domain.LinkedInToken) error {
	return r.db.Create(token).Error
}

func (r *LinkedInTokenRepository) GetActiveToken() (*domain.LinkedInToken, error) {
	var token domain.LinkedInToken
	err := r.db.Where("is_active = ?", true).Order("created_at DESC").First(&token).Error
	if err != nil {
		return nil, err
	}
	return &token, nil
}

func (r *LinkedInTokenRepository) Update(token *domain.LinkedInToken) error {
	return r.db.Save(token).Error
}

func (r *LinkedInTokenRepository) DeactivateAll() error {
	return r.db.Model(&domain.LinkedInToken{}).Where("is_active = ?", true).Update("is_active", false).Error
}

// LinkedInPostRepository handles LinkedIn post persistence
type LinkedInPostRepository struct {
	db *gorm.DB
}

func NewLinkedInPostRepository(db *gorm.DB) *LinkedInPostRepository {
	return &LinkedInPostRepository{db: db}
}

func (r *LinkedInPostRepository) Create(post *domain.LinkedInPost) error {
	return r.db.Create(post).Error
}

func (r *LinkedInPostRepository) Update(post *domain.LinkedInPost) error {
	return r.db.Save(post).Error
}

func (r *LinkedInPostRepository) GetByID(id uuid.UUID) (*domain.LinkedInPost, error) {
	var post domain.LinkedInPost
	err := r.db.First(&post, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *LinkedInPostRepository) IsJobPosted(jobID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.LinkedInPost{}).
		Where("job_id = ? AND status = ?", jobID, domain.LinkedInPostStatusPosted).
		Count(&count).Error
	return count > 0, err
}

func (r *LinkedInPostRepository) IsBlogPosted(blogID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.LinkedInPost{}).
		Where("blog_id = ? AND status = ?", blogID, domain.LinkedInPostStatusPosted).
		Count(&count).Error
	return count > 0, err
}

func (r *LinkedInPostRepository) List(filters map[string]interface{}, limit, offset int) ([]domain.LinkedInPost, int64, error) {
	var posts []domain.LinkedInPost
	var total int64

	query := r.db.Model(&domain.LinkedInPost{})

	if contentType, ok := filters["content_type"]; ok {
		query = query.Where("content_type = ?", contentType)
	}
	if status, ok := filters["status"]; ok {
		query = query.Where("status = ?", status)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&posts).Error
	return posts, total, err
}
