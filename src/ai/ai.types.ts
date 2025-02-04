export interface AiData {
  date: string;
  location: string;
  description: string;
  injuries: boolean;
  owner: boolean;
  complete: boolean;
  question: string;
}

export interface AiResponse {
  json: AiData;
  readable: string;
}

export interface DateParseResult {
  date: string;
  recognized: boolean;
}