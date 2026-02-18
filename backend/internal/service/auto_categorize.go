package service

import (
	"job-platform/internal/domain"
	"strings"
	"sync"

	"github.com/google/uuid"
)

// categoryKeywords maps category slugs to keyword lists.
// Keywords are matched against lowercase job title, description, and skills.
var categoryKeywords = map[string][]string{
	"technology": {
		"software", "developer", "engineer", "devops", "frontend", "front-end",
		"backend", "back-end", "fullstack", "full-stack", "python", "java",
		"javascript", "typescript", "react", "angular", "vue", "node",
		"golang", "rust", "ruby", "php", "swift", "kotlin", "flutter",
		"cloud", "aws", "azure", "gcp", "docker", "kubernetes",
		"data scientist", "data engineer", "machine learning", "deep learning",
		"artificial intelligence", "ai/ml", "nlp", "computer vision",
		"qa engineer", "quality assurance", "sdet", "test automation",
		"sre", "site reliability", "cybersecurity", "security engineer",
		"database", "sql", "nosql", "mongodb", "postgresql", "mysql",
		"api", "microservices", "saas", "system admin", "sysadmin",
		"it support", "it manager", "network engineer", "firmware",
		"embedded", "ios developer", "android developer", "mobile developer",
		"web developer", "blockchain", "smart contract", "solidity",
		"devrel", "technical writer", "scrum master", "agile coach",
		"data analyst", "bi analyst", "etl", "data warehouse",
		"linux", "unix", "terraform", "ansible", "ci/cd", "jenkins",
		"github", "gitlab", "bitbucket", "jira", "confluence",
		"html", "css", "sass", "webpack", "vite", "next.js", "nuxt",
		"django", "flask", "spring", "laravel", ".net", "c#", "c++",
		"scala", "elixir", "haskell", "clojure", "perl",
		"redis", "elasticsearch", "kafka", "rabbitmq", "graphql",
		"rest api", "soap", "grpc", "websocket",
		"machine learning engineer", "mlops", "llm", "generative ai",
		"prompt engineer", "ai engineer",
		"information technology", "tech lead", "cto", "vp engineering",
		"principal engineer", "staff engineer", "architect",
	},
	"marketing": {
		"marketing", "seo", "sem", "social media", "content strategist",
		"content writer", "content marketing", "brand", "branding",
		"advertising", "digital marketing", "growth", "campaign",
		"copywriter", "copywriting", "pr ", "public relations",
		"communications", "email marketing", "marketing manager",
		"marketing coordinator", "marketing analyst", "marketing director",
		"performance marketing", "paid media", "organic", "google ads",
		"facebook ads", "instagram", "tiktok", "influencer",
		"affiliate marketing", "demand generation", "lead generation",
		"market research", "product marketing", "marketing automation",
		"hubspot", "mailchimp", "cmo", "vp marketing",
	},
	"sales": {
		"sales", "account executive", "business development", "bdr",
		"sdr", "revenue", "client relations", "account manager",
		"sales manager", "sales director", "sales representative",
		"sales engineer", "pre-sales", "inside sales", "outside sales",
		"enterprise sales", "smb sales", "sales operations",
		"quota", "pipeline", "crm", "salesforce",
		"relationship manager", "partnership", "channel sales",
		"territory manager", "vp sales", "chief revenue",
	},
	"design": {
		"designer", "ui design", "ux design", "ui/ux", "ux/ui",
		"graphic design", "creative", "figma", "photoshop", "illustrator",
		"art director", "visual design", "branding design", "web design",
		"product design", "interaction design", "motion design",
		"animation", "3d artist", "video editor", "creative director",
		"design system", "sketch", "adobe xd", "invision",
		"user research", "usability", "wireframe", "prototype",
		"typography", "illustration", "brand identity",
	},
	"finance": {
		"finance", "accounting", "accountant", "auditor", "audit",
		"financial analyst", "bookkeeper", "bookkeeping", "tax",
		"payroll", "cfo", "treasury", "budget", "financial planning",
		"investment", "banking", "fintech", "actuary", "actuarial",
		"controller", "accounts payable", "accounts receivable",
		"billing", "invoicing", "cost analyst", "risk analyst",
		"compliance", "regulatory", "financial reporting",
		"chartered accountant", "cpa", "gaap", "ifrs",
		"revenue analyst", "credit analyst", "loan", "mortgage",
		"wealth management", "portfolio", "equity", "fixed income",
	},
	"human-resources": {
		"human resources", "hr manager", "hr director", "hr coordinator",
		"hr business partner", "hrbp", "recruiter", "recruiting",
		"talent acquisition", "people operations", "people ops",
		"compensation", "benefits admin", "benefits manager",
		"employee relations", "workforce", "onboarding",
		"hr generalist", "hr specialist", "talent management",
		"organizational development", "learning and development",
		"diversity", "inclusion", "dei ", "chro",
		"vp people", "head of people", "staffing",
	},
	"customer-support": {
		"customer support", "customer service", "help desk", "helpdesk",
		"technical support", "client success", "customer success",
		"support engineer", "support specialist", "support agent",
		"customer experience", "cx manager", "call center",
		"contact center", "service desk", "tier 1", "tier 2",
		"customer advocate", "customer care", "client support",
		"escalation", "ticketing", "zendesk", "freshdesk", "intercom",
	},
	"operations": {
		"operations", "logistics", "supply chain", "procurement",
		"warehouse", "inventory", "project manager", "program manager",
		"operations manager", "ops manager", "business operations",
		"process improvement", "lean", "six sigma", "kaizen",
		"facilities", "fleet", "distribution", "shipping",
		"vendor management", "sourcing", "purchasing",
		"business analyst", "strategy", "management consultant",
		"chief operating", "coo", "vp operations",
	},
	"healthcare": {
		"nurse", "nursing", "doctor", "physician", "medical",
		"healthcare", "clinical", "pharmacy", "pharmacist",
		"therapist", "dental", "dentist", "health", "patient",
		"hospital", "registered nurse", "rn ", "lpn ", "cna ",
		"medical assistant", "medical technician", "lab technician",
		"radiology", "radiologist", "surgeon", "anesthesiologist",
		"psychiatrist", "psychologist", "mental health",
		"physical therapy", "occupational therapy", "speech therapy",
		"paramedic", "emt", "emergency medicine",
		"biotech", "biotechnology", "pharmaceutical", "pharma",
		"clinical research", "clinical trial", "fda",
		"veterinary", "vet tech", "optometrist", "chiropractor",
	},
	"education": {
		"teacher", "professor", "instructor", "tutor", "curriculum",
		"education", "academic", "training", "learning",
		"school", "faculty", "lecturer", "teaching assistant",
		"principal", "dean", "superintendent", "librarian",
		"special education", "esl ", "tesol", "montessori",
		"early childhood", "preschool", "kindergarten",
		"higher education", "university", "college",
		"e-learning", "elearning", "instructional design",
		"course developer", "educational technology", "edtech",
		"admissions", "registrar", "student affairs",
	},
}

