import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Boxed template - Each section in distinct boxes
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 25,
      paddingBottom: 25,
      paddingHorizontal: 30,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1f2937',
      backgroundColor: '#f9fafb',
    },
    headerBox: {
      backgroundColor: '#ffffff',
      padding: 15,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 4,
    },
    name: {
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 3,
    },
    headline: {
      fontSize: 10,
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
    sectionBox: {
      backgroundColor: '#ffffff',
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 4,
    },
    sectionTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#374151',
    },
    itemContainer: {
      marginBottom: 10,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
    },
    itemContainerLast: {
      marginBottom: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      flex: 1,
    },
    itemDates: {
      fontSize: 8,
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 3,
    },
    itemSubtitle: {
      fontSize: 9,
      color: '#4b5563',
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
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    skillTag: {
      fontSize: 8,
      color: '#374151',
      backgroundColor: '#f3f4f6',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
    },
    languageName: {
      fontSize: 9,
      color: '#111827',
    },
    languageLevel: {
      fontSize: 8,
      color: accentColor,
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
      marginBottom: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#f3f4f6',
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
      gap: 8,
      marginTop: 3,
    },
    projectLink: {
      fontSize: 7,
      color: accentColor,
      textDecoration: 'underline',
    },
  })

interface BoxedTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function BoxedTemplate({ data, settings }: BoxedTemplateProps) {
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
        {/* Header Box */}
        <View style={styles.headerBox}>
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

        {/* Summary Box */}
        {personalInfo.summary && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience Box */}
        {experience.length > 0 && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Work Experience</Text>
            {experience.map((exp, index) => (
              <View key={exp.id} style={index === experience.length - 1 ? [styles.itemContainer, styles.itemContainerLast] : styles.itemContainer}>
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

        {/* Education Box */}
        {education.length > 0 && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu, index) => (
              <View key={edu.id} style={index === education.length - 1 ? [styles.itemContainer, styles.itemContainerLast] : styles.itemContainer}>
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

        {/* Skills Box */}
        {skills.length > 0 && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsGrid}>
              {skills.map((skill) => (
                <Text key={skill.id} style={styles.skillTag}>{skill.name}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Languages Box */}
        {languages && languages.length > 0 && (
          <View style={styles.sectionBox}>
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

        {/* Certifications Box */}
        {certifications.length > 0 && (
          <View style={styles.sectionBox}>
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

        {/* Projects Box */}
        {projects.length > 0 && (
          <View style={styles.sectionBox}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((project, index) => (
              <View key={project.id} style={index === projects.length - 1 ? [styles.projectItem, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }] : styles.projectItem}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <RichTextRenderer text={project.description} style={styles.projectDesc} />
                {project.technologies && project.technologies.length > 0 && (
                  <Text style={styles.techLine}>{project.technologies.join(' | ')}</Text>
                )}
                {(project.projectUrl || project.sourceCodeUrl) && (
                  <View style={styles.projectLinks}>
                    {project.projectUrl && <Link src={project.projectUrl} style={styles.projectLink}>View</Link>}
                    {project.sourceCodeUrl && <Link src={project.sourceCodeUrl} style={styles.projectLink}>Code</Link>}
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
