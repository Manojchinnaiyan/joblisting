// Resume Builder Types

export type ResumeTemplate = 'professional' | 'modern' | 'minimal'

export interface ResumePersonalInfo {
  firstName: string
  lastName: string
  email: string
  phone?: string
  location?: string
  headline?: string
  summary?: string
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
  websiteUrl?: string
}

export interface ResumeExperience {
  id: string
  companyName: string
  title: string
  location?: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  description?: string
  achievements?: string[]
}

export interface ResumeEducation {
  id: string
  institution: string
  degree: string
  fieldOfStudy: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  grade?: string
  description?: string
}

export interface ResumeSkill {
  id: string
  name: string
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
}

export interface ResumeLanguage {
  id: string
  name: string
  proficiency?: 'BASIC' | 'CONVERSATIONAL' | 'PROFESSIONAL' | 'FLUENT' | 'NATIVE'
}

export interface ResumeCertification {
  id: string
  name: string
  issuingOrganization: string
  issueDate: string
  expiryDate?: string
  credentialId?: string
  credentialUrl?: string
}

export interface ResumeProject {
  id: string
  title: string
  description: string
  technologies?: string[]
  projectUrl?: string
  sourceCodeUrl?: string
}

export interface ResumeData {
  personalInfo: ResumePersonalInfo
  experience: ResumeExperience[]
  education: ResumeEducation[]
  skills: ResumeSkill[]
  languages: ResumeLanguage[]
  certifications: ResumeCertification[]
  projects: ResumeProject[]
}

export interface ResumeSettings {
  template: ResumeTemplate
  primaryColor: string
  showPhoto: boolean
  showSkillLevels: boolean
  sectionsOrder: string[]
}

export const DEFAULT_RESUME_SETTINGS: ResumeSettings = {
  template: 'professional',
  primaryColor: '#2563eb',
  showPhoto: false,
  showSkillLevels: true,
  sectionsOrder: ['experience', 'education', 'skills', 'languages', 'certifications', 'projects'],
}

export const TEMPLATE_OPTIONS: { value: ResumeTemplate; label: string; description: string }[] = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Classic and formal layout, ideal for corporate roles',
  },
  {
    value: 'modern',
    label: 'Modern',
    description: 'Contemporary design with a sidebar, great for tech roles',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Clean and simple, focuses on content over design',
  },
]

export const COLOR_OPTIONS = [
  { value: '#2563eb', label: 'Blue' },
  { value: '#059669', label: 'Green' },
  { value: '#7c3aed', label: 'Purple' },
  { value: '#dc2626', label: 'Red' },
  { value: '#ea580c', label: 'Orange' },
  { value: '#0891b2', label: 'Teal' },
  { value: '#4b5563', label: 'Gray' },
  { value: '#000000', label: 'Black' },
]
