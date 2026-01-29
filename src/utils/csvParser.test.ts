import { describe, it, expect } from 'vitest';
import { parseCSV, generateCSV } from './csvParser';
import type { FullReport } from '../types';

describe('csvParser', () => {
  describe('parseCSV', () => {
    it('should parse a simple analysis report', () => {
      const csv = `16.01.2026: h1 projects
Project,Last analysis,LOC,Languages,Status,Security,Reliability,Maintainability,Hotspots Reviewed,Coverage (%),Duplications (%)
my-project,"16/01/2026, 10:30",12k,"Java, XML",Passed,A (0),A (0),A (150),A (100%),85.0%,2.1%`;

      const result = parseCSV(csv);

      expect(result.analysisReports).toHaveLength(1);
      expect(result.analysisReports[0].date).toBe('16.01.2026');
      expect(result.analysisReports[0].title).toBe('h1 projects');
      expect(result.analysisReports[0].projects).toHaveLength(1);

      const project = result.analysisReports[0].projects[0];
      expect(project.project).toBe('my-project');
      expect(project.lastAnalysis).toBe('16/01/2026, 10:30');
      expect(project.loc).toBe('12k');
      expect(project.languages).toBe('Java, XML');
      expect(project.status).toBe('Passed');
      expect(project.security).toBe('A (0)');
      expect(project.coverage).toBe('85.0%');
    });

    it('should parse multiple projects', () => {
      const csv = `16.01.2026: h1 projects
Project,Last analysis,LOC,Languages,Status,Security,Reliability,Maintainability,Hotspots Reviewed,Coverage (%),Duplications (%)
project-a,"16/01/2026, 10:30",12k,Java,Passed,A (0),A (0),A (150),A (100%),85.0%,2.1%
project-b,"15/01/2026, 09:00",5k,TypeScript,Failed,C (2),E (40),B (50),E (0.0%),45.0%,5.0%`;

      const result = parseCSV(csv);

      expect(result.analysisReports[0].projects).toHaveLength(2);
      expect(result.analysisReports[0].projects[0].project).toBe('project-a');
      expect(result.analysisReports[0].projects[1].project).toBe('project-b');
      expect(result.analysisReports[0].projects[1].status).toBe('Failed');
    });

    it('should parse diff reports', () => {
      const csv = `16.01.2026: Diff 15.01.2026
Project,Field,Value_15.01.2026,Value_16.01.2026,Delta,Degradation,Remark
my-project,Coverage (%),82.0%,85.0%,+3.0 pp,No,Coverage improved`;

      const result = parseCSV(csv);

      expect(result.diffReports).toHaveLength(1);
      expect(result.diffReports[0].date).toBe('16.01.2026');
      expect(result.diffReports[0].comparedTo).toBe('15.01.2026');
      expect(result.diffReports[0].entries).toHaveLength(1);

      const entry = result.diffReports[0].entries[0];
      expect(entry.project).toBe('my-project');
      expect(entry.field).toBe('Coverage (%)');
      expect(entry.oldValue).toBe('82.0%');
      expect(entry.newValue).toBe('85.0%');
      expect(entry.delta).toBe('+3.0 pp');
      expect(entry.degradation).toBe('No');
      expect(entry.remark).toBe('Coverage improved');
    });

    it('should parse mixed analysis and diff reports', () => {
      const csv = `15.01.2026: h1 projects
Project,Last analysis,LOC,Languages,Status,Security,Reliability,Maintainability,Hotspots Reviewed,Coverage (%),Duplications (%)
my-project,"15/01/2026, 10:00",10k,Java,Passed,A (0),A (0),A (100),A (100%),82.0%,1.0%

16.01.2026: h1 projects
Project,Last analysis,LOC,Languages,Status,Security,Reliability,Maintainability,Hotspots Reviewed,Coverage (%),Duplications (%)
my-project,"16/01/2026, 10:30",12k,Java,Passed,A (0),A (0),A (150),A (100%),85.0%,2.1%

16.01.2026: Diff 15.01.2026
Project,Field,Value_15.01.2026,Value_16.01.2026,Delta,Degradation,Remark
my-project,Coverage (%),82.0%,85.0%,+3.0 pp,No,Coverage improved`;

      const result = parseCSV(csv);

      expect(result.analysisReports).toHaveLength(2);
      expect(result.diffReports).toHaveLength(1);
    });

    it('should handle empty input', () => {
      const result = parseCSV('');

      expect(result.analysisReports).toHaveLength(0);
      expect(result.diffReports).toHaveLength(0);
    });

    it('should handle quoted fields with commas', () => {
      const csv = `16.01.2026: h1 projects
Project,Last analysis,LOC,Languages,Status,Security,Reliability,Maintainability,Hotspots Reviewed,Coverage (%),Duplications (%)
my-project,"16/01/2026, 10:30",12k,"Java, XML, Kotlin",Passed,A (0),A (0),A (150),A (100%),85.0%,2.1%`;

      const result = parseCSV(csv);
      expect(result.analysisReports[0].projects[0].languages).toBe('Java, XML, Kotlin');
    });
  });

  describe('generateCSV', () => {
    it('should generate CSV from analysis report', () => {
      const report: FullReport = {
        analysisReports: [
          {
            date: '16.01.2026',
            title: 'h1 projects',
            projects: [
              {
                project: 'my-project',
                lastAnalysis: '16/01/2026, 10:30',
                loc: '12k',
                languages: 'Java, XML',
                status: 'Passed',
                security: 'A (0)',
                reliability: 'A (0)',
                maintainability: 'A (150)',
                hotspotsReviewed: 'A (100%)',
                coverage: '85.0%',
                duplications: '2.1%',
              },
            ],
          },
        ],
        diffReports: [],
      };

      const csv = generateCSV(report);

      expect(csv).toContain('16.01.2026: h1 projects');
      expect(csv).toContain('my-project');
      expect(csv).toContain('"16/01/2026, 10:30"');
      expect(csv).toContain('"Java, XML"');
      expect(csv).toContain('85.0%');
    });

    it('should generate CSV from diff report', () => {
      const report: FullReport = {
        analysisReports: [],
        diffReports: [
          {
            date: '16.01.2026',
            comparedTo: '15.01.2026',
            entries: [
              {
                project: 'my-project',
                field: 'Coverage (%)',
                oldValue: '82.0%',
                newValue: '85.0%',
                delta: '+3.0 pp',
                degradation: 'No',
                remark: 'Coverage improved',
              },
            ],
          },
        ],
      };

      const csv = generateCSV(report);

      expect(csv).toContain('16.01.2026: Diff 15.01.2026');
      expect(csv).toContain('Project,Field,Value_15.01.2026,Value_16.01.2026,Delta,Degradation,Remark');
      expect(csv).toContain('my-project,Coverage (%),82.0%,85.0%,+3.0 pp,No,Coverage improved');
    });

    it('should roundtrip - parse then generate should produce equivalent data', () => {
      const originalReport: FullReport = {
        analysisReports: [
          {
            date: '16.01.2026',
            title: 'h1 projects',
            projects: [
              {
                project: 'test-project',
                lastAnalysis: '16/01/2026, 10:30',
                loc: '5k',
                languages: 'TypeScript',
                status: 'Passed',
                security: 'A (0)',
                reliability: 'B (5)',
                maintainability: 'A (50)',
                hotspotsReviewed: 'A (100%)',
                coverage: '90.0%',
                duplications: '1.5%',
              },
            ],
          },
        ],
        diffReports: [],
      };

      const csv = generateCSV(originalReport);
      const parsedReport = parseCSV(csv);

      expect(parsedReport.analysisReports).toHaveLength(1);
      expect(parsedReport.analysisReports[0].projects[0].project).toBe('test-project');
      expect(parsedReport.analysisReports[0].projects[0].coverage).toBe('90.0%');
    });
  });
});
