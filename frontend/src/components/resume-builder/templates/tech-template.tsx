import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Tech template - Developer/Engineer focused with prominent skills section
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 30,
      paddingBottom: 30,
      paddingHorizontal: 35,
      fontSize: 10,
      fontFamily: 'Courier',
      color: '#1e293b',
      backgroundColor: '#ffffff',
    },
    // Header - Terminal-like style
    header: {
      backgroundColor: '#0f172a',
      padding: 20,
      marginHorizontal: -35,
      marginTop: -30,
      marginBottom: 15,
    },
    terminalPrompt: {
      fontSize: 8,
      color: '#22c55e',
      fontFamily: 'Courier',
      marginBottom: 4,
    },
    name: {
      fontSize: 22,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 2,
    },
    headline: {
      fontSize: 11,
      color: accentColor,
      marginBottom: 8,
    },
    contactGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 15,
    },
    contactItem: {
      fontSize: 9,
      color: '#94a3b8',
    },
    linksRow: {
      flexDirection: 'row',
      gap: 15,
      marginTop: 8,
    },
    link: {
      fontSize: 9,
      color: accentColor,
      textDecoration: 'none',
    },
    linkIcon: {
      fontSize: 9,
      color: '#64748b',
    },
    // Skills section - Prominent at top
    skillsSection: {
      backgroundColor: '#f8fafc',
      padding: 12,
      marginBottom: 15,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    skillsSectionTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    skillTag: {
      backgroundColor: '#e2e8f0',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 2,
    },
    skillTagExpert: {
      backgroundColor: accentColor,
    },
    skillText: {
      fontSize: 8,
      fontFamily: 'Courier',
      color: '#334155',
    },
    skillTextExpert: {
      color: '#ffffff',
    },
    // Section
    section: {
      marginBottom: 14,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      paddingBottom: 4,
    },
    sectionIcon: {
      fontSize: 10,
      color: accentColor,
      marginRight: 6,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    // Summary
    summaryText: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.5,
      color: '#475569',
    },
    // Experience
    itemContainer: {
      marginBottom: 12,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    itemTitleContainer: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
    },
    itemCompany: {
      fontSize: 9,
      color: accentColor,
      marginTop: 1,
    },
    itemLocation: {
      fontSize: 8,
      color: '#64748b',
      marginTop: 1,
    },
    itemDates: {
      fontSize: 8,
      fontFamily: 'Courier',
      color: '#64748b',
      backgroundColor: '#f1f5f9',
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    itemDescription: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.4,
      color: '#475569',
      marginTop: 6,
    },
    bulletList: {
      marginTop: 4,
    },
    bulletItem: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.4,
      color: '#475569',
      marginBottom: 2,
    },
    bulletMarker: {
      color: accentColor,
    },
    // Education
    eduItem: {
      marginBottom: 8,
    },
    eduDegree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
    },
    eduInstitution: {
      fontSize: 9,
      color: '#475569',
    },
    eduMeta: {
      fontSize: 8,
      color: '#64748b',
      marginTop: 2,
    },
    // Languages
    languagesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    languageName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#334155',
    },
    languageLevel: {
      fontSize: 8,
      color: '#64748b',
      marginLeft: 4,
    },
    // Certifications
    certGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    certItem: {
      backgroundColor: '#f8fafc',
      padding: 8,
      borderRadius: 2,
      width: '48%',
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
    },
    certOrg: {
      fontSize: 8,
      color: accentColor,
      marginTop: 2,
    },
    certDate: {
      fontSize: 7,
      color: '#64748b',
      marginTop: 2,
    },
    // Projects - Highlight section for devs
    projectsSection: {
      backgroundColor: '#fafafa',
      padding: 12,
      marginHorizontal: -35,
      paddingHorizontal: 35,
    },
    projectItem: {
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    projectItemLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 8,
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
    },
    projectDesc: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.4,
      color: '#475569',
      marginTop: 4,
    },
    techStack: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 6,
    },
    techTag: {
      fontSize: 7,
      fontFamily: 'Courier',
      color: accentColor,
      backgroundColor: '#ffffff',
      paddingVertical: 2,
      paddingHorizontal: 5,
      borderWidth: 1,
      borderColor: accentColor,
      borderRadius: 2,
    },
  })

