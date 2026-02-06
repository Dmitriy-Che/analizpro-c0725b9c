// Structured analysis result types

export interface AnalysisIndicator {
  name: string;
  value: number | string;
  unit: string;
  reference_min?: number;
  reference_max?: number;
  reference_text?: string;
  status: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';
  explanation: string;
  recommendation: string;
  specialist?: string;
}

export interface StructuredAnalysisResult {
  overall_status: 'normal' | 'warning' | 'critical';
  summary: string;
  indicators: AnalysisIndicator[];
  normal_count: number;
  abnormal_count: number;
  general_recommendations: string;
  follow_up?: string;
}

export interface AnalysisResultData {
  structured?: StructuredAnalysisResult;
  text?: string;
  isStructured: boolean;
}

export function parseAnalysisResult(result: string): AnalysisResultData {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(result);
    
    // Validate structured format
    if (
      parsed &&
      typeof parsed === 'object' &&
      'overall_status' in parsed &&
      'indicators' in parsed &&
      Array.isArray(parsed.indicators)
    ) {
      return {
        structured: parsed as StructuredAnalysisResult,
        isStructured: true
      };
    }
  } catch {
    // Not JSON, treat as plain text
  }
  
  return {
    text: result,
    isStructured: false
  };
}

export function getStatusColor(status: AnalysisIndicator['status']): {
  bg: string;
  text: string;
  border: string;
  fill: string;
} {
  switch (status) {
    case 'normal':
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        fill: 'hsl(142, 76%, 36%)'
      };
    case 'low':
    case 'high':
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        fill: 'hsl(45, 93%, 47%)'
      };
    case 'critical_low':
    case 'critical_high':
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        fill: 'hsl(0, 84%, 60%)'
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        fill: 'hsl(220, 9%, 46%)'
      };
  }
}

export function getOverallStatusColor(status: StructuredAnalysisResult['overall_status']): {
  header: string;
  body: string;
  border: string;
} {
  switch (status) {
    case 'normal':
      return {
        header: 'bg-gradient-to-r from-green-500 to-green-600',
        body: 'bg-green-50/80',
        border: 'border-green-200'
      };
    case 'warning':
      return {
        header: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
        body: 'bg-yellow-50/80',
        border: 'border-yellow-200'
      };
    case 'critical':
      return {
        header: 'bg-gradient-to-r from-red-400 to-red-500',
        body: 'bg-red-50/80',
        border: 'border-red-200'
      };
  }
}
