package repository

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// JobRepository handles job database operations
type JobRepository struct {
	db *gorm.DB
}

// NewJobRepository creates a new job repository
func NewJobRepository(db *gorm.DB) *JobRepository {
	return &JobRepository{db: db}
}

// Create creates a new job
func (r *JobRepository) Create(job *domain.Job) error {
	return r.db.Create(job).Error
}

// Update updates a job
func (r *JobRepository) Update(job *domain.Job) error {
	return r.db.Save(job).Error
}

// Delete soft deletes a job
func (r *JobRepository) Delete(jobID uuid.UUID) error {
	return r.db.Model(&domain.Job{}).
		Where("id = ?", jobID).
		Update("deleted_at", time.Now()).Error
}

// HardDelete permanently deletes a job
func (r *JobRepository) HardDelete(jobID uuid.UUID) error {
	return r.db.Unscoped().Delete(&domain.Job{}, "id = ?", jobID).Error
}

// GetByID retrieves a job by ID
func (r *JobRepository) GetByID(jobID uuid.UUID) (*domain.Job, error) {
	var job domain.Job
	err := r.db.
		Preload("Employer").
		Preload("Categories").
		Where("id = ? AND deleted_at IS NULL", jobID).
		First(&job).Error
	if err != nil {
		return nil, err
	}
	return &job, nil
}

// GetBySlug retrieves a job by slug
func (r *JobRepository) GetBySlug(slug string) (*domain.Job, error) {
	var job domain.Job
	err := r.db.
		Preload("Employer").
		Preload("Categories").
		Where("slug = ? AND deleted_at IS NULL", slug).
		First(&job).Error
	if err != nil {
		return nil, err
	}
	return &job, nil
}

// GetActiveJobs retrieves all active jobs with pagination
func (r *JobRepository) GetActiveJobs(limit, offset int) ([]domain.Job, int64, error) {
	var jobs []domain.Job
	var total int64

	query := r.db.Model(&domain.Job{}).
		Where("status = ? AND deleted_at IS NULL", domain.JobStatusActive).
		Where("expires_at > ?", time.Now())

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("Employer").
		Preload("Categories").
		Order("published_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&jobs).Error

	return jobs, total, err
}

// GetEmployerJobs retrieves jobs by employer ID
func (r *JobRepository) GetEmployerJobs(employerID uuid.UUID, limit, offset int) ([]domain.Job, int64, error) {
	var jobs []domain.Job
	var total int64

	query := r.db.Model(&domain.Job{}).
		Where("employer_id = ? AND deleted_at IS NULL", employerID)

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("Categories").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&jobs).Error

	return jobs, total, err
}

// GetFeaturedJobs retrieves featured jobs
func (r *JobRepository) GetFeaturedJobs(limit int) ([]domain.Job, error) {
	var jobs []domain.Job
	err := r.db.
		Where("is_featured = ? AND status = ? AND deleted_at IS NULL", true, domain.JobStatusActive).
		Where("featured_until > ?", time.Now()).
		Where("expires_at > ?", time.Now()).
		Preload("Employer").
		Preload("Categories").
		Order("published_at DESC").
		Limit(limit).
		Find(&jobs).Error
	return jobs, err
}

// CountActiveJobsByEmployer counts active jobs for an employer
func (r *JobRepository) CountActiveJobsByEmployer(employerID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Job{}).
		Where("employer_id = ? AND status = ? AND deleted_at IS NULL", employerID, domain.JobStatusActive).
		Count(&count).Error
	return count, err
}

// SlugExists checks if a slug already exists
func (r *JobRepository) SlugExists(slug string) (bool, error) {
	var count int64
	err := r.db.Model(&domain.Job{}).
		Where("slug = ? AND deleted_at IS NULL", slug).
		Count(&count).Error
	return count > 0, err
}

// IncrementViewCount increments the view count for a job
func (r *JobRepository) IncrementViewCount(jobID uuid.UUID) error {
	return r.db.Model(&domain.Job{}).
		Where("id = ?", jobID).
		Update("views_count", gorm.Expr("views_count + 1")).Error
}

// IncrementApplicationsCount increments the applications count for a job
func (r *JobRepository) IncrementApplicationsCount(jobID uuid.UUID) error {
	return r.db.Model(&domain.Job{}).
		Where("id = ?", jobID).
		Update("applications_count", gorm.Expr("applications_count + 1")).Error
}

// UpdateStatus updates the status of a job
func (r *JobRepository) UpdateStatus(jobID uuid.UUID, status domain.JobStatus) error {
	return r.db.Model(&domain.Job{}).
		Where("id = ?", jobID).
		Update("status", status).Error
}

// GetExpiredJobs retrieves jobs that have expired but not marked as expired
func (r *JobRepository) GetExpiredJobs() ([]domain.Job, error) {
	var jobs []domain.Job
	err := r.db.
		Where("status = ? AND expires_at < ? AND deleted_at IS NULL", domain.JobStatusActive, time.Now()).
		Find(&jobs).Error
	return jobs, err
}

