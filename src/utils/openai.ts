import type { FullReport, SonarProject, DiffEntry, AnalysisReport, AnalysisCost, AnalysisResult } from '../types'

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail: string } }

// Model configuration with pricing (per 1M tokens)
const MODELS = {
  vision: {
    name: 'gpt-5.2',
    inputPrice: 1.75,  // $ per 1M tokens
    outputPrice: 14.00
  },
  reasoning: {
    name: 'gpt-5-mini',
    inputPrice: 0.25,  // $ per 1M tokens
    outputPrice: 2.00
  }
}

const getTodayDate = (): string => {
  const today = new Date()
  const day = String(today.getDate()).padStart(2, '0')
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const year = today.getFullYear()
  return `${day}.${month}.${year}`
}

const parseJsonResponse = (responseContent: string): unknown => {
  const jsonString = responseContent
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()
  return JSON.parse(jsonString)
}

const calculateCost = (
  inputTokens: number,
  outputTokens: number,
  inputPrice: number,
  outputPrice: number
): number => {
  return (inputTokens * inputPrice + outputTokens * outputPrice) / 1_000_000
}

/**
 * Stage 1: Extract project metrics from screenshots using vision model (gpt-5.2)
 */
const extractMetrics = async (
  images: string[],
  apiKey: string
): Promise<{ projects: SonarProject[]; inputTokens: number; outputTokens: number }> => {
  const todayDate = getTodayDate()
  const imageCount = images.length

  const systemPrompt = `You are an expert code quality analyst specializing in SonarCloud/SonarQube metrics extraction.

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
4. Status must be exactly "Passed" or "Failed"
5. Preserve the exact format of metrics (e.g., "A (0)" not just "A")
6. Keep LOC format as shown (e.g., "12k" not "12000")
7. Coverage and Duplications should include the % symbol
8. If a value is not visible or unclear, use "N/A"
9. Return ONLY valid JSON - no explanations, no markdown code blocks

## Quality Metrics Grading Scale
- A = Best (typically 0 issues or 100% coverage)
- B = Good
- C = Acceptable
- D = Poor
- E = Worst (many issues or 0% coverage)`

  const userPrompt = `## TASK: Extract Project Metrics from ${imageCount > 1 ? `${imageCount} Screenshots` : 'Screenshot'}

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

Extract data for EVERY project visible across ${imageCount > 1 ? 'all screenshots' : 'the screenshot'}. Be precise and accurate.`

  // Build content array with text prompt and all images
  const content: MessageContent[] = [
    { type: 'text', text: userPrompt }
  ]

  for (const imageBase64 of images) {
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
      model: MODELS.vision.name,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content }
      ],
      max_completion_tokens: 8192
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `OpenAI API error (extraction): ${response.status}`)
  }

  const data: OpenAIResponse = await response.json()
  const responseContent = data.choices[0]?.message?.content
  const usage = data.usage

  if (!responseContent) {
    throw new Error('No response content from OpenAI (extraction)')
  }

  try {
    const parsed = parseJsonResponse(responseContent) as { projects: SonarProject[] }
    if (!parsed.projects || !Array.isArray(parsed.projects)) {
      throw new Error('Invalid response structure: missing projects array')
    }
    return {
      projects: parsed.projects,
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0
    }
  } catch (e) {
    console.error('Failed to parse extraction response:', responseContent)
    throw new Error('Failed to parse extraction response. The AI response was not valid JSON. Please try again.')
  }
}

/**
 * Stage 2: Compare metrics and generate diff report using reasoning model (gpt-5-mini)
 */
