export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'JobsWorld'
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Find Remote Jobs, International Jobs & Career Opportunities Worldwide - Your Global Job Search Platform'
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INTERNSHIP', label: 'Internship' },
] as const

export const EXPERIENCE_LEVELS = [
  { value: 'ENTRY', label: 'Entry Level' },
  { value: 'MID', label: 'Mid Level' },
  { value: 'SENIOR', label: 'Senior Level' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'EXECUTIVE', label: 'Executive' },
] as const

export const WORKPLACE_TYPES = [
  { value: 'ONSITE', label: 'On-site' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
] as const

export const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001-5000', label: '1001-5000 employees' },
  { value: '5000+', label: '5000+ employees' },
] as const

export const BENEFIT_CATEGORIES = [
  { value: 'HEALTH', label: 'Health & Wellness', icon: 'heart' },
  { value: 'FINANCIAL', label: 'Financial', icon: 'dollar-sign' },
  { value: 'VACATION', label: 'Time Off', icon: 'calendar' },
  { value: 'PROFESSIONAL_DEVELOPMENT', label: 'Learning & Development', icon: 'book' },
  { value: 'OFFICE_PERKS', label: 'Office Perks', icon: 'coffee' },
  { value: 'FAMILY', label: 'Family', icon: 'users' },
  { value: 'WELLNESS', label: 'Wellness', icon: 'activity' },
  { value: 'OTHER', label: 'Other', icon: 'gift' },
] as const

export const ROUTES = {
  HOME: '/',
  JOBS: '/jobs',
  FRESHER_JOBS: '/jobs?experience_level=ENTRY',
  INTERNSHIPS: '/jobs?job_type=INTERNSHIP',
  COMPANIES: '/companies',
  ABOUT: '/about',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile/edit',
  APPLICATIONS: '/applications',
  SAVED_JOBS: '/saved-jobs',
  RESUMES: '/resumes',
  FOLLOWING: '/following',
  SETTINGS: '/settings',
  EMPLOYER: '/employer',
  ADMIN: '/admin',
} as const
