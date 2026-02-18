package repository

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ApplicationRepository handles application database operations
type ApplicationRepository struct {
	db *gorm.DB
}

// NewApplicationRepository creates a new application repository
func NewApplicationRepository(db *gorm.DB) *ApplicationRepository {
	return &ApplicationRepository{db: db}
}

// Create creates a new application
func (r *ApplicationRepository) Create(application *domain.Application) error {
	return r.db.Create(application).Error
}

// Update updates an application
func (r *ApplicationRepository) Update(application *domain.Application) error {
	return r.db.Save(application).Error
}

// GetByID retrieves an application by ID
func (r *ApplicationRepository) GetByID(applicationID uuid.UUID) (*domain.Application, error) {
	var application domain.Application
	err := r.db.
		Preload("Job").
		Preload("Job.Employer").
		Preload("Applicant").
		Preload("StatusHistory").
		Where("id = ?", applicationID).
		First(&application).Error
	if err != nil {
		return nil, err
	}
	return &application, nil
}

// GetByJobAndApplicant retrieves an application by job and applicant
func (r *ApplicationRepository) GetByJobAndApplicant(jobID, applicantID uuid.UUID) (*domain.Application, error) {
	var application domain.Application
	err := r.db.
		Preload("Job").
		Preload("StatusHistory").
		Where("job_id = ? AND applicant_id = ?", jobID, applicantID).
		First(&application).Error
	if err != nil {
		return nil, err
	}
	return &application, nil
}

// ApplicationExists checks if an application already exists for a job and applicant
func (r *ApplicationRepository) ApplicationExists(jobID, applicantID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.Application{}).
		Where("job_id = ? AND applicant_id = ?", jobID, applicantID).
		Count(&count).Error
	return count > 0, err
}

// GetApplicantApplications retrieves all applications by an applicant
func (r *ApplicationRepository) GetApplicantApplications(applicantID uuid.UUID, limit, offset int) ([]domain.Application, int64, error) {
	var applications []domain.Application
	var total int64

	query := r.db.Model(&domain.Application{}).
		Where("applicant_id = ?", applicantID)

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("Job").
		Preload("Job.Employer").
		Order("applied_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&applications).Error

	return applications, total, err
}

// GetJobApplications retrieves all applications for a job
func (r *ApplicationRepository) GetJobApplications(jobID uuid.UUID, limit, offset int) ([]domain.Application, int64, error) {
	var applications []domain.Application
	var total int64

	query := r.db.Model(&domain.Application{}).
		Where("job_id = ?", jobID)

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("Applicant").
		Preload("Applicant.Profile").
		Order("applied_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&applications).Error

	return applications, total, err
}

// GetEmployerApplications retrieves all applications for an employer's jobs with optional filters
func (r *ApplicationRepository) GetEmployerApplications(employerID uuid.UUID, status, sortBy string, limit, offset int) ([]domain.Application, int64, error) {
	var applications []domain.Application
	var total int64

	query := r.db.Model(&domain.Application{}).
		Joins("JOIN jobs ON applications.job_id = jobs.id").
		Where("jobs.employer_id = ?", employerID)

	// Apply status filter if provided
	if status != "" {
		query = query.Where("applications.status = ?", status)
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Determine sort order
	orderBy := "applications.applied_at DESC" // default: newest
	switch sortBy {
	case "oldest":
		orderBy = "applications.applied_at ASC"
	case "rating":
		orderBy = "applications.employer_rating DESC NULLS LAST, applications.applied_at DESC"
	}

	// Get paginated results
	err := query.
		Preload("Job").
		Preload("Applicant").
		Preload("Applicant.Profile").
		Order(orderBy).
		Limit(limit).
		Offset(offset).
		Find(&applications).Error

	return applications, total, err
}

// GetApplicationsByStatus retrieves applications by status for a job
func (r *ApplicationRepository) GetApplicationsByStatus(jobID uuid.UUID, status domain.ApplicationStatus, limit, offset int) ([]domain.Application, int64, error) {
	var applications []domain.Application
	var total int64

	query := r.db.Model(&domain.Application{}).
		Where("job_id = ? AND status = ?", jobID, status)

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("Applicant").
		Preload("Applicant.Profile").
		Order("applied_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&applications).Error

	return applications, total, err
}

// UpdateStatus updates the status of an application
func (r *ApplicationRepository) UpdateStatus(applicationID uuid.UUID, status domain.ApplicationStatus, updatedBy uuid.UUID) error {
	return r.db.Model(&domain.Application{}).
		Where("id = ?", applicationID).
		Updates(map[string]interface{}{
			"status":            status,
			"status_updated_at": time.Now(),
			"status_updated_by": updatedBy,
		}).Error
}

// UpdateEmployerNotes updates employer notes for an application
func (r *ApplicationRepository) UpdateEmployerNotes(applicationID uuid.UUID, notes string) error {
	return r.db.Model(&domain.Application{}).
		Where("id = ?", applicationID).
		Update("employer_notes", notes).Error
}

// UpdateRating updates the rating for an application
func (r *ApplicationRepository) UpdateRating(applicationID uuid.UUID, rating int) error {
	return r.db.Model(&domain.Application{}).
		Where("id = ?", applicationID).
		Update("rating", rating).Error
}

// CountApplicationsByJob counts applications for a job
func (r *ApplicationRepository) CountApplicationsByJob(jobID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Application{}).
		Where("job_id = ?", jobID).
		Count(&count).Error
	return count, err
}

// CountApplicationsByStatus counts applications by status for a job
func (r *ApplicationRepository) CountApplicationsByStatus(jobID uuid.UUID, status domain.ApplicationStatus) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Application{}).
		Where("job_id = ? AND status = ?", jobID, status).
		Count(&count).Error
	return count, err
}

// CountAll counts all applications
func (r *ApplicationRepository) CountAll() (int64, error) {
	var count int64
	err := r.db.Model(&domain.Application{}).Count(&count).Error
	return count, err
}

// CountCreatedSince counts applications created since a given time
func (r *ApplicationRepository) CountCreatedSince(since time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Application{}).
		Where("created_at >= ?", since).
		Count(&count).Error
	return count, err
}

