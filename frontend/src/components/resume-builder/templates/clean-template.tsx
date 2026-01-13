import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Clean template - Ultra-clean content-first design
// No borders, no boxes, only subtle thin line dividers
// Maximum content focus with spacious but efficient layout
const createStyles = (primaryColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 48,
      paddingBottom: 48,
      paddingHorizontal: 54,
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#1a1a1a',
      lineHeight: 1.4,
    },
    // Header - Clean and airy
    header: {
      marginBottom: 20,
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    headline: {
      fontSize: 11,
      color: '#4a4a4a',
      marginBottom: 12,
      letterSpacing: 0.3,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    contactText: {
      fontSize: 9,
      color: '#666666',
    },
    contactSeparator: {
      fontSize: 9,
      color: '#cccccc',
    },
    linkRow: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 8,
    },
    link: {
      fontSize: 9,
      color: primaryColor,
      textDecoration: 'none',
    },
    // Thin divider line
    divider: {
      height: 0.5,
      backgroundColor: '#e0e0e0',
      marginVertical: 16,
    },
    // Section styling
    section: {
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: primaryColor,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 10,
    },
    // Summary
    summaryText: {
      fontSize: 10,
      lineHeight: 1.6,
      color: '#333333',
    },
    // Experience items
    experienceItem: {
      marginBottom: 12,
    },
    experienceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    jobTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
      flex: 1,
      paddingRight: 12,
    },
    dates: {
      fontSize: 9,
      color: '#666666',
      flexShrink: 0,
    },
    companyLine: {
      fontSize: 10,
      color: '#4a4a4a',
      marginBottom: 6,
    },
    description: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#333333',
      marginBottom: 4,
    },
    achievementsList: {
      marginTop: 4,
    },
    achievementItem: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#333333',
      marginBottom: 3,
      paddingLeft: 12,
    },
    bulletPoint: {
      position: 'absolute',
      left: 0,
      fontSize: 9,
      color: '#999999',
    },
    achievementRow: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    bulletColumn: {
      width: 12,
      flexShrink: 0,
    },
    bulletText: {
      fontSize: 9,
      color: '#999999',
    },
    achievementContent: {
      flex: 1,
    },
    achievementText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#333333',
    },
    // Education items
    educationItem: {
      marginBottom: 10,
    },
    degree: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
      flex: 1,
      paddingRight: 10,
    },
    institution: {
      fontSize: 10,
      color: '#4a4a4a',
    },
    grade: {
      fontSize: 9,
      color: '#666666',
      marginTop: 2,
    },
    // Skills
    skillsContent: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    skillText: {
      fontSize: 9,
      color: '#333333',
      lineHeight: 1.8,
    },
    // Languages
    languageItem: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    languageName: {
      fontSize: 9,
      color: '#333333',
      width: 100,
    },
    languageLevel: {
      fontSize: 9,
      color: '#666666',
    },
    // Certifications
    certItem: {
      marginBottom: 8,
    },
    certName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
    },
    certDetails: {
      fontSize: 9,
      color: '#666666',
      marginTop: 1,
    },
    // Projects
    projectItem: {
      marginBottom: 12,
    },
    projectTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
      marginBottom: 4,
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#333333',
    },
    techLine: {
      fontSize: 8,
      color: '#666666',
      marginTop: 4,
      fontStyle: 'italic',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 14,
      marginTop: 4,
    },
    projectLink: {
      fontSize: 8,
      color: primaryColor,
      textDecoration: 'none',
    },
  })

interface CleanTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function CleanTemplate({ data, settings }: CleanTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Build contact parts
  const contactParts: string[] = []
  if (personalInfo.email) contactParts.push(personalInfo.email)
  if (personalInfo.phone) contactParts.push(personalInfo.phone)
  if (personalInfo.location) contactParts.push(personalInfo.location)

  const hasLinks = personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl

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
          {contactParts.length > 0 && (
            <View style={styles.contactRow}>
              {contactParts.map((part, index) => (
                <Text key={index} style={styles.contactText}>
                  {part}
                </Text>
              ))}
            </View>
          )}
          {hasLinks && (
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

        {/* Summary */}
        {personalInfo.summary && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
            </View>
          </>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Experience</Text>
              {experience.map((exp) => (
                <View key={exp.id} style={styles.experienceItem}>
                  <View style={styles.experienceHeader}>
                    <Text style={styles.jobTitle}>{exp.title}</Text>
                    <Text style={styles.dates}>
                      {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                    </Text>
                  </View>
                  <Text style={styles.companyLine}>
                    {exp.companyName}{exp.location ? ` / ${exp.location}` : ''}
                  </Text>
                  {exp.description && (
                    <RichTextRenderer text={exp.description} style={styles.description} />
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <View style={styles.achievementsList}>
                      {exp.achievements.map((achievement, idx) => (
                        <View key={idx} style={styles.achievementRow}>
                          <View style={styles.bulletColumn}>
                            <Text style={styles.bulletText}>-</Text>
                          </View>
                          <View style={styles.achievementContent}>
                            <Text style={styles.achievementText}>{achievement}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Education */}
        {education.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Education</Text>
              {education.map((edu) => (
                <View key={edu.id} style={styles.educationItem}>
                  <View style={styles.experienceHeader}>
                    <Text style={styles.degree}>{edu.degree} in {edu.fieldOfStudy}</Text>
                    <Text style={styles.dates}>
                      {formatDate(edu.endDate || edu.startDate)}
                    </Text>
                  </View>
                  <Text style={styles.institution}>{edu.institution}</Text>
                  {edu.grade && <Text style={styles.grade}>GPA: {edu.grade}</Text>}
                </View>
              ))}
            </View>
          </>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Skills</Text>
              <Text style={styles.skillText}>
                {skills.map((skill) => skill.name).join('  /  ')}
              </Text>
            </View>
          </>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <>
            <View style={styles.divider} />
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
          </>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Certifications</Text>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.certItem}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certDetails}>
                    {cert.issuingOrganization}, {formatDate(cert.issueDate)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Projects</Text>
              {projects.map((project) => (
                <View key={project.id} style={styles.projectItem}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <RichTextRenderer text={project.description} style={styles.projectDesc} />
                  {project.technologies && project.technologies.length > 0 && (
                    <Text style={styles.techLine}>{project.technologies.join(', ')}</Text>
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
          </>
        )}
      </Page>
    </Document>
  )
}
