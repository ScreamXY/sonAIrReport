export type SonarProject = {
  project: string;
  lastAnalysis: string;
  loc: string;
  languages: string;
  status: 'Passed' | 'Failed';
  security: string;
  reliability: string;
  maintainability: string;
  hotspotsReviewed: string;
  coverage: string;
  duplications: string;
};

export type AnalysisReport = {
  date: string;
  title: string;
  projects: SonarProject[];
};

export type DiffEntry = {
  project: string;
  field: string;
  oldValue: string;
  newValue: string;
  delta: string;
  degradation: string;
  remark?: string;
};

export type DiffReport = {
  date: string;
  comparedTo: string;
  entries: DiffEntry[];
};

export type FullReport = {
  analysisReports: AnalysisReport[];
  diffReports: DiffReport[];
};

export type Settings = {
  apiKey: string;
};

export type AnalysisCost = {
  extraction: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  comparison?: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
  totalCost: number;
};

export type AnalysisResult = {
  report: FullReport;
  cost: AnalysisCost;
};