// CountAllByStatus counts all applications by status (admin)
func (r *ApplicationRepository) CountAllByStatus(status domain.ApplicationStatus) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Application{}).
		Where("status = ?", status).
		Count(&count).Error
	return count, err
}

// GetRecentApplications retrieves recent applications (for dashboard)
func (r *ApplicationRepository) GetRecentApplications(employerID uuid.UUID, limit int) ([]domain.Application, error) {
	var applications []domain.Application
	err := r.db.
		Joins("JOIN jobs ON applications.job_id = jobs.id").
		Where("jobs.employer_id = ?", employerID).
		Preload("Job").
		Preload("Applicant").
		Order("applications.applied_at DESC").
		Limit(limit).
		Find(&applications).Error
	return applications, err
}

// GetEmployerApplicationCounts retrieves application counts by status for an employer
func (r *ApplicationRepository) GetEmployerApplicationCounts(employerID uuid.UUID, since time.Time) (map[string]int64, error) {
	counts := make(map[string]int64)

	// Get total applications
	var total int64
	if err := r.db.Model(&domain.Application{}).
		Joins("JOIN jobs ON applications.job_id = jobs.id").
		Where("jobs.employer_id = ?", employerID).
		Count(&total).Error; err != nil {
		return nil, err
	}
	counts["total"] = total

	// Get new applications (since the given date)
	var newCount int64
	if err := r.db.Model(&domain.Application{}).
		Joins("JOIN jobs ON applications.job_id = jobs.id").
		Where("jobs.employer_id = ? AND applications.applied_at >= ?", employerID, since).
		Count(&newCount).Error; err != nil {
		return nil, err
	}
	counts["new"] = newCount

	// Get counts by status
	type StatusCount struct {
		Status string
		Count  int64
	}
	var statusCounts []StatusCount

	if err := r.db.Model(&domain.Application{}).
		Select("applications.status, COUNT(*) as count").
		Joins("JOIN jobs ON applications.job_id = jobs.id").
		Where("jobs.employer_id = ?", employerID).
		Group("applications.status").
		Scan(&statusCounts).Error; err != nil {
		return nil, err
	}

	// Initialize all statuses to 0
	counts["submitted"] = 0
	counts["reviewed"] = 0
	counts["shortlisted"] = 0
	counts["interview"] = 0
	counts["offered"] = 0
	counts["hired"] = 0
	counts["rejected"] = 0
	counts["withdrawn"] = 0

	// Fill in actual counts
	for _, sc := range statusCounts {
		counts[sc.Status] = sc.Count
	}

	return counts, nil
}

// ApplicationStatusHistoryRepository handles application status history operations
type ApplicationStatusHistoryRepository struct {
	db *gorm.DB
}

// NewApplicationStatusHistoryRepository creates a new application status history repository
func NewApplicationStatusHistoryRepository(db *gorm.DB) *ApplicationStatusHistoryRepository {
	return &ApplicationStatusHistoryRepository{db: db}
}

// Create creates a new status history record
func (r *ApplicationStatusHistoryRepository) Create(history *domain.ApplicationStatusHistory) error {
	return r.db.Create(history).Error
}

// GetByApplicationID retrieves status history for an application
func (r *ApplicationStatusHistoryRepository) GetByApplicationID(applicationID uuid.UUID) ([]domain.ApplicationStatusHistory, error) {
	var history []domain.ApplicationStatusHistory
	err := r.db.
		Where("application_id = ?", applicationID).
		Preload("Changer").
		Order("created_at DESC").
		Find(&history).Error
	return history, err
}
