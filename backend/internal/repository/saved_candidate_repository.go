package repository

import (
	"job-platform/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// SavedCandidateRepository handles saved candidate data access
type SavedCandidateRepository struct {
	db *gorm.DB
}

// NewSavedCandidateRepository creates a new saved candidate repository
func NewSavedCandidateRepository(db *gorm.DB) *SavedCandidateRepository {
	return &SavedCandidateRepository{db: db}
}

// Create creates a new saved candidate entry
func (r *SavedCandidateRepository) Create(saved *domain.SavedCandidate) error {
	return r.db.Create(saved).Error
}

// GetByID retrieves a saved candidate by ID
func (r *SavedCandidateRepository) GetByID(id uuid.UUID) (*domain.SavedCandidate, error) {
	var saved domain.SavedCandidate
	err := r.db.Preload("Candidate").Preload("Candidate.Profile").Where("id = ?", id).First(&saved).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrCandidateNotSaved
		}
		return nil, err
	}
	return &saved, nil
}

// GetByEmployerAndCandidate retrieves a saved candidate by employer and candidate IDs
func (r *SavedCandidateRepository) GetByEmployerAndCandidate(employerID, candidateID uuid.UUID) (*domain.SavedCandidate, error) {
	var saved domain.SavedCandidate
	err := r.db.Where("employer_id = ? AND candidate_id = ?", employerID, candidateID).First(&saved).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrCandidateNotSaved
		}
		return nil, err
	}
	return &saved, nil
}

// GetEmployerSavedCandidates retrieves all saved candidates for an employer
func (r *SavedCandidateRepository) GetEmployerSavedCandidates(employerID uuid.UUID, limit, offset int) ([]domain.SavedCandidate, int64, error) {
	var saved []domain.SavedCandidate
	var total int64

	// Count total
	if err := r.db.Model(&domain.SavedCandidate{}).
		Where("employer_id = ?", employerID).
		Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results with candidate info
	err := r.db.Preload("Candidate").
		Preload("Candidate.Profile").
		Where("employer_id = ?", employerID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&saved).Error

	return saved, total, err
}

// GetByFolder retrieves saved candidates in a specific folder
func (r *SavedCandidateRepository) GetByFolder(employerID uuid.UUID, folder string, limit, offset int) ([]domain.SavedCandidate, int64, error) {
	var saved []domain.SavedCandidate
	var total int64

	query := r.db.Model(&domain.SavedCandidate{}).
		Where("employer_id = ?", employerID)

	if folder != "" {
		query = query.Where("folder = ?", folder)
	} else {
		query = query.Where("folder IS NULL OR folder = ''")
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.Preload("Candidate").
		Preload("Candidate.Profile").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&saved).Error

	return saved, total, err
}

// Update updates a saved candidate entry
func (r *SavedCandidateRepository) Update(saved *domain.SavedCandidate) error {
	return r.db.Save(saved).Error
}

// Delete deletes a saved candidate entry
func (r *SavedCandidateRepository) Delete(employerID, candidateID uuid.UUID) error {
	return r.db.Where("employer_id = ? AND candidate_id = ?", employerID, candidateID).
		Delete(&domain.SavedCandidate{}).Error
}

// DeleteByID deletes a saved candidate by ID
func (r *SavedCandidateRepository) DeleteByID(id uuid.UUID) error {
	return r.db.Where("id = ?", id).Delete(&domain.SavedCandidate{}).Error
}

// IsSaved checks if a candidate is saved by an employer
func (r *SavedCandidateRepository) IsSaved(employerID, candidateID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.SavedCandidate{}).
		Where("employer_id = ? AND candidate_id = ?", employerID, candidateID).
		Count(&count).Error
	return count > 0, err
}

// CountEmployerSavedCandidates counts saved candidates for an employer
func (r *SavedCandidateRepository) CountEmployerSavedCandidates(employerID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.SavedCandidate{}).
		Where("employer_id = ?", employerID).
		Count(&count).Error
	return count, err
}

// GetFolders retrieves all folder names for an employer
func (r *SavedCandidateRepository) GetFolders(employerID uuid.UUID) ([]string, error) {
	var folders []string
	err := r.db.Model(&domain.SavedCandidate{}).
		Select("DISTINCT folder").
		Where("employer_id = ? AND folder IS NOT NULL AND folder != ''", employerID).
		Order("folder ASC").
		Pluck("folder", &folders).Error
	return folders, err
}

// CountByFolder counts candidates in a folder
func (r *SavedCandidateRepository) CountByFolder(employerID uuid.UUID, folder string) (int64, error) {
	var count int64
	query := r.db.Model(&domain.SavedCandidate{}).
		Where("employer_id = ?", employerID)

	if folder != "" {
		query = query.Where("folder = ?", folder)
	} else {
		query = query.Where("folder IS NULL OR folder = ''")
	}

	err := query.Count(&count).Error
	return count, err
}

// UpdateNotes updates notes for a saved candidate
func (r *SavedCandidateRepository) UpdateNotes(employerID, candidateID uuid.UUID, notes string) error {
	return r.db.Model(&domain.SavedCandidate{}).
		Where("employer_id = ? AND candidate_id = ?", employerID, candidateID).
		Update("notes", notes).Error
}

// UpdateFolder updates folder for a saved candidate
func (r *SavedCandidateRepository) UpdateFolder(employerID, candidateID uuid.UUID, folder string) error {
	return r.db.Model(&domain.SavedCandidate{}).
		Where("employer_id = ? AND candidate_id = ?", employerID, candidateID).
		Update("folder", folder).Error
}

// GetCandidateSavers retrieves employers who saved a specific candidate
func (r *SavedCandidateRepository) GetCandidateSavers(candidateID uuid.UUID) ([]domain.SavedCandidate, error) {
	var saved []domain.SavedCandidate
	err := r.db.Preload("Employer").
		Where("candidate_id = ?", candidateID).
		Order("created_at DESC").
		Find(&saved).Error
	return saved, err
}

// DeleteEmployerSavedCandidates deletes all saved candidates for an employer
func (r *SavedCandidateRepository) DeleteEmployerSavedCandidates(employerID uuid.UUID) error {
	return r.db.Where("employer_id = ?", employerID).Delete(&domain.SavedCandidate{}).Error
}

// DeleteCandidateSavedEntries deletes all saved entries for a candidate
func (r *SavedCandidateRepository) DeleteCandidateSavedEntries(candidateID uuid.UUID) error {
	return r.db.Where("candidate_id = ?", candidateID).Delete(&domain.SavedCandidate{}).Error
}

// BulkSave saves multiple candidates at once
func (r *SavedCandidateRepository) BulkSave(saved []domain.SavedCandidate) error {
	return r.db.Create(&saved).Error
}
