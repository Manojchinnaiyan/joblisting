import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Card-based template with modern UI aesthetic
// Features: Rounded corners, subtle backgrounds, drop shadows, clean spacing
const createStyles = (primaryColor: string) =>
  StyleSheet.create({
    page: {
      padding: 30,
      fontSize: 9,
      fontFamily: 'Helvetica',
      backgroundColor: '#f8fafc',
    },
    // Header card - full width with primary color accent
    headerCard: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 20,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: primaryColor,
      // Shadow simulation with border
      borderBottomWidth: 2,
      borderBottomColor: '#e2e8f0',
      borderRightWidth: 1,
      borderRightColor: '#e2e8f0',
    },
    name: {
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
      color: '#1e293b',
      marginBottom: 4,
    },
    headline: {
      fontSize: 11,
      color: primaryColor,
      marginBottom: 10,
      fontFamily: 'Helvetica-Bold',
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    contactIcon: {
      fontSize: 8,
      color: primaryColor,
    },
    contactText: {
      fontSize: 8,
      color: '#475569',
    },
    link: {
      fontSize: 8,
      color: primaryColor,
      textDecoration: 'none',
    },
    // Summary card
    summaryCard: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderBottomWidth: 2,
      borderBottomColor: '#e2e8f0',
      borderRightWidth: 1,
      borderRightColor: '#e2e8f0',
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#334155',
    },
    // Section container
    sectionContainer: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: primaryColor,
      marginBottom: 10,
      paddingLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // Individual item cards (for experience, education, projects)
    itemCard: {
      backgroundColor: '#ffffff',
      borderRadius: 6,
      padding: 14,
      marginBottom: 8,
      borderBottomWidth: 2,
      borderBottomColor: '#e2e8f0',
      borderRightWidth: 1,
      borderRightColor: '#e2e8f0',
    },
    itemCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1e293b',
      flex: 1,
      paddingRight: 8,
    },
    itemDates: {
      fontSize: 8,
      color: '#ffffff',
      backgroundColor: primaryColor,
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 4,
    },
    itemSubtitle: {
      fontSize: 9,
      color: '#64748b',
      marginBottom: 6,
    },
    itemDescription: {
      fontSize: 8,
      lineHeight: 1.4,
      color: '#475569',
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
      width: 12,
      fontSize: 8,
      color: primaryColor,
    },
    bulletText: {
      flex: 1,
      fontSize: 8,
      lineHeight: 1.3,
      color: '#475569',
    },
    // Skills card - grid layout
    skillsCard: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 14,
      marginBottom: 12,
      borderBottomWidth: 2,
      borderBottomColor: '#e2e8f0',
      borderRightWidth: 1,
      borderRightColor: '#e2e8f0',
    },
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    skillChip: {
      backgroundColor: '#f1f5f9',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    skillText: {
      fontSize: 8,
      color: '#334155',
    },
    // Languages card
    languagesCard: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      padding: 14,
      marginBottom: 12,
      borderBottomWidth: 2,
      borderBottomColor: '#e2e8f0',
      borderRightWidth: 1,
      borderRightColor: '#e2e8f0',
    },
    languageRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    languageChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: primaryColor,
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      gap: 4,
    },
    languageName: {
      fontSize: 8,
      color: '#ffffff',
      fontFamily: 'Helvetica-Bold',
    },
    languageLevel: {
      fontSize: 7,
      color: 'rgba(255, 255, 255, 0.85)',
    },
    // Certifications card
    certCard: {
      backgroundColor: '#ffffff',
      borderRadius: 6,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderBottomWidth: 2,
      borderBottomColor: '#e2e8f0',
      borderRightWidth: 1,
      borderRightColor: '#e2e8f0',
    },
    certBadge: {
      width: 36,
      height: 36,
      backgroundColor: primaryColor,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    certBadgeText: {
      fontSize: 12,
      color: '#ffffff',
      fontFamily: 'Helvetica-Bold',
    },
    certInfo: {
      flex: 1,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1e293b',
      marginBottom: 2,
    },
    certOrg: {
      fontSize: 8,
      color: '#64748b',
    },
    certDate: {
      fontSize: 7,
      color: '#94a3b8',
      marginTop: 2,
    },
    // Project card
    projectTech: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 6,
    },
    techTag: {
      backgroundColor: '#f0fdf4',
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#bbf7d0',
    },
    techTagText: {
      fontSize: 7,
      color: '#15803d',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 6,
    },
    projectLink: {
      fontSize: 8,
      color: primaryColor,
      textDecoration: 'underline',
    },
    // Two column layout for skills and certifications
    twoColumnRow: {
      flexDirection: 'row',
      gap: 12,
    },
    columnHalf: {
      flex: 1,
    },
  })

