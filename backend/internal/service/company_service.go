package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"job-platform/internal/storage"
	"mime/multipart"
	"time"

	"github.com/google/uuid"
)

// CompanyService handles company business logic
type CompanyService struct {
	companyRepo  *repository.CompanyRepository
	teamRepo     *repository.TeamRepository
	locationRepo *repository.LocationRepository
	benefitRepo  *repository.BenefitRepository
	mediaRepo    *repository.MediaRepository
	reviewRepo   *repository.ReviewRepository
	followerRepo *repository.FollowerRepository
	storage      *storage.MinioClient
}

// NewCompanyService creates a new company service
func NewCompanyService(
	companyRepo *repository.CompanyRepository,
	teamRepo *repository.TeamRepository,
	locationRepo *repository.LocationRepository,
	benefitRepo *repository.BenefitRepository,
	mediaRepo *repository.MediaRepository,
	reviewRepo *repository.ReviewRepository,
	followerRepo *repository.FollowerRepository,
	storage *storage.MinioClient,
) *CompanyService {
	return &CompanyService{
		companyRepo:  companyRepo,
		teamRepo:     teamRepo,
		locationRepo: locationRepo,
		benefitRepo:  benefitRepo,
		mediaRepo:    mediaRepo,
		reviewRepo:   reviewRepo,
		followerRepo: followerRepo,
		storage:      storage,
	}
}

// CreateCompany creates a new company profile
func (s *CompanyService) CreateCompany(userID uuid.UUID, req *domain.Company) (*domain.Company, error) {
	// Check if user already has a company
	hasCompany, err := s.companyRepo.UserHasCompany(userID)
	if err != nil {
		return nil, err
	}
	if hasCompany {
		return nil, domain.ErrCompanyAlreadyExists
	}

	// Generate unique slug
	slug, err := s.companyRepo.GenerateUniqueSlug(req.Name)
	if err != nil {
		return nil, err
	}

	// Create company
	company := &domain.Company{
		ID:                 uuid.New(),
		Name:               req.Name,
		Slug:               slug,
		Tagline:            req.Tagline,
		Description:        req.Description,
		Industry:           req.Industry,
		SubIndustry:        req.SubIndustry,
		CompanySize:        req.CompanySize,
		FoundedYear:        req.FoundedYear,
		CompanyType:        req.CompanyType,
		Website:            req.Website,
		Email:              req.Email,
		Phone:              req.Phone,
		LinkedInURL:        req.LinkedInURL,
		TwitterURL:         req.TwitterURL,
		FacebookURL:        req.FacebookURL,
		InstagramURL:       req.InstagramURL,
		Mission:            req.Mission,
		Vision:             req.Vision,
		CultureDescription: req.CultureDescription,
		Status:             domain.CompanyStatusActive,
		CreatedBy:          userID,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	if err := s.companyRepo.Create(company); err != nil {
		return nil, err
	}

	// Create owner team member
	teamMember := &domain.CompanyTeamMember{
		ID:        uuid.New(),
		CompanyID: company.ID,
		UserID:    userID,
		Role:      domain.TeamRoleOwner,
		Status:    domain.TeamMemberStatusActive,
		JoinedAt:  &company.CreatedAt,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := s.teamRepo.Create(teamMember); err != nil {
		return nil, err
	}

	return company, nil
}

// GetCompanyByID retrieves a company by ID
func (s *CompanyService) GetCompanyByID(id uuid.UUID) (*domain.Company, error) {
	return s.companyRepo.GetByID(id)
}

// GetCompanyBySlug retrieves a company by slug
func (s *CompanyService) GetCompanyBySlug(slug string) (*domain.Company, error) {
	return s.companyRepo.GetBySlug(slug)
}

// UpdateCompany updates a company profile
func (s *CompanyService) UpdateCompany(companyID uuid.UUID, req *domain.Company) (*domain.Company, error) {
	company, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return nil, err
	}

	if !company.CanBeEdited() {
		return nil, domain.ErrCompanyCannotBeEdited
	}

	// Update fields
	company.Name = req.Name
	company.Tagline = req.Tagline
	company.Description = req.Description
	company.Industry = req.Industry
	company.SubIndustry = req.SubIndustry
	company.CompanySize = req.CompanySize
	company.FoundedYear = req.FoundedYear
	company.CompanyType = req.CompanyType
	company.Website = req.Website
	company.Email = req.Email
	company.Phone = req.Phone
	company.LinkedInURL = req.LinkedInURL
	company.TwitterURL = req.TwitterURL
	company.FacebookURL = req.FacebookURL
	company.InstagramURL = req.InstagramURL
	company.Mission = req.Mission
	company.Vision = req.Vision
	company.CultureDescription = req.CultureDescription
	company.BrandColor = req.BrandColor
	company.UpdatedAt = time.Now()

	if err := s.companyRepo.Update(company); err != nil {
		return nil, err
	}

	return company, nil
}

// DeleteCompany soft deletes a company
func (s *CompanyService) DeleteCompany(companyID uuid.UUID) error {
	company, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return err
	}

	if !company.CanBeEdited() {
		return domain.ErrCompanyCannotBeEdited
	}

	return s.companyRepo.Delete(companyID)
}

