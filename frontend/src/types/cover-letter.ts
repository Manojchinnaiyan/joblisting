// Cover Letter Builder Types

export type CoverLetterTemplate = 'professional' | 'modern' | 'minimal' | 'creative'

export interface CoverLetterData {
  // Sender Info
  senderName: string
  senderEmail: string
  senderPhone?: string
  senderAddress?: string
  senderCity?: string

  // Recipient Info
  recipientName?: string
  recipientTitle?: string
  companyName: string
  companyAddress?: string

  // Letter Content
  date: string
  subject?: string
  salutation: string
  openingParagraph: string
  bodyParagraphs: string[]
  closingParagraph: string
  closing: string

  // Social Links
  linkedinUrl?: string
  portfolioUrl?: string
}

export interface CoverLetterSettings {
  template: CoverLetterTemplate
  primaryColor: string
  fontSize: 'small' | 'medium' | 'large'
}

export const DEFAULT_COVER_LETTER_DATA: CoverLetterData = {
  senderName: '',
  senderEmail: '',
  senderPhone: '',
  senderAddress: '',
  senderCity: '',
  recipientName: '',
  recipientTitle: '',
  companyName: '',
  companyAddress: '',
  date: new Date().toISOString().split('T')[0],
  subject: '',
  salutation: 'Dear Hiring Manager,',
  openingParagraph: '',
  bodyParagraphs: [''],
  closingParagraph: '',
  closing: 'Sincerely,',
}

export const DEFAULT_COVER_LETTER_SETTINGS: CoverLetterSettings = {
  template: 'professional',
  primaryColor: '#2563eb',
  fontSize: 'medium',
}

export const COVER_LETTER_TEMPLATE_OPTIONS: { value: CoverLetterTemplate; label: string; description: string }[] = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Traditional business letter format',
  },
  {
    value: 'modern',
    label: 'Modern',
    description: 'Clean contemporary design with accent colors',
  },
  {
    value: 'minimal',
    label: 'Minimal',
    description: 'Simple and elegant, focuses on content',
  },
  {
    value: 'creative',
    label: 'Creative',
    description: 'Bold design for creative industries',
  },
]

export const SALUTATION_OPTIONS = [
  'Dear Hiring Manager,',
  'Dear Recruiting Team,',
  'Dear [Name],',
  'To Whom It May Concern,',
  'Hello,',
  'Hi [Name],',
]

export const CLOSING_OPTIONS = [
  'Sincerely,',
  'Best regards,',
  'Kind regards,',
  'Thank you,',
  'Respectfully,',
  'Warm regards,',
]

export const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small', size: 10 },
  { value: 'medium', label: 'Medium', size: 11 },
  { value: 'large', label: 'Large', size: 12 },
]
