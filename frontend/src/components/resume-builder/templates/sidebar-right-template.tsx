import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Sidebar Right template - Two-column with sidebar on the right
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      flexDirection: 'row',
      fontSize: 9,
      fontFamily: 'Helvetica',
    },
    main: {
      width: '65%',
      padding: 25,
      backgroundColor: '#ffffff',
      color: '#1f2937',
    },
    sidebar: {
      width: '35%',
      backgroundColor: '#f8fafc',
      padding: 20,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    header: {
      marginBottom: 15,
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
      marginBottom: 6,
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
    },
    mainSection: {
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 8,
      paddingBottom: 3,
      borderBottomWidth: 1,
      borderBottomColor: accentColor,
      textTransform: 'uppercase',
    },
    itemContainer: {
      marginBottom: 10,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      flex: 1,
    },
    itemDates: {
      fontSize: 8,
      color: accentColor,
    },
    itemSubtitle: {
      fontSize: 9,
      color: '#6b7280',
      marginTop: 1,
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
    sidebarSection: {
      marginBottom: 15,
    },
    sidebarTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    contactItem: {
      fontSize: 8,
      color: '#4b5563',
      marginBottom: 4,
    },
    linkItem: {
      fontSize: 8,
      color: accentColor,
      marginBottom: 4,
    },
    skillTag: {
      fontSize: 8,
      color: '#374151',
      backgroundColor: '#ffffff',
      paddingVertical: 3,
      paddingHorizontal: 8,
      marginBottom: 4,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    languageItem: {
      marginBottom: 6,
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
      marginBottom: 8,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    certOrg: {
      fontSize: 8,
      color: accentColor,
    },
    certDate: {
      fontSize: 7,
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
      gap: 8,
      marginTop: 3,
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
      textDecoration: 'underline',
    },
  })

interface SidebarRightTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function SidebarRightTemplate({ data, settings }: SidebarRightTemplateProps) {
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
        {/* Main Content */}
        <View style={styles.main}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.name}>
              {personalInfo.firstName} {personalInfo.lastName}
            </Text>
            {personalInfo.headline && (
              <Text style={styles.headline}>{personalInfo.headline}</Text>
            )}
            {personalInfo.summary && (
              <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
            )}
          </View>

          {/* Experience */}
          {experience.length > 0 && (
            <View style={styles.mainSection}>
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

          {/* Projects */}
          {projects.length > 0 && (
            <View style={styles.mainSection}>
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

        {/* Sidebar */}
        <View style={styles.sidebar}>
          {/* Contact */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarTitle}>Contact</Text>
            {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
            {personalInfo.phone && <Text style={styles.contactItem}>{personalInfo.phone}</Text>}
            {personalInfo.location && <Text style={styles.contactItem}>{personalInfo.location}</Text>}
            {personalInfo.linkedinUrl && <Link src={personalInfo.linkedinUrl} style={styles.linkItem}>LinkedIn</Link>}
            {personalInfo.githubUrl && <Link src={personalInfo.githubUrl} style={styles.linkItem}>GitHub</Link>}
            {personalInfo.portfolioUrl && <Link src={personalInfo.portfolioUrl} style={styles.linkItem}>Portfolio</Link>}
          </View>

          {/* Skills */}
          {skills.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Skills</Text>
              {skills.map((skill) => (
                <Text key={skill.id} style={styles.skillTag}>{skill.name}</Text>
              ))}
            </View>
          )}

          {/* Education */}
          {education.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Education</Text>
              {education.map((edu) => (
                <View key={edu.id} style={styles.itemContainer}>
                  <Text style={styles.itemTitle}>{edu.degree}</Text>
                  <Text style={styles.itemSubtitle}>{edu.fieldOfStudy}</Text>
                  <Text style={styles.itemDescription}>{edu.institution}</Text>
                  <Text style={styles.itemDates}>
                    {formatDate(edu.endDate || edu.startDate)}
                  </Text>
                  {edu.grade && <Text style={styles.itemDescription}>GPA: {edu.grade}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Languages */}
          {languages && languages.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Languages</Text>
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
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Certifications</Text>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.certItem}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                  <Text style={styles.certDate}>{formatDate(cert.issueDate)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}
