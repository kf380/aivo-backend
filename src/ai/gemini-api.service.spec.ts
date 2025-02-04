import { Test, TestingModule } from '@nestjs/testing';
import { GeminiApiService } from './gemini-api.service';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('GeminiApiService', () => {
  let geminiApiService: GeminiApiService;
  let httpService: HttpService;

  const mockHttpService = {
    post: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiApiService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    geminiApiService = module.get<GeminiApiService>(GeminiApiService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('testConnection', () => {
    it('debe retornar true si la llamada a la API es exitosa', async () => {
      const mockAxiosResponse: AxiosResponse = {
        data: { success: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      (mockHttpService.post as jest.Mock).mockReturnValue(of(mockAxiosResponse));

      const result = await geminiApiService.testConnection();
      expect(result).toBe(true);
      expect(mockHttpService.post).toHaveBeenCalled();
    });

    it('debe retornar false si la llamada falla', async () => {
      (mockHttpService.post as jest.Mock).mockReturnValue(
        throwError(() => new Error('Connection error')),
      );

      const result = await geminiApiService.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('generateResponse', () => {
    it('debe retornar el texto si la respuesta es exitosa y suficiente', async () => {
      const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
        'Nunc efficitur quam eget leo fermentum, eget vehicula nisl molestie.';

      const mockAxiosResponse: AxiosResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  { text: longText },
                ],
              },
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      (mockHttpService.post as jest.Mock).mockReturnValue(of(mockAxiosResponse));

      const prompt = 'Hello IA';
      const result = await geminiApiService.generateResponse(prompt);

      expect(result).toBe(longText);
      expect(mockHttpService.post).toHaveBeenCalled();
    });

    it('debe lanzar HttpException si el texto es demasiado corto', async () => {
      const shortText = 'Short text';

      const mockAxiosResponse: AxiosResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  { text: shortText },
                ],
              },
            },
          ],
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as InternalAxiosRequestConfig,
      };

      (mockHttpService.post as jest.Mock).mockReturnValue(of(mockAxiosResponse));

      await expect(geminiApiService.generateResponse('Hola')).rejects.toThrow(
        'Respuesta insuficiente de la IA',
      );
    });

    it('debe lanzar HttpException si ocurre un error desconocido', async () => {
      (mockHttpService.post as jest.Mock).mockReturnValue(
        throwError(() => new Error('Error desconocido')),
      );

      await expect(geminiApiService.generateResponse('Hola')).rejects.toThrow(
        /Error en la generación de respuesta: Error desconocido/,
      );
    });
  });
});
