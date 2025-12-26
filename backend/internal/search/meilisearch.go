package search

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/meilisearch/meilisearch-go"
)

// Index names
const (
	JobsIndex  = "jobs"
	BlogsIndex = "blogs"
)

// MeiliConfig holds MeiliSearch configuration
type MeiliConfig struct {
	Host      string
	MasterKey string
}

// MeiliClient wraps the MeiliSearch client
type MeiliClient struct {
	client meilisearch.ServiceManager
	config MeiliConfig
}

// JobDocument represents a job for indexing in MeiliSearch
type JobDocument struct {
	ID               string   `json:"id"`
	Title            string   `json:"title"`
	Slug             string   `json:"slug"`
	Description      string   `json:"description"`
	ShortDescription string   `json:"short_description"`
	CompanyName      string   `json:"company_name"`
	CompanyLogoURL   string   `json:"company_logo_url"`
	JobType          string   `json:"job_type"`
	ExperienceLevel  string   `json:"experience_level"`
	WorkplaceType    string   `json:"workplace_type"`
	Location         string   `json:"location"`
	City             string   `json:"city"`
	State            string   `json:"state"`
	Country          string   `json:"country"`
	SalaryMin        int      `json:"salary_min"`
	SalaryMax        int      `json:"salary_max"`
	SalaryCurrency   string   `json:"salary_currency"`
	Skills           []string `json:"skills"`
	Benefits         []string `json:"benefits"`
	IsFeatured       bool     `json:"is_featured"`
	Status           string   `json:"status"`
	PublishedAt      int64    `json:"published_at"`
	CreatedAt        int64    `json:"created_at"`
	ViewsCount       int      `json:"views_count"`
}

// BlogDocument represents a blog for indexing in MeiliSearch
type BlogDocument struct {
	ID            string   `json:"id"`
	Title         string   `json:"title"`
	Slug          string   `json:"slug"`
	Excerpt       string   `json:"excerpt"`
	Content       string   `json:"content"`
	FeaturedImage string   `json:"featured_image"`
	AuthorID      string   `json:"author_id"`
	AuthorName    string   `json:"author_name"`
	CategoryID    string   `json:"category_id"`
	CategoryName  string   `json:"category_name"`
	Tags          []string `json:"tags"`
	Status        string   `json:"status"`
	PublishedAt   int64    `json:"published_at"`
	CreatedAt     int64    `json:"created_at"`
	ViewCount     int      `json:"view_count"`
}

// SearchResult represents search results with pagination
type SearchResult struct {
	Hits             []map[string]interface{} `json:"hits"`
	Query            string                   `json:"query"`
	ProcessingTimeMs int64                    `json:"processing_time_ms"`
	TotalHits        int64                    `json:"total_hits"`
	Offset           int64                    `json:"offset"`
	Limit            int64                    `json:"limit"`
}

// NewMeiliClient creates a new MeiliSearch client
func NewMeiliClient(config MeiliConfig) (*MeiliClient, error) {
	if config.Host == "" {
		return nil, fmt.Errorf("meilisearch host is required")
	}

	client := meilisearch.New(config.Host, meilisearch.WithAPIKey(config.MasterKey))

	// Test connection
	_, err := client.Health()
	if err != nil {
		return nil, fmt.Errorf("failed to connect to meilisearch: %w", err)
	}

	log.Printf("✅ Connected to MeiliSearch at %s", config.Host)

	return &MeiliClient{
		client: client,
		config: config,
	}, nil
}

// InitIndexes creates and configures indexes with proper settings
func (m *MeiliClient) InitIndexes(ctx context.Context) error {
	// Initialize jobs index
	if err := m.initJobsIndex(); err != nil {
		return fmt.Errorf("failed to init jobs index: %w", err)
	}

	// Initialize blogs index
	if err := m.initBlogsIndex(); err != nil {
		return fmt.Errorf("failed to init blogs index: %w", err)
	}

	log.Println("✅ MeiliSearch indexes initialized")
	return nil
}

