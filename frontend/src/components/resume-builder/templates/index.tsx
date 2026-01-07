import { Font } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings, ResumeTemplate } from '@/types/resume-builder'
import { ProfessionalTemplate } from './professional-template'
import { ModernTemplate } from './modern-template'
import { MinimalTemplate } from './minimal-template'
import { CreativeTemplate } from './creative-template'
import { ExecutiveTemplate } from './executive-template'
import { TechTemplate } from './tech-template'

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
    case 'creative':
      return <CreativeTemplate data={data} settings={settings} />
    case 'executive':
      return <ExecutiveTemplate data={data} settings={settings} />
    case 'tech':
      return <TechTemplate data={data} settings={settings} />
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
    case 'creative':
      return CreativeTemplate
    case 'executive':
      return ExecutiveTemplate
    case 'tech':
      return TechTemplate
    case 'professional':
    default:
      return ProfessionalTemplate
  }
}

export { ProfessionalTemplate, ModernTemplate, MinimalTemplate, CreativeTemplate, ExecutiveTemplate, TechTemplate }
