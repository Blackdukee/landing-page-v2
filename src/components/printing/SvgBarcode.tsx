import React from 'react';

/**
 * Code 128 Barcode Table (Code Set B)
 * Patterns of 6 numbers representing bar and space widths (sum = 11 modules per char)
 */
const CODE128_PATTERNS: string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112" // 106 = STOP
];

const START_CODE_B = 104;
const STOP_CODE = 106;

function encodeCode128(text: string): string {
  if (!text) return '';
  
  const codes: number[] = [START_CODE_B];
  let checkSum = START_CODE_B;

  for (let i = 0; i < text.length; i++) {
    const ascii = text.charCodeAt(i);
    const code = ascii - 32;
    if (code >= 0 && code <= 95) {
      codes.push(code);
      checkSum += code * (i + 1);
    }
  }

  const checkDigit = checkSum % 103;
  codes.push(checkDigit);
  codes.push(STOP_CODE);

  // Convert codes to binary bar string (1 = bar, 0 = space)
  let binary = '';
  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code];
    if (!pattern) continue;
    let isBar = true;
    for (const widthChar of pattern) {
      const width = parseInt(widthChar, 10);
      binary += (isBar ? '1' : '0').repeat(width);
      isBar = !isBar;
    }
  }

  return binary;
}

export interface SvgBarcodeProps {
  value: string;
  width?: number; // module width in px
  height?: number; // bar height in px
  displayValue?: boolean;
  className?: string;
}

export const SvgBarcode: React.FC<SvgBarcodeProps> = ({
  value,
  width = 1.6,
  height = 36,
  displayValue = true,
  className = ''
}) => {
  const binary = encodeCode128(value);

  if (!binary) {
    return <div className="text-xs text-rose-500">Invalid barcode</div>;
  }

  const quietZoneModules = 10;
  const totalModules = binary.length + quietZoneModules * 2;
  const svgWidth = totalModules * width;
  const svgHeight = height + (displayValue ? 14 : 0);

  // Build rects for runs of 1s
  const rects: { x: number; w: number }[] = [];
  let currentRun = 0;
  let startX = 0;

  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      if (currentRun === 0) startX = i;
      currentRun++;
    } else {
      if (currentRun > 0) {
        rects.push({
          x: (startX + quietZoneModules) * width,
          w: currentRun * width
        });
        currentRun = 0;
      }
    }
  }
  if (currentRun > 0) {
    rects.push({
      x: (startX + quietZoneModules) * width,
      w: currentRun * width
    });
  }

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        className="shape-crispEdges block"
      >
        <rect width="100%" height="100%" fill="#ffffff" />
        {rects.map((r, idx) => (
          <rect
            key={idx}
            x={r.x}
            y={0}
            width={r.w}
            height={height}
            fill="#000000"
          />
        ))}
        {displayValue && (
          <text
            x={svgWidth / 2}
            y={height + 11}
            textAnchor="middle"
            fill="#000000"
            fontSize="10"
            fontFamily="monospace"
            fontWeight="bold"
            letterSpacing="1px"
          >
            {value}
          </text>
        )}
      </svg>
    </div>
  );
};
