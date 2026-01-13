import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Wright template - Professional corporate two-column design inspired by "Johnatan Wright"
// Dark navy sidebar on left (30%) with white text, main content area on right (70%)
// Name and headline in sidebar, contact/skills/certifications in sidebar
// Experience and education in main content area
// ATS-friendly with clean, professional corporate styling

const createStyles = (primaryColor: string) =>
  StyleSheet.create({
    page: {
      flexDirection: 'row',
      fontSize: 9,
      fontFamily: 'Helvetica',
    },
    // Left sidebar - 30% width with primary color background
    sidebar: {
      width: '30%',
      backgroundColor: primaryColor,
      padding: 20,
      paddingTop: 30,
      color: '#ffffff',
    },
    // Main content area - 70% width
    main: {
      width: '70%',
      padding: 25,
      paddingTop: 30,
      backgroundColor: '#ffffff',
      color: '#1f2937',
    },
    // Sidebar name styling - prominent display
    sidebarName: {
      fontSize: 16,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 4,
      lineHeight: 1.2,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    sidebarHeadline: {
      fontSize: 9,
      color: 'rgba(255, 255, 255, 0.9)',
      marginBottom: 20,
      lineHeight: 1.4,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.25)',
    },
    // Sidebar section styling
    sidebarSection: {
      marginBottom: 18,
    },
    sidebarTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 10,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.3)',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // Contact info styling
    contactItem: {
      fontSize: 8,
      color: 'rgba(255, 255, 255, 0.95)',
      marginBottom: 6,
      lineHeight: 1.4,
    },
    contactLink: {
      fontSize: 8,
      color: '#ffffff',
      marginBottom: 6,
      textDecoration: 'none',
    },
    // Skills styling - pill style for professional look
    skillItem: {
      fontSize: 8,
      color: '#ffffff',
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      paddingVertical: 4,
      paddingHorizontal: 8,
      marginBottom: 4,
      borderRadius: 3,
    },
    // Languages styling
    languageItem: {
      marginBottom: 8,
    },
    languageName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
    },
    languageLevel: {
      fontSize: 8,
      color: 'rgba(255, 255, 255, 0.75)',
      marginTop: 1,
    },
    // Certifications styling
    certItem: {
      marginBottom: 10,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      lineHeight: 1.3,
    },
    certOrg: {
      fontSize: 8,
      color: 'rgba(255, 255, 255, 0.85)',
      marginTop: 2,
    },
    certDate: {
      fontSize: 7,
      color: 'rgba(255, 255, 255, 0.65)',
      marginTop: 1,
    },
    // Main content section styling
    mainSection: {
      marginBottom: 18,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: primaryColor,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingBottom: 6,
      borderBottomWidth: 2,
      borderBottomColor: primaryColor,
    },
    // Summary styling
    summarySection: {
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    summaryTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: primaryColor,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
    },
    // Experience item styling
    itemContainer: {
      marginBottom: 14,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
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
      color: primaryColor,
      textAlign: 'right',
      fontFamily: 'Helvetica-Bold',
    },
    itemSubtitle: {
      fontSize: 9,
      color: '#6b7280',
      marginBottom: 4,
    },
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 4,
    },
    // Bullet list for achievements
    bulletList: {
      marginTop: 4,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginBottom: 2,
      paddingLeft: 8,
    },
    // Education item styling
    educationItem: {
      marginBottom: 12,
    },
    eduDegree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    eduField: {
      fontSize: 9,
      color: '#374151',
      marginTop: 1,
    },
    eduInstitution: {
      fontSize: 9,
      color: '#6b7280',
      marginTop: 1,
    },
    eduDate: {
      fontSize: 8,
      color: primaryColor,
      marginTop: 2,
    },
    eduGrade: {
      fontSize: 8,
      color: '#4b5563',
      marginTop: 2,
    },
    // Projects styling
    projectItem: {
      marginBottom: 12,
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
      color: primaryColor,
      marginTop: 4,
      fontStyle: 'italic',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    projectLink: {
      fontSize: 8,
      color: primaryColor,
      textDecoration: 'underline',
    },
  })

interface WrightTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function WrightTemplate({ data, settings }: WrightTemplateProps) {
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
        {/* Left Sidebar - Dark navy with white text */}
        <View style={styles.sidebar}>
          {/* Name prominently displayed in sidebar */}
          <Text style={styles.sidebarName}>
            {personalInfo.firstName}
          </Text>
          <Text style={styles.sidebarName}>
            {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.sidebarHeadline}>{personalInfo.headline}</Text>
          )}

          {/* Contact Information */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarTitle}>Contact</Text>
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
            {personalInfo.websiteUrl && (
              <Link src={personalInfo.websiteUrl} style={styles.contactLink}>
                Website
              </Link>
            )}
          </View>

          {/* Skills Section */}
          {skills.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>Skills</Text>
              {skills.map((skill) => (
                <Text key={skill.id} style={styles.skillItem}>
                  {skill.name}
                </Text>
              ))}
            </View>
          )}

          {/* Languages Section */}
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

          {/* Certifications Section */}
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

        {/* Main Content Area - Right side */}
        <View style={styles.main}>
          {/* Professional Summary */}
          {personalInfo.summary && (
            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Professional Summary</Text>
              <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
            </View>
          )}

          {/* Experience Section */}
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
                    {exp.companyName}
                    {exp.location ? ` | ${exp.location}` : ''}
                  </Text>
                  {exp.description && (
                    <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <View style={styles.bulletList}>
                      {exp.achievements.map((achievement, idx) => (
                        <Text key={idx} style={styles.bulletItem}>
                          * {achievement}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Education Section */}
          {education.length > 0 && (
            <View style={styles.mainSection}>
              <Text style={styles.sectionTitle}>Education</Text>
              {education.map((edu) => (
                <View key={edu.id} style={styles.educationItem}>
                  <Text style={styles.eduDegree}>{edu.degree}</Text>
                  <Text style={styles.eduField}>{edu.fieldOfStudy}</Text>
                  <Text style={styles.eduInstitution}>{edu.institution}</Text>
                  <Text style={styles.eduDate}>
                    {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                  </Text>
                  {edu.grade && <Text style={styles.eduGrade}>GPA: {edu.grade}</Text>}
                  {edu.description && (
                    <RichTextRenderer text={edu.description} style={styles.itemDescription} />
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Projects Section */}
          {projects.length > 0 && (
            <View style={styles.mainSection}>
              <Text style={styles.sectionTitle}>Projects</Text>
              {projects.map((project) => (
                <View key={project.id} style={styles.projectItem}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <RichTextRenderer text={project.description} style={styles.projectDesc} />
                  {project.technologies && project.technologies.length > 0 && (
                    <Text style={styles.techLine}>
                      Technologies: {project.technologies.join(' | ')}
                    </Text>
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
                          Source Code
                        </Link>
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