// GetJobsExpiringBefore retrieves jobs expiring before a specific date
func (r *JobRepository) GetJobsExpiringBefore(date time.Time) ([]domain.Job, error) {
	var jobs []domain.Job
	err := r.db.
		Preload("Employer").
		Where("status = ? AND expires_at < ? AND expires_at > ? AND deleted_at IS NULL",
			domain.JobStatusActive, date, time.Now()).
		Find(&jobs).Error
	return jobs, err
}

// GetAllJobs retrieves all jobs for admin (with filters)
func (r *JobRepository) GetAllJobs(status *domain.JobStatus, limit, offset int) ([]domain.Job, int64, error) {
	var jobs []domain.Job
	var total int64

	query := r.db.Model(&domain.Job{}).Where("deleted_at IS NULL")

	if status != nil {
		query = query.Where("status = ?", *status)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("Employer").
		Preload("Categories").
		Preload("Moderator").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&jobs).Error

	return jobs, total, err
}

// ListJobs retrieves jobs with flexible filters (for admin)
func (r *JobRepository) ListJobs(filters map[string]interface{}, limit, offset int) ([]domain.Job, int64, error) {
	var jobs []domain.Job
	var total int64

	query := r.db.Model(&domain.Job{}).Where("deleted_at IS NULL")

	// Apply filters
	if status, ok := filters["status"].(string); ok && status != "" {
		query = query.Where("status = ?", status)
	}
	if search, ok := filters["search"].(string); ok && search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("title ILIKE ? OR description ILIKE ?", searchPattern, searchPattern)
	}
	if featured, ok := filters["is_featured"].(bool); ok {
		query = query.Where("is_featured = ?", featured)
	}
	if employerID, ok := filters["employer_id"].(uuid.UUID); ok {
		query = query.Where("employer_id = ?", employerID)
	}
	// Note: Job doesn't have a direct company_id field - company info is denormalized
	// If company filtering is needed, it would be through employer relationship

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("Employer").
		Preload("Categories").
		Preload("Moderator").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&jobs).Error

	return jobs, total, err
}

// GetPendingApprovalJobs retrieves jobs pending approval
func (r *JobRepository) GetPendingApprovalJobs(limit, offset int) ([]domain.Job, int64, error) {
	var jobs []domain.Job
	var total int64

	query := r.db.Model(&domain.Job{}).
		Where("status = ? AND deleted_at IS NULL", domain.JobStatusPendingApproval)

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("Employer").
		Preload("Categories").
		Order("created_at ASC").
		Limit(limit).
		Offset(offset).
		Find(&jobs).Error

	return jobs, total, err
}

// FeatureJob features a job until a specific date
func (r *JobRepository) FeatureJob(jobID uuid.UUID, until time.Time) error {
	return r.db.Model(&domain.Job{}).
		Where("id = ?", jobID).
		Updates(map[string]interface{}{
			"is_featured":    true,
			"featured_until": until,
		}).Error
}

// UnfeatureJob removes featured status from a job
func (r *JobRepository) UnfeatureJob(jobID uuid.UUID) error {
	return r.db.Model(&domain.Job{}).
		Where("id = ?", jobID).
		Updates(map[string]interface{}{
			"is_featured":    false,
			"featured_until": nil,
		}).Error
}

// AddCategories adds categories to a job
func (r *JobRepository) AddCategories(jobID uuid.UUID, categoryIDs []uuid.UUID) error {
	var job domain.Job
	if err := r.db.First(&job, "id = ?", jobID).Error; err != nil {
		return err
	}

	var categories []domain.JobCategory
	if err := r.db.Find(&categories, categoryIDs).Error; err != nil {
		return err
	}

	return r.db.Model(&job).Association("Categories").Replace(categories)
}

// RemoveCategories removes categories from a job
func (r *JobRepository) RemoveCategories(jobID uuid.UUID, categoryIDs []uuid.UUID) error {
	var job domain.Job
	if err := r.db.First(&job, "id = ?", jobID).Error; err != nil {
		return err
	}

	var categories []domain.JobCategory
	if err := r.db.Find(&categories, categoryIDs).Error; err != nil {
		return err
	}

	return r.db.Model(&job).Association("Categories").Delete(categories)
}

