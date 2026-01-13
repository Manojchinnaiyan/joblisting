import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Martinez template - Michael Martinez design
// Timeline-style resume with clean centered header, horizontal divider,
// timeline dots/circles on the left, prominent date ranges, ATS-friendly
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 35,
      paddingBottom: 35,
      paddingHorizontal: 45,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1f2937',
    },
    // Header - centered with name and title
    header: {
      marginBottom: 15,
      textAlign: 'center',
    },
    name: {
      fontSize: 26,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 4,
      letterSpacing: 1,
    },
    title: {
      fontSize: 12,
      color: '#4b5563',
      marginBottom: 10,
      letterSpacing: 0.5,
    },
    // Horizontal divider under header
    headerDivider: {
      height: 2,
      backgroundColor: accentColor,
      marginBottom: 12,
    },
    // Contact info row
    contactRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 4,
    },
    contactItem: {
      fontSize: 9,
      color: '#4b5563',
    },
    contactDivider: {
      fontSize: 9,
      color: '#d1d5db',
    },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 15,
      marginTop: 4,
    },
    link: {
      fontSize: 9,
      color: accentColor,
      textDecoration: 'none',
    },
    // Section styles
    section: {
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 10,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // Summary
    summaryText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#374151',
      textAlign: 'justify',
    },
    // Timeline container - main wrapper for timeline items
    timelineWrapper: {
      paddingLeft: 20,
    },
    // Timeline item with dot
    timelineItem: {
      flexDirection: 'row',
      marginBottom: 12,
      position: 'relative',
    },
    // Timeline dot - positioned on the left
    timelineDotContainer: {
      position: 'absolute',
      left: -20,
      top: 2,
      width: 12,
      height: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    timelineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: accentColor,
    },
    timelineDotOutline: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: accentColor,
      backgroundColor: '#ffffff',
    },
    // Timeline line connecting dots
    timelineLineContainer: {
      position: 'absolute',
      left: -15,
      top: 14,
      bottom: -12,
      width: 2,
    },
    timelineLine: {
      flex: 1,
      backgroundColor: '#e5e7eb',
    },
    // Content area
    timelineContent: {
      flex: 1,
    },
    // Date range - displayed prominently
    dateRange: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginBottom: 3,
    },
    // Item title (job title or degree)
    itemTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 2,
    },
    // Item subtitle (company or institution)
    itemSubtitle: {
      fontSize: 9,
      color: '#4b5563',
      marginBottom: 2,
    },
    // Location
    itemLocation: {
      fontSize: 8,
      color: '#6b7280',
      marginBottom: 4,
    },
    // Description text
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 3,
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
    bullet: {
      color: accentColor,
    },
    // Skills section - horizontal layout
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillPill: {
      backgroundColor: '#f3f4f6',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: accentColor,
    },
    skillText: {
      fontSize: 8,
      color: '#374151',
    },
    // Languages section
    languageRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 15,
    },
    languageItem: {
      fontSize: 9,
      color: '#374151',
    },
    languageLevel: {
      fontSize: 8,
      color: '#6b7280',
    },
    // Certifications
    certItem: {
      marginBottom: 8,
    },
    certName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    certOrg: {
      fontSize: 9,
      color: accentColor,
      marginTop: 1,
    },
    certDate: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 1,
    },
    certCredential: {
      fontSize: 8,
      color: '#6b7280',
    },
    // Projects
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
    techStack: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
    },
    techBadge: {
      fontSize: 7,
      color: accentColor,
      backgroundColor: '#f3f4f6',
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 3,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
      textDecoration: 'underline',
    },
    // Education without timeline - simple list
    educationItem: {
      marginBottom: 8,
    },
    eduDegree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    eduInstitution: {
      fontSize: 9,
      color: accentColor,
      marginTop: 1,
    },
    eduDetails: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 1,
    },
  })

interface MartinezTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function MartinezTemplate({ data, settings }: MartinezTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const formatDateRange = (startDate: string, endDate?: string, isCurrent?: boolean) => {
    const start = formatDate(startDate)
    const end = isCurrent ? 'Present' : formatDate(endDate || '')
    return `${start} - ${end}`
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Centered name and title */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.title}>{personalInfo.headline}</Text>
          )}
          <View style={styles.headerDivider} />
          <View style={styles.contactRow}>
            {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
            {personalInfo.email && personalInfo.phone && <Text style={styles.contactDivider}>|</Text>}
            {personalInfo.phone && <Text style={styles.contactItem}>{personalInfo.phone}</Text>}
            {personalInfo.phone && personalInfo.location && <Text style={styles.contactDivider}>|</Text>}
            {personalInfo.location && <Text style={styles.contactItem}>{personalInfo.location}</Text>}
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

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience with Timeline */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            <View style={styles.timelineWrapper}>
              {experience.map((exp, index) => (
                <View key={exp.id} style={styles.timelineItem}>
                  {/* Timeline dot */}
                  <View style={styles.timelineDotContainer}>
                    <View style={index === 0 ? styles.timelineDot : styles.timelineDotOutline} />
                  </View>
                  {/* Timeline line (not on last item) */}
                  {index < experience.length - 1 && (
                    <View style={styles.timelineLineContainer}>
                      <View style={styles.timelineLine} />
                    </View>
                  )}
                  {/* Content */}
                  <View style={styles.timelineContent}>
                    <Text style={styles.dateRange}>
                      {formatDateRange(exp.startDate, exp.endDate, exp.isCurrent)}
                    </Text>
                    <Text style={styles.itemTitle}>{exp.title}</Text>
                    <Text style={styles.itemSubtitle}>{exp.companyName}</Text>
                    {exp.location && <Text style={styles.itemLocation}>{exp.location}</Text>}
                    {exp.description && (
                      <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <View style={styles.bulletList}>
                        {exp.achievements.map((achievement, idx) => (
                          <Text key={idx} style={styles.bulletItem}>
                            <Text style={styles.bullet}>• </Text>{achievement}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.educationItem}>
                <Text style={styles.eduDegree}>
                  {edu.degree} in {edu.fieldOfStudy}
                </Text>
                <Text style={styles.eduInstitution}>{edu.institution}</Text>
                <Text style={styles.eduDetails}>
                  {formatDateRange(edu.startDate, edu.endDate, edu.isCurrent)}
                  {edu.grade ? ` | GPA: ${edu.grade}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {skills.map((skill) => (
                <View key={skill.id} style={styles.skillPill}>
                  <Text style={styles.skillText}>{skill.name}</Text>
                </View>
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
                  {lang.name}
                  {lang.proficiency && (
                    <Text style={styles.languageLevel}>
                      {' '}({lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()})
                    </Text>
                  )}
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
                <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                <Text style={styles.certDate}>
                  Issued {formatDate(cert.issueDate)}
                  {cert.expiryDate ? ` | Expires ${formatDate(cert.expiryDate)}` : ''}
                </Text>
                {cert.credentialId && (
                  <Text style={styles.certCredential}>Credential ID: {cert.credentialId}</Text>
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
                  <View style={styles.techStack}>
                    {project.technologies.map((tech, idx) => (
                      <Text key={idx} style={styles.techBadge}>{tech}</Text>
                    ))}
                  </View>
                )}
                {(project.projectUrl || project.sourceCodeUrl) && (
                  <View style={styles.projectLinks}>
                    {project.projectUrl && (
                      <Link src={project.projectUrl} style={styles.projectLink}>Live Demo</Link>
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
      </Page>
    </Document>
  )
}
