import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Modular template - Grid-based modular design system with distinct blocks
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 20,
      paddingBottom: 20,
      paddingHorizontal: 20,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1f2937',
      backgroundColor: '#f8fafc',
    },
    // Grid container for modules
    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    // Header module - full width
    headerModule: {
      width: '100%',
      backgroundColor: '#ffffff',
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 6,
      borderBottomWidth: 3,
      borderBottomColor: accentColor,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    nameSection: {
      flex: 1,
    },
    name: {
      fontSize: 22,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
      marginBottom: 4,
    },
    headline: {
      fontSize: 11,
      color: accentColor,
      fontFamily: 'Helvetica-Bold',
    },
    contactModule: {
      backgroundColor: '#f1f5f9',
      padding: 10,
      borderRadius: 4,
      minWidth: 160,
    },
    contactItem: {
      fontSize: 8,
      color: '#475569',
      marginBottom: 3,
    },
    linksRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
    },
    link: {
      fontSize: 7,
      color: accentColor,
      textDecoration: 'none',
    },
    // Summary module - full width
    summaryModule: {
      width: '100%',
      backgroundColor: '#ffffff',
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 6,
      borderLeftWidth: 4,
      borderLeftColor: accentColor,
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.6,
      color: '#334155',
    },
    // Half-width modules
    halfModule: {
      width: '48.5%',
      backgroundColor: '#ffffff',
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 6,
    },
    // Full-width module
    fullModule: {
      width: '100%',
      backgroundColor: '#ffffff',
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 6,
    },
    // Module header with accent
    moduleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      paddingBottom: 8,
      borderBottomWidth: 2,
      borderBottomColor: accentColor,
    },
    moduleIcon: {
      width: 20,
      height: 20,
      backgroundColor: accentColor,
      borderRadius: 4,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    moduleIconText: {
      fontSize: 10,
      color: '#ffffff',
      fontFamily: 'Helvetica-Bold',
    },
    moduleTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // Experience/Education item card
    itemCard: {
      backgroundColor: '#f8fafc',
      padding: 10,
      marginBottom: 8,
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    itemCardLast: {
      marginBottom: 0,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
      flex: 1,
    },
    itemBadge: {
      backgroundColor: accentColor,
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 3,
    },
    itemBadgeText: {
      fontSize: 7,
      color: '#ffffff',
      fontFamily: 'Helvetica-Bold',
    },
    itemSubtitle: {
      fontSize: 9,
      color: '#64748b',
      marginBottom: 2,
    },
    itemDescription: {
      fontSize: 8,
      lineHeight: 1.5,
      color: '#475569',
      marginTop: 4,
    },
    bulletList: {
      marginTop: 6,
    },
    bulletItem: {
      fontSize: 8,
      lineHeight: 1.4,
      color: '#475569',
      marginBottom: 3,
      paddingLeft: 8,
    },
    // Skills grid within module
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    skillChip: {
      backgroundColor: '#f1f5f9',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    skillChipText: {
      fontSize: 8,
      color: '#334155',
    },
    // Languages module styling
    languageRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    languageRowLast: {
      borderBottomWidth: 0,
    },
    languageName: {
      fontSize: 9,
      color: '#0f172a',
      fontFamily: 'Helvetica-Bold',
    },
    languageBadge: {
      backgroundColor: accentColor,
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 10,
    },
    languageBadgeText: {
      fontSize: 7,
      color: '#ffffff',
    },
    // Certifications styling
    certCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: '#f1f5f9',
    },
    certCardLast: {
      borderBottomWidth: 0,
    },
    certDot: {
      width: 8,
      height: 8,
      backgroundColor: accentColor,
      borderRadius: 4,
      marginRight: 8,
    },
    certContent: {
      flex: 1,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
    },
    certDetails: {
      fontSize: 8,
      color: '#64748b',
    },
    // Projects styling
    projectCard: {
      backgroundColor: '#f8fafc',
      padding: 10,
      marginBottom: 8,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    projectCardLast: {
      marginBottom: 0,
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 6,
    },
    projectLink: {
      fontSize: 7,
      color: accentColor,
      textDecoration: 'underline',
    },
    projectDesc: {
      fontSize: 8,
      lineHeight: 1.5,
      color: '#475569',
    },
    techTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 6,
    },
    techTag: {
      backgroundColor: accentColor,
      paddingVertical: 2,
      paddingHorizontal: 5,
      borderRadius: 3,
    },
    techTagText: {
      fontSize: 7,
      color: '#ffffff',
    },
  })

