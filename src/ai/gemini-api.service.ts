
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { AiProvider } from './ai-provider.interface';

@Injectable()
export class GeminiApiService implements AiProvider {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly httpService: HttpService) {
    this.apiUrl = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
    this.apiKey = process.env.GEMINI_API_KEY || '';
  }


  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.apiUrl}?key=${this.apiKey}`;
      const headers = { 'Content-Type': 'application/json' };
      const testPayload = {
        contents: [
          {
            parts: [{ text: 'Translate to English: Hola mundo' }],
          },
        ],
      };

      await lastValueFrom(
        this.httpService.post(url, testPayload, { headers }).pipe(timeout(10_000))
      );

      return true;
    } catch (error) {
      console.error('Test connection failed:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: error?.message,
      });
      return false;
    }
  }


  async generateResponse(prompt: string): Promise<string> {
    try {
      const url = `${this.apiUrl}?key=${this.apiKey}`;
      const headers = { 'Content-Type': 'application/json' };
      const payload = {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
        },
      };

      const response = await lastValueFrom(
        this.httpService.post(url, payload, { headers }).pipe(timeout(30_000))
      );

      const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!generatedText || generatedText.length < 50) {
        throw new Error('Respuesta insuficiente de la IA');
      }

      return generatedText;
    } catch (error) {
      console.error('[generateResponse] Error:', error?.message || error);
      throw new HttpException(
        `Error en la generación de respuesta: ${error.message || 'Error desconocido'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
