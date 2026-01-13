// Resume Builder Types
// 50 unique template designs with different layouts

export type ResumeTemplate =
  // Row 1: Classic Single Column (1-10)
  | 'professional'      // 1. Standard professional - clean sections
  | 'classic'           // 2. Serif font, centered header, horizontal rules
  | 'traditional'       // 3. Conservative with justified text
  | 'formal'            // 4. Government/legal style with dense text
  | 'academic'          // 5. CV style with publications focus
  // Row 2: Modern Single Column (6-10)
  | 'modern'            // 6. Sans-serif with colored sidebar
  | 'minimal'           // 7. Maximum whitespace, sparse design
  | 'clean'             // 8. No borders, subtle dividers
  | 'simple'            // 9. Basic no-frills ATS optimized
  | 'elegant'           // 10. Refined typography with small caps
  // Row 3: Creative Designs (11-20)
  | 'creative'          // 11. Bold header with accent colors
  | 'bold'              // 12. Large name, strong section headers
  | 'gradient'          // 13. Gradient header background
  | 'metro'             // 14. Flat tile design
  | 'geometric'         // 15. Geometric shapes accents
  | 'artistic'          // 16. Asymmetric layout
  | 'headline'          // 17. Oversized section titles
  | 'stripe'            // 18. Alternating background stripes
  | 'ribbon'            // 19. Ribbon-style section headers
  | 'wave'              // 20. Wave pattern dividers
  // Row 4: Two-Column Layouts (21-30)
  | 'sidebar-left'      // 21. Left sidebar with skills/contact
  | 'sidebar-right'     // 22. Right sidebar layout
  | 'double-column'     // 23. Equal 50/50 split
  | 'executive'         // 24. Executive two-column
  | 'infographic'       // 25. Visual skill bars
  | 'magazine'          // 26. Magazine-style columns
  | 'split'             // 27. Header split design
  | 'asymmetric'        // 28. Unequal column widths
  | 'modular'           // 29. Modular block layout
  | 'card'              // 30. Card-based sections
  // Row 5: Technical/Developer (31-40)
  | 'tech'              // 31. Developer focused
  | 'mono'              // 32. Monospace terminal style
  | 'developer'         // 33. GitHub-style layout
  | 'engineer'          // 34. Technical with diagrams space
  | 'code'              // 35. Code editor theme
  | 'terminal'          // 36. Terminal/CLI aesthetic
  | 'matrix'            // 37. Grid-based technical
  | 'circuit'           // 38. Circuit board inspired
  | 'blueprint'         // 39. Blueprint style
  | 'data'              // 40. Data visualization focus
  // Row 6: Specialized & Unique (41-50)
  | 'compact'           // 41. Dense single column
  | 'timeline'          // 42. Visual timeline
  | 'boxed'             // 43. Boxed sections
  | 'accent-left'       // 44. Left accent bar
  | 'centered'          // 45. Centered header
  | 'swiss'             // 46. Swiss/Helvetica design
  | 'corner-accent'     // 47. Corner accent element
  | 'top-skills'        // 48. Skills at top
  | 'nordic'            // 49. Scandinavian minimal
  | 'japanese'          // 50. Japanese minimalist
  // Additional Premium Templates (51-57)
  | 'wright'            // 51. Corporate two-column with dark sidebar
  | 'taylor'            // 52. Two-column with achievements metrics
  | 'avery'             // 53. Two-column with projects sidebar
  | 'martinez'          // 54. Timeline-style experience
  | 'amelia'            // 55. Sidebar with achievement badges
  | 'sebastian'         // 56. Key achievements sidebar
  | 'wyatt'             // 57. Single column with double rules

export type TemplateCategory = 'all' | 'classic' | 'modern' | 'minimal' | 'creative' | 'technical' | 'executive' | 'specialized'

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

export type ResumeFont =
  | 'Helvetica'
  | 'Times-Roman'
  | 'Courier'
  | 'Georgia'
  | 'Palatino'

