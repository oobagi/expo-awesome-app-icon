const fs = require('fs');
const path = require('path');

const {
  AndroidConfig,
  IOSConfig,
  WarningAggregator,
  withAndroidColors,
  withAndroidManifest,
  withDangerousMod,
  withInfoPlist,
  withXcodeProject,
} = require('expo/config-plugins');
const { generateImageAsync } = require('@expo/image-utils');

const IOS_ICON_NAMES_KEY = 'AwesomeAppIconIconNames';
const IOS_ICON_MAP_KEY = 'AwesomeAppIconIconMap';
const ANDROID_ICON_NAMES_META_DATA = 'expo.modules.awesomeappicon.ICON_NAMES';
const ANDROID_ICON_ALIASES_META_DATA = 'expo.modules.awesomeappicon.ICON_ALIASES';
const ANDROID_DEFAULT_ALIAS_META_DATA = 'expo.modules.awesomeappicon.DEFAULT_ALIAS';
const ANDROID_RES_PATH = 'android/app/src/main/res';
const IOS_IMAGESET_ROOT = 'Images.xcassets';
const MODULE_PREFIX = 'AwesomeAppIcon';

const dpiValues = {
  mdpi: { folderName: 'mipmap-mdpi', scale: 1 },
  hdpi: { folderName: 'mipmap-hdpi', scale: 1.5 },
  xhdpi: { folderName: 'mipmap-xhdpi', scale: 2 },
  xxhdpi: { folderName: 'mipmap-xxhdpi', scale: 3 },
  xxxhdpi: { folderName: 'mipmap-xxxhdpi', scale: 4 },
};

const withAwesomeAppIcon = (config, props = {}) => {
  const icons = isObjectConfig(props.icons) ? props.icons : {};
  const records = Object.entries(icons).map(([name, icon]) => createIconRecord(name, icon));

  if (records.length === 0) {
    WarningAggregator.addWarningAndroid(
      'expo-awesome-app-icon',
      'No alternate app icons were configured.'
    );
    WarningAggregator.addWarningIOS(
      'expo-awesome-app-icon',
      'No alternate app icons were configured.'
    );
    return config;
  }

  config = withInfoPlist(config, (config) => {
    config.modResults[IOS_ICON_NAMES_KEY] = records.map((record) => record.name);
    config.modResults[IOS_ICON_MAP_KEY] = Object.fromEntries(
      records.map((record) => [record.name, record.iosName])
    );
    return config;
  });

  config = withXcodeProject(config, (config) => {
    const projectName = config.modRequest.projectName;
    if (!projectName) {
      return config;
    }
    const { target } = IOSConfig.XcodeUtils.getApplicationNativeTarget({
      project: config.modResults,
      projectName,
    });
    const configurations = IOSConfig.XcodeUtils.getBuildConfigurationsForListId(
      config.modResults,
      target.buildConfigurationList
    );
    for (const [, buildConfig] of configurations) {
      const buildSettings = buildConfig.buildSettings || {};
      const current = parseBuildSettingList(
        buildSettings.ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES
      ).filter((name) => !name.startsWith(MODULE_PREFIX));
      const iconNames = [
        ...current,
        ...records.map((record) => record.iosName),
      ].join(' ');
      buildSettings.ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES = `"${iconNames}"`;
      buildConfig.buildSettings = buildSettings;
    }
    return config;
  });

  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      await writeIosIconSetsAsync(config.modRequest.projectRoot, records);
      return config;
    },
  ]);

  config = withAndroidColors(config, (config) => {
    for (const record of records) {
      const android = record.android;
      if (hasAdaptiveConfig(android) && !android.backgroundImage) {
        config.modResults = AndroidConfig.Colors.assignColorValue(config.modResults, {
          name: `${record.resourceName}_background`,
          value: android.backgroundColor || '#ffffff',
        });
      }
    }
    return config;
  });

  config = withAndroidManifest(config, (config) => {
    config.modResults = setAndroidLauncherAliases(config, records);
    return config;
  });

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      await writeAndroidIconResourcesAsync(config.modRequest.projectRoot, records);
      return config;
    },
  ]);

  return config;
};

