import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { APP_GUARD } from '@nestjs/core';
import { createAuth } from './modules/auth/auth';
import { DATABASE_CONNECTION, DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    AuthModule.forRootAsync({
      imports: [DatabaseModule],
      inject: [DATABASE_CONNECTION],
      useFactory: (database: NodePgDatabase) => ({
        auth: createAuth(database),
      }),
    }),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
