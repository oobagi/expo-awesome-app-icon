# Changelog

## 1.0.0 - 2026-05-10

### New features

- Initial public release as `expo-awesome-app-icon`.
- Adds Expo config plugin support for declaring bundled alternate app icons.
- Adds runtime APIs for checking support, listing icons, reading the current
  icon, and switching icons.
- Supports iOS alternate app icons through `UIApplication.setAlternateIconName`.
- Supports Android launcher icon switching through generated
  `activity-alias` entries.

### Notes

- This package requires a development, preview, or production build. It does
  not run in Expo Go.
