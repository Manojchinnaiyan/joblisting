package cron

import (
	"context"
	"log"
	"time"

	"job-platform/internal/cache"
	"job-platform/internal/repository"

	"github.com/google/uuid"
)

// ViewSyncScheduler syncs view counts from Redis to database
type ViewSyncScheduler struct {
	cacheService *cache.CacheService
	jobRepo      *repository.JobRepository
	blogRepo     *repository.BlogRepository
	stopChan     chan struct{}
	interval     time.Duration
}

// NewViewSyncScheduler creates a new view sync scheduler
func NewViewSyncScheduler(
	cacheService *cache.CacheService,
	jobRepo *repository.JobRepository,
	blogRepo *repository.BlogRepository,
	interval time.Duration,
) *ViewSyncScheduler {
	if interval == 0 {
		interval = 5 * time.Minute // Default sync interval
	}
	return &ViewSyncScheduler{
		cacheService: cacheService,
		jobRepo:      jobRepo,
		blogRepo:     blogRepo,
		stopChan:     make(chan struct{}),
		interval:     interval,
	}
}

// Start begins the view sync scheduler
func (s *ViewSyncScheduler) Start() {
	if s.cacheService == nil || !s.cacheService.IsAvailable() {
		log.Println("⚠️  View sync scheduler not started: cache service not available")
		return
	}

	go func() {
		ticker := time.NewTicker(s.interval)
		defer ticker.Stop()

		log.Printf("✅ View sync scheduler started (interval: %v)", s.interval)

		for {
			select {
			case <-ticker.C:
				s.syncViewCounts()
			case <-s.stopChan:
				log.Println("🛑 View sync scheduler stopped")
				return
			}
		}
	}()
}

// Stop stops the view sync scheduler
func (s *ViewSyncScheduler) Stop() {
	close(s.stopChan)
}

// syncViewCounts syncs all view counts from Redis to database
func (s *ViewSyncScheduler) syncViewCounts() {
	ctx := context.Background()

	// Sync job view counts
	s.syncJobViewCounts(ctx)

	// Sync blog view counts
	s.syncBlogViewCounts(ctx)
}

// syncJobViewCounts syncs job view counts from Redis to database
func (s *ViewSyncScheduler) syncJobViewCounts(ctx context.Context) {
	counts, err := s.cacheService.GetAllViewCounts(ctx, "job")
	if err != nil {
		log.Printf("Error getting job view counts from Redis: %v", err)
		return
	}

	if len(counts) == 0 {
		return
	}

	synced := 0
	for jobIDStr, count := range counts {
		if count == 0 {
			continue
		}

		jobID, err := uuid.Parse(jobIDStr)
		if err != nil {
			log.Printf("Invalid job ID in cache: %s", jobIDStr)
			continue
		}

		// Increment view count in database
		if err := s.jobRepo.IncrementViewCountBy(jobID, int(count)); err != nil {
			log.Printf("Error syncing job view count for %s: %v", jobIDStr, err)
			continue
		}

		// Reset the counter in Redis after successful sync
		if err := s.cacheService.ResetViewCount(ctx, "job", jobIDStr); err != nil {
			log.Printf("Error resetting job view count for %s: %v", jobIDStr, err)
		}

		synced++
	}

	if synced > 0 {
		log.Printf("📊 Synced %d job view counts to database", synced)
	}
}

// syncBlogViewCounts syncs blog view counts from Redis to database
func (s *ViewSyncScheduler) syncBlogViewCounts(ctx context.Context) {
	counts, err := s.cacheService.GetAllViewCounts(ctx, "blog")
	if err != nil {
		log.Printf("Error getting blog view counts from Redis: %v", err)
		return
	}

	if len(counts) == 0 {
		return
	}

	synced := 0
	for blogIDStr, count := range counts {
		if count == 0 {
			continue
		}

		blogID, err := uuid.Parse(blogIDStr)
		if err != nil {
			log.Printf("Invalid blog ID in cache: %s", blogIDStr)
			continue
		}

		// Increment view count in database
		if err := s.blogRepo.IncrementViewCountBy(blogID, int(count)); err != nil {
			log.Printf("Error syncing blog view count for %s: %v", blogIDStr, err)
			continue
		}

		// Reset the counter in Redis after successful sync
		if err := s.cacheService.ResetViewCount(ctx, "blog", blogIDStr); err != nil {
			log.Printf("Error resetting blog view count for %s: %v", blogIDStr, err)
		}

		synced++
	}

	if synced > 0 {
		log.Printf("📊 Synced %d blog view counts to database", synced)
	}
}
