package domain

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

// JSONB is a custom type for handling PostgreSQL JSONB columns
type JSONB map[string]interface{}

// Value implements the driver.Valuer interface for JSONB
func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan implements the sql.Scanner interface for JSONB
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("failed to scan JSONB: value is not []byte")
	}

	if len(bytes) == 0 {
		*j = make(JSONB)
		return nil
	}

	return json.Unmarshal(bytes, j)
}

// CompanyStatus represents the status of a company
type CompanyStatus string

const (
	CompanyStatusPending   CompanyStatus = "PENDING"
	CompanyStatusActive    CompanyStatus = "ACTIVE"
	CompanyStatusVerified  CompanyStatus = "VERIFIED"
	CompanyStatusSuspended CompanyStatus = "SUSPENDED"
	CompanyStatusRejected  CompanyStatus = "REJECTED"
)

// CompanySize represents the size category of a company
type CompanySize string

const (
	CompanySize1_10      CompanySize = "1-10"
	CompanySize11_50     CompanySize = "11-50"
	CompanySize51_200    CompanySize = "51-200"
	CompanySize201_500   CompanySize = "201-500"
	CompanySize501_1000  CompanySize = "501-1000"
	CompanySize1001_5000 CompanySize = "1001-5000"
	CompanySize5000Plus  CompanySize = "5000+"
)

// Company represents a company/employer profile
type Company struct {
	ID uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`

	// Basic Info
	Name        string  `gorm:"size:255;not null"`
	Slug        string  `gorm:"size:255;uniqueIndex;not null"`
	Tagline     *string `gorm:"size:255"`
	Description *string `gorm:"type:text"`

	// Industry
	Industry    string  `gorm:"size:100;not null"`
	SubIndustry *string `gorm:"size:100"`

	// Size & Type
	CompanySize CompanySize `gorm:"type:varchar(20);not null"`
	FoundedYear *int
	CompanyType *string `gorm:"size:50"`

	// Branding
	LogoURL       *string `gorm:"type:text"`
	CoverImageURL *string `gorm:"type:text"`
	BrandColor    *string `gorm:"size:7"`

	// Contact
	Website *string `gorm:"size:255"`
	Email   *string `gorm:"size:255"`
	Phone   *string `gorm:"size:20"`

	// Social Links
	LinkedInURL  *string `gorm:"column:linkedin_url;size:255"`
	TwitterURL   *string `gorm:"column:twitter_url;size:255"`
	FacebookURL  *string `gorm:"column:facebook_url;size:255"`
	InstagramURL *string `gorm:"column:instagram_url;size:255"`

	// Culture
	Mission            *string `gorm:"type:text"`
	Vision             *string `gorm:"type:text"`
	CultureDescription *string `gorm:"type:text"`

	// Status & Verification
	Status                 CompanyStatus  `gorm:"type:company_status;not null;default:'ACTIVE'"`
	IsVerified             bool           `gorm:"default:false"`
	VerifiedAt             *time.Time
	VerifiedBy             *uuid.UUID `gorm:"type:uuid"`
	VerificationDocuments  pq.StringArray `gorm:"type:text[]"`
	RejectionReason        *string        `gorm:"type:text"`

	// Featuring
	IsFeatured   bool       `gorm:"default:false"`
	FeaturedUntil *time.Time

	// Stats (denormalized for performance)
	TotalJobs     int     `gorm:"default:0"`
	ActiveJobs    int     `gorm:"default:0"`
	TotalEmployees int    `gorm:"default:0"`
	FollowersCount int    `gorm:"default:0"`
	ReviewsCount   int    `gorm:"default:0"`
	AverageRating  float32 `gorm:"type:decimal(2,1);default:0"`

	// Owner
	CreatedBy uuid.UUID `gorm:"type:uuid;not null"`
	Creator   *User     `gorm:"foreignKey:CreatedBy"`

	// Timestamps
	CreatedAt time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time  `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	DeletedAt *time.Time `gorm:"type:timestamp"`

	// Relationships
	TeamMembers []CompanyTeamMember `gorm:"foreignKey:CompanyID"`
	Locations   []CompanyLocation   `gorm:"foreignKey:CompanyID"`
	Benefits    []CompanyBenefit    `gorm:"foreignKey:CompanyID"`
	Media       []CompanyMedia      `gorm:"foreignKey:CompanyID"`
	Reviews     []CompanyReview     `gorm:"foreignKey:CompanyID"`
	Followers   []CompanyFollower   `gorm:"foreignKey:CompanyID"`
	Jobs        []Job               `gorm:"foreignKey:EmployerID"`
}