// UploadLogo uploads a company logo
func (s *CompanyService) UploadLogo(companyID uuid.UUID, file *multipart.FileHeader) (string, error) {
	company, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return "", err
	}

	// Upload to MinIO
	result, err := s.storage.UploadFile("companies", file, "logos")
	if err != nil {
		return "", err
	}

	// Update company
	company.LogoURL = &result.URL
	company.UpdatedAt = time.Now()

	if err := s.companyRepo.Update(company); err != nil {
		return "", err
	}

	return result.URL, nil
}

// UploadCoverImage uploads a company cover image
func (s *CompanyService) UploadCoverImage(companyID uuid.UUID, file *multipart.FileHeader) (string, error) {
	company, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return "", err
	}

	// Upload to MinIO
	result, err := s.storage.UploadFile("companies", file, "covers")
	if err != nil {
		return "", err
	}

	// Update company
	company.CoverImageURL = &result.URL
	company.UpdatedAt = time.Now()

	if err := s.companyRepo.Update(company); err != nil {
		return "", err
	}

	return result.URL, nil
}

// UploadVerificationDocument uploads a verification document
func (s *CompanyService) UploadVerificationDocument(companyID uuid.UUID, file *multipart.FileHeader) (string, error) {
	company, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return "", err
	}

	// Upload to MinIO
	result, err := s.storage.UploadFile("companies", file, "verification")
	if err != nil {
		return "", err
	}

	// Add to verification documents
	if company.VerificationDocuments == nil {
		company.VerificationDocuments = []string{}
	}
	company.VerificationDocuments = append(company.VerificationDocuments, result.URL)
	company.UpdatedAt = time.Now()

	if err := s.companyRepo.Update(company); err != nil {
		return "", err
	}

	return result.URL, nil
}

// ListCompanies retrieves companies with filters and pagination
func (s *CompanyService) ListCompanies(filters map[string]interface{}, limit, offset int) ([]*domain.Company, int64, error) {
	return s.companyRepo.List(filters, limit, offset)
}

// GetFeaturedCompanies retrieves featured companies
func (s *CompanyService) GetFeaturedCompanies(limit int) ([]*domain.Company, error) {
	return s.companyRepo.GetFeatured(limit)
}

// GetCompaniesForSitemap retrieves all active companies for sitemap generation
func (s *CompanyService) GetCompaniesForSitemap() ([]*domain.Company, error) {
	return s.companyRepo.GetCompaniesForSitemap()
}

// GetUserCompany retrieves a user's company
func (s *CompanyService) GetUserCompany(userID uuid.UUID) (*domain.Company, error) {
	return s.companyRepo.GetByUserID(userID)
}

// GetIndustries retrieves all distinct industries
func (s *CompanyService) GetIndustries() ([]string, error) {
	return s.companyRepo.GetIndustries()
}

// VerifyCompany verifies a company (admin only)
func (s *CompanyService) VerifyCompany(companyID, adminID uuid.UUID) error {
	company, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return err
	}

	if company.Status != domain.CompanyStatusPending && company.Status != domain.CompanyStatusActive {
		return domain.ErrCompanyNotPending
	}

	return s.companyRepo.Verify(companyID, adminID)
}

