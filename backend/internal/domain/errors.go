package domain

import "errors"

// Authentication errors
var (
	ErrInvalidCredentials     = errors.New("AUTH_001: Invalid credentials")
	ErrEmailNotVerified       = errors.New("AUTH_002: Email not verified")
	ErrAccountLocked          = errors.New("AUTH_003: Account locked due to too many failed attempts")
	ErrAccountSuspended       = errors.New("AUTH_004: Account suspended")
	ErrTokenExpired           = errors.New("AUTH_005: Token expired")
	ErrInvalidToken           = errors.New("AUTH_006: Invalid token")
	ErrEmailAlreadyExists     = errors.New("AUTH_007: Email already exists")
	ErrWeakPassword           = errors.New("AUTH_008: Password does not meet strength requirements")
	Err2FARequired            = errors.New("AUTH_009: Two-factor authentication required")
	ErrInvalid2FACode         = errors.New("AUTH_010: Invalid 2FA code")
	ErrPasswordReuse          = errors.New("AUTH_011: Cannot reuse recent passwords")
	ErrTooManyAttempts        = errors.New("AUTH_012: Too many verification attempts")
	ErrGoogleAuthFailed       = errors.New("AUTH_013: Google authentication failed")
	ErrUnauthorized           = errors.New("AUTH_014: Unauthorized")
	ErrForbidden              = errors.New("AUTH_015: Forbidden - insufficient permissions")
	ErrUserNotFound           = errors.New("AUTH_016: User not found")
	ErrInvalidRole            = errors.New("AUTH_017: Invalid user role")
	ErrTokenNotFound          = errors.New("AUTH_018: Token not found")
	ErrTokenAlreadyUsed       = errors.New("AUTH_019: Token already used")
	ErrInvalidPasswordHistory = errors.New("AUTH_020: Failed to check password history")
	ErrInvalidInput           = errors.New("VALIDATION_001: Invalid input data")
	ErrInternalServer         = errors.New("SERVER_001: Internal server error")
	ErrEmployerOnly           = errors.New("AUTH_021: Only employers can access this resource")
	ErrJobSeekerOnly          = errors.New("AUTH_022: Only job seekers can access this resource")
	ErrAdminOnly              = errors.New("AUTH_023: Only admins can access this resource")
	ErrInvalidJobID           = errors.New("VALIDATION_002: Invalid job ID format")
	ErrInvalidID              = errors.New("VALIDATION_003: Invalid ID format")
	ErrInvalidDate            = errors.New("VALIDATION_004: Invalid date format")
	ErrInvalidDateFormat      = errors.New("VALIDATION_004: Invalid date format") // Alias for ErrInvalidDate
	ErrInvalidCategoryID      = errors.New("VALIDATION_005: Invalid category ID format")
)

// Job errors
var (
	ErrJobNotFound           = errors.New("JOB_001: Job not found")
	ErrJobExpired            = errors.New("JOB_002: Job has expired")
	ErrJobClosed             = errors.New("JOB_003: Job is closed")
	ErrJobNotOwnedByEmployer = errors.New("JOB_004: You do not own this job")
	ErrMaxJobsReached        = errors.New("JOB_005: Maximum number of active jobs reached")
	ErrJobNotActive          = errors.New("JOB_006: Job is not active")
	ErrInvalidJobStatus      = errors.New("JOB_007: Invalid job status")
	ErrJobAlreadyExpired     = errors.New("JOB_008: Job has already expired")
	ErrCannotRenewActiveJob  = errors.New("JOB_009: Cannot renew active job")
	ErrInvalidSlug           = errors.New("JOB_010: Invalid job slug")
)

// Application errors
var (
	ErrApplicationNotFound      = errors.New("APP_001: Application not found")
	ErrAlreadyApplied           = errors.New("APP_002: You have already applied to this job")
	ErrCannotApplyOwnJob        = errors.New("APP_003: Cannot apply to your own job posting")
	ErrCannotApplyExpiredJob       = errors.New("APP_004: Cannot apply to expired or closed job")
	ErrCannotWithdraw              = errors.New("APP_005: Cannot withdraw application at this stage")
	ErrInvalidApplicationStatus    = errors.New("APP_006: Invalid application status transition")
	ErrNotApplicationOwner         = errors.New("APP_007: You do not have access to this application")
	ErrResumeRequired              = errors.New("APP_008: Resume is required to apply")
	ErrInvalidStatusTransition     = errors.New("APP_009: Invalid application status transition")
	ErrCannotApply                 = errors.New("APP_010: Cannot apply to this job")
	ErrCannotApplyToOwnJob         = errors.New("APP_011: Cannot apply to your own job posting")
	ErrCannotWithdrawApplication   = errors.New("APP_012: Cannot withdraw application at this stage")
)

