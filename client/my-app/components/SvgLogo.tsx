import React from 'react';
import { View, TouchableWithoutFeedback, Platform } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface SvgLogoProps {
  width?: number;
  height?: number;
  color?: string;
  onPress?: () => void;
}

const SvgLogo: React.FC<SvgLogoProps> = ({ 
  width = 60, 
  height = 60, 
  color = '#000000',
  onPress
}) => {
  // Adăugăm stilul de cursor pointer pentru versiunea web când logo-ul are onPress
  const webStyles = Platform.OS === 'web' && onPress 
    ? { cursor: 'pointer' as 'pointer' } 
    : {};

  const content = (
    <View 
      style={{ 
        width, 
        height, 
        justifyContent: 'center', 
        alignItems: 'center',
        ...webStyles,
      }}
    >
      <Svg 
        width="60%" 
        height="60%" 
        viewBox="0 0 1350 1350"
        preserveAspectRatio="xMidYMid meet"
        style={webStyles}
      >
        <G transform="translate(-1700,2900) scale(0.35,-0.35)" fill={color} stroke="none">
          <Path d="M6545 7580 c-70 -13 -206 -55 -253 -79 -9 -5 -37 -19 -62 -31 -184 -93 -397 -303 -494 -485 -15 -27 -31 -57 -35 -65 -89 -160 -146 -442 -121 -605 7 -44 16 -102 20 -130 10 -66 40 -178 51 -189 5 -6 9 -19 9 -29 0 -10 6 -31 14 -45 7 -15 24 -49 36 -77 43 -95 154 -249 248 -344 91 -92 93 -93 130 -87 73 11 213 96 339 205 103 89 185 183 310 357 68 94 57 77 179 279 210 347 319 493 419 563 57 39 83 47 156 47 66 0 82 -4 117 -27 82 -55 130 -131 163 -257 21 -82 26 -270 9 -316 -5 -14 -14 -49 -19 -78 -11 -66 -24 -100 -80 -217 -128 -268 -345 -479 -611 -593 -19 -8 -52 -22 -73 -31 -21 -9 -48 -16 -60 -16 -31 0 -72 -29 -59 -42 12 -12 206 6 307 29 226 50 419 170 587 363 89 103 113 141 211 335 6 11 14 33 18 50 4 16 12 44 18 60 40 116 44 151 45 335 0 188 -4 222 -51 390 -54 191 -171 396 -309 540 -51 53 -82 78 -186 155 -51 38 -93 45 -131 21 -209 -130 -348 -239 -488 -383 -93 -95 -249 -291 -249 -313 0 -5 -4 -10 -8 -10 -5 0 -14 -10 -21 -22 -6 -13 -19 -35 -29 -49 -18 -28 -100 -158 -117 -187 -63 -106 -200 -286 -248 -327 -135 -116 -263 -93 -340 60 -8 17 -21 65 -28 107 -23 140 17 327 108 505 123 239 281 400 568 581 11 6 30 16 43 22 20 9 33 42 15 39 -5 -1 -26 -5 -48 -9z" />
        </G>
      </Svg>
    </View>
  );

  if (onPress) {
    return (
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={{ 
          position: 'relative', 
          width, 
          height 
        }}>
          {content}
        </View>
      </TouchableWithoutFeedback>
    );
  }

  return content;
};

export default SvgLogo; 