// TableName specifies the table name
func (Company) TableName() string {
	return "companies"
}

// IsActive checks if company is active
func (c *Company) IsActive() bool {
	return c.Status == CompanyStatusActive || c.Status == CompanyStatusVerified
}

// CanBeEdited checks if company can be edited
func (c *Company) CanBeEdited() bool {
	return c.Status != CompanyStatusSuspended && c.DeletedAt == nil
}

// TeamRole represents the role of a team member
type TeamRole string

const (
	TeamRoleOwner     TeamRole = "OWNER"
	TeamRoleAdmin     TeamRole = "ADMIN"
	TeamRoleRecruiter TeamRole = "RECRUITER"
	TeamRoleMember    TeamRole = "MEMBER"
)

// TeamMemberStatus represents the status of a team member
type TeamMemberStatus string

const (
	TeamMemberStatusActive   TeamMemberStatus = "ACTIVE"
	TeamMemberStatusInactive TeamMemberStatus = "INACTIVE"
	TeamMemberStatusPending  TeamMemberStatus = "PENDING"
)

// CompanyTeamMember represents a team member of a company
type CompanyTeamMember struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	CompanyID uuid.UUID `gorm:"type:uuid;not null;index"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`

	// Role & Status
	Role   TeamRole         `gorm:"type:team_role;not null;default:'MEMBER'"`
	Status TeamMemberStatus `gorm:"type:team_member_status;not null;default:'ACTIVE'"`

	// Permissions (JSON for flexibility)
	Permissions JSONB `gorm:"type:jsonb;default:'{}'"`

	// Invitation
	InvitedBy *uuid.UUID `gorm:"type:uuid"`
	InvitedAt *time.Time
	JoinedAt  *time.Time

	// Timestamps
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`

	// Relationships
	Company *Company `gorm:"foreignKey:CompanyID"`
	User    *User    `gorm:"foreignKey:UserID"`
	Inviter *User    `gorm:"foreignKey:InvitedBy"`
}

// TableName specifies the table name
func (CompanyTeamMember) TableName() string {
	return "company_team_members"
}

// IsOwner checks if member is owner
func (m *CompanyTeamMember) IsOwner() bool {
	return m.Role == TeamRoleOwner
}

// IsAdmin checks if member is admin or owner
func (m *CompanyTeamMember) IsAdmin() bool {
	return m.Role == TeamRoleOwner || m.Role == TeamRoleAdmin
}

// CanManageTeam checks if member can manage team
func (m *CompanyTeamMember) CanManageTeam() bool {
	return m.Role == TeamRoleOwner || m.Role == TeamRoleAdmin
}

// CanPostJobs checks if member can post jobs
func (m *CompanyTeamMember) CanPostJobs() bool {
	return m.Role == TeamRoleOwner || m.Role == TeamRoleAdmin || m.Role == TeamRoleRecruiter
}

// CanEditCompany checks if member can edit company profile
func (m *CompanyTeamMember) CanEditCompany() bool {
	return m.Role == TeamRoleOwner || m.Role == TeamRoleAdmin
}

// InvitationStatus represents the status of an invitation
type InvitationStatus string

const (
	InvitationStatusPending   InvitationStatus = "PENDING"
	InvitationStatusAccepted  InvitationStatus = "ACCEPTED"
	InvitationStatusDeclined  InvitationStatus = "DECLINED"
	InvitationStatusExpired   InvitationStatus = "EXPIRED"
	InvitationStatusCancelled InvitationStatus = "CANCELLED"
)

// CompanyInvitation represents an invitation to join a company team
type CompanyInvitation struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	CompanyID uuid.UUID `gorm:"type:uuid;not null;index"`

	// Invitee
	Email string   `gorm:"size:255;not null;index"`
	Role  TeamRole `gorm:"type:team_role;not null;default:'MEMBER'"`

	// Token
	Token string `gorm:"size:255;uniqueIndex;not null"`

	// Status
	Status InvitationStatus `gorm:"type:invitation_status;not null;default:'PENDING'"`

	// Inviter
	InvitedBy uuid.UUID `gorm:"type:uuid;not null"`

	// Dates
	ExpiresAt  time.Time  `gorm:"not null"`
	AcceptedAt *time.Time

	// Timestamps
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`

	// Relationships
	Company *Company `gorm:"foreignKey:CompanyID"`
	Inviter *User    `gorm:"foreignKey:InvitedBy"`
}

