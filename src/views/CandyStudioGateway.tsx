import React from 'react';
import { ArrowDownRight, ArrowUpRight, Blocks, FileStack, Palette, Sparkles } from 'lucide-react';

interface CandyStudioGatewayProps {
  onCatalog: () => void;
  onBrand: () => void;
  onDemo: () => void;
  onMerchant: () => void;
}

export function CandyStudioGateway({ onCatalog, onBrand, onDemo, onMerchant }: CandyStudioGatewayProps) {
  return (
    <main className="min-h-screen bg-[#ECEBE7] text-[#1C1B1A] selection:bg-[#D8C9FF]">
      <header className="mx-auto flex max-w-[1480px] items-center justify-between gap-3 px-5 py-6 sm:px-10 lg:px-14">
        <div className="flex items-baseline gap-2">
          <span className="font-black text-xl tracking-[-0.075em] sm:text-2xl">candy<span className="text-[#8155E7]">.</span>studio</span>
          <span className="font-mono text-[10px] uppercase tracking-[.2em] text-[#78746F]">AI / LAB 01</span>
        </div>
        <button type="button" onClick={onMerchant} className="rounded-full border border-[#B8B4B0] px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-[#1C1B1A] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Ya tengo cuenta <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
        </button>
      </header>

      <section className="mx-auto max-w-[1480px] px-5 pb-10 pt-10 sm:px-10 lg:px-14 lg:pt-16">
        <div className="mb-9 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#DCD2FA] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"><Sparkles className="h-3.5 w-3.5"/> Tu estudio creativo inteligente</span>
          <span className="font-mono text-[10px] uppercase tracking-[.18em] text-[#6B6662]">Estrategia + Diseño + Tecnología</span>
        </div>
        <div className="max-w-[1120px]">
          <h1 className="text-[clamp(3.7rem,10vw,9.6rem)] font-black uppercase leading-[.83] tracking-[-.085em]">
            TU IDEA.<br/>
            <span className="text-[#8155E7]">TU MARCA.</span><br/>
            TU SIGUIENTE<br className="hidden sm:block"/> PASO<span className="text-[#FF845E]">.</span>
          </h1>
          <div className="mt-9 flex max-w-3xl flex-col justify-between gap-5 border-t border-[#BEB9B2] pt-5 sm:flex-row">
            <p className="max-w-lg text-[15px] leading-relaxed text-[#4A4744] sm:text-lg">
              Trae tus productos o empieza con una idea. Te acompañamos para convertirla en una experiencia digital con criterio creativo, asistida por IA.
            </p>
            <ArrowDownRight aria-hidden="true" className="hidden h-10 w-10 shrink-0 text-[#8155E7] sm:block" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1480px] grid-cols-1 gap-3 px-5 pb-8 sm:px-10 lg:grid-cols-2 lg:px-14">
        <button type="button" onClick={onCatalog} className="group relative flex min-h-[365px] flex-col justify-between overflow-hidden rounded-[26px] bg-[#201F21] p-7 text-left text-white transition-transform duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#8155E7] sm:p-10">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[.2em] text-[#C6C2CA]">01 / Digitalizar</span>
            <FileStack className="h-6 w-6 text-[#D7C7FF]" aria-hidden="true"/>
          </div>
          <div aria-hidden="true" className="absolute right-[-3%] top-[24%] flex w-[56%] rotate-[8deg] flex-col gap-3 opacity-80 transition-transform duration-500 group-hover:rotate-[3deg]">
            <div className="h-20 rounded-xl border border-white/20 bg-[#6C5870] p-3 shadow-xl">
              <div className="mb-2 h-3 w-1/2 bg-[#D7C7FF]"/><div className="h-2 w-4/5 bg-white/50"/>
            </div>
            <div className="ml-7 h-24 rounded-xl border border-white/30 bg-[#B8B0A1] p-3 shadow-xl">
              <div className="mb-3 h-9 w-12 rounded-full bg-[#3D3938]"/><div className="h-2 w-3/4 bg-white/80"/>
            </div>
          </div>
          <div className="relative z-10 max-w-[330px]">
            <span className="mb-3 inline-block rounded-full border border-white/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">Para negocios que ya venden</span>
            <h2 className="text-4xl font-extrabold uppercase leading-[.94] tracking-[-.055em] sm:text-5xl">Tus productos, otra dimensión.</h2>
            <p className="mt-4 max-w-[300px] text-sm leading-relaxed text-[#D3CFD6]">Importa tu PDF o fotografías. La IA organiza tus productos y te ayuda a construir tu catálogo digital.</p>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D7C7FF] px-4 py-3 text-xs font-bold text-[#201F21]">Digitalizar mi catálogo <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></span>
          </div>
        </button>

        <button type="button" onClick={onBrand} className="group relative flex min-h-[365px] flex-col justify-between overflow-hidden rounded-[26px] bg-[#DBCAFF] p-7 text-left text-[#241C37] transition-transform duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#8155E7] sm:p-10">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[.2em] text-[#5A4D75]">02 / Crear</span>
            <Palette className="h-6 w-6 text-[#5E408E]" aria-hidden="true"/>
          </div>
          <div aria-hidden="true" className="absolute right-[-10%] top-[18%] h-52 w-52 rotate-12 rounded-[44px] bg-[#FFB69D] transition-transform duration-500 group-hover:rotate-45 sm:h-64 sm:w-64"/>
          <div aria-hidden="true" className="absolute right-[2%] top-[30%] flex h-32 w-32 -rotate-12 items-center justify-center rounded-full border-[15px] border-[#4E3A79] bg-[#E8DDFE] text-6xl font-black italic sm:h-40 sm:w-40">c.</div>
          <div className="relative z-10 max-w-[350px]">
            <span className="mb-3 inline-block rounded-full border border-[#5A4D75]/40 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">Para marcas que están naciendo</span>
            <h2 className="text-4xl font-extrabold uppercase leading-[.94] tracking-[-.055em] sm:text-5xl">Dale forma a tu idea.</h2>
            <p className="mt-4 max-w-[295px] text-sm leading-relaxed text-[#4D4063]">Define tu identidad, explora direcciones creativas y construye el ADN que dará coherencia a tu marca.</p>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#241C37] px-4 py-3 text-xs font-bold text-white">Crear mi marca con IA <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></span>
          </div>
        </button>
      </section>

      <footer className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4 px-5 pb-10 pt-3 sm:px-10 lg:px-14">
        <p className="max-w-xl text-xs leading-relaxed text-[#6D6965]"><Blocks className="mr-1 inline h-3.5 w-3.5"/> Dos caminos conectados: tu identidad puede acompañarte hasta el catálogo y tus piezas digitales.</p>
        <button type="button" onClick={onDemo} className="text-xs font-bold uppercase tracking-wide underline underline-offset-4 hover:text-[#8155E7] focus-visible:outline-2 focus-visible:outline-offset-4">Explorar demo SIERRA <ArrowUpRight className="inline h-4 w-4"/></button>
      </footer>
    </main>
  );
}
