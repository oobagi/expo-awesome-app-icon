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

Accepted icon config fields:

```js
[
  'react-native-awesome-app-icon',
  {
    icons: {
      iconName: './assets/icons/icon.png', // shorthand: use the same image on iOS and Android
      detailedIcon: {
        image: './assets/icons/shared.png', // fallback image for both platforms
        ios: './assets/icons/ios.png', // iOS alternate app icon image
        android: {
          image: './assets/icons/android.png', // Android fallback image
          legacyImage: './assets/icons/android-legacy.png', // legacy launcher icon
          foregroundImage: './assets/icons/android-foreground.png', // adaptive icon foreground
          backgroundImage: './assets/icons/android-background.png', // adaptive icon background image
          backgroundColor: '#f97316', // adaptive icon background color
          monochromeImage: './assets/icons/android-monochrome.png', // Android themed icon layer
        },
      },
    },
  },
]
```

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-awesome-app-icon",
        {
          "icons": {
            "ocean": {
              "image": "./assets/icons/ocean.png"
            },
            "forest": {
              "image": "./assets/icons/forest.png"
            },
            "sunset": {
              "ios": "./assets/icons/sunset-ios.png",
              "android": {
                "legacyImage": "./assets/icons/sunset-legacy.png",
                "foregroundImage": "./assets/icons/sunset-foreground.png",
                "backgroundColor": "#f97316",
                "monochromeImage": "./assets/icons/sunset-monochrome.png"
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

The keys under `icons` are the runtime icon names passed to `setAppIcon`.
Names like `ocean`, `forest`, and `sunset` are supported as normal alternate
icon names.
On iOS, the plugin generates one alternate app icon image per configured key;
it does not currently generate Apple's light, dark, or tinted appearance
variants inside a single app icon set.

## Use

```ts
import {
  getAppIcon,
  getAvailableIcons,
  setAppIcon,
  supportsAlternateIcons,
} from 'react-native-awesome-app-icon';

if (supportsAlternateIcons()) {
  await setAppIcon('sunset');
}

const currentIcon = getAppIcon();
const icons = getAvailableIcons();

await setAppIcon(null); // reset to primary icon
```

## Platform notes

- iOS calls `UIApplication.setAlternateIconName`. The system shows Apple's
  confirmation alert after a successful icon change.
- Android switches between generated launcher aliases. The launcher may take a
  moment to refresh the visible icon, depending on device and launcher.
- Adding, removing, or changing icon assets requires a native rebuild. EAS
  Update cannot add new native icon resources.
