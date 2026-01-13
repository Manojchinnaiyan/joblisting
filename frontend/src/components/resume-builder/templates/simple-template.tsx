import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Simple ATS-Optimized Template
// - Single column, no fancy formatting
// - Plain text focus, easy to parse by ATS systems
// - Standard section headers recognized by applicant tracking systems
// - No graphics, no colors (except name for slight emphasis)
// - Maximum ATS compatibility with clear hierarchy
// - Basic but professional appearance

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 50,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#000000',
    lineHeight: 1.4,
    backgroundColor: '#ffffff',
  },
  // Header - simple name and contact block
  header: {
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 6,
    textAlign: 'left',
  },
  contactInfo: {
    fontSize: 10,
    color: '#000000',
    marginBottom: 2,
    lineHeight: 1.5,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  contactItem: {
    fontSize: 10,
    color: '#000000',
    marginRight: 4,
  },
  contactSeparator: {
    fontSize: 10,
    color: '#000000',
    marginRight: 4,
  },
  linkText: {
    fontSize: 10,
    color: '#000000',
    textDecoration: 'none',
  },
  // Section styling - plain and parsable
  section: {
    marginBottom: 14,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Summary - plain paragraph
  summaryText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#000000',
    textAlign: 'left',
  },
  // Experience entries
  experienceItem: {
    marginBottom: 12,
    width: '100%',
  },
  jobTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
    width: '100%',
  },
  jobTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    flex: 1,
    paddingRight: 8,
  },
  dateRange: {
    fontSize: 10,
    color: '#000000',
    flexShrink: 0,
  },
  companyName: {
    fontSize: 10,
    color: '#000000',
    marginBottom: 4,
  },
  description: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#000000',
    marginBottom: 2,
  },
  achievementsList: {
    marginTop: 4,
    width: '100%',
  },
  achievementItem: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#000000',
    marginBottom: 2,
    marginLeft: 12,
  },
  // Education entries
  educationItem: {
    marginBottom: 10,
    width: '100%',
  },
  degreeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
    width: '100%',
  },
  degreeText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    flex: 1,
    paddingRight: 8,
  },
  institutionText: {
    fontSize: 10,
    color: '#000000',
    marginBottom: 2,
  },
  gradeText: {
    fontSize: 10,
    color: '#000000',
  },
  // Skills - simple comma-separated list
  skillsContainer: {
    width: '100%',
  },
  skillsText: {
    fontSize: 10,
    color: '#000000',
    lineHeight: 1.5,
  },
  // Languages
  languagesText: {
    fontSize: 10,
    color: '#000000',
    lineHeight: 1.5,
  },
  // Certifications
  certificationItem: {
    marginBottom: 6,
    width: '100%',
  },
  certificationName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
  },
  certificationDetails: {
    fontSize: 10,
    color: '#000000',
  },
  // Projects
  projectItem: {
    marginBottom: 10,
    width: '100%',
  },
  projectTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginBottom: 2,
  },
  projectDescription: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#000000',
    marginBottom: 2,
  },
  projectTechnologies: {
    fontSize: 10,
    color: '#000000',
  },
  projectLinks: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  projectLink: {
    fontSize: 10,
    color: '#000000',
    textDecoration: 'none',
  },
})

