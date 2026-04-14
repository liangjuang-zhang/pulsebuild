import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../../database/database.module';
import { FileService } from './file.service';
import { FileRouter } from './file.router';
import { LocalStorageProvider } from './storage/local.provider';
import { STORAGE_PROVIDER } from './storage/storage.interface';

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [
    FileService,
    FileRouter,
    {
      provide: STORAGE_PROVIDER,
      useClass: LocalStorageProvider,
    },
  ],
  exports: [FileService],
})
export class FileModule {}
