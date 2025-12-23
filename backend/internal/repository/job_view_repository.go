package repository

import (
	"job-platform/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// JobViewRepository handles job view analytics database operations
type JobViewRepository struct {
	db *gorm.DB
}

// NewJobViewRepository creates a new job view repository
func NewJobViewRepository(db *gorm.DB) *JobViewRepository {
	return &JobViewRepository{db: db}
}

// Create creates a new job view record
func (r *JobViewRepository) Create(view *domain.JobView) error {
	return r.db.Create(view).Error
}

// GetByJobID retrieves all views for a job
func (r *JobViewRepository) GetByJobID(jobID uuid.UUID, limit, offset int) ([]domain.JobView, int64, error) {
	var views []domain.JobView
	var total int64

	query := r.db.Model(&domain.JobView{}).
		Where("job_id = ?", jobID)

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	err := query.
		Preload("User").
		Order("viewed_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&views).Error

	return views, total, err
}

// CountByJobID counts views for a job
func (r *JobViewRepository) CountByJobID(jobID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.JobView{}).
		Where("job_id = ?", jobID).
		Count(&count).Error
	return count, err
}

// CountUniqueViewsByJobID counts unique views (by user) for a job
func (r *JobViewRepository) CountUniqueViewsByJobID(jobID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.JobView{}).
		Where("job_id = ?", jobID).
		Distinct("user_id").
		Count(&count).Error
	return count, err
}

// GetViewsInDateRange retrieves views within a date range
func (r *JobViewRepository) GetViewsInDateRange(jobID uuid.UUID, startDate, endDate time.Time) ([]domain.JobView, error) {
	var views []domain.JobView
	err := r.db.
		Where("job_id = ? AND viewed_at BETWEEN ? AND ?", jobID, startDate, endDate).
		Order("viewed_at DESC").
		Find(&views).Error
	return views, err
}

// CountViewsInDateRange counts views within a date range
func (r *JobViewRepository) CountViewsInDateRange(jobID uuid.UUID, startDate, endDate time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&domain.JobView{}).
		Where("job_id = ? AND viewed_at BETWEEN ? AND ?", jobID, startDate, endDate).
		Count(&count).Error
	return count, err
}

// GetViewsByReferrer retrieves views grouped by referrer
func (r *JobViewRepository) GetViewsByReferrer(jobID uuid.UUID) (map[string]int64, error) {
	type ReferrerCount struct {
		Referrer string
		Count    int64
	}

	var results []ReferrerCount
	err := r.db.Model(&domain.JobView{}).
		Select("referrer, COUNT(*) as count").
		Where("job_id = ?", jobID).
		Group("referrer").
		Order("count DESC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	referrerMap := make(map[string]int64)
	for _, result := range results {
		referrerMap[result.Referrer] = result.Count
	}

	return referrerMap, nil
}

// DeleteOldViews deletes views older than a specific date (for cleanup)
func (r *JobViewRepository) DeleteOldViews(beforeDate time.Time) error {
	return r.db.Where("viewed_at < ?", beforeDate).
		Delete(&domain.JobView{}).Error
}

// JobViewStats represents aggregated job view statistics
type JobViewStats struct {
	JobID      uuid.UUID `json:"job_id"`
	JobTitle   string    `json:"job_title"`
	JobSlug    string    `json:"job_slug"`
	Company    string    `json:"company"`
	Views      int64     `json:"views"`
	Clicks     int64     `json:"clicks"`
	IsFeatured bool      `json:"is_featured"`
}

// CountryStats represents views by country
type CountryStats struct {
	Country string `json:"country"`
	Views   int64  `json:"views"`
}

// TimeSeriesStats represents views over time
type TimeSeriesStats struct {
	Date  string `json:"date"`
	Value int64  `json:"value"`
}

// GetTotalViews returns total views count
func (r *JobViewRepository) GetTotalViews() (int64, error) {
	var count int64
	err := r.db.Model(&domain.JobView{}).Count(&count).Error
	return count, err
}

// GetTotalViewsInPeriod returns total views count within a period
func (r *JobViewRepository) GetTotalViewsInPeriod(since time.Time) (int64, error) {
	var count int64
	err := r.db.Model(&domain.JobView{}).
		Where("viewed_at >= ?", since).
		Count(&count).Error
	return count, err
}

// GetTopViewedJobs returns the most viewed jobs
func (r *JobViewRepository) GetTopViewedJobs(limit int, since *time.Time) ([]JobViewStats, error) {
	var results []JobViewStats

	query := r.db.Table("job_views").
		Select(`
			jobs.id as job_id,
			jobs.title as job_title,
			jobs.slug as job_slug,
			jobs.company_name as company,
			jobs.is_featured,
			COUNT(job_views.id) as views,
			jobs.applications_count as clicks
		`).
		Joins("JOIN jobs ON jobs.id = job_views.job_id").
		Where("jobs.deleted_at IS NULL")

	if since != nil {
		query = query.Where("job_views.viewed_at >= ?", *since)
	}

	err := query.
		Group("jobs.id, jobs.title, jobs.slug, jobs.company_name, jobs.is_featured, jobs.applications_count").
		Order("views DESC").
		Limit(limit).
		Scan(&results).Error

	return results, err
}

// GetViewsByCountry returns views grouped by country
func (r *JobViewRepository) GetViewsByCountry(since *time.Time) ([]CountryStats, error) {
	var results []CountryStats

	query := r.db.Table("job_views").
		Select("jobs.country, COUNT(job_views.id) as views").
		Joins("JOIN jobs ON jobs.id = job_views.job_id").
		Where("jobs.deleted_at IS NULL AND jobs.country IS NOT NULL AND jobs.country != ''")

	if since != nil {
		query = query.Where("job_views.viewed_at >= ?", *since)
	}

	err := query.
		Group("jobs.country").
		Order("views DESC").
		Scan(&results).Error

	return results, err
}

// GetViewsOverTime returns daily views for a time period
func (r *JobViewRepository) GetViewsOverTime(since time.Time) ([]TimeSeriesStats, error) {
	var results []TimeSeriesStats

	err := r.db.Table("job_views").
		Select("DATE(viewed_at) as date, COUNT(*) as value").
		Where("viewed_at >= ?", since).
		Group("DATE(viewed_at)").
		Order("date ASC").
		Scan(&results).Error

	return results, err
}

// GetApplicationsOverTime returns daily applications for a time period
func (r *JobViewRepository) GetApplicationsOverTime(since time.Time) ([]TimeSeriesStats, error) {
	var results []TimeSeriesStats

	err := r.db.Table("applications").
		Select("DATE(created_at) as date, COUNT(*) as value").
		Where("created_at >= ?", since).
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&results).Error

	return results, err
}