// TableName specifies the table name
func (CompanyInvitation) TableName() string {
	return "company_invitations"
}

// IsExpired checks if invitation is expired
func (i *CompanyInvitation) IsExpired() bool {
	return time.Now().After(i.ExpiresAt)
}

// IsPending checks if invitation is pending
func (i *CompanyInvitation) IsPending() bool {
	return i.Status == InvitationStatusPending && !i.IsExpired()
}

// CompanyLocation represents an office/location of a company
type CompanyLocation struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	CompanyID uuid.UUID `gorm:"type:uuid;not null;index"`

	// Location Info
	Name       string  `gorm:"size:255;not null"`
	Address    string  `gorm:"type:text;not null"`
	City       string  `gorm:"size:100;not null;index"`
	State      *string `gorm:"size:100"`
	Country    string  `gorm:"size:100;not null;index"`
	PostalCode *string `gorm:"size:20"`

	// Geo
	Latitude  *float64 `gorm:"type:decimal(10,8)"`
	Longitude *float64 `gorm:"type:decimal(11,8)"`

	// Contact
	Phone *string `gorm:"size:20"`
	Email *string `gorm:"size:255"`

	// Type
	IsHeadquarters bool `gorm:"default:false"`
	IsHiring       bool `gorm:"default:true"`

	// Timestamps
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`

	// Relationships
	Company *Company `gorm:"foreignKey:CompanyID"`
}

// TableName specifies the table name
func (CompanyLocation) TableName() string {
	return "company_locations"
}

// FullAddress returns the complete address string
func (l *CompanyLocation) FullAddress() string {
	address := l.Address + ", " + l.City
	if l.State != nil && *l.State != "" {
		address += ", " + *l.State
	}
	address += ", " + l.Country
	if l.PostalCode != nil && *l.PostalCode != "" {
		address += " " + *l.PostalCode
	}
	return address
}

// BenefitCategory represents the category of a company benefit
type BenefitCategory string

const (
	BenefitCategoryHealth                  BenefitCategory = "HEALTH"
	BenefitCategoryFinancial               BenefitCategory = "FINANCIAL"
	BenefitCategoryVacation                BenefitCategory = "VACATION"
	BenefitCategoryProfessionalDevelopment BenefitCategory = "PROFESSIONAL_DEVELOPMENT"
	BenefitCategoryOfficePerks             BenefitCategory = "OFFICE_PERKS"
	BenefitCategoryFamily                  BenefitCategory = "FAMILY"
	BenefitCategoryWellness                BenefitCategory = "WELLNESS"
	BenefitCategoryOther                   BenefitCategory = "OTHER"
)

// CompanyBenefit represents a benefit/perk offered by a company
type CompanyBenefit struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	CompanyID uuid.UUID `gorm:"type:uuid;not null;index"`

	// Benefit Info
	Title       string          `gorm:"size:255;not null"`
	Description *string         `gorm:"type:text"`
	Category    BenefitCategory `gorm:"type:benefit_category;not null"`
	Icon        *string         `gorm:"size:50"`

	// Order
	SortOrder int `gorm:"default:0"`

	// Timestamps
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`

	// Relationships
	Company *Company `gorm:"foreignKey:CompanyID"`
}

// TableName specifies the table name
func (CompanyBenefit) TableName() string {
	return "company_benefits"
}

// MediaType represents the type of media
type MediaType string

const (
	MediaTypeImage MediaType = "IMAGE"
	MediaTypeVideo MediaType = "VIDEO"
)

