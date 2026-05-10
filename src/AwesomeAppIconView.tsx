import { requireNativeView } from 'expo';
import * as React from 'react';

import { AwesomeAppIconViewProps } from './AwesomeAppIcon.types';

const NativeView: React.ComponentType<AwesomeAppIconViewProps> =
  requireNativeView('AwesomeAppIcon');

export default function AwesomeAppIconView(props: AwesomeAppIconViewProps) {
  return <NativeView {...props} />;
}
