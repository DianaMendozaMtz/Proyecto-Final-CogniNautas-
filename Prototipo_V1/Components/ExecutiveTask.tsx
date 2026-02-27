
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrialResult } from '../types';
import { calculateLevenshtein } from '../utils/scoring';

interface Props {
  onTrialComplete: (result: TrialResult) => void;
  onFinish: () => void;
}

const PHRASES: Record<number, { text: string; silly: boolean }[]> = {
  3: [
    { text: "Los gatos vuelan.", silly: true },
    { text: "El sol brilla.", silly: false },
    { text: "Perros comen huesos.", silly: false },
    { text: "Peces caminan rápido.", silly: true }
  ],
  4: [
    { text: "Manzanas crecen en árboles.", silly: false },
    { text: "El helado está caliente.", silly: true },
    { text: "Pájaros cantan por mañana.", silly: false },
    { text: "La luna es verde.", silly: true }
  ],
  5: [
    { text: "Osos grandes viven en cuevas.", silly: false },
    { text: "Elefantes usan zapatos rojos pequeños.", silly: true },
    { text: "Me gusta comer pizza.", silly: false },
    { text: "Los coches nadan en mar.", silly: true }
  ],
  6: [
    { text: "El dinosaurio morado come rocas gigantes.", silly: true },
    { text: "Vamos a la escuela para aprender.", silly: false },
    { text: "Un ratón pequeño encontró mucho queso.", silly: false },
    { text: "La lluvia cae desde el suelo.", silly: true }
  ],
  7: [
    { text: "Mi amigo tiene una bici muy guay.", silly: false },
    { text: "La cuchara habladora bailó en la mesa.", silly: true },
    { text: "Cada día jugamos en el parque.", silly: false },
    { text: "Los cohetes están hechos de pan tierno.", silly: true }
  ]
};