// categoryCache caches the slug-to-ID mapping to avoid repeated DB queries.
type categoryCache struct {
	mu         sync.RWMutex
	slugToID   map[string]uuid.UUID
	loaded     bool
}

var catCache = &categoryCache{}

// loadCategoryMap loads all categories from the DB (regardless of active status) and caches slug->ID.
func (s *JobService) loadCategoryMap() (map[string]uuid.UUID, error) {
	catCache.mu.RLock()
	if catCache.loaded {
		defer catCache.mu.RUnlock()
		return catCache.slugToID, nil
	}
	catCache.mu.RUnlock()

	catCache.mu.Lock()
	defer catCache.mu.Unlock()

	// Double-check after acquiring write lock
	if catCache.loaded {
		return catCache.slugToID, nil
	}

	// Query all categories regardless of is_active status
	var categories []domain.JobCategory
	if err := s.db.Find(&categories).Error; err != nil {
		return nil, err
	}

	catCache.slugToID = make(map[string]uuid.UUID, len(categories))
	for _, cat := range categories {
		catCache.slugToID[cat.Slug] = cat.ID
	}
	catCache.loaded = true
	return catCache.slugToID, nil
}

// AutoCategorizeJob determines categories for a job based on keyword matching.
// Returns a list of category IDs that match the job content.
func (s *JobService) AutoCategorizeJob(job *domain.Job) ([]uuid.UUID, error) {
	slugToID, err := s.loadCategoryMap()
	if err != nil {
		return nil, err
	}

	// Build searchable text from title, description, and skills
	searchText := strings.ToLower(job.Title + " " + job.Description + " " + strings.Join(job.Skills, " "))

	var matchedIDs []uuid.UUID
	for slug, keywords := range categoryKeywords {
		catID, exists := slugToID[slug]
		if !exists {
			continue
		}
		for _, keyword := range keywords {
			if strings.Contains(searchText, strings.ToLower(keyword)) {
				matchedIDs = append(matchedIDs, catID)
				break
			}
		}
	}

	return matchedIDs, nil
}

// AutoCategorizeAllJobs finds all uncategorized jobs and assigns categories via keyword matching.
// Returns the number of jobs that were categorized.
func (s *JobService) AutoCategorizeAllJobs() (int, error) {
	// Reset cache so we get fresh category data
	catCache.mu.Lock()
	catCache.loaded = false
	catCache.mu.Unlock()

	// Find jobs with no category mappings
	var jobs []domain.Job
	err := s.db.
		Where("deleted_at IS NULL").
		Where("id NOT IN (?)",
			s.db.Table("job_category_mappings").Select("DISTINCT job_id"),
		).
		Find(&jobs).Error
	if err != nil {
		return 0, err
	}

	categorized := 0
	for _, job := range jobs {
		categoryIDs, err := s.AutoCategorizeJob(&job)
		if err != nil {
			continue
		}
		if len(categoryIDs) == 0 {
			continue
		}
		if err := s.jobRepo.AddCategories(job.ID, categoryIDs); err != nil {
			continue
		}
		categorized++
	}

	return categorized, nil
}
