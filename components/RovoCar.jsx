import Svg, { Path } from 'react-native-svg';

// Sleek Rovo car-silhouette mark — a single sweeping stroke that reads as a
// sports-car roofline tapering to a pointed nose. Used on Welcome (white) and
// the Home empty state (navy).
export default function RovoCar({ width = 300, color = '#FFFFFF' }) {
  const height = width * (78 / 320);
  return (
    <Svg width={width} height={height} viewBox="0 0 320 78" fill="none">
      <Path
        d="M6 66
           C70 60 96 28 156 23
           C214 18 262 30 300 44
           C312 48 316 54 309 55
           C300 44 268 40 214 41
           C226 47 236 53 240 60
           C240 61 238 62 236 61
           C226 52 210 46 190 45
           C150 44 104 50 60 62
           C42 67 22 73 10 74
           C4 74 1 68 6 66 Z"
        fill={color}
      />
    </Svg>
  );
}
