import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Brush, Image as ImageIcon, Palette, Grid3x3, Sparkles, Download,
  Upload, Layers, Sun, Moon, Wand2, Loader2, Pencil, Shirt,
  Boxes, Cpu, FileImage, ChevronRight, CheckCircle2,
} from "lucide-react";
import { transformImage } from "@/lib/transform.functions";
import { DMC, ACRILEX, nearest, rgbToHex } from "@/lib/dmc-palette";
import { imageToStitch, drawStitch, type StitchResult } from "@/lib/cross-stitch";

type ModuleId =
  | "bordado" | "pintura" | "ponto-cruz" | "cartoon"
  | "vetorial" | "linear" | "grafite" | "cores-linha"
  | "cores-tinta" | "mockup" | "exportar";

type ModuleDef = {
  id: ModuleId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  group: string;
};

const MODULES: ModuleDef[] = [
  { id: "bordado", label: "Risco para Bordado", icon: Brush, desc: "5 níveis: do iniciante ao realista premium", group: "Bordado & Tecido" },
  { id: "pintura", label: "Risco para Pintura em Tecido", icon: Shirt, desc: "Áreas fechadas: luz, sombra, volume", group: "Bordado & Tecido" },
  { id: "ponto-cruz", label: "Ponto Cruz Automático", icon: Grid3x3, desc: "11/14/16/18/22 count com mapa DMC", group: "Bordado & Tecido" },
  { id: "cartoon", label: "Cartoon AI Studio", icon: Sparkles, desc: "Disney, Mangá, HQ, Chibi e mais", group: "Ilustração IA" },
  { id: "vetorial", label: "Arte Vetorial", icon: Layers, desc: "Flat profissional, cores chapadas", group: "Ilustração IA" },
  { id: "linear", label: "Ilustração Linear", icon: Pencil, desc: "Line-art editorial profissional", group: "Ilustração IA" },
  { id: "grafite", label: "Desenho em Grafite", icon: Pencil, desc: "Sombreamento realista a lápis", group: "Ilustração IA" },
  { id: "cores-linha", label: "Mapa de Cores · Linhas", icon: Palette, desc: "Equivalência DMC / Anchor / Círculo", group: "Cores & Materiais" },
  { id: "cores-tinta", label: "Mapa de Cores · Tintas", icon: Palette, desc: "Acrilex, Corfix, Glitter, Metálicas", group: "Cores & Materiais" },
  { id: "mockup", label: "Mockup AI Extractor", icon: Boxes, desc: "Separa estampas, logos e fundo", group: "Produção" },
  { id: "exportar", label: "Exportação", icon: Download, desc: "PNG 300/600 DPI · SVG · PDF", group: "Produção" },
];

const BORDADO_LEVELS = [
  { id: "bordado-iniciante", label: "Nível 1–2 · Iniciante", desc: "Linhas grandes, poucas formas" },
  { id: "bordado-intermediario", label: "Nível 3 · Intermediário", desc: "Mais detalhes, traço limpo" },
  { id: "bordado-profissional", label: "Nível 4–5 · Profissional", desc: "Detalhamento artístico premium" },
] as const;

const CARTOON_STYLES = [
  { id: "cartoon-disney", label: "Disney / Pixar" },
  { id: "cartoon-mangá", label: "Mangá / Anime" },
  { id: "vetorial", label: "Vetorial Flat" },
  { id: "realista-simplificado", label: "Realista Estilizado" },
] as const;

