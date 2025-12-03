package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ReviewService handles company review business logic
type ReviewService struct {
	reviewRepo   *repository.ReviewRepository
	companyRepo  *repository.CompanyRepository
	teamRepo     *repository.TeamRepository
}

// NewReviewService creates a new review service
func NewReviewService(
	reviewRepo *repository.ReviewRepository,
	companyRepo *repository.CompanyRepository,
	teamRepo *repository.TeamRepository,
) *ReviewService {
	return &ReviewService{
		reviewRepo:   reviewRepo,
		companyRepo:  companyRepo,
		teamRepo:     teamRepo,
	}
}

// CreateReview creates a new company review
func (s *ReviewService) CreateReview(companyID, userID uuid.UUID, req *domain.CompanyReview) (*domain.CompanyReview, error) {
	// Check if company exists
	_, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return nil, domain.ErrCompanyNotFound
	}

	// Check if user is team member of the company
	isTeamMember, err := s.teamRepo.ExistsByCompanyAndUser(companyID, userID)
	if err != nil {
		return nil, err
	}
	if isTeamMember {
		return nil, domain.ErrCannotReviewOwnCompany
	}

	// Check if user already reviewed this company
	exists, err := s.reviewRepo.ExistsByCompanyAndUser(companyID, userID)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.ErrAlreadyReviewed
	}

	now := time.Now()
	review := &domain.CompanyReview{
		ID:                  uuid.New(),
		CompanyID:           companyID,
		UserID:              userID,
		OverallRating:       req.OverallRating,
		CultureRating:       req.CultureRating,
		WorkLifeRating:      req.WorkLifeRating,
		CompensationRating:  req.CompensationRating,
		ManagementRating:    req.ManagementRating,
		Title:               req.Title,
		Pros:                req.Pros,
		Cons:                req.Cons,
		AdviceToManagement:  req.AdviceToManagement,
		JobTitle:            req.JobTitle,
		EmploymentStatus:    req.EmploymentStatus,
		YearsAtCompany:      req.YearsAtCompany,
		IsAnonymous:         req.IsAnonymous,
		IsCurrentEmployee:   req.IsCurrentEmployee,
		Status:              domain.ReviewStatusPending,
		HelpfulCount:        0,
		CreatedAt:           now,
		UpdatedAt:           now,
	}

	if err := s.reviewRepo.Create(review); err != nil {
		return nil, err
	}

	return review, nil
}

// GetReviewByID retrieves a review by ID
func (s *ReviewService) GetReviewByID(id uuid.UUID) (*domain.CompanyReview, error) {
	review, err := s.reviewRepo.GetByID(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrReviewNotFound
		}
		return nil, err
	}
	return review, nil
}

// GetCompanyReviews retrieves reviews for a company
func (s *ReviewService) GetCompanyReviews(companyID uuid.UUID, status *domain.ReviewStatus, limit, offset int) ([]*domain.CompanyReview, int64, error) {
	return s.reviewRepo.GetCompanyReviews(companyID, status, limit, offset)
}

// GetApprovedCompanyReviews retrieves approved reviews for a company
func (s *ReviewService) GetApprovedCompanyReviews(companyID uuid.UUID, limit, offset int) ([]*domain.CompanyReview, int64, error) {
	approvedStatus := domain.ReviewStatusApproved
	return s.reviewRepo.GetCompanyReviews(companyID, &approvedStatus, limit, offset)
}

// GetUserReview retrieves a user's review for a company
func (s *ReviewService) GetUserReview(companyID, userID uuid.UUID) (*domain.CompanyReview, error) {
	review, err := s.reviewRepo.GetUserReview(companyID, userID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrReviewNotFound
		}
		return nil, err
	}
	return review, nil
}

// GetPendingReviews retrieves pending reviews for moderation
func (s *ReviewService) GetPendingReviews(limit, offset int) ([]*domain.CompanyReview, int64, error) {
	return s.reviewRepo.GetPendingReviews(limit, offset)
}

// UpdateReview updates a review
func (s *ReviewService) UpdateReview(id uuid.UUID, req *domain.CompanyReview) (*domain.CompanyReview, error) {
	review, err := s.reviewRepo.GetByID(id)
	if err != nil {
		return nil, domain.ErrReviewNotFound
	}

	// Can only update if pending
	if review.Status != domain.ReviewStatusPending {
		return nil, domain.ErrReviewNotPending
	}

	review.OverallRating = req.OverallRating
	review.CultureRating = req.CultureRating
	review.WorkLifeRating = req.WorkLifeRating
	review.CompensationRating = req.CompensationRating
	review.ManagementRating = req.ManagementRating
	review.Title = req.Title
	review.Pros = req.Pros
	review.Cons = req.Cons
	review.AdviceToManagement = req.AdviceToManagement
	review.JobTitle = req.JobTitle
	review.EmploymentStatus = req.EmploymentStatus
	review.YearsAtCompany = req.YearsAtCompany
	review.IsAnonymous = req.IsAnonymous
	review.IsCurrentEmployee = req.IsCurrentEmployee
	review.UpdatedAt = time.Now()

	if err := s.reviewRepo.Update(review); err != nil {
		return nil, err
	}

	return review, nil
}

// DeleteReview deletes a review
func (s *ReviewService) DeleteReview(id uuid.UUID) error {
	_, err := s.reviewRepo.GetByID(id)
	if err != nil {
		return domain.ErrReviewNotFound
	}

	return s.reviewRepo.Delete(id)
}

