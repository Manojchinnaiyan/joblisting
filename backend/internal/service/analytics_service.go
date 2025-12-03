package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"

	"github.com/google/uuid"
)

// AnalyticsService handles company analytics business logic
type AnalyticsService struct {
	companyRepo  *repository.CompanyRepository
	reviewRepo   *repository.ReviewRepository
	followerRepo *repository.FollowerRepository
	teamRepo     *repository.TeamRepository
	locationRepo *repository.LocationRepository
}

// NewAnalyticsService creates a new analytics service
func NewAnalyticsService(
	companyRepo *repository.CompanyRepository,
	reviewRepo *repository.ReviewRepository,
	followerRepo *repository.FollowerRepository,
	teamRepo *repository.TeamRepository,
	locationRepo *repository.LocationRepository,
) *AnalyticsService {
	return &AnalyticsService{
		companyRepo:  companyRepo,
		reviewRepo:   reviewRepo,
		followerRepo: followerRepo,
		teamRepo:     teamRepo,
		locationRepo: locationRepo,
	}
}

// GetCompanyAnalytics retrieves comprehensive analytics for a company
func (s *AnalyticsService) GetCompanyAnalytics(companyID uuid.UUID) (map[string]interface{}, error) {
	company, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return nil, domain.ErrCompanyNotFound
	}

	// Get follower count
	followerCount, err := s.followerRepo.CountFollowers(companyID)
	if err != nil {
		return nil, err
	}

	// Get review stats
	approvedStatus := domain.ReviewStatusApproved
	reviewCount, err := s.reviewRepo.CountByCompany(companyID, &approvedStatus)
	if err != nil {
		return nil, err
	}

	avgRating, err := s.reviewRepo.CalculateAverageRating(companyID)
	if err != nil {
		return nil, err
	}

	ratingBreakdown, err := s.reviewRepo.GetRatingBreakdown(companyID)
	if err != nil {
		return nil, err
	}

	// Get team count
	teamCount, err := s.teamRepo.CountMembers(companyID)
	if err != nil {
		return nil, err
	}

	// Get location count
	locationCount, err := s.locationRepo.CountByCompany(companyID)
	if err != nil {
		return nil, err
	}

	analytics := map[string]interface{}{
		"company_id":   companyID,
		"company_name": company.Name,
		"company_slug": company.Slug,
		"status":       company.Status,
		"is_verified":  company.IsVerified,
		"is_featured":  company.IsFeatured,

		// Followers
		"followers_count": followerCount,

		// Reviews
		"reviews_count":    reviewCount,
		"average_rating":   avgRating,
		"rating_breakdown": ratingBreakdown,

		// Team
		"team_members_count": teamCount,

		// Locations
		"locations_count": locationCount,

		// Jobs
		"total_jobs":  company.TotalJobs,
		"active_jobs": company.ActiveJobs,

		// Other
		"total_employees": company.TotalEmployees,
	}

	return analytics, nil
}

// GetCompanyGrowthMetrics retrieves growth metrics for a company
func (s *AnalyticsService) GetCompanyGrowthMetrics(companyID uuid.UUID) (map[string]interface{}, error) {
	// Get recent followers
	recentFollowers, err := s.followerRepo.GetRecentFollowers(companyID, 10)
	if err != nil {
		return nil, err
	}

	// Get follower count
	followerCount, err := s.followerRepo.CountFollowers(companyID)
	if err != nil {
		return nil, err
	}

	metrics := map[string]interface{}{
		"total_followers":  followerCount,
		"recent_followers": len(recentFollowers),
	}

	return metrics, nil
}

// GetTopRatedCompanies retrieves top-rated companies
func (s *AnalyticsService) GetTopRatedCompanies(minReviews int, limit int) ([]*domain.Company, error) {
	return s.reviewRepo.GetTopRatedCompanies(minReviews, limit)
}

// GetMostFollowedCompanies retrieves most followed companies
func (s *AnalyticsService) GetMostFollowedCompanies(limit int) ([]*domain.Company, error) {
	return s.followerRepo.GetMostFollowedCompanies(limit)
}

