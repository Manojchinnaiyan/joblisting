import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Government/Legal style template
// Dense formatting with small margins, double-line borders, numbered sections
const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 25,
    fontSize: 9,
    fontFamily: 'Times-Roman',
    color: '#000000',
    backgroundColor: '#ffffff',
  },
  // Double-line border around entire page
  outerBorder: {
    borderWidth: 2,
    borderColor: '#000000',
    padding: 3,
    height: '100%',
  },
  innerBorder: {
    borderWidth: 1,
    borderColor: '#000000',
    padding: 15,
    height: '100%',
  },
  // Header - centered name with title
  header: {
    marginBottom: 12,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 10,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Times-Bold',
    color: '#000000',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  title: {
    fontSize: 11,
    fontFamily: 'Times-Italic',
    color: '#333333',
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  contactItem: {
    fontSize: 8,
    color: '#000000',
    marginHorizontal: 8,
  },
  contactSeparator: {
    fontSize: 8,
    color: '#666666',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 15,
    marginTop: 4,
  },
  link: {
    fontSize: 8,
    color: '#000066',
    textDecoration: 'underline',
  },
  // Section with boxed headers
  section: {
    marginBottom: 10,
    width: '100%',
  },
  sectionHeader: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Times-Bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Summary
  summaryText: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#000000',
    textAlign: 'justify',
    width: '100%',
  },
  // Experience & Education items
  itemContainer: {
    marginBottom: 8,
    width: '100%',
    paddingLeft: 10,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 1,
  },
  itemTitle: {
    fontSize: 9,
    fontFamily: 'Times-Bold',
    color: '#000000',
    flex: 1,
    flexWrap: 'wrap',
    paddingRight: 8,
  },
  itemDates: {
    fontSize: 8,
    fontFamily: 'Times-Italic',
    color: '#333333',
    flexShrink: 0,
  },
  itemSubtitle: {
    fontSize: 9,
    color: '#333333',
    marginBottom: 2,
    width: '100%',
  },
  itemLocation: {
    fontSize: 8,
    fontFamily: 'Times-Italic',
    color: '#555555',
    marginBottom: 2,
  },
  itemDescription: {
    fontSize: 8,
    lineHeight: 1.3,
    color: '#000000',
    textAlign: 'justify',
    width: '100%',
  },
  bulletList: {
    marginTop: 2,
    marginLeft: 8,
    width: '100%',
  },
  bulletItem: {
    fontSize: 8,
    lineHeight: 1.3,
    color: '#000000',
    marginBottom: 1,
    textAlign: 'justify',
    width: '100%',
  },
  // Skills - dense formatting
  skillsContainer: {
    paddingLeft: 10,
  },
  skillsText: {
    fontSize: 8,
    color: '#000000',
    lineHeight: 1.4,
    width: '100%',
  },
  skillCategory: {
    marginBottom: 3,
  },
  skillLabel: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#000000',
  },
  skillValue: {
    fontSize: 8,
    color: '#000000',
  },
  // Certifications
  certContainer: {
    paddingLeft: 10,
  },
  certItem: {
    marginBottom: 4,
    width: '100%',
  },
  certName: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#000000',
    width: '100%',
  },
  certDetails: {
    fontSize: 8,
    color: '#333333',
    width: '100%',
  },
  // Projects
  projectContainer: {
    paddingLeft: 10,
  },
  projectItem: {
    marginBottom: 6,
    width: '100%',
  },
  projectTitle: {
    fontSize: 8,
    fontFamily: 'Times-Bold',
    color: '#000000',
    width: '100%',
  },
  projectDesc: {
    fontSize: 8,
    lineHeight: 1.3,
    color: '#000000',
    marginTop: 1,
    textAlign: 'justify',
    width: '100%',
  },
  techLine: {
    fontSize: 7,
    fontFamily: 'Times-Italic',
    color: '#444444',
    marginTop: 1,
    width: '100%',
  },
  projectLinks: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
  },
  projectLink: {
    fontSize: 7,
    color: '#000066',
    textDecoration: 'underline',
  },
  // Languages section
  languageText: {
    fontSize: 8,
    color: '#000000',
    paddingLeft: 10,
  },
  // Footer reference line
  footer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    color: '#666666',
    fontFamily: 'Times-Italic',
  },
})

interface FormalTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function FormalTemplate({ data }: FormalTemplateProps) {
  const { personalInfo, experience, education, skills, certifications, projects } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  // Section counter for numbered sections
  let sectionNumber = 0

  const getNextSectionNumber = () => {
    sectionNumber++
    return sectionNumber
  }

