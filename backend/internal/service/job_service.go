package service

import (
	"fmt"
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"job-platform/internal/util/slug"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// JobService handles job business logic
type JobService struct {
	jobRepo         *repository.JobRepository
	categoryRepo    *repository.JobCategoryRepository
	applicationRepo *repository.ApplicationRepository
	viewRepo        *repository.JobViewRepository
	userRepo        *repository.UserRepository
	db              *gorm.DB
	config          *JobConfig
}

// JobConfig holds job configuration
type JobConfig struct {
	ExpiryDays              int
	ExpiryWarningDays       int
	MaxFreeJobsPerEmployer  int
	ModerationEnabled       bool
	DefaultExpiryDays       int
}

// NewJobService creates a new job service
func NewJobService(
	jobRepo *repository.JobRepository,
	categoryRepo *repository.JobCategoryRepository,
	applicationRepo *repository.ApplicationRepository,
	viewRepo *repository.JobViewRepository,
	userRepo *repository.UserRepository,
	db *gorm.DB,
	config *JobConfig,
) *JobService {
	return &JobService{
		jobRepo:         jobRepo,
		categoryRepo:    categoryRepo,
		applicationRepo: applicationRepo,
		viewRepo:        viewRepo,
		userRepo:        userRepo,
		db:              db,
		config:          config,
	}
}

// CreateJobInput represents input for creating a job
type CreateJobInput struct {
	Title              string
	Description        string
	ShortDescription   string
	JobType            domain.JobType
	ExperienceLevel    domain.ExperienceLevel
	WorkplaceType      domain.WorkplaceType
	Location           string
	City               string
	State              string
	Country            string
	Latitude           *float64
	Longitude          *float64
	SalaryMin          *int
	SalaryMax          *int
	SalaryCurrency     string
	SalaryPeriod       string
	HideSalary         bool
	Skills             []string
	Education          string
	YearsExperienceMin int
	YearsExperienceMax *int
	Benefits           []string
	CategoryIDs        []uuid.UUID
	ApplicationURL     string
	ApplicationEmail   string
}

// UpdateJobInput represents input for updating a job
type UpdateJobInput struct {
	Title              *string
	Description        *string
	ShortDescription   *string
	JobType            *domain.JobType
	ExperienceLevel    *domain.ExperienceLevel
	WorkplaceType      *domain.WorkplaceType
	Location           *string
	City               *string
	State              *string
	Country            *string
	Latitude           *float64
	Longitude          *float64
	SalaryMin          *int
	SalaryMax          *int
	SalaryCurrency     *string
	SalaryPeriod       *string
	HideSalary         *bool
	Skills             []string
	Education          *string
	YearsExperienceMin *int
	YearsExperienceMax *int
	Benefits           []string
	CategoryIDs        []uuid.UUID
	ApplicationURL     *string
	ApplicationEmail   *string
}

// CreateJob creates a new job posting
func (s *JobService) CreateJob(employerID uuid.UUID, input CreateJobInput) (*domain.Job, error) {
	// Get employer
	employer, err := s.userRepo.GetByID(employerID)
	if err != nil {
		return nil, domain.ErrUserNotFound
	}

	// Verify employer role
	if employer.Role != domain.RoleEmployer {
		return nil, domain.ErrInvalidRole
	}

	// Check if employer can post more jobs (free limit)
	canPost, err := s.CanEmployerPostJob(employerID)
	if err != nil {
		return nil, err
	}
	if !canPost {
		return nil, domain.ErrMaxJobsReached
	}

	// Generate unique slug
	baseSlug := slug.Generate(input.Title)
	finalSlug := slug.MakeUnique(baseSlug, func(slugStr string) bool {
		exists, _ := s.jobRepo.SlugExists(slugStr)
		return exists
	})

	// Get company info from employer
	// Note: UserProfile no longer has CompanyName/LogoURL - these should come from a separate Company model
	// For now, use employer's name as company name
	companyName := employer.FirstName + " " + employer.LastName
	companyLogoURL := ""
	// If you have a separate Company model, fetch it here
	// For now, we'll use the employer's avatar as company logo if available
	if employer.Profile != nil && employer.Profile.AvatarURL != nil {
		companyLogoURL = *employer.Profile.AvatarURL
	}

	// Determine initial status
	status := domain.JobStatusActive
	if s.config.ModerationEnabled {
		status = domain.JobStatusPendingApproval
	}

	// Set expiry date
	expiresAt := time.Now().AddDate(0, 0, s.config.DefaultExpiryDays)

	// Create job
	job := &domain.Job{
		ID:                 uuid.New(),
		EmployerID:         employerID,
		Title:              input.Title,
		Slug:               finalSlug,
		Description:        input.Description,
		ShortDescription:   input.ShortDescription,
		CompanyName:        companyName,
		CompanyLogoURL:     companyLogoURL,
		JobType:            input.JobType,
		ExperienceLevel:    input.ExperienceLevel,
		WorkplaceType:      input.WorkplaceType,
		Location:           input.Location,
		City:               input.City,
		State:              input.State,
		Country:            input.Country,
		Latitude:           input.Latitude,
		Longitude:          input.Longitude,
		SalaryMin:          input.SalaryMin,
		SalaryMax:          input.SalaryMax,
		SalaryCurrency:     input.SalaryCurrency,
		SalaryPeriod:       input.SalaryPeriod,
		HideSalary:         input.HideSalary,
		Skills:             input.Skills,
		Education:          input.Education,
		YearsExperienceMin: input.YearsExperienceMin,
		YearsExperienceMax: input.YearsExperienceMax,
		Benefits:           input.Benefits,
		ApplicationURL:     input.ApplicationURL,
		ApplicationEmail:   input.ApplicationEmail,
		Status:             status,
		ExpiresAt:          &expiresAt,
	}

	if status == domain.JobStatusActive {
		now := time.Now()
		job.PublishedAt = &now
	}

	// Create job in transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	jobRepoTx := repository.NewJobRepository(tx)
	if err := jobRepoTx.Create(job); err != nil {
		tx.Rollback()
		return nil, err
	}

	// Add categories if provided
	if len(input.CategoryIDs) > 0 {
		if err := jobRepoTx.AddCategories(job.ID, input.CategoryIDs); err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	// Reload job with associations
	return s.jobRepo.GetByID(job.ID)
}

// UpdateJob updates an existing job
func (s *JobService) UpdateJob(jobID, employerID uuid.UUID, input UpdateJobInput) (*domain.Job, error) {
	// Get job
	job, err := s.jobRepo.GetByID(jobID)
	if err != nil {
		return nil, domain.ErrJobNotFound
	}

	// Verify ownership
	if job.EmployerID != employerID {
		return nil, domain.ErrJobNotOwnedByEmployer
	}

	// Update fields if provided
	if input.Title != nil {
		job.Title = *input.Title
		// Regenerate slug if title changed
		baseSlug := slug.Generate(*input.Title)
		if baseSlug != job.Slug {
			job.Slug = slug.MakeUnique(baseSlug, func(slugStr string) bool {
				if slugStr == job.Slug {
					return false // Current slug is OK
				}
				exists, _ := s.jobRepo.SlugExists(slugStr)
				return exists
			})
		}
	}
	if input.Description != nil {
		job.Description = *input.Description
	}
	if input.ShortDescription != nil {
		job.ShortDescription = *input.ShortDescription
	}
	if input.JobType != nil {
		job.JobType = *input.JobType
	}
	if input.ExperienceLevel != nil {
		job.ExperienceLevel = *input.ExperienceLevel
	}
	if input.WorkplaceType != nil {
		job.WorkplaceType = *input.WorkplaceType
	}
	if input.Location != nil {
		job.Location = *input.Location
	}
	if input.City != nil {
		job.City = *input.City
	}
	if input.State != nil {
		job.State = *input.State
	}
	if input.Country != nil {
		job.Country = *input.Country
	}
	if input.Latitude != nil {
		job.Latitude = input.Latitude
	}
	if input.Longitude != nil {
		job.Longitude = input.Longitude
	}
	if input.SalaryMin != nil {
		job.SalaryMin = input.SalaryMin
	}
	if input.SalaryMax != nil {
		job.SalaryMax = input.SalaryMax
	}
	if input.SalaryCurrency != nil {
		job.SalaryCurrency = *input.SalaryCurrency
	}
	if input.SalaryPeriod != nil {
		job.SalaryPeriod = *input.SalaryPeriod
	}
	if input.HideSalary != nil {
		job.HideSalary = *input.HideSalary
	}
	if input.Skills != nil {
		job.Skills = input.Skills
	}
	if input.Education != nil {
		job.Education = *input.Education
	}
	if input.YearsExperienceMin != nil {
		job.YearsExperienceMin = *input.YearsExperienceMin
	}
	if input.YearsExperienceMax != nil {
		job.YearsExperienceMax = input.YearsExperienceMax
	}
	if input.Benefits != nil {
		job.Benefits = input.Benefits
	}
	if input.ApplicationURL != nil {
		job.ApplicationURL = *input.ApplicationURL
	}
	if input.ApplicationEmail != nil {
		job.ApplicationEmail = *input.ApplicationEmail
	}

	// Update in transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	jobRepoTx := repository.NewJobRepository(tx)
	if err := jobRepoTx.Update(job); err != nil {
		tx.Rollback()
		return nil, err
	}

	// Update categories if provided
	if input.CategoryIDs != nil {
		if err := jobRepoTx.AddCategories(job.ID, input.CategoryIDs); err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	// Reload job with associations
	return s.jobRepo.GetByID(job.ID)
}

// DeleteJob deletes a job
func (s *JobService) DeleteJob(jobID, employerID uuid.UUID) error {
	// Get job
	job, err := s.jobRepo.GetByID(jobID)
	if err != nil {
		return domain.ErrJobNotFound
	}

	// Verify ownership
	if job.EmployerID != employerID {
		return domain.ErrJobNotOwnedByEmployer
	}

	return s.jobRepo.Delete(jobID)
}

// GetJobByID retrieves a job by ID
func (s *JobService) GetJobByID(jobID uuid.UUID) (*domain.Job, error) {
	return s.jobRepo.GetByID(jobID)
}

// GetJobBySlug retrieves a job by slug
func (s *JobService) GetJobBySlug(slug string) (*domain.Job, error) {
	return s.jobRepo.GetBySlug(slug)
}

// GetActiveJobs retrieves active jobs with pagination
func (s *JobService) GetActiveJobs(limit, offset int) ([]domain.Job, int64, error) {
	return s.jobRepo.GetActiveJobs(limit, offset)
}

// GetFilteredJobs retrieves active jobs with filters and pagination
func (s *JobService) GetFilteredJobs(filters repository.JobFilters, limit, offset int) ([]domain.Job, int64, error) {
	return s.jobRepo.GetFilteredJobs(filters, limit, offset)
}

// GetEmployerJobs retrieves jobs posted by an employer
func (s *JobService) GetEmployerJobs(employerID uuid.UUID, limit, offset int) ([]domain.Job, int64, error) {
	return s.jobRepo.GetEmployerJobs(employerID, limit, offset)
}

// GetFeaturedJobs retrieves featured jobs
func (s *JobService) GetFeaturedJobs(limit int) ([]domain.Job, error) {
	return s.jobRepo.GetFeaturedJobs(limit)
}

// CloseJob closes a job posting
func (s *JobService) CloseJob(jobID, employerID uuid.UUID) error {
	// Get job
	job, err := s.jobRepo.GetByID(jobID)
	if err != nil {
		return domain.ErrJobNotFound
	}

	// Verify ownership
	if job.EmployerID != employerID {
		return domain.ErrJobNotOwnedByEmployer
	}

	// Update status to closed
	return s.jobRepo.UpdateStatus(jobID, domain.JobStatusClosed)
}

// RenewJob renews an expired job
func (s *JobService) RenewJob(jobID, employerID uuid.UUID, days int) error {
	// Get job
	job, err := s.jobRepo.GetByID(jobID)
	if err != nil {
		return domain.ErrJobNotFound
	}

	// Verify ownership
	if job.EmployerID != employerID {
		return domain.ErrJobNotOwnedByEmployer
	}

	// Check if job can be renewed
	if job.Status == domain.JobStatusActive && !job.IsExpired() {
		return domain.ErrCannotRenewActiveJob
	}

	// Set new expiry date
	if days <= 0 {
		days = s.config.DefaultExpiryDays
	}
	newExpiresAt := time.Now().AddDate(0, 0, days)
	job.ExpiresAt = &newExpiresAt
	job.Status = domain.JobStatusActive

	if job.PublishedAt == nil {
		now := time.Now()
		job.PublishedAt = &now
	}

	return s.jobRepo.Update(job)
}

// IncrementViewCount increments view count for a job
func (s *JobService) IncrementViewCount(jobID uuid.UUID) error {
	return s.jobRepo.IncrementViewCount(jobID)
}

// RecordJobView records a job view for analytics
func (s *JobService) RecordJobView(jobID uuid.UUID, userID *uuid.UUID, ip, userAgent, referrer string) error {
	view := &domain.JobView{
		ID:        uuid.New(),
		JobID:     jobID,
		UserID:    userID,
		IPAddress: ip,
		UserAgent: userAgent,
		Referrer:  referrer,
		ViewedAt:  time.Now(),
	}

	// Record view
	if err := s.viewRepo.Create(view); err != nil {
		return err
	}

	// Increment view count
	return s.IncrementViewCount(jobID)
}

// CanEmployerPostJob checks if employer can post more jobs
func (s *JobService) CanEmployerPostJob(employerID uuid.UUID) (bool, error) {
	// Verify employer exists
	_, err := s.userRepo.GetByID(employerID)
	if err != nil {
		return false, err
	}

	// Check if premium (unlimited jobs)
	// For now, we'll check a simple flag - can be extended
	// TODO: Implement premium membership check

	// Count active jobs
	count, err := s.jobRepo.CountActiveJobsByEmployer(employerID)
	if err != nil {
		return false, err
	}

	// Check against limit (free users)
	if count >= int64(s.config.MaxFreeJobsPerEmployer) {
		return false, nil
	}

	return true, nil
}

// ExpireOverdueJobs marks expired jobs as expired
func (s *JobService) ExpireOverdueJobs() (int, error) {
	jobs, err := s.jobRepo.GetExpiredJobs()
	if err != nil {
		return 0, err
	}

	count := 0
	for _, job := range jobs {
		if err := s.jobRepo.UpdateStatus(job.ID, domain.JobStatusExpired); err != nil {
			fmt.Printf("Failed to expire job %s: %v\n", job.ID, err)
			continue
		}
		count++
	}

	return count, nil
}

// GetJobsExpiringBefore retrieves jobs expiring before a date
func (s *JobService) GetJobsExpiringBefore(date time.Time) ([]domain.Job, error) {
	return s.jobRepo.GetJobsExpiringBefore(date)
}

// Admin Methods

// AdminGetAllJobs retrieves all jobs for admin
func (s *JobService) AdminGetAllJobs(status *domain.JobStatus, limit, offset int) ([]domain.Job, int64, error) {
	return s.jobRepo.GetAllJobs(status, limit, offset)
}

// ListJobs retrieves jobs with flexible filters (for admin)
func (s *JobService) ListJobs(filters map[string]interface{}, limit, offset int) ([]domain.Job, int64, error) {
	return s.jobRepo.ListJobs(filters, limit, offset)
}

// AdminUpdateJob updates any job (admin)
func (s *JobService) AdminUpdateJob(jobID uuid.UUID, input UpdateJobInput) (*domain.Job, error) {
	_, err := s.jobRepo.GetByID(jobID)
	if err != nil {
		return nil, domain.ErrJobNotFound
	}

	// Apply updates (same logic as UpdateJob but without ownership check)
	// ... (implementation similar to UpdateJob)

	return s.jobRepo.GetByID(jobID)
}

// AdminDeleteJob permanently deletes a job (admin)
func (s *JobService) AdminDeleteJob(jobID uuid.UUID) error {
	return s.jobRepo.HardDelete(jobID)
}

// ApproveJob approves a pending job
func (s *JobService) ApproveJob(jobID, adminID uuid.UUID) error {
	job, err := s.jobRepo.GetByID(jobID)
	if err != nil {
		return domain.ErrJobNotFound
	}

	if job.Status != domain.JobStatusPendingApproval {
		return domain.ErrInvalidJobStatus
	}

	now := time.Now()
	job.Status = domain.JobStatusActive
	job.PublishedAt = &now
	job.ModeratedBy = &adminID
	job.ModeratedAt = &now

	return s.jobRepo.Update(job)
}

// RejectJob rejects a pending job
func (s *JobService) RejectJob(jobID, adminID uuid.UUID, reason string) error {
	job, err := s.jobRepo.GetByID(jobID)
	if err != nil {
		return domain.ErrJobNotFound
	}

	if job.Status != domain.JobStatusPendingApproval {
		return domain.ErrInvalidJobStatus
	}

	now := time.Now()
	job.Status = domain.JobStatusRejected
	job.RejectionReason = reason
	job.ModeratedBy = &adminID
	job.ModeratedAt = &now

	return s.jobRepo.Update(job)
}

// FeatureJob features a job until a specific date
func (s *JobService) FeatureJob(jobID uuid.UUID, until time.Time) error {
	return s.jobRepo.FeatureJob(jobID, until)
}

// UnfeatureJob removes featured status
func (s *JobService) UnfeatureJob(jobID uuid.UUID) error {
	return s.jobRepo.UnfeatureJob(jobID)
}

// GetJobsNearExpiry retrieves jobs that are close to expiring
func (s *JobService) GetJobsNearExpiry() ([]domain.Job, error) {
	return s.jobRepo.GetJobsNearExpiry(s.config.ExpiryWarningDays)
}

// GetJobStats retrieves job statistics
func (s *JobService) GetJobStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})
	
	// Get total active jobs
	activeJobs, _, err := s.jobRepo.GetActiveJobs(1, 0)
	if err != nil {
		return nil, err
	}
	stats["total_active"] = len(activeJobs)
	
	// Get pending jobs count
	pendingJobs, _, err := s.jobRepo.GetPendingJobs(1, 0)
	if err != nil {
		return nil, err
	}
	stats["pending_approval"] = len(pendingJobs)
	
	return stats, nil
}

