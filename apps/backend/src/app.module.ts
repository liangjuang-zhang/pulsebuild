import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { APP_GUARD } from '@nestjs/core';
import { createAuth } from './modules/auth/auth';
import { DATABASE_CONNECTION, DatabaseModule } from './database/database.module';
import { TRPCModule } from 'nestjs-trpc';
import { HealthRouter } from './modules/system/health.router';
import { GeoModule } from './modules/system/geo/geo.module';
import { GeoRouter } from './modules/system/geo/geo.router';
import { FileModule } from './modules/system/file/file.module';
import { FileRouter } from './modules/system/file/file.router';
import { SmsModule } from './modules/system/sms/sms.module';
import { SmsService } from './modules/system/sms/sms.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    SmsModule,
    GeoModule,
    FileModule,
    TRPCModule.forRoot({}),
    AuthModule.forRootAsync({
      imports: [DatabaseModule, SmsModule],
      inject: [DATABASE_CONNECTION, SmsService],
      useFactory: (database: NodePgDatabase, smsService: SmsService) => ({
        auth: createAuth(database, smsService),
      }),
    }),
  ],
  controllers: [],
  providers: [
    HealthRouter,
    GeoRouter,
    FileRouter,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
