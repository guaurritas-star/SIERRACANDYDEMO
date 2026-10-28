import { authenticatedApiFetch } from '../utils/authenticatedApiFetch';
import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleAlert, Lightbulb, LoaderCircle, Palette, Sparkles } from 'lucide-react';
import type { TenantConfig, BusinessTheme, CatalogLayoutStyle, CatalogFontPairing } from '../types';

interface BrandDiscoveryViewProps {
  tenantConfig: TenantConfig;
  onBack: () => void;
  onSave: (config: TenantConfig, openCatalog: boolean) => Promise<void>;
}

interface AiProfile {
  brandName?: string;
  industry?: string;
  targetAudience?: string;
  productTypes?: string;
  editorialRationale?: string;
  valuePropositions?: string[];
  suggestedCategories?: string[];
}

const DIRECTIONS: {
  id: string;
  label: string;
  line: string;
  description: string;
  accent: string;
  bg: string;
  fg: string;
  tone: string;
  layout: CatalogLayoutStyle;
  font: CatalogFontPairing;
}[] = [
  {
    id: 'editorial', label: '01 · Editorial', line: 'Hecho para destacar.',
    description: 'Tipografía con carácter, fotografía protagonista y composiciones de revista.',
    accent: '#8D5AE5', bg: '#E6D8FF', fg: '#291C3B',
    tone: 'Editorial, expresivo y sofisticado', layout: 'editorial-luxury', font: 'editorial-serif',
  },
  {
    id: 'minimal', label: '02 · Esencial', line: 'Menos, pero mejor.',
    description: 'Jerarquías limpias, espacios amplios y una presencia visual precisa.',
    accent: '#1D3B38', bg: '#DDE6DB', fg: '#1D3B38',
    tone: 'Claro, cálido y confiable', layout: 'minimal-gallery', font: 'modern-sans',
  },
  {
    id: 'bold', label: '03 · Audaz', line: 'Imposible ignorar.',
    description: 'Contraste, titulares potentes y energía visual para una marca atrevida.',
    accent: '#D94B30', bg: '#FFCCAA', fg: '#3B201A',
    tone: 'Audaz, directo y contemporáneo', layout: 'technical-spec', font: 'modern-sans',
  },
];

function cleanText(text: string | undefined, max: number): string {
  return (text || '').trim().slice(0, max);
}

