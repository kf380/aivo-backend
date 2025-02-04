import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { AiData } from '../ai.types';

export class ProcessTextDto {

  @ApiProperty({
    description: 'Texto de entrada para procesar',
    example: 'Se me prende fuego mi casa, no hay nadie dentro.',
  })
  @IsString()
  text: string;

  
  @ApiPropertyOptional({
    description: 'Datos previos de la IA (AiData) a fusionar con la nueva información',
    example: {
      date: '2025-01-31',
      location: 'domicilio titular',
      description: 'House fire',
      injuries: false,
      owner: true,
      complete: true,
      question: '',
    },
  })
  @IsOptional()
  oldData?: AiData;
}
