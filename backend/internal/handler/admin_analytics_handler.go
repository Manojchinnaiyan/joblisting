package handler

import (
	"job-platform/internal/domain"
	"job-platform/internal/repository"
	"job-platform/internal/service"
	"job-platform/internal/util/response"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// AdminAnalyticsHandler handles admin analytics endpoints
type AdminAnalyticsHandler struct {
	userService     *service.UserService
	adminService    *service.AdminService
	jobRepo         *repository.JobRepository
	companyRepo     *repository.CompanyRepository
	applicationRepo *repository.ApplicationRepository
	reviewRepo      *repository.ReviewRepository
	jobViewRepo     *repository.JobViewRepository
	jobCategoryRepo *repository.JobCategoryRepository
}

// NewAdminAnalyticsHandler creates a new admin analytics handler
func NewAdminAnalyticsHandler(
	userService *service.UserService,
	adminService *service.AdminService,
	jobRepo *repository.JobRepository,
	companyRepo *repository.CompanyRepository,
	applicationRepo *repository.ApplicationRepository,
	reviewRepo *repository.ReviewRepository,
	jobViewRepo *repository.JobViewRepository,
	jobCategoryRepo *repository.JobCategoryRepository,
) *AdminAnalyticsHandler {
	return &AdminAnalyticsHandler{
		userService:     userService,
		adminService:    adminService,
		jobRepo:         jobRepo,
		companyRepo:     companyRepo,
		applicationRepo: applicationRepo,
		reviewRepo:      reviewRepo,
		jobViewRepo:     jobViewRepo,
		jobCategoryRepo: jobCategoryRepo,
	}
}

// GetUserStats retrieves user statistics
func (h *AdminAnalyticsHandler) GetUserStats(c *gin.Context) {
	stats, err := h.userService.GetStats()
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "User statistics retrieved successfully", gin.H{
		"stats": stats,
	})
}

// GetLoginStats retrieves login statistics
func (h *AdminAnalyticsHandler) GetLoginStats(c *gin.Context) {
	// Parse time range (default: last 30 days)
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 {
		days = 30
	}

	since := time.Now().AddDate(0, 0, -days)

	stats, err := h.adminService.GetLoginStats(since)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Login statistics retrieved successfully", gin.H{
		"stats":      stats,
		"since":      since,
		"days":       days,
	})
}

// GetSecurityEvents retrieves security events
func (h *AdminAnalyticsHandler) GetSecurityEvents(c *gin.Context) {
	// Parse parameters
	days, _ := strconv.Atoi(c.DefaultQuery("days", "7"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))

	if days < 1 {
		days = 7
	}
	if limit < 1 || limit > 500 {
		limit = 100
	}

	since := time.Now().AddDate(0, 0, -days)

	events, err := h.adminService.GetSecurityEvents(since, limit)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Security events retrieved successfully", gin.H{
		"events": events,
		"since":  since,
		"days":   days,
		"count":  len(events),
	})
}

// GetLoginHistory retrieves paginated login history across all users
func (h *AdminAnalyticsHandler) GetLoginHistory(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	status := c.DefaultQuery("status", "")
	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	if days < 1 {
		days = 30
	}

	since := time.Now().AddDate(0, 0, -days)

	history, total, err := h.adminService.GetPaginatedLoginHistory(page, limit, status, since)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	type loginEntry struct {
		ID            string  `json:"id"`
		UserID        *string `json:"user_id"`
		Email         string  `json:"email"`
		UserName      string  `json:"user_name"`
		Status        string  `json:"status"`
		IPAddress     string  `json:"ip_address"`
		UserAgent     string  `json:"user_agent"`
		FailureReason string  `json:"failure_reason"`
		CreatedAt     string  `json:"created_at"`
	}

	entries := make([]loginEntry, 0, len(history))
	for _, h := range history {
		entry := loginEntry{
			ID:        h.ID.String(),
			Email:     h.Email,
			Status:    string(h.Status),
			CreatedAt: h.CreatedAt.Format(time.RFC3339),
		}
		if h.UserID != nil {
			uid := h.UserID.String()
			entry.UserID = &uid
		}
		if h.User != nil {
			entry.UserName = h.User.FirstName + " " + h.User.LastName
		}
		if h.IPAddress != nil {
			entry.IPAddress = *h.IPAddress
		}
		if h.UserAgent != nil {
			entry.UserAgent = *h.UserAgent
		}
		if h.FailureReason != nil {
			entry.FailureReason = *h.FailureReason
		}
		entries = append(entries, entry)
	}

	totalPages := (total + int64(limit) - 1) / int64(limit)

	response.OK(c, "Login history retrieved successfully", gin.H{
		"history":     entries,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
	})
}

