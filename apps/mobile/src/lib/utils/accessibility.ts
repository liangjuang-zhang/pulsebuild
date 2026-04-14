import { AccessibilityInfo } from 'react-native';

export async function announceForScreenReader(message: string): Promise<void> {
  try {
    await AccessibilityInfo.announceForAccessibility(message);
  } catch {
    // Ignore announcement failures
  }
}