// GetMonthlyJobActivity returns monthly job postings
func (r *JobViewRepository) GetMonthlyJobActivity(months int) ([]TimeSeriesStats, error) {
	var results []TimeSeriesStats
	since := time.Now().AddDate(0, -months, 0)

	err := r.db.Table("jobs").
		Select("TO_CHAR(created_at, 'YYYY-MM') as date, COUNT(*) as value").
		Where("created_at >= ? AND deleted_at IS NULL", since).
		Group("TO_CHAR(created_at, 'YYYY-MM')").
		Order("date ASC").
		Scan(&results).Error

	return results, err
}

// GetFeaturedJobsStats returns statistics for featured jobs
func (r *JobViewRepository) GetFeaturedJobsStats() (map[string]interface{}, error) {
	var totalFeatured int64
	var activeFeatured int64
	var expiredFeatured int64

	// Total featured jobs
	r.db.Model(&domain.Job{}).
		Where("is_featured = ? AND deleted_at IS NULL", true).
		Count(&totalFeatured)

	// Active featured (not expired)
	r.db.Model(&domain.Job{}).
		Where("is_featured = ? AND deleted_at IS NULL AND (featured_until IS NULL OR featured_until > ?)", true, time.Now()).
		Count(&activeFeatured)

	// Expired featured
	r.db.Model(&domain.Job{}).
		Where("is_featured = ? AND deleted_at IS NULL AND featured_until IS NOT NULL AND featured_until <= ?", true, time.Now()).
		Count(&expiredFeatured)

	// Average views for featured vs non-featured
	var featuredAvgViews, nonFeaturedAvgViews float64
	r.db.Model(&domain.Job{}).
		Select("COALESCE(AVG(views_count), 0)").
		Where("is_featured = ? AND deleted_at IS NULL", true).
		Scan(&featuredAvgViews)

	r.db.Model(&domain.Job{}).
		Select("COALESCE(AVG(views_count), 0)").
		Where("is_featured = ? AND deleted_at IS NULL", false).
		Scan(&nonFeaturedAvgViews)

	return map[string]interface{}{
		"total_featured":         totalFeatured,
		"active_featured":        activeFeatured,
		"expired_featured":       expiredFeatured,
		"featured_avg_views":     featuredAvgViews,
		"non_featured_avg_views": nonFeaturedAvgViews,
	}, nil
}

// GetJobConversionRates returns view to application conversion rates
func (r *JobViewRepository) GetJobConversionRates(limit int) ([]map[string]interface{}, error) {
	var results []struct {
		JobID        uuid.UUID
		Title        string
		Company      string
		Views        int64
		Applications int64
	}

	err := r.db.Table("jobs").
		Select("jobs.id as job_id, jobs.title, jobs.company_name as company, jobs.views_count as views, jobs.applications_count as applications").
		Where("jobs.deleted_at IS NULL AND jobs.views_count > 0").
		Order("(CAST(applications_count AS FLOAT) / CAST(views_count AS FLOAT)) DESC").
		Limit(limit).
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	var output []map[string]interface{}
	for _, r := range results {
		conversionRate := float64(0)
		if r.Views > 0 {
			conversionRate = float64(r.Applications) / float64(r.Views) * 100
		}
		output = append(output, map[string]interface{}{
			"job_id":          r.JobID,
			"title":           r.Title,
			"company":         r.Company,
			"views":           r.Views,
			"applications":    r.Applications,
			"conversion_rate": conversionRate,
		})
	}

	return output, nil
}

// GetUserActivityStats returns user engagement statistics
func (r *JobViewRepository) GetUserActivityStats(since time.Time) (map[string]interface{}, error) {
	// Unique viewers
	var uniqueViewers int64
	r.db.Model(&domain.JobView{}).
		Where("viewed_at >= ? AND user_id IS NOT NULL", since).
		Distinct("user_id").
		Count(&uniqueViewers)

	// Anonymous views
	var anonymousViews int64
	r.db.Model(&domain.JobView{}).
		Where("viewed_at >= ? AND user_id IS NULL", since).
		Count(&anonymousViews)

	// Authenticated views
	var authenticatedViews int64
	r.db.Model(&domain.JobView{}).
		Where("viewed_at >= ? AND user_id IS NOT NULL", since).
		Count(&authenticatedViews)

	return map[string]interface{}{
		"unique_viewers":      uniqueViewers,
		"anonymous_views":     anonymousViews,
		"authenticated_views": authenticatedViews,
	}, nil
}
