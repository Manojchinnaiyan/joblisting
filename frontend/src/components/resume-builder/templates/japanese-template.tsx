import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Japanese minimalist template - Zen-inspired design
// Features: Ma (negative space), asymmetric balance, clean horizontal lines
// Peaceful, refined aesthetic with very sparing accent color use

const createStyles = (primaryColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 60,
      paddingBottom: 60,
      paddingLeft: 50,
      paddingRight: 70, // Asymmetric margins for visual interest
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1a1a1a',
      lineHeight: 1.6,
      backgroundColor: '#fefefe',
    },
    // Header with asymmetric layout - name aligned left, contact right
    header: {
      marginBottom: 45,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    nameBlock: {
      flex: 1,
    },
    name: {
      fontSize: 22,
      fontFamily: 'Helvetica',
      fontWeight: 300,
      color: '#1a1a1a',
      letterSpacing: 3,
      marginBottom: 6,
    },
    headline: {
      fontSize: 9,
      color: '#666666',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    contactBlock: {
      alignItems: 'flex-end',
    },
    contactText: {
      fontSize: 8,
      color: '#666666',
      marginBottom: 3,
      letterSpacing: 0.5,
    },
    link: {
      fontSize: 8,
      color: '#666666',
      textDecoration: 'none',
      marginBottom: 3,
    },
    // Minimal horizontal divider - very thin, subtle
    divider: {
      height: 0.5,
      backgroundColor: '#e0e0e0',
      marginBottom: 35,
    },
    // Accent divider - used only once for emphasis
    accentDivider: {
      height: 0.5,
      width: 30,
      backgroundColor: primaryColor,
      marginBottom: 35,
    },
    // Summary with generous breathing room
    summarySection: {
      marginBottom: 40,
      paddingLeft: 20, // Asymmetric indent
    },
    summaryText: {
      fontSize: 9,
      color: '#444444',
      lineHeight: 1.8,
      maxWidth: '85%', // Leave space on right for "ma"
    },
    // Main content area
    section: {
      marginBottom: 35,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 18,
    },
    sectionTitle: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      color: '#999999',
      letterSpacing: 2.5,
      textTransform: 'uppercase',
    },
    sectionLine: {
      flex: 1,
      height: 0.5,
      backgroundColor: '#e8e8e8',
      marginLeft: 15,
    },
    // Experience items with generous spacing
    experienceItem: {
      marginBottom: 25,
      paddingLeft: 20, // Asymmetric indent
    },
    expHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 4,
    },
    jobTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      letterSpacing: 0.3,
    },
    dates: {
      fontSize: 8,
      color: '#888888',
      letterSpacing: 0.5,
    },
    company: {
      fontSize: 9,
      color: '#555555',
      marginBottom: 8,
    },
    description: {
      fontSize: 9,
      color: '#444444',
      lineHeight: 1.7,
      maxWidth: '90%',
      marginBottom: 6,
    },
    achievementsList: {
      marginTop: 6,
    },
    achievementItem: {
      flexDirection: 'row',
      marginBottom: 4,
      maxWidth: '90%',
    },
    achievementBullet: {
      fontSize: 9,
      color: primaryColor,
      marginRight: 10,
      marginTop: 0,
    },
    achievementText: {
      fontSize: 9,
      color: '#444444',
      lineHeight: 1.6,
      flex: 1,
    },
    // Education with clean layout
    educationItem: {
      marginBottom: 18,
      paddingLeft: 20,
    },
    degree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      marginBottom: 3,
    },
    institution: {
      fontSize: 9,
      color: '#555555',
      marginBottom: 2,
    },
    grade: {
      fontSize: 8,
      color: '#777777',
    },
    // Skills - horizontal flow with generous spacing
    skillsContainer: {
      paddingLeft: 20,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 0,
    },
    skillItem: {
      fontSize: 9,
      color: '#444444',
      marginRight: 25,
      marginBottom: 8,
      letterSpacing: 0.3,
    },
    // Languages
    languagesContainer: {
      paddingLeft: 20,
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    languageItem: {
      fontSize: 9,
      color: '#444444',
      marginRight: 30,
      marginBottom: 6,
    },
    // Certifications
    certItem: {
      marginBottom: 12,
      paddingLeft: 20,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      marginBottom: 2,
    },
    certDetails: {
      fontSize: 8,
      color: '#666666',
    },
    // Projects
    projectItem: {
      marginBottom: 20,
      paddingLeft: 20,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      marginBottom: 5,
    },
    projectDesc: {
      fontSize: 9,
      color: '#444444',
      lineHeight: 1.7,
      maxWidth: '88%',
      marginBottom: 5,
    },
    techContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 4,
    },
    techItem: {
      fontSize: 8,
      color: '#777777',
      marginRight: 15,
      letterSpacing: 0.3,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 6,
    },
    projectLink: {
      fontSize: 8,
      color: primaryColor,
      textDecoration: 'none',
    },
    // Footer accent - single accent line at bottom
    footerAccent: {
      position: 'absolute',
      bottom: 40,
      left: 50,
      width: 20,
      height: 0.5,
      backgroundColor: primaryColor,
    },
  })

