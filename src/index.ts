// Reexport the native module. On web, it will be resolved to AwesomeAppIconModule.web.ts
// and on native platforms to AwesomeAppIconModule.ts
export { default } from './AwesomeAppIconModule';
export { default as AwesomeAppIconView } from './AwesomeAppIconView';
export * from  './AwesomeAppIcon.types';
