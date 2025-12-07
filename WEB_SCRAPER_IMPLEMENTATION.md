# Web Scraper for Job Listings - Implementation Guide

This guide implements a complete web scraping system that extracts job details from any URL, shows a preview, and converts it into a job posting.

---

## Overview

### What We're Building

**Features:**
- Paste any job URL and extract details automatically
- AI-powered extraction (using Claude AI or OpenAI)
- Preview extracted data before saving
- Edit extracted data if needed
- Store original URL for "Apply" button
- Support multiple job board formats (LinkedIn, Indeed, Glassdoor, company websites, etc.)
- Handle PDF job descriptions
- Bulk import from multiple URLs

**User Flow:**
```
1. Admin pastes URL
   ↓
2. System scrapes page content
   ↓
3. AI extracts structured job data
   ↓
4. Preview shown with edit capability
   ↓
5. Admin confirms and saves
   ↓
6. Job created with "Apply at Source" link
```

---

## Architecture
```
Frontend (Admin)
    ↓ (Paste URL)
Backend API
    ↓
Web Scraper Service (Puppeteer/Playwright)
    ↓ (Get HTML)
AI Service (Claude API / OpenAI)
    ↓ (Extract structured data)
Database (PostgreSQL)
    ↓
Job created with original_url field
```

---

## Implementation Steps

### Step 1: Update Database Schema

**File:** `backend/migrations/007_add_original_url_to_jobs.sql`

**What it should contain:**

1. Add `original_url` column to jobs table:
   - Column: `original_url VARCHAR(1000)`
   - Nullable (not all jobs are scraped)
   - Index on original_url for quick lookups

2. Add `scraped_data` column (optional):
   - Column: `scraped_data JSONB`
   - Store raw scraped data for reference
   - Nullable

3. Add `scrape_status` column (optional):
   - Column: `scrape_status VARCHAR(20)`
   - Values: 'pending', 'scraped', 'failed', 'manual'
   - Default: 'manual'

**SQL:**
```sql
ALTER TABLE jobs ADD COLUMN original_url VARCHAR(1000);
ALTER TABLE jobs ADD COLUMN scraped_data JSONB;
ALTER TABLE jobs ADD COLUMN scrape_status VARCHAR(20) DEFAULT 'manual';

CREATE INDEX idx_jobs_original_url ON jobs(original_url);
CREATE INDEX idx_jobs_scrape_status ON jobs(scrape_status);

COMMENT ON COLUMN jobs.original_url IS 'Original URL where job was scraped from';
COMMENT ON COLUMN jobs.scraped_data IS 'Raw scraped data in JSON format';
```

---

### Step 2: Install Backend Dependencies

**Commands:**
```bash
cd backend

# Web scraping
go get github.com/gocolly/colly/v2

# HTML parsing (alternative)
go get github.com/PuerkitoBio/goquery

# HTTP client
go get github.com/go-resty/resty/v2

# For AI API calls (if not already installed)
# We'll use standard net/http
```

**Alternative: Use Puppeteer via Go (for JavaScript-heavy sites):**
```bash
go get github.com/chromedp/chromedp
```

---

### Step 3: Create Scraper Service

**File:** `backend/internal/service/scraper_service.go`

**What it should contain:**

1. **ScraperService interface:**
   - ScrapeJobURL(ctx, url) (ScrapedJob, error)
   - ExtractJobDetails(html, url) (ScrapedJob, error)
   - PreviewJob(url) (ScrapedJob, error)

2. **ScrapedJob struct:**
   - Title string
   - Company string
   - Location string
   - Description string (full HTML)
   - Requirements string
   - Salary string
   - JobType string (Full-time, Part-time, etc.)
   - ExperienceLevel string
   - Skills []string
   - OriginalURL string
   - ScrapedAt time.Time
   - RawHTML string (for debugging)

3. **Implementation:**

   **ScrapeJobURL method:**
   - Take URL as input
   - Use colly or chromedp to fetch page HTML
   - Handle JavaScript-rendered pages
   - Extract all text content
   - Return raw HTML

   **ExtractJobDetails method:**
   - Take HTML and URL as input
   - Send to AI API (Claude or OpenAI) for extraction
   - AI prompt: "Extract job details from this HTML"
   - Parse AI response into ScrapedJob struct
   - Return structured data

   **AI Extraction Prompt:**
```
   Extract job posting details from this HTML page.
   
   HTML content:
   {html}
   
   Return a JSON object with these fields:
   - title: Job title
   - company: Company name
   - location: Location (city, state, or remote)
   - description: Full job description (keep as HTML)
   - requirements: Required qualifications
   - salary: Salary range if mentioned
   - job_type: Full-time, Part-time, Contract, etc.
   - experience_level: Entry, Mid, Senior, etc.
   - skills: Array of required skills
   
   If a field is not found, use empty string or empty array.
   Be thorough and extract all relevant information.
```

