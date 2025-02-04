
import {
  Injectable,
  HttpException,
  HttpStatus,
  Inject
} from '@nestjs/common';
import { AiData, AiResponse } from './ai.types';
import { AiDataParserService } from './ai-data-parser.service';
import { AiProvider } from './ai-provider.interface';

@Injectable()
export class AiService {
  private readonly maxRetries: number = 2;


  constructor(
    @Inject('AiProvider') private readonly aiProvider: AiProvider,
    private readonly aiDataParser: AiDataParserService,
  ) {}


  async testConnection(): Promise<boolean> {
    return await this.aiProvider.testConnection();
  }


  async processInput(text: string, oldData?: AiData): Promise<AiResponse> {
    const isConnected = await this.aiProvider.testConnection();
    if (!isConnected) {
      throw new HttpException(
        'No se pudo establecer conexión con la API de IA',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }

    let attempt = 0;
    let finalResult: AiResponse | null = null;

    while (attempt <= this.maxRetries && !finalResult) {
      try {
        const prompt = `
Analiza el siguiente texto: "${text}"
Extrae la siguiente información y devuelve un JSON con las siguientes propiedades:
- date (YYYY-MM-DD o vacío)
- location
- description
- injuries (boolean)
- owner (boolean)
- complete (boolean)
- question (string si falta info, vacío si está completa)
Devuelve sólo el JSON, sin texto adicional.
        `.trim();

        const aiRawText = await this.aiProvider.generateResponse(prompt);

        const cleanedText = aiRawText
          .replace(/^[^{]*/, '')
          .replace(/[^}]*$/, '');

        const parsed = JSON.parse(cleanedText) as Partial<AiData>;

        parsed.date = parsed.date ?? '';
        parsed.location = parsed.location ?? '';
        parsed.description = parsed.description ?? '';
        parsed.injuries = parsed.injuries ?? false;
        parsed.owner = parsed.owner ?? false;

        const { date } = this.aiDataParser.tryParseDate(parsed.date);
        parsed.date = date;

        const missing: string[] = [];
        if (!parsed.date) missing.push('fecha');
        if (!parsed.location) missing.push('ubicación');
        if (!parsed.description) missing.push('descripción');

        parsed.complete = missing.length === 0;
        parsed.question = parsed.complete
          ? ''
          : `¿Podrías indicar ${missing.join(' y ')}?`;

        const mergedData = this.aiDataParser.mergePartialData(oldData, parsed as AiData);

        const finalMissing: string[] = [];
        if (!mergedData.date) finalMissing.push('fecha');
        if (!mergedData.location) finalMissing.push('ubicación');
        if (!mergedData.description) finalMissing.push('descripción');

        mergedData.complete = finalMissing.length === 0;
        mergedData.question = mergedData.complete
          ? ''
          : `¿Podrías indicar ${finalMissing.join(' y ')}?`;

        finalResult = {
          json: mergedData,
          readable: this.aiDataParser.formatReadableResponse(mergedData),
        };

        return finalResult;
      } catch (error: any) {
        console.error('[processInput] Error:', error?.message || error);
        attempt++;
        if (attempt > this.maxRetries) {
          throw new HttpException(
            `Error en el procesamiento: ${error.message || 'Error desconocido'}`,
            HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }

    return {
      json: {
        date: '',
        location: '',
        description: '',
        injuries: false,
        owner: false,
        complete: false,
        question: 'No se pudo procesar la solicitud',
      },
      readable: 'No se pudo procesar la solicitud.',
    };
  }
}
