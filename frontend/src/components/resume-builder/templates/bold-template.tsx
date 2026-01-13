import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Bold template - Impactful design with extra large name and strong visual presence
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 35,
      paddingBottom: 35,
      paddingHorizontal: 40,
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#1a1a1a',
      backgroundColor: '#ffffff',
    },
    // Header with extra large name
    header: {
      marginBottom: 20,
    },
    nameContainer: {
      marginBottom: 8,
    },
    name: {
      fontSize: 32,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    headline: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      letterSpacing: 1,
      marginBottom: 12,
    },
    // Thick divider after header
    headerDivider: {
      height: 4,
      backgroundColor: accentColor,
      marginBottom: 12,
    },
    // Contact row with high contrast
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 6,
    },
    contactItem: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#333333',
    },
    linkRow: {
      flexDirection: 'row',
      gap: 16,
    },
    link: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      textDecoration: 'none',
    },
    // Thick section header with accent background
    sectionHeader: {
      backgroundColor: accentColor,
      paddingVertical: 6,
      paddingHorizontal: 10,
      marginTop: 16,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    // Thick divider between items
    itemDivider: {
      height: 2,
      backgroundColor: '#e5e5e5',
      marginVertical: 10,
    },
    // Summary section
    summaryText: {
      fontSize: 11,
      lineHeight: 1.6,
      color: '#333333',
    },
    // Experience items with bold titles
    itemContainer: {
      marginBottom: 4,
    },
    itemHeader: {
      marginBottom: 4,
    },
    itemTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 2,
    },
    itemTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
    },
    itemDates: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#555555',
    },
    itemCompanyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    itemCompany: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
    },
    itemLocation: {
      fontSize: 10,
      color: '#666666',
    },
    itemDescription: {
      fontSize: 10,
      lineHeight: 1.5,
      color: '#333333',
      marginTop: 6,
    },
    bulletList: {
      marginTop: 6,
    },
    bulletItem: {
      fontSize: 10,
      lineHeight: 1.5,
      color: '#333333',
      marginBottom: 3,
      paddingLeft: 12,
    },
    // Education with bold degree
    eduItem: {
      marginBottom: 4,
    },
    eduDegree: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
    },
    eduInstitution: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginTop: 1,
    },
    eduDetails: {
      fontSize: 10,
      color: '#555555',
      marginTop: 2,
    },
    // Skills in bold tags
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillTag: {
      backgroundColor: '#f0f0f0',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderWidth: 2,
      borderColor: accentColor,
    },
    skillName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#333333',
    },
    skillLevel: {
      fontSize: 8,
      color: '#666666',
      marginTop: 1,
    },
    // Languages
    languagesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    languageName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#333333',
    },
    languageLevel: {
      fontSize: 9,
      color: '#666666',
    },
    // Certifications with bold name
    certItem: {
      marginBottom: 4,
    },
    certName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
    },
    certOrg: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
    },
    certDate: {
      fontSize: 9,
      color: '#666666',
    },
    // Projects
    projectItem: {
      marginBottom: 4,
    },
    projectTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#000000',
    },
    projectDesc: {
      fontSize: 10,
      lineHeight: 1.5,
      color: '#333333',
      marginTop: 4,
    },
    techLine: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#555555',
      marginTop: 4,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 4,
    },
    projectLink: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      textDecoration: 'none',
    },
  })

interface BoldTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function BoldTemplate({ data, settings }: BoldTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const formatProficiency = (proficiency: string) => {
    return proficiency.charAt(0) + proficiency.slice(1).toLowerCase()
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with extra large bold name */}
        <View style={styles.header}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>
              {personalInfo.firstName} {personalInfo.lastName}
            </Text>
          </View>
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          {/* Thick accent divider */}
          <View style={styles.headerDivider} />
          {/* Contact info */}
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
          {(personalInfo.linkedinUrl || personalInfo.portfolioUrl || personalInfo.githubUrl) && (
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
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Professional Summary</Text>
            </View>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Experience</Text>
            </View>
            {experience.map((exp, index) => (
              <View key={exp.id}>
                {index > 0 && <View style={styles.itemDivider} />}
                <View style={styles.itemContainer}>
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle}>{exp.title}</Text>
                      <Text style={styles.itemDates}>
                        {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                      </Text>
                    </View>
                    <View style={styles.itemCompanyRow}>
                      <Text style={styles.itemCompany}>{exp.companyName}</Text>
                      {exp.location && <Text style={styles.itemLocation}>{exp.location}</Text>}
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
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Education</Text>
            </View>
            {education.map((edu, index) => (
              <View key={edu.id}>
                {index > 0 && <View style={styles.itemDivider} />}
                <View style={styles.eduItem}>
                  <Text style={styles.eduDegree}>{edu.degree} in {edu.fieldOfStudy}</Text>
                  <Text style={styles.eduInstitution}>{edu.institution}</Text>
                  <Text style={styles.eduDetails}>
                    {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                    {edu.grade && ` | GPA: ${edu.grade}`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Skills</Text>
            </View>
            <View style={styles.skillsContainer}>
              {skills.map((skill) => (
                <View key={skill.id} style={styles.skillTag}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  {settings.showSkillLevels && skill.level && (
                    <Text style={styles.skillLevel}>
                      {skill.level.charAt(0) + skill.level.slice(1).toLowerCase()}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Languages</Text>
            </View>
            <View style={styles.languagesContainer}>
              {languages.map((lang) => (
                <View key={lang.id} style={styles.languageItem}>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  {lang.proficiency && (
                    <Text style={styles.languageLevel}>({formatProficiency(lang.proficiency)})</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Certifications</Text>
            </View>
            {certifications.map((cert, index) => (
              <View key={cert.id}>
                {index > 0 && <View style={styles.itemDivider} />}
                <View style={styles.certItem}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                  <Text style={styles.certDate}>{formatDate(cert.issueDate)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Projects</Text>
            </View>
            {projects.map((project, index) => (
              <View key={project.id}>
                {index > 0 && <View style={styles.itemDivider} />}
                <View style={styles.projectItem}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <RichTextRenderer text={project.description} style={styles.projectDesc} />
                  {project.technologies && project.technologies.length > 0 && (
                    <Text style={styles.techLine}>
                      Tech: {project.technologies.join(' | ')}
                    </Text>
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
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
