import { NativeModule, requireNativeModule } from 'expo';

import type { AppIconName } from './AwesomeAppIcon.types';

declare class AwesomeAppIconModule extends NativeModule {
  supportsAlternateIcons(): boolean;
  getAvailableIcons(): AppIconName[];
  getAppIcon(): AppIconName | null;
  setAppIconAsync(iconName: AppIconName | null): Promise<void>;
}

// This call loads the native module object from the JSI.
const nativeModule = requireNativeModule<AwesomeAppIconModule>('AwesomeAppIcon');

export default nativeModule;
