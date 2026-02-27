
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrialResult } from '../types';

interface Props {
  onTrialComplete: (result: TrialResult) => void;
  onFinish: () => void;
}

const PhonologicalTask: React.FC<Props> = ({ onTrialComplete, onFinish }) => {
  const [span, setSpan] = useState(2);
  const [trialCount, setTrialCount] = useState(0);
  const [state, setState] = useState<'READY' | 'LISTENING' | 'SPEAKING' | 'FEEDBACK'>('READY');
  const [sequence, setSequence] = useState<string[]>([]);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'es-ES';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event: any) => {
        const result = event.results[0][0].transcript;
        setTranscript(result);
        processResult(result);
      };
      recognitionRef.current.onerror = () => {
        setTranscript("No pude escucharte bien");
        processResult("");
      };
    }
  }, []);

  const generateSequence = (length: number) => {
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return Array.from({ length }, () => digits[Math.floor(Math.random() * digits.length)]);
  };

  const startTrial = async () => {
    const newSeq = generateSequence(span);
    setSequence(newSeq);
    setTranscript('');
    setState('LISTENING');

    for (const digit of newSeq) {
      const utterance = new SpeechSynthesisUtterance(digit);
      utterance.lang = 'es-ES';
      
      // Try to find a more natural voice
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(v => 
        (v.lang.includes('es') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium')))
      ) || voices.find(v => v.lang.includes('es'));
      
      if (preferredVoice) utterance.voice = preferredVoice;
      
      utterance.rate = 0.8;
      utterance.pitch = 1.1; // Slightly higher pitch for a friendlier tone
      synthRef.current.speak(utterance);
      await new Promise(r => setTimeout(r, 1200));
    }

    setState('SPEAKING');
    if (recognitionRef.current) {
      recognitionRef.current.start();
    } else {
      const manual = prompt("¡Díselo al loro al revés! (Ejemplo: si dijo 1 2, escribe 2 1)");
      processResult(manual || "");
    }
  };

  const processResult = (result: string) => {
    // Reverse logic: compare with reversed sequence
    const reversedTarget = [...sequence].reverse();
    const cleanedResult = result.replace(/[^0-9]/g, '').split('');
    
    let matches = 0;
    for (let i = 0; i < reversedTarget.length; i++) {
      if (cleanedResult[i] === reversedTarget[i]) matches++;
    }
    
    const accuracy = matches / reversedTarget.length;

    const trial: TrialResult = {
      module: 'PHONOLOGICAL',
      sequenceLength: span,
      presented: sequence,
      captured: cleanedResult,
      accuracy,
      latency: 0,
      errorType: accuracy === 1 ? 'NONE' : 'ORDER',
      timestamp: Date.now()
    };

    onTrialComplete(trial);
    
    if (accuracy >= 1.0) {
      setSpan(s => Math.min(s + 1, 9));
    } else if (accuracy <= 0.4) {
      setSpan(s => Math.max(s - 1, 2));
    }

    setState('FEEDBACK');
    setTrialCount(prev => prev + 1);
  };

  useEffect(() => {
    if (trialCount >= 5) onFinish();
  }, [trialCount, onFinish]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 bg-gradient-to-b from-yellow-50 to-orange-50 rounded-3xl p-6">
      <div className="text-center">
        {state === 'READY' && (
          <div className="space-y-6">
            <div className="text-9xl animate-bounce">🦜</div>
            <h3 className="text-3xl font-bold text-orange-600">¡El Loro al Revés!</h3>
            <p className="text-xl text-slate-700 max-w-md">
              Escucha los números y dímelos en <b>orden inverso</b>. <br/>
              (Si digo "1, 2", tú dices "2, 1")
            </p>
            <button 
              onClick={startTrial}
              className="px-12 py-5 bg-orange-500 text-white rounded-3xl font-bold text-2xl hover:bg-orange-600 transform hover:scale-105 transition shadow-xl"
            >
              ¡Estoy listo!
            </button>
          </div>
        )}

        {state === 'LISTENING' && (
          <div className="space-y-6">
            <div className="text-9xl animate-pulse">👂</div>
            <p className="text-2xl font-black text-indigo-600 tracking-widest uppercase">¡Escucha con atención!</p>
          </div>
        )}

        {state === 'SPEAKING' && (
          <div className="space-y-6">
            <div className="text-9xl animate-bounce">🦜</div>
            <p className="text-3xl font-black text-emerald-500 uppercase">¡Ahora dímelos al revés!</p>
            <div className="flex justify-center gap-2">
               {[...Array(3)].map((_, i) => (
                 <div key={i} className="w-4 h-4 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: `${i*0.2}s`}} />
               ))}
            </div>
          </div>
        )}

        {state === 'FEEDBACK' && (
          <div className="space-y-6 animate-in fade-in zoom-in">
            <p className="text-2xl text-slate-600">El loro escuchó: <br/>
               <span className="font-black text-5xl text-orange-500 mt-2 block tracking-widest">{transcript || "???"}</span>
            </p>
            <button 
              onClick={() => setState('READY')}
              className="px-10 py-4 bg-indigo-500 text-white rounded-2xl font-bold text-xl hover:bg-indigo-600 transition shadow-lg"
            >
              ¡Siguiente! ➡️
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhonologicalTask;
