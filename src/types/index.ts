export interface GeminiResponse {
  threat_level: "Low" | "Medium" | "High" | "Critical";
  incident_type: string;
  immediate_action_for_user: string;
  brief_for_security: string;
  estimated_severity_score?: number;
  recommended_units?: string[];
}

export interface ResponderResponse {
  responderId: string;
  responderName: string;
  status: "acknowledged" | "dispatched" | "en_route" | "on_scene" | "resolved";
  message: string;
  actionTaken: string;
  estimatedArrival?: string;
  additionalNotes?: string;
  respondedAt: string;
}

export interface CrisisAlert {
  id: string;
  timestamp: string;
  location: string;
  description: string;
  imageBase64?: string;
  geminiAnalysis: GeminiResponse;
  responderResponse?: ResponderResponse;
}

export interface CrisisSubmission {
  description: string;
  location: string;
  imageBase64?: string;
}
