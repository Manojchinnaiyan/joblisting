import { Font } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings, ResumeTemplate } from '@/types/resume-builder'
import { ProfessionalTemplate } from './professional-template'
import { ModernTemplate } from './modern-template'
import { MinimalTemplate } from './minimal-template'

// Disable hyphenation globally - prevents words from being split with hyphens
Font.registerHyphenationCallback((word) => [word])

interface ResumeDocumentProps {
  data: ResumeData
  settings: ResumeSettings
}

export function ResumeDocument({ data, settings }: ResumeDocumentProps) {
  switch (settings.template) {
    case 'modern':
      return <ModernTemplate data={data} settings={settings} />
    case 'minimal':
      return <MinimalTemplate data={data} settings={settings} />
    case 'professional':
    default:
      return <ProfessionalTemplate data={data} settings={settings} />
  }
}

export function getTemplateComponent(template: ResumeTemplate) {
  switch (template) {
    case 'modern':
      return ModernTemplate
    case 'minimal':
      return MinimalTemplate
    case 'professional':
    default:
      return ProfessionalTemplate
  }
}

export { ProfessionalTemplate, ModernTemplate, MinimalTemplate }