// SearchByLocation searches jobs by location
func (r *JobRepository) SearchByLocation(location string, limit, offset int) ([]domain.Job, int64, error) {
	var jobs []domain.Job
	var total int64

	query := r.db.Model(&domain.Job{}).
		Where("status = ? AND deleted_at IS NULL", domain.JobStatusActive).
		Where("expires_at > ?", time.Now()).
		Where("location ILIKE ? OR city ILIKE ? OR state ILIKE ? OR country ILIKE ?",
			"%"+location+"%", "%"+location+"%", "%"+location+"%", "%"+location+"%")

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("Employer").
		Preload("Categories").
		Order("published_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&jobs).Error

	return jobs, total, err
}

// GetJobsByCategory retrieves jobs in a specific category
func (r *JobRepository) GetJobsByCategory(categoryID uuid.UUID, limit, offset int) ([]domain.Job, int64, error) {
	var jobs []domain.Job
	var total int64

	query := r.db.Model(&domain.Job{}).
		Joins("JOIN job_category_mappings ON jobs.id = job_category_mappings.job_id").
		Where("job_category_mappings.category_id = ?", categoryID).
		Where("jobs.status = ? AND jobs.deleted_at IS NULL", domain.JobStatusActive).
		Where("jobs.expires_at > ?", time.Now())

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("Employer").
		Preload("Categories").
		Order("jobs.published_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&jobs).Error

	return jobs, total, err
}

// GetJobsNearExpiry retrieves jobs nearing expiration
func (r *JobRepository) GetJobsNearExpiry(daysUntilExpiry int) ([]domain.Job, error) {
	var jobs []domain.Job
	
	expiryDate := time.Now().AddDate(0, 0, daysUntilExpiry)
	
	err := r.db.Where("status = ? AND expires_at <= ? AND expires_at > ?", 
		domain.JobStatusActive, expiryDate, time.Now()).
		Preload("Employer").
		Preload("Categories").
		Find(&jobs).Error
	
	return jobs, err
}

// GetPendingJobs retrieves all pending jobs
func (r *JobRepository) GetPendingJobs(limit, offset int) ([]domain.Job, int64, error) {
	var jobs []domain.Job
	var total int64
	
	query := r.db.Where("status = ?", domain.JobStatusPendingApproval).
		Preload("Employer").
		Preload("Categories")
	
	// Count total
	countQuery := r.db.Model(&domain.Job{}).Where("status = ?", domain.JobStatusPendingApproval)
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	
	// Get paginated results
	err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&jobs).Error
	return jobs, total, err
}

// GetUniqueLocations retrieves unique locations from active jobs
func (r *JobRepository) GetUniqueLocations(limit int) ([]string, error) {
	var locations []string
	err := r.db.Model(&domain.Job{}).
		Where("status = ?", domain.JobStatusActive).
		Where("expires_at > ?", time.Now()).
		Where("location IS NOT NULL AND location != ''").
		Distinct("location").
		Order("location ASC").
		Limit(limit).
		Pluck("location", &locations).Error
	return locations, err
}

// JobFilters represents filters for job search
type JobFilters struct {
	Query            string
	JobTypes         []domain.JobType
	ExperienceLevels []domain.ExperienceLevel
	WorkplaceTypes   []domain.WorkplaceType
	Location         string
	SalaryMin        *int
	SalaryMax        *int
	CategorySlug     string
}

// GetFilteredJobs retrieves active jobs with filters and pagination
func (r *JobRepository) GetFilteredJobs(filters JobFilters, limit, offset int) ([]domain.Job, int64, error) {
	var jobs []domain.Job
	var total int64

	query := r.db.Model(&domain.Job{}).
		Where("status = ? AND deleted_at IS NULL", domain.JobStatusActive).
		Where("expires_at > ?", time.Now())

	// Apply search query
	if filters.Query != "" {
		searchPattern := "%" + filters.Query + "%"
		query = query.Where("title ILIKE ? OR description ILIKE ? OR company_name ILIKE ?",
			searchPattern, searchPattern, searchPattern)
	}

	// Apply job type filter
	if len(filters.JobTypes) > 0 {
		query = query.Where("job_type IN ?", filters.JobTypes)
	}

	// Apply experience level filter
	if len(filters.ExperienceLevels) > 0 {
		query = query.Where("experience_level IN ?", filters.ExperienceLevels)
	}

	// Apply workplace type filter
	if len(filters.WorkplaceTypes) > 0 {
		query = query.Where("workplace_type IN ?", filters.WorkplaceTypes)
	}

	// Apply location filter
	if filters.Location != "" {
		locationPattern := "%" + filters.Location + "%"
		query = query.Where("location ILIKE ? OR city ILIKE ? OR state ILIKE ? OR country ILIKE ?",
			locationPattern, locationPattern, locationPattern, locationPattern)
	}

	// Apply salary filters
	if filters.SalaryMin != nil {
		query = query.Where("salary_max >= ? OR salary_max IS NULL", *filters.SalaryMin)
	}
	if filters.SalaryMax != nil {
		query = query.Where("salary_min <= ? OR salary_min IS NULL", *filters.SalaryMax)
	}

	// Apply category filter
	if filters.CategorySlug != "" {
		query = query.Joins("JOIN job_category_mappings ON job_category_mappings.job_id = jobs.id").
			Joins("JOIN job_categories ON job_categories.id = job_category_mappings.category_id").
			Where("job_categories.slug = ?", filters.CategorySlug)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("Employer").
		Preload("Categories").
		Order("published_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&jobs).Error

	return jobs, total, err
}
