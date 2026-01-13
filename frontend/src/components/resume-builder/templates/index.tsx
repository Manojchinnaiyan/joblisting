import { Font } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings, ResumeTemplate } from '@/types/resume-builder'

// Import all 50 unique templates
import { ProfessionalTemplate } from './professional-template'
import { ClassicTemplate } from './classic-template'
import { TraditionalTemplate } from './traditional-template'
import { FormalTemplate } from './formal-template'
import { AcademicTemplate } from './academic-template'
import { ModernTemplate } from './modern-template'
import { MinimalTemplate } from './minimal-template'
import { CleanTemplate } from './clean-template'
import { SimpleTemplate } from './simple-template'
import { ElegantTemplate } from './elegant-template'
import { CreativeTemplate } from './creative-template'
import { BoldTemplate } from './bold-template'
import { GradientTemplate } from './gradient-template'
import { MetroTemplate } from './metro-template'
import { GeometricTemplate } from './geometric-template'
import { ArtisticTemplate } from './artistic-template'
import { HeadlineTemplate } from './headline-template'
import { StripeTemplate } from './stripe-template'
import { RibbonTemplate } from './ribbon-template'
import { WaveTemplate } from './wave-template'
import { SidebarLeftTemplate } from './sidebar-left-template'
import { SidebarRightTemplate } from './sidebar-right-template'
import { DoubleColumnTemplate } from './double-column-template'
import { ExecutiveTemplate } from './executive-template'
import { InfographicTemplate } from './infographic-template'
import { MagazineTemplate } from './magazine-template'
import { SplitTemplate } from './split-template'
import { AsymmetricTemplate } from './asymmetric-template'
import { ModularTemplate } from './modular-template'
import { CardTemplate } from './card-template'
import { TechTemplate } from './tech-template'
import { MonoTemplate } from './mono-template'
import { DeveloperTemplate } from './developer-template'
import { EngineerTemplate } from './engineer-template'
import { CodeTemplate } from './code-template'
import { TerminalTemplate } from './terminal-template'
import { MatrixTemplate } from './matrix-template'
import { CircuitTemplate } from './circuit-template'
import { BlueprintTemplate } from './blueprint-template'
import { DataTemplate } from './data-template'
import { CompactTemplate } from './compact-template'
import { TimelineTemplate } from './timeline-template'
import { BoxedTemplate } from './boxed-template'
import { AccentLeftTemplate } from './accent-left-template'
import { CenteredTemplate } from './centered-template'
import { SwissTemplate } from './swiss-template'
import { CornerAccentTemplate } from './corner-accent-template'
import { TopSkillsTemplate } from './top-skills-template'
import { NordicTemplate } from './nordic-template'
import { JapaneseTemplate } from './japanese-template'
import { WrightTemplate } from './wright-template'
// Additional Premium Templates
import { TaylorTemplate } from './taylor-template'
import { AveryTemplate } from './avery-template'
import { MartinezTemplate } from './martinez-template'
import { AmeliaTemplate } from './amelia-template'
import { SebastianTemplate } from './sebastian-template'
import { WyattTemplate } from './wyatt-template'

// Disable hyphenation globally - prevents words from being split with hyphens
Font.registerHyphenationCallback((word) => [word])

interface ResumeDocumentProps {
  data: ResumeData
  settings: ResumeSettings
}

