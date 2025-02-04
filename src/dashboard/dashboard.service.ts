import { Injectable } from '@nestjs/common';
import { RequestsService } from 'src/request/request.service';

@Injectable()
export class DashboardService {
  constructor(private readonly requestsService: RequestsService) {}

  async getAllRequests(): Promise<any> {
    return await this.requestsService.findAll();
  }
}
