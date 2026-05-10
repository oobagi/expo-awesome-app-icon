import * as React from 'react';

import { AwesomeAppIconViewProps } from './AwesomeAppIcon.types';

export default function AwesomeAppIconView(props: AwesomeAppIconViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