// GetJobAnalytics retrieves job analytics for admin
func (h *AdminAnalyticsHandler) GetJobAnalytics(c *gin.Context) {
	period := c.DefaultQuery("period", "30d")
	since := parsePeriod(period)

	// Get all jobs count
	_, allJobsCount, _ := h.jobRepo.GetAllJobs(nil, 1, 0)

	// Get active jobs count
	activeStatus := domain.JobStatusActive
	_, activeJobsCount, _ := h.jobRepo.GetAllJobs(&activeStatus, 1, 0)

	// Get pending jobs count
	pendingStatus := domain.JobStatusPendingApproval
	_, pendingJobsCount, _ := h.jobRepo.GetAllJobs(&pendingStatus, 1, 0)

	// Get expired jobs count
	expiredStatus := domain.JobStatusExpired
	_, expiredJobsCount, _ := h.jobRepo.GetAllJobs(&expiredStatus, 1, 0)

	// Get closed jobs count
	closedStatus := domain.JobStatusClosed
	_, closedJobsCount, _ := h.jobRepo.GetAllJobs(&closedStatus, 1, 0)

	// Get rejected jobs count
	rejectedStatus := domain.JobStatusRejected
	_, rejectedJobsCount, _ := h.jobRepo.GetAllJobs(&rejectedStatus, 1, 0)

	// New jobs in current period
	newJobsPeriod, _ := h.jobRepo.CountCreatedSince(since)

	// Growth: compare current period with previous period of same length
	periodDuration := time.Since(since)
	prevPeriodStart := since.Add(-periodDuration)
	newJobsPrevPeriod, _ := h.jobRepo.CountCreatedSince(prevPeriodStart)
	// Subtract current period count from the "since prevPeriodStart" count to get only prev period
	newJobsPrevPeriod = newJobsPrevPeriod - newJobsPeriod

	growthPercentage := float64(0)
	if newJobsPrevPeriod > 0 {
		growthPercentage = float64(newJobsPeriod-newJobsPrevPeriod) / float64(newJobsPrevPeriod) * 100
	}

	// Featured jobs count
	featuredJobs, _ := h.jobRepo.CountFeatured()

	// Jobs over time
	jobsOverTime, _ := h.jobViewRepo.GetMonthlyJobActivity(12)

	// Top categories
	topCategories, _ := h.jobCategoryRepo.GetTopCategoriesWithJobCount(10)

	// Count by type, experience level, workplace type
	byType, _ := h.jobRepo.CountByJobType()
	byExperienceLevel, _ := h.jobRepo.CountByExperienceLevel()
	byWorkplaceType, _ := h.jobRepo.CountByWorkplaceType()

	response.OK(c, "Job analytics retrieved successfully", gin.H{
		"total_jobs":  allJobsCount,
		"active_jobs": activeJobsCount,
		"by_status": gin.H{
			"active":   activeJobsCount,
			"pending":  pendingJobsCount,
			"expired":  expiredJobsCount,
			"closed":   closedJobsCount,
			"rejected": rejectedJobsCount,
		},
		"new_jobs_period":     newJobsPeriod,
		"growth_percentage":   growthPercentage,
		"featured_jobs":       featuredJobs,
		"jobs_over_time":      jobsOverTime,
		"top_categories":      topCategories,
		"by_type":             byType,
		"by_experience_level": byExperienceLevel,
		"by_workplace_type":   byWorkplaceType,
	})
}

