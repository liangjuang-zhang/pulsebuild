import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TRPCError } from '@trpc/server';
import type { AddressValidationResult, AutocompleteInput, GeocodeInput, GeocodeResult, PlaceDetails, PlaceDetailsInput, PlacePrediction, ValidateAddressInput } from './geo.schema';

/** Google API 响应类型 */
interface GoogleApiError {
  error?: { message?: string };
}

interface PlacesAutocompleteResponse extends GoogleApiError {
  suggestions?: Array<{ placePrediction: PlacePrediction }>;
}

interface GeocodingResponse {
  status: string;
  results?: Array<{
    geometry: { location: { lat: number; lng: number } };
    place_id?: string;
    formatted_address?: string;
  }>;
}

interface AddressValidationApiResponse extends GoogleApiError {
  result?: {
    verdict?: Record<string, unknown>;
    geocode?: { location?: { latitude?: number; longitude?: number }; placeId?: string };
    address?: { formattedAddress?: string; postalAddress?: { regionCode?: string } };
  };
}

const PLACES_AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places/';
const GEOCODING_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const ADDRESS_VALIDATION_URL = 'https://addressvalidation.googleapis.com/v1:validateAddress';

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    const key = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!key) {
      this.logger.warn('GOOGLE_MAPS_API_KEY not configured, geo services will not work');
    }
    this.apiKey = key ?? '';
  }

  private ensureApiKey(): void {
    if (!this.apiKey) {
      throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Google Maps API key not configured' });
    }
  }

  /**
   * Google Places Autocomplete (New API)
   */
  async autocomplete(input: AutocompleteInput): Promise<PlacePrediction[]> {
    this.ensureApiKey();

    if (!input.text || input.text.trim().length === 0) {
      return [];
    }

    const body: Record<string, unknown> = {
      input: input.text,
    };

    if (input.languageCode) {
      body.languageCode = input.languageCode;
    }
    if (input.sessionToken) {
      body.sessionToken = input.sessionToken;
    }
    if (input.includedRegionCodes?.length) {
      body.includedRegionCodes = input.includedRegionCodes;
    }
    if (input.types?.length) {
      body.includedPrimaryTypes = input.types;
    }

    const response = await fetch(PLACES_AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': this.apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as PlacesAutocompleteResponse;

    if (!response.ok) {
      this.logger.error(`Places autocomplete failed: ${JSON.stringify(data)}`);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: data.error?.message ?? 'Places autocomplete request failed' });
    }

    return Array.isArray(data.suggestions) ? data.suggestions.map((s) => s.placePrediction) : [];
  }

  /**
   * Google Place Details (New API)
   */
  async placeDetails(input: PlaceDetailsInput): Promise<PlaceDetails | null> {
    this.ensureApiKey();

    if (!input.placeId) {
      return null;
    }

    const fields = input.fields?.length ? input.fields : ['displayName', 'formattedAddress', 'location', 'id'];

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': this.apiKey,
      'X-Goog-FieldMask': fields.join(','),
    };

    if (input.sessionToken) {
      headers['X-Goog-SessionToken'] = input.sessionToken;
    }

    const params = new URLSearchParams();
    if (input.languageCode) {
      params.append('languageCode', input.languageCode);
    }

    const url = `${PLACE_DETAILS_URL}${encodeURIComponent(input.placeId)}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await fetch(url, { method: 'GET', headers });
    const data = (await response.json()) as PlaceDetails & GoogleApiError;

    if (!response.ok) {
      this.logger.error(`Place details failed: ${JSON.stringify(data)}`);
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: data.error?.message ?? 'Place details request failed' });
    }

    return data as PlaceDetails;
  }

  /**
   * Google Geocoding API - 地址转坐标
   */
  async geocode(input: GeocodeInput): Promise<GeocodeResult | null> {
    this.ensureApiKey();

    if (!input.address || input.address.trim().length < 5) {
      return null;
    }

    const params = new URLSearchParams({
      address: input.address,
      key: this.apiKey,
    });

    if (input.regionCode) {
      params.append('region', input.regionCode);
    }

    const response = await fetch(`${GEOCODING_URL}?${params.toString()}`);
    const data = (await response.json()) as GeocodingResponse;

    if (data.status !== 'OK' || !data.results?.[0]) {
      this.logger.warn(`Geocoding returned status: ${data.status} for address: ${input.address}`);
      return null;
    }

    const result = data.results[0];
    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      placeId: result.place_id ?? null,
      formattedAddress: result.formatted_address ?? null,
    };
  }

  /**
   * Google Address Validation API - 验证地址
   */
  async validateAddress(input: ValidateAddressInput): Promise<AddressValidationResult> {
    this.ensureApiKey();

    try {
      const response = await fetch(`${ADDRESS_VALIDATION_URL}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: {
            addressLines: [input.address],
            ...(input.regionCode ? { regionCode: input.regionCode } : {}),
          },
        }),
      });

      const data = (await response.json()) as AddressValidationApiResponse;

      if (!response.ok) {
        this.logger.error(`Address validation failed: ${JSON.stringify(data)}`);
        return {
          validationState: 'unavailable' as const,
          inputAddress: input.address,
          suggestedAddress: input.address,
          regionCode: input.regionCode ?? '',
          unavailableReason: data.error?.message ?? 'Validation service unavailable',
          verdict: {
            inputGranularity: null,
            validationGranularity: null,
            geocodeGranularity: null,
            addressComplete: false,
            hasUnconfirmedComponents: false,
            hasInferredComponents: false,
            hasReplacedComponents: false,
          },
        };
      }

      const apiResult = data.result;
      const verdict = apiResult?.verdict ?? {};
      const geocodeLocation = apiResult?.geocode?.location;
      const addressData = apiResult?.address;

      return {
        validationState: 'validated' as const,
        inputAddress: input.address,
        suggestedAddress: addressData?.formattedAddress ?? input.address,
        regionCode: addressData?.postalAddress?.regionCode ?? input.regionCode ?? '',
        verdict: {
          inputGranularity: (verdict.inputGranularity as string | undefined) ?? null,
          validationGranularity: (verdict.validationGranularity as string | undefined) ?? null,
          geocodeGranularity: (verdict.geocodeGranularity as string | undefined) ?? null,
          addressComplete: (verdict.addressComplete as boolean | undefined) ?? false,
          hasUnconfirmedComponents: (verdict.hasUnconfirmedComponents as boolean | undefined) ?? false,
          hasInferredComponents: (verdict.hasInferredComponents as boolean | undefined) ?? false,
          hasReplacedComponents: (verdict.hasReplacedComponents as boolean | undefined) ?? false,
        },
        geocode: geocodeLocation
          ? {
              latitude: geocodeLocation.latitude ?? null,
              longitude: geocodeLocation.longitude ?? null,
              placeId: apiResult?.geocode?.placeId ?? null,
            }
          : null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Address validation error: ${message}`);
      return {
        validationState: 'unavailable',
        inputAddress: input.address,
        suggestedAddress: input.address,
        regionCode: input.regionCode ?? '',
        unavailableReason: message,
        verdict: {
          inputGranularity: null,
          validationGranularity: null,
          geocodeGranularity: null,
          addressComplete: false,
          hasUnconfirmedComponents: false,
          hasInferredComponents: false,
          hasReplacedComponents: false,
        },
      };
    }
  }
}
