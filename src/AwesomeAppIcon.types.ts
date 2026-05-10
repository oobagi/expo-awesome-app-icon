export type AppIconName = string;

export type AndroidIconConfig = {
  /**
   * Full square fallback launcher icon. Used for pre-adaptive Android launchers
   * and as the fallback when adaptive icon layers are not provided.
   */
  image?: string;
  legacyImage?: string;
  foregroundImage?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  monochromeImage?: string;
};

export type IosIconConfig = {
  image?: string;
};

export type DynamicAppIconConfig = {
  icons: Record<
    string,
    | string
    | {
        image?: string;
        ios?: IosIconConfig | string;
        android?: AndroidIconConfig | string;
      }
  >;
};
