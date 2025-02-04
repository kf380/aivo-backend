
import { Injectable } from '@nestjs/common';
import { AiData } from './ai.types';

@Injectable()
export class AiDataParserService {
  private readonly MONTHS: Record<string, string> = {
    enero: '01',
    febrero: '02',
    marzo: '03',
    abril: '04',
    mayo: '05',
    junio: '06',
    julio: '07',
    agosto: '08',
    septiembre: '09',
    octubre: '10',
    noviembre: '11',
    diciembre: '12',
  };


  tryParseDate(dateStr: string): { date: string; recognized: boolean } {
    const trimmed = (dateStr || '').trim().toLowerCase();

    if (trimmed === 'hoy') {
      const localDate = this.getLocalDate();
      return { date: this.formatDate(localDate), recognized: true };
    }
    if (trimmed === 'ayer') {
      const localDate = this.getLocalDate();
      localDate.setDate(localDate.getDate() - 1);
      return { date: this.formatDate(localDate), recognized: true };
    }

    if (!trimmed) {
      return { date: '', recognized: false };
    }

    const patterns = [
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,                    
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,                 
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,                    
      /(\d{1,2})\s+(?:de\s+)?([A-Za-záéíóú]+)\s+(\d{4})/, 
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        let year: string, month: string, day: string;

        if (pattern === patterns[3]) {
          [, day, month, year] = match;
          month = this.MONTHS[month.toLowerCase()] || '01';
        } else if (pattern === patterns[0]) {
          [, year, month, day] = match;
        } else {
          [, day, month, year] = match;
        }

        day = day.padStart(2, '0');
        month = month.padStart(2, '0');

        const y = parseInt(year, 10);
        const m = parseInt(month, 10);
        const d = parseInt(day, 10);

        if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
          return { date: '', recognized: false };
        }

        return { date: `${year}-${month}-${day}`, recognized: true };
      }
    }

    return { date: '', recognized: false };
  }

 
  mergePartialData(oldData: AiData | undefined, newData: AiData): AiData {
    if (!oldData) {
      return newData;
    }

    const merged: AiData = { ...oldData };

    if (newData.date) merged.date = newData.date;
    if (newData.location) merged.location = newData.location;
    if (newData.description) merged.description = newData.description;
    merged.injuries = newData.injuries;
    merged.owner = newData.owner;
    merged.complete = newData.complete;
    merged.question = newData.question;

    return merged;
  }

  formatReadableResponse(result: AiData): string {
    const injuries = result.injuries ? 'Sí' : 'No';
    const owner = result.owner ? 'Sí' : 'No';

    return `
Fecha: ${result.date}
Ubicación: ${result.location}
Descripción: ${result.description}
Heridos: ${injuries}
Titular: ${owner}
Completo: ${result.complete ? 'Sí' : 'No'}
${result.question ? `\nPregunta: ${result.question}` : ''}
`.trim();
  }


  private getLocalDate(): Date {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  }

 
  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