func (m *MeiliClient) initJobsIndex() error {
	index := m.client.Index(JobsIndex)

	// Create index if not exists
	task, err := m.client.CreateIndex(&meilisearch.IndexConfig{
		Uid:        JobsIndex,
		PrimaryKey: "id",
	})
	if err != nil {
		// Index might already exist, continue
		log.Printf("Jobs index creation: %v (may already exist)", err)
	} else {
		m.waitForTask(task.TaskUID)
	}

	// Configure searchable attributes
	searchableAttrs := []string{
		"title",
		"description",
		"short_description",
		"company_name",
		"location",
		"city",
		"state",
		"country",
		"skills",
	}
	task, err = index.UpdateSearchableAttributes(&searchableAttrs)
	if err != nil {
		return err
	}
	m.waitForTask(task.TaskUID)

	// Configure filterable attributes
	filterableAttrs := []interface{}{
		"job_type",
		"experience_level",
		"workplace_type",
		"location",
		"city",
		"state",
		"country",
		"skills",
		"salary_min",
		"salary_max",
		"is_featured",
		"status",
		"published_at",
	}
	task, err = index.UpdateFilterableAttributes(&filterableAttrs)
	if err != nil {
		return err
	}
	m.waitForTask(task.TaskUID)

	// Configure sortable attributes
	sortableAttrs := []string{
		"published_at",
		"created_at",
		"salary_min",
		"salary_max",
		"views_count",
		"is_featured",
	}
	task, err = index.UpdateSortableAttributes(&sortableAttrs)
	if err != nil {
		return err
	}
	m.waitForTask(task.TaskUID)

	// Configure ranking rules
	rankingRules := []string{
		"words",
		"typo",
		"proximity",
		"attribute",
		"sort",
		"exactness",
		"is_featured:desc",
		"published_at:desc",
	}
	task, err = index.UpdateRankingRules(&rankingRules)
	if err != nil {
		return err
	}
	m.waitForTask(task.TaskUID)

	log.Println("✅ Jobs index configured")
	return nil
}

func (m *MeiliClient) initBlogsIndex() error {
	index := m.client.Index(BlogsIndex)

	// Create index if not exists
	task, err := m.client.CreateIndex(&meilisearch.IndexConfig{
		Uid:        BlogsIndex,
		PrimaryKey: "id",
	})
	if err != nil {
		log.Printf("Blogs index creation: %v (may already exist)", err)
	} else {
		m.waitForTask(task.TaskUID)
	}

	// Configure searchable attributes
	searchableAttrs := []string{
		"title",
		"excerpt",
		"content",
		"author_name",
		"category_name",
		"tags",
	}
	task, err = index.UpdateSearchableAttributes(&searchableAttrs)
	if err != nil {
		return err
	}
	m.waitForTask(task.TaskUID)

	// Configure filterable attributes
	filterableAttrs := []interface{}{
		"author_id",
		"category_id",
		"category_name",
		"tags",
		"status",
		"published_at",
	}
	task, err = index.UpdateFilterableAttributes(&filterableAttrs)
	if err != nil {
		return err
	}
	m.waitForTask(task.TaskUID)

	// Configure sortable attributes
	sortableAttrs := []string{
		"published_at",
		"created_at",
		"view_count",
	}
	task, err = index.UpdateSortableAttributes(&sortableAttrs)
	if err != nil {
		return err
	}
	m.waitForTask(task.TaskUID)

	log.Println("✅ Blogs index configured")
	return nil
}

func (m *MeiliClient) waitForTask(taskUID int64) {
	task, err := m.client.WaitForTask(taskUID, 100*time.Millisecond)
	if err != nil {
		log.Printf("Task wait error: %v", err)
	} else if task.Status == meilisearch.TaskStatusFailed {
		log.Printf("Task failed: %v", task.Error)
	}
}

// IndexJob adds or updates a job in the search index
func (m *MeiliClient) IndexJob(job *JobDocument) error {
	index := m.client.Index(JobsIndex)
	primaryKey := "id"
	task, err := index.AddDocuments([]JobDocument{*job}, &meilisearch.DocumentOptions{PrimaryKey: &primaryKey})
	if err != nil {
		return fmt.Errorf("failed to index job: %w", err)
	}
	m.waitForTask(task.TaskUID)
	return nil
}

// IndexJobs adds or updates multiple jobs in the search index
func (m *MeiliClient) IndexJobs(jobs []JobDocument) error {
	if len(jobs) == 0 {
		return nil
	}
	index := m.client.Index(JobsIndex)
	primaryKey := "id"
	task, err := index.AddDocuments(jobs, &meilisearch.DocumentOptions{PrimaryKey: &primaryKey})
	if err != nil {
		return fmt.Errorf("failed to index jobs: %w", err)
	}
	m.waitForTask(task.TaskUID)
	log.Printf("✅ Indexed %d jobs", len(jobs))
	return nil
}

