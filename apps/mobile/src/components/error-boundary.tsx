/**
 * Error Boundary - Catches React errors with i18n support
 * Following Expo Router error handling best practices
 */
import { Component, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import * as Sentry from '@sentry/react-native';
import { useTranslation } from 'react-i18next';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack } },
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

/**
 * Error Fallback UI with i18n support
 */
function ErrorFallback({ error, onRetry }: { error: Error | null; onRetry: () => void }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
        {t('onboarding.error_boundary.title')}
      </Text>
      <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
        {t('onboarding.error_boundary.message')}
      </Text>
      {error?.message && __DEV__ && (
        <Text variant="bodySmall" style={[styles.errorDetail, { color: theme.colors.error }]}>
          {t('onboarding.error_boundary.dev_error_details')}
          {'\n'}
          {error.message}
        </Text>
      )}
      <Button mode="contained" onPress={onRetry} style={styles.button}>
        {t('onboarding.error_boundary.try_again')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    marginBottom: 24,
    textAlign: 'center',
  },
  errorDetail: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 12,
  },
  button: {
    marginTop: 8,
  },
});