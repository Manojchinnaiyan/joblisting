package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"time"

	"github.com/google/uuid"
)

// SavedJobService handles saved job business logic
type SavedJobService struct {
	savedJobRepo *repository.SavedJobRepository
	jobRepo      *repository.JobRepository
}

// NewSavedJobService creates a new saved job service
func NewSavedJobService(
	savedJobRepo *repository.SavedJobRepository,
	jobRepo *repository.JobRepository,
) *SavedJobService {
	return &SavedJobService{
		savedJobRepo: savedJobRepo,
		jobRepo:      jobRepo,
	}
}

// SaveJob saves/bookmarks a job for a user
func (s *SavedJobService) SaveJob(userID, jobID uuid.UUID, notes string) error {
	// Check if job exists
	_, err := s.jobRepo.GetByID(jobID)
	if err != nil {
		return domain.ErrJobNotFound
	}

	// Check if already saved
	exists, err := s.savedJobRepo.Exists(userID, jobID)
	if err != nil {
		return err
	}
	if exists {
		return domain.ErrJobAlreadySaved
	}

	// Create saved job
	savedJob := &domain.SavedJob{
		ID:        uuid.New(),
		UserID:    userID,
		JobID:     jobID,
		Notes:     notes,
		CreatedAt: time.Now(),
	}

	return s.savedJobRepo.Create(savedJob)
}

// UnsaveJob removes a saved job
func (s *SavedJobService) UnsaveJob(userID, jobID uuid.UUID) error {
	// Check if job is saved
	exists, err := s.savedJobRepo.Exists(userID, jobID)
	if err != nil {
		return err
	}
	if !exists {
		return domain.ErrJobNotSaved
	}

	return s.savedJobRepo.Delete(userID, jobID)
}

// GetSavedJobs retrieves all saved jobs for a user
func (s *SavedJobService) GetSavedJobs(userID uuid.UUID, limit, offset int) ([]domain.SavedJob, int64, error) {
	return s.savedJobRepo.GetByUserID(userID, limit, offset)
}

// IsJobSaved checks if a job is saved by a user
func (s *SavedJobService) IsJobSaved(userID, jobID uuid.UUID) (bool, error) {
	return s.savedJobRepo.Exists(userID, jobID)
}

// UpdateNotes updates notes for a saved job
func (s *SavedJobService) UpdateNotes(userID, jobID uuid.UUID, notes string) error {
	// Check if job is saved
	exists, err := s.savedJobRepo.Exists(userID, jobID)
	if err != nil {
		return err
	}
	if !exists {
		return domain.ErrJobNotSaved
	}

	return s.savedJobRepo.UpdateNotes(userID, jobID, notes)
}