// DeleteJob removes a job from the search index
func (m *MeiliClient) DeleteJob(jobID uuid.UUID) error {
	index := m.client.Index(JobsIndex)
	task, err := index.DeleteDocument(jobID.String(), nil)
	if err != nil {
		return fmt.Errorf("failed to delete job from index: %w", err)
	}
	m.waitForTask(task.TaskUID)
	return nil
}

// SearchJobs searches for jobs
func (m *MeiliClient) SearchJobs(query string, filters *JobSearchFilters) (*SearchResult, error) {
	index := m.client.Index(JobsIndex)

	searchRequest := &meilisearch.SearchRequest{
		Query:  query,
		Offset: int64(filters.Offset),
		Limit:  int64(filters.Limit),
	}

	// Build filter string
	filterParts := []string{}

	// Only show active jobs by default
	filterParts = append(filterParts, `status = "ACTIVE"`)

	if filters.JobType != "" {
		filterParts = append(filterParts, fmt.Sprintf(`job_type = "%s"`, filters.JobType))
	}
	if filters.ExperienceLevel != "" {
		filterParts = append(filterParts, fmt.Sprintf(`experience_level = "%s"`, filters.ExperienceLevel))
	}
	if filters.WorkplaceType != "" {
		filterParts = append(filterParts, fmt.Sprintf(`workplace_type = "%s"`, filters.WorkplaceType))
	}
	if filters.Location != "" {
		filterParts = append(filterParts, fmt.Sprintf(`(location = "%s" OR city = "%s" OR state = "%s" OR country = "%s")`,
			filters.Location, filters.Location, filters.Location, filters.Location))
	}
	if filters.SalaryMin > 0 {
		filterParts = append(filterParts, fmt.Sprintf(`salary_max >= %d`, filters.SalaryMin))
	}
	if filters.SalaryMax > 0 {
		filterParts = append(filterParts, fmt.Sprintf(`salary_min <= %d`, filters.SalaryMax))
	}
	if len(filters.Skills) > 0 {
		skillFilters := make([]string, len(filters.Skills))
		for i, skill := range filters.Skills {
			skillFilters[i] = fmt.Sprintf(`skills = "%s"`, skill)
		}
		filterParts = append(filterParts, "("+strings.Join(skillFilters, " OR ")+")")
	}

	if len(filterParts) > 0 {
		searchRequest.Filter = strings.Join(filterParts, " AND ")
	}

	// Add sorting
	if filters.SortBy != "" {
		sortOrder := "desc"
		if filters.SortOrder == "asc" {
			sortOrder = "asc"
		}
		searchRequest.Sort = []string{fmt.Sprintf("%s:%s", filters.SortBy, sortOrder)}
	} else {
		// Default sort: featured first, then by date
		searchRequest.Sort = []string{"is_featured:desc", "published_at:desc"}
	}

	resp, err := index.Search(query, searchRequest)
	if err != nil {
		return nil, fmt.Errorf("job search failed: %w", err)
	}

	// Convert hits to []map[string]interface{}
	hits := make([]map[string]interface{}, len(resp.Hits))
	for i, hit := range resp.Hits {
		hitMap := make(map[string]interface{})
		for k, v := range hit {
			var val interface{}
			if err := json.Unmarshal(v, &val); err == nil {
				hitMap[k] = val
			}
		}
		hits[i] = hitMap
	}

	return &SearchResult{
		Hits:             hits,
		Query:            query,
		ProcessingTimeMs: resp.ProcessingTimeMs,
		TotalHits:        resp.EstimatedTotalHits,
		Offset:           searchRequest.Offset,
		Limit:            searchRequest.Limit,
	}, nil
}

// JobSearchFilters contains filters for job search
type JobSearchFilters struct {
	JobType         string   `json:"job_type"`
	ExperienceLevel string   `json:"experience_level"`
	WorkplaceType   string   `json:"workplace_type"`
	Location        string   `json:"location"`
	SalaryMin       int      `json:"salary_min"`
	SalaryMax       int      `json:"salary_max"`
	Skills          []string `json:"skills"`
	SortBy          string   `json:"sort_by"`
	SortOrder       string   `json:"sort_order"`
	Offset          int      `json:"offset"`
	Limit           int      `json:"limit"`
}

// IndexBlog adds or updates a blog in the search index
func (m *MeiliClient) IndexBlog(blog *BlogDocument) error {
	index := m.client.Index(BlogsIndex)
	primaryKey := "id"
	task, err := index.AddDocuments([]BlogDocument{*blog}, &meilisearch.DocumentOptions{PrimaryKey: &primaryKey})
	if err != nil {
		return fmt.Errorf("failed to index blog: %w", err)
	}
	m.waitForTask(task.TaskUID)
	return nil
}