  // Build contact items
  const contactItems: string[] = []
  if (personalInfo.email) contactItems.push(personalInfo.email)
  if (personalInfo.phone) contactItems.push(personalInfo.phone)
  if (personalInfo.location) contactItems.push(personalInfo.location)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Double-line border container */}
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            {/* Header - Centered Name and Title */}
            <View style={styles.header}>
              <Text style={styles.name}>
                {personalInfo.firstName} {personalInfo.lastName}
              </Text>
              {personalInfo.headline && (
                <Text style={styles.title}>{personalInfo.headline}</Text>
              )}
              {contactItems.length > 0 && (
                <View style={styles.contactRow}>
                  {contactItems.map((item, index) => (
                    <View key={index} style={{ flexDirection: 'row' }}>
                      {index > 0 && <Text style={styles.contactSeparator}> | </Text>}
                      <Text style={styles.contactItem}>{item}</Text>
                    </View>
                  ))}
                </View>
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

            {/* Summary Section */}
            {personalInfo.summary && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {getNextSectionNumber()}. Professional Summary
                  </Text>
                </View>
                <View style={{ paddingLeft: 10 }}>
                  <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
                </View>
              </View>
            )}

            {/* Experience Section */}
            {experience.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {getNextSectionNumber()}. Professional Experience
                  </Text>
                </View>
                {experience.map((exp) => (
                  <View key={exp.id} style={styles.itemContainer}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{exp.title}</Text>
                      <Text style={styles.itemDates}>
                        {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : exp.endDate ? formatDate(exp.endDate) : ''}
                      </Text>
                    </View>
                    <Text style={styles.itemSubtitle}>{exp.companyName}</Text>
                    {exp.location && (
                      <Text style={styles.itemLocation}>{exp.location}</Text>
                    )}
                    {exp.description && (
                      <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <View style={styles.bulletList}>
                        {exp.achievements.map((achievement, idx) => (
                          <Text key={idx} style={styles.bulletItem}>- {achievement}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Education Section */}
            {education.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {getNextSectionNumber()}. Education
                  </Text>
                </View>
                {education.map((edu) => (
                  <View key={edu.id} style={styles.itemContainer}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                      <Text style={styles.itemDates}>
                        {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : edu.endDate ? formatDate(edu.endDate) : ''}
                      </Text>
                    </View>
                    <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                    {edu.grade && <Text style={styles.itemDescription}>Grade Point Average: {edu.grade}</Text>}
                    {edu.description && (
                      <RichTextRenderer text={edu.description} style={styles.itemDescription} />
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Skills Section */}
            {skills.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {getNextSectionNumber()}. Technical Competencies
                  </Text>
                </View>
                <View style={styles.skillsContainer}>
                  <Text style={styles.skillsText}>
                    <Text style={styles.skillLabel}>Core Skills: </Text>
                    <Text style={styles.skillValue}>
                      {skills.map((skill) => skill.name).join('; ')}
                    </Text>
                  </Text>
                </View>
              </View>
            )}

            {/* Languages Section */}
            {data.languages && data.languages.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {getNextSectionNumber()}. Languages
                  </Text>
                </View>
                <Text style={styles.languageText}>
                  {data.languages.map((lang) => {
                    const proficiency = lang.proficiency ? ` (${lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()})` : ''
                    return `${lang.name}${proficiency}`
                  }).join('; ')}
                </Text>
              </View>
            )}

            {/* Certifications Section */}
            {certifications.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {getNextSectionNumber()}. Professional Certifications
                  </Text>
                </View>
                <View style={styles.certContainer}>
                  {certifications.map((cert) => (
                    <View key={cert.id} style={styles.certItem}>
                      <Text style={styles.certName}>{cert.name}</Text>
                      <Text style={styles.certDetails}>
                        Issued by {cert.issuingOrganization}, {formatDate(cert.issueDate)}
                        {cert.credentialId ? ` (Credential ID: ${cert.credentialId})` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Projects Section */}
            {projects.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    {getNextSectionNumber()}. Notable Projects
                  </Text>
                </View>
                <View style={styles.projectContainer}>
                  {projects.map((project) => (
                    <View key={project.id} style={styles.projectItem}>
                      <Text style={styles.projectTitle}>{project.title}</Text>
                      <RichTextRenderer text={project.description} style={styles.projectDesc} />
                      {project.technologies && project.technologies.length > 0 && (
                        <Text style={styles.techLine}>
                          Technologies Utilized: {project.technologies.join(', ')}
                        </Text>
                      )}
                      {(project.projectUrl || project.sourceCodeUrl) && (
                        <View style={styles.projectLinks}>
                          {project.projectUrl && (
                            <Link src={project.projectUrl} style={styles.projectLink}>Project URL</Link>
                          )}
                          {project.sourceCodeUrl && (
                            <Link src={project.sourceCodeUrl} style={styles.projectLink}>Source Repository</Link>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}
