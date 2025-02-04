import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard') 
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('requests')
  @ApiOperation({ summary: 'Obtiene la lista de todas las solicitudes' })
  async getAllRequests(): Promise<any> {
    return this.dashboardService.getAllRequests();
  }
}
