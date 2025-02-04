import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controllers';
import { RequestsModule } from 'src/request/request.module';

@Module({
  imports: [RequestsModule], 
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService], 
})
export class DashboardModule {}
