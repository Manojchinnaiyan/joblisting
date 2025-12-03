package service

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"job-platform/internal/storage"
	"mime/multipart"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ResumeService handles resume business logic
type ResumeService struct {
	resumeRepo     *repository.ResumeRepository
	profileService *ProfileService
	storageClient  *storage.MinioClient
	db             *gorm.DB
	maxResumes     int
	maxSizeMB      int64
	urlExpiry      time.Duration
	bucket         string
}

// NewResumeService creates a new resume service
func NewResumeService(
	resumeRepo *repository.ResumeRepository,
	profileService *ProfileService,
	storageClient *storage.MinioClient,
	db *gorm.DB,
	maxResumes int,
	maxSizeMB int64,
	urlExpiryHours int,
	bucket string,
) *ResumeService {
	return &ResumeService{
		resumeRepo:     resumeRepo,
		profileService: profileService,
		storageClient:  storageClient,
		db:             db,
		maxResumes:     maxResumes,
		maxSizeMB:      maxSizeMB,
		urlExpiry:      time.Duration(urlExpiryHours) * time.Hour,
		bucket:         bucket,
	}
}

// UpdateResumeInput contains fields for updating resume metadata
type UpdateResumeInput struct {
	Title *string
}

// UploadResume uploads a new resume
func (s *ResumeService) UploadResume(userID uuid.UUID, file *multipart.FileHeader, title string) (*domain.Resume, error) {
	// Check if user can upload more resumes
	canUpload, err := s.CanUploadResume(userID)
	if err != nil {
		return nil, err
	}
	if !canUpload {
		return nil, domain.ErrMaxResumesReached
	}

	// Validate file
	if err := s.ValidateResumeFile(file); err != nil {
		return nil, err
	}

	// Generate unique filename
	uniqueFilename := storage.GenerateUniqueFileName(file.Filename)
	filePath := storage.GenerateFilePath(userID, s.bucket, uniqueFilename)

	// Upload to MinIO
	uploadResult, err := s.storageClient.UploadFile(s.bucket, file, filePath)
	if err != nil {
		return nil, domain.ErrResumeUploadFailed
	}

	// Check if this is the first resume (make it primary)
	count, _ := s.resumeRepo.CountUserResumes(userID)
	isPrimary := count == 0

	// Create resume record
	resume := &domain.Resume{
		UserID:       userID,
		FileName:     uniqueFilename,
		OriginalName: file.Filename,
		FilePath:     uploadResult.Path,
		FileSize:     uploadResult.Size,
		MimeType:     uploadResult.ContentType,
		Title:        &title,
		IsPrimary:    isPrimary,
	}

	if err := s.resumeRepo.Create(resume); err != nil {
		// Attempt to delete uploaded file if database insert fails
		_ = s.storageClient.DeleteFile(s.bucket, filePath)
		return nil, err
	}

	// Update profile completeness
	_ = s.profileService.UpdateCompletenessScore(userID)

	return resume, nil
}

// GetUserResumes retrieves all resumes for a user
func (s *ResumeService) GetUserResumes(userID uuid.UUID) ([]domain.Resume, error) {
	return s.resumeRepo.GetUserResumes(userID)
}

// GetResumeByID retrieves a resume by ID
func (s *ResumeService) GetResumeByID(resumeID, userID uuid.UUID) (*domain.Resume, error) {
	return s.resumeRepo.GetByIDAndUserID(resumeID, userID)
}

// UpdateResume updates resume metadata
func (s *ResumeService) UpdateResume(resumeID, userID uuid.UUID, input UpdateResumeInput) (*domain.Resume, error) {
	resume, err := s.resumeRepo.GetByIDAndUserID(resumeID, userID)
	if err != nil {
		return nil, err
	}

	if input.Title != nil {
		resume.Title = input.Title
	}

	if err := s.resumeRepo.Update(resume); err != nil {
		return nil, err
	}

	return resume, nil
}

// DeleteResume deletes a resume
func (s *ResumeService) DeleteResume(resumeID, userID uuid.UUID) error {
	resume, err := s.resumeRepo.GetByIDAndUserID(resumeID, userID)
	if err != nil {
		return err
	}

	// If this is the primary resume and there are others, don't allow deletion
	if resume.IsPrimary {
		count, _ := s.resumeRepo.CountUserResumes(userID)
		if count > 1 {
			return domain.ErrCannotDeletePrimaryResume
		}
	}

	// Soft delete from database
	if err := s.resumeRepo.Delete(resumeID); err != nil {
		return err
	}

	// Delete file from storage (async, don't fail if it errors)
	go func() {
		_ = s.storageClient.DeleteFile(s.bucket, resume.FilePath)
	}()

	// Update profile completeness
	_ = s.profileService.UpdateCompletenessScore(userID)

	return nil
}

