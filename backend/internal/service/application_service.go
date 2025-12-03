package service

import (
	"context"
	"fmt"
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ApplicationService handles application business logic
type ApplicationService struct {
	applicationRepo        *repository.ApplicationRepository
	applicationHistoryRepo *repository.ApplicationStatusHistoryRepository
	jobRepo                *repository.JobRepository
	userRepo               *repository.UserRepository
	db                     *gorm.DB
	notificationService    *NotificationService
}

// NewApplicationService creates a new application service
func NewApplicationService(
	applicationRepo *repository.ApplicationRepository,
	applicationHistoryRepo *repository.ApplicationStatusHistoryRepository,
	jobRepo *repository.JobRepository,
	userRepo *repository.UserRepository,
	db *gorm.DB,
) *ApplicationService {
	return &ApplicationService{
		applicationRepo:        applicationRepo,
		applicationHistoryRepo: applicationHistoryRepo,
		jobRepo:                jobRepo,
		userRepo:               userRepo,
		db:                     db,
	}
}

// SetNotificationService sets the notification service (to avoid circular dependency)
func (s *ApplicationService) SetNotificationService(ns *NotificationService) {
	s.notificationService = ns
}

// ApplyJobInput represents input for applying to a job
type ApplyJobInput struct {
	ResumeURL      string
	CoverLetter    string
	ExpectedSalary *int
	AvailableFrom  *time.Time
	Answers        map[string]interface{}
}

// ApplyToJob submits an application to a job
func (s *ApplicationService) ApplyToJob(applicantID, jobID uuid.UUID, input ApplyJobInput) (*domain.Application, error) {
	// Validate if user can apply
	canApply, reason, err := s.CanApply(applicantID, jobID)
	if err != nil {
		return nil, err
	}
	if !canApply {
		switch reason {
		case "already_applied":
			return nil, domain.ErrAlreadyApplied
		case "own_job":
			return nil, domain.ErrCannotApplyOwnJob
		case "job_not_active":
			return nil, domain.ErrCannotApplyExpiredJob
		default:
			return nil, domain.ErrCannotApplyExpiredJob
		}
	}

	// Validate resume URL
	if input.ResumeURL == "" {
		return nil, domain.ErrResumeRequired
	}

	// Create application
	application := &domain.Application{
		ID:             uuid.New(),
		JobID:          jobID,
		ApplicantID:    applicantID,
		ResumeURL:      input.ResumeURL,
		CoverLetter:    input.CoverLetter,
		ExpectedSalary: input.ExpectedSalary,
		AvailableFrom:  input.AvailableFrom,
		Status:         domain.ApplicationStatusSubmitted,
		AppliedAt:      time.Now(),
	}

	// Convert answers to JSONB if provided
	// answers := datatypes.JSON{}
	// if input.Answers != nil {
	// 	answersJSON, _ := json.Marshal(input.Answers)
	// 	answers = answersJSON
	// }
	// application.Answers = answers

	// Create application in transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	appRepoTx := repository.NewApplicationRepository(tx)
	if err := appRepoTx.Create(application); err != nil {
		tx.Rollback()
		return nil, err
	}

	// Create status history
	history := &domain.ApplicationStatusHistory{
		ID:            uuid.New(),
		ApplicationID: application.ID,
		FromStatus:    nil,
		ToStatus:      domain.ApplicationStatusSubmitted,
		CreatedAt:     time.Now(),
	}

	historyRepoTx := repository.NewApplicationStatusHistoryRepository(tx)
	if err := historyRepoTx.Create(history); err != nil {
		tx.Rollback()
		return nil, err
	}

	// Increment applications count for job
	jobRepoTx := repository.NewJobRepository(tx)
	if err := jobRepoTx.IncrementApplicationsCount(jobID); err != nil {
		tx.Rollback()
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	// Reload application with associations
	app, err := s.applicationRepo.GetByID(application.ID)
	if err != nil {
		return nil, err
	}

	// Send notification to employer about new application (async)
	if s.notificationService != nil {
		go func() {
			job, err := s.jobRepo.GetByID(jobID)
			if err != nil {
				return
			}
			applicant, err := s.userRepo.GetByID(applicantID)
			if err != nil {
				return
			}
			applicantName := fmt.Sprintf("%s %s", applicant.FirstName, applicant.LastName)
			_ = s.notificationService.NotifyNewApplication(
				context.Background(),
				job.EmployerID,
				jobID,
				application.ID,
				job.Title,
				applicantName,
			)
		}()
	}

	return app, nil
}

// WithdrawApplication withdraws an application
func (s *ApplicationService) WithdrawApplication(applicationID, applicantID uuid.UUID) error {
	// Get application
	application, err := s.applicationRepo.GetByID(applicationID)
	if err != nil {
		return domain.ErrApplicationNotFound
	}

	// Verify ownership
	if application.ApplicantID != applicantID {
		return domain.ErrNotApplicationOwner
	}

	// Check if can withdraw
	if !application.CanWithdraw() {
		return domain.ErrCannotWithdraw
	}

	// Update status
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	appRepoTx := repository.NewApplicationRepository(tx)
	if err := appRepoTx.UpdateStatus(applicationID, domain.ApplicationStatusWithdrawn, applicantID); err != nil {
		tx.Rollback()
		return err
	}

	// Create status history
	history := &domain.ApplicationStatusHistory{
		ID:            uuid.New(),
		ApplicationID: applicationID,
		FromStatus:    &application.Status,
		ToStatus:      domain.ApplicationStatusWithdrawn,
		ChangedBy:     &applicantID,
		CreatedAt:     time.Now(),
	}

	historyRepoTx := repository.NewApplicationStatusHistoryRepository(tx)
	if err := historyRepoTx.Create(history); err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

// GetMyApplications retrieves all applications by an applicant
func (s *ApplicationService) GetMyApplications(applicantID uuid.UUID, limit, offset int) ([]domain.Application, int64, error) {
	return s.applicationRepo.GetApplicantApplications(applicantID, limit, offset)
}

// GetApplicationByID retrieves an application by ID (with access check)
func (s *ApplicationService) GetApplicationByID(applicationID, userID uuid.UUID) (*domain.Application, error) {
	application, err := s.applicationRepo.GetByID(applicationID)
	if err != nil {
		return nil, domain.ErrApplicationNotFound
	}

	// Check access - must be applicant or job owner
	user, err := s.userRepo.GetByID(userID)
	if err != nil {
		return nil, domain.ErrUserNotFound
	}

	hasAccess := application.ApplicantID == userID ||
		application.Job.EmployerID == userID ||
		user.Role == domain.RoleAdmin

	if !hasAccess {
		return nil, domain.ErrNotApplicationOwner
	}

	return application, nil
}

// GetApplicationForJob retrieves an application for a specific job by applicant
func (s *ApplicationService) GetApplicationForJob(applicantID, jobID uuid.UUID) (*domain.Application, error) {
	return s.applicationRepo.GetByJobAndApplicant(jobID, applicantID)
}

// GetJobApplications retrieves all applications for a job (employer only)
func (s *ApplicationService) GetJobApplications(jobID, employerID uuid.UUID, limit, offset int) ([]domain.Application, int64, error) {
	// Verify job ownership
	job, err := s.jobRepo.GetByID(jobID)
	if err != nil {
		return nil, 0, domain.ErrJobNotFound
	}

	if job.EmployerID != employerID {
		return nil, 0, domain.ErrJobNotOwnedByEmployer
	}

	return s.applicationRepo.GetJobApplications(jobID, limit, offset)
}

// UpdateApplicationStatus updates the status of an application (employer only)
func (s *ApplicationService) UpdateApplicationStatus(applicationID, employerID uuid.UUID, status domain.ApplicationStatus, reason string) error {
	// Get application
	application, err := s.applicationRepo.GetByID(applicationID)
	if err != nil {
		return domain.ErrApplicationNotFound
	}

	// Verify job ownership
	if application.Job.EmployerID != employerID {
		return domain.ErrJobNotOwnedByEmployer
	}

	// Validate status transition
	if !s.ValidateStatusTransition(application.Status, status) {
		return domain.ErrInvalidApplicationStatus
	}

	// Update in transaction
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	appRepoTx := repository.NewApplicationRepository(tx)
	if err := appRepoTx.UpdateStatus(applicationID, status, employerID); err != nil {
		tx.Rollback()
		return err
	}

	// Update rejection reason if status is rejected
	if status == domain.ApplicationStatusRejected && reason != "" {
		application.RejectionReason = reason
		if err := appRepoTx.Update(application); err != nil {
			tx.Rollback()
			return err
		}
	}

	// Create status history
	history := &domain.ApplicationStatusHistory{
		ID:            uuid.New(),
		ApplicationID: applicationID,
		FromStatus:    &application.Status,
		ToStatus:      status,
		ChangedBy:     &employerID,
		Notes:         reason,
		CreatedAt:     time.Now(),
	}

	historyRepoTx := repository.NewApplicationStatusHistoryRepository(tx)
	if err := historyRepoTx.Create(history); err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	// Send notification to applicant about status change (async)
	if s.notificationService != nil {
		go func() {
			_ = s.notificationService.NotifyApplicationStatusChange(
				context.Background(),
				application.ApplicantID,
				application.JobID,
				applicationID,
				application.Job.Title,
				string(status),
			)
		}()
	}

	return nil
}

// AddEmployerNotes adds notes to an application
func (s *ApplicationService) AddEmployerNotes(applicationID, employerID uuid.UUID, notes string) error {
	// Get application
	application, err := s.applicationRepo.GetByID(applicationID)
	if err != nil {
		return domain.ErrApplicationNotFound
	}

	// Verify job ownership
	if application.Job.EmployerID != employerID {
		return domain.ErrJobNotOwnedByEmployer
	}

	return s.applicationRepo.UpdateEmployerNotes(applicationID, notes)
}

// RateApplicant rates an applicant
func (s *ApplicationService) RateApplicant(applicationID, employerID uuid.UUID, rating int) error {
	// Validate rating
	if rating < 1 || rating > 5 {
		return domain.ErrInvalidInput
	}

	// Get application
	application, err := s.applicationRepo.GetByID(applicationID)
	if err != nil {
		return domain.ErrApplicationNotFound
	}

	// Verify job ownership
	if application.Job.EmployerID != employerID {
		return domain.ErrJobNotOwnedByEmployer
	}

	return s.applicationRepo.UpdateRating(applicationID, rating)
}

// CanApply checks if an applicant can apply to a job
func (s *ApplicationService) CanApply(applicantID, jobID uuid.UUID) (bool, string, error) {
	// Get job
	job, err := s.jobRepo.GetByID(jobID)
	if err != nil {
		return false, "job_not_found", domain.ErrJobNotFound
	}

	// Check if already applied
	exists, err := s.applicationRepo.ApplicationExists(jobID, applicantID)
	if err != nil {
		return false, "error", err
	}
	if exists {
		return false, "already_applied", nil
	}

	// Check if applying to own job
	if job.EmployerID == applicantID {
		return false, "own_job", nil
	}

	// Check if job is active and accepting applications
	if !job.CanAcceptApplications() {
		return false, "job_not_active", nil
	}

	return true, "", nil
}

// ValidateStatusTransition validates if a status transition is allowed
func (s *ApplicationService) ValidateStatusTransition(current, new domain.ApplicationStatus) bool {
	// Define valid transitions
	validTransitions := map[domain.ApplicationStatus][]domain.ApplicationStatus{
		domain.ApplicationStatusSubmitted: {
			domain.ApplicationStatusReviewed,
			domain.ApplicationStatusRejected,
		},
		domain.ApplicationStatusReviewed: {
			domain.ApplicationStatusShortlisted,
			domain.ApplicationStatusRejected,
		},
		domain.ApplicationStatusShortlisted: {
			domain.ApplicationStatusInterview,
			domain.ApplicationStatusRejected,
		},
		domain.ApplicationStatusInterview: {
			domain.ApplicationStatusOffered,
			domain.ApplicationStatusRejected,
		},
		domain.ApplicationStatusOffered: {
			domain.ApplicationStatusHired,
			domain.ApplicationStatusRejected,
		},
	}

	allowedStatuses, exists := validTransitions[current]
	if !exists {
		return false
	}

	for _, allowed := range allowedStatuses {
		if allowed == new {
			return true
		}
	}

	return false
}

// GetApplicationStatusHistory retrieves status history for an application
func (s *ApplicationService) GetApplicationStatusHistory(applicationID uuid.UUID) ([]domain.ApplicationStatusHistory, error) {
	return s.applicationHistoryRepo.GetByApplicationID(applicationID)
}

// GetApplicationStats retrieves application statistics
func (s *ApplicationService) GetApplicationStats() (map[string]interface{}, error) {
	// Placeholder for application stats
	stats := make(map[string]interface{})
	stats["total"] = 0
	stats["by_status"] = map[string]int{}
	stats["recent_count"] = 0

	return stats, nil
}

// GetApplicationByJobAndApplicant retrieves an application by job and applicant
func (s *ApplicationService) GetApplicationByJobAndApplicant(jobID, applicantID uuid.UUID) (*domain.Application, error) {
	return s.applicationRepo.GetByJobAndApplicant(jobID, applicantID)
}

// GetApplicantApplications retrieves all applications for an applicant with pagination
func (s *ApplicationService) GetApplicantApplications(applicantID uuid.UUID, limit, offset int) ([]domain.Application, int64, error) {
	return s.applicationRepo.GetApplicantApplications(applicantID, limit, offset)
}

// GetEmployerApplications retrieves all applications across all jobs for an employer
func (s *ApplicationService) GetEmployerApplications(employerID uuid.UUID, status, sortBy string, limit, offset int) ([]domain.Application, int64, error) {
	return s.applicationRepo.GetEmployerApplications(employerID, status, sortBy, limit, offset)
}
