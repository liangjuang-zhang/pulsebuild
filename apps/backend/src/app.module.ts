import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { APP_GUARD } from '@nestjs/core';
import { createAuth } from './modules/auth/auth';
import { AppContext } from './modules/auth/app.context';
import { AuthMiddleware } from './modules/auth/auth.middleware';
import { PermissionMiddleware } from './modules/auth/permission.middleware';
import { DATABASE_CONNECTION, DatabaseModule } from './database/database.module';
import { TRPCModule } from 'nestjs-trpc';
import { HealthRouter } from './modules/system/health.router';
import { GeoModule } from './modules/system/geo/geo.module';
import { GeoRouter } from './modules/system/geo/geo.router';
import { FileModule } from './modules/system/file/file.module';
import { FileRouter } from './modules/system/file/file.router';
import { RoleModule } from './modules/system/role/role.module';
import { RoleRouter } from './modules/system/role/role.router';
import { PermissionModule } from './modules/system/permission/permission.module';
import { PermissionRouter } from './modules/system/permission/permission.router';
import { UserModule } from './modules/system/user/user.module';
import { UserRouter } from './modules/system/user/user.router';
import { SyncModule } from './modules/system/sync/sync.module';
import { SyncRouter } from './modules/system/sync/sync.router';
import { SmsModule } from './modules/system/sms/sms.module';
import { SmsService } from './modules/system/sms/sms.service';
import { EmailModule } from './modules/system/email/email.module';
import { EmailService } from './modules/system/email/email.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    SmsModule,
    EmailModule,
    GeoModule,
    FileModule,
    RoleModule,
    PermissionModule,
    UserModule,
    SyncModule,
    TRPCModule.forRoot({
      context: AppContext,
    }),
    AuthModule.forRootAsync({
      imports: [DatabaseModule, SmsModule, EmailModule],
      inject: [DATABASE_CONNECTION, SmsService, EmailService],
      useFactory: (database: NodePgDatabase, smsService: SmsService, emailService: EmailService) => ({
        auth: createAuth(database, smsService, emailService),
      }),
    }),
  ],
  controllers: [],
  providers: [
    // tRPC Context 和 Middleware
    AppContext,
    AuthMiddleware,
    PermissionMiddleware,
    // tRPC Routers
    HealthRouter,
    GeoRouter,
    FileRouter,
    RoleRouter,
    PermissionRouter,
    UserRouter,
    SyncRouter,
    // NestJS Guards
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}