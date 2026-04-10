import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="phone-entry" />
      <Stack.Screen name="code-verification" />
    </Stack>
  );
}