// CompanyMedia represents a media item (photo/video) in company gallery
type CompanyMedia struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	CompanyID uuid.UUID `gorm:"type:uuid;not null;index"`

	// Media Info
	Type         MediaType `gorm:"type:media_type;not null"`
	URL          string    `gorm:"type:text;not null"`
	ThumbnailURL *string   `gorm:"type:text"`
	Title        *string   `gorm:"size:255"`
	Description  *string   `gorm:"type:text"`

	// Order
	SortOrder  int  `gorm:"default:0"`
	IsFeatured bool `gorm:"default:false"`

	// Timestamps
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`

	// Relationships
	Company *Company `gorm:"foreignKey:CompanyID"`
}

// TableName specifies the table name
func (CompanyMedia) TableName() string {
	return "company_media"
}

// ReviewStatus represents the moderation status of a review
type ReviewStatus string

const (
	ReviewStatusPending  ReviewStatus = "PENDING"
	ReviewStatusApproved ReviewStatus = "APPROVED"
	ReviewStatusRejected ReviewStatus = "REJECTED"
)

// CompanyReview represents a review of a company by a job seeker
type CompanyReview struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	CompanyID uuid.UUID `gorm:"type:uuid;not null;index"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`

	// Ratings (1-5)
	OverallRating      int  `gorm:"not null;check:overall_rating >= 1 AND overall_rating <= 5"`
	CultureRating      *int `gorm:"check:culture_rating >= 1 AND culture_rating <= 5"`
	WorkLifeRating     *int `gorm:"check:work_life_rating >= 1 AND work_life_rating <= 5"`
	CompensationRating *int `gorm:"check:compensation_rating >= 1 AND compensation_rating <= 5"`
	ManagementRating   *int `gorm:"check:management_rating >= 1 AND management_rating <= 5"`

	// Review Content
	Title              string  `gorm:"size:255;not null"`
	Pros               string  `gorm:"type:text;not null"`
	Cons               string  `gorm:"type:text;not null"`
	AdviceToManagement *string `gorm:"type:text"`

	// Employment Info
	JobTitle         *string `gorm:"size:255"`
	EmploymentStatus *string `gorm:"size:50"`
	YearsAtCompany   *int

	// Settings
	IsAnonymous        bool `gorm:"default:false"`
	IsCurrentEmployee  bool `gorm:"default:false"`

	// Moderation
	Status          ReviewStatus `gorm:"type:review_status;not null;default:'PENDING'"`
	ModeratedBy     *uuid.UUID   `gorm:"type:uuid"`
	ModeratedAt     *time.Time
	RejectionReason *string `gorm:"type:text"`

	// Company Response
	CompanyResponse   *string    `gorm:"type:text"`
	CompanyResponseBy *uuid.UUID `gorm:"type:uuid"`
	CompanyResponseAt *time.Time

	// Helpful votes
	HelpfulCount int `gorm:"default:0"`

	// Timestamps
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`

	// Relationships
	Company         *Company `gorm:"foreignKey:CompanyID"`
	User            *User    `gorm:"foreignKey:UserID"`
	Moderator       *User    `gorm:"foreignKey:ModeratedBy"`
	ResponseAuthor  *User    `gorm:"foreignKey:CompanyResponseBy"`
	HelpfulVotes    []ReviewHelpfulVote `gorm:"foreignKey:ReviewID"`
}

// TableName specifies the table name
func (CompanyReview) TableName() string {
	return "company_reviews"
}

// IsApproved checks if review is approved
func (r *CompanyReview) IsApproved() bool {
	return r.Status == ReviewStatusApproved
}

// HasCompanyResponse checks if company has responded
func (r *CompanyReview) HasCompanyResponse() bool {
	return r.CompanyResponse != nil && *r.CompanyResponse != ""
}

// CompanyFollower represents a job seeker following a company
type CompanyFollower struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	CompanyID uuid.UUID `gorm:"type:uuid;not null;index"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index"`

	// Notifications
	NotifyNewJobs bool `gorm:"default:true"`

	// Timestamps
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`

	// Relationships
	Company *Company `gorm:"foreignKey:CompanyID"`
	User    *User    `gorm:"foreignKey:UserID"`
}

// TableName specifies the table name
func (CompanyFollower) TableName() string {
	return "company_followers"
}

// ReviewHelpfulVote represents a helpful vote on a review
type ReviewHelpfulVote struct {
	ID       uuid.UUID `gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	ReviewID uuid.UUID `gorm:"type:uuid;not null;index"`
	UserID   uuid.UUID `gorm:"type:uuid;not null;index"`

	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP"`

	// Relationships
	Review *CompanyReview `gorm:"foreignKey:ReviewID"`
	User   *User          `gorm:"foreignKey:UserID"`
}

// TableName specifies the table name
func (ReviewHelpfulVote) TableName() string {
	return "review_helpful_votes"
}
