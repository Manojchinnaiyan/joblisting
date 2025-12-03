package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReviewRepository handles company review data operations
type ReviewRepository struct {
	db *gorm.DB
}

// NewReviewRepository creates a new review repository
func NewReviewRepository(db *gorm.DB) *ReviewRepository {
	return &ReviewRepository{db: db}
}

// Create creates a new review
func (r *ReviewRepository) Create(review *domain.CompanyReview) error {
	return r.db.Create(review).Error
}

// GetByID retrieves a review by ID
func (r *ReviewRepository) GetByID(id uuid.UUID) (*domain.CompanyReview, error) {
	var review domain.CompanyReview
	err := r.db.Preload("User").Preload("Company").
		Where("id = ?", id).First(&review).Error
	if err != nil {
		return nil, err
	}
	return &review, nil
}

// GetCompanyReviews retrieves reviews for a company with filters
func (r *ReviewRepository) GetCompanyReviews(companyID uuid.UUID, status *domain.ReviewStatus, limit, offset int) ([]*domain.CompanyReview, int64, error) {
	var reviews []*domain.CompanyReview
	var total int64

	query := r.db.Model(&domain.CompanyReview{}).Where("company_id = ?", companyID)

	if status != nil {
		query = query.Where("status = ?", *status)
	}

	// Count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get results
	err := query.
		Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error

	return reviews, total, err
}

// GetUserReview retrieves a user's review for a company
func (r *ReviewRepository) GetUserReview(companyID, userID uuid.UUID) (*domain.CompanyReview, error) {
	var review domain.CompanyReview
	err := r.db.Where("company_id = ? AND user_id = ?", companyID, userID).
		First(&review).Error
	if err != nil {
		return nil, err
	}
	return &review, nil
}

// GetPendingReviews retrieves pending reviews for moderation
func (r *ReviewRepository) GetPendingReviews(limit, offset int) ([]*domain.CompanyReview, int64, error) {
	var reviews []*domain.CompanyReview
	var total int64

	query := r.db.Model(&domain.CompanyReview{}).
		Where("status = ?", domain.ReviewStatusPending)

	// Count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get results
	err := query.
		Preload("User").
		Preload("Company").
		Order("created_at ASC").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error

	return reviews, total, err
}

// Update updates a review
func (r *ReviewRepository) Update(review *domain.CompanyReview) error {
	return r.db.Save(review).Error
}

// UpdateStatus updates a review's status
func (r *ReviewRepository) UpdateStatus(id uuid.UUID, status domain.ReviewStatus, moderatorID *uuid.UUID, reason *string) error {
	updates := map[string]interface{}{
		"status": status,
	}

	if moderatorID != nil {
		updates["moderated_by"] = moderatorID
		updates["moderated_at"] = gorm.Expr("CURRENT_TIMESTAMP")
	}

	if reason != nil {
		updates["rejection_reason"] = *reason
	}

	return r.db.Model(&domain.CompanyReview{}).
		Where("id = ?", id).
		Updates(updates).Error
}

// AddCompanyResponse adds a company's response to a review
func (r *ReviewRepository) AddCompanyResponse(id uuid.UUID, response string, responderID uuid.UUID) error {
	return r.db.Model(&domain.CompanyReview{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"company_response":    response,
			"company_response_by": responderID,
			"company_response_at": gorm.Expr("CURRENT_TIMESTAMP"),
		}).Error
}

// RemoveCompanyResponse removes a company's response from a review
func (r *ReviewRepository) RemoveCompanyResponse(id uuid.UUID) error {
	return r.db.Model(&domain.CompanyReview{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"company_response":    nil,
			"company_response_by": nil,
			"company_response_at": nil,
		}).Error
}

// Delete deletes a review
func (r *ReviewRepository) Delete(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.CompanyReview{}).Error
}

// ExistsByCompanyAndUser checks if a user has already reviewed a company
func (r *ReviewRepository) ExistsByCompanyAndUser(companyID, userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.CompanyReview{}).
		Where("company_id = ? AND user_id = ?", companyID, userID).
		Count(&count).Error
	return count > 0, err
}

// CountByCompany counts reviews for a company
func (r *ReviewRepository) CountByCompany(companyID uuid.UUID, status *domain.ReviewStatus) (int64, error) {
	var count int64
	query := r.db.Model(&domain.CompanyReview{}).Where("company_id = ?", companyID)

	if status != nil {
		query = query.Where("status = ?", *status)
	}

	err := query.Count(&count).Error
	return count, err
}

