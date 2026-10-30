# SonAIr Report

Turn screenshots of your SonarCloud projects page into a CSV report. An OpenAI model reads the metrics from the screenshots. If you load an older report, a second model lists what changed.

The app runs only in the browser. There is no backend. It is deployed to GitHub Pages under `/sonAIrReport/`.

## How it works

1. **Extract:** `gpt-5.2` (vision) reads all projects from one or more screenshots. A project that shows up in more than one screenshot is kept once. For each project it reads: name, last analysis, LOC, languages, quality gate, security, reliability, maintainability, hotspots reviewed, coverage and duplications.
2. **Compare** (only with a baseline CSV): `gpt-5-mini` compares the new data with the latest report in the baseline. It lists each changed metric with the old value, new value, delta, a degradation flag (`Yes`, `No` or `Note`) and a short remark. A changed analysis date alone does not count as a change.
3. **Export:** download a CSV. It holds the baseline history plus the new report and diff, so you can load it as the baseline next time.

The app shows the cost and token count of each run. Model names and prices are in `src/utils/openai.ts`.

## Usage

1. Click the gear icon and save your OpenAI API key.
2. Optional: load the CSV from your last run (drag and drop, or click).
3. Add screenshots: drag and drop, click to browse, or paste with Ctrl+V / Cmd+V. If the project list is long, scroll and take more than one screenshot.
4. Click **Analyze**, check the result, then click **Download CSV**.

For good results, the text in the screenshots must be easy to read and the full table width must be visible.

## API key

The key is saved as plain text in your browser's localStorage. The browser sends it only to `api.openai.com`. Anyone who can use this browser profile can read it, so use a key with a spending limit. **Clear** in the settings removes it.

## Development

You need [Bun](https://bun.sh/) and Node 22 (see `.nvmrc`).

```bash
bun install
bun run dev          # dev server
bun run test         # Vitest in watch mode (test:run runs once)
bun run lint         # ESLint
bun run typecheck    # tsc -b
bun run format       # Prettier (format:check only checks)
bun run build        # type check + production build into dist/
```

CI (`.github/workflows/ci.yml`) runs the format check, lint, type check, tests and build. Each push to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`).

Stack: React 19, TypeScript, TanStack Query (for the analysis request), Tailwind CSS v4, Remix Icon, Vite, Vitest.

## CSV format

A file has one or more sections. Each section starts with a `DD.MM.YYYY: title` line, then a column header row. Values that contain a comma or a quote are put in quotes (RFC 4180).

Analysis section:

```csv
29.01.2026: h1 projects
Project,Last analysis,LOC,Languages,Status,Security,Reliability,Maintainability,Hotspots Reviewed,Coverage (%),Duplications (%)
project-name,"29/01/2026, 10:30",12k,"Java, XML",Passed,A (0),A (0),A (150),A (100%),85.0%,2.1%
```

Diff section (a title that contains "Diff"):

```csv
29.01.2026: Diff 15.01.2026
Project,Field,Value_15.01.2026,Value_29.01.2026,Delta,Degradation,Remark
project-name,Coverage (%),82.0%,85.0%,+3.0 pp,No,Coverage significantly improved
project-name,Maintainability,A (120),A (150),+30 Issues,Yes,More code smells - check technical debt
```

## License

MIT