// IndexBlogs adds or updates multiple blogs in the search index
func (m *MeiliClient) IndexBlogs(blogs []BlogDocument) error {
	if len(blogs) == 0 {
		return nil
	}
	index := m.client.Index(BlogsIndex)
	primaryKey := "id"
	task, err := index.AddDocuments(blogs, &meilisearch.DocumentOptions{PrimaryKey: &primaryKey})
	if err != nil {
		return fmt.Errorf("failed to index blogs: %w", err)
	}
	m.waitForTask(task.TaskUID)
	log.Printf("✅ Indexed %d blogs", len(blogs))
	return nil
}

// DeleteBlog removes a blog from the search index
func (m *MeiliClient) DeleteBlog(blogID uuid.UUID) error {
	index := m.client.Index(BlogsIndex)
	task, err := index.DeleteDocument(blogID.String(), nil)
	if err != nil {
		return fmt.Errorf("failed to delete blog from index: %w", err)
	}
	m.waitForTask(task.TaskUID)
	return nil
}

// SearchBlogs searches for blogs
func (m *MeiliClient) SearchBlogs(query string, filters *BlogSearchFilters) (*SearchResult, error) {
	index := m.client.Index(BlogsIndex)

	searchRequest := &meilisearch.SearchRequest{
		Query:  query,
		Offset: int64(filters.Offset),
		Limit:  int64(filters.Limit),
	}

	// Build filter string
	filterParts := []string{}

	// Only show published blogs by default
	filterParts = append(filterParts, `status = "published"`)

	if filters.CategoryID != "" {
		filterParts = append(filterParts, fmt.Sprintf(`category_id = "%s"`, filters.CategoryID))
	}
	if filters.AuthorID != "" {
		filterParts = append(filterParts, fmt.Sprintf(`author_id = "%s"`, filters.AuthorID))
	}
	if len(filters.Tags) > 0 {
		tagFilters := make([]string, len(filters.Tags))
		for i, tag := range filters.Tags {
			tagFilters[i] = fmt.Sprintf(`tags = "%s"`, tag)
		}
		filterParts = append(filterParts, "("+strings.Join(tagFilters, " OR ")+")")
	}

	if len(filterParts) > 0 {
		searchRequest.Filter = strings.Join(filterParts, " AND ")
	}

	// Add sorting
	if filters.SortBy != "" {
		sortOrder := "desc"
		if filters.SortOrder == "asc" {
			sortOrder = "asc"
		}
		searchRequest.Sort = []string{fmt.Sprintf("%s:%s", filters.SortBy, sortOrder)}
	} else {
		searchRequest.Sort = []string{"published_at:desc"}
	}

	resp, err := index.Search(query, searchRequest)
	if err != nil {
		return nil, fmt.Errorf("blog search failed: %w", err)
	}

	// Convert hits to []map[string]interface{}
	hits := make([]map[string]interface{}, len(resp.Hits))
	for i, hit := range resp.Hits {
		hitMap := make(map[string]interface{})
		for k, v := range hit {
			var val interface{}
			if err := json.Unmarshal(v, &val); err == nil {
				hitMap[k] = val
			}
		}
		hits[i] = hitMap
	}

	return &SearchResult{
		Hits:             hits,
		Query:            query,
		ProcessingTimeMs: resp.ProcessingTimeMs,
		TotalHits:        resp.EstimatedTotalHits,
		Offset:           searchRequest.Offset,
		Limit:            searchRequest.Limit,
	}, nil
}

// BlogSearchFilters contains filters for blog search
type BlogSearchFilters struct {
	CategoryID string   `json:"category_id"`
	AuthorID   string   `json:"author_id"`
	Tags       []string `json:"tags"`
	SortBy     string   `json:"sort_by"`
	SortOrder  string   `json:"sort_order"`
	Offset     int      `json:"offset"`
	Limit      int      `json:"limit"`
}

// GetStats returns index statistics
func (m *MeiliClient) GetStats() (map[string]interface{}, error) {
	stats, err := m.client.GetStats()
	if err != nil {
		return nil, err
	}

	result := map[string]interface{}{
		"database_size": stats.DatabaseSize,
		"indexes":       stats.Indexes,
	}
	return result, nil
}

// ClearIndex removes all documents from an index
func (m *MeiliClient) ClearIndex(indexName string) error {
	index := m.client.Index(indexName)
	task, err := index.DeleteAllDocuments(nil)
	if err != nil {
		return err
	}
	m.waitForTask(task.TaskUID)
	return nil
}