const ExecutiveTask: React.FC<Props> = ({ onTrialComplete, onFinish }) => {
  const [span, setSpan] = useState(3);
  const [trialCount, setTrialCount] = useState(0);
  const [state, setState] = useState<'READY' | 'LISTENING' | 'SEMANTIC' | 'SPEAKING' | 'FEEDBACK'>('READY');
  const [currentPhrase, setCurrentPhrase] = useState<{ text: string; silly: boolean } | null>(null);
  const [transcript, setTranscript] = useState('');
  const [semanticCorrect, setSemanticCorrect] = useState<boolean | null>(null);
  
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'es-ES';
      recognitionRef.current.continuous = false;
      recognitionRef.current.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        processFinalResult(result);
      };
      recognitionRef.current.onerror = () => {
        setTranscript("...");
        processFinalResult("");
      };
    }
  }, []);

  const startTrial = async () => {
    const options = PHRASES[span] || PHRASES[7];
    const phrase = options[Math.floor(Math.random() * options.length)];
    setCurrentPhrase(phrase);
    setTranscript('');
    setSemanticCorrect(null);
    setState('LISTENING');

    const utterance = new SpeechSynthesisUtterance(phrase.text);
    utterance.lang = 'es-ES';
    
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      (v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium')))
    ) || voices.find(v => v.lang.includes('es'));
    
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    utterance.onend = () => {
      setState('SEMANTIC');
      startTimeRef.current = Date.now();
    };
    synthRef.current.speak(utterance);
  };

  const handleSemanticChoice = (isSilly: boolean) => {
    if (state !== 'SEMANTIC') return;
    const correct = isSilly === currentPhrase?.silly;
    setSemanticCorrect(correct);
    setState('SPEAKING');
    if (recognitionRef.current) {
      recognitionRef.current.start();
    } else {
      const manual = prompt("¡El loro te escucha! ¿Qué ha dicho?");
      processFinalResult(manual || "");
    }
  };

  const processFinalResult = (captured: string) => {
    if (!currentPhrase) return;
    
    const target = currentPhrase.text.toLowerCase().replace(/[.,!]/g, '');
    const source = captured.toLowerCase().replace(/[.,!]/g, '');
    
    const distance = calculateLevenshtein(target, source);
    const accuracyRepetition = Math.max(0, 1 - distance / target.length);
    const totalAccuracy = (semanticCorrect ? 0.3 : 0) + (accuracyRepetition * 0.7);

    onTrialComplete({
      module: 'EXECUTIVE',
      sequenceLength: span,
      presented: [currentPhrase.text],
      captured: [captured],
      accuracy: totalAccuracy,
      latency: Date.now() - startTimeRef.current,
      errorType: totalAccuracy > 0.8 ? 'NONE' : 'SUBSTITUTION',
      timestamp: Date.now()
    });

    if (totalAccuracy >= 0.8) setSpan(s => Math.min(s + 1, 7));
    else if (totalAccuracy <= 0.5) setSpan(s => Math.max(s - 1, 3));

    setState('FEEDBACK');
    setTrialCount(prev => prev + 1);

    const utterance = new SpeechSynthesisUtterance(captured ? `Has dicho: ${captured}` : "¡No te he oído!");
    utterance.lang = 'es-ES';
    
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      (v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium')))
    ) || voices.find(v => v.lang.includes('es'));
    
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.pitch = 1.2;
    utterance.rate = 1.0;
    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    if (trialCount >= 5) onFinish();
  }, [trialCount, onFinish]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 bg-gradient-to-b from-emerald-50 to-teal-50 rounded-3xl p-6">
      <div className="text-center w-full max-w-lg">
        {state === 'READY' && (
          <div className="space-y-6">
            <div className="text-9xl animate-bounce">🦜</div>
            <h3 className="text-3xl font-bold text-teal-600">Las Historias del Loro</h3>
            <p className="text-xl text-slate-600">
              Escucha al loro. Decide si lo que dice es <b>Verdad</b> o una <b>Tontería</b>, ¡y luego repítelo!
            </p>
            <button 
              onClick={startTrial}
              className="px-12 py-5 bg-teal-500 text-white rounded-3xl font-bold text-2xl hover:bg-teal-600 shadow-xl transition transform hover:scale-105"
            >
              ¡Hablar con el Loro!
            </button>
          </div>
        )}

        {state === 'LISTENING' && (
          <div className="space-y-6">
            <div className="text-9xl animate-pulse">🦜</div>
            <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-teal-100">
              <p className="text-2xl font-medium text-teal-800 italic animate-pulse">
                "Hablando..."
              </p>
            </div>
          </div>
        )}

        {state === 'SEMANTIC' && (
          <div className="space-y-8">
            <div className="text-7xl">🤔</div>
            <p className="text-2xl font-bold text-slate-700">¿Eso es verdad o es una tontería?</p>
            <div className="grid grid-cols-2 gap-6">
              <button 
                onClick={() => handleSemanticChoice(false)}
                className="py-10 bg-emerald-500 text-white rounded-3xl font-bold text-3xl hover:bg-emerald-600 shadow-xl active:scale-95 transition"
              >
                ✅ Real
              </button>
              <button 
                onClick={() => handleSemanticChoice(true)}
                className="py-10 bg-rose-500 text-white rounded-3xl font-bold text-3xl hover:bg-rose-600 shadow-xl active:scale-95 transition"
              >
                😜 Tontería
              </button>
            </div>
          </div>
        )}

        {state === 'SPEAKING' && (
          <div className="space-y-6">
            <div className="text-9xl animate-pulse">🎤</div>
            <p className="text-3xl font-black text-orange-500 uppercase">¡Repite la frase ahora!</p>
            <div className="w-20 h-20 border-8 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        )}

        {state === 'FEEDBACK' && (
          <div className="space-y-6">
            <div className="text-9xl">🦜</div>
            <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-slate-100">
              <p className="text-slate-500 mb-2 text-lg">El Loro escuchó:</p>
              <p className="text-3xl font-black text-teal-600 italic">"{transcript || "..."}"</p>
            </div>
            <button 
              onClick={() => setState('READY')}
              className="px-10 py-4 bg-indigo-500 text-white rounded-2xl font-bold text-xl hover:bg-indigo-600 transition shadow-lg"
            >
              ¡Siguiente Historia!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveTask;
