// Compact DMC thread palette (subset of most common colors) with hex + name.
// Used for cross-stitch and color-mapping modules.
export type ThreadColor = { code: string; name: string; hex: string };

export const DMC: ThreadColor[] = [
  { code: "BLANC", name: "Branco", hex: "#FFFFFF" },
  { code: "310", name: "Preto", hex: "#000000" },
  { code: "318", name: "Cinza Aço Claro", hex: "#B8B8B8" },
  { code: "413", name: "Cinza Pewter Escuro", hex: "#6E6E6E" },
  { code: "415", name: "Cinza Pérola", hex: "#D4D4D4" },
  { code: "743", name: "Amarelo Médio", hex: "#FBD55C" },
  { code: "744", name: "Amarelo Pálido", hex: "#FCE38A" },
  { code: "725", name: "Topázio", hex: "#F1B43A" },
  { code: "3821", name: "Amarelo Ouro", hex: "#E5B73B" },
  { code: "947", name: "Laranja Vivo", hex: "#F26A21" },
  { code: "740", name: "Tangerina", hex: "#F39228" },
  { code: "606", name: "Vermelho Coral", hex: "#E81E25" },
  { code: "666", name: "Vermelho Vivo", hex: "#C8232C" },
  { code: "498", name: "Vermelho Escuro", hex: "#9B1B30" },
  { code: "761", name: "Rosa Claro", hex: "#F4B6B6" },
  { code: "760", name: "Salmão", hex: "#E8908A" },
  { code: "3326", name: "Rosa Bebê", hex: "#F7C6CB" },
  { code: "335", name: "Rosa Forte", hex: "#D44563" },
  { code: "3805", name: "Pink", hex: "#E63E8A" },
  { code: "550", name: "Violeta Escuro", hex: "#5B2A6B" },
  { code: "553", name: "Violeta", hex: "#9466A8" },
  { code: "210", name: "Lavanda", hex: "#C9A0D1" },
  { code: "796", name: "Azul Royal", hex: "#1F3F8C" },
  { code: "798", name: "Azul Delft", hex: "#3F6FB8" },
  { code: "800", name: "Azul Bebê", hex: "#A9C7E8" },
  { code: "824", name: "Azul Marinho", hex: "#1B4A78" },
  { code: "964", name: "Verde Água Claro", hex: "#A8DCD0" },
  { code: "959", name: "Verde Água", hex: "#6FC2B0" },
  { code: "991", name: "Verde Petróleo", hex: "#2E6E63" },
  { code: "228", name: "Verde Folha", hex: "#3B8E4F" },
  { code: "699", name: "Verde Escuro", hex: "#1F6B2E" },
  { code: "703", name: "Verde Limão", hex: "#7DC243" },
  { code: "907", name: "Verde Maçã", hex: "#B5D24A" },
  { code: "433", name: "Marrom Médio", hex: "#7A4A24" },
  { code: "434", name: "Marrom Claro", hex: "#9A6135" },
  { code: "435", name: "Caramelo", hex: "#B07A45" },
  { code: "437", name: "Bege Escuro", hex: "#D4A77A" },
  { code: "738", name: "Bege Claro", hex: "#E8C9A0" },
  { code: "950", name: "Pele Clara", hex: "#E8C2A8" },
  { code: "3864", name: "Mocha", hex: "#B89C82" },
  { code: "3371", name: "Marrom Café", hex: "#3A2418" },
];

export const ACRILEX = [
  { code: "513", name: "Branco", hex: "#FFFFFF" },
  { code: "520", name: "Preto", hex: "#0A0A0A" },
  { code: "504", name: "Amarelo Cádmio", hex: "#F5C518" },
  { code: "507", name: "Laranja", hex: "#F26A21" },
  { code: "509", name: "Vermelho Fogo", hex: "#D32028" },
  { code: "549", name: "Rosa Chá", hex: "#F2B6BC" },
  { code: "503", name: "Magenta", hex: "#C42A6E" },
  { code: "516", name: "Violeta", hex: "#6E3C8C" },
  { code: "501", name: "Azul Cobalto", hex: "#1E3F8C" },
  { code: "502", name: "Azul Turquesa", hex: "#1FA8C9" },
  { code: "510", name: "Verde Folha", hex: "#2F7A3E" },
  { code: "812", name: "Verde Pistache", hex: "#9CC04E" },
  { code: "535", name: "Marrom Van Dyck", hex: "#4A2A18" },
  { code: "806", name: "Pele", hex: "#E8C2A8" },
  { code: "817", name: "Areia", hex: "#D9B98A" },
];

export function nearest<T extends { hex: string }>(palette: T[], hex: string): T {
  const [r1, g1, b1] = hexToRgb(hex);
  let best = palette[0];
  let bestD = Infinity;
  for (const c of palette) {
    const [r2, g2, b2] = hexToRgb(c.hex);
    const d = (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2;
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();
}
