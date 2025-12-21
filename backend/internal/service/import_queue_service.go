package service

import (
	"context"
	"encoding/json"
	"job-platform/internal/domain"
	"job-platform/internal/dto"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

// scrapedDataToInput converts scraped job data to AdminCreateJobInput
func scrapedDataToInput(data *dto.ScrapedJobResponse) AdminCreateJobInput {
	// Map job type
	jobType := domain.JobTypeFullTime
	switch data.JobType {
	case "FULL_TIME":
		jobType = domain.JobTypeFullTime
	case "PART_TIME":
		jobType = domain.JobTypePartTime
	case "CONTRACT":
		jobType = domain.JobTypeContract
	case "FREELANCE":
		jobType = domain.JobTypeFreelance
	case "INTERNSHIP":
		jobType = domain.JobTypeInternship
	}

	// Map experience level
	experienceLevel := domain.ExperienceLevelMid
	switch data.ExperienceLevel {
	case "ENTRY":
		experienceLevel = domain.ExperienceLevelEntry
	case "MID":
		experienceLevel = domain.ExperienceLevelMid
	case "SENIOR":
		experienceLevel = domain.ExperienceLevelSenior
	case "LEAD":
		experienceLevel = domain.ExperienceLevelLead
	case "EXECUTIVE":
		experienceLevel = domain.ExperienceLevelExecutive
	}

	// Create description that includes requirements if present
	description := data.Description
	if data.Requirements != "" && !strings.Contains(data.Description, data.Requirements) {
		description = description + "\n\n<h3>Requirements</h3>\n" + data.Requirements
	}

	// Determine location string
	location := data.Location
	if location == "" {
		parts := []string{}
		if data.City != "" {
			parts = append(parts, data.City)
		}
		if data.State != "" {
			parts = append(parts, data.State)
		}
		if data.Country != "" {
			parts = append(parts, data.Country)
		}
		location = strings.Join(parts, ", ")
		if location == "" {
			location = "Remote"
		}
	}

	// Generate short description
	shortDesc := stripHTMLTagsSimple(description)
	if len(shortDesc) > 300 {
		shortDesc = shortDesc[:297] + "..."
	}

	return AdminCreateJobInput{
		CreateJobInput: CreateJobInput{
			Title:            data.Title,
			Description:      description,
			ShortDescription: shortDesc,
			JobType:          jobType,
			ExperienceLevel:  experienceLevel,
			WorkplaceType:    domain.WorkplaceTypeOnsite,
			Location:         location,
			City:             data.City,
			State:            data.State,
			Country:          data.Country,
			Skills:           data.Skills,
			Benefits:         data.Benefits,
		},
		CompanyName:    data.Company,
		CompanyLogoURL: data.CompanyLogo,
		Status:         "ACTIVE",
	}
}

// stripHTMLTagsSimple removes HTML tags from a string
func stripHTMLTagsSimple(html string) string {
	result := html
	for {
		start := strings.Index(result, "<")
		if start == -1 {
			break
		}
		end := strings.Index(result[start:], ">")
		if end == -1 {
			break
		}
		result = result[:start] + " " + result[start+end+1:]
	}
	for strings.Contains(result, "  ") {
		result = strings.ReplaceAll(result, "  ", " ")
	}
	return strings.TrimSpace(result)
}

// ImportJobStatus represents the status of an import job
type ImportJobStatus string

const (
	ImportStatusPending    ImportJobStatus = "pending"
	ImportStatusProcessing ImportJobStatus = "processing"
	ImportStatusCompleted  ImportJobStatus = "completed"
	ImportStatusFailed     ImportJobStatus = "failed"
	ImportStatusCancelled  ImportJobStatus = "cancelled"
)

// LinkExtractionTask represents a background link extraction task
type LinkExtractionTask struct {
	ID        string                   `json:"id"`
	SourceURL string                   `json:"source_url"`
	Status    ImportJobStatus          `json:"status"`
	Links     []dto.ExtractedJobLink   `json:"links,omitempty"`
	Total     int                      `json:"total"`
	Error     string                   `json:"error,omitempty"`
	CreatedAt time.Time                `json:"created_at"`
	UpdatedAt time.Time                `json:"updated_at"`
}

// ImportJob represents a single job to be imported
type ImportJob struct {
	ID        string          `json:"id"`
	URL       string          `json:"url"`
	Title     string          `json:"title"`
	Status    ImportJobStatus `json:"status"`
	Error     string          `json:"error,omitempty"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}

// ImportQueue represents a batch import queue
type ImportQueue struct {
	ID          string          `json:"id"`
	Status      ImportJobStatus `json:"status"`
	Jobs        []*ImportJob    `json:"jobs"`
	TotalJobs   int             `json:"total_jobs"`
	Completed   int             `json:"completed"`
	Failed      int             `json:"failed"`
	Cancelled   int             `json:"cancelled"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	SourceURL   string          `json:"source_url"`
	AdminID     uuid.UUID       `json:"-"` // Admin who created the queue (not exposed in JSON)
}

// ImportQueueService manages background job imports
type ImportQueueService struct {
	scraperService    *ScraperService
	jobService        *JobService
	queues            map[string]*ImportQueue
	extractionTasks   map[string]*LinkExtractionTask
	mu                sync.RWMutex
	cancelChans       map[string]chan struct{}
}

// NewImportQueueService creates a new import queue service
func NewImportQueueService(scraperService *ScraperService, jobService *JobService) *ImportQueueService {
	return &ImportQueueService{
		scraperService:  scraperService,
		jobService:      jobService,
		queues:          make(map[string]*ImportQueue),
		extractionTasks: make(map[string]*LinkExtractionTask),
		cancelChans:     make(map[string]chan struct{}),
	}
}

// CreateQueue creates a new import queue with the given job URLs
func (s *ImportQueueService) CreateQueue(adminID uuid.UUID, sourceURL string, urls []string, titles []string) *ImportQueue {
	s.mu.Lock()
	defer s.mu.Unlock()

	queueID := uuid.New().String()
	now := time.Now()

	jobs := make([]*ImportJob, len(urls))
	for i, url := range urls {
		title := ""
		if i < len(titles) {
			title = titles[i]
		}
		jobs[i] = &ImportJob{
			ID:        uuid.New().String(),
			URL:       url,
			Title:     title,
			Status:    ImportStatusPending,
			CreatedAt: now,
			UpdatedAt: now,
		}
	}

	queue := &ImportQueue{
		ID:        queueID,
		Status:    ImportStatusPending,
		Jobs:      jobs,
		TotalJobs: len(urls),
		CreatedAt: now,
		UpdatedAt: now,
		SourceURL: sourceURL,
		AdminID:   adminID,
	}

	s.queues[queueID] = queue
	s.cancelChans[queueID] = make(chan struct{})

	return queue
}

// StartQueue starts processing a queue in the background
func (s *ImportQueueService) StartQueue(ctx context.Context, queueID string) error {
	s.mu.Lock()
	queue, exists := s.queues[queueID]
	cancelChan := s.cancelChans[queueID]
	s.mu.Unlock()

	if !exists {
		return nil
	}

	// Start processing in background
	go s.processQueue(ctx, queue, cancelChan)

	return nil
}

// processQueue processes all jobs in a queue
func (s *ImportQueueService) processQueue(ctx context.Context, queue *ImportQueue, cancelChan chan struct{}) {
	s.mu.Lock()
	queue.Status = ImportStatusProcessing
	queue.UpdatedAt = time.Now()
	s.mu.Unlock()

	log.Printf("🚀 Starting import queue %s with %d jobs", queue.ID, len(queue.Jobs))

	for _, job := range queue.Jobs {
		// Check for cancellation
		select {
		case <-cancelChan:
			log.Printf("🛑 Queue %s cancelled", queue.ID)
			s.mu.Lock()
			queue.Status = ImportStatusCancelled
			queue.UpdatedAt = time.Now()
			// Mark remaining pending jobs as cancelled
			for _, j := range queue.Jobs {
				if j.Status == ImportStatusPending {
					j.Status = ImportStatusCancelled
					j.UpdatedAt = time.Now()
					queue.Cancelled++
				}
			}
			s.mu.Unlock()
			return
		case <-ctx.Done():
			log.Printf("🛑 Queue %s context cancelled", queue.ID)
			return
		default:
		}

		// Process this job
		s.processJob(ctx, queue, job)

		// Small delay between jobs to be respectful to the target site
		time.Sleep(500 * time.Millisecond)
	}

	// Mark queue as completed
	s.mu.Lock()
	queue.Status = ImportStatusCompleted
	queue.UpdatedAt = time.Now()
	s.mu.Unlock()

	log.Printf("✅ Import queue %s completed: %d success, %d failed", queue.ID, queue.Completed, queue.Failed)
}

// processJob processes a single import job
func (s *ImportQueueService) processJob(ctx context.Context, queue *ImportQueue, job *ImportJob) {
	s.mu.Lock()
	job.Status = ImportStatusProcessing
	job.UpdatedAt = time.Now()
	s.mu.Unlock()

	log.Printf("🔄 Processing job: %s", job.URL)

	// Scrape the job
	scrapedJob, _, err := s.scraperService.ScrapeJobURL(ctx, job.URL)
	if err != nil {
		s.mu.Lock()
		job.Status = ImportStatusFailed
		job.Error = err.Error()
		job.UpdatedAt = time.Now()
		queue.Failed++
		queue.UpdatedAt = time.Now()
		s.mu.Unlock()
		log.Printf("❌ Failed to scrape job %s: %v", job.URL, err)
		return
	}

	// Convert scraped data to job input
	input := scrapedDataToInput(scrapedJob)

	// Store scraped data as JSON
	scrapedDataJSON, _ := json.Marshal(scrapedJob)
	scrapedDataStr := string(scrapedDataJSON)
	input.ScrapedData = &scrapedDataStr
	input.ScrapeStatus = "scraped"
	input.OriginalURL = &scrapedJob.OriginalURL

	// Create the job in database using jobService with the admin who created the queue
	_, err = s.jobService.AdminCreateJob(queue.AdminID, input)
	if err != nil {
		s.mu.Lock()
		job.Status = ImportStatusFailed
		job.Error = err.Error()
		job.UpdatedAt = time.Now()
		queue.Failed++
		queue.UpdatedAt = time.Now()
		s.mu.Unlock()
		log.Printf("❌ Failed to create job %s: %v", job.URL, err)
		return
	}

	// Success
	s.mu.Lock()
	job.Status = ImportStatusCompleted
	job.UpdatedAt = time.Now()
	if scrapedJob.Title != "" {
		job.Title = scrapedJob.Title
	}
	queue.Completed++
	queue.UpdatedAt = time.Now()
	s.mu.Unlock()

	log.Printf("✅ Successfully imported: %s", job.Title)
}

// GetQueue returns a queue by ID
func (s *ImportQueueService) GetQueue(queueID string) *ImportQueue {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.queues[queueID]
}

// GetAllQueues returns all queues
func (s *ImportQueueService) GetAllQueues() []*ImportQueue {
	s.mu.RLock()
	defer s.mu.RUnlock()

	queues := make([]*ImportQueue, 0, len(s.queues))
	for _, q := range s.queues {
		queues = append(queues, q)
	}
	return queues
}

// CancelQueue cancels a running queue
func (s *ImportQueueService) CancelQueue(queueID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	queue, exists := s.queues[queueID]
	if !exists {
		return false
	}

	if queue.Status != ImportStatusProcessing && queue.Status != ImportStatusPending {
		return false
	}

	// Signal cancellation
	if cancelChan, ok := s.cancelChans[queueID]; ok {
		close(cancelChan)
	}

	return true
}

// CancelJob cancels a specific pending job
func (s *ImportQueueService) CancelJob(queueID, jobID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	queue, exists := s.queues[queueID]
	if !exists {
		return false
	}

	for _, job := range queue.Jobs {
		if job.ID == jobID && job.Status == ImportStatusPending {
			job.Status = ImportStatusCancelled
			job.UpdatedAt = time.Now()
			queue.Cancelled++
			queue.UpdatedAt = time.Now()
			return true
		}
	}

	return false
}

// DeleteQueue removes a queue (only if not processing)
func (s *ImportQueueService) DeleteQueue(queueID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	queue, exists := s.queues[queueID]
	if !exists {
		return false
	}

	if queue.Status == ImportStatusProcessing {
		return false
	}

	delete(s.queues, queueID)
	delete(s.cancelChans, queueID)
	return true
}

// CleanupOldQueues removes queues older than the given duration
func (s *ImportQueueService) CleanupOldQueues(maxAge time.Duration) {
	s.mu.Lock()
	defer s.mu.Unlock()

	cutoff := time.Now().Add(-maxAge)
	for id, queue := range s.queues {
		if queue.Status != ImportStatusProcessing && queue.UpdatedAt.Before(cutoff) {
			delete(s.queues, id)
			delete(s.cancelChans, id)
		}
	}
	// Also cleanup old extraction tasks
	for id, task := range s.extractionTasks {
		if task.Status != ImportStatusProcessing && task.UpdatedAt.Before(cutoff) {
			delete(s.extractionTasks, id)
		}
	}
}

// StartLinkExtraction starts a background link extraction task
func (s *ImportQueueService) StartLinkExtraction(sourceURL string) *LinkExtractionTask {
	s.mu.Lock()
	taskID := uuid.New().String()
	now := time.Now()

	task := &LinkExtractionTask{
		ID:        taskID,
		SourceURL: sourceURL,
		Status:    ImportStatusPending,
		Links:     []dto.ExtractedJobLink{},
		Total:     0,
		CreatedAt: now,
		UpdatedAt: now,
	}

	s.extractionTasks[taskID] = task
	s.mu.Unlock()

	// Start extraction in background
	go s.processLinkExtraction(task)

	return task
}

// processLinkExtraction runs the actual link extraction in background
func (s *ImportQueueService) processLinkExtraction(task *LinkExtractionTask) {
	s.mu.Lock()
	task.Status = ImportStatusProcessing
	task.UpdatedAt = time.Now()
	s.mu.Unlock()

	log.Printf("🔗 Starting link extraction for: %s", task.SourceURL)

	ctx := context.Background()
	result, err := s.scraperService.ExtractJobLinks(ctx, task.SourceURL)

	s.mu.Lock()
	defer s.mu.Unlock()

	if err != nil {
		task.Status = ImportStatusFailed
		task.Error = err.Error()
		task.UpdatedAt = time.Now()
		log.Printf("❌ Link extraction failed for %s: %v", task.SourceURL, err)
		return
	}

	task.Status = ImportStatusCompleted
	task.Links = result.Links
	task.Total = result.Total
	task.UpdatedAt = time.Now()
	log.Printf("✅ Link extraction completed for %s: found %d links", task.SourceURL, result.Total)
}

// GetExtractionTask returns an extraction task by ID
func (s *ImportQueueService) GetExtractionTask(taskID string) *LinkExtractionTask {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.extractionTasks[taskID]
}

// GetAllExtractionTasks returns all extraction tasks
func (s *ImportQueueService) GetAllExtractionTasks() []*LinkExtractionTask {
	s.mu.RLock()
	defer s.mu.RUnlock()

	tasks := make([]*LinkExtractionTask, 0, len(s.extractionTasks))
	for _, t := range s.extractionTasks {
		tasks = append(tasks, t)
	}
	return tasks
}

// DeleteExtractionTask removes an extraction task
func (s *ImportQueueService) DeleteExtractionTask(taskID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	task, exists := s.extractionTasks[taskID]
	if !exists {
		return false
	}

	if task.Status == ImportStatusProcessing {
		return false
	}

	delete(s.extractionTasks, taskID)
	return true
}