// GetApplicationAnalytics retrieves application analytics for admin
func (h *AdminAnalyticsHandler) GetApplicationAnalytics(c *gin.Context) {
	period := c.DefaultQuery("period", "30d")
	since := parsePeriod(period)

	// Get application counts by status
	submittedCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusSubmitted)
	reviewedCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusReviewed)
	shortlistedCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusShortlisted)
	interviewCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusInterview)
	offeredCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusOffered)
	hiredCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusHired)
	rejectedCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusRejected)
	withdrawnCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusWithdrawn)

	totalApplications := submittedCount + reviewedCount + shortlistedCount + interviewCount + offeredCount + hiredCount + rejectedCount + withdrawnCount

	// New applications in current period
	newAppsPeriod, _ := h.applicationRepo.CountCreatedSince(since)

	// Growth: compare current period with previous period
	periodDuration := time.Since(since)
	prevPeriodStart := since.Add(-periodDuration)
	newAppsPrevPeriod, _ := h.applicationRepo.CountCreatedSince(prevPeriodStart)
	newAppsPrevPeriod = newAppsPrevPeriod - newAppsPeriod

	growthPercentage := float64(0)
	if newAppsPrevPeriod > 0 {
		growthPercentage = float64(newAppsPeriod-newAppsPrevPeriod) / float64(newAppsPrevPeriod) * 100
	}

	// Average applications per job
	activeStatus := domain.JobStatusActive
	_, activeJobsCount, _ := h.jobRepo.GetAllJobs(&activeStatus, 1, 0)
	avgAppsPerJob := float64(0)
	if activeJobsCount > 0 {
		avgAppsPerJob = float64(totalApplications) / float64(activeJobsCount)
	}

	// Conversion rate: applications / views
	totalViews, _ := h.jobViewRepo.GetTotalViews()
	conversionRate := float64(0)
	if totalViews > 0 {
		conversionRate = float64(totalApplications) / float64(totalViews) * 100
	}

	// Applications over time
	applicationsOverTime, _ := h.jobViewRepo.GetApplicationsOverTime(since)

	response.OK(c, "Application analytics retrieved successfully", gin.H{
		"total_applications":           totalApplications,
		"new_applications_period":      newAppsPeriod,
		"growth_percentage":            growthPercentage,
		"by_status": gin.H{
			"pending":     submittedCount,
			"reviewed":    reviewedCount,
			"shortlisted": shortlistedCount,
			"interview":   interviewCount,
			"offered":     offeredCount,
			"hired":       hiredCount,
			"rejected":    rejectedCount,
			"withdrawn":   withdrawnCount,
		},
		"average_applications_per_job": avgAppsPerJob,
		"conversion_rate":              conversionRate,
		"applications_over_time":       applicationsOverTime,
	})
}

// GetCompanyAnalytics retrieves company analytics for admin
func (h *AdminAnalyticsHandler) GetCompanyAnalytics(c *gin.Context) {
	period := c.DefaultQuery("period", "30d")
	since := parsePeriod(period)

	// Get company counts by status
	activeCount, _ := h.companyRepo.CountByStatus(domain.CompanyStatusActive)
	pendingCount, _ := h.companyRepo.CountByStatus(domain.CompanyStatusPending)
	suspendedCount, _ := h.companyRepo.CountByStatus(domain.CompanyStatusSuspended)
	verifiedCount, _ := h.companyRepo.CountByStatus(domain.CompanyStatusVerified)

	totalCompanies := activeCount + pendingCount + suspendedCount + verifiedCount

	// New companies in current period
	newCompaniesPeriod, _ := h.companyRepo.CountCreatedSince(since)

	// Growth: compare current period with previous period
	periodDuration := time.Since(since)
	prevPeriodStart := since.Add(-periodDuration)
	newCompaniesPrevPeriod, _ := h.companyRepo.CountCreatedSince(prevPeriodStart)
	newCompaniesPrevPeriod = newCompaniesPrevPeriod - newCompaniesPeriod

	growthPercentage := float64(0)
	if newCompaniesPrevPeriod > 0 {
		growthPercentage = float64(newCompaniesPeriod-newCompaniesPrevPeriod) / float64(newCompaniesPrevPeriod) * 100
	}

	// Verification rate
	verificationRate := float64(0)
	if totalCompanies > 0 {
		verificationRate = float64(verifiedCount) / float64(totalCompanies) * 100
	}

	// Featured companies
	featuredCompanies, _ := h.companyRepo.CountFeatured()

	// By industry and size
	byIndustry, _ := h.companyRepo.CountByIndustry()
	bySize, _ := h.companyRepo.CountBySize()

	// Companies over time
	companiesOverTime, _ := h.companyRepo.GetCompaniesOverTime(since)

	response.OK(c, "Company analytics retrieved successfully", gin.H{
		"total_companies":      totalCompanies,
		"active_companies":     activeCount + verifiedCount,
		"new_companies_period": newCompaniesPeriod,
		"growth_percentage":    growthPercentage,
		"by_status": gin.H{
			"active":    activeCount,
			"pending":   pendingCount,
			"suspended": suspendedCount,
		},
		"verified_companies":  verifiedCount,
		"verification_rate":   verificationRate,
		"featured_companies":  featuredCompanies,
		"by_industry":         byIndustry,
		"by_size":             bySize,
		"companies_over_time": companiesOverTime,
	})
}

