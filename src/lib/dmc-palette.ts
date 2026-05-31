// Color palettes for embroidery threads (DMC) and Brazilian fabric paints
// (Acrilex, Corfix, Gato Preto, True Colors). Used for cross-stitch, color
// mapping and brand-equivalence ("mapa de cores").
export type ThreadColor = { code: string; name: string; hex: string };
export type PaintBrand = {
  id: string;
  label: string;
  line: string; // product line (e.g. "Acrilex Tecido", "Corfix Tecido")
  colors: ThreadColor[];
};

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

// Acrilex — linha Tinta para Tecido (37 ml). Códigos e nomes oficiais.
export const ACRILEX: ThreadColor[] = [
  { code: "513", name: "Branco", hex: "#FFFFFF" },
  { code: "520", name: "Preto", hex: "#0A0A0A" },
  { code: "530", name: "Cinza", hex: "#8C8C8C" },
  { code: "504", name: "Amarelo Cádmio", hex: "#F5C518" },
  { code: "505", name: "Amarelo Ouro", hex: "#E8A92E" },
  { code: "551", name: "Amarelo Pele", hex: "#F7D8A8" },
  { code: "507", name: "Laranja", hex: "#F26A21" },
  { code: "508", name: "Vermelho Escarlate", hex: "#E32227" },
  { code: "509", name: "Vermelho Fogo", hex: "#D32028" },
  { code: "511", name: "Carmim", hex: "#A41C2E" },
  { code: "549", name: "Rosa Chá", hex: "#F2B6BC" },
  { code: "550", name: "Rosa Bebê", hex: "#F8CBD3" },
  { code: "503", name: "Magenta", hex: "#C42A6E" },
  { code: "552", name: "Pink", hex: "#E63B86" },
  { code: "516", name: "Violeta", hex: "#6E3C8C" },
  { code: "560", name: "Lilás", hex: "#B591C4" },
  { code: "501", name: "Azul Cobalto", hex: "#1E3F8C" },
  { code: "502", name: "Azul Turquesa", hex: "#1FA8C9" },
  { code: "517", name: "Azul Marinho", hex: "#1A2C52" },
  { code: "561", name: "Azul Celeste", hex: "#9CC7E4" },
  { code: "510", name: "Verde Folha", hex: "#2F7A3E" },
  { code: "519", name: "Verde Bandeira", hex: "#0E6B2A" },
  { code: "812", name: "Verde Pistache", hex: "#9CC04E" },
  { code: "562", name: "Verde Água", hex: "#7FC9B6" },
  { code: "535", name: "Marrom Van Dyck", hex: "#4A2A18" },
  { code: "514", name: "Marrom", hex: "#6E3B1F" },
  { code: "806", name: "Pele", hex: "#E8C2A8" },
  { code: "817", name: "Areia", hex: "#D9B98A" },
  { code: "536", name: "Sépia", hex: "#8C5A3C" },
  { code: "807", name: "Ocre", hex: "#C58B3B" },
];

// Corfix — Tinta para Tecido (60 ml). Linha popular no mercado nacional.
export const CORFIX: ThreadColor[] = [
  { code: "C001", name: "Branco", hex: "#FFFFFF" },
  { code: "C002", name: "Preto", hex: "#0A0A0A" },
  { code: "C010", name: "Amarelo Ouro", hex: "#F2B500" },
  { code: "C011", name: "Amarelo Limão", hex: "#F4E04D" },
  { code: "C020", name: "Laranja", hex: "#EF6A1C" },
  { code: "C030", name: "Vermelho", hex: "#D81E22" },
  { code: "C031", name: "Vermelho Escuro", hex: "#9A1A24" },
  { code: "C040", name: "Rosa", hex: "#EC5A8B" },
  { code: "C041", name: "Rosa Bebê", hex: "#F8C8D2" },
  { code: "C050", name: "Pink", hex: "#E0337C" },
  { code: "C060", name: "Violeta", hex: "#6C3A8E" },
  { code: "C061", name: "Lilás", hex: "#B894CB" },
  { code: "C070", name: "Azul Royal", hex: "#1E3E8C" },
  { code: "C071", name: "Azul Celeste", hex: "#9DC9E6" },
  { code: "C072", name: "Azul Turquesa", hex: "#1FA8C9" },
  { code: "C080", name: "Verde Bandeira", hex: "#127A3A" },
  { code: "C081", name: "Verde Folha", hex: "#2F8A45" },
  { code: "C082", name: "Verde Pistache", hex: "#A0C457" },
  { code: "C090", name: "Marrom", hex: "#6E3B1F" },
  { code: "C091", name: "Bege", hex: "#D9B98A" },
  { code: "C092", name: "Pele", hex: "#E8C2A8" },
  { code: "C100", name: "Cinza", hex: "#8C8C8C" },
  { code: "C110", name: "Ocre", hex: "#C58B3B" },
];

