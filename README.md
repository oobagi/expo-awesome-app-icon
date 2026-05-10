# react-native-awesome-app-icon

Dynamically switch between bundled app icons in Expo apps.

This package uses the native iOS alternate icon API and Android launcher
`activity-alias` components. Icons must be declared at build time with the
config plugin, then selected at runtime from JavaScript.

## Install

```sh
npx expo install react-native-awesome-app-icon
```

This package contains native code and does not work in Expo Go. Use a
development, preview, or production build.

## Configure

Add the config plugin to your Expo config and rebuild the native app.

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-awesome-app-icon",
        {
          "icons": {
            "dark": {
              "image": "./assets/icons/dark.png"
            },
            "brand": {
              "ios": "./assets/icons/brand-ios.png",
              "android": {
                "legacyImage": "./assets/icons/brand-legacy.png",
                "foregroundImage": "./assets/icons/brand-foreground.png",
                "backgroundColor": "#111827",
                "monochromeImage": "./assets/icons/brand-monochrome.png"
              }
            }
          }
        }
      ]
    ]
  }
}
```

Then regenerate native projects or create a new EAS build:

```sh
npx expo prebuild --clean
```

## Use

```ts
import AwesomeAppIcon from 'react-native-awesome-app-icon';

await AwesomeAppIcon.setAppIcon('dark');
const currentIcon = AwesomeAppIcon.getAppIcon();
const icons = AwesomeAppIcon.getAvailableIcons();

await AwesomeAppIcon.setAppIcon(null); // reset to primary icon
```

Named exports are also available:

```ts
import {
  getAppIcon,
  getAvailableIcons,
  setAppIcon,
  supportsAlternateIcons,
} from 'react-native-awesome-app-icon';
```

## Platform notes

- iOS calls `UIApplication.setAlternateIconName`. The system shows Apple's
  confirmation alert after a successful icon change.
- Android switches between generated launcher aliases. The launcher may take a
  moment to refresh the visible icon, depending on device and launcher.
- Adding, removing, or changing icon assets requires a native rebuild. EAS
  Update cannot add new native icon resources.