4. **Error handling:**
   - URL not accessible: return error
   - Page requires login: return error
   - AI extraction fails: return partial data
   - Invalid HTML: return error

5. **Rate limiting:**
   - Add delays between scrapes
   - Respect robots.txt (optional)
   - Cache scraped data (1 hour)

---

### Step 4: Create AI Service for Extraction

**File:** `backend/internal/service/ai_service.go`

**What it should contain:**

1. **AIService interface:**
   - ExtractJobFromHTML(html string) (map[string]interface{}, error)
   - ParseToJobStruct(aiResponse) (ScrapedJob, error)

2. **Implementation using Claude API:**

   **ExtractJobFromHTML method:**
   - Format HTML (remove scripts, styles, clean up)
   - Create prompt with HTML
   - Call Claude API (anthropic.com/api)
   - Parse JSON response
   - Return structured data

3. **Claude API call example:**
```go
   POST https://api.anthropic.com/v1/messages
   Headers:
     x-api-key: YOUR_KEY
     anthropic-version: 2023-06-01
   Body:
     {
       "model": "claude-3-sonnet-20240229",
       "max_tokens": 4000,
       "messages": [{
         "role": "user",
         "content": "Extract job details from this HTML: {html}"
       }]
     }
```

4. **Environment variable needed:**
   - `ANTHROPIC_API_KEY` - Get from anthropic.com
   - Or use `OPENAI_API_KEY` if using OpenAI

**Alternative: Use OpenAI API:**
- Model: gpt-4 or gpt-3.5-turbo
- Similar prompt structure
- Slightly different API format

---

### Step 5: Create Scraper Handler

**File:** `backend/internal/handler/scraper_handler.go`

**What it should contain:**

1. **ScraperHandler struct:**
   - scraperService ScraperService
   - jobService JobService (to create jobs)

2. **Endpoints:**

   **PreviewJobFromURL (POST /admin/jobs/scrape/preview):**
   - Request body: { url: string }
   - Call scraperService.ScrapeJobURL
   - Call scraperService.ExtractJobDetails
   - Return ScrapedJob (preview)
   - Don't save to database yet

   **CreateJobFromScrapedData (POST /admin/jobs/scrape/create):**
   - Request body: { scraped_data: ScrapedJob, edits: EditedFields }
   - Apply any manual edits
   - Convert to CreateJobRequest
   - Call jobService.CreateJob
   - Set original_url field
   - Set scrape_status to 'scraped'
   - Return created job

   **BulkScrapeJobs (POST /admin/jobs/scrape/bulk):**
   - Request body: { urls: []string }
   - Iterate through URLs
   - Scrape each one
   - Return array of ScrapedJob previews
   - Admin can review and select which to create

3. **Error handling:**
   - Invalid URL: 400 Bad Request
   - Scraping failed: 500 with error message
   - AI extraction failed: 500 with partial data
   - Duplicate URL: 409 Conflict (if job already exists)

4. **Response format:**
```json
   {
     "success": true,
     "scraped_job": {
       "title": "Senior Software Engineer",
       "company": "Tech Corp",
       "location": "San Francisco, CA",
       "description": "<p>Full HTML description</p>",
       "requirements": "5+ years experience...",
       "salary": "$150,000 - $200,000",
       "job_type": "Full-time",
       "experience_level": "Senior",
       "skills": ["Go", "React", "PostgreSQL"],
       "original_url": "https://techcorp.com/jobs/123"
     }
   }
```

---

### Step 6: Update Job Models

**File:** `backend/internal/models/job.go`

**Add these fields to Job struct:**
```go
OriginalURL  *string `json:"original_url" db:"original_url"`
ScrapedData  *string `json:"scraped_data" db:"scraped_data"` // JSONB as string
ScrapeStatus string  `json:"scrape_status" db:"scrape_status"`
```

**Add to CreateJobRequest:**
```go
OriginalURL  *string `json:"original_url"`
```

