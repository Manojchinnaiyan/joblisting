import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Modern two-column template
// Note: Two-column layouts may not be fully ATS compatible
// Use Professional or Minimal template for maximum ATS compatibility
const createStyles = (primaryColor: string) =>
  StyleSheet.create({
    page: {
      flexDirection: 'row',
      fontSize: 9,
      fontFamily: 'Helvetica',
    },
    sidebar: {
      width: '30%',
      backgroundColor: primaryColor,
      padding: 15,
      paddingTop: 20,
      color: '#ffffff',
    },
    main: {
      width: '70%',
      padding: 20,
      backgroundColor: '#ffffff',
    },
    name: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 2,
    },
    headline: {
      fontSize: 9,
      color: 'rgba(255,255,255,0.9)',
      marginBottom: 12,
    },
    sidebarSection: {
      marginBottom: 12,
    },
    sidebarTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 6,
      paddingBottom: 2,
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(255,255,255,0.4)',
      textTransform: 'uppercase',
    },
    contactItemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 4,
    },
    contactIcon: {
      fontSize: 8,
      color: 'rgba(255,255,255,0.8)',
    },
    contactText: {
      fontSize: 8,
      color: 'rgba(255,255,255,0.95)',
    },
    link: {
      color: '#ffffff',
      textDecoration: 'underline',
      fontSize: 8,
    },
    skillItem: {
      fontSize: 8,
      color: '#ffffff',
      marginBottom: 2,
    },
    mainSection: {
      marginBottom: 10,
      width: '100%',
    },
    mainTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
      marginBottom: 6,
      paddingBottom: 2,
      borderBottomWidth: 1,
      borderBottomColor: primaryColor,
      textTransform: 'uppercase',
    },
    summary: {
      fontSize: 9,
      lineHeight: 1.3,
      color: '#333333',
      width: '100%',
    },
    experienceItem: {
      marginBottom: 8,
      width: '100%',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 1,
      width: '100%',
    },
    jobTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
      flex: 1,
      flexWrap: 'wrap',
      paddingRight: 8,
    },
    dates: {
      fontSize: 8,
      color: primaryColor,
      fontFamily: 'Helvetica-Bold',
      flexShrink: 0,
    },
    company: {
      fontSize: 8,
      color: '#444444',
      marginBottom: 2,
      width: '100%',
    },
    description: {
      fontSize: 8,
      lineHeight: 1.25,
      color: '#333333',
      marginBottom: 2,
      width: '100%',
    },
    bulletList: {
      marginLeft: 8,
      width: '100%',
    },
    bulletItem: {
      fontSize: 8,
      lineHeight: 1.25,
      color: '#333333',
      marginBottom: 1,
      width: '100%',
    },
    educationItem: {
      marginBottom: 6,
      width: '100%',
    },
    degree: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
      flex: 1,
      flexWrap: 'wrap',
      paddingRight: 8,
    },
    institution: {
      fontSize: 8,
      color: '#444444',
      width: '100%',
    },
    grade: {
      fontSize: 8,
      color: '#666666',
      width: '100%',
    },
    certItem: {
      marginBottom: 4,
      width: '100%',
    },
    certName: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      width: '100%',
    },
    certOrg: {
      fontSize: 7,
      color: 'rgba(255,255,255,0.85)',
      width: '100%',
    },
    projectItem: {
      marginBottom: 6,
      width: '100%',
    },
    projectTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
      width: '100%',
    },
    projectDesc: {
      fontSize: 8,
      lineHeight: 1.25,
      color: '#333333',
      marginBottom: 2,
      width: '100%',
    },
    techText: {
      fontSize: 8,
      color: primaryColor,
      width: '100%',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 2,
    },
    projectLink: {
      fontSize: 8,
      color: primaryColor,
      textDecoration: 'underline',
    },
  })

