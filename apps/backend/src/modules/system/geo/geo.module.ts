import { Module } from '@nestjs/common';
import { GeoService } from './geo.service';
import { GeoRouter } from './geo.router';

@Module({
  providers: [GeoService, GeoRouter],
  exports: [GeoService],
})
export class GeoModule {}