export function BrandDiscoveryView({ tenantConfig, onBack, onSave }: BrandDiscoveryViewProps) {
  const existing = tenantConfig.theme;
  const isDemo = !existing?.brandName || /^sierra( footwear)?$/i.test(existing.brandName.trim());
  const [name, setName] = useState(isDemo ? '' : existing?.brandName || '');
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState(isDemo ? '' : existing?.targetAudience || '');
  const [industry, setIndustry] = useState(isDemo ? '' : existing?.industry || '');
  const [tagline, setTagline] = useState(isDemo ? '' : existing?.tagline || '');
  const [summary, setSummary] = useState('');
  const [aiProfile, setAiProfile] = useState<AiProfile | null>(null);
  const [selection, setSelection] = useState('editorial');
  const [step, setStep] = useState<'brief' | 'direction'>('brief');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const direction = DIRECTIONS.find(x => x.id === selection) || DIRECTIONS[0];

  const analyzeBrand = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || name.trim().length < 2 || description.trim().length < 12) return;
    setError('');
    setBusy(true);
    try {
      const response = await authenticatedApiFetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'onboarding_interview',
          prompt: [
            'Estoy comenzando el proceso de diseño de identidad visual de mi marca.',
            'Nombre:', cleanText(name, 120),
            'Descripción del negocio:', cleanText(description, 1200),
            'Público objetivo:', cleanText(audience, 350) || 'Por definir',
            'No inventes hechos. Sugiere una dirección de marca coherente.',
          ].join('\n'),
          currentProfile: {
            brandName: cleanText(name, 120),
            productTypes: cleanText(description, 1200),
            targetAudience: cleanText(audience, 350),
          },
          conversationHistory: [],
        }),
      });
      if (!response.ok) throw new Error('No se pudo conectar con la IA. Revisa que el servidor de Candy Studio esté activo.');
      const data = await response.json();
      if (!data || typeof data.reply !== 'string' || !data.extractedProfile) {
        throw new Error('La respuesta de la IA no tiene el formato esperado.');
      }
      const next: AiProfile = data.extractedProfile;
      setAiProfile(next);
      setIndustry(cleanText(next.industry, 120) || industry);
      setAudience(prev => prev.trim() || cleanText(next.targetAudience, 200));
      setTagline(cleanText(next.editorialRationale, 240));
      setSummary(cleanText(data.reply, 1000));
      setStep('direction');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al analizar tu marca.');
    } finally {
      setBusy(false);
    }
  };

  const saveBrand = async (openCatalog: boolean) => {
    if (saving) return;
    const finalName = cleanText(name, 120);
    const finalIndustry = cleanText(industry, 120);
    if (!finalName || !finalIndustry) { setError('Confirma el nombre y giro de tu marca antes de guardar.'); return; }
    const theme: BusinessTheme = {
      ...(tenantConfig.theme || {} as BusinessTheme),
      brandName: finalName,
      industry: finalIndustry,
      tagline: cleanText(tagline, 300) || cleanText(description, 300),
      tone: direction.tone,
      targetAudience: cleanText(audience, 200),
      location: tenantConfig.theme?.location || tenantConfig.showroomCity || '',
      valuePropositions: (aiProfile?.valuePropositions || []).slice(0, 5),
      productTypes: cleanText(aiProfile?.productTypes || description, 200),
      suggestedCategories: (aiProfile?.suggestedCategories || []).slice(0, 8),
      layoutStyle: direction.layout,
      fontPairing: direction.font,
      onboardingCompleted: true,
    };
    setError('');
    setSaving(true);
    try {
      await onSave({
        ...tenantConfig,
        name: finalName,
        accentColor: direction.accent,
        theme,
      }, openCatalog);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil de marca.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F0EFEB] text-[#242124]">
      <header className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-7 sm:px-10">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-[#C5C1BC] px-4 py-2 text-xs font-bold hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          <ArrowLeft className="h-4 w-4"/> Elegir otra experiencia
        </button>
        <span className="font-mono text-[11px] font-bold uppercase tracking-[.18em] text-[#746C77]">candy.studio / Brand discovery / {step === 'brief' ? '01' : '02'}</span>
      </header>

      <section className="mx-auto max-w-[1240px] px-5 pb-20 pt-7 sm:px-10 sm:pt-14">
        <div className="mb-9 max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#DED1FF] px-3 py-1.5 text-xs font-bold"><Sparkles className="h-4 w-4"/> CANDY BRAND STUDIO</span>
          <h1 className="text-[clamp(2.9rem,7vw,6.5rem)] font-extrabold uppercase leading-[.92] tracking-[-.075em]">{step === 'brief' ? <>Toda gran marca <span className="text-[#8155E7]">comienza aquí.</span></> : <>Tu idea ya tiene <span className="text-[#8155E7]">dirección.</span></>}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#625D60]">{step === 'brief' ? 'Cuéntanos qué estás construyendo. Gemini te ayudará a identificar el giro, el público y una primera propuesta creativa.' : 'Esta es una primera exploración del ADN de tu marca. Corrige lo necesario y elige el lenguaje visual con el que quieres comenzar.'}</p>
        </div>

        {error && <div role="alert" className="mb-6 flex items-start gap-2 rounded-xl border border-[#E4A3A0] bg-[#FCE8E5] p-4 text-sm text-[#8A2525]"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0"/>{error}</div>}

        {step === 'brief' ? (
          <form onSubmit={analyzeBrand} className="grid gap-7 lg:grid-cols-[1.1fr_.9fr]">
            <div className="space-y-5 rounded-[26px] border border-[#D9D6D1] bg-white p-6 shadow-sm sm:p-9">
              <label className="block text-xs font-bold uppercase tracking-wider" htmlFor="brand-name">¿Cómo se llama tu marca?</label>
              <input id="brand-name" value={name} maxLength={120} onChange={e => setName(e.target.value)} required minLength={2} placeholder="Ej. Órbita Studio" className="w-full rounded-xl border border-[#D7D3D0] bg-[#FAF9F7] px-4 py-3 text-base outline-none focus:border-[#8155E7] focus:ring-2 focus:ring-[#8155E7]/20"/>
              <label className="block text-xs font-bold uppercase tracking-wider" htmlFor="brand-description">¿Qué haces o qué te gustaría vender?</label>
              <textarea id="brand-description" value={description} maxLength={1200} onChange={e => setDescription(e.target.value)} required minLength={12} rows={5} placeholder="Cuéntanos la idea, productos, servicios o valores de tu negocio..." className="w-full resize-y rounded-xl border border-[#D7D3D0] bg-[#FAF9F7] px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#8155E7] focus:ring-2 focus:ring-[#8155E7]/20"/>
              <label className="block text-xs font-bold uppercase tracking-wider" htmlFor="brand-audience">¿A quién quieres llegar? <span className="font-normal normal-case text-[#7D7779]">(Opcional)</span></label>
              <input id="brand-audience" value={audience} maxLength={350} onChange={e => setAudience(e.target.value)} placeholder="Ej. Personas que buscan regalos originales" className="w-full rounded-xl border border-[#D7D3D0] bg-[#FAF9F7] px-4 py-3 text-sm outline-none focus:border-[#8155E7] focus:ring-2 focus:ring-[#8155E7]/20"/>
              <button type="submit" disabled={busy || name.trim().length < 2 || description.trim().length < 12} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#241D32] px-6 py-4 text-sm font-bold text-white hover:bg-[#6643AA] disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? <><LoaderCircle className="h-4 w-4 animate-spin"/> Analizando con Gemini...</> : <>Descubrir mi marca con IA <ArrowRight className="h-4 w-4"/></>}
              </button>
              <p className="text-xs text-[#777078]">La consulta a Gemini se ejecuta solo cuando presionas el botón. No generamos logotipos ni publicamos nada en esta etapa.</p>
            </div>
            <aside className="flex flex-col justify-between gap-8 rounded-[26px] bg-[#27212F] p-7 text-white sm:p-10">
              <div>
                <Palette className="mb-7 h-7 w-7 text-[#DFC6FF]"/>
                <p className="font-mono text-xs uppercase tracking-[.2em] text-[#D4C5E5]">Creative brief / 001</p>
                <h2 className="mt-4 text-4xl font-bold leading-[.96] tracking-[-.055em]">Primero entendemos. Después diseñamos.</h2>
                <p className="mt-6 max-w-sm text-sm leading-relaxed text-[#C9C0CD]">Tu marca no debería empezar con un logo aleatorio. Definimos su razón de ser, su tono y a quién quiere llegar.</p>
              </div>
              <div className="flex items-center gap-2 border-t border-white/20 pt-5 text-xs text-[#D4C5E5]"><Lightbulb className="h-4 w-4"/> Tu perfil alimentará después Candy Catalog.</div>
            </aside>
          </form>
        ) : (
          <div className="space-y-7">
            <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
              <div className="space-y-4 rounded-[26px] bg-white p-6 sm:p-8">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#8155E7]">Gemini / Primera orientación</span>
                <p className="text-base leading-relaxed">{summary}</p>
                <p className="text-xs text-[#7A7377]">Revisa la información: es una propuesta inicial, no una investigación de mercado verificada.</p>
              </div>
              <div className="grid gap-4 rounded-[26px] border border-[#D9D6D1] p-6 sm:grid-cols-2 sm:p-8">
                <label className="text-xs font-bold uppercase tracking-wider">Nombre de marca<input value={name} maxLength={120} onChange={e => setName(e.target.value)} className="mt-2 block w-full rounded-lg border border-[#CFCBC8] bg-white p-3 text-sm normal-case"/></label>
                <label className="text-xs font-bold uppercase tracking-wider">Giro o industria<input value={industry} maxLength={120} onChange={e => setIndustry(e.target.value)} className="mt-2 block w-full rounded-lg border border-[#CFCBC8] bg-white p-3 text-sm normal-case"/></label>
                <label className="text-xs font-bold uppercase tracking-wider sm:col-span-2">Público ideal<input value={audience} maxLength={200} onChange={e => setAudience(e.target.value)} className="mt-2 block w-full rounded-lg border border-[#CFCBC8] bg-white p-3 text-sm normal-case"/></label>
                <label className="text-xs font-bold uppercase tracking-wider sm:col-span-2">Idea creativa inicial<textarea value={tagline} maxLength={300} rows={3} onChange={e => setTagline(e.target.value)} className="mt-2 block w-full rounded-lg border border-[#CFCBC8] bg-white p-3 text-sm normal-case leading-relaxed"/></label>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Elige un punto de partida visual</h2>
              <p className="mt-2 text-sm text-[#6A6268]">Son tres sistemas de diseño preconfigurados para explorar, no logotipos generados por IA. Podrás refinarlos más adelante.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {DIRECTIONS.map(d => (
                <button key={d.id} type="button" onClick={() => setSelection(d.id)} aria-pressed={selection === d.id} className={`group overflow-hidden rounded-[22px] border-2 text-left transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${selection === d.id ? 'border-[#8155E7] shadow-lg' : 'border-transparent hover:border-[#B6A5D6]'}`}>
                  <div className="flex h-44 flex-col justify-between p-5" style={{backgroundColor:d.bg,color:d.fg}}>
                    <span className="font-mono text-xs uppercase tracking-wider">{d.label}</span>
                    <span className="max-w-[230px] text-3xl font-extrabold leading-none tracking-[-.07em]">{d.line}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3 bg-white p-5">
                    <span className="text-sm leading-relaxed text-[#564D58]">{d.description}</span>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selection === d.id ? 'border-[#8155E7] bg-[#8155E7] text-white' : 'border-[#B9B0BB]'}`}>{selection === d.id && <Check className="h-4 w-4"/>}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#C7C1C4] pt-7">
              <button type="button" onClick={() => setStep('brief')} className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4"><ArrowLeft className="h-4 w-4"/> Cambiar mis respuestas</button>
              <div className="flex flex-wrap gap-3">
                <button type="button" disabled={saving} onClick={() => saveBrand(false)} className="rounded-full border border-[#7D6C94] px-5 py-3 text-sm font-bold hover:bg-white disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar mi ADN de marca'}</button>
                <button type="button" disabled={saving} onClick={() => saveBrand(true)} className="inline-flex items-center gap-2 rounded-full bg-[#241D32] px-5 py-3 text-sm font-bold text-white hover:bg-[#6643AA] disabled:opacity-50">Guardar y seguir a mi catálogo <ArrowRight className="h-4 w-4"/></button>
              </div>
            </div>
            <p className="text-xs text-[#716B70]">Próximos módulos: exploración de logotipos editables, biblioteca de identidad y contenido digital. No están incluidos en esta primera etapa.</p>
          </div>
        )}
      </section>
    </main>
  );
}
