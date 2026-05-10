import { registerWebModule, NativeModule } from 'expo';

import { AwesomeAppIconModuleEvents } from './AwesomeAppIcon.types';

class AwesomeAppIconModule extends NativeModule<AwesomeAppIconModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(AwesomeAppIconModule, 'AwesomeAppIconModule');
