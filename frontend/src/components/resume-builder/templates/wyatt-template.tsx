import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Wyatt Template - "Ben Wyatt" design
// A single column clean resume with:
// - Centered header with name in bold
// - Horizontal double rule under header
// - Clear section headings with underlines
// - Justified text for descriptions
// - Traditional professional appearance
// - Maximum content focus
// - ATS-friendly

const getFontFamily = (baseFontFamily: string, style: 'regular' | 'bold' | 'italic' | 'boldItalic' = 'regular') => {
  // Handle Times-Roman font variations
  if (baseFontFamily === 'Times-Roman') {
    switch (style) {
      case 'bold': return 'Times-Bold'
      case 'italic': return 'Times-Italic'
      case 'boldItalic': return 'Times-BoldItalic'
      default: return 'Times-Roman'
    }
  }
  // Handle Helvetica font variations
  if (baseFontFamily === 'Helvetica') {
    switch (style) {
      case 'bold': return 'Helvetica-Bold'
      case 'italic': return 'Helvetica-Oblique'
      case 'boldItalic': return 'Helvetica-BoldOblique'
      default: return 'Helvetica'
    }
  }
  // Handle Courier font variations
  if (baseFontFamily === 'Courier') {
    switch (style) {
      case 'bold': return 'Courier-Bold'
      case 'italic': return 'Courier-Oblique'
      case 'boldItalic': return 'Courier-BoldOblique'
      default: return 'Courier'
    }
  }
  // Default fallback
  return baseFontFamily
}

const createStyles = (primaryColor: string, fontFamily: string = 'Times-Roman') =>
  StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 40,
      paddingHorizontal: 50,
      fontSize: 10,
      fontFamily: getFontFamily(fontFamily),
      color: '#222222',
      backgroundColor: '#ffffff',
    },
    // Header - Centered with bold name
    header: {
      alignItems: 'center',
      marginBottom: 12,
    },
    name: {
      fontSize: 22,
      fontFamily: getFontFamily(fontFamily, 'bold'),
      color: '#000000',
      marginBottom: 4,
      textAlign: 'center',
    },
    headline: {
      fontSize: 11,
      fontFamily: getFontFamily(fontFamily),
      color: '#444444',
      marginBottom: 8,
      textAlign: 'center',
    },
    contactRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 12,
    },
    contactItem: {
      fontSize: 9,
      color: '#333333',
      fontFamily: getFontFamily(fontFamily),
    },
    contactSeparator: {
      fontSize: 9,
      color: '#666666',
    },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginTop: 6,
    },
    link: {
      fontSize: 9,
      color: primaryColor,
      fontFamily: getFontFamily(fontFamily),
      textDecoration: 'none',
    },
    // Double horizontal rule under header
    doubleRule: {
      width: '100%',
      marginTop: 12,
      marginBottom: 16,
    },
    ruleTop: {
      height: 1.5,
      backgroundColor: '#000000',
      marginBottom: 2,
    },
    ruleBottom: {
      height: 0.75,
      backgroundColor: '#000000',
    },
    // Sections
    section: {
      marginBottom: 12,
    },
    // Section title with underline
    sectionTitleContainer: {
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: primaryColor,
      borderBottomStyle: 'solid',
      paddingBottom: 3,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: getFontFamily(fontFamily, 'bold'),
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: primaryColor,
    },
    // Summary with justified text
    summaryText: {
      fontSize: 10,
      lineHeight: 1.5,
      fontFamily: getFontFamily(fontFamily),
      textAlign: 'justify',
      color: '#222222',
    },
    // Experience & Education items
    itemContainer: {
      marginBottom: 10,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 2,
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: getFontFamily(fontFamily, 'bold'),
      color: '#000000',
      flex: 1,
      paddingRight: 8,
    },
    itemDates: {
      fontSize: 9,
      fontFamily: getFontFamily(fontFamily, 'italic'),
      color: '#444444',
      flexShrink: 0,
    },
    itemSubtitle: {
      fontSize: 10,
      fontFamily: getFontFamily(fontFamily, 'italic'),
      color: '#333333',
      marginBottom: 3,
    },
    itemDescription: {
      fontSize: 10,
      lineHeight: 1.4,
      textAlign: 'justify',
      color: '#222222',
      fontFamily: getFontFamily(fontFamily),
    },
    bulletList: {
      marginTop: 4,
      marginLeft: 10,
    },
    bulletItem: {
      fontSize: 10,
      lineHeight: 1.4,
      marginBottom: 2,
      textAlign: 'justify',
      color: '#222222',
      fontFamily: getFontFamily(fontFamily),
    },
    // Skills - inline comma-separated
    skillsText: {
      fontSize: 10,
      lineHeight: 1.4,
      color: '#222222',
      fontFamily: getFontFamily(fontFamily),
      textAlign: 'justify',
    },
    // Languages - inline format
    languageText: {
      fontSize: 10,
      lineHeight: 1.4,
      color: '#222222',
      fontFamily: getFontFamily(fontFamily),
    },
    // Certifications
    certItem: {
      marginBottom: 6,
    },
    certHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    certName: {
      fontSize: 10,
      fontFamily: getFontFamily(fontFamily, 'bold'),
      color: '#000000',
      flex: 1,
    },
    certDate: {
      fontSize: 9,
      fontFamily: getFontFamily(fontFamily, 'italic'),
      color: '#444444',
      flexShrink: 0,
    },
    certDetails: {
      fontSize: 9,
      fontFamily: getFontFamily(fontFamily),
      color: '#444444',
      marginTop: 1,
    },
    // Projects
    projectItem: {
      marginBottom: 8,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: getFontFamily(fontFamily, 'bold'),
      color: '#000000',
      marginBottom: 2,
    },
    projectDesc: {
      fontSize: 10,
      lineHeight: 1.4,
      textAlign: 'justify',
      color: '#222222',
      fontFamily: getFontFamily(fontFamily),
    },
    techLine: {
      fontSize: 9,
      fontFamily: getFontFamily(fontFamily, 'italic'),
      color: '#444444',
      marginTop: 3,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 3,
    },
    projectLink: {
      fontSize: 9,
      color: primaryColor,
      fontFamily: getFontFamily(fontFamily),
      textDecoration: 'none',
    },
  })

