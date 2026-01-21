package cron

import (
	"job-platform/internal/service"
	"log"
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
// Note: Job expiry has been disabled - jobs never expire automatically
func (s *JobCronScheduler) Start() {
	log.Println("🕐 Starting job cron scheduler...")
	log.Println("✅ Job cron scheduler started (expiry disabled)")
}

// Stop gracefully stops all cron jobs
func (s *JobCronScheduler) Stop() {
	log.Println("🛑 Stopping job cron scheduler...")
	close(s.stopChan)
	log.Println("✅ Job cron scheduler stopped")
}

// GetSchedulerStatus returns the current status of the scheduler
func (s *JobCronScheduler) GetSchedulerStatus() map[string]interface{} {
	return map[string]interface{}{
		"status": "running",
		"jobs":   []map[string]interface{}{},
	}
}