export interface ResumeSettings {
  template: ResumeTemplate
  primaryColor: string
  fontFamily: ResumeFont
  showPhoto: boolean
  showSkillLevels: boolean
  sectionsOrder: string[]
}

export const FONT_OPTIONS = [
  { value: 'Helvetica' as ResumeFont, label: 'Helvetica', description: 'Clean and modern sans-serif' },
  { value: 'Times-Roman' as ResumeFont, label: 'Times New Roman', description: 'Classic serif for traditional look' },
  { value: 'Courier' as ResumeFont, label: 'Courier', description: 'Monospace for technical roles' },
  { value: 'Georgia' as ResumeFont, label: 'Georgia', description: 'Elegant serif font' },
  { value: 'Palatino' as ResumeFont, label: 'Palatino', description: 'Sophisticated and readable' },
]

export const DEFAULT_RESUME_SETTINGS: ResumeSettings = {
  template: 'professional',
  primaryColor: '#2563eb',
  fontFamily: 'Helvetica',
  showPhoto: false,
  showSkillLevels: true,
  sectionsOrder: ['experience', 'education', 'skills', 'languages', 'certifications', 'projects'],
}

export interface TemplateOption {
  value: ResumeTemplate
  label: string
  description: string
  category: TemplateCategory
  previewImage?: string
  isPopular?: boolean
  isNew?: boolean
}

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  // Classic Single Column (1-5)
  { value: 'professional', label: 'Professional', description: 'Standard professional layout with clean sections', category: 'classic', isPopular: true },
  { value: 'classic', label: 'Classic', description: 'Serif font, centered header, horizontal rules', category: 'classic' },
  { value: 'traditional', label: 'Traditional', description: 'Conservative design with justified text', category: 'classic' },
  { value: 'formal', label: 'Formal', description: 'Government/legal style with dense formatting', category: 'classic' },
  { value: 'academic', label: 'Academic', description: 'CV style for educators and researchers', category: 'specialized' },
  // Modern Single Column (6-10)
  { value: 'modern', label: 'Modern', description: 'Contemporary sans-serif with colored accents', category: 'modern', isPopular: true },
  { value: 'minimal', label: 'Minimal', description: 'Maximum whitespace, sparse elegant design', category: 'minimal', isPopular: true },
  { value: 'clean', label: 'Clean', description: 'No borders, subtle dividers, pure content', category: 'minimal' },
  { value: 'simple', label: 'Simple', description: 'Basic no-frills ATS optimized format', category: 'minimal' },
  { value: 'elegant', label: 'Elegant', description: 'Refined typography with small caps headers', category: 'modern' },
  // Creative Designs (11-20)
  { value: 'creative', label: 'Creative', description: 'Bold header with accent colors', category: 'creative', isPopular: true },
  { value: 'bold', label: 'Bold', description: 'Large name, strong section headers', category: 'creative' },
  { value: 'gradient', label: 'Gradient', description: 'Gradient header background effect', category: 'creative', isNew: true },
  { value: 'metro', label: 'Metro', description: 'Flat tile design inspired by Metro UI', category: 'creative' },
  { value: 'geometric', label: 'Geometric', description: 'Geometric shapes and patterns', category: 'creative' },
  { value: 'artistic', label: 'Artistic', description: 'Asymmetric creative layout', category: 'creative' },
  { value: 'headline', label: 'Headline', description: 'Oversized section titles', category: 'creative' },
  { value: 'stripe', label: 'Stripe', description: 'Alternating background stripes', category: 'creative' },
  { value: 'ribbon', label: 'Ribbon', description: 'Ribbon-style section headers', category: 'creative', isNew: true },
  { value: 'wave', label: 'Wave', description: 'Wave pattern section dividers', category: 'creative', isNew: true },
  // Two-Column Layouts (21-30)
  { value: 'sidebar-left', label: 'Sidebar Left', description: 'Left sidebar with skills and contact', category: 'modern' },
  { value: 'sidebar-right', label: 'Sidebar Right', description: 'Right sidebar layout', category: 'modern' },
  { value: 'double-column', label: 'Double Column', description: 'Equal 50/50 split columns', category: 'modern' },
  { value: 'executive', label: 'Executive', description: 'Executive two-column for leadership', category: 'executive', isPopular: true },
  { value: 'infographic', label: 'Infographic', description: 'Visual skill bars two-column', category: 'creative', isPopular: true },
  { value: 'magazine', label: 'Magazine', description: 'Magazine-style column layout', category: 'creative', isNew: true },
  { value: 'split', label: 'Split', description: 'Header split design', category: 'modern' },
  { value: 'asymmetric', label: 'Asymmetric', description: 'Unequal column widths 30/70', category: 'modern', isNew: true },
  { value: 'modular', label: 'Modular', description: 'Modular block layout', category: 'modern', isNew: true },
  { value: 'card', label: 'Card', description: 'Card-based section design', category: 'modern', isNew: true },
  // Technical/Developer (31-40)
  { value: 'tech', label: 'Tech', description: 'Developer focused with skills prominence', category: 'technical', isPopular: true },
  { value: 'mono', label: 'Mono', description: 'Monospace terminal style', category: 'technical' },
  { value: 'developer', label: 'Developer', description: 'GitHub-style layout', category: 'technical' },
  { value: 'engineer', label: 'Engineer', description: 'Technical engineering format', category: 'technical' },
  { value: 'code', label: 'Code', description: 'Code editor dark theme', category: 'technical', isNew: true },
  { value: 'terminal', label: 'Terminal', description: 'Terminal CLI aesthetic', category: 'technical', isNew: true },
  { value: 'matrix', label: 'Matrix', description: 'Grid-based technical layout', category: 'technical', isNew: true },
  { value: 'circuit', label: 'Circuit', description: 'Circuit board inspired design', category: 'technical', isNew: true },
  { value: 'blueprint', label: 'Blueprint', description: 'Blueprint technical style', category: 'technical', isNew: true },
  { value: 'data', label: 'Data', description: 'Data visualization focus', category: 'technical', isNew: true },
  // Specialized & Unique (41-50)
  { value: 'compact', label: 'Compact', description: 'Dense single column fits more', category: 'modern' },
  { value: 'timeline', label: 'Timeline', description: 'Visual career timeline', category: 'modern' },
  { value: 'boxed', label: 'Boxed', description: 'Boxed sections with borders', category: 'modern' },
  { value: 'accent-left', label: 'Accent Left', description: 'Left accent bar design', category: 'modern' },
  { value: 'centered', label: 'Centered', description: 'Centered header elegant', category: 'modern' },
  { value: 'swiss', label: 'Swiss', description: 'Swiss Helvetica modernist', category: 'minimal', isPopular: true },
  { value: 'corner-accent', label: 'Corner Accent', description: 'Corner accent element', category: 'modern' },
  { value: 'top-skills', label: 'Top Skills', description: 'Skills section at top', category: 'technical', isPopular: true },
  { value: 'nordic', label: 'Nordic', description: 'Scandinavian minimal design', category: 'minimal', isNew: true },
  { value: 'japanese', label: 'Japanese', description: 'Japanese minimalist aesthetic', category: 'minimal', isNew: true },
  { value: 'wright', label: 'Wright', description: 'Corporate two-column with dark navy sidebar', category: 'executive', isNew: true },
  // Additional Premium Templates
  { value: 'taylor', label: 'Taylor', description: 'Two-column with prominent achievement metrics', category: 'executive', isNew: true, isPopular: true },
  { value: 'avery', label: 'Avery', description: 'Two-column with projects and achievements sidebar', category: 'modern', isNew: true },
  { value: 'martinez', label: 'Martinez', description: 'Timeline-style career visualization', category: 'creative', isNew: true },
  { value: 'amelia', label: 'Amelia', description: 'Sidebar with achievement badges and icons', category: 'modern', isNew: true, isPopular: true },
  { value: 'sebastian', label: 'Sebastian', description: 'Key achievements highlighted in sidebar', category: 'executive', isNew: true },
  { value: 'wyatt', label: 'Wyatt', description: 'Classic single column with double rules', category: 'classic', isNew: true },
]

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string; description: string }[] = [
  { value: 'all', label: 'All Templates', description: 'Browse all available templates' },
  { value: 'classic', label: 'Classic', description: 'Traditional and formal designs' },
  { value: 'modern', label: 'Modern', description: 'Contemporary and fresh layouts' },
  { value: 'minimal', label: 'Minimal', description: 'Clean and simple designs' },
  { value: 'creative', label: 'Creative', description: 'Bold and artistic templates' },
  { value: 'technical', label: 'Technical', description: 'For developers and engineers' },
  { value: 'executive', label: 'Executive', description: 'For senior professionals' },
  { value: 'specialized', label: 'Specialized', description: 'Industry-specific formats' },
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
  { value: '#0d9488', label: 'Cyan' },
  { value: '#be185d', label: 'Pink' },
  { value: '#7c2d12', label: 'Brown' },
  { value: '#1e3a8a', label: 'Navy' },
]