**Add new struct for scraping:**
```go
type ScrapeJobRequest struct {
    URL string `json:"url" binding:"required,url"`
}

type ScrapedJobResponse struct {
    Title           string   `json:"title"`
    Company         string   `json:"company"`
    Location        string   `json:"location"`
    Description     string   `json:"description"`
    Requirements    string   `json:"requirements"`
    Salary          string   `json:"salary"`
    JobType         string   `json:"job_type"`
    ExperienceLevel string   `json:"experience_level"`
    Skills          []string `json:"skills"`
    OriginalURL     string   `json:"original_url"`
}

type BulkScrapeRequest struct {
    URLs []string `json:"urls" binding:"required,min=1,max=10"`
}

type CreateFromScrapedRequest struct {
    ScrapedData ScrapedJobResponse `json:"scraped_data"`
    Edits       map[string]interface{} `json:"edits"` // Optional manual edits
}
```

---

### Step 7: Setup Scraper Routes

**File:** `backend/internal/router/scraper_routes.go`

**What it should contain:**
```go
func SetupScraperRoutes(r *gin.Engine, scraperHandler *handler.ScraperHandler, authMiddleware *middleware.AuthMiddleware) {
    admin := r.Group("/api/v1/admin")
    admin.Use(authMiddleware.RequireAuth(), authMiddleware.RequireAdmin())
    {
        // Scraping endpoints
        admin.POST("/jobs/scrape/preview", scraperHandler.PreviewJobFromURL)
        admin.POST("/jobs/scrape/create", scraperHandler.CreateJobFromScrapedData)
        admin.POST("/jobs/scrape/bulk", scraperHandler.BulkScrapeJobs)
        
        // Optional: Test scraping
        admin.POST("/jobs/scrape/test", scraperHandler.TestScrape)
    }
}
```

---

### Step 8: Update Main Router

**File:** `backend/internal/router/router.go`

**Add initialization:**
```go
// Initialize scraper service
scraperService := service.NewScraperService(aiService)
scraperHandler := handler.NewScraperHandler(scraperService, jobService)

// Setup routes
SetupScraperRoutes(r, scraperHandler, authMiddleware)
```

---

### Step 9: Frontend - Create Scraper UI Component

**File:** `frontend/src/components/admin/JobScraper.tsx`

**What it should contain:**

1. **Component structure:**
   - URL input field
   - "Preview" button
   - Loading state
   - Preview card (when data loaded)
   - Edit form (optional)
   - "Create Job" button

2. **State management:**
   - `url` - input URL
   - `loading` - scraping in progress
   - `scrapedData` - preview data
   - `error` - error message
   - `editMode` - toggle edit mode

3. **UI Layout:**

   **URL Input Section:**
   - Label: "Paste Job URL"
   - Input placeholder: "https://company.com/jobs/..."
   - "Preview Job" button
   - Support for multiple URLs (textarea)

   **Preview Section (after scraping):**
   - Card showing:
     - ✅ Title (editable)
     - ✅ Company (editable)
     - ✅ Location (editable)
     - ✅ Description (read-only preview, show first 500 chars)
     - ✅ Requirements (editable)
     - ✅ Salary (editable)
     - ✅ Job Type (editable dropdown)
     - ✅ Experience Level (editable dropdown)
     - ✅ Skills (editable tags)
     - ✅ Original URL (read-only, with link)
   - "Edit Details" button (toggle edit mode)
   - "Create Job" button (saves to database)
   - "Cancel" button (clear and start over)

4. **Functions:**

   **handlePreview:**
   - Validate URL
   - Call API: POST /admin/jobs/scrape/preview
   - Show loading spinner
   - On success: show preview
   - On error: show error message

   **handleCreate:**
   - Call API: POST /admin/jobs/scrape/create
   - Pass scraped data + any edits
   - Show success toast
   - Navigate to job list or show created job

   **handleEdit:**
   - Toggle edit mode
   - Allow inline editing of fields
   - Track changes

5. **Validation:**
   - URL must be valid HTTP/HTTPS
   - All required fields must be present
   - Show warning if salary missing
   - Show warning if description too short

---

### Step 10: Add Scraper Tab to Job Management

**File:** `frontend/src/app/admin/jobs/scrape/page.tsx`

**What it should contain:**

1. **Page layout:**
   - Title: "Import Job from URL"
   - Subtitle: "Automatically extract job details from any job posting"
   - JobScraper component

2. **Optional: Bulk import tab:**
   - Textarea for multiple URLs (one per line)
   - "Import All" button
   - Show progress (X of Y processed)
   - Show results table with status

3. **Navigation:**
   - Link from /admin/jobs page
   - "Import from URL" button

---

### Step 11: Add "Apply at Source" to Job Details

**Frontend: Job Detail Page**

**File:** `frontend/src/app/jobs/[id]/page.tsx` (or wherever job detail is)

**What to add:**

1. Check if job has `original_url`
2. If yes, show "Apply at Source" button:
   - Primary CTA button
   - Opens in new tab
   - Text: "Apply at [Company Name]"
   - Icon: ExternalLink from lucide-react

