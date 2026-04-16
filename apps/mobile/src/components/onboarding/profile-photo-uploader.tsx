/**
 * Profile Photo Uploader Component
 * Handles profile photo selection from camera or library
 */
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Button,
  Divider,
  Icon,
  List,
  Portal,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import { BottomSheet } from '@/components/common/bottom-sheet';
import { BORDER_RADIUS } from '@/constants/ui';

interface ProfilePhotoUploaderProps {
  currentPhoto?: string | null;
  onPhotoSelected: (uri: string) => void;
  onPhotoRemoved: () => void;
  onError?: (message: string) => void;
  onPermissionDenied?: (source: 'camera' | 'library') => void;
  mode?: 'buttons' | 'menu';
}

async function requestCameraPermission(): Promise<boolean> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  return permission.status === 'granted';
}

async function requestLibraryPermission(): Promise<boolean> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return permission.status === 'granted';
}

export function ProfilePhotoUploader({
  currentPhoto,
  onPhotoSelected,
  onPhotoRemoved,
  onError,
  onPermissionDenied,
  mode = 'buttons',
}: ProfilePhotoUploaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleTakePhoto = useCallback(async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      onError?.(t('onboarding.profile_photo.camera_permission_required'));
      onPermissionDenied?.('camera');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        mediaTypes: ['images'],
      });

      if (!result.canceled && result.assets.length > 0) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.warn('Failed to launch camera:', error);
      onError?.(t('onboarding.profile_photo.camera_error'));
    }
  }, [onError, onPermissionDenied, onPhotoSelected, t]);

  const handleChooseFromLibrary = useCallback(async () => {
    const hasPermission = await requestLibraryPermission();
    if (!hasPermission) {
      onError?.(t('onboarding.profile_photo.library_permission_required'));
      onPermissionDenied?.('library');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        mediaTypes: ['images'],
      });

      if (!result.canceled && result.assets.length > 0) {
        onPhotoSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.warn('Failed to open photo library:', error);
      onError?.(t('onboarding.profile_photo.library_error'));
    }
  }, [onError, onPermissionDenied, onPhotoSelected, t]);

  const showPickerMenu = useCallback(() => {
    setMenuVisible(true);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuVisible(false);
  }, []);

  const selectFromLibrary = useCallback(() => {
    setMenuVisible(false);
    void handleChooseFromLibrary();
  }, [handleChooseFromLibrary]);

  const selectFromCamera = useCallback(() => {
    setMenuVisible(false);
    void handleTakePhoto();
  }, [handleTakePhoto]);

  const removeSelectedPhoto = useCallback(() => {
    setMenuVisible(false);
    onPhotoRemoved();
  }, [onPhotoRemoved]);

  const isMenuMode = mode === 'menu';

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole={isMenuMode ? 'button' : undefined}
        accessibilityLabel={
          isMenuMode ? t('onboarding.profile_photo.photo_selected_accessibility') : undefined
        }
        accessibilityHint={isMenuMode ? t('onboarding.profile_photo.tap_to_select') : undefined}
        onPress={isMenuMode ? showPickerMenu : undefined}
      >
        <Surface style={styles.preview} elevation={1}>
          <View style={styles.previewClip}>
            {currentPhoto ? (
              <Image
                source={{ uri: currentPhoto }}
                style={styles.image}
                contentFit="cover"
                transition={200}
                accessibilityLabel={t('onboarding.profile_photo.photo_selected_accessibility')}
              />
            ) : (
              <View style={styles.placeholder}>
                <Avatar.Icon icon="account" size={96} />
                {!isMenuMode ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                    {t('onboarding.profile_photo.tap_to_select')}
                  </Text>
                ) : null}
              </View>
            )}
          </View>
        </Surface>
      </Pressable>

      {isMenuMode ? (
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {t('onboarding.profile_photo.tap_to_select')}
        </Text>
      ) : null}

      {isMenuMode ? null : (
        <View style={styles.actions}>
          <Button
            mode="outlined"
            icon="camera"
            onPress={() => void handleTakePhoto()}
            accessibilityLabel={t('onboarding.profile_photo.camera_accessibility_label')}
          >
            {t('onboarding.profile_photo.camera_option')}
          </Button>
          <Button
            mode="outlined"
            icon="image"
            onPress={() => void handleChooseFromLibrary()}
            accessibilityLabel={t('onboarding.profile_photo.library_accessibility_label')}
          >
            {t('onboarding.profile_photo.photo_library_option')}
          </Button>
          {currentPhoto ? (
            <Button
              mode="text"
              icon={({ size, color }) => <Icon source="delete-outline" size={size} color={color} />}
              onPress={onPhotoRemoved}
            >
              {t('common.delete')}
            </Button>
          ) : null}
        </View>
      )}

      {isMenuMode ? (
        <Portal>
          <BottomSheet
            visible={menuVisible}
            onDismiss={closeMenu}
            title={t('onboarding.profile_photo.tap_to_select')}
          >
            <View style={styles.menuSheetContent}>
              <Surface style={[styles.menuGroup, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <List.Item
                  title={t('onboarding.profile_photo.photo_library_option')}
                  left={(props) => <List.Icon {...props} icon="image" color={theme.colors.primary} />}
                  onPress={selectFromLibrary}
                  style={styles.menuItem}
                />
                <Divider style={[styles.menuDivider, { backgroundColor: theme.colors.outlineVariant }]} />
                <List.Item
                  title={t('onboarding.profile_photo.camera_option')}
                  left={(props) => <List.Icon {...props} icon="camera" color={theme.colors.primary} />}
                  onPress={selectFromCamera}
                  style={styles.menuItem}
                />
                {currentPhoto ? (
                  <>
                    <Divider style={[styles.menuDivider, { backgroundColor: theme.colors.outlineVariant }]} />
                    <List.Item
                      title={t('common.delete')}
                      titleStyle={{ color: theme.colors.error }}
                      left={(props) => <List.Icon {...props} icon="delete-outline" color={theme.colors.error} />}
                      onPress={removeSelectedPhoto}
                      style={styles.menuItem}
                    />
                  </>
                ) : null}
              </Surface>

              <Surface style={[styles.menuCancelGroup, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <List.Item
                  title={t('common.cancel')}
                  titleStyle={styles.cancelTitle}
                  onPress={closeMenu}
                  style={styles.menuItem}
                />
              </Surface>
            </View>
          </BottomSheet>
        </Portal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  preview: {
    borderRadius: 80,
    height: 160,
    width: 160,
  },
  previewClip: {
    alignItems: 'center',
    borderRadius: 80,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  placeholder: {
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  actions: {
    gap: 10,
    width: '100%',
  },
  menuSheetContent: {
    gap: 10,
    paddingBottom: 10,
  },
  menuGroup: {
    borderRadius: BORDER_RADIUS.MD,
    overflow: 'hidden',
  },
  menuCancelGroup: {
    borderRadius: BORDER_RADIUS.MD,
    overflow: 'hidden',
  },
  menuItem: {
    minHeight: 52,
    paddingHorizontal: 4,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },
  cancelTitle: {
    textAlign: 'center',
    fontWeight: '700',
  },
});