function createIconRecord(name, input) {
  if (!name || typeof name !== 'string') {
    throw new Error('Each alternate app icon must have a non-empty string name.');
  }
  if (!isObjectConfig(input)) {
    throw new Error(`Icon "${name}" must be an object with ios and android config.`);
  }
  if (!isObjectConfig(input.ios)) {
    throw new Error(`Icon "${name}" must define ios config.`);
  }
  if (!isObjectConfig(input.android)) {
    throw new Error(`Icon "${name}" must define android config.`);
  }

  const ios = input.ios;
  const android = input.android;
  const normalizedName = toResourceName(name);
  const resourceName = `awesome_app_icon_${normalizedName}`;
  const iosName = `${MODULE_PREFIX}${toPascalCase(normalizedName)}`;

  if (!ios.light) {
    throw new Error(`Icon "${name}" must define ios.light.`);
  }
  if (!android.image && !android.legacyImage && !android.foregroundImage) {
    throw new Error(`Icon "${name}" must define android.image, android.legacyImage, or android.foregroundImage.`);
  }

  return {
    name,
    ios,
    android,
    resourceName,
    iosName,
  };
}

function isObjectConfig(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function parseBuildSettingList(value) {
  if (!value || typeof value !== 'string') {
    return [];
  }
  return value
    .replace(/[()"']/g, ' ')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function writeIosIconSetsAsync(projectRoot, records) {
  const projectName = IOSConfig.XcodeUtils.getProjectName(projectRoot);
  const iosProjectRoot = path.join(projectRoot, 'ios', projectName);
  const assetRoot = path.join(iosProjectRoot, IOS_IMAGESET_ROOT);
  await fs.promises.mkdir(assetRoot, { recursive: true });

  for (const record of records) {
    const appIconSetPath = path.join(assetRoot, `${record.iosName}.appiconset`);
    await fs.promises.rm(appIconSetPath, { recursive: true, force: true });
    await fs.promises.mkdir(appIconSetPath, { recursive: true });

    const images = await writeIosUniversalIconsAsync(projectRoot, appIconSetPath, record);

    await fs.promises.writeFile(
      path.join(appIconSetPath, 'Contents.json'),
      JSON.stringify({ images, info: { author: 'xcode', version: 1 } }, null, 2)
    );
  }
}

async function writeIosUniversalIconsAsync(projectRoot, appIconSetPath, record) {
  const variants = [
    {
      src: record.ios.light,
      filename: `${record.iosName}-1024.png`,
      cacheType: `awesome-app-icon-ios-${record.iosName}`,
    },
    record.ios.dark && {
      src: record.ios.dark,
      filename: `${record.iosName}-dark-1024.png`,
      cacheType: `awesome-app-icon-ios-${record.iosName}-dark`,
      appearance: 'dark',
    },
    record.ios.tinted && {
      src: record.ios.tinted,
      filename: `${record.iosName}-tinted-1024.png`,
      cacheType: `awesome-app-icon-ios-${record.iosName}-tinted`,
      appearance: 'tinted',
    },
  ].filter(Boolean);

  return Promise.all(
    variants.map((variant) => writeIosUniversalIconAsync(projectRoot, appIconSetPath, variant))
  );
}

async function writeIosUniversalIconAsync(projectRoot, appIconSetPath, options) {
  const preserveTransparency = options.appearance === 'dark';
  const { source } = await generateImageAsync(
    { projectRoot, cacheType: options.cacheType },
    {
      src: options.src,
      name: options.filename,
      width: 1024,
      height: 1024,
      resizeMode: 'cover',
      removeTransparency: !preserveTransparency,
      backgroundColor: preserveTransparency ? 'transparent' : '#ffffff',
    }
  );
  await fs.promises.writeFile(path.join(appIconSetPath, options.filename), source);
  const image = {
    filename: options.filename,
    idiom: 'universal',
    platform: 'ios',
    size: '1024x1024',
  };
  if (options.appearance) {
    image.appearances = [{ appearance: 'luminosity', value: options.appearance }];
  }
  return image;
}

function setAndroidLauncherAliases(config, records) {
  const manifest = config.modResults;
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(manifest);
  const packageName = AndroidConfig.Package.getPackage(config);
  if (!packageName) {
    throw new Error('android.package must be set to configure dynamic Android launcher icons.');
  }
  const defaultAlias = `${packageName}.${MODULE_PREFIX}.Default`;
  const aliasMap = Object.fromEntries(
    records.map((record) => [
      record.name,
      `${packageName}.${MODULE_PREFIX}.${record.resourceName}`,
    ])
  );

  removeLauncherIntentFilters(mainActivity);

  application['activity-alias'] = (application['activity-alias'] || []).filter((alias) => {
    const aliasName = alias?.$?.['android:name'];
    return typeof aliasName !== 'string' || !aliasName.startsWith(`${packageName}.${MODULE_PREFIX}.`);
  });

  const targetActivity = mainActivity.$['android:name'];
  const label =
    mainActivity.$['android:label'] || application.$['android:label'] || '@string/app_name';
  const defaultIcon = application.$['android:icon'] || '@mipmap/ic_launcher';
  const aliases = [
    createLauncherAlias(defaultAlias, targetActivity, defaultIcon, label, true),
    ...records.map((record) =>
      createLauncherAlias(
        aliasMap[record.name],
        targetActivity,
        `@mipmap/${record.resourceName}`,
        label,
        false
      )
    ),
  ];

  application['activity-alias'].push(...aliases);
  upsertAndroidMetaData(application, ANDROID_ICON_NAMES_META_DATA, records.map((r) => r.name).join(','));
  upsertAndroidMetaData(application, ANDROID_ICON_ALIASES_META_DATA, JSON.stringify(aliasMap));
  upsertAndroidMetaData(application, ANDROID_DEFAULT_ALIAS_META_DATA, defaultAlias);

  return manifest;
}

function removeLauncherIntentFilters(activity) {
  activity['intent-filter'] = (activity['intent-filter'] || []).filter((filter) => {
    const actions = filter.action || [];
    const categories = filter.category || [];
    const hasMain = actions.some((action) => action?.$?.['android:name'] === 'android.intent.action.MAIN');
    const hasLauncher = categories.some(
      (category) => category?.$?.['android:name'] === 'android.intent.category.LAUNCHER'
    );
    return !(hasMain && hasLauncher);
  });
  if (activity['intent-filter'].length === 0) {
    delete activity['intent-filter'];
  }
}

function createLauncherAlias(name, targetActivity, icon, label, enabled) {
  return {
    $: {
      'android:name': name,
      'android:enabled': enabled ? 'true' : 'false',
      'android:exported': 'true',
      'android:icon': icon,
      'android:label': label,
      'android:targetActivity': targetActivity,
    },
    'intent-filter': [
      {
        action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
        category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
      },
    ],
  };
}

function upsertAndroidMetaData(application, name, value) {
  application['meta-data'] = (application['meta-data'] || []).filter(
    (item) => item?.$?.['android:name'] !== name
  );
  application['meta-data'].push({
    $: {
      'android:name': name,
      'android:value': value,
    },
  });
}

async function writeAndroidIconResourcesAsync(projectRoot, records) {
  for (const record of records) {
    await writeAndroidLegacyIconAsync(projectRoot, record);
    if (hasAdaptiveConfig(record.android)) {
      await writeAndroidAdaptiveIconAsync(projectRoot, record);
    }
  }
}

async function writeAndroidLegacyIconAsync(projectRoot, record) {
  const src = record.android.legacyImage || record.android.image || record.android.foregroundImage;
  await writeAndroidDensityImagesAsync(projectRoot, {
    src,
    outputName: `${record.resourceName}.png`,
    baselineSize: 48,
    cacheType: `awesome-app-icon-android-legacy-${record.resourceName}`,
    backgroundColor: 'transparent',
  });
}

async function writeAndroidAdaptiveIconAsync(projectRoot, record) {
  const foreground = record.android.foregroundImage || record.android.image;
  const backgroundImage = record.android.backgroundImage;
  const monochromeImage = record.android.monochromeImage;

  await writeAndroidDensityImagesAsync(projectRoot, {
    src: foreground,
    outputName: `${record.resourceName}_foreground.png`,
    baselineSize: 108,
    cacheType: `awesome-app-icon-android-foreground-${record.resourceName}`,
    backgroundColor: 'transparent',
  });

  if (backgroundImage) {
    await writeAndroidDensityImagesAsync(projectRoot, {
      src: backgroundImage,
      outputName: `${record.resourceName}_background.png`,
      baselineSize: 108,
      cacheType: `awesome-app-icon-android-background-${record.resourceName}`,
      backgroundColor: 'transparent',
    });
  }

  if (monochromeImage) {
    await writeAndroidDensityImagesAsync(projectRoot, {
      src: monochromeImage,
      outputName: `${record.resourceName}_monochrome.png`,
      baselineSize: 108,
      cacheType: `awesome-app-icon-android-monochrome-${record.resourceName}`,
      backgroundColor: 'transparent',
    });
  }

  const anyDpiDir = path.join(projectRoot, ANDROID_RES_PATH, 'mipmap-anydpi-v26');
  await fs.promises.mkdir(anyDpiDir, { recursive: true });
  await fs.promises.writeFile(
    path.join(anyDpiDir, `${record.resourceName}.xml`),
    createAdaptiveIconXml(record, Boolean(backgroundImage), Boolean(monochromeImage))
  );
}

async function writeAndroidDensityImagesAsync(projectRoot, options) {
  await Promise.all(
    Object.values(dpiValues).map(async ({ folderName, scale }) => {
      const folder = path.join(projectRoot, ANDROID_RES_PATH, folderName);
      await fs.promises.mkdir(folder, { recursive: true });
      const { source } = await generateImageAsync(
        { projectRoot, cacheType: `${options.cacheType}-${scale}` },
        {
          src: options.src,
          width: options.baselineSize * scale,
          height: options.baselineSize * scale,
          resizeMode: 'cover',
          backgroundColor: options.backgroundColor,
        }
      );
      await fs.promises.writeFile(path.join(folder, options.outputName), source);
    })
  );
}

function createAdaptiveIconXml(record, hasBackgroundImage, hasMonochromeImage) {
  const background = hasBackgroundImage
    ? `@mipmap/${record.resourceName}_background`
    : `@color/${record.resourceName}_background`;
  const elements = [
    `<background android:drawable="${background}"/>`,
    `<foreground android:drawable="@mipmap/${record.resourceName}_foreground"/>`,
  ];
  if (hasMonochromeImage) {
    elements.push(`<monochrome android:drawable="@mipmap/${record.resourceName}_monochrome"/>`);
  }
  return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    ${elements.join('\n    ')}
</adaptive-icon>
`;
}

function hasAdaptiveConfig(android) {
  return Boolean(android.foregroundImage || android.backgroundImage || android.backgroundColor || android.monochromeImage);
}

function toResourceName(value) {
  const name = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
  if (!name) {
    throw new Error(`Invalid app icon name "${value}".`);
  }
  return /^[a-z]/.test(name) ? name : `icon_${name}`;
}

function toPascalCase(value) {
  const words = value.split('_');
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

module.exports = withAwesomeAppIcon;
