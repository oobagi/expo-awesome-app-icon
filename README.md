# expo-awesome-app-icon

Dynamically switch between bundled app icons in Expo apps.

This package uses the native iOS alternate icon API and Android launcher `activity-alias` components. Icons must be declared at build time with the config plugin, then selected at runtime from JavaScript.

> [!WARNING]
> This package contains native code and does not work in Expo Go. Use a development, preview, or production build.

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
} from "expo-awesome-app-icon";

if (supportsAlternateIcons()) {
  await setAppIcon("sunset");
}

const currentIcon = getAppIcon();
const icons = getAvailableIcons();

await setAppIcon(null); // reset to primary icon
```

## Configure

Add the config plugin to your Expo config and rebuild the native app.

`app.json` example:

```jsonc
{
  "expo": {
    "plugins": [
      [
        "expo-awesome-app-icon",
        {
          "icons": {
            // minimal icon example
            "ocean": {
              // ios automatically generates dark & tinted variants
              "ios": { "light": "./assets/icons/ocean-ios-light.png" },
              // "image" becomes "foregroundImage" in newer Android APIs
              "android": { "image": "./assets/icons/ocean-android.png" },
            },
            // fully-loaded icon example
            "sunset": {
              "ios": {
                "light": "./assets/icons/sunset-ios-light.png",
                // optional dark icon
                "dark": "./assets/icons/sunset-ios-dark.png",
                // optional tinted icon
                "tinted": "./assets/icons/sunset-ios-tinted.png",
              },
              "android": {
                "image": "./assets/icons/sunset-android.png",
                // optional adaptive foreground icon
                "foregroundImage": "./assets/icons/sunset-foreground.png",
                // optional adaptive background image
                "backgroundImage": "./assets/icons/sunset-background.png",
                // optional adaptive background color (overriden by "backgroundImage")
                "backgroundColor": "#f97316",
                // optional themed icon
                "monochromeImage": "./assets/icons/sunset-monochrome.png",
              },
            },
          },
        },
      ],
    ],
  },
}
```

Then regenerate native projects or create a new EAS build:

```sh
npx expo prebuild --clean
```

The keys under `icons` are the runtime icon names passed to `setAppIcon`. On iOS, `ios: { light, dark, tinted }` generates appearance variants inside the same alternate app icon set. Calling `setAppIcon('sunset')` selects the alternate icon, then iOS automatically displays the light/default, dark, or tinted artwork based on the user's Home Screen icon appearance.

## Icon images

Use PNG source images and keep the artwork centered. The plugin resizes and writes the native icon files during prebuild, so the source files do not need platform-specific density suffixes.

For platform design guidance, see Apple's [App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons) and Android's [Adaptive icons](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive) docs.

### iOS

- `ios.light` is required. It is resized to a single 1024 x 1024 universal app icon image. Transparency is removed and transparent pixels are composited onto white.
- `ios.dark` is optional. It is also resized to 1024 x 1024, but transparency is preserved so the system-provided dark icon background can show through.
- `ios.tinted` is optional. It is resized to 1024 x 1024 and should be grayscale artwork. Transparency is removed and transparent pixels are composited onto white.

> [!TIP]
> For the cleanest output, work with at least 1024 x 1024 or larger. Smaller images work, but they have to be scaled up.

### Android

- `android.image` is the full-square fallback launcher icon. The plugin writes legacy launcher PNGs at mdpi 48 x 48, hdpi 72 x 72, xhdpi 96 x 96, xxhdpi 144 x 144, and xxxhdpi 192 x 192.
- `android.foregroundImage` is the adaptive icon foreground layer. The plugin writes it at mdpi 108 x 108, hdpi 162 x 162, xhdpi 216 x 216, xxhdpi 324 x 324, and xxxhdpi 432 x 432. Use transparency and leave padding around the main shape so Android launchers can mask it safely.
- `android.backgroundImage` is the adaptive icon background layer. It is written at the same adaptive sizes as the foreground and should usually be opaque and full bleed.
- `android.backgroundColor` is used instead of `backgroundImage` when no background image is provided.
- `android.monochromeImage` is optional themed-icon artwork. Use a simple single-color shape with transparency around it.

> If only `android.image` is provided, the package generates the legacy launcher icon from it. If adaptive fields are provided, the package also generates an adaptive icon XML resource for Android 8.0 and newer.

## Platform notes

- iOS calls `UIApplication.setAlternateIconName`. The system shows Apple's confirmation alert after a successful icon change; suppressing it requires private APIs, which this package avoids for App Store compatibility.
- Android switches between generated launcher aliases. The launcher may take a moment to refresh the visible icon, depending on device and launcher.
- Adding, removing, or changing icon assets requires a native rebuild. EAS Update cannot add new native icon resources.
