export type DetectedLanguage = 'csharp' | 'java' | 'python' | 'javascript' | 'go' | 'rust' | 'php' | 'generic';

export type LayerType = 'controller' | 'service' | 'accessor' | 'repository' | 'client' | 'middleware' | 'system' | 'unknown';

export interface StackFrame {
  id: string;
  index: number;
  raw: string;
  method: string;
  classOrNamespace: string;
  moduleOrPackage: string;
  filePath: string;
  fileName: string;
  lineNumber: number | null;
  columnNumber: number | null;
  isAppCode: boolean;
  layer: LayerType;
  isCrashSite: boolean;
  arguments?: string;
}

export interface ParsedLogData {
  rawInput: string;
  format: 'json' | 'repaired_json' | 'raw_trace' | 'plain_log';
  language: DetectedLanguage;
  timestamp?: string;
  level?: string;
  logger?: string;
  exceptionType?: string;
  exceptionMessage?: string;
  exceptionMethod?: string;
  context: Record<string, unknown>;
  frames: StackFrame[];
  executionPath: StackFrame[]; // Chronological: Entry point -> Crash site
  crashSiteFrame?: StackFrame;
  appCrashSiteFrame?: StackFrame;
  rootCause: {
    title: string;
    description: string;
    probableCauses: string[];
    actionableFixes: string[];
    culpritLayer?: string;
    fileAndLine?: string;
  };
}
