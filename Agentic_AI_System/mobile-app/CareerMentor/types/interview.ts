export interface InterviewEvaluation {
  evaluation?: string;
  follow_up?: string;
  notes?: string;
}

export interface InterviewMessage {
  text?: string;
  evaluation?: string;
  follow_up?: string;
  notes?: string;
  sender: 'user' | 'agent';
  timestamp?: string;
  isFollowUp?: boolean;
}

export interface InterviewSetupData {
  jobTitle: string;
  experienceLevel: string;
  interviewType: 'Technical' | 'Behavioral';
  companyCulture?: string;
}

export interface InterviewSkillScore {
  name: string;
  score: number;
}

export interface InterviewSummaryData {
  scores: {
    technical_knowledge: number;
    problem_solving: number;
    communication: number;
    cultural_fit: number;
    overall: number;
  };
  strengths: string[];
  improvement_areas: string[];
  specific_feedback: string;
  recommendation: 'Hire' | 'Consider' | 'Reject';
  questionFeedback?: Array<{
    question: string;
    answer: string;
    feedback: string;
    score: number;
  }>;
}
