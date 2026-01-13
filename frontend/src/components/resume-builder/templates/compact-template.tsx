import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Compact template - Dense single column, fits more content
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 25,
      paddingBottom: 25,
      paddingHorizontal: 30,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1f2937',
    },
    header: {
      marginBottom: 12,
    },
    name: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginBottom: 2,
    },
    headline: {
      fontSize: 10,
      color: '#4b5563',
      marginBottom: 6,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    contactItem: {
      fontSize: 8,
      color: '#374151',
    },
    contactSeparator: {
      fontSize: 8,
      color: '#9ca3af',
    },
    linkRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    link: {
      fontSize: 8,
      color: accentColor,
      textDecoration: 'underline',
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: accentColor,
      marginVertical: 8,
    },
    section: {
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#374151',
    },
    itemContainer: {
      marginBottom: 8,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    itemTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      flex: 1,
    },
    itemDates: {
      fontSize: 8,
      color: '#6b7280',
    },
    itemSubtitle: {
      fontSize: 8,
      color: accentColor,
      marginBottom: 2,
    },
    itemDescription: {
      fontSize: 8,
      lineHeight: 1.3,
      color: '#4b5563',
    },
    bulletList: {
      marginTop: 3,
    },
    bulletItem: {
      fontSize: 8,
      lineHeight: 1.3,
      color: '#4b5563',
      marginBottom: 1,
    },
    skillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    skillTag: {
      fontSize: 8,
      color: '#374151',
      backgroundColor: '#f3f4f6',
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 3,
    },
    languageRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    languageItem: {
      fontSize: 8,
      color: '#374151',
    },
    certItem: {
      marginBottom: 4,
    },
    certName: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    certDetails: {
      fontSize: 7,
      color: '#6b7280',
    },
    projectItem: {
      marginBottom: 6,
    },
    projectTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    projectDesc: {
      fontSize: 8,
      lineHeight: 1.3,
      color: '#4b5563',
    },
    techLine: {
      fontSize: 7,
      color: accentColor,
      marginTop: 2,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },
    projectLink: {
      fontSize: 7,
      color: accentColor,
      textDecoration: 'underline',
    },
  })

interface CompactTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function CompactTemplate({ data, settings }: CompactTemplateProps) {
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
              {personalInfo.linkedinUrl && (
                <Link src={personalInfo.linkedinUrl} style={styles.link}>LinkedIn</Link>
              )}
              {personalInfo.githubUrl && (
                <Link src={personalInfo.githubUrl} style={styles.link}>GitHub</Link>
              )}
              {personalInfo.portfolioUrl && (
                <Link src={personalInfo.portfolioUrl} style={styles.link}>Portfolio</Link>
              )}
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{exp.title}</Text>
                  <Text style={styles.itemDates}>
                    {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                  </Text>
                </View>
                <Text style={styles.itemSubtitle}>
                  {exp.companyName}{exp.location ? ` | ${exp.location}` : ''}
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
            <Text style={styles.sectionTitle}>Education</Text>
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
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
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
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.languageRow}>
              {languages.map((lang, idx) => (
                <Text key={lang.id} style={styles.languageItem}>
                  {lang.name}{lang.proficiency ? ` (${lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()})` : ''}{idx < languages.length - 1 ? ',' : ''}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certItem}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certDetails}>
                  {cert.issuingOrganization} | {formatDate(cert.issueDate)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <RichTextRenderer text={project.description} style={styles.projectDesc} />
                {project.technologies && project.technologies.length > 0 && (
                  <Text style={styles.techLine}>
                    {project.technologies.join(' | ')}
                  </Text>
                )}
                {(project.projectUrl || project.sourceCodeUrl) && (
                  <View style={styles.projectLinks}>
                    {project.projectUrl && (
                      <Link src={project.projectUrl} style={styles.projectLink}>Live Demo</Link>
                    )}
                    {project.sourceCodeUrl && (
                      <Link src={project.sourceCodeUrl} style={styles.projectLink}>Source</Link>
                    )}
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
