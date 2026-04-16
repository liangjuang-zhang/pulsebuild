import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../../database/database.module';
import { FileService } from './file.service';
import { FileRouter } from './file.router';
import { R2StorageProvider } from './storage/r2.provider';
import { STORAGE_PROVIDER } from './storage/storage.interface';

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [
    FileService,
    FileRouter,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (configService: ConfigService) => {
        const accountId = configService.get<string>('CLOUDFLARE_R2_ACCOUNT_ID');
        if (!accountId) {
          throw new Error('CLOUDFLARE_R2_ACCOUNT_ID is required. Please configure R2 storage.');
        }
        return new R2StorageProvider(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: [FileService],
})
export class FileModule {}