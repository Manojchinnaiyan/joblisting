import { Font } from '@react-pdf/renderer'
import type { CoverLetterData, CoverLetterSettings, CoverLetterTemplate } from '@/types/cover-letter'
import { ProfessionalCoverLetter } from './professional-template'
import { ModernCoverLetter } from './modern-template'
import { MinimalCoverLetter } from './minimal-template'
import { CreativeCoverLetter } from './creative-template'

// Disable hyphenation globally
Font.registerHyphenationCallback((word) => [word])

interface CoverLetterDocumentProps {
  data: CoverLetterData
  settings: CoverLetterSettings
}

export function CoverLetterDocument({ data, settings }: CoverLetterDocumentProps) {
  switch (settings.template) {
    case 'modern':
      return <ModernCoverLetter data={data} settings={settings} />
    case 'minimal':
      return <MinimalCoverLetter data={data} settings={settings} />
    case 'creative':
      return <CreativeCoverLetter data={data} settings={settings} />
    case 'professional':
    default:
      return <ProfessionalCoverLetter data={data} settings={settings} />
  }
}

export function getCoverLetterTemplateComponent(template: CoverLetterTemplate) {
  switch (template) {
    case 'modern':
      return ModernCoverLetter
    case 'minimal':
      return MinimalCoverLetter
    case 'creative':
      return CreativeCoverLetter
    case 'professional':
    default:
      return ProfessionalCoverLetter
  }
}

export { ProfessionalCoverLetter, ModernCoverLetter, MinimalCoverLetter, CreativeCoverLetter }
