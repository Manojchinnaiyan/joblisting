import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Infographic template - Visual skill bars and icons
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 30,
      paddingBottom: 30,
      paddingHorizontal: 35,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1f2937',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 15,
      paddingBottom: 15,
      borderBottomWidth: 2,
      borderBottomColor: accentColor,
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      width: 160,
    },
    name: {
      fontSize: 22,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 3,
    },
    headline: {
      fontSize: 11,
      color: accentColor,
      marginBottom: 8,
    },
    contactItem: {
      fontSize: 8,
      color: '#4b5563',
      marginBottom: 2,
    },
    linkRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 6,
    },
    link: {
      fontSize: 8,
      color: accentColor,
    },
    twoColumn: {
      flexDirection: 'row',
      gap: 20,
    },
    leftColumn: {
      flex: 2,
    },
    rightColumn: {
      flex: 1,
    },
    section: {
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#374151',
    },
    itemContainer: {
      marginBottom: 10,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      flex: 1,
    },
    itemDates: {
      fontSize: 8,
      color: '#6b7280',
    },
    itemSubtitle: {
      fontSize: 9,
      color: accentColor,
      marginTop: 1,
    },
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 4,
    },
    bulletList: {
      marginTop: 4,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginBottom: 2,
    },
    skillItem: {
      marginBottom: 8,
    },
    skillName: {
      fontSize: 9,
      color: '#111827',
      marginBottom: 3,
    },
    skillBarBg: {
      height: 6,
      backgroundColor: '#e5e7eb',
      borderRadius: 3,
    },
    skillBar: {
      height: 6,
      backgroundColor: accentColor,
      borderRadius: 3,
    },
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
    certItem: {
      marginBottom: 6,
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderLeftColor: accentColor,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    certDetails: {
      fontSize: 8,
      color: '#6b7280',
    },
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
    techRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 4,
    },
    techTag: {
      fontSize: 7,
      color: accentColor,
      backgroundColor: '#f3f4f6',
      paddingVertical: 2,
      paddingHorizontal: 5,
      borderRadius: 2,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 3,
    },
    projectLink: {
      fontSize: 7,
      color: accentColor,
      textDecoration: 'underline',
    },
  })

interface InfographicTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function InfographicTemplate({ data, settings }: InfographicTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const getSkillWidth = (level?: string) => {
    switch (level) {
      case 'EXPERT': return '100%'
      case 'ADVANCED': return '85%'
      case 'INTERMEDIATE': return '65%'
      case 'BEGINNER': return '40%'
      default: return '75%'
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.name}>
              {personalInfo.firstName} {personalInfo.lastName}
            </Text>
            {personalInfo.headline && (
              <Text style={styles.headline}>{personalInfo.headline}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
            {personalInfo.phone && <Text style={styles.contactItem}>{personalInfo.phone}</Text>}
            {personalInfo.location && <Text style={styles.contactItem}>{personalInfo.location}</Text>}
            {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
              <View style={styles.linkRow}>
                {personalInfo.linkedinUrl && <Link src={personalInfo.linkedinUrl} style={styles.link}>in</Link>}
                {personalInfo.githubUrl && <Link src={personalInfo.githubUrl} style={styles.link}>gh</Link>}
                {personalInfo.portfolioUrl && <Link src={personalInfo.portfolioUrl} style={styles.link}>web</Link>}
              </View>
            )}
          </View>
        </View>

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About Me</Text>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Two Column Layout */}
        <View style={styles.twoColumn}>
          <View style={styles.leftColumn}>
            {/* Experience */}
            {experience.length > 0 && (
              <View style={styles.section}>
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
                      {exp.companyName}{exp.location ? ` | ${exp.location}` : ''}
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

            {/* Projects */}
            {projects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Projects</Text>
                {projects.map((project) => (
                  <View key={project.id} style={styles.projectItem}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <RichTextRenderer text={project.description} style={styles.projectDesc} />
                    {project.technologies && project.technologies.length > 0 && (
                      <View style={styles.techRow}>
                        {project.technologies.map((tech, idx) => (
                          <Text key={idx} style={styles.techTag}>{tech}</Text>
                        ))}
                      </View>
                    )}
                    {(project.projectUrl || project.sourceCodeUrl) && (
                      <View style={styles.projectLinks}>
                        {project.projectUrl && <Link src={project.projectUrl} style={styles.projectLink}>Demo</Link>}
                        {project.sourceCodeUrl && <Link src={project.sourceCodeUrl} style={styles.projectLink}>Code</Link>}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.rightColumn}>
            {/* Skills with bars */}
            {skills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills</Text>
                {skills.map((skill) => (
                  <View key={skill.id} style={styles.skillItem}>
                    <Text style={styles.skillName}>{skill.name}</Text>
                    <View style={styles.skillBarBg}>
                      <View style={[styles.skillBar, { width: getSkillWidth(skill.level) }]} />
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Education */}
            {education.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education</Text>
                {education.map((edu) => (
                  <View key={edu.id} style={styles.itemContainer}>
                    <Text style={styles.itemTitle}>{edu.degree}</Text>
                    <Text style={styles.itemSubtitle}>{edu.fieldOfStudy}</Text>
                    <Text style={styles.itemDescription}>{edu.institution}</Text>
                    <Text style={styles.itemDates}>
                      {formatDate(edu.endDate || edu.startDate)}
                    </Text>
                    {edu.grade && <Text style={styles.itemDescription}>GPA: {edu.grade}</Text>}
                  </View>
                ))}
              </View>
            )}

            {/* Languages */}
            {languages && languages.length > 0 && (
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
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Certifications</Text>
                {certifications.map((cert) => (
                  <View key={cert.id} style={styles.certItem}>
                    <Text style={styles.certName}>{cert.name}</Text>
                    <Text style={styles.certDetails}>{cert.issuingOrganization}</Text>
                    <Text style={styles.certDetails}>{formatDate(cert.issueDate)}</Text>
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
