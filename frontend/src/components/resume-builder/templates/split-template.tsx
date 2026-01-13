import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Split Template - Modern split header design
// Header split into two halves: left has name/headline, right has contact info
// Clean horizontal division with accent color bar between header and body
// Single column body content for maximum ATS compatibility

const createStyles = (primaryColor: string) =>
  StyleSheet.create({
    page: {
      flexDirection: 'column',
      fontSize: 9,
      fontFamily: 'Helvetica',
      backgroundColor: '#ffffff',
    },
    // Split Header
    header: {
      flexDirection: 'row',
      backgroundColor: '#1a1a2e',
    },
    headerLeft: {
      width: '55%',
      padding: 20,
      paddingVertical: 25,
      justifyContent: 'center',
    },
    headerRight: {
      width: '45%',
      padding: 20,
      paddingVertical: 25,
      backgroundColor: '#16213e',
      justifyContent: 'center',
    },
    name: {
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 4,
      letterSpacing: 1,
    },
    headline: {
      fontSize: 11,
      color: primaryColor,
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 0.5,
    },
    // Contact info on right side
    contactGrid: {
      gap: 6,
    },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    contactIcon: {
      fontSize: 8,
      color: primaryColor,
      width: 12,
    },
    contactText: {
      fontSize: 8,
      color: '#e0e0e0',
    },
    contactLink: {
      fontSize: 8,
      color: primaryColor,
      textDecoration: 'none',
    },
    // Accent bar between header and body
    accentBar: {
      height: 4,
      backgroundColor: primaryColor,
    },
    // Main body - single column
    body: {
      padding: 25,
      paddingTop: 20,
    },
    section: {
      marginBottom: 14,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e5e5',
      paddingBottom: 4,
    },
    sectionIcon: {
      fontSize: 10,
      color: primaryColor,
      marginRight: 6,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // Summary
    summary: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#333333',
    },
    // Experience
    experienceItem: {
      marginBottom: 10,
    },
    experienceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 2,
    },
    jobTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
      flex: 1,
      paddingRight: 10,
    },
    dates: {
      fontSize: 8,
      color: primaryColor,
      fontFamily: 'Helvetica-Bold',
      flexShrink: 0,
    },
    company: {
      fontSize: 9,
      color: '#555555',
      marginBottom: 4,
    },
    description: {
      fontSize: 8,
      lineHeight: 1.4,
      color: '#444444',
      marginBottom: 3,
    },
    bulletList: {
      marginLeft: 10,
    },
    bulletItem: {
      fontSize: 8,
      lineHeight: 1.35,
      color: '#444444',
      marginBottom: 2,
    },
    // Education
    educationItem: {
      marginBottom: 8,
    },
    degree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
      flex: 1,
      paddingRight: 10,
    },
    institution: {
      fontSize: 9,
      color: '#555555',
    },
    grade: {
      fontSize: 8,
      color: '#666666',
      marginTop: 2,
    },
    // Skills - inline display
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    skillTag: {
      backgroundColor: '#f3f4f6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 3,
      borderLeftWidth: 2,
      borderLeftColor: primaryColor,
    },
    skillText: {
      fontSize: 8,
      color: '#374151',
    },
    // Languages
    languagesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    languageName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
    },
    languageLevel: {
      fontSize: 8,
      color: '#666666',
    },
    // Certifications
    certItem: {
      marginBottom: 6,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
    },
    certDetails: {
      fontSize: 8,
      color: '#666666',
    },
    // Projects
    projectItem: {
      marginBottom: 8,
    },
    projectHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 2,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
    },
    projectDesc: {
      fontSize: 8,
      lineHeight: 1.4,
      color: '#444444',
      marginBottom: 3,
    },
    techText: {
      fontSize: 8,
      color: primaryColor,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 2,
    },
    projectLink: {
      fontSize: 8,
      color: primaryColor,
      textDecoration: 'underline',
    },
  })

