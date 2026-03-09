// Simple QR Code generator using Reed-Solomon error correction
// Generates a QR code matrix for the given data

type QRMatrix = number[][];

// QR Code constants
const PAD0 = 0xec;
const PAD1 = 0x11;

// Error correction level L (7%)
const EC_CODEWORDS_L = [
  0, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28,
  28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
];

const TOTAL_CODEWORDS = [
  0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655,
  733, 815, 901, 991, 1085, 1156, 1258, 1364, 1474, 1588, 1706, 1828, 1921, 2051,
  2185, 2323, 2465, 2611, 2761, 2876, 3034, 3196, 3362, 3532, 3706,
];

// Galois Field math for Reed-Solomon
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

// Initialize Galois Field tables
let x = 1;
for (let i = 0; i < 255; i++) {
  GF_EXP[i] = x;
  GF_LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i++) {
  GF_EXP[i] = GF_EXP[i - 255];
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function generateReedSolomonPoly(numECCodewords: number): number[] {
  let poly = [1];
  for (let i = 0; i < numECCodewords; i++) {
    const newPoly = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      newPoly[j] ^= poly[j];
      newPoly[j + 1] ^= gfMul(poly[j], GF_EXP[i]);
    }
    poly = newPoly;
  }
  return poly;
}

function computeECCodewords(data: number[], numECCodewords: number): number[] {
  const poly = generateReedSolomonPoly(numECCodewords);
  const result = new Array(numECCodewords).fill(0);

  for (const byte of data) {
    const factor = byte ^ result[0];
    result.shift();
    result.push(0);
    for (let i = 0; i < numECCodewords; i++) {
      result[i] ^= gfMul(poly[i + 1], factor);
    }
  }

  return result;
}

function getVersion(dataLength: number): number {
  // Byte mode capacity for error correction level L
  const capacities = [
    0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520,
    586, 644, 718, 792, 858, 929, 1003, 1091, 1171, 1273, 1367, 1465, 1528, 1628,
    1732, 1840, 1952, 2068, 2188, 2303, 2431, 2563, 2699, 2809, 2953,
  ];

  for (let v = 1; v <= 40; v++) {
    if (dataLength <= capacities[v]) return v;
  }
  return 40;
}

function getSize(version: number): number {
  return 17 + version * 4;
}

function encodeData(data: string): number[] {
  const bytes: number[] = [];
  // Byte mode indicator (0100)
  // Character count (8 bits for version 1-9)
  const mode = 4; // Byte mode

  // Convert to bytes
  const dataBytes: number[] = [];
  for (let i = 0; i < data.length; i++) {
    dataBytes.push(data.charCodeAt(i));
  }

  const version = getVersion(data.length);
  const charCountBits = version <= 9 ? 8 : 16;

  // Build bit stream
  let bits = '';
  bits += mode.toString(2).padStart(4, '0');
  bits += data.length.toString(2).padStart(charCountBits, '0');

  for (const b of dataBytes) {
    bits += b.toString(2).padStart(8, '0');
  }

  // Add terminator
  const totalDataCodewords = TOTAL_CODEWORDS[version] - EC_CODEWORDS_L[version];
  const totalBits = totalDataCodewords * 8;
  const terminatorLength = Math.min(4, totalBits - bits.length);
  bits += '0'.repeat(terminatorLength);

  // Pad to byte boundary
  if (bits.length % 8 !== 0) {
    bits += '0'.repeat(8 - (bits.length % 8));
  }

  // Convert to bytes
  for (let i = 0; i < bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  // Add padding bytes
  let padToggle = true;
  while (bytes.length < totalDataCodewords) {
    bytes.push(padToggle ? PAD0 : PAD1);
    padToggle = !padToggle;
  }

  return bytes;
}

function createMatrix(size: number): QRMatrix {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(-1));
}

function addFinderPattern(matrix: QRMatrix, row: number, col: number): void {
  const size = matrix.length;
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const nr = row + r;
      const nc = col + c;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
        if (
          r === -1 ||
          r === 7 ||
          c === -1 ||
          c === 7 ||
          (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
          (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[nr][nc] =
            r >= 0 && r <= 6 && c >= 0 && c <= 6
              ? (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
                r === 0 ||
                r === 6 ||
                c === 0 ||
                c === 6
                ? 1
                : 0
              : 0;
        }
      }
    }
  }
}

