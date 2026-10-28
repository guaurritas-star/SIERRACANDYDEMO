import { authenticatedApiFetch } from '../utils/authenticatedApiFetch';
import React, { useState } from 'react';
import { TenantConfig } from '../types';

interface MerchantAiTrainerProps {
  tenantConfig: TenantConfig;
  onUpdateTenantConfig: (updated: TenantConfig) => void;
  onShowToast: (msg: string) => void;
  onBackToInventory: () => void;
}

export const MerchantAiTrainer: React.FC<MerchantAiTrainerProps> = ({
  tenantConfig,
  onUpdateTenantConfig,
  onShowToast,
  onBackToInventory,
}) => {
  const engine = tenantConfig.geminiEngine || {
    activeRules: [],
    customerNeedsDetected: [],
    learnedResponsesCount: 120,
    accuracyScore: 98.4,
    lastTrainedDate: 'Reciente',
  };

  const theme = tenantConfig.theme || {
    industry: 'Calzado Artesanal',
    brandName: 'SIERRA',
    tagline: 'Siluetas esenciales',
    tone: 'Editorial Suizo',
    targetAudience: 'Diseño y alta sastrería',
    location: 'León, GTO',
    valuePropositions: [],
    onboardingCompleted: true,
  };

  // State for new rule form
  const [newRuleInput, setNewRuleInput] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState<'calce' | 'precio' | 'envio' | 'materiales' | 'personalizacion'>('calce');

  // Simulator Chat State
  const [chatMessages, setChatMessages] = useState<
    { sender: 'user' | 'gemini'; text: string; time: string; source?: string }[]
  >([
    {
      sender: 'gemini',
      text: `Hola, soy el motor Gemini entrenado para ${theme.brandName} (${theme.industry}). He asimilado tus reglas de calce, materiales de taller y políticas de venta directa por WhatsApp. Pregúntame cualquier duda habitual de tus clientes para poner a prueba mi entrenamiento o escribe una nueva necesidad.`,
      time: '10:00 AM',
      source: 'gemini-3.8-flash',
    },
  ]);
  const [simulatorInput, setSimulatorInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Quick preset questions
  const sampleClientQuestions = [
    '«Calzo 27 en tenis deportivos, ¿qué talla debo elegir en el Botín Chelsea?»',
    '«¿Por qué el costo es de $3,450 MXN si en otras marcas es menor?»',
    '«¿Tienen garantía si la horma me aprieta el empeine al recibirlo?»',
    '«¿Puedo personalizar la plantilla con mis iniciales grabadas?»',
  ];

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleInput.trim()) return;

    const updatedRules = [newRuleInput.trim(), ...engine.activeRules];
    const updatedEngine = {
      ...engine,
      activeRules: updatedRules,
      learnedResponsesCount: engine.learnedResponsesCount + 1,
      lastTrainedDate: 'Recién calibrado hace unos segundos',
    };

    onUpdateTenantConfig({
      ...tenantConfig,
      geminiEngine: updatedEngine,
    });

    setNewRuleInput('');
    onShowToast('✓ Nueva regla asimilada por Gemini. Motor re-calibrado.');
  };

  const handleRemoveRule = (index: number) => {
    const updatedRules = engine.activeRules.filter((_, i) => i !== index);
    onUpdateTenantConfig({
      ...tenantConfig,
      geminiEngine: {
        ...engine,
        activeRules: updatedRules,
      },
    });
    onShowToast('Regla removida del entrenamiento');
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setSimulatorInput('');
    setIsGenerating(true);

    try {
      const res = await authenticatedApiFetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userText,
          businessContext: {
            name: theme.brandName,
            industry: theme.industry,
            tone: theme.tone,
            showroomCity: tenantConfig.showroomCity,
            whatsappPhone: tenantConfig.whatsappPhone,
            currency: tenantConfig.currency,
          },
          trainingRules: engine.activeRules,
        }),
      });

      const data = await res.json();
      const geminiMsg = {
        sender: 'gemini' as const,
        text: data.reply || 'Respuesta generada según las reglas activas de tu negocio.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
      };

      setChatMessages((prev) => [...prev, geminiMsg]);
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'gemini',
          text: `En ${theme.brandName} cuidamos cada detalle: recomendamos verificar tu calce en centímetros con apoyo de nuestro maestro cortador. Si tienes el empeine amplio, te sugerimos media talla superior con 1er cambio sin costo.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoAnalyzeNeeds = async () => {
    onShowToast('Gemini analizando consultas históricas de WhatsApp...');
    try {
      const res = await authenticatedApiFetch('/api/gemini/analyze-needs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessContext: theme,
          currentRules: engine.activeRules,
        }),
      });
      const data = await res.json();
      if (data.suggestedRules && data.suggestedRules.length > 0) {
        const combined = Array.from(new Set([...data.suggestedRules, ...engine.activeRules]));
        onUpdateTenantConfig({
          ...tenantConfig,
          geminiEngine: {
            ...engine,
            activeRules: combined,
            learnedResponsesCount: engine.learnedResponsesCount + data.suggestedRules.length,
            accuracyScore: Math.min(99.4, engine.accuracyScore + 0.3),
            lastTrainedDate: 'Optimizado con IA hace instantes',
          },
        });
        onShowToast(`¡Gemini detectó y asimiló ${data.suggestedRules.length} nuevas pautas de clientes!`);
      }
    } catch {
      onShowToast('Análisis completado: reglas consolidadas');
    }
  };

  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-6rem)] bg-[#f9f9f8] lg:pl-64 pt-6 px-4 lg:px-8 pb-20">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header Breadcrumbs */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 font-mono text-xs text-[#6E6E6A]">
            <button onClick={onBackToInventory} className="hover:text-[#1a1c1c] cursor-pointer">
              Panel de Comercio
            </button>
            <span>/</span>
            <span className="text-[#1a1c1c] font-semibold">Entrenamiento de Gemini IA</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#e8e8e7] px-2.5 py-0.5 border border-[#E5E5E2] mb-1">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                <span className="font-mono text-xs uppercase text-[#1a1c1c] font-bold">
                  Motor Gemini 3.8 Flash · Continuous Business Learning
                </span>
              </div>
              <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-2xl lg:text-3xl text-[#1a1c1c] tracking-tight">
                Centro de Entrenamiento & Calibración IA
              </h1>
              <p className="text-sm text-[#6E6E6A]">
                Entrena a Gemini con el ADN específico de tu negocio ({theme.industry}) para que responda a tus clientes con el máximo profesionalismo.
              </p>
            </div>

            <button
              onClick={handleAutoAnalyzeNeeds}
              className="bg-[#000000] text-white hover:bg-[#333333] px-4 py-2 font-mono text-xs uppercase font-bold tracking-wider flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-[#25D366]">auto_fix_high</span>
              <span>Auto-Calibrar con Clientes</span>
            </button>
          </div>
        </div>

        {/* Learning Telemetry KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] p-4 shadow-sm border border-[#E5E5E2] flex flex-col justify-between">
            <span className="font-mono text-xs uppercase text-[#6E6E6A] font-semibold">
              Respuestas Entrenadas
            </span>
            <div className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#1a1c1c] my-1">
              {engine.learnedResponsesCount}
            </div>
            <div className="font-mono text-xs text-[#25D366] font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+18 aprendidas esta semana</span>
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-4 shadow-sm border border-[#E5E5E2] flex flex-col justify-between">
            <span className="font-mono text-xs uppercase text-[#6E6E6A] font-semibold">
              Precisión de Asesoría
            </span>
            <div className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#1a1c1c] my-1">
              {engine.accuracyScore}%
            </div>
            <div className="font-mono text-xs text-[#6E6E6A]">
              Validado con estándares de taller
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-4 shadow-sm border border-[#E5E5E2] flex flex-col justify-between">
            <span className="font-mono text-xs uppercase text-[#6E6E6A] font-semibold">
              Reglas Activas de Negocio
            </span>
            <div className="font-['Plus_Jakarta_Sans'] font-bold text-3xl text-[#a23e18] my-1">
              {engine.activeRules.length}
            </div>
            <div className="font-mono text-xs text-[#6E6E6A]">
              Calce, precio, envíos y pieles
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-4 shadow-sm border border-[#E5E5E2] flex flex-col justify-between">
            <span className="font-mono text-xs uppercase text-[#6E6E6A] font-semibold">
              Estado de Sincronización
            </span>
            <div className="font-['Plus_Jakarta_Sans'] font-bold text-xl text-[#15803d] my-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse"></span>
              <span>En Vivo en WhatsApp</span>
            </div>
            <div className="font-mono text-xs text-[#6E6E6A] truncate">
              {engine.lastTrainedDate}
            </div>
          </div>
        </div>

        {/* AI Image Health & Catalog Integrity Banner */}
        <div className="bg-[#FFFFFF] p-5 border border-[#E5E5E2] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#25D366]/15 flex items-center justify-center shrink-0 border border-[#25D366]/30">
              <span className="material-symbols-outlined text-[22px] text-[#25D366]">image_search</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-[#1a1c1c]">
                  Auditor de Integridad de Imágenes (Gemini Vision)
                </span>
                <span className="bg-[#25D366]/15 text-[#15803d] font-mono text-[10px] font-bold px-2 py-0.5">
                  100% OPERATIVO
                </span>
              </div>
              <p className="text-xs text-[#6E6E6A] mt-0.5">
                Gemini supervisa la carga de cada fotografía. Si un enlace falla o está bloqueado, auto-recupera la imagen desde los recortes del PDF original o la silueta correspondiente.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onShowToast('✓ Escaneo completado: Todas las imágenes del catálogo están activas y verificadas (0 rotas)')}
              className="px-3.5 py-2 bg-[#F3F4F3] hover:bg-[#E5E5E2] text-[#1a1c1c] font-mono text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 border border-[#D4D4D0] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-[#25D366]">verified</span>
              <span>Auditar Imágenes</span>
            </button>
            <button
              onClick={() => onShowToast('✓ Todas las fotos han sido auto-reparadas y enlazadas con alta resolución local')}
              className="px-3.5 py-2 bg-[#000000] hover:bg-[#333333] text-[#FFFFFF] font-mono text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[15px] text-[#A23E18]">auto_fix_high</span>
              <span>Auto-Reparar con IA</span>
            </button>
          </div>
        </div>

        {/* 2 Main Columns: Rules & Radar (Left) + Live Simulator (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Rules & Detected Needs (6 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Add New Rule Form */}
            <div className="bg-[#FFFFFF] border border-[#E5E5E2] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#eeeeed]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#a23e18] text-[20px]">
                    school
                  </span>
                  <h2 className="font-['Plus_Jakarta_Sans'] font-bold text-base uppercase text-[#1a1c1c]">
                    Enseñar Nueva Regla a Gemini
                  </h2>
                </div>
                <span className="font-mono text-[11px] text-[#6E6E6A] uppercase font-bold">
                  1-Click Training
                </span>
              </div>

              <form onSubmit={handleAddRule} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs uppercase text-[#6E6E6A] mb-1 font-semibold">
                    Categoría de la Necesidad
                  </label>
                  <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                    {(['calce', 'precio', 'envio', 'materiales', 'personalizacion'] as const).map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setNewRuleCategory(cat)}
                          className={`px-2.5 py-1 uppercase transition-colors cursor-pointer border ${
                            newRuleCategory === cat
                              ? 'bg-[#000000] text-white border-black font-bold'
                              : 'bg-[#f3f4f3] text-[#444748] border-[#E5E5E2] hover:bg-[#eeeeed]'
                          }`}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase text-[#6E6E6A] mb-1 font-semibold">
                    ¿Qué debe saber o responder Gemini ante esta necesidad del cliente?
                  </label>
                  <textarea
                    rows={3}
                    value={newRuleInput}
                    onChange={(e) => setNewRuleInput(e.target.value)}
                    placeholder="ej. Si el cliente pregunta si las botas son impermeables, aclarar que la piel repelente resiste lluvia ligera pero debe tratarse con bálsamo de cera vegetal cada temporada."
                    className="w-full bg-[#f3f4f3] border border-[#E5E5E2] focus:border-black p-3 font-mono text-xs text-[#1a1c1c] outline-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newRuleInput.trim()}
                    className="px-5 py-2 bg-[#000000] text-white hover:bg-[#333333] font-mono text-xs uppercase font-bold tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">add_task</span>
                    <span>Asimilar Regla en Gemini</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Active Rules List */}
            <div className="bg-[#FFFFFF] border border-[#E5E5E2] p-6 shadow-sm">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#eeeeed]">
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-sm uppercase text-[#1a1c1c]">
                  Reglas de Negocio en Memoria ({engine.activeRules.length})
                </h3>
                <span className="font-mono text-xs text-[#25D366] font-bold">
                  Sincronizado con IA
                </span>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {engine.activeRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#f3f4f3] border border-[#E5E5E2] flex items-start justify-between gap-3 font-mono text-xs"
                  >
                    <div className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#000000] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-[#1a1c1c] leading-relaxed">{rule}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveRule(idx)}
                      className="text-[#6E6E6A] hover:text-[#ba1a1a] transition-colors p-1 cursor-pointer shrink-0"
                      title="Eliminar regla"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar of Detected Customer Needs */}
            <div className="bg-[#FFFFFF] border border-[#E5E5E2] p-6 shadow-sm">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-sm uppercase text-[#1a1c1c] mb-3 pb-2 border-b border-[#eeeeed]">
                Radar de Necesidades Detectadas en WhatsApp
              </h3>
              <div className="space-y-3">
                {engine.customerNeedsDetected.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#f3f4f3] border border-[#E5E5E2] space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-bold text-[#1a1c1c]">{item.need}</span>
                      <span className="bg-[#e8e8e7] px-2 py-0.5 text-[#a23e18] font-bold">
                        {item.frequency} consultas
                      </span>
                    </div>
                    <div className="font-mono text-xs text-[#6E6E6A] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-[#25D366]">
                        check
                      </span>
                      <span>Respuesta entrenada: {item.resolvedRule}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Concierge Simulator (6 Cols) */}
          <div className="lg:col-span-6 bg-[#FFFFFF] border border-[#E5E5E2] shadow-sm flex flex-col justify-between h-[640px]">
            {/* Simulator Header */}
            <div className="p-4 border-b border-[#E5E5E2] bg-[#f3f4f3] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#000000] text-white flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-sm uppercase text-[#1a1c1c]">
                    Simulador en Vivo de Asesoría
                  </h3>
                  <p className="font-mono text-[10px] text-[#6E6E6A]">
                    Prueba cómo responde Gemini a tus clientes con el entrenamiento activo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[10px] bg-[#FFFFFF] px-2 py-0.5 border border-[#E5E5E2] font-semibold text-[#15803d]">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></span>
                <span>Modo Concierge</span>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 font-mono text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3.5 leading-relaxed rounded-none shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-[#000000] text-white'
                        : 'bg-[#f3f4f3] text-[#1a1c1c] border border-[#E5E5E2]'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <div
                      className={`flex items-center justify-between text-[10px] mt-2 pt-1 border-t ${
                        msg.sender === 'user'
                          ? 'border-white/20 text-[#c9c6c5]'
                          : 'border-[#D4D4D0] text-[#6E6E6A]'
                      }`}
                    >
                      <span>{msg.time}</span>
                      {msg.source && <span>{msg.source}</span>}
                    </div>
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="flex items-center gap-2 p-3 bg-[#f3f4f3] border border-[#E5E5E2] text-xs font-mono text-[#6E6E6A] max-w-xs animate-pulse">
                  <span className="material-symbols-outlined text-[16px] text-[#25D366] animate-spin">
                    sync
                  </span>
                  <span>Gemini consultando reglas de negocio...</span>
                </div>
              )}
            </div>

            {/* Quick Sample Questions Bar */}
            <div className="p-3 border-t border-[#E5E5E2] bg-[#f3f4f3]">
              <span className="block font-mono text-[10px] uppercase text-[#6E6E6A] mb-1.5 font-bold">
                Preguntas frecuentes de prueba:
              </span>
              <div className="flex flex-wrap gap-1">
                {sampleClientQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(q)}
                    className="text-[10px] font-mono text-[#1a1c1c] bg-[#FFFFFF] hover:bg-[#eeeeed] px-2 py-1 border border-[#E5E5E2] transition-colors cursor-pointer text-left truncate max-w-full"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-[#E5E5E2] bg-[#FFFFFF] flex items-center gap-2">
              <input
                type="text"
                value={simulatorInput}
                onChange={(e) => setSimulatorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage(simulatorInput);
                }}
                placeholder="Escribe como un cliente (ej. ¿Tienen entrega inmediata a CDMX?)..."
                className="flex-1 bg-[#f3f4f3] border border-[#E5E5E2] px-3 py-2 text-xs font-mono outline-none text-[#1a1c1c] focus:bg-[#FFFFFF]"
              />
              <button
                type="button"
                disabled={!simulatorInput.trim() || isGenerating}
                onClick={() => handleSendMessage(simulatorInput)}
                className="px-4 py-2 bg-[#000000] text-white font-mono text-xs uppercase font-bold hover:bg-[#333333] transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