interface ModernTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function ModernTemplate({ data, settings }: ModernTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && <Text style={styles.headline}>{personalInfo.headline}</Text>}

          {/* Contact */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarTitle}>Contact</Text>
            {personalInfo.email && (
              <View style={styles.contactItemRow}>
                <Text style={styles.contactIcon}>✉</Text>
                <Text style={styles.contactText}>{personalInfo.email}</Text>
              </View>
            )}
            {personalInfo.phone && (
              <View style={styles.contactItemRow}>
                <Text style={styles.contactIcon}>☎</Text>
                <Text style={styles.contactText}>{personalInfo.phone}</Text>
              </View>
            )}
            {personalInfo.location && (
              <View style={styles.contactItemRow}>
                <Text style={styles.contactIcon}>📍</Text>
                <Text style={styles.contactText}>{personalInfo.location}</Text>
              </View>
            )}
            {personalInfo.linkedinUrl && (
              <View style={styles.contactItemRow}>
                <Text style={styles.contactIcon}>in</Text>
                <Link src={personalInfo.linkedinUrl} style={styles.link}>LinkedIn</Link>
              </View>
            )}
            {personalInfo.githubUrl && (
              <View style={styles.contactItemRow}>
                <Text style={styles.contactIcon}>⌂</Text>
                <Link src={personalInfo.githubUrl} style={styles.link}>GitHub</Link>
              </View>
            )}
            {personalInfo.portfolioUrl && (
              <View style={styles.contactItemRow}>
                <Text style={styles.contactIcon}>🌐</Text>
                <Link src={personalInfo.portfolioUrl} style={styles.link}>Portfolio</Link>
              </View>
            )}
          </View>

          {/* Skills in sidebar */}
          {skills.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Skills</Text>
              {skills.map((skill) => (
                <Text key={skill.id} style={styles.skillItem}>• {skill.name}</Text>
              ))}
            </View>
          )}

          {/* Certifications in sidebar */}
          {certifications.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Certifications</Text>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.certItem}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.main}>
          {/* Summary */}
          {personalInfo.summary && (
            <View style={styles.mainSection}>
              <Text style={styles.mainTitle}>About</Text>
              <RichTextRenderer text={personalInfo.summary} style={styles.summary} />
            </View>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <View style={styles.mainSection}>
              <Text style={styles.mainTitle}>Experience</Text>
              {experience.map((exp) => (
                <View key={exp.id} style={styles.experienceItem}>
                  <View style={styles.row}>
                    <Text style={styles.jobTitle}>{exp.title}</Text>
                    <Text style={styles.dates}>
                      {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : exp.endDate ? formatDate(exp.endDate) : ''}
                    </Text>
                  </View>
                  <Text style={styles.company}>
                    {exp.companyName}{exp.location ? `, ${exp.location}` : ''}
                  </Text>
                  {exp.description && <RichTextRenderer text={exp.description} style={styles.description} />}
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
            <View style={styles.mainSection}>
              <Text style={styles.mainTitle}>Education</Text>
              {education.map((edu) => (
                <View key={edu.id} style={styles.educationItem}>
                  <View style={styles.row}>
                    <Text style={styles.degree}>{edu.degree} in {edu.fieldOfStudy}</Text>
                    <Text style={styles.dates}>
                      {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : edu.endDate ? formatDate(edu.endDate) : ''}
                    </Text>
                  </View>
                  <Text style={styles.institution}>{edu.institution}</Text>
                  {edu.grade && <Text style={styles.grade}>GPA: {edu.grade}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <View style={styles.mainSection}>
              <Text style={styles.mainTitle}>Projects</Text>
              {projects.map((project) => (
                <View key={project.id} style={styles.projectItem}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <RichTextRenderer text={project.description} style={styles.projectDesc} />
                  {project.technologies && project.technologies.length > 0 && (
                    <Text style={styles.techText}>
                      Tech: {project.technologies.join(', ')}
                    </Text>
                  )}
                  {(project.projectUrl || project.sourceCodeUrl) && (
                    <View style={styles.projectLinks}>
                      {project.projectUrl && (
                        <Link src={project.projectUrl} style={styles.projectLink}>View Project</Link>
                      )}
                      {project.sourceCodeUrl && (
                        <Link src={project.sourceCodeUrl} style={styles.projectLink}>Source Code</Link>
                      )}
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
