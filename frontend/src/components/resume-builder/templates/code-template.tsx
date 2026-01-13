import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Code template - IDE/Code editor themed with syntax highlighting aesthetic
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 0,
      paddingBottom: 30,
      paddingHorizontal: 0,
      fontSize: 10,
      fontFamily: 'Courier',
      color: '#d4d4d4',
      backgroundColor: '#1e1e1e',
    },
    // Editor header bar (like VS Code title bar)
    editorHeader: {
      backgroundColor: '#323233',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#252526',
    },
    windowControls: {
      flexDirection: 'row',
      gap: 6,
      marginRight: 12,
    },
    windowDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    dotRed: {
      backgroundColor: '#ff5f56',
    },
    dotYellow: {
      backgroundColor: '#ffbd2e',
    },
    dotGreen: {
      backgroundColor: '#27c93f',
    },
    fileName: {
      fontSize: 10,
      color: '#cccccc',
      fontFamily: 'Courier',
    },
    // Tab bar
    tabBar: {
      backgroundColor: '#252526',
      flexDirection: 'row',
      paddingLeft: 0,
    },
    tab: {
      backgroundColor: '#1e1e1e',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRightWidth: 1,
      borderRightColor: '#252526',
      flexDirection: 'row',
      alignItems: 'center',
    },
    tabIcon: {
      fontSize: 8,
      color: accentColor,
      marginRight: 6,
    },
    tabText: {
      fontSize: 9,
      color: '#ffffff',
      fontFamily: 'Courier',
    },
    inactiveTab: {
      backgroundColor: '#2d2d2d',
    },
    inactiveTabText: {
      color: '#808080',
    },
    // Main editor area
    editorContainer: {
      flexDirection: 'row',
      flex: 1,
    },
    // Line numbers gutter
    lineNumbers: {
      width: 40,
      backgroundColor: '#1e1e1e',
      paddingTop: 10,
      paddingRight: 8,
      borderRightWidth: 1,
      borderRightColor: '#333333',
      alignItems: 'flex-end',
    },
    lineNumber: {
      fontSize: 8,
      color: '#858585',
      fontFamily: 'Courier',
      lineHeight: 1.8,
    },
    // Code content area
    codeContent: {
      flex: 1,
      paddingTop: 10,
      paddingLeft: 16,
      paddingRight: 20,
    },
    // Syntax highlighting colors
    keyword: {
      color: '#569cd6',
    },
    string: {
      color: '#ce9178',
    },
    function: {
      color: '#dcdcaa',
    },
    variable: {
      color: '#9cdcfe',
    },
    comment: {
      color: '#6a9955',
    },
    type: {
      color: '#4ec9b0',
    },
    number: {
      color: '#b5cea8',
    },
    property: {
      color: '#9cdcfe',
    },
    operator: {
      color: '#d4d4d4',
    },
    bracket: {
      color: '#ffd700',
    },
    // Code block (for sections)
    codeBlock: {
      marginBottom: 16,
    },
    codeLine: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      lineHeight: 1.8,
    },
    codeText: {
      fontSize: 9,
      fontFamily: 'Courier',
      lineHeight: 1.8,
    },
    // Header section (personal info as class/interface)
    headerBlock: {
      marginBottom: 20,
    },
    interfaceKeyword: {
      fontSize: 10,
      color: '#569cd6',
      fontFamily: 'Courier',
    },
    interfaceName: {
      fontSize: 12,
      color: '#4ec9b0',
      fontFamily: 'Courier',
    },
    propertyName: {
      fontSize: 9,
      color: '#9cdcfe',
      fontFamily: 'Courier',
    },
    propertyValue: {
      fontSize: 9,
      color: '#ce9178',
      fontFamily: 'Courier',
    },
    propertyLink: {
      fontSize: 9,
      color: accentColor,
      fontFamily: 'Courier',
      textDecoration: 'none',
    },
    // Section styling (as functions/methods)
    sectionComment: {
      fontSize: 9,
      color: '#6a9955',
      fontFamily: 'Courier',
      marginBottom: 4,
      marginTop: 12,
    },
    functionKeyword: {
      fontSize: 9,
      color: '#569cd6',
      fontFamily: 'Courier',
    },
    functionName: {
      fontSize: 10,
      color: '#dcdcaa',
      fontFamily: 'Courier',
    },
    paramText: {
      fontSize: 9,
      color: '#9cdcfe',
      fontFamily: 'Courier',
    },
    returnType: {
      fontSize: 9,
      color: '#4ec9b0',
      fontFamily: 'Courier',
    },
    // Content inside function body
    functionBody: {
      paddingLeft: 16,
      marginTop: 4,
      marginBottom: 8,
    },
    // Experience items as array elements
    arrayItem: {
      marginBottom: 10,
      paddingLeft: 8,
    },
    arrayBracket: {
      fontSize: 9,
      color: '#ffd700',
      fontFamily: 'Courier',
    },
    objectBrace: {
      fontSize: 9,
      color: '#da70d6',
      fontFamily: 'Courier',
    },
    itemTitle: {
      fontSize: 10,
      color: '#4ec9b0',
      fontFamily: 'Courier',
    },
    itemSubtitle: {
      fontSize: 9,
      color: accentColor,
      fontFamily: 'Courier',
    },
    itemMeta: {
      fontSize: 8,
      color: '#808080',
      fontFamily: 'Courier',
    },
    itemDescription: {
      fontSize: 9,
      color: '#d4d4d4',
      fontFamily: 'Courier',
      lineHeight: 1.6,
      marginTop: 4,
    },
    bulletItem: {
      fontSize: 9,
      color: '#d4d4d4',
      fontFamily: 'Courier',
      lineHeight: 1.5,
      marginTop: 2,
    },
    bulletMarker: {
      color: '#6a9955',
    },
    // Skills as tags/imports
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 4,
      paddingLeft: 16,
    },
    skillTag: {
      backgroundColor: '#264f78',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 3,
    },
    skillTagExpert: {
      backgroundColor: accentColor,
    },
    skillTagAdvanced: {
      backgroundColor: '#4d4d4d',
      borderWidth: 1,
      borderColor: accentColor,
    },
    skillText: {
      fontSize: 8,
      color: '#ffffff',
      fontFamily: 'Courier',
    },
    // Import statements for skills
    importLine: {
      flexDirection: 'row',
      marginBottom: 2,
    },
    importKeyword: {
      fontSize: 9,
      color: '#c586c0',
      fontFamily: 'Courier',
    },
    importBrace: {
      fontSize: 9,
      color: '#ffd700',
      fontFamily: 'Courier',
    },
    importModule: {
      fontSize: 9,
      color: '#ce9178',
      fontFamily: 'Courier',
    },
    // Projects as exports
    exportKeyword: {
      fontSize: 9,
      color: '#c586c0',
      fontFamily: 'Courier',
    },
    constKeyword: {
      fontSize: 9,
      color: '#569cd6',
      fontFamily: 'Courier',
    },
    projectName: {
      fontSize: 9,
      color: '#4fc1ff',
      fontFamily: 'Courier',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
      paddingLeft: 16,
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
      fontFamily: 'Courier',
      textDecoration: 'none',
    },
    techTags: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 4,
      paddingLeft: 16,
    },
    techTag: {
      fontSize: 7,
      color: '#569cd6',
      fontFamily: 'Courier',
      backgroundColor: '#1e1e1e',
      borderWidth: 1,
      borderColor: '#569cd6',
      paddingVertical: 2,
      paddingHorizontal: 5,
      borderRadius: 2,
    },
    // Education as classes
    classKeyword: {
      fontSize: 9,
      color: '#569cd6',
      fontFamily: 'Courier',
    },
    className: {
      fontSize: 9,
      color: '#4ec9b0',
      fontFamily: 'Courier',
    },
    extendsKeyword: {
      fontSize: 9,
      color: '#569cd6',
      fontFamily: 'Courier',
    },
    parentClass: {
      fontSize: 9,
      color: '#4ec9b0',
      fontFamily: 'Courier',
    },
    // Languages section
    languagesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      paddingLeft: 16,
      marginTop: 4,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    languageName: {
      fontSize: 9,
      color: '#9cdcfe',
      fontFamily: 'Courier',
    },
    languageLevel: {
      fontSize: 8,
      color: '#6a9955',
      fontFamily: 'Courier',
      marginLeft: 4,
    },
    // Certifications as decorators
    decoratorSymbol: {
      fontSize: 9,
      color: '#dcdcaa',
      fontFamily: 'Courier',
    },
    certName: {
      fontSize: 9,
      color: '#dcdcaa',
      fontFamily: 'Courier',
    },
    certOrg: {
      fontSize: 8,
      color: '#ce9178',
      fontFamily: 'Courier',
    },
    certDate: {
      fontSize: 8,
      color: '#6a9955',
      fontFamily: 'Courier',
    },
    // Minimap (decorative sidebar)
    minimap: {
      width: 50,
      backgroundColor: '#252526',
      paddingTop: 10,
      paddingHorizontal: 4,
    },
    minimapLine: {
      height: 2,
      marginBottom: 2,
      borderRadius: 1,
    },
    minimapLineShort: {
      width: '60%',
    },
    minimapLineMedium: {
      width: '80%',
    },
    minimapLineFull: {
      width: '100%',
    },
    // Status bar
    statusBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#007acc',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
      paddingHorizontal: 10,
    },
    statusItem: {
      fontSize: 7,
      color: '#ffffff',
      fontFamily: 'Courier',
    },
  })