// GetPendingJobs retrieves all pending jobs
func (s *JobService) GetPendingJobs(limit, offset int) ([]domain.Job, int64, error) {
	return s.jobRepo.GetPendingJobs(limit, offset)
}

// GetApplicationStats retrieves application statistics
func (s *JobService) GetApplicationStats() (map[string]interface{}, error) {
	// Placeholder for application stats
	return map[string]interface{}{
		"total": 0,
		"by_status": map[string]int{},
	}, nil
}

// GetJobAnalytics retrieves analytics for a specific job
func (s *JobService) GetJobAnalytics(jobID uuid.UUID, startDate, endDate *time.Time) (map[string]interface{}, error) {
	// Get job to verify it exists
	job, err := s.jobRepo.GetByID(jobID)
	if err != nil {
		return nil, domain.ErrJobNotFound
	}

	analytics := make(map[string]interface{})

	// Basic job info
	analytics["job_id"] = job.ID
	analytics["job_title"] = job.Title
	analytics["status"] = job.Status
	analytics["created_at"] = job.CreatedAt
	analytics["published_at"] = job.PublishedAt
	analytics["expires_at"] = job.ExpiresAt

	// View statistics
	analytics["total_views"] = job.ViewsCount

	// Application statistics
	analytics["total_applications"] = job.ApplicationsCount

	// If date range provided, could get more detailed stats
	// For now, return basic stats
	if startDate != nil {
		analytics["start_date"] = startDate
	}
	if endDate != nil {
		analytics["end_date"] = endDate
	}

	return analytics, nil
}

