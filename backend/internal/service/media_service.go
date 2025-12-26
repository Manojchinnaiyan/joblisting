package service

import (
	"fmt"
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"job-platform/internal/storage"
	"mime/multipart"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// MediaService handles company media business logic
type MediaService struct {
	mediaRepo   *repository.MediaRepository
	companyRepo *repository.CompanyRepository
	storage     *storage.MinioClient
}

// NewMediaService creates a new media service
func NewMediaService(
	mediaRepo *repository.MediaRepository,
	companyRepo *repository.CompanyRepository,
	storage *storage.MinioClient,
) *MediaService {
	return &MediaService{
		mediaRepo:   mediaRepo,
		companyRepo: companyRepo,
		storage:     storage,
	}
}

// UploadImage uploads a company image
func (s *MediaService) UploadImage(companyID uuid.UUID, file *multipart.FileHeader, title, description string) (*domain.CompanyMedia, error) {
	// Check if company exists
	_, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return nil, domain.ErrCompanyNotFound
	}

	// Generate unique filename and path
	uniqueFilename := storage.GenerateUniqueFileName(file.Filename)
	filePath := fmt.Sprintf("media/%s/%s", companyID.String(), uniqueFilename)

	// Upload to MinIO
	result, err := s.storage.UploadFile("companies", file, filePath)
	if err != nil {
		return nil, err
	}

	// Get max sort order
	maxSort, err := s.mediaRepo.GetMaxSortOrder(companyID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	media := &domain.CompanyMedia{
		ID:          uuid.New(),
		CompanyID:   companyID,
		Type:        domain.MediaTypeImage,
		URL:         result.URL,
		Title:       &title,
		Description: &description,
		SortOrder:   maxSort + 1,
		IsFeatured:  false,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.mediaRepo.Create(media); err != nil {
		return nil, err
	}

	return media, nil
}

// AddVideo adds a video URL to company media
func (s *MediaService) AddVideo(companyID uuid.UUID, url, thumbnailURL, title, description string) (*domain.CompanyMedia, error) {
	// Check if company exists
	_, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return nil, domain.ErrCompanyNotFound
	}

	// Get max sort order
	maxSort, err := s.mediaRepo.GetMaxSortOrder(companyID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	media := &domain.CompanyMedia{
		ID:           uuid.New(),
		CompanyID:    companyID,
		Type:         domain.MediaTypeVideo,
		URL:          url,
		ThumbnailURL: &thumbnailURL,
		Title:        &title,
		Description:  &description,
		SortOrder:    maxSort + 1,
		IsFeatured:   false,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := s.mediaRepo.Create(media); err != nil {
		return nil, err
	}

	return media, nil
}

// GetMediaByID retrieves a media item by ID
func (s *MediaService) GetMediaByID(id uuid.UUID) (*domain.CompanyMedia, error) {
	media, err := s.mediaRepo.GetByID(id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrMediaNotFound
		}
		return nil, err
	}
	return media, nil
}

// GetCompanyMedia retrieves all media for a company
func (s *MediaService) GetCompanyMedia(companyID uuid.UUID) ([]*domain.CompanyMedia, error) {
	return s.mediaRepo.GetCompanyMedia(companyID)
}

// GetMediaByType retrieves media by type for a company
func (s *MediaService) GetMediaByType(companyID uuid.UUID, mediaType domain.MediaType) ([]*domain.CompanyMedia, error) {
	return s.mediaRepo.GetByType(companyID, mediaType)
}

// GetFeaturedMedia retrieves featured media for a company
func (s *MediaService) GetFeaturedMedia(companyID uuid.UUID) ([]*domain.CompanyMedia, error) {
	return s.mediaRepo.GetFeaturedMedia(companyID)
}

// GetImages retrieves all images for a company
func (s *MediaService) GetImages(companyID uuid.UUID) ([]*domain.CompanyMedia, error) {
	return s.mediaRepo.GetImages(companyID)
}

// GetVideos retrieves all videos for a company
func (s *MediaService) GetVideos(companyID uuid.UUID) ([]*domain.CompanyMedia, error) {
	return s.mediaRepo.GetVideos(companyID)
}

// UpdateMedia updates a media item
func (s *MediaService) UpdateMedia(id uuid.UUID, title, description string) (*domain.CompanyMedia, error) {
	media, err := s.mediaRepo.GetByID(id)
	if err != nil {
		return nil, domain.ErrMediaNotFound
	}

	media.Title = &title
	media.Description = &description
	media.UpdatedAt = time.Now()

	if err := s.mediaRepo.Update(media); err != nil {
		return nil, err
	}

	return media, nil
}

// DeleteMedia deletes a media item
func (s *MediaService) DeleteMedia(id uuid.UUID) error {
	media, err := s.mediaRepo.GetByID(id)
	if err != nil {
		return domain.ErrMediaNotFound
	}

	// Delete from storage if it's an uploaded image
	if media.Type == domain.MediaTypeImage {
		// Note: You may want to delete from MinIO here
		// s.storage.DeleteFile(media.URL)
	}

	return s.mediaRepo.Delete(id)
}

// SetFeatured sets a media item as featured
func (s *MediaService) SetFeatured(id uuid.UUID, isFeatured bool) error {
	media, err := s.mediaRepo.GetByID(id)
	if err != nil {
		return domain.ErrMediaNotFound
	}

	// If setting as featured, unfeature all others
	if isFeatured {
		if err := s.mediaRepo.UnfeatureAll(media.CompanyID); err != nil {
			return err
		}
	}

	return s.mediaRepo.SetFeatured(id, isFeatured)
}

// ReorderMedia updates sort orders for multiple media items
func (s *MediaService) ReorderMedia(updates map[uuid.UUID]int) error {
	return s.mediaRepo.ReorderMedia(updates)
}

// UpdateSortOrder updates the sort order of a media item
func (s *MediaService) UpdateSortOrder(id uuid.UUID, sortOrder int) error {
	_, err := s.mediaRepo.GetByID(id)
	if err != nil {
		return domain.ErrMediaNotFound
	}

	return s.mediaRepo.UpdateSortOrder(id, sortOrder)
}

// CountByCompany counts media items for a company
func (s *MediaService) CountByCompany(companyID uuid.UUID) (int64, error) {
	return s.mediaRepo.CountByCompany(companyID)
}

// CountByType counts media items by type for a company
func (s *MediaService) CountByType(companyID uuid.UUID, mediaType domain.MediaType) (int64, error) {
	return s.mediaRepo.CountByType(companyID, mediaType)
}

// BulkUploadImages uploads multiple images for a company
func (s *MediaService) BulkUploadImages(companyID uuid.UUID, files []*multipart.FileHeader) ([]*domain.CompanyMedia, error) {
	// Check if company exists
	_, err := s.companyRepo.GetByID(companyID)
	if err != nil {
		return nil, domain.ErrCompanyNotFound
	}

	var mediaItems []*domain.CompanyMedia

	// Get max sort order
	maxSort, err := s.mediaRepo.GetMaxSortOrder(companyID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	for i, file := range files {
		// Generate unique filename and path
		uniqueFilename := storage.GenerateUniqueFileName(file.Filename)
		filePath := fmt.Sprintf("media/%s/%s", companyID.String(), uniqueFilename)

		// Upload to MinIO
		result, err := s.storage.UploadFile("companies", file, filePath)
		if err != nil {
			return nil, err
		}

		media := &domain.CompanyMedia{
			ID:         uuid.New(),
			CompanyID:  companyID,
			Type:       domain.MediaTypeImage,
			URL:        result.URL,
			SortOrder:  maxSort + i + 1,
			IsFeatured: false,
			CreatedAt:  now,
			UpdatedAt:  now,
		}

		if err := s.mediaRepo.Create(media); err != nil {
			return nil, err
		}

		mediaItems = append(mediaItems, media)
	}

	return mediaItems, nil
}