// SetPrimaryResume sets a resume as primary
func (s *ResumeService) SetPrimaryResume(resumeID, userID uuid.UUID) error {
	// Verify ownership
	_, err := s.resumeRepo.GetByIDAndUserID(resumeID, userID)
	if err != nil {
		return err
	}

	return s.resumeRepo.SetPrimary(resumeID, userID)
}

// GetPrimaryResume retrieves the primary resume for a user
func (s *ResumeService) GetPrimaryResume(userID uuid.UUID) (*domain.Resume, error) {
	return s.resumeRepo.GetPrimaryResume(userID)
}

// GetResumeDownloadURL generates a signed download URL
func (s *ResumeService) GetResumeDownloadURL(resumeID, userID uuid.UUID) (string, error) {
	resume, err := s.resumeRepo.GetByIDAndUserID(resumeID, userID)
	if err != nil {
		return "", err
	}

	// Generate signed URL
	url, err := s.storageClient.GetSignedURL(s.bucket, resume.FilePath, s.urlExpiry)
	if err != nil {
		return "", domain.ErrStorageDownloadFailed
	}

	// Increment download count (async)
	go func() {
		_ = s.resumeRepo.IncrementDownloadCount(resumeID)
	}()

	return url, nil
}

// ValidateResumeFile validates a resume file
func (s *ResumeService) ValidateResumeFile(file *multipart.FileHeader) error {
	allowedTypes := []string{"pdf", "doc", "docx"}
	return s.storageClient.ValidateFile(file, allowedTypes, s.maxSizeMB)
}

// CanUploadResume checks if user can upload more resumes
func (s *ResumeService) CanUploadResume(userID uuid.UUID) (bool, error) {
	count, err := s.resumeRepo.CountUserResumes(userID)
	if err != nil {
		return false, err
	}
	return count < int64(s.maxResumes), nil
}

// IncrementDownloadCount increments the download counter
func (s *ResumeService) IncrementDownloadCount(resumeID uuid.UUID) error {
	return s.resumeRepo.IncrementDownloadCount(resumeID)
}

// GetResumeForDownload retrieves resume and generates download URL (for employers/admins)
func (s *ResumeService) GetResumeForDownload(resumeID uuid.UUID, requesterID uuid.UUID, requesterRole string) (string, error) {
	resume, err := s.resumeRepo.GetByID(resumeID)
	if err != nil {
		return "", err
	}

	// Check permissions
	// Owner can always download
	if resume.UserID == requesterID {
		return s.GetResumeDownloadURL(resumeID, requesterID)
	}

	// Employers and admins can download if they have access to the candidate
	if requesterRole == string(domain.RoleEmployer) || requesterRole == string(domain.RoleAdmin) {
		// Generate signed URL
		url, err := s.storageClient.GetSignedURL(s.bucket, resume.FilePath, s.urlExpiry)
		if err != nil {
			return "", domain.ErrStorageDownloadFailed
		}

		// Increment download count
		go func() {
			_ = s.resumeRepo.IncrementDownloadCount(resumeID)
		}()

		return url, nil
	}

	return "", domain.ErrForbidden
}

// GetResumesByUserID retrieves resumes for a specific user (admin/employer access)
func (s *ResumeService) GetResumesByUserID(targetUserID uuid.UUID, requesterID uuid.UUID, requesterRole string) ([]domain.Resume, error) {
	// Owner can always view
	if targetUserID == requesterID {
		return s.resumeRepo.GetUserResumes(targetUserID)
	}

	// Employers and admins can view
	if requesterRole == string(domain.RoleEmployer) || requesterRole == string(domain.RoleAdmin) {
		return s.resumeRepo.GetUserResumes(targetUserID)
	}

	return nil, domain.ErrForbidden
}

// GetResumeStats retrieves resume statistics (admin)
func (s *ResumeService) GetResumeStats() (map[string]interface{}, error) {
	return s.resumeRepo.GetResumeStats()
}

// HardDeleteResume permanently deletes a resume (admin)
func (s *ResumeService) HardDeleteResume(resumeID uuid.UUID) error {
	resume, err := s.resumeRepo.GetByID(resumeID)
	if err != nil {
		return err
	}

	// Delete from database
	if err := s.resumeRepo.HardDelete(resumeID); err != nil {
		return err
	}

	// Delete file from storage
	if err := s.storageClient.DeleteFile(s.bucket, resume.FilePath); err != nil {
		return domain.ErrStorageDeleteFailed
	}

	return nil
}