// GetDashboard retrieves dashboard statistics for admin overview
func (h *AdminAnalyticsHandler) GetDashboard(c *gin.Context) {
	// Get user stats
	userStats, err := h.userService.GetStats()
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Calculate total users and new today
	totalUsers := userStats["job_seekers"] + userStats["employers"] + userStats["admins"]
	newToday := userStats["new_today"]

	// Calculate growth (simplified - compare with previous period)
	growth := float64(0)
	if userStats["total_previous_month"] > 0 {
		growth = float64(totalUsers-userStats["total_previous_month"]) / float64(userStats["total_previous_month"]) * 100
	}

	// Get company stats
	totalCompanies, _ := h.companyRepo.CountByStatus(domain.CompanyStatusActive)
	pendingCompanies, _ := h.companyRepo.CountByStatus(domain.CompanyStatusPending)
	verifiedCompanies, _ := h.companyRepo.CountByStatus(domain.CompanyStatusVerified)
	pendingVerification := pendingCompanies // Companies waiting for verification

	// Get all jobs count
	_, allJobsCount, _ := h.jobRepo.GetAllJobs(nil, 1, 0)

	// Get active jobs count
	activeStatus := domain.JobStatusActive
	_, activeJobsCount, _ := h.jobRepo.GetAllJobs(&activeStatus, 1, 0)

	// Get pending approval jobs count
	pendingStatus := domain.JobStatusPendingApproval
	_, pendingJobsCount, _ := h.jobRepo.GetAllJobs(&pendingStatus, 1, 0)

	// Get application stats
	applicationsTotal, _ := h.applicationRepo.CountAll()
	todayStart := time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), 0, 0, 0, 0, time.Now().Location())
	applicationsNewToday, _ := h.applicationRepo.CountCreatedSince(todayStart)

	// Get pending reviews count using GetPendingReviews
	_, pendingReviews, _ := h.reviewRepo.GetPendingReviews(1, 0)

	response.OK(c, "Dashboard statistics retrieved successfully", gin.H{
		"users": gin.H{
			"total":     totalUsers,
			"new_today": newToday,
			"growth":    growth,
		},
		"companies": gin.H{
			"total":                totalCompanies + verifiedCompanies,
			"pending_verification": pendingVerification,
		},
		"jobs": gin.H{
			"total":            allJobsCount,
			"active":           activeJobsCount,
			"pending_approval": pendingJobsCount,
		},
		"applications": gin.H{
			"total":     applicationsTotal,
			"new_today": applicationsNewToday,
		},
		"reviews": gin.H{
			"pending_moderation": pendingReviews,
		},
	})
}

// parsePeriod converts period string to time duration
func parsePeriod(period string) time.Time {
	now := time.Now()
	switch period {
	case "7d":
		return now.AddDate(0, 0, -7)
	case "30d":
		return now.AddDate(0, 0, -30)
	case "90d":
		return now.AddDate(0, 0, -90)
	case "1y":
		return now.AddDate(-1, 0, 0)
	default:
		return now.AddDate(0, 0, -30)
	}
}

// GetComprehensiveAnalytics retrieves comprehensive analytics overview
func (h *AdminAnalyticsHandler) GetComprehensiveAnalytics(c *gin.Context) {
	period := c.DefaultQuery("period", "30d")
	since := parsePeriod(period)

	// Get total views
	totalViews, _ := h.jobViewRepo.GetTotalViews()
	periodViews, _ := h.jobViewRepo.GetTotalViewsInPeriod(since)

	// Get top viewed jobs
	topJobs, _ := h.jobViewRepo.GetTopViewedJobs(10, &since)

	// Get views by country
	viewsByCountry, _ := h.jobViewRepo.GetViewsByCountry(&since)

	// Get views over time
	viewsOverTime, _ := h.jobViewRepo.GetViewsOverTime(since)

	// Get applications over time
	applicationsOverTime, _ := h.jobViewRepo.GetApplicationsOverTime(since)

	// Get monthly job activity (last 12 months)
	monthlyJobActivity, _ := h.jobViewRepo.GetMonthlyJobActivity(12)

	// Get featured jobs stats
	featuredStats, _ := h.jobViewRepo.GetFeaturedJobsStats()

	// Get conversion rates
	conversionRates, _ := h.jobViewRepo.GetJobConversionRates(10)

	// Get user activity stats
	userActivity, _ := h.jobViewRepo.GetUserActivityStats(since)

	// Get total applications
	submittedCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusSubmitted)
	reviewedCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusReviewed)
	shortlistedCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusShortlisted)
	interviewCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusInterview)
	offeredCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusOffered)
	hiredCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusHired)
	rejectedCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusRejected)
	withdrawnCount, _ := h.applicationRepo.CountAllByStatus(domain.ApplicationStatusWithdrawn)
	totalApplications := submittedCount + reviewedCount + shortlistedCount + interviewCount + offeredCount + hiredCount + rejectedCount + withdrawnCount

	response.OK(c, "Comprehensive analytics retrieved successfully", gin.H{
		"period": period,
		"views": gin.H{
			"total":        totalViews,
			"period_total": periodViews,
		},
		"top_viewed_jobs":        topJobs,
		"views_by_country":       viewsByCountry,
		"views_over_time":        viewsOverTime,
		"applications_over_time": applicationsOverTime,
		"monthly_job_activity":   monthlyJobActivity,
		"featured_jobs":          featuredStats,
		"conversion_rates":       conversionRates,
		"user_activity":          userActivity,
		"total_applications":     totalApplications,
		"applications_by_status": gin.H{
			"pending":     submittedCount,
			"reviewed":    reviewedCount,
			"shortlisted": shortlistedCount,
			"interview":   interviewCount,
			"offered":     offeredCount,
			"hired":       hiredCount,
			"rejected":    rejectedCount,
			"withdrawn":   withdrawnCount,
		},
	})
}

