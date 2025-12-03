package repository

import (
	"job-platform/internal/domain"
	"strings"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ProfileRepository handles user profile data access
type ProfileRepository struct {
	db *gorm.DB
}

// NewProfileRepository creates a new profile repository
func NewProfileRepository(db *gorm.DB) *ProfileRepository {
	return &ProfileRepository{db: db}
}

// Create creates a new user profile
func (r *ProfileRepository) Create(profile *domain.UserProfile) error {
	return r.db.Create(profile).Error
}

// GetByUserID retrieves a profile by user ID
func (r *ProfileRepository) GetByUserID(userID uuid.UUID) (*domain.UserProfile, error) {
	var profile domain.UserProfile
	err := r.db.Where("user_id = ?", userID).First(&profile).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrProfileNotFound
		}
		return nil, err
	}
	return &profile, nil
}

// GetByID retrieves a profile by ID
func (r *ProfileRepository) GetByID(id uuid.UUID) (*domain.UserProfile, error) {
	var profile domain.UserProfile
	err := r.db.Where("id = ?", id).First(&profile).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrProfileNotFound
		}
		return nil, err
	}
	return &profile, nil
}

// GetWithUser retrieves a profile with user information
func (r *ProfileRepository) GetWithUser(userID uuid.UUID) (*domain.UserProfile, error) {
	var profile domain.UserProfile
	err := r.db.Preload("User").Where("user_id = ?", userID).First(&profile).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.ErrProfileNotFound
		}
		return nil, err
	}
	return &profile, nil
}

// Update updates a user profile
func (r *ProfileRepository) Update(profile *domain.UserProfile) error {
	return r.db.Save(profile).Error
}

// Delete deletes a user profile
func (r *ProfileRepository) Delete(userID uuid.UUID) error {
	return r.db.Where("user_id = ?", userID).Delete(&domain.UserProfile{}).Error
}

// UpdateCompleteness updates the completeness score
func (r *ProfileRepository) UpdateCompleteness(userID uuid.UUID, score int) error {
	return r.db.Model(&domain.UserProfile{}).
		Where("user_id = ?", userID).
		Update("completeness_score", score).Error
}

// Exists checks if a profile exists for a user
func (r *ProfileRepository) Exists(userID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.UserProfile{}).Where("user_id = ?", userID).Count(&count).Error
	return count > 0, err
}

