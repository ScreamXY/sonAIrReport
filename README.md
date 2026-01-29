# SonAIr Report

AI-powered SonarCloud analysis tool. Upload screenshots of your SonarCloud dashboard, and GPT-4o extracts project metrics automatically. Compare with previous reports to track quality changes over time.

## Features

- **Screenshot Analysis**: Upload one or multiple screenshots from SonarCloud and let AI extract all project metrics
- **Multi-Screenshot Support**: Scroll through your SonarCloud page and capture multiple screenshots - the AI combines and deduplicates the data
- **Historical Comparison**: Load a previous CSV report and compare it with new screenshots to track changes
- **Change Detection**: Automatically detects changes in metrics and provides remarks explaining the impact
- **CSV Export**: Download reports in CSV format for record-keeping and further analysis
- **Clipboard Paste**: Quickly paste screenshots directly from clipboard (Ctrl+V / Cmd+V)
- **Local Storage**: API key stored securely in browser's localStorage - never sent to any server except OpenAI

## How It Works

1. **Screenshot Capture**: Take screenshots of your SonarCloud projects page
2. **AI Extraction**: GPT-4o-mini analyzes the screenshots and extracts:
   - Project name
   - Last analysis date
   - Lines of Code (LOC)
   - Programming languages
   - Quality Gate status (Passed/Failed)
   - Security rating (A-E) with issue count
   - Reliability rating (A-E) with issue count
   - Maintainability rating (A-E) with code smell count
   - Security Hotspots reviewed percentage
   - Test coverage percentage
   - Code duplication percentage

3. **Comparison**: If you load a previous CSV report, the AI compares current data with the baseline and generates a diff report showing:
   - Which metrics changed
   - Previous vs current values
   - Delta (change amount)
   - Whether it's a degradation (Yes/No/Note)
   - Remark explaining the change

## Usage

### First Time Analysis

1. Open the app and configure your OpenAI API key in Settings (gear icon)
2. Take screenshot(s) of your SonarCloud projects page
3. Upload or paste the screenshot(s) into the app
4. Click "Analyze" to extract the data
5. Download the CSV report for your records

### Comparing with Previous Data

1. Load your previous CSV report (drag & drop or click to browse)
2. Take new screenshot(s) of your current SonarCloud state
3. Upload the screenshot(s)
4. Click "Analyze" - the AI will compare and generate a diff report
5. Review the changes and download the updated CSV

### Tips for Best Results

- **Multiple Screenshots**: If your project list is long, scroll through the page and take multiple screenshots. The AI will combine them and remove duplicates.
- **Clear Screenshots**: Ensure the text is readable in your screenshots
- **Full Width**: Capture the full width of the table to include all columns

## Tech Stack

- **React 19** with TypeScript
- **TanStack Query** for API state management
- **Tailwind CSS v4** for styling
- **Vite** for bundling
- **OpenAI GPT-4o-mini** for image analysis
- **Bun** as package manager and runtime

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) installed
- OpenAI API key with access to GPT-4o-mini

### Installation

```bash
# Clone the repository
git clone https://github.com/AdrianBuworworker/sonAIrReport.git
cd sonAIrReport

# Install dependencies
bun install

# Start development server
bun run dev
```

### Build for Production

```bash
bun run build
```

The built files will be in the `dist` folder.

## CSV Format

### Analysis Report Section

```csv
29.01.2026: h1 projects
Project,Last analysis,LOC,Languages,Status,Security,Reliability,Maintainability,Hotspots Reviewed,Coverage (%),Duplications (%)
project-name,"29/01/2026, 10:30",12k,"Java, XML",Passed,A (0),A (0),A (150),A (100%),85.0%,2.1%
```

### Diff Report Section

```csv
29.01.2026: Diff 15.01.2026
Project,Field,Value_15.01.2026,Value_29.01.2026,Delta,Degradation,Remark
project-name,Coverage (%),82.0%,85.0%,+3.0 pp,No,Coverage significantly improved
project-name,Maintainability,A (120),A (150),+30 Issues,Yes,More code smells - check technical debt
```

## Configuration

### OpenAI API Key

1. Click the Settings icon (gear) in the top right
2. Enter your OpenAI API key
3. Click Save

The key is stored in your browser's localStorage and is only sent directly to OpenAI's API.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