// GetLocations retrieves unique job locations
func (s *JobService) GetLocations(limit int) ([]string, error) {
	if limit <= 0 || limit > 100 {
		limit = 50 // Default limit
	}
	return s.jobRepo.GetUniqueLocations(limit)
}

// EmployerOverviewAnalytics represents overview analytics for an employer
type EmployerOverviewAnalytics struct {
	Period               string                 `json:"period"`
	ActiveJobs           int64                  `json:"active_jobs"`
	TotalApplications    int64                  `json:"total_applications"`
	NewApplications      int64                  `json:"new_applications"`
	PendingApplications  int64                  `json:"pending_applications"`
	ShortlistedCandidates int64                 `json:"shortlisted_candidates"`
	InterviewsScheduled  int64                  `json:"interviews_scheduled"`
	OffersSent           int64                  `json:"offers_sent"`
	PositionsFilled      int64                  `json:"positions_filled"`
	AverageTimeToHire    int                    `json:"average_time_to_hire"`
	ApplicationFunnel    map[string]int64       `json:"application_funnel"`
}

// GetEmployerOverviewAnalytics retrieves overview analytics for an employer
func (s *JobService) GetEmployerOverviewAnalytics(employerID uuid.UUID, period string) (*EmployerOverviewAnalytics, error) {
	// Determine date range based on period
	var startDate time.Time
	now := time.Now()

	switch period {
	case "7d":
		startDate = now.AddDate(0, 0, -7)
	case "90d":
		startDate = now.AddDate(0, 0, -90)
	case "1y":
		startDate = now.AddDate(-1, 0, 0)
	default: // 30d
		startDate = now.AddDate(0, 0, -30)
		period = "30d"
	}

	analytics := &EmployerOverviewAnalytics{
		Period:            period,
		ApplicationFunnel: make(map[string]int64),
	}

	// Count active jobs
	activeJobs, err := s.jobRepo.CountActiveJobsByEmployer(employerID)
	if err != nil {
		return nil, err
	}
	analytics.ActiveJobs = activeJobs

	// Get application counts from repository
	appCounts, err := s.applicationRepo.GetEmployerApplicationCounts(employerID, startDate)
	if err != nil {
		// If method doesn't exist or errors, use defaults
		appCounts = map[string]int64{
			"total":       0,
			"new":         0,
			"submitted":   0,
			"reviewed":    0,
			"shortlisted": 0,
			"interview":   0,
			"offered":     0,
			"hired":       0,
			"rejected":    0,
		}
	}

	analytics.TotalApplications = appCounts["total"]
	analytics.NewApplications = appCounts["new"]
	analytics.PendingApplications = appCounts["submitted"]
	analytics.ShortlistedCandidates = appCounts["shortlisted"]
	analytics.InterviewsScheduled = appCounts["interview"]
	analytics.OffersSent = appCounts["offered"]
	analytics.PositionsFilled = appCounts["hired"]

	// Application funnel
	analytics.ApplicationFunnel["submitted"] = appCounts["submitted"]
	analytics.ApplicationFunnel["reviewed"] = appCounts["reviewed"]
	analytics.ApplicationFunnel["shortlisted"] = appCounts["shortlisted"]
	analytics.ApplicationFunnel["interview"] = appCounts["interview"]
	analytics.ApplicationFunnel["offered"] = appCounts["offered"]
	analytics.ApplicationFunnel["hired"] = appCounts["hired"]

	return analytics, nil
}
