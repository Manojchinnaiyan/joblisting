package cron

import (
	"job-platform/internal/service"
	"log"
	"time"
)

// JobCronScheduler manages scheduled job-related tasks
type JobCronScheduler struct {
	jobService *service.JobService
	stopChan   chan bool
}

// NewJobCronScheduler creates a new job cron scheduler
func NewJobCronScheduler(jobService *service.JobService) *JobCronScheduler {
	return &JobCronScheduler{
		jobService: jobService,
		stopChan:   make(chan bool),
	}
}

// Start begins all cron jobs
func (s *JobCronScheduler) Start() {
	log.Println("🕐 Starting job cron scheduler...")

	// Job expiry is disabled - jobs never expire automatically
	// go s.runJobExpiryChecker()

	// Expiry warning notifier is disabled since jobs don't expire
	// go s.runExpiryWarningNotifier()

	log.Println("✅ Job cron scheduler started (expiry disabled)")
}

// Stop gracefully stops all cron jobs
func (s *JobCronScheduler) Stop() {
	log.Println("🛑 Stopping job cron scheduler...")
	close(s.stopChan)
	log.Println("✅ Job cron scheduler stopped")
}

// runJobExpiryChecker checks and expires overdue jobs every hour
func (s *JobCronScheduler) runJobExpiryChecker() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	// Run immediately on start
	s.checkAndExpireJobs()

	for {
		select {
		case <-ticker.C:
			s.checkAndExpireJobs()
		case <-s.stopChan:
			return
		}
	}
}

// checkAndExpireJobs expires all overdue jobs
func (s *JobCronScheduler) checkAndExpireJobs() {
	log.Println("⏰ Running job expiry checker...")

	count, err := s.jobService.ExpireOverdueJobs()
	if err != nil {
		log.Printf("❌ Error expiring overdue jobs: %v", err)
		return
	}

	if count > 0 {
		log.Printf("✅ Expired %d overdue job(s)", count)
	} else {
		log.Println("✅ No jobs to expire")
	}
}

// runExpiryWarningNotifier sends expiry warnings to employers every 6 hours
func (s *JobCronScheduler) runExpiryWarningNotifier() {
	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()

	// Run immediately on start
	s.sendExpiryWarnings()

	for {
		select {
		case <-ticker.C:
			s.sendExpiryWarnings()
		case <-s.stopChan:
			return
		}
	}
}

// sendExpiryWarnings sends expiry warning notifications to employers
func (s *JobCronScheduler) sendExpiryWarnings() {
	log.Println("📧 Running expiry warning notifier...")

	jobs, err := s.jobService.GetJobsNearExpiry()
	if err != nil {
		log.Printf("❌ Error fetching jobs near expiry: %v", err)
		return
	}

	if len(jobs) == 0 {
		log.Println("✅ No jobs near expiry")
		return
	}

	log.Printf("📊 Found %d job(s) near expiry", len(jobs))

	// TODO: Send email notifications to employers
	// This would integrate with the email service to send warnings
	// Example:
	// for _, job := range jobs {
	//     emailService.SendJobExpiryWarning(job.Employer.Email, job)
	// }

	log.Printf("✅ Processed expiry warnings for %d job(s)", len(jobs))
}

// GetSchedulerStatus returns the current status of the scheduler
func (s *JobCronScheduler) GetSchedulerStatus() map[string]interface{} {
	return map[string]interface{}{
		"status": "running",
		"jobs": []map[string]interface{}{
			{
				"name":     "job_expiry_checker",
				"interval": "1 hour",
				"status":   "active",
			},
			{
				"name":     "expiry_warning_notifier",
				"interval": "6 hours",
				"status":   "active",
			},
		},
	}
}
