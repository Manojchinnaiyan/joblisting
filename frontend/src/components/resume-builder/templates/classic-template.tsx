import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Classic Template - Traditional professional resume with distinctive styling
// Features: Times-Roman serif font, centered header with uppercase name and letter spacing,
// double horizontal rule under header, section titles with underline decoration,
// justified text for descriptions, traditional professional appearance

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
      paddingTop: 45,
      paddingBottom: 45,
      paddingHorizontal: 55,
      fontSize: 10,
      fontFamily: getFontFamily(fontFamily),
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
    },
    // Header - Centered with uppercase name and letter spacing
    header: {
      alignItems: 'center',
      marginBottom: 20,
    },
    name: {
      fontSize: 24,
      fontFamily: getFontFamily(fontFamily, 'bold'),
      textTransform: 'uppercase',
      letterSpacing: 4,
      marginBottom: 6,
      color: '#000000',
    },
    headline: {
      fontSize: 11,
      fontFamily: getFontFamily(fontFamily, 'italic'),
      color: '#4a4a4a',
      marginBottom: 10,
      letterSpacing: 0.5,
    },
    contactRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 4,
    },
    contactItem: {
      fontSize: 9,
      color: '#333333',
      fontFamily: getFontFamily(fontFamily),
    },
    contactSeparator: {
      fontSize: 9,
      color: '#888888',
    },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 18,
      marginTop: 6,
      marginBottom: 12,
    },
    link: {
      fontSize: 9,
      color: primaryColor,
      fontFamily: getFontFamily(fontFamily),
    },
    // Double horizontal rule under header
    doubleRule: {
      width: '100%',
      marginBottom: 18,
    },
    ruleTop: {
      height: 2,
      backgroundColor: '#000000',
      marginBottom: 3,
    },
    ruleBottom: {
      height: 1,
      backgroundColor: '#666666',
    },
    // Sections
    section: {
      marginBottom: 14,
    },
    // Section title with underline decoration
    sectionTitleContainer: {
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: getFontFamily(fontFamily, 'bold'),
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      color: '#000000',
      textDecoration: 'underline',
      marginBottom: 2,
    },
    sectionUnderline: {
      height: 1,
      backgroundColor: primaryColor,
      width: 60,
      marginTop: 3,
    },
    // Summary with justified text
    summaryText: {
      fontSize: 10,
      lineHeight: 1.6,
      fontFamily: getFontFamily(fontFamily, 'italic'),
      textAlign: 'justify',
      color: '#2a2a2a',
    },
    // Experience & Education items
    itemContainer: {
      marginBottom: 12,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 3,
    },
    itemTitle: {
      fontSize: 11,
      fontFamily: getFontFamily(fontFamily, 'bold'),
      color: '#000000',
      flex: 1,
      paddingRight: 8,
    },
    itemDates: {
      fontSize: 10,
      fontFamily: getFontFamily(fontFamily, 'italic'),
      color: '#555555',
      flexShrink: 0,
    },
    itemSubtitle: {
      fontSize: 10,
      color: '#333333',
      marginBottom: 4,
      fontFamily: getFontFamily(fontFamily),
    },
    itemDescription: {
      fontSize: 10,
      lineHeight: 1.5,
      textAlign: 'justify',
      color: '#2a2a2a',
      fontFamily: getFontFamily(fontFamily),
    },
    bulletList: {
      marginTop: 5,
      marginLeft: 12,
    },
    bulletItem: {
      fontSize: 10,
      lineHeight: 1.5,
      marginBottom: 3,
      paddingLeft: 8,
      textAlign: 'justify',
      color: '#2a2a2a',
      fontFamily: getFontFamily(fontFamily),
    },
    // Skills
    skillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillTag: {
      fontSize: 9,
      color: '#333333',
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: '#aaaaaa',
      fontFamily: getFontFamily(fontFamily),
    },
    // Languages
    languageRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 18,
    },
    languageItem: {
      fontSize: 10,
      fontFamily: getFontFamily(fontFamily),
      color: '#2a2a2a',
    },
    // Certifications
    certItem: {
      marginBottom: 8,
    },
    certName: {
      fontSize: 10,
      fontFamily: getFontFamily(fontFamily, 'bold'),
      color: '#000000',
    },
    certDetails: {
      fontSize: 9,
      fontFamily: getFontFamily(fontFamily, 'italic'),
      color: '#555555',
      marginTop: 2,
    },
    // Projects
    projectItem: {
      marginBottom: 10,
    },
    projectTitle: {
      fontSize: 11,
      fontFamily: getFontFamily(fontFamily, 'bold'),
      color: '#000000',
    },
    projectDesc: {
      fontSize: 10,
      lineHeight: 1.5,
      marginTop: 3,
      textAlign: 'justify',
      color: '#2a2a2a',
      fontFamily: getFontFamily(fontFamily),
    },
    techLine: {
      fontSize: 9,
      fontFamily: getFontFamily(fontFamily, 'italic'),
      color: primaryColor,
      marginTop: 4,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    projectLink: {
      fontSize: 9,
      color: primaryColor,
      fontFamily: getFontFamily(fontFamily),
    },
  })

interface ClassicTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function ClassicTemplate({ data, settings }: ClassicTemplateProps) {
  // Default to Times-Roman for this template's traditional character
  const fontFamily = settings.fontFamily || 'Times-Roman'
  const styles = createStyles(settings.primaryColor, fontFamily)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Centered with uppercase name and letter spacing */}
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
              <Text style={styles.sectionTitle}>Professional Summary</Text>
            </View>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Professional Experience</Text>
            </View>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{exp.title}</Text>
                  <Text style={styles.itemDates}>
                    {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
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
                    {formatDate(edu.startDate)} – {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                  </Text>
                </View>
                <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                {edu.grade && <Text style={styles.itemDescription}>GPA: {edu.grade}</Text>}
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
            <View style={styles.skillsRow}>
              {skills.map((skill) => (
                <Text key={skill.id} style={styles.skillTag}>{skill.name}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Languages</Text>
            </View>
            <View style={styles.languageRow}>
              {languages.map((lang) => (
                <Text key={lang.id} style={styles.languageItem}>
                  {lang.name}{lang.proficiency ? ` (${lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()})` : ''}
                </Text>
              ))}
            </View>
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
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certDetails}>
                  {cert.issuingOrganization}, {formatDate(cert.issueDate)}
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
