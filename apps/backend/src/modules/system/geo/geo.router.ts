import { Inject } from '@nestjs/common';
import { Query, Router } from 'nestjs-trpc';
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

/**
 * 地理位置服务 tRPC 路由
 *
 * 提供 Google Maps 相关 API 的后端代理，避免客户端直接暴露 API Key。
 * 所有接口需认证后调用（全局 AuthGuard）。
 */
@Router({ alias: 'geo' })
export class GeoRouter {
  constructor(@Inject(GeoService) private readonly geoService: GeoService) {}

  /**
   * Google Places 自动补全
   *
   * 根据用户输入文本返回地点建议列表。
   * @param text - 用户输入的搜索文本
   * @param languageCode - 返回结果的语言（如 'zh-CN'）
   * @param includedRegionCodes - 限制搜索的国家/地区（如 ['AU']）
   * @param sessionToken - 会话令牌，将多次 autocomplete + 一次 placeDetails 归为同一计费会话
   * @param types - 限制返回的地点类型
   */
  @Query({
    input: AutocompleteInputSchema,
    output: z.array(PlacePredictionSchema),
  })
  async autocomplete(
    @Inject('input')
    input: AutocompleteInput,
  ) {
    return this.geoService.autocomplete(input);
  }

  /**
   * 获取地点详情
   *
   * 根据 placeId 获取地点的详细信息（名称、格式化地址、经纬度等）。
   * @param placeId - Google Place ID
   * @param sessionToken - 与 autocomplete 配对使用，结束计费会话
   * @param fields - 需要返回的字段列表，默认 displayName/formattedAddress/location/id
   */
  @Query({
    input: PlaceDetailsInputSchema,
    output: PlaceDetailsSchema.nullable(),
  })
  async placeDetails(
    @Inject('input')
    input: PlaceDetailsInput,
  ) {
    return this.geoService.placeDetails(input);
  }

  /**
   * 地址转坐标（Geocoding）
   *
   * 将文本地址转换为经纬度坐标，用于用户手动输入地址时的坐标回填。
   * @param address - 需要转换的地址文本（至少 5 个字符）
   * @param regionCode - 偏向的国家/地区代码（如 'AU'）
   */
  @Query({
    input: GeocodeInputSchema,
    output: GeocodeResultSchema,
  })
  async geocode(
    @Inject('input')
    input: GeocodeInput,
  ) {
    return this.geoService.geocode(input);
  }

  /**
   * 地址验证（Address Validation）
   *
   * 通过 Google Address Validation API 验证地址的有效性，
   * 返回标准化建议地址、验证结果和坐标信息。
   * @param address - 需要验证的地址文本
   * @param regionCode - 地址所属国家/地区代码
   */
  @Query({
    input: ValidateAddressInputSchema,
    output: AddressValidationResultSchema,
  })
  async validateAddress(
    @Inject('input')
    input: ValidateAddressInput,
  ) {
    return this.geoService.validateAddress(input);
  }
}