// Map each template type to its unique template implementation
function getTemplateComponent(template: ResumeTemplate): React.ComponentType<{ data: ResumeData; settings: ResumeSettings }> {
  switch (template) {
    // Row 1: Classic Single Column (1-5)
    case 'professional':
      return ProfessionalTemplate
    case 'classic':
      return ClassicTemplate
    case 'traditional':
      return TraditionalTemplate
    case 'formal':
      return FormalTemplate
    case 'academic':
      return AcademicTemplate

    // Row 2: Modern Single Column (6-10)
    case 'modern':
      return ModernTemplate
    case 'minimal':
      return MinimalTemplate
    case 'clean':
      return CleanTemplate
    case 'simple':
      return SimpleTemplate
    case 'elegant':
      return ElegantTemplate

    // Row 3: Creative Designs (11-20)
    case 'creative':
      return CreativeTemplate
    case 'bold':
      return BoldTemplate
    case 'gradient':
      return GradientTemplate
    case 'metro':
      return MetroTemplate
    case 'geometric':
      return GeometricTemplate
    case 'artistic':
      return ArtisticTemplate
    case 'headline':
      return HeadlineTemplate
    case 'stripe':
      return StripeTemplate
    case 'ribbon':
      return RibbonTemplate
    case 'wave':
      return WaveTemplate

    // Row 4: Two-Column Layouts (21-30)
    case 'sidebar-left':
      return SidebarLeftTemplate
    case 'sidebar-right':
      return SidebarRightTemplate
    case 'double-column':
      return DoubleColumnTemplate
    case 'executive':
      return ExecutiveTemplate
    case 'infographic':
      return InfographicTemplate
    case 'magazine':
      return MagazineTemplate
    case 'split':
      return SplitTemplate
    case 'asymmetric':
      return AsymmetricTemplate
    case 'modular':
      return ModularTemplate
    case 'card':
      return CardTemplate

    // Row 5: Technical/Developer (31-40)
    case 'tech':
      return TechTemplate
    case 'mono':
      return MonoTemplate
    case 'developer':
      return DeveloperTemplate
    case 'engineer':
      return EngineerTemplate
    case 'code':
      return CodeTemplate
    case 'terminal':
      return TerminalTemplate
    case 'matrix':
      return MatrixTemplate
    case 'circuit':
      return CircuitTemplate
    case 'blueprint':
      return BlueprintTemplate
    case 'data':
      return DataTemplate

    // Row 6: Specialized & Unique (41-50)
    case 'compact':
      return CompactTemplate
    case 'timeline':
      return TimelineTemplate
    case 'boxed':
      return BoxedTemplate
    case 'accent-left':
      return AccentLeftTemplate
    case 'centered':
      return CenteredTemplate
    case 'swiss':
      return SwissTemplate
    case 'corner-accent':
      return CornerAccentTemplate
    case 'top-skills':
      return TopSkillsTemplate
    case 'nordic':
      return NordicTemplate
    case 'japanese':
      return JapaneseTemplate
    case 'wright':
      return WrightTemplate

    // Additional Premium Templates (51-57)
    case 'taylor':
      return TaylorTemplate
    case 'avery':
      return AveryTemplate
    case 'martinez':
      return MartinezTemplate
    case 'amelia':
      return AmeliaTemplate
    case 'sebastian':
      return SebastianTemplate
    case 'wyatt':
      return WyattTemplate

    default:
      return ProfessionalTemplate
  }
}

