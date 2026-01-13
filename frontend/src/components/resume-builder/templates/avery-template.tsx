import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Avery Rodriguez template - Two-column layout with 65/35 split
// Left main column: summary, experience, education
// Right sidebar: projects, skills, achievements, certifications, languages
// Modern styling, ATS-friendly, clean professional design
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      flexDirection: 'column',
      fontSize: 9,
      fontFamily: 'Helvetica',
      backgroundColor: '#ffffff',
    },
    // Header Section - spans full width
    header: {
      paddingHorizontal: 30,
      paddingTop: 30,
      paddingBottom: 20,
      borderBottomWidth: 3,
      borderBottomColor: accentColor,
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    headline: {
      fontSize: 12,
      color: accentColor,
      marginBottom: 10,
      fontFamily: 'Helvetica',
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 15,
    },
    contactItem: {
      fontSize: 9,
      color: '#4b5563',
    },
    contactLink: {
      fontSize: 9,
      color: accentColor,
      textDecoration: 'none',
    },
    // Main Content Area - two columns
    contentArea: {
      flexDirection: 'row',
      flex: 1,
    },
    // Left main column (65%)
    mainColumn: {
      width: '65%',
      paddingLeft: 30,
      paddingRight: 15,
      paddingTop: 20,
      paddingBottom: 30,
    },
    // Right sidebar (35%)
    sidebar: {
      width: '35%',
      backgroundColor: '#f8fafc',
      paddingLeft: 15,
      paddingRight: 20,
      paddingTop: 20,
      paddingBottom: 30,
      borderLeftWidth: 1,
      borderLeftColor: '#e5e7eb',
    },
    // Section styling for main column
    mainSection: {
      marginBottom: 16,
    },
    mainSectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 10,
      paddingBottom: 4,
      borderBottomWidth: 2,
      borderBottomColor: accentColor,
    },
    // Summary section
    summaryText: {
      fontSize: 9,
      lineHeight: 1.6,
      color: '#374151',
    },
    // Experience section
    experienceItem: {
      marginBottom: 12,
    },
    experienceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 2,
    },
    experienceTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      flex: 1,
    },
    experienceDates: {
      fontSize: 8,
      color: accentColor,
      fontFamily: 'Helvetica-Bold',
    },
    experienceCompany: {
      fontSize: 10,
      color: '#4b5563',
      marginBottom: 4,
    },
    experienceDescription: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
      marginBottom: 4,
    },
    bulletList: {
      marginTop: 4,
    },
    bulletItem: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    bulletPoint: {
      fontSize: 9,
      color: accentColor,
      marginRight: 6,
      fontFamily: 'Helvetica-Bold',
    },
    bulletText: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#374151',
      flex: 1,
    },
    // Education section
    educationItem: {
      marginBottom: 10,
    },
    educationDegree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    educationField: {
      fontSize: 9,
      color: '#4b5563',
    },
    educationInstitution: {
      fontSize: 9,
      color: '#6b7280',
    },
    educationDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    educationGrade: {
      fontSize: 8,
      color: '#6b7280',
    },
    educationDate: {
      fontSize: 8,
      color: accentColor,
    },
    // Sidebar section styling
    sidebarSection: {
      marginBottom: 18,
    },
    sidebarSectionTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 10,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: '#d1d5db',
    },
    // Projects in sidebar
    projectItem: {
      marginBottom: 12,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 3,
    },
    projectDescription: {
      fontSize: 8,
      lineHeight: 1.4,
      color: '#4b5563',
      marginBottom: 4,
    },
    projectTech: {
      fontSize: 7,
      color: accentColor,
      marginBottom: 3,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 8,
    },
    projectLink: {
      fontSize: 7,
      color: accentColor,
      textDecoration: 'underline',
    },
    // Skills
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
    },
    skillTag: {
      fontSize: 8,
      color: '#374151',
      backgroundColor: '#ffffff',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: '#d1d5db',
    },
    // Languages
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
    // Certifications
    certItem: {
      marginBottom: 10,
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
    // Achievements highlight box
    achievementBox: {
      backgroundColor: '#ffffff',
      padding: 10,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: accentColor,
      marginBottom: 12,
    },
    achievementTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginBottom: 6,
    },
    achievementItem: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    achievementBullet: {
      fontSize: 8,
      color: accentColor,
      marginRight: 4,
    },
    achievementText: {
      fontSize: 8,
      color: '#374151',
      flex: 1,
      lineHeight: 1.3,
    },
  })