function addAlignmentPattern(matrix: QRMatrix, row: number, col: number): void {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      matrix[row + r][col + c] =
        Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0) ? 1 : 0;
    }
  }
}

function getAlignmentPatternPositions(version: number): number[] {
  if (version === 1) return [];
  const positions = [6];
  const numPatterns = Math.floor(version / 7) + 2;
  const step = Math.floor(
    (getSize(version) - 13) / (numPatterns - 1)
  );
  const roundedStep = step % 2 === 0 ? step : step + 1;

  let pos = getSize(version) - 7;
  for (let i = 1; i < numPatterns; i++) {
    positions.unshift(pos);
    pos -= roundedStep;
  }
  positions[0] = 6;

  return positions;
}

function addTimingPatterns(matrix: QRMatrix): void {
  const size = matrix.length;
  for (let i = 8; i < size - 8; i++) {
    const bit = i % 2 === 0 ? 1 : 0;
    if (matrix[6][i] === -1) matrix[6][i] = bit;
    if (matrix[i][6] === -1) matrix[i][6] = bit;
  }
}

function addFormatInfo(matrix: QRMatrix, mask: number): void {
  const size = matrix.length;
  // Format info for error correction level L and given mask
  const formatBits = [
    0x77c4, 0x72f3, 0x7daa, 0x789d, 0x662f, 0x6318, 0x6c41, 0x6976,
  ][mask];

  // Place format info around finder patterns
  for (let i = 0; i < 15; i++) {
    const bit = (formatBits >> i) & 1;
    // Top-left
    if (i < 6) {
      matrix[i][8] = bit;
    } else if (i < 8) {
      matrix[i + 1][8] = bit;
    } else if (i < 9) {
      matrix[8][7] = bit;
    } else {
      matrix[8][14 - i] = bit;
    }
    // Top-right and bottom-left
    if (i < 8) {
      matrix[8][size - 1 - i] = bit;
    } else {
      matrix[size - 15 + i][8] = bit;
    }
  }
  // Dark module
  matrix[size - 8][8] = 1;
}

function addVersionInfo(matrix: QRMatrix, version: number): void {
  if (version < 7) return;

  const versionInfoBits = [
    0, 0, 0, 0, 0, 0, 0, 0x07c94, 0x085bc, 0x09a99, 0x0a4d3, 0x0bbf6, 0x0c762,
    0x0d847, 0x0e60d, 0x0f928, 0x10b78, 0x1145d, 0x12a17, 0x13532, 0x149a6,
    0x15683, 0x168c9, 0x177ec, 0x18ec4, 0x191e1, 0x1afab, 0x1b08e, 0x1cc1a,
    0x1d33f, 0x1ed75, 0x1f250, 0x209d5, 0x216f0, 0x228ba, 0x2379f, 0x24b0b,
    0x2542e, 0x26a64, 0x27541, 0x28c69,
  ][version];

  const size = matrix.length;
  for (let i = 0; i < 18; i++) {
    const bit = (versionInfoBits >> i) & 1;
    const row = Math.floor(i / 3);
    const col = size - 11 + (i % 3);
    matrix[row][col] = bit;
    matrix[col][row] = bit;
  }
}

function placeData(matrix: QRMatrix, data: number[]): void {
  const size = matrix.length;
  let bitIndex = 0;
  let upward = true;

  for (let col = size - 1; col >= 0; col -= 2) {
    if (col === 6) col = 5; // Skip timing column

    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;

      for (let c = 0; c < 2; c++) {
        const currentCol = col - c;
        if (matrix[row][currentCol] === -1) {
          const byteIndex = Math.floor(bitIndex / 8);
          const bitPos = 7 - (bitIndex % 8);
          if (byteIndex < data.length) {
            matrix[row][currentCol] = (data[byteIndex] >> bitPos) & 1;
          } else {
            matrix[row][currentCol] = 0;
          }
          bitIndex++;
        }
      }
    }
    upward = !upward;
  }
}