3. If no original_url:
   - Show regular "Apply" button (your existing flow)

**Example:**
```tsx
{job.original_url ? (
  <a 
    href={job.original_url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="btn-primary"
  >
    Apply at {job.company.name}
    <ExternalLink className="ml-2 h-4 w-4" />
  </a>
) : (
  <button onClick={handleApply} className="btn-primary">
    Apply Now
  </button>
)}
```

---

### Step 12: Environment Variables

**Backend `.env`:**
```bash
# AI API for scraping
ANTHROPIC_API_KEY=your_anthropic_key

# Or OpenAI
OPENAI_API_KEY=your_openai_key

# Scraper settings
SCRAPER_MAX_CONCURRENT=3
SCRAPER_TIMEOUT=30s
SCRAPER_USER_AGENT=JobPlatformBot/1.0
```

**Get API keys:**
- Anthropic: console.anthropic.com
- OpenAI: platform.openai.com

---

### Step 13: Testing

**Test URLs to try (public job boards):**

1. LinkedIn job:
```
   https://www.linkedin.com/jobs/view/12345/
```

2. Indeed job:
```
   https://www.indeed.com/viewjob?jk=abc123
```

3. Company career page:
```
   https://jobs.lever.co/company/job-id
```

**Manual testing:**

1. Start backend
2. Navigate to /admin/jobs/scrape
3. Paste a job URL
4. Click "Preview"
5. Verify extracted data
6. Edit if needed
7. Click "Create Job"
8. Check job was created in database
9. View job detail page
10. Verify "Apply at Source" button works

---

## Scraper Implementation Details

### Method 1: Simple HTML Scraping (Colly)

**Use for:** Static HTML pages, simple career pages

**Pros:**
- Fast
- Lightweight
- Easy to implement

**Cons:**
- Doesn't work with JavaScript-heavy sites
- Can't handle SPAs (React/Vue apps)

**Example sites:**
- Simple company career pages
- Craigslist
- Traditional job boards

---

### Method 2: Browser Automation (Chromedp)

**Use for:** JavaScript-rendered pages, SPAs

**Pros:**
- Works with any website
- Handles JavaScript
- Can interact with page

**Cons:**
- Slower
- More resource-intensive
- Requires Chrome/Chromium

**Example sites:**
- LinkedIn
- Indeed
- Glassdoor
- Modern company websites

---

### Method 3: API Integration (Future)

**Use for:** Popular job boards with APIs

**Examples:**
- LinkedIn API (requires partnership)
- Indeed API
- Glassdoor API

**Pros:**
- Clean data
- Structured format
- Reliable

**Cons:**
- Requires API access
- May have costs
- Rate limits

---

## AI Extraction Configuration

### Claude API Configuration

**Model:** claude-3-sonnet-20240229
**Max tokens:** 4000
**Temperature:** 0 (deterministic)

**Prompt structure:**
```
You are a job posting extraction assistant.
Extract the following fields from this HTML:

1. Job title
2. Company name
3. Location (city, state, remote status)
4. Full job description (preserve HTML formatting)
5. Requirements/qualifications
6. Salary range (if mentioned)
7. Job type (Full-time, Part-time, Contract, etc.)
8. Experience level (Entry, Mid, Senior, Lead, etc.)
9. Required skills (as array)

Return valid JSON only, no markdown formatting.

HTML content:
{html}
```

**Response parsing:**
- Parse JSON from Claude response
- Validate required fields
- Handle missing data gracefully
- Clean up HTML in description

---

### OpenAI Configuration (Alternative)

**Model:** gpt-4-turbo
**Max tokens:** 4000
**Temperature:** 0

**Similar prompt structure**

---

## Error Handling

### Common Errors

1. **URL not accessible (404, 403, 500)**
   - Show user-friendly error
   - Suggest checking URL
   - Allow retry

2. **Page requires authentication**
   - Detect login page
   - Show error: "This page requires login"
   - Ask user to use public URL

3. **AI extraction fails**
   - Return partial data
   - Show warning: "Some fields couldn't be extracted"
   - Allow manual entry

4. **Rate limit exceeded**
   - Queue scraping requests
   - Show estimated wait time
   - Implement retry logic

5. **Invalid HTML/corrupt data**
   - Show error
   - Provide raw HTML for debugging
   - Allow manual entry

---

## Advanced Features (Optional)

### Feature 1: PDF Job Descriptions

**Support:** PDF URLs

**Implementation:**
1. Detect PDF URLs
2. Download PDF
3. Extract text using pdf parser library
4. Send to AI for extraction

**Package:** `github.com/ledongthuc/pdf`

