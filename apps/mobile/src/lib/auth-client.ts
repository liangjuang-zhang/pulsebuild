import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';
import {
  phoneNumberClient,
  inferAdditionalFields,
} from 'better-auth/client/plugins';
import * as SecureStore from 'expo-secure-store';

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL!,
  plugins: [
    expoClient({
      scheme: 'pulsebuild',
      storagePrefix: 'pulsebuild',
      storage: SecureStore,
    }),
    phoneNumberClient(),
    inferAdditionalFields({
      user: {
        countryCode: { type: 'string', required: false },
        timezone: { type: 'string', required: false },
        jobTitle: { type: 'string', required: false },
        companyName: { type: 'string', required: false },
        status: { type: 'string', required: false },
        onboardingCompletedAt: { type: 'date', required: false },
        onboardingSkippedSteps: { type: 'string', required: false },
        deletedAt: { type: 'date', required: false },
        lastLoginAt: { type: 'date', required: false },
      },
    }),
  ],
});