// Category errors
var (
	ErrCategoryNotFound      = errors.New("CAT_001: Category not found")
	ErrCategorySlugExists    = errors.New("CAT_002: Category slug already exists")
	ErrCategoryHasJobs       = errors.New("CAT_003: Cannot delete category with active jobs")
	ErrInvalidParentCategory = errors.New("CAT_004: Invalid parent category")
	ErrCategoryAlreadyExists = errors.New("CAT_005: Category already exists")
)

// Saved job errors
var (
	ErrJobAlreadySaved  = errors.New("SAVED_001: Job already saved")
	ErrJobNotSaved      = errors.New("SAVED_002: Job not saved")
	ErrSavedJobNotFound = errors.New("SAVED_003: Saved job not found")
)

// Search errors
var (
	ErrSearchFailed     = errors.New("SEARCH_001: Search operation failed")
	ErrIndexingFailed   = errors.New("SEARCH_002: Failed to index document")
	ErrInvalidFilter    = errors.New("SEARCH_003: Invalid search filter")
)

// Profile errors
var (
	ErrProfileNotFound              = errors.New("PROFILE_001: Profile not found")
	ErrProfileAlreadyExists         = errors.New("PROFILE_002: Profile already exists")
	ErrInvalidProfileVisibility     = errors.New("PROFILE_003: Invalid profile visibility")
	ErrProfileIncomplete            = errors.New("PROFILE_004: Profile completeness below minimum threshold")
	ErrCannotViewProfile            = errors.New("PROFILE_005: You do not have permission to view this profile")
	ErrInvalidProfileCompleteness   = errors.New("PROFILE_006: Invalid profile completeness score")
	ErrInvalidSalaryRange           = errors.New("PROFILE_007: Invalid salary range - minimum cannot exceed maximum")
)

// Resume errors
var (
	ErrResumeNotFound         = errors.New("RESUME_001: Resume not found")
	ErrMaxResumesReached      = errors.New("RESUME_002: Maximum number of resumes reached")
	ErrInvalidFileType        = errors.New("RESUME_003: Invalid file type")
	ErrFileTooLarge           = errors.New("RESUME_004: File size exceeds maximum limit")
	ErrResumeUploadFailed     = errors.New("RESUME_005: Failed to upload resume")
	ErrResumeDeleteFailed     = errors.New("RESUME_006: Failed to delete resume")
	ErrInvalidResumeID        = errors.New("RESUME_007: Invalid resume ID")
	ErrCannotDeletePrimaryResume = errors.New("RESUME_008: Cannot delete primary resume without setting another as primary")
)

// Work Experience errors
var (
	ErrExperienceNotFound = errors.New("EXP_001: Work experience not found")
	ErrInvalidDateRange   = errors.New("EXP_002: Invalid date range")
	ErrExperienceNotOwned = errors.New("EXP_003: You do not own this work experience")
)

// Education errors
var (
	ErrEducationNotFound = errors.New("EDU_001: Education entry not found")
	ErrEducationNotOwned = errors.New("EDU_002: You do not own this education entry")
	ErrInvalidDegreeType = errors.New("EDU_003: Invalid degree type")
)

// Skill errors
var (
	ErrSkillNotFound     = errors.New("SKILL_001: Skill not found")
	ErrSkillAlreadyExists = errors.New("SKILL_002: Skill already exists for this user")
	ErrSkillNotOwned     = errors.New("SKILL_003: You do not own this skill")
	ErrInvalidSkillLevel = errors.New("SKILL_004: Invalid skill level")
)

// Certification errors
var (
	ErrCertificationNotFound = errors.New("CERT_001: Certification not found")
	ErrCertificationNotOwned = errors.New("CERT_002: You do not own this certification")
	ErrCertificationExpired  = errors.New("CERT_003: Certification has expired")
)