interface CardTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function CardTemplate({ data, settings }: CardTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const formatProficiency = (proficiency?: string) => {
    if (!proficiency) return ''
    return proficiency.charAt(0) + proficiency.slice(1).toLowerCase()
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          <View style={styles.contactRow}>
            {personalInfo.email && (
              <View style={styles.contactItem}>
                <Text style={styles.contactIcon}>@</Text>
                <Text style={styles.contactText}>{personalInfo.email}</Text>
              </View>
            )}
            {personalInfo.phone && (
              <View style={styles.contactItem}>
                <Text style={styles.contactIcon}>T</Text>
                <Text style={styles.contactText}>{personalInfo.phone}</Text>
              </View>
            )}
            {personalInfo.location && (
              <View style={styles.contactItem}>
                <Text style={styles.contactIcon}>L</Text>
                <Text style={styles.contactText}>{personalInfo.location}</Text>
              </View>
            )}
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
        </View>

        {/* Summary Card */}
        {personalInfo.summary && (
          <View style={styles.summaryCard}>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience Section */}
        {experience.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.itemCard}>
                <View style={styles.itemCardHeader}>
                  <Text style={styles.itemTitle}>{exp.title}</Text>
                  <Text style={styles.itemDates}>
                    {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : exp.endDate ? formatDate(exp.endDate) : ''}
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
                      <View key={idx} style={styles.bulletItem}>
                        <Text style={styles.bulletPoint}>+</Text>
                        <Text style={styles.bulletText}>{achievement}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education Section */}
        {education.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.itemCard}>
                <View style={styles.itemCardHeader}>
                  <Text style={styles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                  <Text style={styles.itemDates}>
                    {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : edu.endDate ? formatDate(edu.endDate) : ''}
                  </Text>
                </View>
                <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                {edu.grade && (
                  <Text style={styles.itemDescription}>GPA: {edu.grade}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Skills and Languages Row */}
        {(skills.length > 0 || (languages && languages.length > 0)) && (
          <View style={styles.twoColumnRow}>
            {/* Skills Card */}
            {skills.length > 0 && (
              <View style={[styles.skillsCard, styles.columnHalf]}>
                <Text style={styles.sectionTitle}>Skills</Text>
                <View style={styles.skillsGrid}>
                  {skills.map((skill) => (
                    <View key={skill.id} style={styles.skillChip}>
                      <Text style={styles.skillText}>{skill.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Languages Card */}
            {languages && languages.length > 0 && (
              <View style={[styles.languagesCard, styles.columnHalf]}>
                <Text style={styles.sectionTitle}>Languages</Text>
                <View style={styles.languageRow}>
                  {languages.map((lang) => (
                    <View key={lang.id} style={styles.languageChip}>
                      <Text style={styles.languageName}>{lang.name}</Text>
                      {lang.proficiency && (
                        <Text style={styles.languageLevel}>({formatProficiency(lang.proficiency)})</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Certifications Section */}
        {certifications.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certCard}>
                <View style={styles.certBadge}>
                  <Text style={styles.certBadgeText}>{cert.name.charAt(0)}</Text>
                </View>
                <View style={styles.certInfo}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                  {cert.issueDate && (
                    <Text style={styles.certDate}>Issued {formatDate(cert.issueDate)}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Projects Section */}
        {projects.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((project) => (
              <View key={project.id} style={styles.itemCard}>
                <Text style={styles.itemTitle}>{project.title}</Text>
                <RichTextRenderer text={project.description} style={styles.itemDescription} />
                {project.technologies && project.technologies.length > 0 && (
                  <View style={styles.projectTech}>
                    {project.technologies.map((tech, idx) => (
                      <View key={idx} style={styles.techTag}>
                        <Text style={styles.techTagText}>{tech}</Text>
                      </View>
                    ))}
                  </View>
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
      </Page>
    </Document>
  )
}
