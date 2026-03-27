
import React, { useState, useCallback, useEffect } from 'react';
import { ModuleType, SessionData, TrialResult, ClassificationProfile, ProfessionalData, OperationalMode, GuardianConsent, ChronologicalAge } from './types';
import PhonologicalTask from './components/PhonologicalTask';
import VisuospatialTask from './components/VisuospatialTask';
import Report from './components/Report';
import Consent from './components/Consent';
import ProfessionalLogin from './components/ProfessionalLogin';
import { classifyProfile } from './utils/scoring';
import { getExpertFeedback } from './services/geminiService';

import Psychoeducation from './components/Psychoeducation';

const APP_VERSION = '3.0.1';
const SURVEY_URL = 'https://forms.gle/your-google-form-url';

const App: React.FC = () => {
  const [step, setStep] = useState<'PROFESSIONAL_LOGIN' | 'CONSENT' | 'PRE_INSTRUCTIONS' | 'ONBOARDING' | 'TASK' | 'PSYCHOEDUCATION' | 'SATISFACTION_SURVEY' | 'RESULTS'>('PROFESSIONAL_LOGIN');
  const [activeModule, setActiveModule] = useState<ModuleType>('NONE');
  const [session, setSession] = useState<SessionData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProfessionalLogin = (prof: ProfessionalData, mode: OperationalMode) => {
    setSession({
      id: crypto.randomUUID(),
      childId: '',
      userAge: 12,
      trials: [],
      professional: prof,
      mode: mode,
      startTime: Date.now(),
      version: APP_VERSION,
      consent: {
        guardianName: '',
        relationship: '',
        acceptedTerms: false,
        signature: '',
        timestamp: 0
      }
    });
    setStep('CONSENT');
  };

  const handleConsentAccept = (consent: GuardianConsent) => {
    setSession(prev => prev ? ({ ...prev, consent }) : null);
    setStep('PRE_INSTRUCTIONS');
  };

  const handlePreInstructionsContinue = () => {
    setStep('ONBOARDING');
  };

  const handleOnboardingStart = (childId: string, age: number, chronologicalAge: ChronologicalAge, gender?: string) => {
    setSession(prev => prev ? ({ ...prev, childId, userAge: age, chronologicalAge, gender }) : null);
    setActiveModule('PHONOLOGICAL');
    setStep('TASK');
  };

  const handleConsentDecline = () => {
    setStep('ONBOARDING');
  };

  const handleTrialComplete = useCallback((result: TrialResult) => {
    setSession(prev => prev ? ({
      ...prev,
      trials: [...prev.trials, result]
    }) : null);
  }, []);

  const processResults = useCallback(async () => {
    if (!session) return;
    setIsProcessing(true);
    const summary = classifyProfile(session.trials, session);
    
    // Add traceability metadata
    summary.metadata = {
      professionalName: session.professional.fullName,
      licenseNumber: session.professional.licenseNumber,
      mode: session.mode,
      startTime: session.startTime,
      endTime: Date.now(),
      version: session.version,
      consentStatus: session.consent.acceptedTerms
    };

    const feedback = await getExpertFeedback(session, summary);
    
    setSession(prev => prev ? ({
      ...prev,
      summary: {
        ...summary,
        feedback: feedback.childFeedback,
        parentReport: feedback.parentReport,
        psychoeducation: {
          ...summary.psychoeducation,
          concepts: feedback.psychoeducation || summary.psychoeducation.concepts
        }
      }
    }) : null);
    setIsProcessing(false);
  }, [session]);

  const handleModuleFinish = useCallback(async (current: ModuleType) => {
    if (!session) return;

    if (current === 'PHONOLOGICAL') {
      setActiveModule('VISUOSPATIAL');
    } else if (current === 'VISUOSPATIAL') {
      // Start processing results to get the encouraging message for the Psychoeducation screen
      await processResults();
      setStep('PSYCHOEDUCATION');
    }
  }, [session, processResults]);

  const handlePsychoeducationNext = () => {
    setStep('SATISFACTION_SURVEY');
  };

  const handleSurveyComplete = () => {
    setStep('RESULTS');
  };

  if (step === 'PROFESSIONAL_LOGIN') {
    return <ProfessionalLogin onLogin={handleProfessionalLogin} />;
  }

  if (step === 'CONSENT') {
    return <Consent onAccept={handleConsentAccept} onDecline={() => setStep('PROFESSIONAL_LOGIN')} />;
  }

  if (step === 'PRE_INSTRUCTIONS') {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-[40px] p-10 max-w-2xl w-full shadow-2xl">
          <div className="text-6xl mb-6 text-center">📋</div>
          <h2 className="text-3xl font-black text-slate-800 mb-6 text-center uppercase tracking-tight">Indicaciones de Aplicación</h2>
          <div className="space-y-4 mb-10">
            <div className="flex gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <span className="text-2xl">⚠️</span>
              <p className="text-amber-900 font-medium">Esta es una prueba de memoria de trabajo y NO sustituye un diagnóstico clínico.</p>
            </div>
            <div className="flex gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <span className="text-2xl">📊</span>
              <p className="text-blue-900 font-medium">Permite recabar datos para que un profesional los evalúe.</p>
            </div>
            <div className="flex gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <span className="text-2xl">⏱️</span>
              <p className="text-indigo-900 font-medium">Duración estimada: 20 a 30 minutos.</p>
            </div>
            <div className="flex gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-2xl">🤫</span>
              <p className="text-emerald-900 font-medium">Aplicar en un lugar tranquilo, sin distracciones visuales o auditivas, con el menor ruido de fondo posible.</p>
            </div>
          </div>
          <button 
            onClick={handlePreInstructionsContinue}
            className="w-full py-6 bg-indigo-600 text-white rounded-[30px] font-black text-2xl hover:bg-indigo-700 transition transform active:scale-95 shadow-xl uppercase tracking-widest"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  if (step === 'ONBOARDING') {
    return <Onboarding onStart={handleOnboardingStart} />;
  }

  if (step === 'PSYCHOEDUCATION' && session?.summary) {
    return (
      <Psychoeducation 
        feedback={session.summary.feedback} 
        onNext={handlePsychoeducationNext} 
        surveyUrl={SURVEY_URL}
      />
    );
  }

  if (step === 'SATISFACTION_SURVEY') {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-[40px] p-10 max-w-lg w-full text-center shadow-2xl">
          <div className="text-6xl mb-6">📝</div>
          <h2 className="text-3xl font-black text-slate-800 mb-4">Encuesta de Satisfacción</h2>
          <p className="text-slate-600 mb-8 font-medium">
            ¡Casi terminamos! Por favor, ayúdanos respondiendo esta breve encuesta sobre tu experiencia en la misión.
          </p>
          <a 
            href={SURVEY_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xl mb-4 hover:bg-indigo-700 transition"
          >
            Abrir Encuesta 🚀
          </a>
          <button 
            onClick={handleSurveyComplete}
            className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-lg hover:bg-slate-200 transition"
          >
            Ya respondí, ver resultados
          </button>
        </div>
      </div>
    );
  }

  if (step === 'RESULTS' && session) {
    return <Report session={session} onRestart={() => window.location.reload()} />;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-sky-50 font-fredoka">
      <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl p-6 md:p-10 min-h-[600px] flex flex-col relative overflow-hidden">
        {isProcessing ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-24 h-24 border-8 border-indigo-100 rounded-full"></div>
              <div className="w-24 h-24 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
            </div>
            <p className="text-3xl font-black text-indigo-800 animate-pulse uppercase tracking-widest">¡Calculando tu Súper Cerebro!</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">🧠</div>
                 <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">
                    {activeModule === 'PHONOLOGICAL' && "El loro numérico"}
                    {activeModule === 'VISUOSPATIAL' && "Arquitecto Invisible"}
                 </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Sesión Segura</span>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {activeModule === 'PHONOLOGICAL' && (
                <PhonologicalTask 
                  onTrialComplete={handleTrialComplete} 
                  onFinish={() => handleModuleFinish('PHONOLOGICAL')} 
                  onAbort={() => {
                    setStep('PRE_INSTRUCTIONS');
                    setActiveModule('NONE');
                  }}
                />
              )}
              {activeModule === 'VISUOSPATIAL' && (
                <VisuospatialTask 
                  onTrialComplete={handleTrialComplete} 
                  onFinish={() => handleModuleFinish('VISUOSPATIAL')} 
                  onAbort={() => {
                    setStep('PRE_INSTRUCTIONS');
                    setActiveModule('NONE');
                  }}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Onboarding: React.FC<{ onStart: (id: string, age: number, chronologicalAge: ChronologicalAge, gender?: string) => void }> = ({ onStart }) => {
  const [childId, setChildId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [evalDate, setEvalDate] = useState(new Date().toISOString().split('T')[0]);
  const [gender, setGender] = useState<string>('');

  const calculateAge = (birth: string, evaluation: string) => {
    const b = new Date(birth);
    const e = new Date(evaluation);
    if (isNaN(b.getTime()) || isNaN(e.getTime())) return { years: 0, months: 0, days: 0 };
    
    let years = e.getFullYear() - b.getFullYear();
    let months = e.getMonth() - b.getMonth();
    let days = e.getDate() - b.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(e.getFullYear(), e.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  };

  const ageData = calculateAge(birthDate, evalDate);

  const handleStart = () => {
    if (!childId || !birthDate || !evalDate) return;
    const chronologicalAge: ChronologicalAge = {
      ...ageData,
      birthDate,
      evaluationDate: evalDate
    };
    onStart(childId, ageData.years, chronologicalAge, gender);
  };

  return (
    <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-50 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full translate-x-1/2 translate-y-1/2 opacity-50 blur-3xl"></div>

      <div className="bg-white rounded-[50px] p-12 max-w-lg w-full shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] text-center relative z-10 border-b-8 border-indigo-200">
        <div className="text-8xl mb-6 transform hover:scale-110 transition cursor-default select-none">🚀</div>
        <h1 className="text-5xl font-black text-slate-800 mb-4 tracking-tighter">Cogninautas</h1>
        <p className="text-2xl text-indigo-600 font-bold mb-10 uppercase tracking-widest">¡Aventura Cerebral!</p>
        
        <div className="space-y-6 text-left mb-10">
          <div className="relative">
            <label className="block text-sm font-black text-slate-500 mb-2 uppercase ml-4">Código del Explorador</label>
            <input 
              type="text" 
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="w-full p-5 bg-slate-50 border-4 border-slate-100 rounded-3xl focus:border-indigo-500 focus:bg-white outline-none transition text-xl font-bold"
              placeholder="Ej. EXP-001"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-black text-slate-500 mb-2 uppercase ml-4">Género (Opcional)</label>
              <select 
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-5 bg-slate-50 border-4 border-slate-100 rounded-3xl focus:border-indigo-500 focus:bg-white outline-none transition text-lg font-bold appearance-none"
              >
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-black text-slate-500 mb-2 uppercase ml-4">Fecha Nacimiento</label>
                <input 
                  type="date" 
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-4 border-slate-100 rounded-3xl focus:border-indigo-500 focus:bg-white outline-none transition text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-500 mb-2 uppercase ml-4">Fecha Evaluación</label>
                <input 
                  type="date" 
                  value={evalDate}
                  onChange={(e) => setEvalDate(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-4 border-slate-100 rounded-3xl focus:border-indigo-500 focus:bg-white outline-none transition text-sm font-bold"
                />
              </div>
            </div>

            {birthDate && (
              <div className="bg-indigo-50 p-4 rounded-3xl border-2 border-indigo-100 text-center">
                <p className="text-xs font-black text-indigo-400 uppercase mb-1">Edad Cronológica</p>
                <p className="text-xl font-black text-indigo-700">
                  {ageData.years} años, {ageData.months} meses, {ageData.days} días
                </p>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleStart}
          disabled={!childId || !birthDate}
          className="w-full py-6 bg-indigo-600 text-white rounded-[30px] font-black text-2xl hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition transform active:scale-95 shadow-2xl uppercase tracking-widest"
        >
          ¡Comenzar Misión!
        </button>
        
        <div className="mt-8 flex items-center justify-center gap-2">
           <div className="w-2 h-2 bg-indigo-200 rounded-full"></div>
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
             Evaluación de memoria de trabajo para niños
           </p>
           <div className="w-2 h-2 bg-indigo-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default App;