// Sample resume data for template previews - compact to fit one page
export const SAMPLE_RESUME_DATA: ResumeData = {
  personalInfo: {
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex@email.com',
    phone: '(555) 123-4567',
    location: 'San Francisco, CA',
    headline: 'Senior Software Engineer',
    summary: 'Software engineer with 8+ years building scalable web apps. Expert in React, Node.js, and cloud tech. Led teams delivering projects that increased revenue by 40%.',
    linkedinUrl: 'https://linkedin.com/in/alexjohnson',
    githubUrl: 'https://github.com/alexjohnson',
  },
  experience: [
    {
      id: '1',
      companyName: 'TechCorp Inc.',
      title: 'Senior Software Engineer',
      location: 'San Francisco, CA',
      startDate: '2021-01',
      isCurrent: true,
      description: '',
      achievements: [
        'Led microservices architecture serving 2M+ users',
        'Reduced API response time by 60%',
        'Implemented CI/CD reducing deployment time by 80%',
      ],
    },
    {
      id: '2',
      companyName: 'StartupXYZ',
      title: 'Full Stack Developer',
      location: 'Remote',
      startDate: '2018-03',
      endDate: '2020-12',
      isCurrent: false,
      description: '',
      achievements: [
        'Built e-commerce platform processing $1M+ monthly',
        'Mobile-responsive design increased sales by 45%',
      ],
    },
  ],
  education: [
    {
      id: '1',
      institution: 'Stanford University',
      degree: 'M.S.',
      fieldOfStudy: 'Computer Science',
      startDate: '2014-09',
      endDate: '2016-06',
      isCurrent: false,
      grade: '3.9',
    },
    {
      id: '2',
      institution: 'UC Berkeley',
      degree: 'B.S.',
      fieldOfStudy: 'Computer Science',
      startDate: '2010-09',
      endDate: '2014-05',
      isCurrent: false,
      grade: '3.7',
    },
  ],
  skills: [
    { id: '1', name: 'React', level: 'EXPERT' },
    { id: '2', name: 'TypeScript', level: 'EXPERT' },
    { id: '3', name: 'Node.js', level: 'ADVANCED' },
    { id: '4', name: 'Python', level: 'ADVANCED' },
    { id: '5', name: 'AWS', level: 'ADVANCED' },
    { id: '6', name: 'PostgreSQL', level: 'INTERMEDIATE' },
  ],
  languages: [
    { id: '1', name: 'English', proficiency: 'NATIVE' },
    { id: '2', name: 'Spanish', proficiency: 'CONVERSATIONAL' },
  ],
  certifications: [
    {
      id: '1',
      name: 'AWS Solutions Architect',
      issuingOrganization: 'AWS',
      issueDate: '2022-03',
      credentialId: 'AWS-SAA-123456',
    },
  ],
  projects: [
    {
      id: '1',
      title: 'Analytics Dashboard',
      description: 'Real-time analytics dashboard used by 500+ companies',
      technologies: ['React', 'D3.js', 'Node.js'],
      projectUrl: 'https://analytics-demo.com',
      sourceCodeUrl: 'https://github.com/alexjohnson/analytics',
    },
  ],
}