// UnverifyCompany removes verification from a company (admin only)
func (s *CompanyService) UnverifyCompany(companyID uuid.UUID) error {
	return s.companyRepo.Unverify(companyID)
}

// RejectCompany rejects a company verification (admin only)
func (s *CompanyService) RejectCompany(companyID uuid.UUID, reason string) error {
	company, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return err
	}

	if company.Status != domain.CompanyStatusPending {
		return domain.ErrCompanyNotPending
	}

	return s.companyRepo.Reject(companyID, reason)
}

// FeatureCompany features a company (admin only)
func (s *CompanyService) FeatureCompany(companyID uuid.UUID, until *time.Time) error {
	return s.companyRepo.Feature(companyID, until)
}

// UnfeatureCompany removes featuring from a company (admin only)
func (s *CompanyService) UnfeatureCompany(companyID uuid.UUID) error {
	return s.companyRepo.Unfeature(companyID)
}

// SuspendCompany suspends a company (admin only)
func (s *CompanyService) SuspendCompany(companyID uuid.UUID) error {
	return s.companyRepo.Suspend(companyID)
}

// ActivateCompany activates a company (admin only)
func (s *CompanyService) ActivateCompany(companyID uuid.UUID) error {
	return s.companyRepo.Activate(companyID)
}

// GetPendingVerification retrieves companies pending verification (admin only)
func (s *CompanyService) GetPendingVerification(limit, offset int) ([]*domain.Company, int64, error) {
	return s.companyRepo.GetPendingVerification(limit, offset)
}

// GetCompanyStats retrieves company statistics
func (s *CompanyService) GetCompanyStats(companyID uuid.UUID) (map[string]interface{}, error) {
	company, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return nil, err
	}

	teamCount, err := s.teamRepo.CountMembers(companyID)
	if err != nil {
		return nil, err
	}

	locationCount, err := s.locationRepo.CountByCompany(companyID)
	if err != nil {
		return nil, err
	}

	followerCount, err := s.followerRepo.CountFollowers(companyID)
	if err != nil {
		return nil, err
	}

	approvedStatus := domain.ReviewStatusApproved
	reviewCount, err := s.reviewRepo.CountByCompany(companyID, &approvedStatus)
	if err != nil {
		return nil, err
	}

	avgRating, err := s.reviewRepo.CalculateAverageRating(companyID)
	if err != nil {
		return nil, err
	}

	stats := map[string]interface{}{
		"total_jobs":       company.TotalJobs,
		"active_jobs":      company.ActiveJobs,
		"team_members":     teamCount,
		"locations":        locationCount,
		"followers":        followerCount,
		"reviews":          reviewCount,
		"average_rating":   avgRating,
		"total_employees":  company.TotalEmployees,
		"is_verified":      company.IsVerified,
		"is_featured":      company.IsFeatured,
		"status":           company.Status,
	}

	return stats, nil
}

// SearchCompanies searches companies by query
func (s *CompanyService) SearchCompanies(query string, limit, offset int) ([]*domain.Company, int64, error) {
	filters := map[string]interface{}{
		"search": query,
	}
	return s.companyRepo.List(filters, limit, offset)
}

// GetCompanyJobs retrieves jobs for a company
func (s *CompanyService) GetCompanyJobs(companyID uuid.UUID, limit, offset int) ([]*domain.Job, int64, error) {
	return s.companyRepo.GetCompanyJobs(companyID, limit, offset)
}

// UpdateCompanyStats updates company statistics
func (s *CompanyService) UpdateCompanyStats(companyID uuid.UUID) error {
	followerCount, err := s.followerRepo.CountFollowers(companyID)
	if err != nil {
		return err
	}

	approvedStatus := domain.ReviewStatusApproved
	reviewCount, err := s.reviewRepo.CountByCompany(companyID, &approvedStatus)
	if err != nil {
		return err
	}

	avgRating, err := s.reviewRepo.CalculateAverageRating(companyID)
	if err != nil {
		return err
	}

	stats := map[string]interface{}{
		"followers_count": followerCount,
		"reviews_count":   reviewCount,
		"average_rating":  avgRating,
	}

	return s.companyRepo.UpdateStats(companyID, stats)
}