interface ModularTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function ModularTemplate({ data, settings }: ModularTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Get icon letter for module headers
  const getIconLetter = (section: string) => {
    const icons: Record<string, string> = {
      experience: 'E',
      education: 'A',
      skills: 'S',
      languages: 'L',
      certifications: 'C',
      projects: 'P',
    }
    return icons[section] || section.charAt(0).toUpperCase()
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Module */}
        <View style={styles.headerModule}>
          <View style={styles.headerContent}>
            <View style={styles.nameSection}>
              <Text style={styles.name}>
                {personalInfo.firstName} {personalInfo.lastName}
              </Text>
              {personalInfo.headline && (
                <Text style={styles.headline}>{personalInfo.headline}</Text>
              )}
            </View>
            <View style={styles.contactModule}>
              {personalInfo.email && (
                <Text style={styles.contactItem}>{personalInfo.email}</Text>
              )}
              {personalInfo.phone && (
                <Text style={styles.contactItem}>{personalInfo.phone}</Text>
              )}
              {personalInfo.location && (
                <Text style={styles.contactItem}>{personalInfo.location}</Text>
              )}
              {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
                <View style={styles.linksRow}>
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
          </View>
        </View>

        {/* Summary Module */}
        {personalInfo.summary && (
          <View style={styles.summaryModule}>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Grid Container for Side-by-Side Modules */}
        <View style={styles.gridContainer}>
          {/* Skills Module - Half Width */}
          {skills.length > 0 && (
            <View style={styles.halfModule}>
              <View style={styles.moduleHeader}>
                <View style={styles.moduleIcon}>
                  <Text style={styles.moduleIconText}>{getIconLetter('skills')}</Text>
                </View>
                <Text style={styles.moduleTitle}>Skills</Text>
              </View>
              <View style={styles.skillsGrid}>
                {skills.map((skill) => (
                  <View key={skill.id} style={styles.skillChip}>
                    <Text style={styles.skillChipText}>{skill.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Languages Module - Half Width */}
          {languages && languages.length > 0 && (
            <View style={styles.halfModule}>
              <View style={styles.moduleHeader}>
                <View style={styles.moduleIcon}>
                  <Text style={styles.moduleIconText}>{getIconLetter('languages')}</Text>
                </View>
                <Text style={styles.moduleTitle}>Languages</Text>
              </View>
              {languages.map((lang, index) => (
                <View
                  key={lang.id}
                  style={[
                    styles.languageRow,
                    index === languages.length - 1 ? styles.languageRowLast : {},
                  ]}
                >
                  <Text style={styles.languageName}>{lang.name}</Text>
                  {lang.proficiency && (
                    <View style={styles.languageBadge}>
                      <Text style={styles.languageBadgeText}>
                        {lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Experience Module - Full Width */}
        {experience.length > 0 && (
          <View style={styles.fullModule}>
            <View style={styles.moduleHeader}>
              <View style={styles.moduleIcon}>
                <Text style={styles.moduleIconText}>{getIconLetter('experience')}</Text>
              </View>
              <Text style={styles.moduleTitle}>Experience</Text>
            </View>
            {experience.map((exp, index) => (
              <View
                key={exp.id}
                style={[
                  styles.itemCard,
                  index === experience.length - 1 ? styles.itemCardLast : {},
                ]}
              >
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{exp.title}</Text>
                  <View style={styles.itemBadge}>
                    <Text style={styles.itemBadgeText}>
                      {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemSubtitle}>
                  {exp.companyName}{exp.location ? ` • ${exp.location}` : ''}
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

        {/* Education Module - Full Width */}
        {education.length > 0 && (
          <View style={styles.fullModule}>
            <View style={styles.moduleHeader}>
              <View style={styles.moduleIcon}>
                <Text style={styles.moduleIconText}>{getIconLetter('education')}</Text>
              </View>
              <Text style={styles.moduleTitle}>Education</Text>
            </View>
            {education.map((edu, index) => (
              <View
                key={edu.id}
                style={[
                  styles.itemCard,
                  index === education.length - 1 ? styles.itemCardLast : {},
                ]}
              >
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                  <View style={styles.itemBadge}>
                    <Text style={styles.itemBadgeText}>
                      {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                {edu.grade && (
                  <Text style={styles.itemDescription}>GPA: {edu.grade}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Certifications Module - Half Width */}
        <View style={styles.gridContainer}>
          {certifications.length > 0 && (
            <View style={styles.halfModule}>
              <View style={styles.moduleHeader}>
                <View style={styles.moduleIcon}>
                  <Text style={styles.moduleIconText}>{getIconLetter('certifications')}</Text>
                </View>
                <Text style={styles.moduleTitle}>Certifications</Text>
              </View>
              {certifications.map((cert, index) => (
                <View
                  key={cert.id}
                  style={[
                    styles.certCard,
                    index === certifications.length - 1 ? styles.certCardLast : {},
                  ]}
                >
                  <View style={styles.certDot} />
                  <View style={styles.certContent}>
                    <Text style={styles.certName}>{cert.name}</Text>
                    <Text style={styles.certDetails}>
                      {cert.issuingOrganization} • {formatDate(cert.issueDate)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Projects Module - Full Width */}
        {projects.length > 0 && (
          <View style={styles.fullModule}>
            <View style={styles.moduleHeader}>
              <View style={styles.moduleIcon}>
                <Text style={styles.moduleIconText}>{getIconLetter('projects')}</Text>
              </View>
              <Text style={styles.moduleTitle}>Projects</Text>
            </View>
            {projects.map((project, index) => (
              <View
                key={project.id}
                style={[
                  styles.projectCard,
                  index === projects.length - 1 ? styles.projectCardLast : {},
                ]}
              >
                <View style={styles.projectHeader}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  {(project.projectUrl || project.sourceCodeUrl) && (
                    <View style={styles.projectLinks}>
                      {project.projectUrl && (
                        <Link src={project.projectUrl} style={styles.projectLink}>Demo</Link>
                      )}
                      {project.sourceCodeUrl && (
                        <Link src={project.sourceCodeUrl} style={styles.projectLink}>Code</Link>
                      )}
                    </View>
                  )}
                </View>
                <RichTextRenderer text={project.description} style={styles.projectDesc} />
                {project.technologies && project.technologies.length > 0 && (
                  <View style={styles.techTags}>
                    {project.technologies.map((tech, idx) => (
                      <View key={idx} style={styles.techTag}>
                        <Text style={styles.techTagText}>{tech}</Text>
                      </View>
                    ))}
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