interface AveryTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function AveryTemplate({ data, settings }: AveryTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Collect top achievements from all experiences for the sidebar highlight
  const topAchievements = experience
    .flatMap((exp) => exp.achievements || [])
    .slice(0, 4)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Full Width */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          <View style={styles.contactRow}>
            {personalInfo.email && (
              <Text style={styles.contactItem}>{personalInfo.email}</Text>
            )}
            {personalInfo.phone && (
              <Text style={styles.contactItem}>{personalInfo.phone}</Text>
            )}
            {personalInfo.location && (
              <Text style={styles.contactItem}>{personalInfo.location}</Text>
            )}
            {personalInfo.linkedinUrl && (
              <Link src={personalInfo.linkedinUrl} style={styles.contactLink}>
                LinkedIn
              </Link>
            )}
            {personalInfo.githubUrl && (
              <Link src={personalInfo.githubUrl} style={styles.contactLink}>
                GitHub
              </Link>
            )}
            {personalInfo.portfolioUrl && (
              <Link src={personalInfo.portfolioUrl} style={styles.contactLink}>
                Portfolio
              </Link>
            )}
          </View>
        </View>

        {/* Two Column Content Area */}
        <View style={styles.contentArea}>
          {/* Left Main Column (65%) */}
          <View style={styles.mainColumn}>
            {/* Summary */}
            {personalInfo.summary && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>Summary</Text>
                <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
              </View>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>Experience</Text>
                {experience.map((exp) => (
                  <View key={exp.id} style={styles.experienceItem}>
                    <View style={styles.experienceHeader}>
                      <Text style={styles.experienceTitle}>{exp.title}</Text>
                      <Text style={styles.experienceDates}>
                        {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                      </Text>
                    </View>
                    <Text style={styles.experienceCompany}>
                      {exp.companyName}{exp.location ? ` | ${exp.location}` : ''}
                    </Text>
                    {exp.description && (
                      <RichTextRenderer text={exp.description} style={styles.experienceDescription} />
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <View style={styles.bulletList}>
                        {exp.achievements.map((achievement, idx) => (
                          <View key={idx} style={styles.bulletItem}>
                            <Text style={styles.bulletPoint}>•</Text>
                            <Text style={styles.bulletText}>{achievement}</Text>
                          </View>
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
                <Text style={styles.mainSectionTitle}>Education</Text>
                {education.map((edu) => (
                  <View key={edu.id} style={styles.educationItem}>
                    <Text style={styles.educationDegree}>{edu.degree}</Text>
                    <Text style={styles.educationField}>{edu.fieldOfStudy}</Text>
                    <Text style={styles.educationInstitution}>{edu.institution}</Text>
                    <View style={styles.educationDetails}>
                      {edu.grade && <Text style={styles.educationGrade}>GPA: {edu.grade}</Text>}
                      <Text style={styles.educationDate}>
                        {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                      </Text>
                    </View>
                    {edu.description && (
                      <RichTextRenderer text={edu.description} style={styles.experienceDescription} />
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right Sidebar (35%) */}
          <View style={styles.sidebar}>
            {/* Key Achievements Highlight */}
            {topAchievements.length > 0 && (
              <View style={styles.sidebarSection}>
                <View style={styles.achievementBox}>
                  <Text style={styles.achievementTitle}>Key Achievements</Text>
                  {topAchievements.map((achievement, idx) => (
                    <View key={idx} style={styles.achievementItem}>
                      <Text style={styles.achievementBullet}>★</Text>
                      <Text style={styles.achievementText}>{achievement}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarSectionTitle}>Projects</Text>
                {projects.map((project) => (
                  <View key={project.id} style={styles.projectItem}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <RichTextRenderer text={project.description} style={styles.projectDescription} />
                    {project.technologies && project.technologies.length > 0 && (
                      <Text style={styles.projectTech}>{project.technologies.join(' • ')}</Text>
                    )}
                    {(project.projectUrl || project.sourceCodeUrl) && (
                      <View style={styles.projectLinks}>
                        {project.projectUrl && (
                          <Link src={project.projectUrl} style={styles.projectLink}>
                            Demo
                          </Link>
                        )}
                        {project.sourceCodeUrl && (
                          <Link src={project.sourceCodeUrl} style={styles.projectLink}>
                            Code
                          </Link>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarSectionTitle}>Skills</Text>
                <View style={styles.skillsContainer}>
                  {skills.map((skill) => (
                    <Text key={skill.id} style={styles.skillTag}>
                      {skill.name}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Languages */}
            {languages && languages.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarSectionTitle}>Languages</Text>
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
                <Text style={styles.sidebarSectionTitle}>Certifications</Text>
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
        </View>
      </Page>
    </Document>
  )
}
