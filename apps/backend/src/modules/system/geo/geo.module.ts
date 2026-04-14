import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeoService } from './geo.service';
import { GeoRouter } from './geo.router';

@Module({
  imports: [ConfigModule],
  providers: [GeoService, GeoRouter],
  exports: [GeoService],
})
export class GeoModule {}
