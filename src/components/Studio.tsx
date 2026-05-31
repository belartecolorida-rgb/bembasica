import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Brush, Image as ImageIcon, Palette, Grid3x3, Sparkles, Download,
  Upload, Layers, Sun, Moon, Wand2, Loader2, Pencil, Shirt,
  Boxes, Cpu, FileImage, ChevronRight, CheckCircle2,
  History, Trash2, RotateCw, FolderOpen, AlertCircle,
} from "lucide-react";
import { transformImage } from "@/lib/transform.functions";
import { DMC, PAINT_BRANDS, getBrand, nearest, paintEquivalents, colorDistance, rgbToHex } from "@/lib/dmc-palette";
import { imageToStitch, drawStitch, type StitchResult } from "@/lib/cross-stitch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  getProject, saveProject, listProjects, getCurrentProject, setCurrentProject,
  normHex, type ColorOverride, type ProjectPrefs,
} from "@/lib/projects";

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
  const [paintPalette, setPaintPalette] = useState<string>("acrilex");
  const [extractedColors, setExtractedColors] = useState<{ hex: string; pct: number }[]>([]);
  const [mockupSurface, setMockupSurface] = useState<"camiseta" | "caneca" | "bastidor" | "tecido">("camiseta");
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());
  const [historyOpen, setHistoryOpen] = useState(false);

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
    const pendingId = pushHistory(setHistory, {
      module: active, variant: currentMode, status: "pending",
      thumb: await makeThumb(imageData), originalRef: imageData,
    });
    try {
      const { imageUrl } = await transform({ data: { imageBase64: imageData, mode: currentMode } });
      setResultUrl(imageUrl);
      updateHistory(setHistory, pendingId, {
        status: "ok", resultRef: imageUrl, resultThumb: await makeThumb(imageUrl),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setError(msg);
      updateHistory(setHistory, pendingId, { status: "error", errorMsg: msg });
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
      const thumb = await makeThumb(imageData);
      pushHistory(setHistory, {
        module: active, variant: `ponto-cruz-${count}ct`, status: "ok",
        thumb, originalRef: imageData,
        meta: `${result.cols}×${result.rows} · ${result.legend.length} cores`,
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
            <button
              onClick={() => setHistoryOpen(true)}
              className="relative inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-secondary transition-colors"
            >
              <History className="size-3.5" /> Histórico
              {history.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                  {history.length}
                </span>
              )}
            </button>
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

                {active === "cores-linha" && extractedColors.length > 0 && (
                  <Panel title="Mapa de Linhas (DMC)">
                    <div className="grid sm:grid-cols-2 gap-2">
                      {extractedColors.map((c, i) => {
                        const match = nearest(DMC, c.hex);
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

                {active === "cores-tinta" && extractedColors.length > 0 && (
                  <Panel title={`Mapa de Tintas · Equivalência entre marcas nacionais`}>
                    <p className="text-xs text-muted-foreground mb-3">
                      Marca principal destacada: <b>{getBrand(paintPalette)?.label ?? paintPalette}</b>. As demais aparecem como equivalência aproximada (ΔE perceptual).
                    </p>
                    <div className="space-y-2">
                      {extractedColors.map((c, i) => {
                        const equivalents = paintEquivalents(c.hex);
                        const primary = equivalents.find((e) => e.brand.id === paintPalette) ?? equivalents[0];
                        const others = equivalents.filter((e) => e.brand.id !== primary.brand.id);
                        return (
                          <div key={i} className="rounded-md border border-border bg-card p-3">
                            <div className="flex items-center gap-3">
                              <div className="size-12 rounded-md border border-border shrink-0" style={{ background: c.hex }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">{c.hex} · {c.pct.toFixed(1)}% da imagem</p>
                                <p className="text-sm font-semibold truncate">
                                  {primary.brand.label} · {primary.match.code} — {primary.match.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground">{primary.brand.line} · proximidade {100 - primary.delta}%</p>
                              </div>
                              <div className="size-8 rounded border border-border" style={{ background: primary.match.hex }} />
                            </div>
                            <div className="mt-2.5 pt-2.5 border-t border-border grid sm:grid-cols-3 gap-1.5">
                              {others.map((e) => (
                                <div key={e.brand.id} className="flex items-center gap-2 text-xs">
                                  <div className="size-5 rounded border border-border shrink-0" style={{ background: e.match.hex }} />
                                  <div className="min-w-0">
                                    <p className="font-medium truncate">{e.brand.label} · {e.match.code}</p>
                                    <p className="text-muted-foreground truncate">{e.match.name} · ~{100 - e.delta}%</p>
                                  </div>
                                </div>
                              ))}
                            </div>
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

      <HistoryPanel
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        items={history}
        onClear={() => { setHistory([]); saveHistory([]); }}
        onRemove={(id) => setHistory((h) => { const n = h.filter((i) => i.id !== id); saveHistory(n); return n; })}
        onReopen={(item) => {
          if (!item.originalRef) return;
          setImageData(item.originalRef);
          setResultUrl(item.resultRef ?? null);
          setActive(item.module as ModuleId);
          setStitch(null);
          setHistoryOpen(false);
        }}
        onDownload={(item) => {
          if (item.resultRef) downloadResult(item.resultRef, `${item.module}-${item.id}.png`);
        }}
        onReexport={async (item) => {
          if (!item.originalRef) return;
          setActive(item.module as ModuleId);
          setImageData(item.originalRef);
          setResultUrl(null);
          setHistoryOpen(false);
          // wait a tick so state settles, then run AI with stored variant
          setTimeout(() => {
            if (item.module === "ponto-cruz") runStitch();
            else { if (item.variant) setVariant(item.variant); runAI(); }
          }, 50);
        }}
      />
    </div>
  );
}

function ControlsForModule(props: {
  active: ModuleId;
  variant: string; setVariant: (v: string) => void;
  count: number; setCount: (n: number) => void;
  paintPalette: string; setPaintPalette: (p: string) => void;
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
      <Section title="Marca principal de Tinta">
        {PAINT_BRANDS.map((b) => (
          <OptionRow
            key={b.id}
            active={paintPalette === b.id}
            onClick={() => setPaintPalette(b.id)}
            label={b.label}
            desc={`${b.line} · ${b.colors.length} cores`}
          />
        ))}
        <p className="text-[11px] text-muted-foreground mt-2 px-1">
          O resultado mostra a marca escolhida em destaque + equivalência automática nas demais marcas nacionais.
        </p>
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

// ============================================================
// History: types, persistence, helpers, and panel UI
// ============================================================

type HistoryStatus = "pending" | "ok" | "error";
type HistoryItem = {
  id: string;
  ts: number;
  module: string;
  variant?: string;
  status: HistoryStatus;
  thumb: string;          // small data URL of original
  resultThumb?: string;   // small data URL of result
  originalRef?: string;   // full original data URL (may be dropped to save space)
  resultRef?: string;     // full result data URL (may be dropped)
  meta?: string;
  errorMsg?: string;
};

const HISTORY_KEY = "atelier:history:v1";
const MAX_ITEMS = 30;

function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch { return []; }
}

function saveHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") return;
  // Persist only thumbnails + metadata to stay within quota
  const slim = items.slice(0, MAX_ITEMS).map((i) => ({
    ...i,
    originalRef: undefined,
    resultRef: undefined,
  }));
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(slim));
  } catch {
    // quota exceeded — trim further
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(slim.slice(0, 10))); } catch { /* ignore */ }
  }
}

function pushHistory(
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>,
  partial: Omit<HistoryItem, "id" | "ts">,
): string {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const item: HistoryItem = { id, ts: Date.now(), ...partial };
  setHistory((prev) => {
    const next = [item, ...prev].slice(0, MAX_ITEMS);
    saveHistory(next);
    return next;
  });
  return id;
}

function updateHistory(
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>,
  id: string,
  patch: Partial<HistoryItem>,
) {
  setHistory((prev) => {
    const next = prev.map((i) => (i.id === id ? { ...i, ...patch } : i));
    saveHistory(next);
    return next;
  });
}

async function makeThumb(src: string, max = 160): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return resolve(src);
      ctx.drawImage(img, 0, 0, w, h);
      try { resolve(c.toDataURL("image/jpeg", 0.7)); } catch { resolve(src); }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function HistoryPanel(props: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: HistoryItem[];
  onClear: () => void;
  onRemove: (id: string) => void;
  onReopen: (item: HistoryItem) => void;
  onDownload: (item: HistoryItem) => void;
  onReexport: (item: HistoryItem) => void;
}) {
  const { open, onOpenChange, items, onClear, onRemove, onReopen, onDownload, onReexport } = props;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="size-4 text-primary" /> Histórico
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Seus últimos uploads e resultados ({items.length})
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground">
              <History className="size-8 mx-auto mb-3 opacity-40" />
              Nenhum item ainda. Gere um resultado para começar.
            </div>
          ) : (
            items.map((item) => (
              <HistoryRow
                key={item.id}
                item={item}
                onRemove={() => onRemove(item.id)}
                onReopen={() => onReopen(item)}
                onDownload={() => onDownload(item)}
                onReexport={() => onReexport(item)}
              />
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border p-3">
            <button
              onClick={onClear}
              className="w-full text-xs text-muted-foreground hover:text-destructive py-2 flex items-center justify-center gap-1.5"
            >
              <Trash2 className="size-3.5" /> Limpar histórico
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function HistoryRow({ item, onRemove, onReopen, onDownload, onReexport }: {
  item: HistoryItem;
  onRemove: () => void;
  onReopen: () => void;
  onDownload: () => void;
  onReexport: () => void;
}) {
  const expired = !item.originalRef && !item.resultRef;
  return (
    <div className="rounded-lg border border-border bg-card p-3 flex gap-3">
      <div className="relative shrink-0">
        <img
          src={item.resultThumb ?? item.thumb}
          alt=""
          className="size-16 rounded-md object-cover border border-border bg-muted"
        />
        <StatusBadge status={item.status} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{moduleLabel(item.module)}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {item.variant ?? "—"} · {formatTime(item.ts)}
            </p>
            {item.meta && <p className="text-[11px] text-muted-foreground truncate">{item.meta}</p>}
            {item.status === "error" && item.errorMsg && (
              <p className="text-[11px] text-destructive flex items-center gap-1 mt-0.5">
                <AlertCircle className="size-3" /> {item.errorMsg}
              </p>
            )}
            {expired && item.status === "ok" && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Arquivos não disponíveis (sessão anterior). Reenvie a imagem.
              </p>
            )}
          </div>
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive p-1 -m-1"
            title="Remover"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <MiniBtn onClick={onReopen} disabled={!item.originalRef}>
            <FolderOpen className="size-3" /> Reabrir
          </MiniBtn>
          <MiniBtn onClick={onDownload} disabled={!item.resultRef}>
            <Download className="size-3" /> PNG
          </MiniBtn>
          <MiniBtn onClick={onReexport} disabled={!item.originalRef}>
            <RotateCw className="size-3" /> Reexportar
          </MiniBtn>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: HistoryStatus }) {
  const map: Record<HistoryStatus, { bg: string; label: string }> = {
    pending: { bg: "bg-amber-500", label: "…" },
    ok: { bg: "bg-emerald-500", label: "✓" },
    error: { bg: "bg-destructive", label: "!" },
  };
  const s = map[status];
  return (
    <span className={`absolute -top-1 -right-1 size-4 rounded-full ${s.bg} text-white text-[9px] font-bold flex items-center justify-center border-2 border-card`}>
      {s.label}
    </span>
  );
}

function MiniBtn({ onClick, children, disabled }: {
  onClick: () => void; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border border-border bg-background hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

function moduleLabel(id: string): string {
  const found = MODULES.find((m) => m.id === id);
  return found ? found.label : id;
}
