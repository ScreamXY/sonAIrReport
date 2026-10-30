import type { AnalysisReport, AnalysisResult, DiffEntry, FullReport, ModelUsage, SonarProject } from '../types';

interface Model {
  name: string;
  // USD per 1M tokens
  inputPrice: number;
  outputPrice: number;
}

const VISION_MODEL: Model = { name: 'gpt-5.2', inputPrice: 1.75, outputPrice: 14.0 };
const REASONING_MODEL: Model = { name: 'gpt-5-mini', inputPrice: 0.25, outputPrice: 2.0 };
const MAX_COMPLETION_TOKENS = 8192;
const REPORT_TITLE = 'h1 projects';

type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string; detail: 'high' } };

interface ChatMessage {
  role: 'system' | 'user';
  content: string | MessageContent[];
}

interface ChatCompletionResponse {
  choices: { message: { content: string | null } }[];
  usage?: { prompt_tokens: number; completion_tokens: number };
}

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
};

/** Sends one chat request and returns the JSON array found under `field` in the answer. */
const requestJsonArray = async <T>(
  apiKey: string,
  model: Model,
  messages: ChatMessage[],
  field: string,
  stage: string,
): Promise<{ items: T[]; usage: ModelUsage }> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: model.name, messages, max_completion_tokens: MAX_COMPLETION_TOKENS }),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(errorBody?.error?.message || `OpenAI API error (${stage}): ${response.status}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error(`No response content from OpenAI (${stage})`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content.replace(/```(json)?\n?/g, '').trim());
  } catch {
    console.error(`Failed to parse ${stage} response:`, content);
    throw new Error(`Failed to parse ${stage} response. The AI response was not valid JSON. Please try again.`);
  }
  const items = (parsed as Record<string, unknown> | null)?.[field];
  if (!Array.isArray(items)) {
    console.error(`Invalid ${stage} response:`, content);
    throw new Error(`Invalid ${stage} response: missing ${field} array. Please try again.`);
  }

  const inputTokens = data.usage?.prompt_tokens ?? 0;
  const outputTokens = data.usage?.completion_tokens ?? 0;
  return {
    items: items as T[],
    usage: {
      model: model.name,
      inputTokens,
      outputTokens,
      cost: (inputTokens * model.inputPrice + outputTokens * model.outputPrice) / 1_000_000,
    },
  };
};

const extractMetrics = (images: string[], apiKey: string) => {
  const imageCount = images.length;

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
- E = Worst (many issues or 0% coverage)`;

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

Extract data for EVERY project visible across ${imageCount > 1 ? 'all screenshots' : 'the screenshot'}. Be precise and accurate.`;

  const content: MessageContent[] = [
    { type: 'text', text: userPrompt },
    ...images.map((url): MessageContent => ({ type: 'image_url', image_url: { url, detail: 'high' } })),
  ];

  return requestJsonArray<SonarProject>(
    apiKey,
    VISION_MODEL,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content },
    ],
    'projects',
    'extraction',
  );
};

const compareMetrics = (
  currentProjects: SonarProject[],
  baselineReport: AnalysisReport,
  today: string,
  apiKey: string,
) => {
  const systemPrompt = `You are an expert code quality analyst. Your task is to compare two sets of SonarCloud project metrics and identify all meaningful changes.

You will receive:
1. Current project metrics (just extracted)
2. Baseline project metrics (from a previous analysis)

Generate a detailed diff report highlighting what changed.`;

  const userPrompt = `## TASK: Compare Project Metrics and Generate Diff Report

### Current Data (${today}):
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

If there are no meaningful changes, return: { "entries": [] }`;

  return requestJsonArray<DiffEntry>(
    apiKey,
    REASONING_MODEL,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    'entries',
    'comparison',
  );
};

/**
 * Two-stage pipeline: the vision model extracts metrics from the screenshots, then, if a
 * baseline exists, the cheaper reasoning model compares them with the latest baseline report.
 */
export const analyzeScreenshot = async (
  images: string[],
  apiKey: string,
  baselineReport: FullReport | null,
): Promise<AnalysisResult> => {
  const today = formatDate(new Date());
  const extraction = await extractMetrics(images, apiKey);
  const newAnalysisReport: AnalysisReport = { date: today, title: REPORT_TITLE, projects: extraction.items };

  const baseline = baselineReport?.analysisReports.at(-1);
  if (baselineReport === null || baseline === undefined) {
    return {
      report: { analysisReports: [newAnalysisReport], diffReports: [] },
      cost: { extraction: extraction.usage, comparison: null, totalCost: extraction.usage.cost },
    };
  }

  const comparison = await compareMetrics(extraction.items, baseline, today, apiKey);
  return {
    report: {
      analysisReports: [...baselineReport.analysisReports, newAnalysisReport],
      diffReports: [
        ...baselineReport.diffReports,
        { date: today, comparedTo: baseline.date, entries: comparison.items },
      ],
    },
    cost: {
      extraction: extraction.usage,
      comparison: comparison.usage,
      totalCost: extraction.usage.cost + comparison.usage.cost,
    },
  };
};
