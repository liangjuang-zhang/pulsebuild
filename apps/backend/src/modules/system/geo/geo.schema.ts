import { z } from 'zod';

// ==================== 输出类型 ====================

/** Places 自动补全 - 地点预测项 */
export const PlacePredictionSchema = z.object({
  placeId: z.string(),
  structuredFormat: z.object({
    mainText: z.object({ text: z.string() }),
    secondaryText: z.object({ text: z.string() }).optional(),
  }),
  types: z.array(z.string()),
});
export type PlacePrediction = z.infer<typeof PlacePredictionSchema>;

/** Places 地点详情 */
export const PlaceDetailsSchema = z.object({
  id: z.string(),
  displayName: z.object({ text: z.string(), languageCode: z.string().optional() }).optional(),
  formattedAddress: z.string().optional(),
  location: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
});
export type PlaceDetails = z.infer<typeof PlaceDetailsSchema>;

/** Geocoding 结果（地址转坐标） */
export const GeocodeResultSchema = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
    placeId: z.string().nullable(),
    formattedAddress: z.string().nullable(),
  })
  .nullable();
export type GeocodeResult = z.infer<typeof GeocodeResultSchema>;

// ==================== 输入类型 ====================

/** 自动补全请求参数 */
export const AutocompleteInputSchema = z.object({
  text: z.string().min(1).max(500),
  languageCode: z.string().optional(),
  includedRegionCodes: z.array(z.string()).optional(),
  sessionToken: z.string().optional(),
  types: z.array(z.string()).optional(),
});
export type AutocompleteInput = z.infer<typeof AutocompleteInputSchema>;

/** 地点详情请求参数 */
export const PlaceDetailsInputSchema = z.object({
  placeId: z.string().min(1),
  languageCode: z.string().optional(),
  sessionToken: z.string().optional(),
  fields: z.array(z.string()).optional(),
});
export type PlaceDetailsInput = z.infer<typeof PlaceDetailsInputSchema>;

/** 地址转坐标请求参数 */
export const GeocodeInputSchema = z.object({
  address: z.string().min(5).max(500),
  regionCode: z.string().optional(),
});
export type GeocodeInput = z.infer<typeof GeocodeInputSchema>;

/** 地址验证请求参数 */
export const ValidateAddressInputSchema = z.object({
  address: z.string().min(1).max(500),
  regionCode: z.string().optional(),
});
export type ValidateAddressInput = z.infer<typeof ValidateAddressInputSchema>;

/** 地址验证结果 */
export const AddressValidationResultSchema = z.object({
  validationState: z.enum(['validated', 'unavailable']),
  inputAddress: z.string(),
  suggestedAddress: z.string(),
  regionCode: z.string(),
  unavailableReason: z.string().nullable().optional(),
  verdict: z.object({
    inputGranularity: z.string().nullable(),
    validationGranularity: z.string().nullable(),
    geocodeGranularity: z.string().nullable(),
    addressComplete: z.boolean(),
    hasUnconfirmedComponents: z.boolean(),
    hasInferredComponents: z.boolean(),
    hasReplacedComponents: z.boolean(),
  }),
  geocode: z
    .object({
      latitude: z.number().nullable(),
      longitude: z.number().nullable(),
      placeId: z.string().nullable(),
    })
    .nullable()
    .optional(),
});
export type AddressValidationResult = z.infer<typeof AddressValidationResultSchema>;
