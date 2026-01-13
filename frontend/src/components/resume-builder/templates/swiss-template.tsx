import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Swiss template - Helvetica/modernist design, clean grid
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 40,
      paddingHorizontal: 50,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#000000',
    },
    header: {
      marginBottom: 25,
    },
    name: {
      fontSize: 28,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
      letterSpacing: -1,
    },
    headline: {
      fontSize: 12,
      color: accentColor,
      marginTop: 4,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    contactRow: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 15,
    },
    contactItem: {
      fontSize: 9,
      color: '#666666',
    },
    linkRow: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 6,
    },
    link: {
      fontSize: 9,
      color: accentColor,
    },
    grid: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    gridLabel: {
      width: 100,
      paddingRight: 15,
    },
    gridLabelText: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    gridContent: {
      flex: 1,
    },
    summaryText: {
      fontSize: 10,
      lineHeight: 1.6,
      color: '#333333',
    },
    itemContainer: {
      marginBottom: 12,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
    },
    itemDates: {
      fontSize: 9,
      color: '#666666',
    },
    itemSubtitle: {
      fontSize: 9,
      color: '#666666',
      marginTop: 2,
    },
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#333333',
      marginTop: 6,
    },
    bulletList: {
      marginTop: 6,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#333333',
      marginBottom: 3,
    },
    skillsText: {
      fontSize: 9,
      lineHeight: 1.6,
      color: '#333333',
    },
    languageItem: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    languageName: {
      fontSize: 9,
      color: '#000000',
      width: 80,
    },
    languageLevel: {
      fontSize: 9,
      color: '#666666',
    },
    certItem: {
      marginBottom: 8,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
    },
    certDetails: {
      fontSize: 9,
      color: '#666666',
    },
    projectItem: {
      marginBottom: 12,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#333333',
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
    },
  })

interface SwissTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function SwissTemplate({ data, settings }: SwissTemplateProps) {
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
          <View style={styles.grid}>
            <View style={styles.gridLabel}>
              <Text style={styles.gridLabelText}>About</Text>
            </View>
            <View style={styles.gridContent}>
              <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
            </View>
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.grid}>
            <View style={styles.gridLabel}>
              <Text style={styles.gridLabelText}>Experience</Text>
            </View>
            <View style={styles.gridContent}>
              {experience.map((exp) => (
                <View key={exp.id} style={styles.itemContainer}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{exp.title}</Text>
                    <Text style={styles.itemDates}>
                      {formatDate(exp.startDate)} — {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                    </Text>
                  </View>
                  <Text style={styles.itemSubtitle}>
                    {exp.companyName}{exp.location ? `, ${exp.location}` : ''}
                  </Text>
                  {exp.description && (
                    <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <View style={styles.bulletList}>
                      {exp.achievements.map((achievement, idx) => (
                        <Text key={idx} style={styles.bulletItem}>— {achievement}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.grid}>
            <View style={styles.gridLabel}>
              <Text style={styles.gridLabelText}>Education</Text>
            </View>
            <View style={styles.gridContent}>
              {education.map((edu) => (
                <View key={edu.id} style={styles.itemContainer}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                    <Text style={styles.itemDates}>
                      {formatDate(edu.endDate || edu.startDate)}
                    </Text>
                  </View>
                  <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                  {edu.grade && <Text style={styles.itemDescription}>GPA: {edu.grade}</Text>}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.grid}>
            <View style={styles.gridLabel}>
              <Text style={styles.gridLabelText}>Skills</Text>
            </View>
            <View style={styles.gridContent}>
              <Text style={styles.skillsText}>
                {skills.map((skill) => skill.name).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View style={styles.grid}>
            <View style={styles.gridLabel}>
              <Text style={styles.gridLabelText}>Languages</Text>
            </View>
            <View style={styles.gridContent}>
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
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.grid}>
            <View style={styles.gridLabel}>
              <Text style={styles.gridLabelText}>Certifications</Text>
            </View>
            <View style={styles.gridContent}>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.certItem}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certDetails}>
                    {cert.issuingOrganization}, {formatDate(cert.issueDate)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.grid}>
            <View style={styles.gridLabel}>
              <Text style={styles.gridLabelText}>Projects</Text>
            </View>
            <View style={styles.gridContent}>
              {projects.map((project) => (
                <View key={project.id} style={styles.projectItem}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <RichTextRenderer text={project.description} style={styles.projectDesc} />
                  {project.technologies && project.technologies.length > 0 && (
                    <Text style={styles.techLine}>{project.technologies.join(', ')}</Text>
                  )}
                  {(project.projectUrl || project.sourceCodeUrl) && (
                    <View style={styles.projectLinks}>
                      {project.projectUrl && <Link src={project.projectUrl} style={styles.projectLink}>View →</Link>}
                      {project.sourceCodeUrl && <Link src={project.sourceCodeUrl} style={styles.projectLink}>Source →</Link>}
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  )
}
