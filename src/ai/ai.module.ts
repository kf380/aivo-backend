import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiService } from './ai.service';
import { AiController } from './ai.controllers';
import { AiDataParserService } from './ai-data-parser.service';
import { GeminiApiService } from './gemini-api.service';

@Module({
  imports: [
    HttpModule, 
  ],
  controllers: [AiController],
  providers: [
    AiService,
    AiDataParserService,
    {
      provide: 'AiProvider',
      useClass: GeminiApiService,
    },
  ],
  exports: [AiService],
})
export class AiModule {}

