import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AiModule } from './ai/ai.module';
import { EventsGateway } from './events/events.gateway';
import { UsersModule } from './users/user.module';
import { RequestsModule } from './request/request.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error('MONGODB_URI is not defined in the environment');
        }
        return { uri };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    } as any), 
    AuthModule,
    UsersModule,
    DashboardModule,
    AiModule,
    RequestsModule,
  ],
  providers: [EventsGateway],
})
export class AppModule {}