interface WyattTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function WyattTemplate({ data, settings }: WyattTemplateProps) {
  // Default to Times-Roman for traditional appearance
  const fontFamily = settings.fontFamily || 'Times-Roman'
  const styles = createStyles(settings.primaryColor, fontFamily)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Centered with bold name */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          <View style={styles.contactRow}>
            {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
            {personalInfo.phone && (
              <>
                <Text style={styles.contactSeparator}>|</Text>
                <Text style={styles.contactItem}>{personalInfo.phone}</Text>
              </>
            )}
            {personalInfo.location && (
              <>
                <Text style={styles.contactSeparator}>|</Text>
                <Text style={styles.contactItem}>{personalInfo.location}</Text>
              </>
            )}
          </View>
          {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
            <View style={styles.linkRow}>
              {personalInfo.linkedinUrl && <Link src={personalInfo.linkedinUrl} style={styles.link}>LinkedIn</Link>}
              {personalInfo.githubUrl && <Link src={personalInfo.githubUrl} style={styles.link}>GitHub</Link>}
              {personalInfo.portfolioUrl && <Link src={personalInfo.portfolioUrl} style={styles.link}>Portfolio</Link>}
            </View>
          )}
        </View>

        {/* Double Horizontal Rule */}
        <View style={styles.doubleRule}>
          <View style={styles.ruleTop} />
          <View style={styles.ruleBottom} />
        </View>

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Summary</Text>
            </View>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Experience</Text>
            </View>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{exp.title}</Text>
                  <Text style={styles.itemDates}>
                    {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                  </Text>
                </View>
                <Text style={styles.itemSubtitle}>
                  {exp.companyName}{exp.location ? `, ${exp.location}` : ''}
                </Text>
                {exp.description && (
                  <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={styles.bulletList}>
                    {exp.achievements.map((achievement, idx) => (
                      <Text key={idx} style={styles.bulletItem}>• {achievement}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Education</Text>
            </View>
            {education.map((edu) => (
              <View key={edu.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                  <Text style={styles.itemDates}>
                    {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                  </Text>
                </View>
                <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                {edu.grade && <Text style={styles.itemDescription}>GPA: {edu.grade}</Text>}
                {edu.description && (
                  <RichTextRenderer text={edu.description} style={styles.itemDescription} />
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Skills</Text>
            </View>
            <Text style={styles.skillsText}>
              {skills.map((skill) => skill.name).join(', ')}
            </Text>
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Languages</Text>
            </View>
            <Text style={styles.languageText}>
              {languages.map((lang) =>
                lang.proficiency
                  ? `${lang.name} (${lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()})`
                  : lang.name
              ).join(', ')}
            </Text>
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Certifications</Text>
            </View>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certItem}>
                <View style={styles.certHeader}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certDate}>{formatDate(cert.issueDate)}</Text>
                </View>
                <Text style={styles.certDetails}>
                  {cert.issuingOrganization}
                  {cert.credentialId ? ` | ID: ${cert.credentialId}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Projects</Text>
            </View>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <RichTextRenderer text={project.description} style={styles.projectDesc} />
                {project.technologies && project.technologies.length > 0 && (
                  <Text style={styles.techLine}>Technologies: {project.technologies.join(', ')}</Text>
                )}
                {(project.projectUrl || project.sourceCodeUrl) && (
                  <View style={styles.projectLinks}>
                    {project.projectUrl && <Link src={project.projectUrl} style={styles.projectLink}>View Project</Link>}
                    {project.sourceCodeUrl && <Link src={project.sourceCodeUrl} style={styles.projectLink}>Source Code</Link>}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
