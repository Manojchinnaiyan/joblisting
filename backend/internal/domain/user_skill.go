package domain

import (
	"time"

	"github.com/google/uuid"
)

// SkillLevel defines proficiency levels for skills
type SkillLevel string

const (
	SkillBeginner     SkillLevel = "BEGINNER"
	SkillIntermediate SkillLevel = "INTERMEDIATE"
	SkillAdvanced     SkillLevel = "ADVANCED"
	SkillExpert       SkillLevel = "EXPERT"
)

// UserSkill represents a user's skill with proficiency level
type UserSkill struct {
	ID     uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`
	UserID uuid.UUID `gorm:"type:uuid;not null" json:"user_id"`

	// Skill Info
	Name            string      `gorm:"type:varchar(100);not null" json:"name"`
	Level           SkillLevel  `gorm:"type:skill_level;default:'INTERMEDIATE'" json:"level"`
	YearsExperience *float32    `gorm:"type:decimal(3,1)" json:"years_experience"`

	// Relationships
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`

	// Timestamps
	CreatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName specifies the table name for UserSkill
func (UserSkill) TableName() string {
	return "user_skills"
}

// Validate performs basic validation
func (s *UserSkill) Validate() error {
	if s.Name == "" {
		return ErrInvalidInput
	}
	if s.YearsExperience != nil && *s.YearsExperience < 0 {
		return ErrInvalidInput
	}
	return nil
}

// IsBeginner checks if skill level is beginner
func (s *UserSkill) IsBeginner() bool {
	return s.Level == SkillBeginner
}

// IsIntermediate checks if skill level is intermediate
func (s *UserSkill) IsIntermediate() bool {
	return s.Level == SkillIntermediate
}

// IsAdvanced checks if skill level is advanced
func (s *UserSkill) IsAdvanced() bool {
	return s.Level == SkillAdvanced
}

// IsExpert checks if skill level is expert
func (s *UserSkill) IsExpert() bool {
	return s.Level == SkillExpert
}

// GetProficiencyScore returns a numeric score based on level (0-100)
func (s *UserSkill) GetProficiencyScore() int {
	switch s.Level {
	case SkillBeginner:
		return 25
	case SkillIntermediate:
		return 50
	case SkillAdvanced:
		return 75
	case SkillExpert:
		return 100
	default:
		return 0
	}
}
