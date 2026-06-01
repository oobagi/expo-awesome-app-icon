# expo-awesome-app-icon

Dynamically switch between bundled app icons in Expo apps.

This package uses the native iOS alternate icon API and Android launcher
`activity-alias` components. Icons must be declared at build time with the
config plugin, then selected at runtime from JavaScript.

This package contains native code and does not work in Expo Go. Use a
development, preview, or production build.

## Install

```sh
npx expo install expo-awesome-app-icon
```

## Use

```ts
import {
  getAppIcon,
  getAvailableIcons,
  setAppIcon,
  supportsAlternateIcons,
} from 'expo-awesome-app-icon';

if (supportsAlternateIcons()) {
  await setAppIcon('sunset');
}

const currentIcon = getAppIcon();
const icons = getAvailableIcons();

await setAppIcon(null); // reset to primary icon
```

## Configure

Add the config plugin to your Expo config and rebuild the native app.

`app.json` example:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-awesome-app-icon",
        {
          "icons": {
            "ocean": {
              "ios": {
                "light": "./assets/icons/ocean-ios-light.png"
              },
              "android": {
                "image": "./assets/icons/ocean-android.png"
              }
            },
            "forest": {
              "ios": {
                "light": "./assets/icons/forest-ios-light.png"
              },
              "android": {
                "image": "./assets/icons/forest-android.png"
              }
            },
            "sunset": {
              "ios": {
                "light": "./assets/icons/sunset-ios-light.png",
                "dark": "./assets/icons/sunset-ios-dark.png",
                "tinted": "./assets/icons/sunset-ios-tinted.png"
              },
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
On iOS, `ios: { light, dark, tinted }` generates appearance variants inside the
same alternate app icon set. Calling `setAppIcon('sunset')` selects the logical
alternate icon, then iOS automatically displays the light/default, dark, or
tinted artwork based on the user's Home Screen icon appearance.

For best iOS results, provide dark icon artwork with a transparent background so
the system background can show through, and provide tinted icon artwork as a
grayscale image.

## Platform notes

- iOS calls `UIApplication.setAlternateIconName`. The system shows Apple's
  confirmation alert after a successful icon change; suppressing it requires
  private APIs, which this package avoids for App Store compatibility.
- Android switches between generated launcher aliases. The launcher may take a
  moment to refresh the visible icon, depending on device and launcher.
- Adding, removing, or changing icon assets requires a native rebuild. EAS
  Update cannot add new native icon resources.
