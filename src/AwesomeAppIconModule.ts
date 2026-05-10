import { NativeModule, requireNativeModule } from 'expo';

import { AwesomeAppIconModuleEvents } from './AwesomeAppIcon.types';

declare class AwesomeAppIconModule extends NativeModule<AwesomeAppIconModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<AwesomeAppIconModule>('AwesomeAppIcon');
