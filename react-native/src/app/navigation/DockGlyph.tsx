import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export type DockSymbol = 'home' | 'surah' | 'hizb' | 'juz' | 'stats' | 'groups' | 'more';
/** One optical weight; geometry echoes manuscript folios and the pointed arch. */
export function DockGlyph({ symbol, color }: { symbol: DockSymbol; color: string }) {
  return (
    <Svg
      width={25}
      height={25}
      viewBox="0 0 28 28"
      fill="none"
      stroke={color}
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
    >
      {symbol === 'home' && (
        <>
          <Path d="M6 24V12c0-4 4-7 8-10 4 3 8 6 8 10v12H6Z" />
          <Path d="M11 24v-8a3 3 0 0 1 6 0v8M10 10h8" />
        </>
      )}
      {symbol === 'surah' && (
        <>
          <Path d="M14 7C10 4 6 4 2 5v18c4-1 8-1 12 2 4-3 8-3 12-2V5c-4-1-8-1-12 2Zm0 0v18M6 9c2-.1 3 .2 4 1M6 13c2-.1 3 .2 4 1M18 10c1-.8 2-1.1 4-1M18 14c1-.8 2-1.1 4-1" />
        </>
      )}
      {symbol === 'hizb' && (
        <>
          <Path d="m14 2 12 12-12 12L2 14 14 2Zm0 6 6 6-6 6-6-6 6-6ZM14 2v6m12 6h-6m-6 12v-6M2 14h6" />
        </>
      )}
      {symbol === 'juz' && (
        <>
          <Path d="M5 24V10c0-4 4-6 9-8 5 2 9 4 9 8v14H5ZM9 10h10M9 14h10M9 18h10" />
          <Path d="M9 24v-2h10v2" />
        </>
      )}
      {symbol === 'stats' && (
        <>
          <Circle cx={14} cy={14} r={10} />
          <Path d="M14 4v10l7 7M14 14l-9 4" />
        </>
      )}
      {symbol === 'groups' && (
        <>
          <Circle cx={14} cy={9} r={3.5} />
          <Path d="M7 23v-2a7 7 0 0 1 14 0v2H7ZM5 12a3 3 0 0 0 0 6M23 12a3 3 0 0 1 0 6M3 23v-1a5 5 0 0 1 2-4m20 5v-1a5 5 0 0 0-2-4" />
        </>
      )}
      {symbol === 'more' && (
        <>
          {[5, 14, 23].map((cx) => (
            <Circle key={cx} cx={cx} cy={14} r={1.7} fill={color} stroke="none" />
          ))}
        </>
      )}
    </Svg>
  );
}