// Get default color for each template
function getTemplateDefaultColor(template: ResumeTemplate, currentColor: string): string {
  // If user has customized the color, use it
  if (currentColor && currentColor !== '#2563eb') {
    return currentColor
  }

  // Template-specific default colors
  switch (template) {
    // Classic Single Column
    case 'professional':
      return '#2563eb' // Blue
    case 'classic':
      return '#1e3a8a' // Navy
    case 'traditional':
      return '#4b5563' // Gray
    case 'formal':
      return '#1e3a8a' // Navy
    case 'academic':
      return '#7c2d12' // Brown

    // Modern Single Column
    case 'modern':
      return '#2563eb' // Blue
    case 'minimal':
      return '#4b5563' // Gray
    case 'clean':
      return '#0891b2' // Teal
    case 'simple':
      return '#000000' // Black
    case 'elegant':
      return '#7c3aed' // Purple

    // Creative Designs
    case 'creative':
      return '#7c3aed' // Purple
    case 'bold':
      return '#dc2626' // Red
    case 'gradient':
      return '#7c3aed' // Purple
    case 'metro':
      return '#2563eb' // Blue
    case 'geometric':
      return '#059669' // Green
    case 'artistic':
      return '#be185d' // Pink
    case 'headline':
      return '#1e3a8a' // Navy
    case 'stripe':
      return '#2563eb' // Blue
    case 'ribbon':
      return '#dc2626' // Red
    case 'wave':
      return '#0891b2' // Teal

    // Two-Column Layouts
    case 'sidebar-left':
      return '#1e3a8a' // Navy
    case 'sidebar-right':
      return '#2563eb' // Blue
    case 'double-column':
      return '#2563eb' // Blue
    case 'executive':
      return '#1e3a8a' // Navy
    case 'infographic':
      return '#059669' // Green
    case 'magazine':
      return '#dc2626' // Red
    case 'split':
      return '#2563eb' // Blue
    case 'asymmetric':
      return '#7c3aed' // Purple
    case 'modular':
      return '#2563eb' // Blue
    case 'card':
      return '#059669' // Green

    // Technical/Developer
    case 'tech':
      return '#059669' // Green
    case 'mono':
      return '#22c55e' // Terminal Green
    case 'developer':
      return '#2563eb' // Blue
    case 'engineer':
      return '#0891b2' // Teal
    case 'code':
      return '#22c55e' // Green
    case 'terminal':
      return '#22c55e' // Terminal Green
    case 'matrix':
      return '#22c55e' // Matrix Green
    case 'circuit':
      return '#059669' // Green
    case 'blueprint':
      return '#1a4480' // Blueprint Blue
    case 'data':
      return '#2563eb' // Blue

    // Specialized & Unique
    case 'compact':
      return '#2563eb' // Blue
    case 'timeline':
      return '#059669' // Green
    case 'boxed':
      return '#2563eb' // Blue
    case 'accent-left':
      return '#2563eb' // Blue
    case 'centered':
      return '#1e3a8a' // Navy
    case 'swiss':
      return '#dc2626' // Swiss Red
    case 'corner-accent':
      return '#2563eb' // Blue
    case 'top-skills':
      return '#059669' // Green
    case 'nordic':
      return '#0891b2' // Teal
    case 'japanese':
      return '#dc2626' // Red
    case 'wright':
      return '#1e3a8a' // Navy

    // Additional Premium Templates
    case 'taylor':
      return '#2563eb' // Blue
    case 'avery':
      return '#059669' // Green
    case 'martinez':
      return '#7c3aed' // Purple
    case 'amelia':
      return '#2563eb' // Blue
    case 'sebastian':
      return '#1e3a8a' // Navy
    case 'wyatt':
      return '#1e3a8a' // Navy

    default:
      return currentColor || '#2563eb'
  }
}

export function ResumeDocument({ data, settings }: ResumeDocumentProps) {
  const Template = getTemplateComponent(settings.template)

  // Apply template-specific default color if not customized
  const effectiveSettings = {
    ...settings,
    primaryColor: getTemplateDefaultColor(settings.template, settings.primaryColor),
  }

  return <Template data={data} settings={effectiveSettings} />
}

export { getTemplateComponent }

// Export individual templates for direct use
export {
  ProfessionalTemplate,
  ClassicTemplate,
  TraditionalTemplate,
  FormalTemplate,
  AcademicTemplate,
  ModernTemplate,
  MinimalTemplate,
  CleanTemplate,
  SimpleTemplate,
  ElegantTemplate,
  CreativeTemplate,
  BoldTemplate,
  GradientTemplate,
  MetroTemplate,
  GeometricTemplate,
  ArtisticTemplate,
  HeadlineTemplate,
  StripeTemplate,
  RibbonTemplate,
  WaveTemplate,
  SidebarLeftTemplate,
  SidebarRightTemplate,
  DoubleColumnTemplate,
  ExecutiveTemplate,
  InfographicTemplate,
  MagazineTemplate,
  SplitTemplate,
  AsymmetricTemplate,
  ModularTemplate,
  CardTemplate,
  TechTemplate,
  MonoTemplate,
  DeveloperTemplate,
  EngineerTemplate,
  CodeTemplate,
  TerminalTemplate,
  MatrixTemplate,
  CircuitTemplate,
  BlueprintTemplate,
  DataTemplate,
  CompactTemplate,
  TimelineTemplate,
  BoxedTemplate,
  AccentLeftTemplate,
  CenteredTemplate,
  SwissTemplate,
  CornerAccentTemplate,
  TopSkillsTemplate,
  NordicTemplate,
  JapaneseTemplate,
  WrightTemplate,
  // Additional Premium Templates
  TaylorTemplate,
  AveryTemplate,
  MartinezTemplate,
  AmeliaTemplate,
  SebastianTemplate,
  WyattTemplate,
}
