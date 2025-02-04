import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { AiData, AiResponse } from './ai.types';
import { AiController } from './ai.controllers';

describe('AiController', () => {
  let aiController: AiController;
  let aiService: AiService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: {
            processInput: jest.fn(), 
          },
        },
      ],
    }).compile();

    aiController = module.get<AiController>(AiController);
    aiService = module.get<AiService>(AiService);
  });

  it('debe llamar a AiService.processInput con los argumentos correctos y retornar su resultado', async () => {
    const text = 'Sufrí un accidente ayer en mi auto';
    const oldData: AiData = {
      date: '',
      location: '',
      description: '',
      injuries: false,
      owner: false,
      complete: false,
      question: '',
    };

    const mockAiResponse: AiResponse = {
      json: {
        date: '2025-01-01',
        location: 'Buenos Aires',
        description: 'Accidente leve',
        injuries: true,
        owner: true,
        complete: false,
        question: '¿Podrías indicar más detalles?',
      },
      readable: 'Texto entendible para el usuario',
    };

    (aiService.processInput as jest.Mock).mockResolvedValue(mockAiResponse);

    const result = await aiController.processText({ text, oldData });

    expect(aiService.processInput).toHaveBeenCalledWith(text, oldData);
    expect(result).toEqual(mockAiResponse);
  });
});