const compareMetrics = async (
  currentProjects: SonarProject[],
  baselineReport: AnalysisReport,
  apiKey: string
): Promise<{ entries: DiffEntry[]; inputTokens: number; outputTokens: number }> => {
  const todayDate = getTodayDate()

  const systemPrompt = `You are an expert code quality analyst. Your task is to compare two sets of SonarCloud project metrics and identify all meaningful changes.

You will receive:
1. Current project metrics (just extracted)
2. Baseline project metrics (from a previous analysis)

Generate a detailed diff report highlighting what changed.`

  const userPrompt = `## TASK: Compare Project Metrics and Generate Diff Report

### Current Data (${todayDate}):
${JSON.stringify(currentProjects, null, 2)}

### Baseline Data (${baselineReport.date}):
${JSON.stringify(baselineReport.projects, null, 2)}

### Instructions:
Compare EACH project's metrics between current and baseline. For every meaningful change, create a diff entry.

## Required JSON Output Format:

{
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

## Diff Report Guidelines:

**Fields to compare:** LOC, Status, Security, Reliability, Maintainability, Hotspots Reviewed, Coverage (%), Duplications (%)

**IMPORTANT - Exclusions:**
- Do NOT create diff entries for "Last analysis" / "lastAnalysis" date changes - these always change and are not meaningful metrics
- Do NOT include a project in the diff report if it has NO meaningful metric changes. Projects with only date updates should be completely excluded from the diff.

**Sorting:** Group all diff entries by project name (alphabetically). All changes for a single project should appear consecutively.

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

IMPORTANT: Include ALL meaningful changes you detect. Even small metric changes matter for tracking. But exclude date-only changes.

If there are no meaningful changes, return: { "entries": [] }`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODELS.reasoning.name,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_completion_tokens: 8192
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `OpenAI API error (comparison): ${response.status}`)
  }

  const data: OpenAIResponse = await response.json()
  const responseContent = data.choices[0]?.message?.content
  const usage = data.usage

  if (!responseContent) {
    throw new Error('No response content from OpenAI (comparison)')
  }

  try {
    const parsed = parseJsonResponse(responseContent) as { entries: DiffEntry[] }
    if (!parsed.entries || !Array.isArray(parsed.entries)) {
      throw new Error('Invalid response structure: missing entries array')
    }
    return {
      entries: parsed.entries,
      inputTokens: usage?.prompt_tokens ?? 0,
      outputTokens: usage?.completion_tokens ?? 0
    }
  } catch (e) {
    console.error('Failed to parse comparison response:', responseContent)
    throw new Error('Failed to parse comparison response. The AI response was not valid JSON. Please try again.')
  }
}

/**
 * Main function: Two-stage pipeline for screenshot analysis
 * Stage 1: Extract metrics from screenshots (gpt-5.2 - vision)
 * Stage 2: Compare with baseline and generate diff (gpt-5-mini - reasoning)
 */
export const analyzeScreenshot = async (
  images: string[],
  apiKey: string,
  baselineReport?: FullReport
): Promise<AnalysisResult> => {
  const todayDate = getTodayDate()

  // Stage 1: Extract metrics from screenshots using vision model
  const extraction = await extractMetrics(images, apiKey)

  const extractionCost = calculateCost(
    extraction.inputTokens,
    extraction.outputTokens,
    MODELS.vision.inputPrice,
    MODELS.vision.outputPrice
  )

  // Build the new analysis report
  const newAnalysisReport: AnalysisReport = {
    date: todayDate,
    title: 'h1 projects',
    projects: extraction.projects
  }

  // If no baseline, return just the extraction
  if (!baselineReport || baselineReport.analysisReports.length === 0) {
    return {
      report: {
        analysisReports: [newAnalysisReport],
        diffReports: []
      },
      cost: {
        extraction: {
          model: MODELS.vision.name,
          inputTokens: extraction.inputTokens,
          outputTokens: extraction.outputTokens,
          cost: extractionCost
        },
        totalCost: extractionCost
      }
    }
  }

  // Stage 2: Compare with baseline using reasoning model
  const mostRecentBaseline = baselineReport.analysisReports[baselineReport.analysisReports.length - 1]
  const comparison = await compareMetrics(extraction.projects, mostRecentBaseline, apiKey)

  const comparisonCost = calculateCost(
    comparison.inputTokens,
    comparison.outputTokens,
    MODELS.reasoning.inputPrice,
    MODELS.reasoning.outputPrice
  )

  // Build the diff report
  const newDiffReport = {
    date: todayDate,
    comparedTo: mostRecentBaseline.date,
    entries: comparison.entries
  }

  // Combine with historical data
  return {
    report: {
      analysisReports: [...baselineReport.analysisReports, newAnalysisReport],
      diffReports: [...baselineReport.diffReports, newDiffReport]
    },
    cost: {
      extraction: {
        model: MODELS.vision.name,
        inputTokens: extraction.inputTokens,
        outputTokens: extraction.outputTokens,
        cost: extractionCost
      },
      comparison: {
        model: MODELS.reasoning.name,
        inputTokens: comparison.inputTokens,
        outputTokens: comparison.outputTokens,
        cost: comparisonCost
      },
      totalCost: extractionCost + comparisonCost
    }
  }
}
