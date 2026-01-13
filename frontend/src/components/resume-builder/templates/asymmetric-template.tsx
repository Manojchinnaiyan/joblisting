import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Asymmetric template - 30% left column for dates/labels, 70% right for content
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 40,
      paddingHorizontal: 40,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1f2937',
    },
    header: {
      marginBottom: 20,
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 4,
    },
    headline: {
      fontSize: 11,
      color: accentColor,
      marginBottom: 10,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    contactItem: {
      fontSize: 9,
      color: '#4b5563',
    },
    linkItem: {
      fontSize: 9,
      color: accentColor,
      textDecoration: 'none',
    },
    divider: {
      height: 1,
      backgroundColor: '#e5e7eb',
      marginVertical: 15,
    },
    accentDivider: {
      height: 2,
      backgroundColor: accentColor,
      marginVertical: 15,
    },
    section: {
      marginBottom: 16,
    },
    row: {
      flexDirection: 'row',
    },
    leftColumn: {
      width: '30%',
      paddingRight: 15,
    },
    rightColumn: {
      width: '70%',
      paddingLeft: 15,
      borderLeftWidth: 1,
      borderLeftColor: '#e5e7eb',
    },
    sectionLabel: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    dateText: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 3,
    },
    locationText: {
      fontSize: 8,
      color: '#9ca3af',
      marginTop: 2,
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.6,
      color: '#374151',
    },
    entryContainer: {
      marginBottom: 14,
    },
    entryTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    entrySubtitle: {
      fontSize: 9,
      color: '#4b5563',
      marginTop: 2,
    },
    entryDescription: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
      marginTop: 4,
    },
    bulletList: {
      marginTop: 4,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginBottom: 2,
    },
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillItem: {
      fontSize: 9,
      color: '#374151',
      backgroundColor: '#f3f4f6',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 3,
    },
    languageItem: {
      fontSize: 9,
      color: '#374151',
      marginBottom: 4,
    },
    languageProficiency: {
      fontSize: 8,
      color: '#6b7280',
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    certIssuer: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 1,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
      marginTop: 3,
    },
    techList: {
      fontSize: 8,
      color: accentColor,
      marginTop: 4,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
      textDecoration: 'underline',
    },
    // Multi-entry row for items with dates
    entryRow: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    entryLeft: {
      width: '30%',
      paddingRight: 15,
    },
    entryRight: {
      width: '70%',
      paddingLeft: 15,
      borderLeftWidth: 1,
      borderLeftColor: '#e5e7eb',
    },
  })

interface AsymmetricTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function AsymmetricTemplate({ data, settings }: AsymmetricTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          <View style={styles.contactRow}>
            {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
            {personalInfo.phone && <Text style={styles.contactItem}>{personalInfo.phone}</Text>}
            {personalInfo.location && <Text style={styles.contactItem}>{personalInfo.location}</Text>}
            {personalInfo.linkedinUrl && (
              <Link src={personalInfo.linkedinUrl} style={styles.linkItem}>LinkedIn</Link>
            )}
            {personalInfo.githubUrl && (
              <Link src={personalInfo.githubUrl} style={styles.linkItem}>GitHub</Link>
            )}
            {personalInfo.portfolioUrl && (
              <Link src={personalInfo.portfolioUrl} style={styles.linkItem}>Portfolio</Link>
            )}
          </View>
        </View>

        <View style={styles.accentDivider} />

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.leftColumn}>
                <Text style={styles.sectionLabel}>About</Text>
              </View>
              <View style={styles.rightColumn}>
                <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
              </View>
            </View>
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.leftColumn}>
                <Text style={styles.sectionLabel}>Experience</Text>
              </View>
              <View style={styles.rightColumn}>
                {experience.map((exp, index) => (
                  <View key={exp.id} style={[styles.entryContainer, index === experience.length - 1 ? { marginBottom: 0 } : {}]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.entryTitle}>{exp.title}</Text>
                        <Text style={styles.entrySubtitle}>{exp.companyName}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.dateText}>
                          {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                        </Text>
                        {exp.location && <Text style={styles.locationText}>{exp.location}</Text>}
                      </View>
                    </View>
                    {exp.description && (
                      <RichTextRenderer text={exp.description} style={styles.entryDescription} />
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
            </View>
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.leftColumn}>
                <Text style={styles.sectionLabel}>Education</Text>
              </View>
              <View style={styles.rightColumn}>
                {education.map((edu, index) => (
                  <View key={edu.id} style={[styles.entryContainer, index === education.length - 1 ? { marginBottom: 0 } : {}]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.entryTitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                        <Text style={styles.entrySubtitle}>{edu.institution}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.dateText}>
                          {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                        </Text>
                      </View>
                    </View>
                    {edu.grade && <Text style={styles.entryDescription}>GPA: {edu.grade}</Text>}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.leftColumn}>
                <Text style={styles.sectionLabel}>Skills</Text>
              </View>
              <View style={styles.rightColumn}>
                <View style={styles.skillsContainer}>
                  {skills.map((skill) => (
                    <Text key={skill.id} style={styles.skillItem}>{skill.name}</Text>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.leftColumn}>
                <Text style={styles.sectionLabel}>Languages</Text>
              </View>
              <View style={styles.rightColumn}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15 }}>
                  {languages.map((lang) => (
                    <Text key={lang.id} style={styles.languageItem}>
                      {lang.name}
                      {lang.proficiency && (
                        <Text style={styles.languageProficiency}>
                          {' '}({lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()})
                        </Text>
                      )}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.leftColumn}>
                <Text style={styles.sectionLabel}>Certifications</Text>
              </View>
              <View style={styles.rightColumn}>
                {certifications.map((cert, index) => (
                  <View key={cert.id} style={[styles.entryContainer, index === certifications.length - 1 ? { marginBottom: 0 } : {}]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.certName}>{cert.name}</Text>
                        <Text style={styles.certIssuer}>{cert.issuingOrganization}</Text>
                      </View>
                      <Text style={styles.dateText}>{formatDate(cert.issueDate)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.leftColumn}>
                <Text style={styles.sectionLabel}>Projects</Text>
              </View>
              <View style={styles.rightColumn}>
                {projects.map((project, index) => (
                  <View key={project.id} style={[styles.entryContainer, index === projects.length - 1 ? { marginBottom: 0 } : {}]}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <RichTextRenderer text={project.description} style={styles.projectDesc} />
                    {project.technologies && project.technologies.length > 0 && (
                      <Text style={styles.techList}>{project.technologies.join(' • ')}</Text>
                    )}
                    {(project.projectUrl || project.sourceCodeUrl) && (
                      <View style={styles.projectLinks}>
                        {project.projectUrl && (
                          <Link src={project.projectUrl} style={styles.projectLink}>Live Demo</Link>
                        )}
                        {project.sourceCodeUrl && (
                          <Link src={project.sourceCodeUrl} style={styles.projectLink}>Source Code</Link>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </Page>
    </Document>
  )
}
