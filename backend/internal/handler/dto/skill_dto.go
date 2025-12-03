package dto

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
)

// AddSkillRequest contains fields for adding a skill
type AddSkillRequest struct {
	Name             string  `json:"name" binding:"required"`
	Level            string  `json:"level" binding:"required"` // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
	YearsOfExperience *int   `json:"years_of_experience"`
}

// UpdateSkillRequest contains fields for updating a skill
type UpdateSkillRequest struct {
	Name             *string `json:"name"`
	Level            *string `json:"level"`
	YearsOfExperience *int   `json:"years_of_experience"`
}

// BulkAddSkillsRequest contains fields for adding multiple skills
type BulkAddSkillsRequest struct {
	Skills []AddSkillRequest `json:"skills" binding:"required,dive"`
}

// SkillResponse represents a skill response
type SkillResponse struct {
	ID                uuid.UUID `json:"id"`
	UserID            uuid.UUID `json:"user_id"`
	Name              string    `json:"name"`
	Level             string    `json:"level"`
	YearsOfExperience *float32  `json:"years_of_experience"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// SkillListResponse contains list of skills
type SkillListResponse struct {
	Skills    []SkillResponse          `json:"skills"`
	Total     int                      `json:"total"`
	ByLevel   map[string]int           `json:"by_level"`
	TopSkills []string                 `json:"top_skills"`
}

// SkillSearchResponse contains skill search results
type SkillSearchResponse struct {
	Skills []string `json:"skills"`
	Total  int      `json:"total"`
}

// TopSkillsResponse contains popular skills
type TopSkillsResponse struct {
	Skills []TopSkillItem `json:"skills"`
}

// TopSkillItem represents a popular skill
type TopSkillItem struct {
	Name  string `json:"name"`
	Count int64  `json:"count"`
}

// ToSkillResponse converts domain.UserSkill to SkillResponse
func ToSkillResponse(skill *domain.UserSkill) *SkillResponse {
	return &SkillResponse{
		ID:                skill.ID,
		UserID:            skill.UserID,
		Name:              skill.Name,
		Level:             string(skill.Level),
		YearsOfExperience: skill.YearsExperience, // Note: YearsExperience not YearsOfExperience in domain
		CreatedAt:         skill.CreatedAt,
		UpdatedAt:         skill.UpdatedAt,
	}
}
