import { Injectable } from '@nestjs/common';
import { AiData } from './ai.types';
import { DateTime } from 'luxon';

@Injectable()
export class AiDataParserService {
  private readonly MONTHS: Record<string, string> = {
    'enero': '01', 'ene': '01',
    'febrero': '02', 'feb': '02',
    'marzo': '03', 'mar': '03',
    'abril': '04', 'abr': '04',
    'mayo': '05',
    'junio': '06', 'jun': '06',
    'julio': '07', 'jul': '07',
    'agosto': '08', 'ago': '08',
    'septiembre': '09', 'sep': '09', 'setiembre': '09',
    'octubre': '10', 'oct': '10',
    'noviembre': '11', 'nov': '11',
    'diciembre': '12', 'dic': '12',
  };


  private readonly RELATIVE_DATES: Record<string, number> = {
    'hoy': 0,
    'ayer': -1,
    'anteayer': -2,
    'mañana': +1,
    'pasado mañana': +2,
  };


  private readonly PATTERNS: RegExp[] = [
    /^(\d{4})[-](\d{1,2})[-](\d{1,2})$/,
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/,
    /(\d{1,2})\s+(?:de\s+)?([A-Za-záéíóú]+)\s+(?:de\s+)?(\d{4})/,
    /(\d{1,2})\s+(?:de\s+)?([A-Za-záéíóú]+)\s+(?:de\s+)?(\d{2})/,
  ];

  tryParseDate(dateStr: string, userTimeZone?: string): { date: string; recognized: boolean } {
    const trimmed = (dateStr || '').trim().toLowerCase();
    if (!trimmed) {
      return { date: '', recognized: false };
    }

    if (this.RELATIVE_DATES[trimmed] !== undefined) {
      const offsetDays = this.RELATIVE_DATES[trimmed];
      let now = DateTime.now();
      if (userTimeZone) {
        now = now.setZone(userTimeZone);
      }
      const finalDate = now.plus({ days: offsetDays });
      return { date: finalDate.toFormat('yyyy-LL-dd'), recognized: true };
    }

    for (const pattern of this.PATTERNS) {
      const match = trimmed.match(pattern);
      if (match) {
        if (pattern === this.PATTERNS[0]) {
          const [, year, month, day] = match;
          return this.validateAndFormat(year, month, day, userTimeZone);
        }
        if (pattern === this.PATTERNS[1]) {
          const [, d, m, y] = match;
          return this.validateAndFormat(y, m, d, userTimeZone);
        }
        if (pattern === this.PATTERNS[2]) {
          const [, d, m, yy] = match;
          const year = this.inferCentury(yy);
          return this.validateAndFormat(year, m, d, userTimeZone);
        }
        if (pattern === this.PATTERNS[3]) {
          const [, dd, monthStr, year] = match;
          const resolvedMonth = this.resolveMonth(monthStr);
          return this.validateAndFormat(year, resolvedMonth, dd, userTimeZone);
        }
        if (pattern === this.PATTERNS[4]) {
          const [, dd, monthStr, yy] = match;
          const resolvedMonth = this.resolveMonth(monthStr);
          const year = this.inferCentury(yy);
          return this.validateAndFormat(year, resolvedMonth, dd, userTimeZone);
        }
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
    if (newData.injuries !== undefined) merged.injuries = newData.injuries;
    merged.owner = newData.owner;
    merged.complete = newData.complete;
    merged.question = newData.question;
    merged.conversationalResponse = newData.conversationalResponse ?? merged.conversationalResponse;

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

  
  private validateAndFormat(
    yearStr: string,
    monthStr: string,
    dayStr: string,
    userTimeZone?: string,
  ): { date: string; recognized: boolean } {
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const d = parseInt(dayStr, 10);

    if (y < 2000 || y > 2100) {
      return { date: '', recognized: false };
    }
    if (m < 1 || m > 12) {
      return { date: '', recognized: false };
    }
    if (d < 1 || d > 31) {
      return { date: '', recognized: false };
    }

    let dt = DateTime.fromObject(
      { year: y, month: m, day: d },
      { zone: userTimeZone || 'UTC' }
    );

    const now = userTimeZone
      ? DateTime.now().setZone(userTimeZone)
      : DateTime.now();
    const tenDaysAgo = now.minus({ days: 10 });
    const oneDayAfter = now.plus({ days: 1 });

    if (dt < tenDaysAgo || dt > oneDayAfter) {
      return { date: '', recognized: false };
    }

    return { date: dt.toFormat('yyyy-LL-dd'), recognized: true };
  }

  private inferCentury(twoDigits: string): string {
    const num = parseInt(twoDigits, 10);
    return num >= 0 && num <= 99 ? `20${twoDigits.padStart(2, '0')}` : twoDigits;
  }


  private resolveMonth(monthStr: string): string {
    const normalized = monthStr
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') 
      .toLowerCase();

    return this.MONTHS[normalized] || '01';
  }
}
