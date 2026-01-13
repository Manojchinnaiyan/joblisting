import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// ATS-optimized minimal template
// Compact spacing to fit more content on one page
const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#000000',
    lineHeight: 1.15,
  },
  header: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginBottom: 6,
  },
  headline: {
    fontSize: 10,
    color: '#333333',
    marginBottom: 6,
  },
  contactLine: {
    fontSize: 9,
    color: '#000000',
    marginBottom: 2,
  },
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 2,
  },
  link: {
    fontSize: 9,
    color: '#000000',
    textDecoration: 'underline',
  },
  section: {
    marginBottom: 10,
    width: '100%',
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    marginBottom: 6,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#666666',
    textTransform: 'uppercase',
  },
  // Experience
  experienceItem: {
    marginBottom: 8,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
    width: '100%',
  },
  jobTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    flex: 1,
    flexWrap: 'wrap',
    paddingRight: 10,
  },
  dates: {
    fontSize: 9,
    color: '#000000',
    flexShrink: 0,
  },
  company: {
    fontSize: 9,
    color: '#000000',
    marginBottom: 2,
    width: '100%',
  },
  description: {
    fontSize: 9,
    lineHeight: 1.2,
    color: '#000000',
    marginBottom: 2,
    width: '100%',
  },
  bulletList: {
    marginLeft: 10,
    width: '100%',
  },
  bulletItem: {
    fontSize: 9,
    lineHeight: 1.2,
    color: '#000000',
    marginBottom: 1,
    width: '100%',
  },
  // Education
  educationItem: {
    marginBottom: 5,
    width: '100%',
  },
  degree: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    flex: 1,
    flexWrap: 'wrap',
    paddingRight: 8,
  },
  institution: {
    fontSize: 9,
    color: '#000000',
    width: '100%',
  },
  grade: {
    fontSize: 9,
    color: '#000000',
    width: '100%',
  },
  // Skills
  skillsText: {
    fontSize: 9,
    color: '#000000',
    lineHeight: 1.3,
    width: '100%',
  },
  // Certifications
  certItem: {
    marginBottom: 3,
    width: '100%',
  },
  certName: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    width: '100%',
  },
  certDetails: {
    fontSize: 9,
    color: '#000000',
    width: '100%',
  },
  // Projects
  projectItem: {
    marginBottom: 5,
    width: '100%',
  },
  projectTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
    width: '100%',
  },
  projectDesc: {
    fontSize: 9,
    lineHeight: 1.2,
    color: '#000000',
    marginBottom: 1,
    width: '100%',
  },
  techText: {
    fontSize: 9,
    color: '#333333',
    width: '100%',
  },
  projectLinks: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  projectLink: {
    fontSize: 9,
    color: '#000000',
    textDecoration: 'underline',
  },
})

interface MinimalTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function MinimalTemplate({ data }: MinimalTemplateProps) {
  const { personalInfo, experience, education, skills, certifications, projects } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Build contact line
  const contactParts: string[] = []
  if (personalInfo.email) contactParts.push(personalInfo.email)
  if (personalInfo.phone) contactParts.push(personalInfo.phone)
  if (personalInfo.location) contactParts.push(personalInfo.location)

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
          {contactParts.length > 0 && (
            <Text style={styles.contactLine}>{contactParts.join(' | ')}</Text>
          )}
          {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <RichTextRenderer text={personalInfo.summary} style={styles.description} />
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.experienceItem}>
                <View style={styles.row}>
                  <Text style={styles.jobTitle}>{exp.title}</Text>
                  <Text style={styles.dates}>
                    {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : exp.endDate ? formatDate(exp.endDate) : ''}
                  </Text>
                </View>
                <Text style={styles.company}>
                  {exp.companyName}{exp.location ? `, ${exp.location}` : ''}
                </Text>
                {exp.description && (
                  <RichTextRenderer text={exp.description} style={styles.description} />
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
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu) => (
              <View key={edu.id} style={styles.educationItem}>
                <View style={styles.row}>
                  <Text style={styles.degree}>{edu.degree} in {edu.fieldOfStudy}</Text>
                  <Text style={styles.dates}>
                    {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : edu.endDate ? formatDate(edu.endDate) : ''}
                  </Text>
                </View>
                <Text style={styles.institution}>{edu.institution}</Text>
                {edu.grade && <Text style={styles.grade}>GPA: {edu.grade}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skillsText}>
              {skills.map((skill) => `• ${skill.name}`).join('   ')}
            </Text>
          </View>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.skillsText}>
              {data.languages.map((lang) => `• ${lang.name}`).join('   ')}
            </Text>
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certItem}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certDetails}>
                  {cert.issuingOrganization}, {formatDate(cert.issueDate)}
                </Text>
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
                  <Text style={styles.techText}>
                    Tech: {project.technologies.join(', ')}
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
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
