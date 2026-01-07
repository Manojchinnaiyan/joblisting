import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Executive template - Elegant and sophisticated for senior roles
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 40,
      paddingBottom: 40,
      paddingHorizontal: 50,
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#1a1a1a',
    },
    // Header
    header: {
      borderBottomWidth: 2,
      borderBottomColor: accentColor,
      paddingBottom: 15,
      marginBottom: 20,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 4,
    },
    firstName: {
      fontSize: 28,
      fontFamily: 'Helvetica',
      color: '#1a1a1a',
      letterSpacing: 2,
    },
    lastName: {
      fontSize: 28,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      letterSpacing: 2,
      marginLeft: 8,
    },
    headline: {
      fontSize: 11,
      color: '#666666',
      letterSpacing: 3,
      textTransform: 'uppercase',
      marginBottom: 12,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 20,
    },
    contactItem: {
      fontSize: 9,
      color: '#444444',
    },
    linkRow: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 6,
    },
    link: {
      fontSize: 9,
      color: accentColor,
      textDecoration: 'none',
    },
    // Two column layout
    columnsContainer: {
      flexDirection: 'row',
      gap: 30,
    },
    mainColumn: {
      flex: 2,
    },
    sideColumn: {
      flex: 1,
    },
    // Section
    section: {
      marginBottom: 18,
    },
    sectionTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 2,
      marginBottom: 10,
      paddingBottom: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: '#cccccc',
    },
    // Summary
    summaryText: {
      fontSize: 10,
      lineHeight: 1.6,
      color: '#333333',
      fontStyle: 'italic',
    },
    // Experience
    itemContainer: {
      marginBottom: 14,
    },
    itemHeader: {
      marginBottom: 4,
    },
    itemTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
    },
    itemCompany: {
      fontSize: 10,
      color: accentColor,
      marginTop: 1,
    },
    itemMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 2,
    },
    itemLocation: {
      fontSize: 9,
      color: '#666666',
    },
    itemDates: {
      fontSize: 9,
      color: '#666666',
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
      paddingLeft: 12,
    },
    // Education
    eduItem: {
      marginBottom: 10,
    },
    eduDegree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
    },
    eduInstitution: {
      fontSize: 9,
      color: accentColor,
      marginTop: 1,
    },
    eduDetails: {
      fontSize: 9,
      color: '#666666',
      marginTop: 2,
    },
    // Skills in side column
    skillCategory: {
      marginBottom: 10,
    },
    skillCategoryTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      marginBottom: 4,
    },
    skillItem: {
      fontSize: 9,
      color: '#444444',
      marginBottom: 2,
    },
    // Languages
    languageItem: {
      marginBottom: 4,
    },
    languageName: {
      fontSize: 9,
      color: '#1a1a1a',
    },
    languageLevel: {
      fontSize: 8,
      color: '#666666',
    },
    // Certifications
    certItem: {
      marginBottom: 8,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
    },
    certOrg: {
      fontSize: 8,
      color: accentColor,
    },
    certDate: {
      fontSize: 8,
      color: '#666666',
    },
    // Projects
    projectItem: {
      marginBottom: 10,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#333333',
      marginTop: 3,
    },
    techLine: {
      fontSize: 8,
      color: '#666666',
      marginTop: 3,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 3,
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
    },
  })

interface ExecutiveTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function ExecutiveTemplate({ data, settings }: ExecutiveTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Group skills by level for display
  const expertSkills = skills.filter(s => s.level === 'EXPERT' || s.level === 'ADVANCED')
  const otherSkills = skills.filter(s => s.level !== 'EXPERT' && s.level !== 'ADVANCED')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <Text style={styles.firstName}>{personalInfo.firstName}</Text>
            <Text style={styles.lastName}>{personalInfo.lastName}</Text>
          </View>
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          <View style={styles.contactRow}>
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
          {(personalInfo.linkedinUrl || personalInfo.portfolioUrl) && (
            <View style={styles.linkRow}>
              {personalInfo.linkedinUrl && (
                <Link src={personalInfo.linkedinUrl} style={styles.link}>LinkedIn</Link>
              )}
              {personalInfo.portfolioUrl && (
                <Link src={personalInfo.portfolioUrl} style={styles.link}>Portfolio</Link>
              )}
            </View>
          )}
        </View>

        {/* Summary - Full width */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Executive Summary</Text>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Two Column Layout */}
        <View style={styles.columnsContainer}>
          {/* Main Column */}
          <View style={styles.mainColumn}>
            {/* Experience */}
            {experience.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Professional Experience</Text>
                {experience.map((exp) => (
                  <View key={exp.id} style={styles.itemContainer}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{exp.title}</Text>
                      <Text style={styles.itemCompany}>{exp.companyName}</Text>
                      <View style={styles.itemMeta}>
                        {exp.location && <Text style={styles.itemLocation}>{exp.location}</Text>}
                        <Text style={styles.itemDates}>
                          {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                        </Text>
                      </View>
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

            {/* Projects */}
            {projects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Projects</Text>
                {projects.map((project) => (
                  <View key={project.id} style={styles.projectItem}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <RichTextRenderer text={project.description} style={styles.projectDesc} />
                    {project.technologies && project.technologies.length > 0 && (
                      <Text style={styles.techLine}>
                        Technologies: {project.technologies.join(', ')}
                      </Text>
                    )}
                    {(project.projectUrl || project.sourceCodeUrl) && (
                      <View style={styles.projectLinks}>
                        {project.projectUrl && (
                          <Link src={project.projectUrl} style={styles.projectLink}>View Project</Link>
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
          </View>

          {/* Side Column */}
          <View style={styles.sideColumn}>
            {/* Education */}
            {education.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education</Text>
                {education.map((edu) => (
                  <View key={edu.id} style={styles.eduItem}>
                    <Text style={styles.eduDegree}>{edu.degree}</Text>
                    <Text style={styles.eduInstitution}>{edu.institution}</Text>
                    <Text style={styles.eduDetails}>
                      {edu.fieldOfStudy} | {formatDate(edu.endDate || edu.startDate)}
                    </Text>
                    {edu.grade && <Text style={styles.eduDetails}>GPA: {edu.grade}</Text>}
                  </View>
                ))}
              </View>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Core Competencies</Text>
                {expertSkills.length > 0 && (
                  <View style={styles.skillCategory}>
                    <Text style={styles.skillCategoryTitle}>Expert</Text>
                    {expertSkills.map((skill) => (
                      <Text key={skill.id} style={styles.skillItem}>• {skill.name}</Text>
                    ))}
                  </View>
                )}
                {otherSkills.length > 0 && (
                  <View style={styles.skillCategory}>
                    <Text style={styles.skillCategoryTitle}>Proficient</Text>
                    {otherSkills.map((skill) => (
                      <Text key={skill.id} style={styles.skillItem}>• {skill.name}</Text>
                    ))}
                  </View>
                )}
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
                    <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                    <Text style={styles.certDate}>{formatDate(cert.issueDate)}</Text>
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