// Portfolio errors
var (
	ErrPortfolioNotFound      = errors.New("PORT_001: Portfolio project not found")
	ErrPortfolioNotOwned      = errors.New("PORT_002: You do not own this portfolio project")
	ErrMaxFeaturedReached     = errors.New("PORT_003: Maximum number of featured projects reached")
	ErrInvalidProjectData     = errors.New("PORT_004: Invalid project data")
	ErrMaxImagesReached       = errors.New("PORT_005: Maximum number of project images reached")
	ErrImageNotFound          = errors.New("PORT_006: Project image not found")
)

// Saved Candidate errors
var (
	ErrCandidateAlreadySaved  = errors.New("CAND_001: Candidate already saved")
	ErrCandidateNotSaved      = errors.New("CAND_002: Candidate not saved")
	ErrCannotSaveOwnProfile   = errors.New("CAND_003: Cannot save your own profile")
	ErrCannotSaveNonJobSeeker = errors.New("CAND_004: Can only save job seeker profiles")
	ErrNotACandidate          = errors.New("CAND_005: User is not a job seeker")
	ErrNoValidCandidates      = errors.New("CAND_006: No valid candidates to save")
)

// Storage errors
var (
	ErrStorageUploadFailed   = errors.New("STORAGE_001: Failed to upload file")
	ErrStorageDeleteFailed   = errors.New("STORAGE_002: Failed to delete file")
	ErrStorageDownloadFailed = errors.New("STORAGE_003: Failed to download file")
	ErrFileNotFound          = errors.New("STORAGE_004: File not found")
	ErrInvalidFileFormat     = errors.New("STORAGE_005: Invalid file format")
)

// Company errors
var (
	ErrCompanyNotFound          = errors.New("COMPANY_001: Company not found")
	ErrCompanyAlreadyExists     = errors.New("COMPANY_002: Company already exists for this user")
	ErrCompanySlugExists        = errors.New("COMPANY_003: Company slug already exists")
	ErrCompanySuspended         = errors.New("COMPANY_004: Company is suspended")
	ErrCompanyNotActive         = errors.New("COMPANY_005: Company is not active")
	ErrNotCompanyOwner          = errors.New("COMPANY_006: You are not the company owner")
	ErrNotCompanyMember         = errors.New("COMPANY_007: You are not a member of this company")
	ErrInsufficientPermissions  = errors.New("COMPANY_008: Insufficient permissions")
	ErrCannotRemoveOwner        = errors.New("COMPANY_009: Cannot remove company owner")
	ErrCannotChangeOwnerRole    = errors.New("COMPANY_010: Cannot change owner role")
	ErrMaxLocationsReached      = errors.New("COMPANY_011: Maximum number of locations reached")
	ErrMaxBenefitsReached       = errors.New("COMPANY_012: Maximum number of benefits reached")
	ErrMaxMediaReached          = errors.New("COMPANY_013: Maximum number of media items reached")
	ErrCompanyNotVerified       = errors.New("COMPANY_014: Company is not verified")
	ErrVerificationPending      = errors.New("COMPANY_015: Verification already pending")
	ErrCompanyCannotBeEdited    = errors.New("COMPANY_016: Company cannot be edited in current status")
	ErrCompanyNotPending        = errors.New("COMPANY_017: Company is not in pending status")
)

// Team errors
var (
	ErrTeamMemberNotFound      = errors.New("TEAM_001: Team member not found")
	ErrTeamMemberAlreadyExists = errors.New("TEAM_002: User is already a team member")
	ErrCannotInviteSelf        = errors.New("TEAM_003: Cannot invite yourself")
	ErrInvitationNotFound      = errors.New("TEAM_004: Invitation not found")
	ErrInvitationExpired       = errors.New("TEAM_005: Invitation has expired")
	ErrInvitationAlreadyUsed   = errors.New("TEAM_006: Invitation already used")
	ErrInvalidTeamRole         = errors.New("TEAM_007: Invalid team role")
	ErrInvitationAlreadyExists = errors.New("TEAM_008: Invitation already exists for this user")
	ErrInvitationNotPending    = errors.New("TEAM_009: Invitation is not in pending status")
	ErrOwnerNotFound           = errors.New("TEAM_010: Company owner not found")
)