interface CodeTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function CodeTemplate({ data, settings }: CodeTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Create a file name from the person's name
  const fileName = `${personalInfo.firstName?.toLowerCase() || 'resume'}_${personalInfo.lastName?.toLowerCase() || 'cv'}.tsx`

  // Generate line numbers based on content
  let lineCount = 1

  // Group skills by level
  const expertSkills = skills.filter(s => s.level === 'EXPERT')
  const advancedSkills = skills.filter(s => s.level === 'ADVANCED')
  const otherSkills = skills.filter(s => s.level !== 'EXPERT' && s.level !== 'ADVANCED')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Editor Header Bar */}
        <View style={styles.editorHeader}>
          <View style={styles.windowControls}>
            <View style={[styles.windowDot, styles.dotRed]} />
            <View style={[styles.windowDot, styles.dotYellow]} />
            <View style={[styles.windowDot, styles.dotGreen]} />
          </View>
          <Text style={styles.fileName}>{fileName}</Text>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <View style={styles.tab}>
            <Text style={styles.tabIcon}>TS</Text>
            <Text style={styles.tabText}>{fileName}</Text>
          </View>
          <View style={[styles.tab, styles.inactiveTab]}>
            <Text style={[styles.tabText, styles.inactiveTabText]}>skills.json</Text>
          </View>
          <View style={[styles.tab, styles.inactiveTab]}>
            <Text style={[styles.tabText, styles.inactiveTabText]}>projects.md</Text>
          </View>
        </View>

        {/* Main Editor Area */}
        <View style={styles.editorContainer}>
          {/* Line Numbers */}
          <View style={styles.lineNumbers}>
            {Array.from({ length: 85 }, (_, i) => (
              <Text key={i} style={styles.lineNumber}>{i + 1}</Text>
            ))}
          </View>

          {/* Code Content */}
          <View style={styles.codeContent}>
            {/* Imports (Skills as imports) */}
            {skills.length > 0 && (
              <View style={styles.codeBlock}>
                <Text style={styles.sectionComment}>{'// Tech Stack & Skills'}</Text>
                {expertSkills.length > 0 && (
                  <View style={styles.importLine}>
                    <Text style={styles.importKeyword}>{'import '}</Text>
                    <Text style={styles.importBrace}>{'{ '}</Text>
                    <Text style={styles.propertyValue}>
                      {expertSkills.map(s => s.name).join(', ')}
                    </Text>
                    <Text style={styles.importBrace}>{' }'}</Text>
                    <Text style={styles.importKeyword}>{' from '}</Text>
                    <Text style={styles.importModule}>{'"@core/expert"'}</Text>
                  </View>
                )}
                {advancedSkills.length > 0 && (
                  <View style={styles.importLine}>
                    <Text style={styles.importKeyword}>{'import '}</Text>
                    <Text style={styles.importBrace}>{'{ '}</Text>
                    <Text style={styles.propertyValue}>
                      {advancedSkills.map(s => s.name).join(', ')}
                    </Text>
                    <Text style={styles.importBrace}>{' }'}</Text>
                    <Text style={styles.importKeyword}>{' from '}</Text>
                    <Text style={styles.importModule}>{'"@skills/advanced"'}</Text>
                  </View>
                )}
                {otherSkills.length > 0 && (
                  <View style={styles.importLine}>
                    <Text style={styles.importKeyword}>{'import '}</Text>
                    <Text style={styles.importBrace}>{'{ '}</Text>
                    <Text style={styles.propertyValue}>
                      {otherSkills.map(s => s.name).join(', ')}
                    </Text>
                    <Text style={styles.importBrace}>{' }'}</Text>
                    <Text style={styles.importKeyword}>{' from '}</Text>
                    <Text style={styles.importModule}>{'"@skills/toolkit"'}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Personal Info as Interface/Type */}
            <View style={styles.headerBlock}>
              <Text style={styles.sectionComment}>{'// Personal Information'}</Text>
              <View style={styles.codeLine}>
                <Text style={styles.interfaceKeyword}>{'interface '}</Text>
                <Text style={styles.interfaceName}>Developer </Text>
                <Text style={styles.objectBrace}>{'{'}</Text>
              </View>
              <View style={styles.functionBody}>
                <View style={styles.codeLine}>
                  <Text style={styles.propertyName}>name</Text>
                  <Text style={styles.operator}>: </Text>
                  <Text style={styles.propertyValue}>
                    {`"${personalInfo.firstName} ${personalInfo.lastName}"`}
                  </Text>
                </View>
                {personalInfo.headline && (
                  <View style={styles.codeLine}>
                    <Text style={styles.propertyName}>role</Text>
                    <Text style={styles.operator}>: </Text>
                    <Text style={styles.propertyValue}>{`"${personalInfo.headline}"`}</Text>
                  </View>
                )}
                {personalInfo.email && (
                  <View style={styles.codeLine}>
                    <Text style={styles.propertyName}>email</Text>
                    <Text style={styles.operator}>: </Text>
                    <Link src={`mailto:${personalInfo.email}`} style={styles.propertyLink}>
                      {`"${personalInfo.email}"`}
                    </Link>
                  </View>
                )}
                {personalInfo.phone && (
                  <View style={styles.codeLine}>
                    <Text style={styles.propertyName}>phone</Text>
                    <Text style={styles.operator}>: </Text>
                    <Text style={styles.propertyValue}>{`"${personalInfo.phone}"`}</Text>
                  </View>
                )}
                {personalInfo.location && (
                  <View style={styles.codeLine}>
                    <Text style={styles.propertyName}>location</Text>
                    <Text style={styles.operator}>: </Text>
                    <Text style={styles.propertyValue}>{`"${personalInfo.location}"`}</Text>
                  </View>
                )}
                {personalInfo.githubUrl && (
                  <View style={styles.codeLine}>
                    <Text style={styles.propertyName}>github</Text>
                    <Text style={styles.operator}>: </Text>
                    <Link src={personalInfo.githubUrl} style={styles.propertyLink}>
                      {`"${personalInfo.githubUrl}"`}
                    </Link>
                  </View>
                )}
                {personalInfo.linkedinUrl && (
                  <View style={styles.codeLine}>
                    <Text style={styles.propertyName}>linkedin</Text>
                    <Text style={styles.operator}>: </Text>
                    <Link src={personalInfo.linkedinUrl} style={styles.propertyLink}>
                      {`"${personalInfo.linkedinUrl}"`}
                    </Link>
                  </View>
                )}
                {personalInfo.portfolioUrl && (
                  <View style={styles.codeLine}>
                    <Text style={styles.propertyName}>portfolio</Text>
                    <Text style={styles.operator}>: </Text>
                    <Link src={personalInfo.portfolioUrl} style={styles.propertyLink}>
                      {`"${personalInfo.portfolioUrl}"`}
                    </Link>
                  </View>
                )}
              </View>
              <Text style={styles.objectBrace}>{'}'}</Text>
            </View>

            {/* Summary as JSDoc comment */}
            {personalInfo.summary && (
              <View style={styles.codeBlock}>
                <Text style={styles.sectionComment}>{'/**'}</Text>
                <Text style={styles.sectionComment}>{' * About'}</Text>
                <View style={{ paddingLeft: 8, marginBottom: 4 }}>
                  <RichTextRenderer text={personalInfo.summary} style={styles.comment} />
                </View>
                <Text style={styles.sectionComment}>{' */'}</Text>
              </View>
            )}

            {/* Experience as function declarations */}
            {experience.length > 0 && (
              <View style={styles.codeBlock}>
                <Text style={styles.sectionComment}>{'// Work Experience'}</Text>
                {experience.map((exp, index) => (
                  <View key={exp.id} style={styles.arrayItem}>
                    <View style={styles.codeLine}>
                      <Text style={styles.functionKeyword}>{'async function '}</Text>
                      <Text style={styles.functionName}>
                        {exp.title.replace(/\s+/g, '')}
                      </Text>
                      <Text style={styles.bracket}>{'('}</Text>
                      <Text style={styles.paramText}>{exp.companyName}</Text>
                      <Text style={styles.bracket}>{')'}</Text>
                      <Text style={styles.operator}>{': '}</Text>
                      <Text style={styles.returnType}>Promise</Text>
                      <Text style={styles.operator}>{'<'}</Text>
                      <Text style={styles.returnType}>Success</Text>
                      <Text style={styles.operator}>{'>'}</Text>
                      <Text style={styles.objectBrace}>{' {'}</Text>
                    </View>
                    <View style={styles.functionBody}>
                      <View style={styles.codeLine}>
                        <Text style={styles.comment}>
                          {'// '}{formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                          {exp.location ? ` | ${exp.location}` : ''}
                        </Text>
                      </View>
                      {exp.description && (
                        <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                      )}
                      {exp.achievements && exp.achievements.length > 0 && (
                        <View style={{ marginTop: 4 }}>
                          {exp.achievements.map((achievement, idx) => (
                            <Text key={idx} style={styles.bulletItem}>
                              <Text style={styles.bulletMarker}>{'>>> '}</Text>
                              {achievement}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                    <Text style={styles.objectBrace}>{'}'}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Projects as exported constants */}
            {projects.length > 0 && (
              <View style={styles.codeBlock}>
                <Text style={styles.sectionComment}>{'// Featured Projects'}</Text>
                {projects.map((project) => (
                  <View key={project.id} style={styles.arrayItem}>
                    <View style={styles.codeLine}>
                      <Text style={styles.exportKeyword}>{'export '}</Text>
                      <Text style={styles.constKeyword}>{'const '}</Text>
                      <Text style={styles.projectName}>
                        {project.title.replace(/\s+/g, '_')}
                      </Text>
                      <Text style={styles.operator}>{' = '}</Text>
                      <Text style={styles.objectBrace}>{'{'}</Text>
                    </View>
                    <View style={styles.functionBody}>
                      <View style={styles.codeLine}>
                        <Text style={styles.propertyName}>description</Text>
                        <Text style={styles.operator}>: </Text>
                        <Text style={styles.propertyValue}>{`"${project.description}"`}</Text>
                      </View>
                      {project.technologies && project.technologies.length > 0 && (
                        <View style={styles.codeLine}>
                          <Text style={styles.propertyName}>stack</Text>
                          <Text style={styles.operator}>: </Text>
                          <Text style={styles.arrayBracket}>{'['}</Text>
                          <Text style={styles.propertyValue}>
                            {project.technologies.map(t => `"${t}"`).join(', ')}
                          </Text>
                          <Text style={styles.arrayBracket}>{']'}</Text>
                        </View>
                      )}
                      {(project.projectUrl || project.sourceCodeUrl) && (
                        <View style={styles.projectLinks}>
                          {project.sourceCodeUrl && (
                            <Link src={project.sourceCodeUrl} style={styles.projectLink}>
                              [source]
                            </Link>
                          )}
                          {project.projectUrl && (
                            <Link src={project.projectUrl} style={styles.projectLink}>
                              [demo]
                            </Link>
                          )}
                        </View>
                      )}
                    </View>
                    <Text style={styles.objectBrace}>{'}'}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Education as classes */}
            {education.length > 0 && (
              <View style={styles.codeBlock}>
                <Text style={styles.sectionComment}>{'// Education'}</Text>
                {education.map((edu) => (
                  <View key={edu.id} style={styles.arrayItem}>
                    <View style={styles.codeLine}>
                      <Text style={styles.classKeyword}>{'class '}</Text>
                      <Text style={styles.className}>
                        {edu.degree.replace(/\s+/g, '')}_{edu.fieldOfStudy.replace(/\s+/g, '')}
                      </Text>
                      <Text style={styles.extendsKeyword}>{' extends '}</Text>
                      <Text style={styles.parentClass}>{edu.institution.replace(/\s+/g, '')}</Text>
                      <Text style={styles.objectBrace}>{' {'}</Text>
                    </View>
                    <View style={styles.functionBody}>
                      <Text style={styles.comment}>
                        {'// '}{formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                        {edu.grade ? ` | GPA: ${edu.grade}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.objectBrace}>{'}'}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Languages */}
            {languages && languages.length > 0 && (
              <View style={styles.codeBlock}>
                <Text style={styles.sectionComment}>{'// Languages'}</Text>
                <View style={styles.codeLine}>
                  <Text style={styles.constKeyword}>{'const '}</Text>
                  <Text style={styles.variable}>languages</Text>
                  <Text style={styles.operator}>{' = '}</Text>
                  <Text style={styles.objectBrace}>{'{'}</Text>
                </View>
                <View style={styles.languagesRow}>
                  {languages.map((lang, idx) => (
                    <View key={lang.id} style={styles.languageItem}>
                      <Text style={styles.languageName}>{lang.name}</Text>
                      {lang.proficiency && (
                        <Text style={styles.languageLevel}>
                          {': '}{lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()}
                        </Text>
                      )}
                      {idx < languages.length - 1 && <Text style={styles.operator}>{','}</Text>}
                    </View>
                  ))}
                </View>
                <Text style={styles.objectBrace}>{'}'}</Text>
              </View>
            )}

            {/* Certifications as decorators */}
            {certifications.length > 0 && (
              <View style={styles.codeBlock}>
                <Text style={styles.sectionComment}>{'// Certifications'}</Text>
                {certifications.map((cert) => (
                  <View key={cert.id} style={{ marginBottom: 4 }}>
                    <View style={styles.codeLine}>
                      <Text style={styles.decoratorSymbol}>@</Text>
                      <Text style={styles.certName}>{cert.name.replace(/\s+/g, '')}</Text>
                      <Text style={styles.bracket}>{'('}</Text>
                      <Text style={styles.certOrg}>{`"${cert.issuingOrganization}"`}</Text>
                      <Text style={styles.bracket}>{')'}</Text>
                    </View>
                    <Text style={styles.certDate}>
                      {'  // Issued: '}{formatDate(cert.issueDate)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Minimap */}
          <View style={styles.minimap}>
            {Array.from({ length: 40 }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.minimapLine,
                  i % 3 === 0 ? styles.minimapLineShort : (i % 2 === 0 ? styles.minimapLineFull : styles.minimapLineMedium),
                  { backgroundColor: i % 5 === 0 ? settings.primaryColor : '#4d4d4d' }
                ]}
              />
            ))}
          </View>
        </View>

        {/* Status Bar */}
        <View style={styles.statusBar}>
          <Text style={styles.statusItem}>TypeScript React</Text>
          <Text style={styles.statusItem}>UTF-8</Text>
          <Text style={styles.statusItem}>
            {skills.length} Skills | {experience.length} Roles | {projects.length} Projects
          </Text>
        </View>
      </Page>
    </Document>
  )
}
