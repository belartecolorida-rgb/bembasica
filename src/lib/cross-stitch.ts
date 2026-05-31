import { DMC, nearest, rgbToHex, type ThreadColor } from "./dmc-palette";

export type StitchCell = { x: number; y: number; color: ThreadColor };
export type StitchResult = {
  cells: StitchCell[];
  cols: number;
  rows: number;
  legend: { color: ThreadColor; count: number }[];
};

/** Render an image into a cross-stitch grid mapped to DMC colors. */
export function imageToStitch(img: HTMLImageElement, count: number, widthCm = 20): StitchResult {
  // count = stitches per inch; widthCm desired finished width
  const inches = widthCm / 2.54;
  const cols = Math.max(20, Math.round(inches * count));
  const ratio = img.height / img.width;
  const rows = Math.round(cols * ratio);

  const c = document.createElement("canvas");
  c.width = cols; c.height = rows;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(img, 0, 0, cols, rows);
  const data = ctx.getImageData(0, 0, cols, rows).data;

  const cells: StitchCell[] = [];
  const counts = new Map<string, { color: ThreadColor; count: number }>();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      const a = data[i + 3];
      if (a < 30) continue;
      const hex = rgbToHex(data[i], data[i + 1], data[i + 2]);
      const color = nearest(DMC, hex);
      cells.push({ x, y, color });
      const k = color.code;
      const e = counts.get(k);
      if (e) e.count++;
      else counts.set(k, { color, count: 1 });
    }
  }
  const legend = [...counts.values()].sort((a, b) => b.count - a.count);
  return { cells, cols, rows, legend };
}

/** Draw the stitch grid to a canvas with symbols/colors. */
export function drawStitch(result: StitchResult, canvas: HTMLCanvasElement, cellSize = 14) {
  const { cells, cols, rows } = result;
  canvas.width = cols * cellSize + 1;
  canvas.height = rows * cellSize + 1;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const cell of cells) {
    ctx.fillStyle = cell.color.hex;
    ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
  }
  // grid
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= cols; x++) {
    ctx.beginPath(); ctx.moveTo(x * cellSize + 0.5, 0); ctx.lineTo(x * cellSize + 0.5, rows * cellSize); ctx.stroke();
  }
  for (let y = 0; y <= rows; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * cellSize + 0.5); ctx.lineTo(cols * cellSize, y * cellSize + 0.5); ctx.stroke();
  }
  // bold every 10
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 1.5;
  for (let x = 0; x <= cols; x += 10) {
    ctx.beginPath(); ctx.moveTo(x * cellSize + 0.5, 0); ctx.lineTo(x * cellSize + 0.5, rows * cellSize); ctx.stroke();
  }
  for (let y = 0; y <= rows; y += 10) {
    ctx.beginPath(); ctx.moveTo(0, y * cellSize + 0.5); ctx.lineTo(cols * cellSize, y * cellSize + 0.5); ctx.stroke();
  }
}