// Gato Preto — Tinta para Tecido. Linha tradicional brasileira.
export const GATO_PRETO: ThreadColor[] = [
  { code: "GP01", name: "Branco", hex: "#FFFFFF" },
  { code: "GP02", name: "Preto", hex: "#0A0A0A" },
  { code: "GP10", name: "Amarelo Cádmio", hex: "#F5C21A" },
  { code: "GP11", name: "Amarelo Ouro", hex: "#E5A82E" },
  { code: "GP20", name: "Laranja Vivo", hex: "#F26A21" },
  { code: "GP30", name: "Vermelho Fogo", hex: "#D32028" },
  { code: "GP31", name: "Carmim", hex: "#A41C2E" },
  { code: "GP40", name: "Rosa Chá", hex: "#F2B6BC" },
  { code: "GP41", name: "Pink", hex: "#E63B86" },
  { code: "GP50", name: "Violeta", hex: "#6E3C8C" },
  { code: "GP60", name: "Azul Marinho", hex: "#1A2C52" },
  { code: "GP61", name: "Azul Turquesa", hex: "#1FA8C9" },
  { code: "GP62", name: "Azul Celeste", hex: "#9CC7E4" },
  { code: "GP70", name: "Verde Folha", hex: "#2F7A3E" },
  { code: "GP71", name: "Verde Bandeira", hex: "#0E6B2A" },
  { code: "GP72", name: "Verde Pistache", hex: "#9CC04E" },
  { code: "GP80", name: "Marrom Van Dyck", hex: "#4A2A18" },
  { code: "GP81", name: "Bege", hex: "#D9B98A" },
  { code: "GP82", name: "Pele", hex: "#E8C2A8" },
  { code: "GP90", name: "Cinza", hex: "#8C8C8C" },
];

// True Colors — Tinta para Tecido (artesanato premium).
export const TRUE_COLORS: ThreadColor[] = [
  { code: "TC01", name: "Branco Neve", hex: "#FFFFFF" },
  { code: "TC02", name: "Preto Total", hex: "#0A0A0A" },
  { code: "TC10", name: "Amarelo Sol", hex: "#F4C81C" },
  { code: "TC11", name: "Amarelo Mostarda", hex: "#D9A22B" },
  { code: "TC20", name: "Laranja Abóbora", hex: "#EE6B26" },
  { code: "TC30", name: "Vermelho Cereja", hex: "#C8232C" },
  { code: "TC31", name: "Vermelho Vinho", hex: "#7A1B2A" },
  { code: "TC40", name: "Rosa Quartzo", hex: "#F2B6BC" },
  { code: "TC41", name: "Rosa Pink", hex: "#E63B86" },
  { code: "TC50", name: "Roxo Uva", hex: "#5B2A6B" },
  { code: "TC51", name: "Lilás Pastel", hex: "#C9A0D1" },
  { code: "TC60", name: "Azul Oceano", hex: "#1F3F8C" },
  { code: "TC61", name: "Azul Bebê", hex: "#A9C7E8" },
  { code: "TC62", name: "Turquesa", hex: "#1FA8C9" },
  { code: "TC70", name: "Verde Esmeralda", hex: "#1F6B2E" },
  { code: "TC71", name: "Verde Menta", hex: "#A8DCD0" },
  { code: "TC72", name: "Verde Lima", hex: "#B5D24A" },
  { code: "TC80", name: "Marrom Chocolate", hex: "#4A2A18" },
  { code: "TC81", name: "Caramelo", hex: "#B07A45" },
  { code: "TC82", name: "Bege Areia", hex: "#D9B98A" },
  { code: "TC83", name: "Pele", hex: "#E8C2A8" },
  { code: "TC90", name: "Cinza Chumbo", hex: "#6E6E6E" },
];

export const PAINT_BRANDS: PaintBrand[] = [
  { id: "acrilex", label: "Acrilex", line: "Tinta para Tecido 37 ml", colors: ACRILEX },
  { id: "corfix", label: "Corfix", line: "Tinta para Tecido 60 ml", colors: CORFIX },
  { id: "gato-preto", label: "Gato Preto", line: "Tinta para Tecido", colors: GATO_PRETO },
  { id: "true-colors", label: "True Colors", line: "Tinta para Tecido Premium", colors: TRUE_COLORS },
];

export function getBrand(id: string): PaintBrand | undefined {
  return PAINT_BRANDS.find((b) => b.id === id);
}

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

/** Distância perceptual aproximada (0–100, menor = mais próximo). */
export function colorDistance(hexA: string, hexB: string): number {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const d = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  return Math.round((d / 441.67) * 100);
}

/** Para uma cor de referência (DMC), retorna o equivalente em cada marca. */
export function paintEquivalents(hex: string) {
  return PAINT_BRANDS.map((brand) => {
    const match = nearest(brand.colors, hex);
    return { brand, match, delta: colorDistance(hex, match.hex) };
  });
}
