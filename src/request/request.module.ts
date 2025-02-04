import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Request, RequestSchema } from './schemas/request.schema';
import { RequestsService } from './request.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Request.name, schema: RequestSchema }]),
  ],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
