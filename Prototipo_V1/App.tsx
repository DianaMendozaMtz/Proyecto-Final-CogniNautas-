
import React, { useState, useCallback, useEffect } from 'react';
import { ModuleType, SessionData, TrialResult, ClassificationProfile } from './types';
import PhonologicalTask from './components/PhonologicalTask';
import VisuospatialTask from './components/VisuospatialTask';
import ExecutiveTask from './components/ExecutiveTask';
import Report from './components/Report';
import { classifyProfile } from './utils/scoring';
import { getExpertFeedback } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<'ONBOARDING' | 'TASK' | 'RESULTS'>('ONBOARDING');
  const [activeModule, setActiveModule] = useState<ModuleType>('NONE');
  const [session, setSession] = useState<SessionData>({
    id: crypto.randomUUID(),
    userName: '',
    userAge: 12,
    trials: []
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStart = (name: string, age: number) => {
    setSession(prev => ({ ...prev, userName: name, userAge: age }));
    setActiveModule('PHONOLOGICAL');
    setStep('TASK');
  };

  const handleTrialComplete = useCallback((result: TrialResult) => {
    setSession(prev => ({
      ...prev,
      trials: [...prev.trials, result]
    }));
  }, []);

  const handleModuleFinish = useCallback(async (current: ModuleType) => {
    if (current === 'PHONOLOGICAL') {
      setActiveModule('VISUOSPATIAL');
    } else if (current === 'VISUOSPATIAL') {
      setActiveModule('EXECUTIVE');
    } else {
      setIsProcessing(true);
      const { profile } = classifyProfile(session.trials);
      const feedback = await getExpertFeedback(session, profile);
      
      setSession(prev => ({
        ...prev,
        summary: {
          phonologicalMeanAccuracy: 0,
          phonologicalMaxSpan: 0,
          visuospatialMeanAccuracy: 0,
          visuospatialMaxSpan: 0,
          executiveDualAccuracy: 0,
          executiveInterferenceCost: 0,
          classification: profile,
          feedback: feedback.childFeedback,
          parentReport: feedback.parentReport
        }
      }));
      setIsProcessing(false);
      setStep('RESULTS');
    }
  }, [session]);

  if (step === 'ONBOARDING') {
    return <Onboarding onStart={handleStart} />;
  }

  if (step === 'RESULTS') {
    return <Report session={session} onRestart={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-sky-50 font-fredoka">
      <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl p-10 min-h-[650px] flex flex-col relative overflow-hidden">
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
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">🧠</div>
                 <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">
                    {activeModule === 'PHONOLOGICAL' && "Loro al Revés"}
                    {activeModule === 'VISUOSPATIAL' && "Arquitecto Invisible"}
                    {activeModule === 'EXECUTIVE' && "Historias del Loro"}
                 </h2>
              </div>
              <div className="bg-indigo-50 border-2 border-indigo-100 text-indigo-700 px-6 py-2 rounded-2xl text-lg font-black shadow-sm">
                Nivel {session.trials.filter(t => t.module === activeModule).length + 1}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {activeModule === 'PHONOLOGICAL' && (
                <PhonologicalTask 
                  onTrialComplete={handleTrialComplete} 
                  onFinish={() => handleModuleFinish('PHONOLOGICAL')} 
                />
              )}
              {activeModule === 'VISUOSPATIAL' && (
                <VisuospatialTask 
                  onTrialComplete={handleTrialComplete} 
                  onFinish={() => handleModuleFinish('VISUOSPATIAL')} 
                />
              )}
              {activeModule === 'EXECUTIVE' && (
                <ExecutiveTask 
                  onTrialComplete={handleTrialComplete} 
                  onFinish={() => handleModuleFinish('EXECUTIVE')} 
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Onboarding: React.FC<{ onStart: (name: string, age: number) => void }> = ({ onStart }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState(12);

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
            <label className="block text-sm font-black text-slate-500 mb-2 uppercase ml-4">Nombre del Explorador</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-5 bg-slate-50 border-4 border-slate-100 rounded-3xl focus:border-indigo-500 focus:bg-white outline-none transition text-xl font-bold"
              placeholder="¿Cómo te llamas?"
            />
          </div>
          <div>
            <label className="block text-sm font-black text-slate-500 mb-2 uppercase ml-4">Edad (8-12 años)</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="8" max="12"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value))}
                className="flex-1 accent-indigo-600 h-3"
              />
              <span className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg">{age}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => name && onStart(name, age)}
          disabled={!name}
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
