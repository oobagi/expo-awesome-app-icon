export type AppIconName = string;

export type AndroidIconConfig = {
  /**
   * Full square fallback launcher icon. Used for pre-adaptive Android launchers
   * and as the fallback when adaptive icon layers are not provided.
   */
  image?: string;
  foregroundImage?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  monochromeImage?: string;
};

export type IosIconConfig = {
  /**
   * Light/default iOS alternate app icon image.
   */
  light: string;
  /**
   * Dark appearance iOS alternate app icon image.
   */
  dark?: string;
  /**
   * Tinted appearance iOS alternate app icon image.
   */
  tinted?: string;
};

export type DynamicAppIconConfig = {
  icons: Record<
    string,
    {
      ios: IosIconConfig;
      android: AndroidIconConfig;
    }
  >;
};
