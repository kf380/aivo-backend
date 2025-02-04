import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import { AiProvider } from './ai-provider.interface';
import { AiData, AiResponse } from './ai.types';
import { AiDataParserService } from './ai-data-parser.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AiService', () => {
  let aiService: AiService;
  let aiProvider: AiProvider;           
  let aiDataParser: AiDataParserService;

  const mockAiProvider: Partial<AiProvider> = {
    testConnection: jest.fn(),
    generateResponse: jest.fn(),
  };

  const mockAiDataParser: Partial<AiDataParserService> = {
    tryParseDate: jest.fn(),
    mergePartialData: jest.fn(),
    formatReadableResponse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: AiDataParserService,
          useValue: mockAiDataParser,
        },
        {
          provide: 'AiProvider',
          useValue: mockAiProvider,
        },
      ],
    }).compile();

    aiService = module.get<AiService>(AiService);
    aiProvider = module.get<AiProvider>('AiProvider');
    aiDataParser = module.get<AiDataParserService>(AiDataParserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('testConnection', () => {
    it('debe retornar true si AiProvider.testConnection retorna true', async () => {
      (aiProvider.testConnection as jest.Mock).mockResolvedValue(true);
      const result = await aiService.testConnection();
      expect(result).toBe(true);
      expect(aiProvider.testConnection).toHaveBeenCalledTimes(1);
    });

    it('debe retornar false si AiProvider.testConnection retorna false', async () => {
      (aiProvider.testConnection as jest.Mock).mockResolvedValue(false);
      const result = await aiService.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('processInput', () => {
    it('debe lanzar HttpException si testConnection retorna false', async () => {
      (aiProvider.testConnection as jest.Mock).mockResolvedValue(false);
      await expect(aiService.processInput('algún texto'))
        .rejects
        .toThrow('No se pudo establecer conexión con la API');
    });

    it('debe llamar a generateResponse y usar el parser para devolver AiResponse', async () => {
      (aiProvider.testConnection as jest.Mock).mockResolvedValue(true);

      (aiProvider.generateResponse as jest.Mock).mockResolvedValue(`{
        "date": "hoy",
        "location": "Buenos Aires",
        "description": "Colisión leve",
        "injuries": true,
        "owner": true,
        "complete": false,
        "question": "Faltan detalles"
      }`);

      (aiDataParser.tryParseDate as jest.Mock).mockReturnValue({
        date: '2025-01-01',
        recognized: true,
      });
      (aiDataParser.mergePartialData as jest.Mock).mockImplementation(
        (oldData: AiData, newData: AiData) => ({ ...oldData, ...newData }),
      );
      (aiDataParser.formatReadableResponse as jest.Mock).mockReturnValue('Texto legible final');

      const oldData: AiData = {
        date: '',
        location: '',
        description: '',
        injuries: false,
        owner: false,
        complete: false,
        question: '',
      };

      const response = await aiService.processInput('texto de prueba', oldData);
      expect(aiProvider.generateResponse).toHaveBeenCalled();
      expect(aiDataParser.tryParseDate).toHaveBeenCalledWith('hoy');
      expect(aiDataParser.mergePartialData).toHaveBeenCalled();

      expect(response.json.date).toBe('2025-01-01');
      expect(response.json.location).toBe('Buenos Aires');
      expect(response.json.injuries).toBe(true);
      expect(response.readable).toBe('Texto legible final');
    });

    it('debe reintentar 3 veces si generateResponse falla y lanzar excepción al final', async () => {
      (aiProvider.testConnection as jest.Mock).mockResolvedValue(true);
      (aiProvider.generateResponse as jest.Mock).mockRejectedValue(new Error('Error en la API'));

      await expect(aiService.processInput('Texto problemático', undefined))
        .rejects
        .toThrow(/Error en el procesamiento: Error en la API/);

      expect(aiProvider.generateResponse).toHaveBeenCalledTimes(3);
    });
  });
});
