import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Headline template - Large prominent section headers
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 35,
      paddingBottom: 35,
      paddingHorizontal: 40,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1f2937',
    },
    header: {
      marginBottom: 20,
    },
    name: {
      fontSize: 28,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 6,
    },
    headline: {
      fontSize: 14,
      color: accentColor,
      fontFamily: 'Helvetica-Bold',
      marginBottom: 10,
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
    linkRow: {
      flexDirection: 'row',
      gap: 15,
      marginTop: 6,
    },
    link: {
      fontSize: 9,
      color: accentColor,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitleBig: {
      fontSize: 16,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginBottom: 10,
      paddingBottom: 5,
      borderBottomWidth: 3,
      borderBottomColor: accentColor,
    },
    summaryText: {
      fontSize: 10,
      lineHeight: 1.6,
      color: '#374151',
    },
    itemContainer: {
      marginBottom: 12,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    itemLeft: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    itemSubtitle: {
      fontSize: 10,
      color: '#6b7280',
      marginTop: 2,
    },
    itemDates: {
      fontSize: 9,
      color: accentColor,
      textAlign: 'right',
    },
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
      marginTop: 6,
    },
    bulletList: {
      marginTop: 6,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
      marginBottom: 3,
    },
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillChip: {
      fontSize: 9,
      color: '#ffffff',
      backgroundColor: accentColor,
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: 15,
    },
    languageRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 20,
    },
    languageItem: {
      fontSize: 9,
    },
    languageName: {
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    languageLevel: {
      color: '#6b7280',
    },
    certItem: {
      marginBottom: 8,
    },
    certName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    certDetails: {
      fontSize: 9,
      color: '#6b7280',
    },
    projectItem: {
      marginBottom: 12,
    },
    projectTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
      marginTop: 4,
    },
    techLine: {
      fontSize: 8,
      color: accentColor,
      marginTop: 4,
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
  })

interface HeadlineTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function HeadlineTemplate({ data, settings }: HeadlineTemplateProps) {
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          <View style={styles.contactRow}>
            {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
            {personalInfo.phone && <Text style={styles.contactItem}>{personalInfo.phone}</Text>}
            {personalInfo.location && <Text style={styles.contactItem}>{personalInfo.location}</Text>}
          </View>
          {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
            <View style={styles.linkRow}>
              {personalInfo.linkedinUrl && <Link src={personalInfo.linkedinUrl} style={styles.link}>LinkedIn</Link>}
              {personalInfo.githubUrl && <Link src={personalInfo.githubUrl} style={styles.link}>GitHub</Link>}
              {personalInfo.portfolioUrl && <Link src={personalInfo.portfolioUrl} style={styles.link}>Portfolio</Link>}
            </View>
          )}
        </View>

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleBig}>Summary</Text>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleBig}>Experience</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemTitle}>{exp.title}</Text>
                    <Text style={styles.itemSubtitle}>
                      {exp.companyName}{exp.location ? ` | ${exp.location}` : ''}
                    </Text>
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
            <Text style={styles.sectionTitleBig}>Education</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                    <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                  </View>
                  <Text style={styles.itemDates}>
                    {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                  </Text>
                </View>
                {edu.grade && <Text style={styles.itemDescription}>GPA: {edu.grade}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleBig}>Skills</Text>
            <View style={styles.skillsGrid}>
              {skills.map((skill) => (
                <Text key={skill.id} style={styles.skillChip}>{skill.name}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleBig}>Languages</Text>
            <View style={styles.languageRow}>
              {languages.map((lang) => (
                <Text key={lang.id} style={styles.languageItem}>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  {lang.proficiency && (
                    <Text style={styles.languageLevel}> ({lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()})</Text>
                  )}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleBig}>Certifications</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certItem}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certDetails}>
                  {cert.issuingOrganization} | {formatDate(cert.issueDate)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitleBig}>Projects</Text>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <RichTextRenderer text={project.description} style={styles.projectDesc} />
                {project.technologies && project.technologies.length > 0 && (
                  <Text style={styles.techLine}>{project.technologies.join(' | ')}</Text>
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
      </Page>
    </Document>
  )
}