// ListAll retrieves all profiles with pagination
func (r *ProfileRepository) ListAll(limit, offset int) ([]domain.UserProfile, int64, error) {
	var profiles []domain.UserProfile
	var total int64

	// Count total
	if err := r.db.Model(&domain.UserProfile{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := r.db.Preload("User").
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&profiles).Error

	return profiles, total, err
}

// SearchProfiles searches profiles based on filters
func (r *ProfileRepository) SearchProfiles(filters map[string]interface{}, limit, offset int) ([]domain.UserProfile, int64, error) {
	var profiles []domain.UserProfile
	var total int64

	query := r.db.Model(&domain.UserProfile{}).Joins("JOIN users ON users.id = user_profiles.user_id")

	// Only return job seeker profiles (not employers or admins)
	query = query.Where("users.role = ?", string(domain.RoleJobSeeker))

	// Apply filters
	if city, ok := filters["city"].(string); ok && city != "" {
		query = query.Where("user_profiles.city ILIKE ?", "%"+city+"%")
	}
	if country, ok := filters["country"].(string); ok && country != "" {
		query = query.Where("user_profiles.country ILIKE ?", "%"+country+"%")
	}
	if minExp, ok := filters["min_experience"].(float32); ok {
		query = query.Where("user_profiles.total_experience_years >= ?", minExp)
	}
	if maxExp, ok := filters["max_experience"].(float32); ok {
		query = query.Where("user_profiles.total_experience_years <= ?", maxExp)
	}
	if openToWork, ok := filters["open_to_opportunities"].(bool); ok {
		query = query.Where("user_profiles.open_to_opportunities = ?", openToWork)
	}

	// Handle visibility as array or string
	if visibilityArr, ok := filters["visibility"].([]string); ok && len(visibilityArr) > 0 {
		query = query.Where("user_profiles.visibility IN ?", visibilityArr)
	} else if visibility, ok := filters["visibility"].(string); ok && visibility != "" {
		query = query.Where("user_profiles.visibility = ?", visibility)
	}

	// Handle keyword search - search in user name, headline, bio, current_title, current_company
	if keyword, ok := filters["keyword"].(string); ok && keyword != "" {
		searchPattern := "%" + keyword + "%"
		query = query.Where(
			"users.first_name ILIKE ? OR users.last_name ILIKE ? OR user_profiles.headline ILIKE ? OR user_profiles.bio ILIKE ? OR user_profiles.current_title ILIKE ? OR user_profiles.current_company ILIKE ? OR CONCAT(users.first_name, ' ', users.last_name) ILIKE ?",
			searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern,
		)
	}

	// Handle locations filter (array of location strings)
	if locations, ok := filters["locations"].([]string); ok && len(locations) > 0 {
		locationConditions := r.db.Where("1 = 0") // Start with false
		for _, loc := range locations {
			locPattern := "%" + loc + "%"
			locationConditions = locationConditions.Or(
				"user_profiles.city ILIKE ? OR user_profiles.state ILIKE ? OR user_profiles.country ILIKE ?",
				locPattern, locPattern, locPattern,
			)
		}
		query = query.Where(locationConditions)
	}

	// Handle skills filter - requires joining with user_skills table
	if skills, ok := filters["skills"].([]string); ok && len(skills) > 0 {
		// Use subquery to find users with matching skills
		skillSubquery := r.db.Table("user_skills").
			Select("user_id").
			Where("LOWER(name) IN ?", toLowerStrings(skills)).
			Group("user_id")
		query = query.Where("user_profiles.user_id IN (?)", skillSubquery)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.Preload("User").
		Select("user_profiles.*").
		Limit(limit).
		Offset(offset).
		Order("user_profiles.updated_at DESC").
		Find(&profiles).Error

	return profiles, total, err
}

// toLowerStrings converts a slice of strings to lowercase
func toLowerStrings(strs []string) []string {
	result := make([]string, len(strs))
	for i, s := range strs {
		result[i] = strings.ToLower(s)
	}
	return result
}

// GetVisibleProfiles retrieves profiles visible to employers
func (r *ProfileRepository) GetVisibleProfiles(limit, offset int) ([]domain.UserProfile, int64, error) {
	var profiles []domain.UserProfile
	var total int64

	query := r.db.Model(&domain.UserProfile{}).
		Where("visibility IN ?", []string{
			string(domain.VisibilityPublic),
			string(domain.VisibilityEmployersOnly),
		}).
		Where("open_to_opportunities = ?", true)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.Preload("User").
		Limit(limit).
		Offset(offset).
		Order("updated_at DESC").
		Find(&profiles).Error

	return profiles, total, err
}

// GetByVisibility retrieves profiles by visibility setting
func (r *ProfileRepository) GetByVisibility(visibility domain.ProfileVisibility, limit, offset int) ([]domain.UserProfile, int64, error) {
	var profiles []domain.UserProfile
	var total int64

	query := r.db.Model(&domain.UserProfile{}).Where("visibility = ?", visibility)

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.Preload("User").
		Limit(limit).
		Offset(offset).
		Order("updated_at DESC").
		Find(&profiles).Error

	return profiles, total, err
}

// GetIncompleteProfiles retrieves profiles below minimum completeness
func (r *ProfileRepository) GetIncompleteProfiles(minScore int) ([]domain.UserProfile, error) {
	var profiles []domain.UserProfile
	err := r.db.Where("completeness_score < ?", minScore).
		Preload("User").
		Find(&profiles).Error
	return profiles, err
}

// GetProfileStats retrieves profile statistics
func (r *ProfileRepository) GetProfileStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total profiles
	var total int64
	if err := r.db.Model(&domain.UserProfile{}).Count(&total).Error; err != nil {
		return nil, err
	}
	stats["total_profiles"] = total

	// Open to opportunities
	var openCount int64
	if err := r.db.Model(&domain.UserProfile{}).
		Where("open_to_opportunities = ?", true).
		Count(&openCount).Error; err != nil {
		return nil, err
	}
	stats["open_to_opportunities"] = openCount

	// By visibility
	visibilityCounts := make(map[string]int64)
	visibilities := []domain.ProfileVisibility{
		domain.VisibilityPublic,
		domain.VisibilityEmployersOnly,
		domain.VisibilityPrivate,
		domain.VisibilityAppliedOnly,
	}
	for _, vis := range visibilities {
		var count int64
		if err := r.db.Model(&domain.UserProfile{}).
			Where("visibility = ?", vis).
			Count(&count).Error; err != nil {
			return nil, err
		}
		visibilityCounts[string(vis)] = count
	}
	stats["by_visibility"] = visibilityCounts

	// Average completeness
	var avgCompleteness float64
	if err := r.db.Model(&domain.UserProfile{}).
		Select("AVG(completeness_score)").
		Scan(&avgCompleteness).Error; err != nil {
		return nil, err
	}
	stats["avg_completeness"] = avgCompleteness

	return stats, nil
}

// UpdateAvatarURL updates the avatar URL
func (r *ProfileRepository) UpdateAvatarURL(userID uuid.UUID, avatarURL string) error {
	return r.db.Model(&domain.UserProfile{}).
		Where("user_id = ?", userID).
		Update("avatar_url", avatarURL).Error
}

// RemoveAvatarURL removes the avatar URL
func (r *ProfileRepository) RemoveAvatarURL(userID uuid.UUID) error {
	return r.db.Model(&domain.UserProfile{}).
		Where("user_id = ?", userID).
		Update("avatar_url", nil).Error
}

// IncrementViews increments the profile view count
func (r *ProfileRepository) IncrementViews(userID uuid.UUID) error {
	return r.db.Model(&domain.UserProfile{}).
		Where("user_id = ?", userID).
		UpdateColumn("profile_views", gorm.Expr("profile_views + 1")).Error
}
