/* global describe, expect, require, test */

const plugin = require('../app.plugin');

const { createIconRecords, splitIconRecordsByPlatform } = plugin._internal;

describe('app.plugin icon records', () => {
  test('accepts iOS-only icon config and produces only iOS records', () => {
    const records = createIconRecords({
      ocean: {
        ios: { light: './assets/ocean-ios.png' },
      },
    });

    const { iosRecords, androidRecords } = splitIconRecordsByPlatform(records);

    expect(iosRecords).toHaveLength(1);
    expect(iosRecords[0]).toMatchObject({
      name: 'ocean',
      iosName: 'AwesomeAppIconOcean',
      ios: { light: './assets/ocean-ios.png' },
      android: undefined,
    });
    expect(androidRecords).toHaveLength(0);
  });

  test('accepts Android-only icon config and produces only Android records', () => {
    const records = createIconRecords({
      ocean: {
        android: { image: './assets/ocean-android.png' },
      },
    });

    const { iosRecords, androidRecords } = splitIconRecordsByPlatform(records);

    expect(iosRecords).toHaveLength(0);
    expect(androidRecords).toHaveLength(1);
    expect(androidRecords[0]).toMatchObject({
      name: 'ocean',
      resourceName: 'awesome_app_icon_ocean',
      ios: undefined,
      android: { image: './assets/ocean-android.png' },
    });
  });

  test('accepts cross-platform icon config and produces both platform records', () => {
    const records = createIconRecords({
      ocean: {
        ios: { light: './assets/ocean-ios.png' },
        android: { foregroundImage: './assets/ocean-foreground.png' },
      },
    });

    const { iosRecords, androidRecords } = splitIconRecordsByPlatform(records);

    expect(iosRecords).toHaveLength(1);
    expect(androidRecords).toHaveLength(1);
    expect(iosRecords[0]).toBe(androidRecords[0]);
  });

  test('throws the iOS-specific error when iOS config is missing its light asset', () => {
    expect(() =>
      createIconRecords({
        ocean: {
          ios: {},
        },
      })
    ).toThrow('Icon "ocean" must define ios.light.');
  });

  test('throws the Android-specific error when Android config is missing icon assets', () => {
    expect(() =>
      createIconRecords({
        ocean: {
          android: {},
        },
      })
    ).toThrow('Icon "ocean" must define android.image or android.foregroundImage.');
  });

  test('throws a clear error when no platform config is defined', () => {
    expect(() =>
      createIconRecords({
        ocean: {},
      })
    ).toThrow('Icon "ocean" must define ios or android config.');
  });
});
