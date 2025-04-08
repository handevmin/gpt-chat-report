export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatHistory {
  messages: Message[];
  code?: string;
  timestamp?: string;
}

export interface ReportData {
  flow: string;
  coreExpressions: string;
  emotionalSequence: string;
  restorationTrigger: string;
  retrievalInstruction: string;
  contextTimestamp: string;
  feedbackSignal: string;
  responseStyleSuggestion: string;
  userStyleIndicator: string;
  nextMemoryLabel: string;
  continuationContext: string;
  contextVariationHint: string;
  aiSelfModulationTip: string;
  responseDirectionOptions: string;
  reportGenerated: string;
  code: string;
} 