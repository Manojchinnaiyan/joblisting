import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Double Column template - Equal 50/50 split columns
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 30,
      paddingBottom: 30,
      paddingHorizontal: 30,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1f2937',
    },
    header: {
      marginBottom: 15,
      paddingBottom: 15,
      borderBottomWidth: 2,
      borderBottomColor: accentColor,
    },
    name: {
      fontSize: 22,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 3,
    },
    headline: {
      fontSize: 11,
      color: accentColor,
      marginBottom: 8,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    contactItem: {
      fontSize: 8,
      color: '#4b5563',
    },
    linkRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 6,
    },
    link: {
      fontSize: 8,
      color: accentColor,
    },
    summarySection: {
      marginBottom: 15,
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#374151',
    },
    columns: {
      flexDirection: 'row',
      gap: 20,
    },
    column: {
      flex: 1,
    },
    section: {
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      paddingBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    itemContainer: {
      marginBottom: 10,
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    itemSubtitle: {
      fontSize: 9,
      color: '#6b7280',
      marginTop: 1,
    },
    itemDates: {
      fontSize: 8,
      color: accentColor,
      marginTop: 2,
    },
    itemDescription: {
      fontSize: 8,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 4,
    },
    bulletList: {
      marginTop: 4,
    },
    bulletItem: {
      fontSize: 8,
      lineHeight: 1.4,
      color: '#4b5563',
      marginBottom: 2,
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
      borderRadius: 2,
    },
    languageItem: {
      marginBottom: 4,
    },
    languageName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    languageLevel: {
      fontSize: 8,
      color: '#6b7280',
    },
    certItem: {
      marginBottom: 6,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    certDetails: {
      fontSize: 8,
      color: '#6b7280',
    },
    projectItem: {
      marginBottom: 10,
    },
    projectTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    projectDesc: {
      fontSize: 8,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 3,
    },
    techLine: {
      fontSize: 7,
      color: accentColor,
      marginTop: 3,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 3,
    },
    projectLink: {
      fontSize: 7,
      color: accentColor,
      textDecoration: 'underline',
    },
  })

interface DoubleColumnTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function DoubleColumnTemplate({ data, settings }: DoubleColumnTemplateProps) {
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
          </View>
          {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
            <View style={styles.linkRow}>
              {personalInfo.linkedinUrl && <Link src={personalInfo.linkedinUrl} style={styles.link}>LinkedIn</Link>}
              {personalInfo.githubUrl && <Link src={personalInfo.githubUrl} style={styles.link}>GitHub</Link>}
              {personalInfo.portfolioUrl && <Link src={personalInfo.portfolioUrl} style={styles.link}>Portfolio</Link>}
            </View>
          )}
        </View>

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.summarySection}>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Two Columns */}
        <View style={styles.columns}>
          {/* Left Column */}
          <View style={styles.column}>
            {/* Experience */}
            {experience.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Experience</Text>
                {experience.map((exp) => (
                  <View key={exp.id} style={styles.itemContainer}>
                    <Text style={styles.itemTitle}>{exp.title}</Text>
                    <Text style={styles.itemSubtitle}>
                      {exp.companyName}{exp.location ? ` | ${exp.location}` : ''}
                    </Text>
                    <Text style={styles.itemDates}>
                      {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
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

            {/* Projects */}
            {projects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Projects</Text>
                {projects.map((project) => (
                  <View key={project.id} style={styles.projectItem}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <RichTextRenderer text={project.description} style={styles.projectDesc} />
                    {project.technologies && project.technologies.length > 0 && (
                      <Text style={styles.techLine}>{project.technologies.join(' | ')}</Text>
                    )}
                    {(project.projectUrl || project.sourceCodeUrl) && (
                      <View style={styles.projectLinks}>
                        {project.projectUrl && <Link src={project.projectUrl} style={styles.projectLink}>Demo</Link>}
                        {project.sourceCodeUrl && <Link src={project.sourceCodeUrl} style={styles.projectLink}>Code</Link>}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right Column */}
          <View style={styles.column}>
            {/* Education */}
            {education.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education</Text>
                {education.map((edu) => (
                  <View key={edu.id} style={styles.itemContainer}>
                    <Text style={styles.itemTitle}>{edu.degree}</Text>
                    <Text style={styles.itemSubtitle}>{edu.fieldOfStudy}</Text>
                    <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                    <Text style={styles.itemDates}>
                      {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                    </Text>
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
                {languages.map((lang) => (
                  <View key={lang.id} style={styles.languageItem}>
                    <Text style={styles.languageName}>{lang.name}</Text>
                    {lang.proficiency && (
                      <Text style={styles.languageLevel}>
                        {lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()}
                      </Text>
                    )}
                  </View>
                ))}
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
                      {cert.issuingOrganization}
                    </Text>
                    <Text style={styles.certDetails}>
                      {formatDate(cert.issueDate)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}
