import type { FullReport } from '../types'

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail: string } }

const getTodayDate = (): string => {
  const today = new Date()
  const day = String(today.getDate()).padStart(2, '0')
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const year = today.getFullYear()
  return `${day}.${month}.${year}`
}

export const analyzeScreenshot = async (
  images: string[],
  apiKey: string,
  baselineReport?: FullReport
): Promise<FullReport> => {
  const todayDate = getTodayDate()
  const imageCount = images.length

  const baseSystemPrompt = `You are an expert code quality analyst specializing in SonarCloud/SonarQube metrics extraction.

Your task is to carefully analyze screenshots from SonarCloud project dashboards and extract ALL visible project quality metrics with 100% accuracy.

${imageCount > 1 ? `IMPORTANT: You are receiving ${imageCount} screenshots from the same page (scrolled). Combine data from ALL screenshots into a single unified report. Remove any duplicate projects that appear in multiple screenshots.` : ''}

## What to Extract from SonarCloud Screenshots

SonarCloud project lists typically show these columns:
- **Project name**: The name/identifier of the project
- **Last analysis**: Date and time of the most recent analysis (format: DD/MM/YYYY, HH:MM)
- **LOC (Lines of Code)**: Usually shown as "12k", "1.1k", "44k" etc.
- **Languages**: Programming languages used (e.g., "Java, XML", "TypeScript, HTML")
- **Quality Gate Status**: "Passed" (green) or "Failed" (red)
- **Security**: Letter grade A-E with issue count in parentheses, e.g., "A (0)", "C (2)"
- **Reliability**: Letter grade A-E with issue count, e.g., "A (0)", "E (40)"
- **Maintainability**: Letter grade A-E with code smell count, e.g., "A (246)"
- **Security Hotspots Reviewed**: Percentage with letter grade, e.g., "A (100%)", "E (0.0%)"
- **Coverage**: Test coverage percentage, e.g., "58.9%", "77.1%"
- **Duplications**: Code duplication percentage, e.g., "3.8%", "0.0%"

## Important Rules

1. Extract ALL projects visible across ALL screenshots - do not skip any
2. DEDUPLICATE: If a project appears in multiple screenshots, include it only once
3. Be PRECISE with values - copy exactly what you see
4. Use "${todayDate}" as the report date
5. Status must be exactly "Passed" or "Failed"
6. Preserve the exact format of metrics (e.g., "A (0)" not just "A")
7. Keep LOC format as shown (e.g., "12k" not "12000")
8. Coverage and Duplications should include the % symbol
9. If a value is not visible or unclear, use "N/A"
10. Return ONLY valid JSON - no explanations, no markdown code blocks

## Quality Metrics Grading Scale
- A = Best (typically 0 issues or 100% coverage)
- B = Good
- C = Acceptable
- D = Poor
- E = Worst (many issues or 0% coverage)`

  let userPrompt: string

  if (baselineReport && baselineReport.analysisReports.length > 0) {
    const mostRecentReport = baselineReport.analysisReports[baselineReport.analysisReports.length - 1]
    const previousProjects = JSON.stringify(mostRecentReport.projects, null, 2)

    userPrompt = `## TASK: Analyze ${imageCount > 1 ? `${imageCount} Screenshots` : 'Screenshot'} and Compare with Previous Data

### Step 1: Extract Current Data from ${imageCount > 1 ? 'ALL Screenshots' : 'Screenshot'}
${imageCount > 1 ? `You have ${imageCount} screenshots showing different parts of the same SonarCloud page. Extract ALL projects from ALL screenshots and combine them into one list. Remove duplicates.` : 'Look at the SonarCloud screenshot and extract ALL project metrics you can see.'}

### Step 2: Compare with Baseline Data
Compare EACH project's metrics with the baseline data from ${mostRecentReport.date}:

${previousProjects}

### Step 3: Generate Diff Report with Remarks
For EVERY metric that changed, create a diff entry with your analysis.

## Required JSON Output Format:

{
  "analysisReports": [
    {
      "date": "${todayDate}",
      "title": "h1 projects",
      "projects": [
        // ALL projects extracted from ${imageCount > 1 ? 'all screenshots (deduplicated)' : 'the screenshot'}
      ]
    }
  ],
  "diffReports": [
    {
      "date": "${todayDate}",
      "comparedTo": "${mostRecentReport.date}",
      "entries": [
        {
          "project": "project-name",
          "field": "Coverage (%)",
          "oldValue": "85.6%",
          "newValue": "87.0%",
          "delta": "+1.4 pp",
          "degradation": "No",
          "remark": "Test coverage improved - good progress"
        }
      ]
    }
  ]
}

## Diff Report Guidelines:

**Fields to compare:** LOC, Status, Security, Reliability, Maintainability, Hotspots Reviewed, Coverage (%), Duplications (%)

**Delta format examples:**
- LOC: "+2k", "-500"
- Coverage: "+1.4 pp", "-0.5 pp" (percentage points)
- Issues/Smells: "+23 Issues", "-5 Issues"
- Status: "Failed → Passed", "Passed → Failed"
- Grades: "C → A", "A → E"

**Degradation values:**
- "Yes" = Quality got worse (more issues, less coverage, worse grade)
- "No" = Quality improved or stayed same
- "Note" = Neutral observation (e.g., LOC growth is neither good nor bad)

**Remark guidelines (in English):**
- Be specific about what changed and why it matters
- Examples:
  - "Coverage significantly improved"
  - "Reliability issues increased - fix bugs"
  - "Codebase grew, coverage remained stable"
  - "Security hotspots not reviewed - risk"
  - "Technical debt reduced"
  - "Status improved - Quality Gate passed"

IMPORTANT: Include ALL changes you detect. Even small changes matter for tracking.`
  } else {
    userPrompt = `## TASK: Extract Project Metrics from ${imageCount > 1 ? `${imageCount} Screenshots` : 'Screenshot'}

${imageCount > 1 ? `You have ${imageCount} screenshots showing different parts of the same SonarCloud page (scrolled view). Extract ALL projects from ALL screenshots and combine them into one unified list. If a project appears in multiple screenshots, include it only once.` : 'Analyze this SonarCloud screenshot and extract ALL project quality metrics.'}

Look carefully at every row in the project list and extract:
- Project name
- Last analysis date/time
- Lines of code (LOC)
- Programming languages
- Quality gate status (Passed/Failed)
- Security rating and issues
- Reliability rating and issues
- Maintainability rating and code smells
- Security hotspots reviewed percentage
- Test coverage percentage
- Code duplication percentage

## Required JSON Output Format:

{
  "analysisReports": [
    {
      "date": "${todayDate}",
      "title": "h1 projects",
      "projects": [
        {
          "project": "project-name",
          "lastAnalysis": "DD/MM/YYYY, HH:MM",
          "loc": "12k",
          "languages": "Java, XML",
          "status": "Passed",
          "security": "A (0)",
          "reliability": "E (40)",
          "maintainability": "A (246)",
          "hotspotsReviewed": "E (0.0%)",
          "coverage": "58.9%",
          "duplications": "3.8%"
        }
      ]
    }
  ],
  "diffReports": []
}

Extract data for EVERY project visible across ${imageCount > 1 ? 'all screenshots' : 'the screenshot'}. Be precise and accurate.`
  }

  // Build content array with text prompt and all images
  const content: MessageContent[] = [
    {
      type: 'text',
      text: userPrompt
    }
  ]

  // Add all images to the content
  for (let i = 0; i < images.length; i++) {
    const imageBase64 = images[i]
    content.push({
      type: 'image_url',
      image_url: {
        url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`,
        detail: 'high'
      }
    })
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: baseSystemPrompt
        },
        {
          role: 'user',
          content
        }
      ],
      max_tokens: 8192,
      temperature: 0.1
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`)
  }

  const data: OpenAIResponse = await response.json()
  const responseContent = data.choices[0]?.message?.content

  if (!responseContent) {
    throw new Error('No response content from OpenAI')
  }

  // Parse the JSON response
  try {
    // Remove markdown code blocks if present
    const jsonString = responseContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(jsonString) as FullReport

    // Validate the parsed data
    if (!parsed.analysisReports || !Array.isArray(parsed.analysisReports)) {
      throw new Error('Invalid response structure: missing analysisReports')
    }

    // Ensure diffReports exists
    if (!parsed.diffReports) {
      parsed.diffReports = []
    }

    // Combine baseline reports with new analysis for complete history
    if (baselineReport) {
      return {
        analysisReports: [...baselineReport.analysisReports, ...parsed.analysisReports],
        diffReports: [...baselineReport.diffReports, ...parsed.diffReports]
      }
    }

    return parsed
  } catch (e) {
    console.error('Failed to parse OpenAI response:', responseContent)
    throw new Error('Failed to parse analysis response. The AI response was not valid JSON. Please try again.')
  }
}