interface SimpleTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function SimpleTemplate({ data }: SimpleTemplateProps) {
  const { personalInfo, experience, education, skills, certifications, projects } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Build contact parts for display
  const getContactLine = () => {
    const parts: string[] = []
    if (personalInfo.email) parts.push(personalInfo.email)
    if (personalInfo.phone) parts.push(personalInfo.phone)
    if (personalInfo.location) parts.push(personalInfo.location)
    return parts.join(' | ')
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Name and Contact Info */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.contactInfo}>{personalInfo.headline}</Text>
          )}
          <Text style={styles.contactInfo}>{getContactLine()}</Text>
          {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
            <View style={styles.contactRow}>
              {personalInfo.linkedinUrl && (
                <>
                  <Link src={personalInfo.linkedinUrl} style={styles.linkText}>
                    LinkedIn: {personalInfo.linkedinUrl.replace('https://', '').replace('www.', '')}
                  </Link>
                  {(personalInfo.githubUrl || personalInfo.portfolioUrl) && (
                    <Text style={styles.contactSeparator}> | </Text>
                  )}
                </>
              )}
              {personalInfo.githubUrl && (
                <>
                  <Link src={personalInfo.githubUrl} style={styles.linkText}>
                    GitHub: {personalInfo.githubUrl.replace('https://', '').replace('www.', '')}
                  </Link>
                  {personalInfo.portfolioUrl && (
                    <Text style={styles.contactSeparator}> | </Text>
                  )}
                </>
              )}
              {personalInfo.portfolioUrl && (
                <Link src={personalInfo.portfolioUrl} style={styles.linkText}>
                  Portfolio: {personalInfo.portfolioUrl.replace('https://', '').replace('www.', '')}
                </Link>
              )}
            </View>
          )}
        </View>

        {/* Professional Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROFESSIONAL SUMMARY</Text>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Work Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WORK EXPERIENCE</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.experienceItem}>
                <View style={styles.jobTitleRow}>
                  <Text style={styles.jobTitle}>{exp.title}</Text>
                  <Text style={styles.dateRange}>
                    {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : exp.endDate ? formatDate(exp.endDate) : ''}
                  </Text>
                </View>
                <Text style={styles.companyName}>
                  {exp.companyName}{exp.location ? `, ${exp.location}` : ''}
                </Text>
                {exp.description && (
                  <RichTextRenderer text={exp.description} style={styles.description} />
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={styles.achievementsList}>
                    {exp.achievements.map((achievement, idx) => (
                      <Text key={idx} style={styles.achievementItem}>- {achievement}</Text>
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
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.educationItem}>
                <View style={styles.degreeRow}>
                  <Text style={styles.degreeText}>
                    {edu.degree} in {edu.fieldOfStudy}
                  </Text>
                  <Text style={styles.dateRange}>
                    {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : edu.endDate ? formatDate(edu.endDate) : ''}
                  </Text>
                </View>
                <Text style={styles.institutionText}>{edu.institution}</Text>
                {edu.grade && <Text style={styles.gradeText}>GPA: {edu.grade}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Skills - Simple comma-separated format for ATS */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SKILLS</Text>
            <View style={styles.skillsContainer}>
              <Text style={styles.skillsText}>
                {skills.map((skill) => skill.name).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LANGUAGES</Text>
            <Text style={styles.languagesText}>
              {data.languages.map((lang) =>
                lang.proficiency
                  ? `${lang.name} (${lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()})`
                  : lang.name
              ).join(', ')}
            </Text>
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CERTIFICATIONS</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certificationItem}>
                <Text style={styles.certificationName}>{cert.name}</Text>
                <Text style={styles.certificationDetails}>
                  {cert.issuingOrganization}, {formatDate(cert.issueDate)}
                  {cert.credentialId ? ` - ID: ${cert.credentialId}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROJECTS</Text>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <RichTextRenderer text={project.description} style={styles.projectDescription} />
                {project.technologies && project.technologies.length > 0 && (
                  <Text style={styles.projectTechnologies}>
                    Technologies: {project.technologies.join(', ')}
                  </Text>
                )}
                {(project.projectUrl || project.sourceCodeUrl) && (
                  <View style={styles.projectLinks}>
                    {project.projectUrl && (
                      <Link src={project.projectUrl} style={styles.projectLink}>
                        {project.projectUrl.replace('https://', '').replace('www.', '')}
                      </Link>
                    )}
                    {project.sourceCodeUrl && (
                      <Link src={project.sourceCodeUrl} style={styles.projectLink}>
                        {project.sourceCodeUrl.replace('https://', '').replace('www.', '')}
                      </Link>
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
