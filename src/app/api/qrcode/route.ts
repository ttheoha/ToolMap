import { NextRequest, NextResponse } from "next/server";

/**
 * Minimal QR code generator (alphanumeric mode, error correction L).
 * For simplicity, uses an external Google Charts API to generate QR codes as PNG.
 * This avoids adding a dependency while keeping the feature simple.
 */
export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get("text");
  const size = request.nextUrl.searchParams.get("size") || "200";

  if (!text) {
    return NextResponse.json({ error: "Missing text parameter" }, { status: 400 });
  }

  // Generate a simple QR code SVG using a minimal implementation
  // We'll use the qr-code approach via a redirect to a well-known QR API
  // For self-hosted: generate inline SVG
  const svg = generateQRSvg(text, parseInt(size));

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

// Minimal QR Code generator for short URLs (Version 2, 25x25, ECC L)
// Based on ISO/IEC 18004 simplified for byte mode
function generateQRSvg(text: string, size: number): string {
  const data = encodeData(text);
  const modules = placeModules(data);
  const scale = size / modules.length;

  let paths = "";
  for (let y = 0; y < modules.length; y++) {
    for (let x = 0; x < modules[y].length; x++) {
      if (modules[y][x]) {
        paths += `<rect x="${x * scale}" y="${y * scale}" width="${scale}" height="${scale}"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="white"/>
    <g fill="black">${paths}</g>
  </svg>`;
}

function encodeData(text: string): number[] {
  // Byte mode encoding
  const bytes = Buffer.from(text, "utf-8");
  const bits: number[] = [];

  // Mode indicator: byte mode = 0100
  pushBits(bits, 0b0100, 4);
  // Character count (8 bits for version 1-9 byte mode)
  pushBits(bits, bytes.length, 8);
  // Data
  for (const b of bytes) {
    pushBits(bits, b, 8);
  }
  // Terminator
  pushBits(bits, 0, 4);

  // Pad to 8-bit boundary
  while (bits.length % 8 !== 0) bits.push(0);

  // Choose version based on data capacity (ECC L, byte mode)
  // V1: 17 bytes, V2: 32 bytes, V3: 53 bytes, V4: 78 bytes
  const dataBytes = bits.length / 8;
  let version = 1;
  const capacities = [0, 17, 32, 53, 78, 106, 134];
  for (let v = 1; v < capacities.length; v++) {
    if (dataBytes <= capacities[v]) { version = v; break; }
  }

  // Recalculate with correct count length if version > 1 and count needs 16 bits
  // For versions 1-9, byte mode count is 8 bits, so we're fine

  const totalCapacity = capacities[version];

  // Pad with alternating bytes 0xEC, 0x11
  const padBytes = [0xEC, 0x11];
  let padIdx = 0;
  while (bits.length / 8 < totalCapacity) {
    pushBits(bits, padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bits to bytes
  const result: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | (bits[i + j] || 0);
    }
    result.push(byte);
  }

  return result;
}

function pushBits(arr: number[], value: number, count: number) {
  for (let i = count - 1; i >= 0; i--) {
    arr.push((value >> i) & 1);
  }
}

function placeModules(data: number[]): boolean[][] {
  // Determine version from data length
  const capacities = [0, 17, 32, 53, 78, 106, 134];
  let version = 1;
  for (let v = 1; v < capacities.length; v++) {
    if (data.length <= capacities[v]) { version = v; break; }
  }

  const size = 17 + version * 4;
  const grid: (boolean | null)[][] = Array.from({ length: size }, () => Array(size).fill(null));

  // Place finder patterns
  placeFinder(grid, 0, 0);
  placeFinder(grid, size - 7, 0);
  placeFinder(grid, 0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Alignment pattern (version >= 2)
  if (version >= 2) {
    const pos = size - 7;
    placeAlignment(grid, pos, pos);
  }

  // Format info (simplified - using mask 0, ECC L)
  const formatBits = 0b111011111000100; // ECC L, mask 0
  placeFormatInfo(grid, size, formatBits);

  // Version info (version >= 7 only, skip for now)

  // Place data
  const dataBits: number[] = [];
  for (const byte of data) {
    pushBits(dataBits, byte, 8);
  }

  // Add error correction (simplified Reed-Solomon)
  const eccBytes = getEccBytes(data, version);
  for (const byte of eccBytes) {
    pushBits(dataBits, byte, 8);
  }

  let bitIdx = 0;
  let upward = true;
  for (let col = size - 1; col >= 1; col -= 2) {
    if (col === 6) col = 5; // Skip timing column
    const rows = upward ? range(size - 1, -1) : range(0, size);
    for (const row of rows) {
      for (const c of [col, col - 1]) {
        if (grid[row][c] === null) {
          const bit = bitIdx < dataBits.length ? dataBits[bitIdx] : 0;
          // Apply mask 0: (row + col) % 2 === 0
          grid[row][c] = ((bit === 1) !== ((row + c) % 2 === 0));
          bitIdx++;
        }
      }
    }
    upward = !upward;
  }

  // Fill remaining nulls
  return grid.map(row => row.map(cell => cell === true));
}

function placeFinder(grid: (boolean | null)[][], startRow: number, startCol: number) {
  const pattern = [
    [1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1],
  ];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      if (startRow + r < grid.length && startCol + c < grid.length) {
        grid[startRow + r][startCol + c] = pattern[r][c] === 1;
      }
    }
  }
  // Separator
  for (let i = 0; i < 8; i++) {
    setIfInBounds(grid, startRow - 1, startCol + i, false);
    setIfInBounds(grid, startRow + 7, startCol + i, false);
    setIfInBounds(grid, startRow + i, startCol - 1, false);
    setIfInBounds(grid, startRow + i, startCol + 7, false);
  }
  setIfInBounds(grid, startRow - 1, startCol - 1, false);
  setIfInBounds(grid, startRow - 1, startCol + 7, false);
  setIfInBounds(grid, startRow + 7, startCol - 1, false);
  setIfInBounds(grid, startRow + 7, startCol + 7, false);
}

function placeAlignment(grid: (boolean | null)[][], centerRow: number, centerCol: number) {
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      const val = Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0);
      const row = centerRow + r;
      const col = centerCol + c;
      if (row >= 0 && row < grid.length && col >= 0 && col < grid.length && grid[row][col] === null) {
        grid[row][col] = val;
      }
    }
  }
}