// GetPlatformStats retrieves overall platform statistics
func (s *AnalyticsService) GetPlatformStats() (map[string]interface{}, error) {
	// Count companies by status
	activeCount, err := s.companyRepo.CountByStatus(domain.CompanyStatusActive)
	if err != nil {
		return nil, err
	}

	verifiedCount, err := s.companyRepo.CountByStatus(domain.CompanyStatusVerified)
	if err != nil {
		return nil, err
	}

	pendingCount, err := s.companyRepo.CountByStatus(domain.CompanyStatusPending)
	if err != nil {
		return nil, err
	}

	suspendedCount, err := s.companyRepo.CountByStatus(domain.CompanyStatusSuspended)
	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"total_companies":     activeCount + verifiedCount + pendingCount + suspendedCount,
		"active_companies":    activeCount,
		"verified_companies":  verifiedCount,
		"pending_companies":   pendingCount,
		"suspended_companies": suspendedCount,
	}

	return stats, nil
}

// GetCompanyReviewAnalytics retrieves detailed review analytics for a company
func (s *AnalyticsService) GetCompanyReviewAnalytics(companyID uuid.UUID) (map[string]interface{}, error) {
	// Get rating breakdown
	ratingBreakdown, err := s.reviewRepo.GetRatingBreakdown(companyID)
	if err != nil {
		return nil, err
	}

	// Get average rating
	avgRating, err := s.reviewRepo.CalculateAverageRating(companyID)
	if err != nil {
		return nil, err
	}

	// Get review count
	approvedStatus := domain.ReviewStatusApproved
	reviewCount, err := s.reviewRepo.CountByCompany(companyID, &approvedStatus)
	if err != nil {
		return nil, err
	}

	// Get most helpful reviews
	helpfulReviews, err := s.reviewRepo.GetMostHelpfulReviews(companyID, 5)
	if err != nil {
		return nil, err
	}

	analytics := map[string]interface{}{
		"total_reviews":      reviewCount,
		"average_rating":     avgRating,
		"rating_breakdown":   ratingBreakdown,
		"helpful_reviews":    helpfulReviews,
	}

	return analytics, nil
}

// GetIndustryStats retrieves statistics by industry
func (s *AnalyticsService) GetIndustryStats() (map[string]interface{}, error) {
	industries, err := s.companyRepo.GetIndustries()
	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"total_industries": len(industries),
		"industries":       industries,
	}

	return stats, nil
}

// GetLocationStats retrieves statistics by location
func (s *AnalyticsService) GetLocationStats() (map[string]interface{}, error) {
	countries, err := s.locationRepo.GetDistinctCountries()
	if err != nil {
		return nil, err
	}

	cities, err := s.locationRepo.GetDistinctCities(nil)
	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"total_countries": len(countries),
		"total_cities":    len(cities),
		"countries":       countries,
	}

	return stats, nil
}

// GetCompanyEngagementMetrics retrieves engagement metrics for a company
func (s *AnalyticsService) GetCompanyEngagementMetrics(companyID uuid.UUID) (map[string]interface{}, error) {
	// Get followers with notifications enabled
	notifyFollowers, err := s.followerRepo.GetFollowersWithNotifications(companyID)
	if err != nil {
		return nil, err
	}

	// Get total followers
	totalFollowers, err := s.followerRepo.CountFollowers(companyID)
	if err != nil {
		return nil, err
	}

	// Get approved reviews
	approvedStatus := domain.ReviewStatusApproved
	reviewCount, err := s.reviewRepo.CountByCompany(companyID, &approvedStatus)
	if err != nil {
		return nil, err
	}

	notifyCount := len(notifyFollowers)
	notifyRate := float64(0)
	if totalFollowers > 0 {
		notifyRate = float64(notifyCount) / float64(totalFollowers) * 100
	}

	metrics := map[string]interface{}{
		"total_followers":             totalFollowers,
		"followers_with_notifications": notifyCount,
		"notification_rate":           notifyRate,
		"total_reviews":               reviewCount,
	}

	return metrics, nil
}
