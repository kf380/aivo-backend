import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiResponse } from './ai.types';
import { AiService } from './ai.service';
import { ProcessTextDto } from './dto/process-text.dto';

@ApiTags('AI')
@Controller('api')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('process')
  @ApiOperation({ summary: 'Procesa el texto ingresado y retorna la respuesta de la IA' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async processText(
    @Body() dto: ProcessTextDto,
  ): Promise<AiResponse> {
    const { text, oldData, userTimeZone } = dto;
    return this.aiService.processInput(text, userTimeZone, oldData);
  }
}
