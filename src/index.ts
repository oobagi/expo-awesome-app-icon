import AwesomeAppIconModule from './AwesomeAppIconModule';
import type { AppIconName } from './AwesomeAppIcon.types';

export function supportsAlternateIcons(): boolean {
  return AwesomeAppIconModule.supportsAlternateIcons();
}

export function getAvailableIcons(): AppIconName[] {
  return AwesomeAppIconModule.getAvailableIcons();
}

export function getAppIcon(): AppIconName | null {
  return AwesomeAppIconModule.getAppIcon();
}

export async function setAppIcon(iconName: AppIconName | null): Promise<void> {
  await AwesomeAppIconModule.setAppIconAsync(iconName);
}

export default {
  supportsAlternateIcons,
  getAvailableIcons,
  getAppIcon,
  setAppIcon,
};

export * from './AwesomeAppIcon.types';