function applyMask(matrix: QRMatrix, mask: number): QRMatrix {
  const size = matrix.length;
  const result = matrix.map((row) => [...row]);

  const maskFn = [
    (r: number, c: number) => (r + c) % 2 === 0,
    (r: number, _c: number) => r % 2 === 0,
    (_r: number, c: number) => c % 3 === 0,
    (r: number, c: number) => (r + c) % 3 === 0,
    (r: number, c: number) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r: number, c: number) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r: number, c: number) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r: number, c: number) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
  ][mask];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Only mask data and error correction modules
      if (isDataModule(matrix, r, c, size) && maskFn(r, c)) {
        result[r][c] ^= 1;
      }
    }
  }

  return result;
}

function isDataModule(
  _matrix: QRMatrix,
  row: number,
  col: number,
  size: number
): boolean {
  // Check finder patterns
  if (
    (row < 9 && col < 9) ||
    (row < 9 && col >= size - 8) ||
    (row >= size - 8 && col < 9)
  ) {
    return false;
  }
  // Check timing patterns
  if (row === 6 || col === 6) return false;
  return true;
}

function evaluatePenalty(matrix: QRMatrix): number {
  let penalty = 0;
  const size = matrix.length;

  // Rule 1: Groups of 5+ same-color modules
  for (let r = 0; r < size; r++) {
    let count = 1;
    for (let c = 1; c < size; c++) {
      if (matrix[r][c] === matrix[r][c - 1]) {
        count++;
      } else {
        if (count >= 5) penalty += count - 2;
        count = 1;
      }
    }
    if (count >= 5) penalty += count - 2;
  }

  for (let c = 0; c < size; c++) {
    let count = 1;
    for (let r = 1; r < size; r++) {
      if (matrix[r][c] === matrix[r - 1][c]) {
        count++;
      } else {
        if (count >= 5) penalty += count - 2;
        count = 1;
      }
    }
    if (count >= 5) penalty += count - 2;
  }

  return penalty;
}

export function generateQRMatrix(data: string): QRMatrix {
  const version = getVersion(data.length);
  const size = getSize(version);

  // Create matrix
  const matrix = createMatrix(size);

  // Add finder patterns
  addFinderPattern(matrix, 0, 0);
  addFinderPattern(matrix, 0, size - 7);
  addFinderPattern(matrix, size - 7, 0);

  // Add alignment patterns
  const alignPositions = getAlignmentPatternPositions(version);
  for (const r of alignPositions) {
    for (const c of alignPositions) {
      if (matrix[r][c] === -1) {
        addAlignmentPattern(matrix, r, c);
      }
    }
  }

  // Add timing patterns
  addTimingPatterns(matrix);

  // Reserve format info area
  for (let i = 0; i < 9; i++) {
    if (matrix[i][8] === -1) matrix[i][8] = 0;
    if (matrix[8][i] === -1) matrix[8][i] = 0;
  }
  for (let i = 0; i < 8; i++) {
    if (matrix[8][size - 1 - i] === -1) matrix[8][size - 1 - i] = 0;
    if (matrix[size - 1 - i][8] === -1) matrix[size - 1 - i][8] = 0;
  }

  // Encode data
  const dataCodewords = encodeData(data);
  const ecCodewords = computeECCodewords(dataCodewords, EC_CODEWORDS_L[version]);
  const allCodewords = [...dataCodewords, ...ecCodewords];

  // Place data
  placeData(matrix, allCodewords);

  // Try all masks and pick best one
  let bestMask = 0;
  let bestPenalty = Infinity;
  let bestMatrix = matrix;

  for (let mask = 0; mask < 8; mask++) {
    const masked = applyMask(matrix, mask);
    const tempMatrix = masked.map((row) => [...row]);
    addFormatInfo(tempMatrix, mask);
    addVersionInfo(tempMatrix, version);

    const penalty = evaluatePenalty(tempMatrix);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
      bestMatrix = tempMatrix;
    }
  }

  // Apply best mask and add format/version info
  const finalMatrix = applyMask(matrix, bestMask);
  addFormatInfo(finalMatrix, bestMask);
  addVersionInfo(finalMatrix, version);

  return bestMatrix;
}
