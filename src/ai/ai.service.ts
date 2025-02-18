import { Injectable, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { AiData, AiResponse } from './ai.types';
import { AiDataParserService } from './ai-data-parser.service';
import { AiProvider } from './ai-provider.interface';
import {
  geocodeAddress,
  reverseGeocodeCoordinates,
} from 'src/external/geocode.service';

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

  async processInput(
    text: string,
    userTimeZone?: string,
    oldData?: AiData,
  ): Promise<AiResponse> {
    const isConnected = await this.aiProvider.testConnection();
    if (!isConnected) {
      throw new HttpException(
        'No se pudo establecer conexión con la API de IA',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    let attempt = 0;
    let finalResult: AiResponse | null = null;

    while (attempt <= this.maxRetries && !finalResult) {
      try {
        const prompt = `
Eres un asistente de IA en español, con un tono amigable, empático y cercano,
especializado en recopilar información sobre incidentes (accidentes, incendios, robos, etc.).

INSTRUCCIONES GENERALES:
- Extrae información clave del texto del usuario
- Devuelve EXCLUSIVAMENTE un objeto JSON sin texto adicional
- En caso de ambigüedad o información faltante, usa campos vacíos ("") y solicita aclaración

ESTRUCTURA DE RESPUESTA JSON:
{
  "date": "",
  "location": "",
  "description": "",
  "injuries": false,
  "owner": false,
  "complete": false,
  "question": "",
  "conversationalResponse": ""
}

REGLAS PARA CADA CAMPO:

1. FECHA ("date"):
   - Si detectas expresiones temporales como "ayer", "anteayer", "hoy", "el domingo pasado", devuélvelas tal cual
   - Si es una fecha específica, conviértela al formato "YYYY-MM-DD"
   - Si no hay fecha, deja "" y pregunta en "question" (ej: "¿Podrías indicar la fecha?")

2. UBICACIÓN ("location"):
   - Extrae la dirección o lugar donde ocurrió el incidente (calle, ciudad, región, país) si está claro.
   - Si el usuario menciona algo muy genérico (p. ej. "en el centro", "en mi casa"), 
     deja esa frase en "location" y pregunta: "¿Podrías detallar más la dirección o ciudad?"
   - Si no se menciona nada, pon "" y pregunta al usuario.

3. DESCRIPCIÓN ("description"):
   - Resume brevemente el incidente.
   - Si no hay suficiente información, deja "" y pregunta en "question".

4. LESIONES ("injuries"):
   - true: si hubo lesionados
   - false: si no hubo o no se menciona

5. PROPIETARIO ("owner"):
   - true: si la persona que informa es propietaria afectada
   - false: si no se menciona o no aplica

6. COMPLETO ("complete"):
   - true: si ya tenemos fecha, ubicación y descripción
   - false: si falta alguno de esos campos

7. PREGUNTA ("question"):
   - Si falta info esencial, formula pregunta amigable
   - Si no falta nada, deja ""

8. RESPUESTA CONVERSACIONAL ("conversationalResponse"):
   - Mensaje empático y cercano
   - Si falta info, solicítala amablemente

IMPORTANTE:
- NO incluyas texto fuera del JSON
- Prioriza la extracción precisa de datos sobre la conversación
- Para fechas ambiguas, favorece el formato más reciente

TEXTO DEL USUARIO:
"${text}"
        `.trim();

        const aiRawText = await this.aiProvider.generateResponse(prompt);

        const cleanedText = aiRawText
          .replace(/^[^{]+/, '')
          .replace(/}[^}]*$/, '}');

        const parsed = JSON.parse(cleanedText) as Partial<AiData> & {
          conversationalResponse?: string;
        };

        parsed.date = parsed.date ?? '';
        parsed.location = parsed.location ?? '';
        parsed.description = parsed.description ?? '';
        parsed.injuries = parsed.injuries ?? false;
        parsed.owner = parsed.owner ?? false;
        parsed.conversationalResponse = parsed.conversationalResponse ?? '';

        const { date } = this.aiDataParser.tryParseDate(
          parsed.date,
          userTimeZone,
        );
        parsed.date = date;

        if (parsed.location && parsed.location.trim()) {
          const geoResult = await geocodeAddress(parsed.location);
          if (geoResult) {
            (parsed as AiData).latitude = geoResult.lat;
            (parsed as AiData).longitude = geoResult.lng;
            (parsed as AiData).city = geoResult.city;
            (parsed as AiData).region = geoResult.region;
          }
        }
        const missing: string[] = [];
        if (!parsed.date) missing.push('fecha');
        if (!parsed.location) missing.push('ubicación');
        if (!parsed.description) missing.push('descripción');

        parsed.complete = missing.length === 0;
        parsed.question = parsed.complete
          ? ''
          : `¿Podrías indicar ${missing.join(' y ')}?`;

        const mergedData = this.aiDataParser.mergePartialData(
          oldData,
          parsed as AiData,
        );

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
          readable: mergedData.conversationalResponse?.trim()
            ? mergedData.conversationalResponse
            : this.aiDataParser.formatReadableResponse(mergedData),
        };

        return finalResult;
      } catch (error: any) {
        console.error('[processInput] Error:', error?.message || error);
        attempt++;
        if (attempt > this.maxRetries) {
          throw new HttpException(
            `Error en el procesamiento: ${error.message || 'Error desconocido'}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
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
