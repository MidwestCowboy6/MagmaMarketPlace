import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { generateQRMatrix } from '@/lib/qr-code';

interface QRCodeProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
}

export function QRCode({
  value,
  size = 200,
  backgroundColor = '#ffffff',
  color = '#000000',
}: QRCodeProps) {
  const matrix = useMemo(() => generateQRMatrix(value), [value]);

  const moduleCount = matrix.length;
  const moduleSize = size / moduleCount;

  return (
    <View style={{ width: size, height: size, backgroundColor }}>
      <Svg width={size} height={size}>
        {matrix.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            if (cell === 1) {
              return (
                <Rect
                  key={`${rowIndex}-${colIndex}`}
                  x={colIndex * moduleSize}
                  y={rowIndex * moduleSize}
                  width={moduleSize}
                  height={moduleSize}
                  fill={color}
                />
              );
            }
            return null;
          })
        )}
      </Svg>
    </View>
  );
}
