package service

import (
	"context"
	"log"

	"job-platform/internal/domain"
	"job-platform/internal/search"
)

// SearchService handles search indexing operations
type SearchService struct {
	meiliClient *search.MeiliClient
}

// NewSearchService creates a new search service
func NewSearchService(meiliClient *search.MeiliClient) *SearchService {
	return &SearchService{
		meiliClient: meiliClient,
	}
}

// IsAvailable returns true if MeiliSearch is configured and connected
func (s *SearchService) IsAvailable() bool {
	return s.meiliClient != nil
}

// IndexJob indexes a single job to MeiliSearch
func (s *SearchService) IndexJob(job *domain.Job) error {
	if s.meiliClient == nil {
		return nil
	}

	doc := s.jobToDocument(job)
	return s.meiliClient.IndexJob(doc)
}

// IndexJobs indexes multiple jobs to MeiliSearch
func (s *SearchService) IndexJobs(jobs []domain.Job) error {
	if s.meiliClient == nil {
		return nil
	}

	docs := make([]search.JobDocument, len(jobs))
	for i, job := range jobs {
		docs[i] = *s.jobToDocument(&job)
	}

	return s.meiliClient.IndexJobs(docs)
}

// DeleteJob removes a job from the search index
func (s *SearchService) DeleteJob(job *domain.Job) error {
	if s.meiliClient == nil {
		return nil
	}

	return s.meiliClient.DeleteJob(job.ID)
}

// IndexBlog indexes a single blog to MeiliSearch
func (s *SearchService) IndexBlog(blog *domain.Blog) error {
	if s.meiliClient == nil {
		return nil
	}

	doc := s.blogToDocument(blog)
	return s.meiliClient.IndexBlog(doc)
}

// IndexBlogs indexes multiple blogs to MeiliSearch
func (s *SearchService) IndexBlogs(blogs []domain.Blog) error {
	if s.meiliClient == nil {
		return nil
	}

	docs := make([]search.BlogDocument, len(blogs))
	for i, blog := range blogs {
		docs[i] = *s.blogToDocument(&blog)
	}

	return s.meiliClient.IndexBlogs(docs)
}

// DeleteBlog removes a blog from the search index
func (s *SearchService) DeleteBlog(blog *domain.Blog) error {
	if s.meiliClient == nil {
		return nil
	}

	return s.meiliClient.DeleteBlog(blog.ID)
}

// ReindexAllJobs re-indexes all jobs from the database
func (s *SearchService) ReindexAllJobs(ctx context.Context, jobs []domain.Job) error {
	if s.meiliClient == nil {
		return nil
	}

	// Clear existing index
	if err := s.meiliClient.ClearIndex(search.JobsIndex); err != nil {
		log.Printf("Warning: Failed to clear jobs index: %v", err)
	}

	return s.IndexJobs(jobs)
}

// ReindexAllBlogs re-indexes all blogs from the database
func (s *SearchService) ReindexAllBlogs(ctx context.Context, blogs []domain.Blog) error {
	if s.meiliClient == nil {
		return nil
	}

	// Clear existing index
	if err := s.meiliClient.ClearIndex(search.BlogsIndex); err != nil {
		log.Printf("Warning: Failed to clear blogs index: %v", err)
	}

	return s.IndexBlogs(blogs)
}

// jobToDocument converts a domain.Job to a search.JobDocument
func (s *SearchService) jobToDocument(job *domain.Job) *search.JobDocument {
	doc := &search.JobDocument{
		ID:               job.ID.String(),
		Title:            job.Title,
		Slug:             job.Slug,
		Description:      job.Description,
		ShortDescription: job.ShortDescription,
		CompanyName:      job.CompanyName,
		CompanyLogoURL:   job.CompanyLogoURL,
		JobType:          string(job.JobType),
		ExperienceLevel:  string(job.ExperienceLevel),
		WorkplaceType:    string(job.WorkplaceType),
		Location:         job.Location,
		City:             job.City,
		State:            job.State,
		Country:          job.Country,
		SalaryCurrency:   job.SalaryCurrency,
		IsFeatured:       job.IsFeatured,
		Status:           string(job.Status),
		ViewsCount:       job.ViewsCount,
		CreatedAt:        job.CreatedAt.Unix(),
	}

	// Handle nullable fields
	if job.SalaryMin != nil {
		doc.SalaryMin = *job.SalaryMin
	}
	if job.SalaryMax != nil {
		doc.SalaryMax = *job.SalaryMax
	}
	if job.PublishedAt != nil {
		doc.PublishedAt = job.PublishedAt.Unix()
	}

	// Convert arrays
	if job.Skills != nil {
		doc.Skills = []string(job.Skills)
	}
	if job.Benefits != nil {
		doc.Benefits = []string(job.Benefits)
	}

	return doc
}

// blogToDocument converts a domain.Blog to a search.BlogDocument
func (s *SearchService) blogToDocument(blog *domain.Blog) *search.BlogDocument {
	doc := &search.BlogDocument{
		ID:        blog.ID.String(),
		Title:     blog.Title,
		Slug:      blog.Slug,
		Content:   blog.Content,
		AuthorID:  blog.AuthorID.String(),
		Status:    string(blog.Status),
		ViewCount: blog.ViewCount,
		CreatedAt: blog.CreatedAt.Unix(),
	}

	// Handle nullable fields
	if blog.Excerpt != nil {
		doc.Excerpt = *blog.Excerpt
	}
	if blog.FeaturedImage != nil {
		doc.FeaturedImage = *blog.FeaturedImage
	}
	if blog.CategoryID != nil {
		doc.CategoryID = blog.CategoryID.String()
	}
	if blog.PublishedAt != nil {
		doc.PublishedAt = blog.PublishedAt.Unix()
	}

	// Get author name if available
	if blog.Author != nil {
		doc.AuthorName = blog.Author.FirstName + " " + blog.Author.LastName
	}

	// Get category name if available
	if blog.Category != nil {
		doc.CategoryName = blog.Category.Name
	}

	// Convert tags
	if blog.Tags != nil {
		doc.Tags = make([]string, len(blog.Tags))
		for i, tag := range blog.Tags {
			doc.Tags[i] = tag.Name
		}
	}

	return doc
}

// GetStats returns search index statistics
func (s *SearchService) GetStats() (map[string]interface{}, error) {
	if s.meiliClient == nil {
		return nil, nil
	}
	return s.meiliClient.GetStats()
}
