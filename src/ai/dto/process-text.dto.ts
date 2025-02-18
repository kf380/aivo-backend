import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AiData } from '../ai.types';

export class ProcessTextDto {
  @ApiPropertyOptional({
    description: 'Texto de entrada para procesar',
    example: 'Hubo un incendio en mi casa ayer',
  })
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'Datos previos de la IA (AiData) a fusionar con la nueva información',
    example: {
      date: '2025-01-31',
      location: 'Domicilio titular',
      description: 'House fire',
      injuries: false,
      owner: true,
      complete: true,
      question: '',
    },
  })
  @IsOptional()
  oldData?: AiData;

  @ApiPropertyOptional({
    description: 'Zona horaria del usuario (ej: America/Argentina/Buenos_Aires)',
    example: 'America/Argentina/Buenos_Aires',
  })
  @IsOptional()
  @IsString()
  userTimeZone?: string;
}