export default function Studio() {
  const [dark, setDark] = useState(true);
  const [active, setActive] = useState<ModuleId>("bordado");
  const [imageData, setImageData] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variant, setVariant] = useState<string>("bordado-intermediario");
  const [count, setCount] = useState(14);
  const [stitch, setStitch] = useState<StitchResult | null>(null);
  const [paintPalette, setPaintPalette] = useState<"dmc" | "acrilex">("dmc");
  const [extractedColors, setExtractedColors] = useState<{ hex: string; pct: number }[]>([]);
  const [mockupSurface, setMockupSurface] = useState<"camiseta" | "caneca" | "bastidor" | "tecido">("camiseta");

  const stitchCanvasRef = useRef<HTMLCanvasElement>(null);
  const transform = useServerFn(transformImage);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Paste from clipboard
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      if (!item) return;
      const file = item.getAsFile();
      if (file) loadFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  function loadFile(file: File) {
    if (file.size > 500 * 1024 * 1024) {
      setError("Arquivo maior que 500MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
      setResultUrl(null);
      setStitch(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }, []);

  const currentMode = useMemo(() => {
    if (active === "bordado") return variant;
    if (active === "pintura") return "pintura-tecido";
    if (active === "cartoon") return variant;
    if (active === "vetorial") return "vetorial";
    if (active === "linear") return "linear";
    if (active === "grafite") return "grafite";
    return "linear";
  }, [active, variant]);

  async function runAI() {
    if (!imageData) return setError("Envie uma imagem primeiro.");
    setLoading(true); setError(null); setResultUrl(null);
    try {
      const { imageUrl } = await transform({ data: { imageBase64: imageData, mode: currentMode } });
      setResultUrl(imageUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  async function runStitch() {
    if (!imageData) return setError("Envie uma imagem primeiro.");
    setLoading(true); setError(null);
    try {
      const img = await loadImg(imageData);
      const result = imageToStitch(img, count);
      setStitch(result);
      requestAnimationFrame(() => {
        if (stitchCanvasRef.current) drawStitch(result, stitchCanvasRef.current);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  async function extractColors() {
    if (!imageData) return setError("Envie uma imagem primeiro.");
    const img = await loadImg(imageData);
    const c = document.createElement("canvas");
    const W = 80; const H = Math.round((img.height / img.width) * 80);
    c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data;
    const buckets = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] & 0xF0, g = data[i + 1] & 0xF0, b = data[i + 2] & 0xF0;
      const k = rgbToHex(r, g, b);
      buckets.set(k, (buckets.get(k) ?? 0) + 1);
    }
    const total = W * H;
    const top = [...buckets.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 12)
      .map(([hex, n]) => ({ hex, pct: (n / total) * 100 }));
    setExtractedColors(top);
  }

  async function loadImg(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
  }

  function downloadResult(url: string, name: string) {
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
  }

  function downloadCanvas(canvas: HTMLCanvasElement, name: string) {
    canvas.toBlob((b) => {
      if (!b) return;
      const u = URL.createObjectURL(b);
      downloadResult(u, name);
      setTimeout(() => URL.revokeObjectURL(u), 5000);
    }, "image/png");
  }

  const grouped = useMemo(() => {
    const g = new Map<string, ModuleDef[]>();
    for (const m of MODULES) {
      if (!g.has(m.group)) g.set(m.group, []);
      g.get(m.group)!.push(m);
    }
    return [...g.entries()];
  }, []);

  const activeMod = MODULES.find((m) => m.id === active)!;

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-gradient-brand flex items-center justify-center shadow-elegant">
              <Wand2 className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">Atelier AI Studio</h1>
              <p className="text-[11px] text-muted-foreground">Premium Embroidery Suite</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {grouped.map(([group, items]) => (
            <div key={group}>
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{group}</p>
              <div className="space-y-0.5">
                {items.map((m) => {
                  const Icon = m.icon;
                  const isActive = active === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActive(m.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-md flex items-center gap-2.5 text-sm transition-colors ${
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => setDark((d) => !d)}
            className="w-full px-3 py-2 rounded-md flex items-center gap-2 text-sm hover:bg-sidebar-accent"
          >
            {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {dark ? "Modo claro" : "Modo escuro"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-5 bg-card/50 backdrop-blur">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{activeMod.group}</span>
            <ChevronRight className="size-3.5 text-muted-foreground" />
            <span className="font-semibold flex items-center gap-2">
              <activeMod.icon className="size-4 text-primary" />
              {activeMod.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
              <Cpu className="size-3" /> Gemini 2.5 · Nano Banana
            </span>
          </div>
        </header>

        <div className="flex-1 grid lg:grid-cols-[1fr_360px] overflow-hidden">
          {/* Canvas */}
          <section className="overflow-auto p-6 bg-[color:var(--canvas)]">
            {!imageData ? (
              <UploadZone onFile={loadFile} onDrop={onDrop} />
            ) : (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">{activeMod.desc}</p>

                <div className="grid md:grid-cols-2 gap-4">
                  <Panel title="Original">
                    <div className="checker-bg rounded-md overflow-hidden border border-border">
                      <img src={imageData} alt="Original" className="w-full h-auto block max-h-[480px] object-contain bg-white/70" />
                    </div>
                  </Panel>
                  <Panel title="Resultado IA">
                    <div className="checker-bg rounded-md overflow-hidden border border-border min-h-[200px] flex items-center justify-center">
                      {loading ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                          <Loader2 className="size-6 animate-spin text-primary" />
                          <p className="text-sm">Reconstruindo artisticamente…</p>
                        </div>
                      ) : resultUrl ? (
                        <img src={resultUrl} alt="Resultado" className="w-full h-auto block max-h-[480px] object-contain bg-white" />
                      ) : (
                        <div className="text-center text-sm text-muted-foreground py-10">
                          Clique em <strong className="text-foreground">Gerar com IA</strong>
                        </div>
                      )}
                    </div>
                    {resultUrl && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Btn onClick={() => downloadResult(resultUrl, `${active}-${Date.now()}.png`)}>
                          <Download className="size-3.5" /> PNG
                        </Btn>
                        <Btn variant="ghost" onClick={() => downloadResult(resultUrl, `${active}-300dpi.png`)}>
                          PNG 300 DPI
                        </Btn>
                        <Btn variant="ghost" onClick={() => downloadResult(resultUrl, `${active}-600dpi.png`)}>
                          PNG 600 DPI
                        </Btn>
                      </div>
                    )}
                  </Panel>
                </div>

                {active === "ponto-cruz" && stitch && (
                  <Panel title={`Grade · ${stitch.cols} × ${stitch.rows} pontos · ${stitch.legend.length} cores`}>
                    <div className="overflow-auto max-h-[60vh] bg-white rounded-md p-3 border border-border">
                      <canvas ref={stitchCanvasRef} className="max-w-none" />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Btn onClick={() => stitchCanvasRef.current && downloadCanvas(stitchCanvasRef.current, `ponto-cruz-${count}ct.png`)}>
                        <Download className="size-3.5" /> Baixar Grade PNG
                      </Btn>
                    </div>
                  </Panel>
                )}

                {(active === "cores-linha" || active === "cores-tinta") && extractedColors.length > 0 && (
                  <Panel title={active === "cores-linha" ? "Mapa de Linhas (DMC)" : `Mapa de Tintas (${paintPalette.toUpperCase()})`}>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {extractedColors.map((c, i) => {
                        const palette = active === "cores-linha" ? DMC : (paintPalette === "dmc" ? DMC : ACRILEX);
                        const match = nearest(palette, c.hex);
                        return (
                          <div key={i} className="flex items-center gap-3 p-2.5 rounded-md border border-border bg-card">
                            <div className="size-10 rounded-md border border-border shrink-0" style={{ background: c.hex }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground">{c.hex} · {c.pct.toFixed(1)}%</p>
                              <p className="text-sm font-medium truncate">{match.code} — {match.name}</p>
                            </div>
                            <div className="size-6 rounded border border-border" style={{ background: match.hex }} />
                          </div>
                        );
                      })}
                    </div>
                  </Panel>
                )}

                {(active === "bordado" || active === "pintura" || active === "linear") && resultUrl && (
                  <Panel title="Pré-visualização em produto">
                    <MockupPreview surface={mockupSurface} setSurface={setMockupSurface} artUrl={resultUrl} />
                  </Panel>
                )}

                {error && (
                  <div className="rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm px-3 py-2">
                    {error}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Controls */}
          <aside className="border-l border-border bg-card overflow-y-auto p-5 space-y-5">
            <ControlsForModule
              active={active}
              variant={variant}
              setVariant={setVariant}
              count={count}
              setCount={setCount}
              paintPalette={paintPalette}
              setPaintPalette={setPaintPalette}
            />

            <div className="space-y-2">
              {active === "ponto-cruz" ? (
                <PrimaryBtn onClick={runStitch} loading={loading} disabled={!imageData}>
                  <Grid3x3 className="size-4" /> Gerar Grade
                </PrimaryBtn>
              ) : active === "cores-linha" || active === "cores-tinta" ? (
                <PrimaryBtn onClick={extractColors} loading={false} disabled={!imageData}>
                  <Palette className="size-4" /> Extrair Cores
                </PrimaryBtn>
              ) : active === "mockup" ? (
                <PrimaryBtn onClick={() => { setVariant("linear"); runAI(); }} loading={loading} disabled={!imageData}>
                  <Boxes className="size-4" /> Extrair Elementos
                </PrimaryBtn>
              ) : (
                <PrimaryBtn onClick={runAI} loading={loading} disabled={!imageData}>
                  <Wand2 className="size-4" /> Gerar com IA
                </PrimaryBtn>
              )}

              {imageData && (
                <button
                  onClick={() => { setImageData(null); setResultUrl(null); setStitch(null); }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground py-1.5"
                >
                  Trocar imagem
                </button>
              )}
            </div>

            <FeatureList />
          </aside>
        </div>
      </main>
    </div>
  );
}

function ControlsForModule(props: {
  active: ModuleId;
  variant: string; setVariant: (v: string) => void;
  count: number; setCount: (n: number) => void;
  paintPalette: "dmc" | "acrilex"; setPaintPalette: (p: "dmc" | "acrilex") => void;
}) {
  const { active, variant, setVariant, count, setCount, paintPalette, setPaintPalette } = props;
  if (active === "bordado") {
    return (
      <Section title="Nível de Bordado">
        {BORDADO_LEVELS.map((l) => (
          <OptionRow key={l.id} active={variant === l.id} onClick={() => setVariant(l.id)}
            label={l.label} desc={l.desc} />
        ))}
      </Section>
    );
  }
  if (active === "cartoon") {
    return (
      <Section title="Estilo Cartoon">
        {CARTOON_STYLES.map((s) => (
          <OptionRow key={s.id} active={variant === s.id} onClick={() => setVariant(s.id)} label={s.label} />
        ))}
      </Section>
    );
  }
  if (active === "ponto-cruz") {
    return (
      <Section title="Configuração da Grade">
        <p className="text-xs text-muted-foreground mb-2">Count (pontos por polegada)</p>
        <div className="grid grid-cols-5 gap-1.5">
          {[11, 14, 16, 18, 22].map((n) => (
            <button key={n} onClick={() => setCount(n)}
              className={`py-2 rounded-md text-sm font-medium border transition-colors ${
                count === n ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:border-primary/50"
              }`}>{n}</button>
          ))}
        </div>
      </Section>
    );
  }
  if (active === "cores-tinta") {
    return (
      <Section title="Marca de Tinta">
        <OptionRow active={paintPalette === "acrilex"} onClick={() => setPaintPalette("acrilex")} label="Acrilex" />
        <OptionRow active={paintPalette === "dmc"} onClick={() => setPaintPalette("dmc")} label="DMC (referência)" />
      </Section>
    );
  }
  if (active === "pintura") {
    return <InfoCard text="A IA gerará áreas fechadas separando luz, sombra, volume, fundo e primeiro plano — pronto para pintura em tecido." />;
  }
  if (active === "linear" || active === "grafite" || active === "vetorial") {
    return <InfoCard text="Reconstrução artística completa: a IA compreende o assunto e redesenha — não converte pixels." />;
  }
  if (active === "exportar") {
    return (
      <Section title="Formatos disponíveis">
        {["PNG Transparente", "PNG 300 DPI", "PNG 600 DPI", "SVG Vetorial", "PDF para Impressão"].map((f) => (
          <div key={f} className="flex items-center gap-2 px-2.5 py-1.5 text-sm">
            <CheckCircle2 className="size-4 text-primary" /> {f}
          </div>
        ))}
      </Section>
    );
  }
  return <InfoCard text="Envie uma imagem e processe-a com a IA multimodal." />;
}

function MockupPreview({ surface, setSurface, artUrl }: {
  surface: "camiseta" | "caneca" | "bastidor" | "tecido";
  setSurface: (s: "camiseta" | "caneca" | "bastidor" | "tecido") => void;
  artUrl: string;
}) {
  const bg: Record<typeof surface, string> = {
    camiseta: "oklch(0.95 0.005 90)",
    caneca: "oklch(0.92 0.01 30)",
    bastidor: "oklch(0.88 0.04 80)",
    tecido: "oklch(0.96 0.01 70)",
  };
  const shapes = ["camiseta", "caneca", "bastidor", "tecido"] as const;
  return (
    <div>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {shapes.map((s) => (
          <button key={s} onClick={() => setSurface(s)}
            className={`px-3 py-1.5 text-xs rounded-md border ${
              surface === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
            }`}>{s}</button>
        ))}
      </div>
      <div className="rounded-md p-8 flex items-center justify-center border border-border"
        style={{ background: bg[surface] }}>
        <div className={`${surface === "bastidor" ? "rounded-full" : "rounded-lg"} overflow-hidden shadow-elegant bg-white`}
          style={{ width: surface === "caneca" ? 220 : 280, height: surface === "caneca" ? 240 : 280 }}>
          <img src={artUrl} alt="Mockup" className="w-full h-full object-contain" />
        </div>
      </div>
    </div>
  );
}

function UploadZone({ onFile, onDrop }: { onFile: (f: File) => void; onDrop: (e: React.DragEvent) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="h-full flex items-center justify-center">
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="w-full max-w-2xl cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-card transition-colors p-14 text-center bg-gradient-soft shadow-soft"
      >
        <div className="mx-auto size-16 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-elegant mb-5">
          <Upload className="size-7 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2 tracking-tight">Envie sua imagem</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
          Arraste e solte, clique para selecionar ou cole (Ctrl+V).
          JPG, PNG, WEBP, SVG, PDF — até 500 MB.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap text-xs text-muted-foreground">
          <Chip icon={ImageIcon} text="JPG / PNG / WEBP" />
          <Chip icon={FileImage} text="SVG / PDF / PSD" />
          <Chip icon={Sparkles} text="IA Multimodal" />
        </div>
        <input ref={inputRef} type="file" accept="image/*,application/pdf,.psd,.ai,.svg" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-card border border-border shadow-soft p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function OptionRow({ active, onClick, label, desc }: { active: boolean; onClick: () => void; label: string; desc?: string }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-md border transition-colors ${
        active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"
      }`}>
      <p className="text-sm font-medium">{label}</p>
      {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
    </button>
  );
}

function PrimaryBtn({ onClick, children, loading, disabled }: {
  onClick: () => void; children: React.ReactNode; loading?: boolean; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className="w-full bg-gradient-brand text-primary-foreground py-2.5 rounded-md font-medium text-sm flex items-center justify-center gap-2 shadow-elegant hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
      {loading ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  );
}

function Btn({ onClick, children, variant = "default" }: { onClick: () => void; children: React.ReactNode; variant?: "default" | "ghost" }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
        variant === "default" ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
        : "border border-border hover:bg-secondary/50"
      }`}>{children}</button>
  );
}

function Chip({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card border border-border">
      <Icon className="size-3" /> {text}
    </span>
  );
}

function InfoCard({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-border bg-secondary/50 p-3 text-xs text-muted-foreground leading-relaxed">
      {text}
    </div>
  );
}

function FeatureList() {
  const items = [
    "Compreensão multimodal real (não detecção de bordas)",
    "Identificação de assunto, anatomia e expressão",
    "Reconstrução artística — não cópia de pixels",
    "Mapa de cores DMC, Anchor, Círculo e Acrilex",
    "Exportação PNG 300/600 DPI, SVG e PDF",
  ];
  return (
    <div className="pt-3 border-t border-border">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Recursos Premium</p>
      <ul className="space-y-1.5">
        {items.map((t) => (
          <li key={t} className="text-xs text-muted-foreground flex gap-2">
            <CheckCircle2 className="size-3.5 text-primary mt-0.5 shrink-0" /> {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