// GetTopViewedJobs retrieves the most viewed jobs
func (h *AdminAnalyticsHandler) GetTopViewedJobs(c *gin.Context) {
	period := c.DefaultQuery("period", "30d")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	since := parsePeriod(period)
	topJobs, err := h.jobViewRepo.GetTopViewedJobs(limit, &since)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Top viewed jobs retrieved successfully", gin.H{
		"jobs":   topJobs,
		"period": period,
		"limit":  limit,
	})
}

// GetViewsByCountry retrieves views grouped by country
func (h *AdminAnalyticsHandler) GetViewsByCountry(c *gin.Context) {
	period := c.DefaultQuery("period", "30d")
	since := parsePeriod(period)

	viewsByCountry, err := h.jobViewRepo.GetViewsByCountry(&since)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Views by country retrieved successfully", gin.H{
		"countries": viewsByCountry,
		"period":    period,
	})
}

// GetViewsTimeSeries retrieves job views over time
func (h *AdminAnalyticsHandler) GetViewsTimeSeries(c *gin.Context) {
	period := c.DefaultQuery("period", "30d")
	since := parsePeriod(period)

	viewsOverTime, err := h.jobViewRepo.GetViewsOverTime(since)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	applicationsOverTime, err := h.jobViewRepo.GetApplicationsOverTime(since)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Time series data retrieved successfully", gin.H{
		"views":        viewsOverTime,
		"applications": applicationsOverTime,
		"period":       period,
	})
}

// GetFeaturedJobsAnalytics retrieves analytics for featured jobs
func (h *AdminAnalyticsHandler) GetFeaturedJobsAnalytics(c *gin.Context) {
	featuredStats, err := h.jobViewRepo.GetFeaturedJobsStats()
	if err != nil {
		response.InternalError(c, err)
		return
	}

	// Get featured jobs list
	period := c.DefaultQuery("period", "30d")
	since := parsePeriod(period)
	topFeatured, _ := h.jobViewRepo.GetTopViewedJobs(20, &since)

	// Filter only featured jobs
	var featuredJobs []repository.JobViewStats
	for _, job := range topFeatured {
		if job.IsFeatured {
			featuredJobs = append(featuredJobs, job)
		}
	}

	response.OK(c, "Featured jobs analytics retrieved successfully", gin.H{
		"stats":         featuredStats,
		"featured_jobs": featuredJobs,
		"period":        period,
	})
}

// GetMonthlyActivity retrieves monthly job and application activity
func (h *AdminAnalyticsHandler) GetMonthlyActivity(c *gin.Context) {
	months, _ := strconv.Atoi(c.DefaultQuery("months", "12"))
	if months < 1 || months > 24 {
		months = 12
	}

	monthlyActivity, err := h.jobViewRepo.GetMonthlyJobActivity(months)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Monthly activity retrieved successfully", gin.H{
		"job_postings": monthlyActivity,
		"months":       months,
	})
}

// GetConversionAnalytics retrieves conversion rate analytics
func (h *AdminAnalyticsHandler) GetConversionAnalytics(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	conversionRates, err := h.jobViewRepo.GetJobConversionRates(limit)
	if err != nil {
		response.InternalError(c, err)
		return
	}

	response.OK(c, "Conversion analytics retrieved successfully", gin.H{
		"jobs":  conversionRates,
		"limit": limit,
	})
}