interface JapaneseTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function JapaneseTemplate({ data, settings }: JapaneseTemplateProps) {
  const { personalInfo, experience, education, skills, certifications, projects } = data
  const styles = createStyles(settings.primaryColor)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Asymmetric layout */}
        <View style={styles.header}>
          <View style={styles.nameBlock}>
            <Text style={styles.name}>
              {personalInfo.firstName} {personalInfo.lastName}
            </Text>
            {personalInfo.headline && (
              <Text style={styles.headline}>{personalInfo.headline}</Text>
            )}
          </View>
          <View style={styles.contactBlock}>
            {personalInfo.email && (
              <Text style={styles.contactText}>{personalInfo.email}</Text>
            )}
            {personalInfo.phone && (
              <Text style={styles.contactText}>{personalInfo.phone}</Text>
            )}
            {personalInfo.location && (
              <Text style={styles.contactText}>{personalInfo.location}</Text>
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

        {/* Single accent divider - minimal use of color */}
        <View style={styles.accentDivider} />

        {/* Summary with breathing room */}
        {personalInfo.summary && (
          <View style={styles.summarySection}>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Experience</Text>
              <View style={styles.sectionLine} />
            </View>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.experienceItem}>
                <View style={styles.expHeader}>
                  <Text style={styles.jobTitle}>{exp.title}</Text>
                  <Text style={styles.dates}>
                    {formatDate(exp.startDate)} — {exp.isCurrent ? 'Present' : exp.endDate ? formatDate(exp.endDate) : ''}
                  </Text>
                </View>
                <Text style={styles.company}>
                  {exp.companyName}{exp.location ? ` · ${exp.location}` : ''}
                </Text>
                {exp.description && (
                  <RichTextRenderer text={exp.description} style={styles.description} />
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={styles.achievementsList}>
                    {exp.achievements.map((achievement, idx) => (
                      <View key={idx} style={styles.achievementItem}>
                        <Text style={styles.achievementBullet}>—</Text>
                        <Text style={styles.achievementText}>{achievement}</Text>
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
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Education</Text>
              <View style={styles.sectionLine} />
            </View>
            {education.map((edu) => (
              <View key={edu.id} style={styles.educationItem}>
                <View style={styles.expHeader}>
                  <Text style={styles.degree}>{edu.degree} in {edu.fieldOfStudy}</Text>
                  <Text style={styles.dates}>
                    {formatDate(edu.startDate)} — {edu.isCurrent ? 'Present' : edu.endDate ? formatDate(edu.endDate) : ''}
                  </Text>
                </View>
                <Text style={styles.institution}>{edu.institution}</Text>
                {edu.grade && <Text style={styles.grade}>GPA {edu.grade}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Skills - minimal, horizontal layout */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Skills</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.skillsContainer}>
              {skills.map((skill) => (
                <Text key={skill.id} style={styles.skillItem}>{skill.name}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Languages</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.languagesContainer}>
              {data.languages.map((lang) => (
                <Text key={lang.id} style={styles.languageItem}>{lang.name}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Certifications</Text>
              <View style={styles.sectionLine} />
            </View>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certItem}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certDetails}>
                  {cert.issuingOrganization} · {formatDate(cert.issueDate)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Projects</Text>
              <View style={styles.sectionLine} />
            </View>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <RichTextRenderer text={project.description} style={styles.projectDesc} />
                {project.technologies && project.technologies.length > 0 && (
                  <View style={styles.techContainer}>
                    {project.technologies.map((tech, idx) => (
                      <Text key={idx} style={styles.techItem}>{tech}</Text>
                    ))}
                  </View>
                )}
                {(project.projectUrl || project.sourceCodeUrl) && (
                  <View style={styles.projectLinks}>
                    {project.projectUrl && (
                      <Link src={project.projectUrl} style={styles.projectLink}>View</Link>
                    )}
                    {project.sourceCodeUrl && (
                      <Link src={project.sourceCodeUrl} style={styles.projectLink}>Source</Link>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Footer accent - subtle color accent at bottom */}
        <View style={styles.footerAccent} />
      </Page>
    </Document>
  )
}