function placeFormatInfo(grid: (boolean | null)[][], size: number, format: number) {
  const bits: boolean[] = [];
  for (let i = 14; i >= 0; i--) {
    bits.push(((format >> i) & 1) === 1);
  }
  // Around top-left finder
  const positions1 = [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,7],[8,8],[7,8],[5,8],[4,8],[3,8],[2,8],[1,8],[0,8]];
  for (let i = 0; i < 15; i++) {
    grid[positions1[i][0]][positions1[i][1]] = bits[i];
  }
  // Around other finders
  const positions2: number[][] = [];
  for (let i = 0; i < 7; i++) positions2.push([size - 1 - i, 8]);
  for (let i = 0; i < 8; i++) positions2.push([8, size - 8 + i]);
  for (let i = 0; i < Math.min(15, positions2.length); i++) {
    grid[positions2[i][0]][positions2[i][1]] = bits[i];
  }
  // Dark module
  grid[size - 8][8] = true;
}

function setIfInBounds(grid: (boolean | null)[][], r: number, c: number, val: boolean) {
  if (r >= 0 && r < grid.length && c >= 0 && c < grid.length) {
    grid[r][c] = val;
  }
}

function range(start: number, end: number): number[] {
  const arr: number[] = [];
  if (start < end) {
    for (let i = start; i < end; i++) arr.push(i);
  } else {
    for (let i = start; i > end; i--) arr.push(i);
  }
  return arr;
}

function getEccBytes(data: number[], version: number): number[] {
  // Simplified ECC using GF(256) Reed-Solomon
  const eccCounts = [0, 7, 10, 15, 20, 26, 36]; // ECC L byte counts per version
  const eccCount = eccCounts[version] || 10;

  // Generator polynomial coefficients for given ECC count
  const gen = rsGeneratorPoly(eccCount);
  const msgPoly = [...data, ...new Array(eccCount).fill(0)];

  for (let i = 0; i < data.length; i++) {
    const coef = msgPoly[i];
    if (coef !== 0) {
      for (let j = 0; j < gen.length; j++) {
        msgPoly[i + j] ^= gfMul(gen[j], coef);
      }
    }
  }

  return msgPoly.slice(data.length);
}

// GF(256) arithmetic
const GF_EXP = new Array(512);
const GF_LOG = new Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 256) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(count: number): number[] {
  let gen = [1];
  for (let i = 0; i < count; i++) {
    const next = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= gen[j];
      next[j + 1] ^= gfMul(gen[j], GF_EXP[i]);
    }
    gen = next;
  }
  return gen;
}
