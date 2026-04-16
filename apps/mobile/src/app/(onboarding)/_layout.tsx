/**
 * Onboarding Layout
 * Route group layout for onboarding screens
 */
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="personal-info" />
      <Stack.Screen name="profile-photo" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
}