import { Inject } from '@nestjs/common';
import { Query, Router, UseMiddlewares, Input } from 'nestjs-trpc';
import { z } from 'zod';
import { GeoService } from './geo.service';
import {
  AddressValidationResultSchema,
  AutocompleteInputSchema,
  GeocodeInputSchema,
  GeocodeResultSchema,
  PlaceDetailsInputSchema,
  PlaceDetailsSchema,
  PlacePredictionSchema,
  ValidateAddressInputSchema,
} from './geo.schema';
import type { AutocompleteInput, GeocodeInput, PlaceDetailsInput, ValidateAddressInput } from './geo.schema';
import { AuthMiddleware } from '../../auth/auth.middleware';
import { PermissionMiddleware } from '../../auth/permission.middleware';

/**
 * 地理位置服务 tRPC 路由
 *
 * 提供 Google Maps 相关 API 的后端代理，避免客户端直接暴露 API Key。
 * 所有接口需认证后调用。
 */
@Router({ alias: 'geo' })
@UseMiddlewares(AuthMiddleware, PermissionMiddleware)
export class GeoRouter {
  constructor(@Inject(GeoService) private readonly geoService: GeoService) {}

  /** Google Places 自动补全 */
  @Query({
    input: AutocompleteInputSchema,
    output: z.array(PlacePredictionSchema),
  })
  async autocomplete(@Input() input: AutocompleteInput) {
    return this.geoService.autocomplete(input);
  }

  /** 获取地点详情 */
  @Query({
    input: PlaceDetailsInputSchema,
    output: PlaceDetailsSchema.nullable(),
  })
  async placeDetails(@Input() input: PlaceDetailsInput) {
    return this.geoService.placeDetails(input);
  }

  /** 地址转坐标（Geocoding） */
  @Query({
    input: GeocodeInputSchema,
    output: GeocodeResultSchema,
  })
  async geocode(@Input() input: GeocodeInput) {
    return this.geoService.geocode(input);
  }

  /** 地址验证（Address Validation） */
  @Query({
    input: ValidateAddressInputSchema,
    output: AddressValidationResultSchema,
  })
  async validateAddress(@Input() input: ValidateAddressInput) {
    return this.geoService.validateAddress(input);
  }
}