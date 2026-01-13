import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Gradient Header template - Bold header gradient effect
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 0,
      paddingBottom: 30,
      paddingHorizontal: 0,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1f2937',
    },
    headerWrapper: {
      backgroundColor: accentColor,
      paddingTop: 25,
      paddingBottom: 20,
      paddingHorizontal: 35,
      marginBottom: 15,
    },
    headerContent: {
      borderLeftWidth: 3,
      borderLeftColor: '#ffffff',
      paddingLeft: 15,
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 4,
    },
    headline: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
      marginBottom: 10,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 15,
    },
    contactItem: {
      fontSize: 9,
      color: 'rgba(255,255,255,0.85)',
    },
    linkRow: {
      flexDirection: 'row',
      gap: 15,
      marginTop: 8,
    },
    link: {
      fontSize: 9,
      color: '#ffffff',
      textDecoration: 'underline',
    },
    content: {
      paddingHorizontal: 35,
    },
    section: {
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#374151',
    },
    itemContainer: {
      marginBottom: 10,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    itemTitleWrap: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    itemCompany: {
      fontSize: 9,
      color: '#6b7280',
      marginTop: 1,
    },
    itemDates: {
      fontSize: 8,
      color: accentColor,
      fontFamily: 'Helvetica-Bold',
    },
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.4,
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
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    skillTag: {
      fontSize: 8,
      color: '#ffffff',
      backgroundColor: accentColor,
      paddingVertical: 3,
      paddingHorizontal: 10,
      borderRadius: 3,
    },
    languageRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 15,
    },
    languageItem: {
      fontSize: 9,
      color: '#374151',
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
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 3,
    },
    techLine: {
      fontSize: 8,
      color: accentColor,
      marginTop: 3,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 3,
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
      textDecoration: 'underline',
    },
  })

interface GradientTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function GradientTemplate({ data, settings }: GradientTemplateProps) {
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
        <View style={styles.headerWrapper}>
          <View style={styles.headerContent}>
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
        </View>

        <View style={styles.content}>
          {/* Summary */}
          {personalInfo.summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile</Text>
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
                    <View style={styles.itemTitleWrap}>
                      <Text style={styles.itemTitle}>{exp.title}</Text>
                      <Text style={styles.itemCompany}>
                        {exp.companyName}{exp.location ? ` | ${exp.location}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.itemDates}>
                      {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                    </Text>
                  </View>
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
                    <View style={styles.itemTitleWrap}>
                      <Text style={styles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                      <Text style={styles.itemCompany}>{edu.institution}</Text>
                    </View>
                    <Text style={styles.itemDates}>
                      {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                    </Text>
                  </View>
                  {edu.grade && <Text style={styles.itemDescription}>GPA: {edu.grade}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skills</Text>
              <View style={styles.skillsGrid}>
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
      </Page>
    </Document>
  )
}