// Location errors
var (
	ErrLocationNotFound        = errors.New("LOCATION_001: Location not found")
	ErrLocationNotOwned        = errors.New("LOCATION_002: You do not own this location")
	ErrCannotDeleteHQ          = errors.New("LOCATION_003: Cannot delete headquarters location")
	ErrMultipleHQNotAllowed    = errors.New("LOCATION_004: Only one headquarters allowed")
	ErrCannotDeleteLastLocation = errors.New("LOCATION_005: Cannot delete the last location")
)

// Benefit errors
var (
	ErrBenefitNotFound = errors.New("BENEFIT_001: Benefit not found")
	ErrBenefitNotOwned = errors.New("BENEFIT_002: You do not own this benefit")
)

// Media errors
var (
	ErrMediaNotFound = errors.New("MEDIA_001: Media not found")
	ErrMediaNotOwned = errors.New("MEDIA_002: You do not own this media")
)

// Review errors (company reviews)
var (
	ErrReviewNotFound         = errors.New("REVIEW_001: Review not found")
	ErrReviewAlreadyExists    = errors.New("REVIEW_002: You have already reviewed this company")
	ErrAlreadyReviewed        = errors.New("REVIEW_002: You have already reviewed this company") // Alias
	ErrCannotReviewOwnCompany = errors.New("REVIEW_003: Cannot review your own company")
	ErrNotEligibleToReview    = errors.New("REVIEW_004: Not eligible to review this company")
	ErrReviewNotOwned         = errors.New("REVIEW_005: You do not own this review")
	ErrReviewNotPending       = errors.New("REVIEW_006: Review is not in pending status")
	ErrReviewNotApproved      = errors.New("REVIEW_007: Review is not approved")
)

// Follower errors
var (
	ErrAlreadyFollowing       = errors.New("FOLLOWER_001: Already following this company")
	ErrNotFollowing           = errors.New("FOLLOWER_002: Not following this company")
	ErrCannotFollowOwnCompany = errors.New("FOLLOWER_003: Cannot follow your own company")
	ErrFollowerNotFound       = errors.New("FOLLOWER_004: Follower record not found")
)

// Newsletter errors
var (
	ErrNewsletterAlreadySubscribed = errors.New("NEWSLETTER_001: Email already subscribed to newsletter")
	ErrNewsletterNotFound          = errors.New("NEWSLETTER_002: Newsletter subscription not found")
	ErrNewsletterInvalidToken      = errors.New("NEWSLETTER_003: Invalid unsubscribe token")
	ErrNewsletterEmailRequired     = errors.New("NEWSLETTER_004: Email is required")
)

// ErrorCode represents an error with a code
type ErrorCode struct {
	Code    string
	Message string
	Details interface{}
}

// Error implements the error interface
func (e *ErrorCode) Error() string {
	return e.Message
}

// NewErrorCode creates a new error with code
func NewErrorCode(code, message string, details interface{}) *ErrorCode {
	return &ErrorCode{
		Code:    code,
		Message: message,
		Details: details,
	}
}

// GetErrorCode extracts error code from domain errors
func GetErrorCode(err error) string {
	if err == nil {
		return ""
	}

	switch err {
	case ErrInvalidCredentials:
		return "AUTH_001"
	case ErrEmailNotVerified:
		return "AUTH_002"
	case ErrAccountLocked:
		return "AUTH_003"
	case ErrAccountSuspended:
		return "AUTH_004"
	case ErrTokenExpired:
		return "AUTH_005"
	case ErrInvalidToken:
		return "AUTH_006"
	case ErrEmailAlreadyExists:
		return "AUTH_007"
	case ErrWeakPassword:
		return "AUTH_008"
	case Err2FARequired:
		return "AUTH_009"
	case ErrInvalid2FACode:
		return "AUTH_010"
	case ErrPasswordReuse:
		return "AUTH_011"
	case ErrTooManyAttempts:
		return "AUTH_012"
	case ErrGoogleAuthFailed:
		return "AUTH_013"
	case ErrUnauthorized:
		return "AUTH_014"
	case ErrForbidden:
		return "AUTH_015"
	case ErrUserNotFound:
		return "AUTH_016"
	case ErrInvalidRole:
		return "AUTH_017"
	case ErrTokenNotFound:
		return "AUTH_018"
	case ErrTokenAlreadyUsed:
		return "AUTH_019"
	default:
		return "UNKNOWN"
	}
}
