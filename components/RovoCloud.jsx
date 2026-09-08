import Svg, { Path } from 'react-native-svg';

// Soft puffy cloud used as decoration on the Welcome screen and as the empty-state icon.
export default function RovoCloud({ width = 120, color = '#3A4A5C' }) {
  const height = width * (64 / 120);
  return (
    <Svg width={width} height={height} viewBox="0 0 120 64" fill="none">
      <Path
        d="M31 60
           C15 60 4 49 4 35
           C4 23 13 13 25 12
           C29 5 37 0 47 0
           C58 0 68 7 71 17
           C74 16 77 15 81 15
           C97 15 110 27 110 42
           C110 52 102 60 91 60
           Z"
        fill={color}
      />
    </Svg>
  );
}
