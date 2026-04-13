import { LogBox } from 'react-native';

let isConfigured = false;

export const configureExpoErrorControl = () => {
  if (isConfigured) return;
  isConfigured = true;

  if (!__DEV__) return;

  // Hide default Expo/RN warning popups in development.
  LogBox.ignoreAllLogs(true);

  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  console.error = (...args: any[]) => {
    const text = args.map((item) => String(item)).join(' ');

    // Swallow handled API/runtime noise to avoid default bottom toasts.
    if (
      text.includes('AxiosError') ||
      text.includes('Response data:') ||
      text.includes('Response status:') ||
      text.includes('Possible Unhandled Promise Rejection')
    ) {
      return;
    }

    // Keep silent in development unless you explicitly re-enable logging.
    return;
  };

  console.warn = () => {
    return;
  };

  const globalAny = globalThis as any;

  if (typeof globalAny.addEventListener === 'function') {
    globalAny.addEventListener('unhandledrejection', (event: any) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }
    });
  }

  const errorUtils = globalAny.ErrorUtils;
  if (errorUtils?.setGlobalHandler && errorUtils.getGlobalHandler) {
    const defaultHandler = errorUtils.getGlobalHandler();

    errorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      // Prevent dev popup for non-fatal handled runtime errors.
      if (!isFatal) {
        return;
      }

      // Preserve fatal behavior in case you still want crash visibility.
      defaultHandler(error, isFatal);
    });
  }

  // Keep references to avoid lint removing side effects.
  void originalError;
  void originalWarn;
};
