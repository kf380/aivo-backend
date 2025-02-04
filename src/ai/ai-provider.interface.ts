
export interface AiProvider {

    testConnection(): Promise<boolean>;
    generateResponse(prompt: string): Promise<string>;
  }
  