interface SplitTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function SplitTemplate({ data, settings }: SplitTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const formatProficiency = (proficiency?: string) => {
    if (!proficiency) return ''
    const map: Record<string, string> = {
      BASIC: 'Basic',
      CONVERSATIONAL: 'Conversational',
      PROFESSIONAL: 'Professional',
      FLUENT: 'Fluent',
      NATIVE: 'Native',
    }
    return map[proficiency] || proficiency
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Split Header */}
        <View style={styles.header}>
          {/* Left side - Name and Headline */}
          <View style={styles.headerLeft}>
            <Text style={styles.name}>
              {personalInfo.firstName} {personalInfo.lastName}
            </Text>
            {personalInfo.headline && (
              <Text style={styles.headline}>{personalInfo.headline}</Text>
            )}
          </View>

          {/* Right side - Contact Info */}
          <View style={styles.headerRight}>
            <View style={styles.contactGrid}>
              {personalInfo.email && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>✉</Text>
                  <Text style={styles.contactText}>{personalInfo.email}</Text>
                </View>
              )}
              {personalInfo.phone && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>☎</Text>
                  <Text style={styles.contactText}>{personalInfo.phone}</Text>
                </View>
              )}
              {personalInfo.location && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>◎</Text>
                  <Text style={styles.contactText}>{personalInfo.location}</Text>
                </View>
              )}
              {personalInfo.linkedinUrl && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>in</Text>
                  <Link src={personalInfo.linkedinUrl} style={styles.contactLink}>
                    LinkedIn Profile
                  </Link>
                </View>
              )}
              {personalInfo.githubUrl && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>⌂</Text>
                  <Link src={personalInfo.githubUrl} style={styles.contactLink}>
                    GitHub
                  </Link>
                </View>
              )}
              {personalInfo.portfolioUrl && (
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>◈</Text>
                  <Link src={personalInfo.portfolioUrl} style={styles.contactLink}>
                    Portfolio
                  </Link>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Accent Color Bar */}
        <View style={styles.accentBar} />

        {/* Body Content - Single Column */}
        <View style={styles.body}>
          {/* Summary */}
          {personalInfo.summary && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>◆</Text>
                <Text style={styles.sectionTitle}>About</Text>
              </View>
              <RichTextRenderer text={personalInfo.summary} style={styles.summary} />
            </View>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>◆</Text>
                <Text style={styles.sectionTitle}>Experience</Text>
              </View>
              {experience.map((exp) => (
                <View key={exp.id} style={styles.experienceItem}>
                  <View style={styles.experienceHeader}>
                    <Text style={styles.jobTitle}>{exp.title}</Text>
                    <Text style={styles.dates}>
                      {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : exp.endDate ? formatDate(exp.endDate) : ''}
                    </Text>
                  </View>
                  <Text style={styles.company}>
                    {exp.companyName}{exp.location ? ` | ${exp.location}` : ''}
                  </Text>
                  {exp.description && (
                    <RichTextRenderer text={exp.description} style={styles.description} />
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
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>◆</Text>
                <Text style={styles.sectionTitle}>Education</Text>
              </View>
              {education.map((edu) => (
                <View key={edu.id} style={styles.educationItem}>
                  <View style={styles.experienceHeader}>
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

          {/* Skills */}
          {skills.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>◆</Text>
                <Text style={styles.sectionTitle}>Skills</Text>
              </View>
              <View style={styles.skillsContainer}>
                {skills.map((skill) => (
                  <View key={skill.id} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Languages */}
          {languages && languages.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>◆</Text>
                <Text style={styles.sectionTitle}>Languages</Text>
              </View>
              <View style={styles.languagesContainer}>
                {languages.map((lang) => (
                  <View key={lang.id} style={styles.languageItem}>
                    <Text style={styles.languageName}>{lang.name}</Text>
                    {lang.proficiency && (
                      <Text style={styles.languageLevel}>({formatProficiency(lang.proficiency)})</Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>◆</Text>
                <Text style={styles.sectionTitle}>Certifications</Text>
              </View>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.certItem}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certDetails}>
                    {cert.issuingOrganization} | {formatDate(cert.issueDate)}
                    {cert.credentialId ? ` | ID: ${cert.credentialId}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>◆</Text>
                <Text style={styles.sectionTitle}>Projects</Text>
              </View>
              {projects.map((project) => (
                <View key={project.id} style={styles.projectItem}>
                  <View style={styles.projectHeader}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                  </View>
                  <RichTextRenderer text={project.description} style={styles.projectDesc} />
                  {project.technologies && project.technologies.length > 0 && (
                    <Text style={styles.techText}>
                      Technologies: {project.technologies.join(', ')}
                    </Text>
                  )}
                  {(project.projectUrl || project.sourceCodeUrl) && (
                    <View style={styles.projectLinks}>
                      {project.projectUrl && (
                        <Link src={project.projectUrl} style={styles.projectLink}>
                          Live Demo
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
