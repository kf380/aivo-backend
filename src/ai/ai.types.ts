export interface AiData {
  date: string;
  location: string;
  latitude?: number;
  longitude?: number;
  city?: string;      
  region?: string;   
  description: string;
  injuries?: boolean;
  owner: boolean;
  complete: boolean;
  question?: string;
  conversationalResponse?: string;
}


export interface AiResponse {
  json: AiData;
  readable: string;
}


export interface DateParseResult {
  date: string;
  recognized: boolean;
}