---

### Feature 2: Chrome Extension

**Allow:** Scrape while browsing

**Flow:**
1. User installs extension
2. User views job on any site
3. Clicks extension icon
4. Extension sends HTML to your API
5. Job preview shown
6. User saves to platform

---

### Feature 3: Scheduled Re-scraping

**Use case:** Check if job still exists

**Implementation:**
1. Cron job runs daily
2. Re-scrape jobs with original_url
3. If 404/410: mark job as closed
4. If content changed: notify admin

---

### Feature 4: Duplicate Detection

**Check:** Don't import same job twice

**Implementation:**
1. Hash of (title + company + location)
2. Check if hash exists in database
3. If exists: show warning
4. Allow override

---

### Feature 5: Scraping Analytics

**Track:**
- Success rate per domain
- Most common sources
- Average scraping time
- Failed scrapes

**Dashboard:** Show stats in admin panel

---

## API Endpoints Summary

### Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/jobs/scrape/preview` | POST | Preview job from URL |
| `/admin/jobs/scrape/create` | POST | Create job from scraped data |
| `/admin/jobs/scrape/bulk` | POST | Bulk scrape multiple URLs |
| `/admin/jobs/scrape/test` | POST | Test scraping (no save) |

---

## Testing Checklist

✅ Can paste URL and see loading state  
✅ Preview shows all extracted fields  
✅ Can edit extracted data  
✅ Can create job from scraped data  
✅ Original URL is saved  
✅ "Apply at Source" button works  
✅ Works with LinkedIn jobs  
✅ Works with Indeed jobs  
✅ Works with company career pages  
✅ Handles errors gracefully  
✅ Shows user-friendly error messages  
✅ Prevents duplicate imports  
✅ Bulk import works  
✅ AI extraction is accurate  
✅ HTML formatting preserved  

---

## Cost Considerations

### AI API Costs

**Claude API:**
- Input: $3 per 1M tokens
- Output: $15 per 1M tokens
- Average job scrape: ~5,000 tokens
- **Cost per scrape: ~$0.01**

**OpenAI GPT-4:**
- Input: $10 per 1M tokens
- Output: $30 per 1M tokens
- Average job scrape: ~5,000 tokens
- **Cost per scrape: ~$0.02**

**Budget planning:**
- 100 scrapes/day = $1/day = $30/month
- 1000 scrapes/day = $10/day = $300/month

**Recommendation:** Start with Claude (cheaper, better extraction)

---

## Security Considerations

1. **Rate limiting:**
   - Max 10 scrapes per minute per user
   - Max 100 scrapes per day per user

2. **URL validation:**
   - Whitelist allowed domains (optional)
   - Block localhost, internal IPs
   - Validate HTTPS for security

3. **Content sanitization:**
   - Strip malicious scripts from HTML
   - Sanitize before saving to database
   - Use HTML purifier

4. **User agent:**
   - Use identifiable user agent
   - Include contact email
   - Respect robots.txt

---

## Legal Considerations

**Important:** Web scraping legal issues

1. **Check Terms of Service:**
   - Some sites prohibit scraping
   - LinkedIn, Indeed have specific rules
   - Use at your own risk

2. **Alternatives:**
   - Request permission
   - Use official APIs
   - Partner with job boards

3. **Best practices:**
   - Don't scrape too aggressively
   - Cache results
   - Add delays between requests
   - Respect robots.txt

4. **Disclaimer:**
   - Add disclaimer in UI
   - "Ensure you have permission to import jobs"
   - User takes responsibility

---

## Success Criteria

✅ Admin can paste any job URL  
✅ System extracts job details automatically  
✅ Preview shown with edit capability  
✅ Job created with original URL  
✅ "Apply at Source" button works  
✅ Works with 80%+ of job sites  
✅ Extraction accuracy > 90%  
✅ Scraping time < 10 seconds  
✅ Handles errors gracefully  
✅ Cost per scrape < $0.02  

---

## Implementation Time Estimate

- Database migration: 15 minutes
- Scraper service: 2 hours
- AI service: 1 hour
- Handler & routes: 1 hour
- Frontend component: 2 hours
- Testing: 2 hours
- Polish & error handling: 1 hour

**Total: ~9-10 hours**

---

## Next Steps After Implementation

1. Test with popular job boards
2. Build library of site-specific scrapers
3. Add Chrome extension
4. Implement scheduled re-scraping
5. Add scraping analytics dashboard
6. Consider API partnerships
7. Add PDF support
8. Implement OCR for images

---

**Ready to implement? This will save hours of manual job posting!** 🚀

**Which part should we start with - backend or frontend?**