interface TechTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function TechTemplate({ data, settings }: TechTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Separate expert skills
  const expertSkills = skills.filter(s => s.level === 'EXPERT')
  const advancedSkills = skills.filter(s => s.level === 'ADVANCED')
  const otherSkills = skills.filter(s => s.level !== 'EXPERT' && s.level !== 'ADVANCED')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Terminal Style */}
        <View style={styles.header}>
          <Text style={styles.terminalPrompt}>$ whoami</Text>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          <View style={styles.contactGrid}>
            {personalInfo.email && (
              <Text style={styles.contactItem}>{personalInfo.email}</Text>
            )}
            {personalInfo.phone && (
              <Text style={styles.contactItem}>{personalInfo.phone}</Text>
            )}
            {personalInfo.location && (
              <Text style={styles.contactItem}>{personalInfo.location}</Text>
            )}
          </View>
          {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
            <View style={styles.linksRow}>
              {personalInfo.githubUrl && (
                <Link src={personalInfo.githubUrl} style={styles.link}>GitHub</Link>
              )}
              {personalInfo.linkedinUrl && (
                <Link src={personalInfo.linkedinUrl} style={styles.link}>LinkedIn</Link>
              )}
              {personalInfo.portfolioUrl && (
                <Link src={personalInfo.portfolioUrl} style={styles.link}>Portfolio</Link>
              )}
            </View>
          )}
        </View>

        {/* Skills - Prominent Section */}
        {skills.length > 0 && (
          <View style={styles.skillsSection}>
            <Text style={styles.skillsSectionTitle}>Tech Stack</Text>
            <View style={styles.skillsGrid}>
              {expertSkills.map((skill) => (
                <View key={skill.id} style={[styles.skillTag, styles.skillTagExpert]}>
                  <Text style={[styles.skillText, styles.skillTextExpert]}>{skill.name}</Text>
                </View>
              ))}
              {advancedSkills.map((skill) => (
                <View key={skill.id} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill.name}</Text>
                </View>
              ))}
              {otherSkills.map((skill) => (
                <View key={skill.id} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>//</Text>
              <Text style={styles.sectionTitle}>About</Text>
            </View>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>//</Text>
              <Text style={styles.sectionTitle}>Experience</Text>
            </View>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleContainer}>
                    <Text style={styles.itemTitle}>{exp.title}</Text>
                    <Text style={styles.itemCompany}>{exp.companyName}</Text>
                    {exp.location && <Text style={styles.itemLocation}>{exp.location}</Text>}
                  </View>
                  <Text style={styles.itemDates}>
                    {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                  </Text>
                </View>
                {exp.description && (
                  <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={styles.bulletList}>
                    {exp.achievements.map((achievement, idx) => (
                      <Text key={idx} style={styles.bulletItem}>
                        <Text style={styles.bulletMarker}>→ </Text>{achievement}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Projects - Highlighted */}
        {projects.length > 0 && (
          <View style={styles.projectsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>//</Text>
              <Text style={styles.sectionTitle}>Projects</Text>
            </View>
            {projects.map((project, index) => (
              <View
                key={project.id}
                style={[
                  styles.projectItem,
                  index === projects.length - 1 && styles.projectItemLast,
                ]}
              >
                <View style={styles.projectHeader}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  {(project.projectUrl || project.sourceCodeUrl) && (
                    <View style={styles.projectLinks}>
                      {project.sourceCodeUrl && (
                        <Link src={project.sourceCodeUrl} style={styles.projectLink}>[code]</Link>
                      )}
                      {project.projectUrl && (
                        <Link src={project.projectUrl} style={styles.projectLink}>[demo]</Link>
                      )}
                    </View>
                  )}
                </View>
                <RichTextRenderer text={project.description} style={styles.projectDesc} />
                {project.technologies && project.technologies.length > 0 && (
                  <View style={styles.techStack}>
                    {project.technologies.map((tech, idx) => (
                      <Text key={idx} style={styles.techTag}>{tech}</Text>
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
              <Text style={styles.sectionIcon}>//</Text>
              <Text style={styles.sectionTitle}>Education</Text>
            </View>
            {education.map((edu) => (
              <View key={edu.id} style={styles.eduItem}>
                <Text style={styles.eduDegree}>{edu.degree} in {edu.fieldOfStudy}</Text>
                <Text style={styles.eduInstitution}>{edu.institution}</Text>
                <Text style={styles.eduMeta}>
                  {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                  {edu.grade ? ` | GPA: ${edu.grade}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>//</Text>
              <Text style={styles.sectionTitle}>Languages</Text>
            </View>
            <View style={styles.languagesGrid}>
              {languages.map((lang) => (
                <View key={lang.id} style={styles.languageItem}>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  {lang.proficiency && (
                    <Text style={styles.languageLevel}>
                      ({lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()})
                    </Text>
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
              <Text style={styles.sectionIcon}>//</Text>
              <Text style={styles.sectionTitle}>Certifications</Text>
            </View>
            <View style={styles.certGrid}>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.certItem}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                  <Text style={styles.certDate}>{formatDate(cert.issueDate)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  )
}