// CalculateAverageRating calculates average rating for a company
func (r *ReviewRepository) CalculateAverageRating(companyID uuid.UUID) (float32, error) {
	var avg float32
	err := r.db.Model(&domain.CompanyReview{}).
		Where("company_id = ? AND status = ?", companyID, domain.ReviewStatusApproved).
		Select("COALESCE(AVG(overall_rating), 0)").
		Scan(&avg).Error
	return avg, err
}

// CalculateRatingBreakdown calculates rating distribution for a company
func (r *ReviewRepository) CalculateRatingBreakdown(companyID uuid.UUID) (map[int]int64, error) {
	type RatingCount struct {
		Rating int
		Count  int64
	}

	var results []RatingCount
	err := r.db.Model(&domain.CompanyReview{}).
		Select("overall_rating as rating, COUNT(*) as count").
		Where("company_id = ? AND status = ?", companyID, domain.ReviewStatusApproved).
		Group("overall_rating").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	breakdown := make(map[int]int64)
	for i := 1; i <= 5; i++ {
		breakdown[i] = 0
	}

	for _, result := range results {
		breakdown[result.Rating] = result.Count
	}

	return breakdown, nil
}

// GetRatingBreakdown is an alias for CalculateRatingBreakdown
func (r *ReviewRepository) GetRatingBreakdown(companyID uuid.UUID) (map[int]int64, error) {
	return r.CalculateRatingBreakdown(companyID)
}

// GetTopRatedCompanies retrieves companies with highest average ratings
func (r *ReviewRepository) GetTopRatedCompanies(minReviews int, limit int) ([]*domain.Company, error) {
	var companies []*domain.Company
	err := r.db.Table("companies").
		Select("companies.*, COALESCE(AVG(company_reviews.overall_rating), 0) as avg_rating").
		Joins("LEFT JOIN company_reviews ON companies.id = company_reviews.company_id AND company_reviews.status = ?", domain.ReviewStatusApproved).
		Where("companies.deleted_at IS NULL").
		Group("companies.id").
		Having("COUNT(company_reviews.id) >= ?", minReviews).
		Order("avg_rating DESC, companies.reviews_count DESC").
		Limit(limit).
		Find(&companies).Error
	return companies, err
}

// IncrementHelpfulCount increments the helpful count for a review
func (r *ReviewRepository) IncrementHelpfulCount(id uuid.UUID, delta int) error {
	return r.db.Model(&domain.CompanyReview{}).
		Where("id = ?", id).
		UpdateColumn("helpful_count", gorm.Expr("helpful_count + ?", delta)).Error
}

// GetReviewsByRating retrieves reviews by rating for a company
func (r *ReviewRepository) GetReviewsByRating(companyID uuid.UUID, rating int, limit, offset int) ([]*domain.CompanyReview, int64, error) {
	var reviews []*domain.CompanyReview
	var total int64

	query := r.db.Model(&domain.CompanyReview{}).
		Where("company_id = ? AND overall_rating = ? AND status = ?",
			companyID, rating, domain.ReviewStatusApproved)

	// Count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get results
	err := query.
		Preload("User").
		Order("helpful_count DESC, created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error

	return reviews, total, err
}

// GetMostHelpfulReviews retrieves most helpful reviews for a company
func (r *ReviewRepository) GetMostHelpfulReviews(companyID uuid.UUID, limit int) ([]*domain.CompanyReview, error) {
	var reviews []*domain.CompanyReview
	err := r.db.Where("company_id = ? AND status = ?", companyID, domain.ReviewStatusApproved).
		Order("helpful_count DESC, created_at DESC").
		Limit(limit).
		Find(&reviews).Error
	return reviews, err
}

// GetAllReviews retrieves all reviews with filters for admin
func (r *ReviewRepository) GetAllReviews(filters map[string]interface{}, limit, offset int) ([]*domain.CompanyReview, int64, error) {
	var reviews []*domain.CompanyReview
	var total int64

	query := r.db.Model(&domain.CompanyReview{})

	// Apply filters
	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}

	if search, ok := filters["search"].(string); ok && search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("title ILIKE ? OR pros ILIKE ? OR cons ILIKE ?", searchPattern, searchPattern, searchPattern)
	}

	if rating, ok := filters["rating"].(int); ok && rating > 0 {
		query = query.Where("overall_rating = ?", rating)
	}

	if companyID, ok := filters["company_id"].(uuid.UUID); ok {
		query = query.Where("company_id = ?", companyID)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get results with preloads
	err := query.
		Preload("User").
		Preload("Company").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&reviews).Error

	return reviews, total, err
}