// ApproveReview approves a review (admin only)
func (s *ReviewService) ApproveReview(id, moderatorID uuid.UUID) error {
	review, err := s.reviewRepo.GetByID(id)
	if err != nil {
		return domain.ErrReviewNotFound
	}

	if review.Status != domain.ReviewStatusPending {
		return domain.ErrReviewNotPending
	}

	if err := s.reviewRepo.UpdateStatus(id, domain.ReviewStatusApproved, &moderatorID, nil); err != nil {
		return err
	}

	// Update company stats
	avgRating, err := s.reviewRepo.CalculateAverageRating(review.CompanyID)
	if err != nil {
		return err
	}

	if err := s.companyRepo.UpdateAverageRating(review.CompanyID, avgRating); err != nil {
		return err
	}

	if err := s.companyRepo.IncrementReviews(review.CompanyID, 1); err != nil {
		return err
	}

	return nil
}

// RejectReview rejects a review (admin only)
func (s *ReviewService) RejectReview(id, moderatorID uuid.UUID, reason string) error {
	review, err := s.reviewRepo.GetByID(id)
	if err != nil {
		return domain.ErrReviewNotFound
	}

	if review.Status != domain.ReviewStatusPending {
		return domain.ErrReviewNotPending
	}

	return s.reviewRepo.UpdateStatus(id, domain.ReviewStatusRejected, &moderatorID, &reason)
}

// AddCompanyResponse adds a company's response to a review
func (s *ReviewService) AddCompanyResponse(reviewID, responderID uuid.UUID, response string) error {
	review, err := s.reviewRepo.GetByID(reviewID)
	if err != nil {
		return domain.ErrReviewNotFound
	}

	// Check if review is approved
	if !review.IsApproved() {
		return domain.ErrReviewNotApproved
	}

	// Check if responder is a team member
	isTeamMember, err := s.teamRepo.ExistsByCompanyAndUser(review.CompanyID, responderID)
	if err != nil {
		return err
	}
	if !isTeamMember {
		return domain.ErrInsufficientPermissions
	}

	return s.reviewRepo.AddCompanyResponse(reviewID, response, responderID)
}

// RemoveCompanyResponse removes a company's response from a review
func (s *ReviewService) RemoveCompanyResponse(reviewID uuid.UUID) error {
	_, err := s.reviewRepo.GetByID(reviewID)
	if err != nil {
		return domain.ErrReviewNotFound
	}

	return s.reviewRepo.RemoveCompanyResponse(reviewID)
}

// MarkAsHelpful marks a review as helpful
func (s *ReviewService) MarkAsHelpful(reviewID uuid.UUID) error {
	_, err := s.reviewRepo.GetByID(reviewID)
	if err != nil {
		return domain.ErrReviewNotFound
	}

	return s.reviewRepo.IncrementHelpfulCount(reviewID, 1)
}

// UnmarkAsHelpful unmarks a review as helpful
func (s *ReviewService) UnmarkAsHelpful(reviewID uuid.UUID) error {
	_, err := s.reviewRepo.GetByID(reviewID)
	if err != nil {
		return domain.ErrReviewNotFound
	}

	return s.reviewRepo.IncrementHelpfulCount(reviewID, -1)
}

// GetReviewsByRating retrieves reviews by rating for a company
func (s *ReviewService) GetReviewsByRating(companyID uuid.UUID, rating int, limit, offset int) ([]*domain.CompanyReview, int64, error) {
	return s.reviewRepo.GetReviewsByRating(companyID, rating, limit, offset)
}

// GetMostHelpfulReviews retrieves most helpful reviews for a company
func (s *ReviewService) GetMostHelpfulReviews(companyID uuid.UUID, limit int) ([]*domain.CompanyReview, error) {
	return s.reviewRepo.GetMostHelpfulReviews(companyID, limit)
}

// GetAverageRating calculates average rating for a company
func (s *ReviewService) GetAverageRating(companyID uuid.UUID) (float32, error) {
	return s.reviewRepo.CalculateAverageRating(companyID)
}

// GetRatingBreakdown calculates rating distribution for a company
func (s *ReviewService) GetRatingBreakdown(companyID uuid.UUID) (map[int]int64, error) {
	return s.reviewRepo.CalculateRatingBreakdown(companyID)
}

// GetTopRatedCompanies retrieves companies with highest average ratings
func (s *ReviewService) GetTopRatedCompanies(minReviews int, limit int) ([]*domain.Company, error) {
	return s.reviewRepo.GetTopRatedCompanies(minReviews, limit)
}

// CountByCompany counts reviews for a company
func (s *ReviewService) CountByCompany(companyID uuid.UUID, status *domain.ReviewStatus) (int64, error) {
	return s.reviewRepo.CountByCompany(companyID, status)
}

// HasUserReviewed checks if a user has reviewed a company
func (s *ReviewService) HasUserReviewed(companyID, userID uuid.UUID) (bool, error) {
	return s.reviewRepo.ExistsByCompanyAndUser(companyID, userID)
}

// GetAllReviews retrieves all reviews with filters for admin
func (s *ReviewService) GetAllReviews(filters map[string]interface{}, limit, offset int) ([]*domain.CompanyReview, int64, error) {
	return s.reviewRepo.GetAllReviews(filters, limit, offset)
}
