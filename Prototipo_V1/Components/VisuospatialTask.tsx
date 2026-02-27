
import React, { useState, useEffect, useCallback } from 'react';
import { TrialResult } from '../types';

interface Props {
  onTrialComplete: (result: TrialResult) => void;
  onFinish: () => void;
}

const VisuospatialTask: React.FC<Props> = ({ onTrialComplete, onFinish }) => {
  const [span, setSpan] = useState(3);
  const [trialCount, setTrialCount] = useState(0);
  const [state, setState] = useState<'READY' | 'SHOWING' | 'INPUT' | 'FEEDBACK'>('READY');
  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [highlighted, setHighlighted] = useState<number | null>(null);

  const startTrial = async () => {
    const newSeq: number[] = [];
    while(newSeq.length < span) {
      const r = Math.floor(Math.random() * 9);
      if (newSeq[newSeq.length - 1] !== r) newSeq.push(r);
    }
    setSequence(newSeq);
    setUserInput([]);
    setState('SHOWING');

    for (const id of newSeq) {
      setHighlighted(id);
      await new Promise(r => setTimeout(r, 800));
      setHighlighted(null);
      await new Promise(r => setTimeout(r, 300));
    }

    setState('INPUT');
  };

  const handleBlockClick = (id: number) => {
    if (state !== 'INPUT') return;
    const nextInput = [...userInput, id];
    setUserInput(nextInput);

    if (nextInput.length === sequence.length) {
      const matches = sequence.filter((val, i) => nextInput[i] === val).length;
      const accuracy = matches / sequence.length;

      onTrialComplete({
        module: 'VISUOSPATIAL',
        sequenceLength: span,
        presented: sequence,
        captured: nextInput,
        accuracy,
        latency: 0,
        errorType: accuracy === 1 ? 'NONE' : 'POSITION',
        timestamp: Date.now()
      });

      if (accuracy >= 1.0) setSpan(s => Math.min(s + 1, 9));
      else if (accuracy <= 0.4) setSpan(s => Math.max(s - 1, 3));

      setState('FEEDBACK');
      setTrialCount(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (trialCount >= 5) onFinish();
  }, [trialCount, onFinish]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 bg-gradient-to-b from-indigo-50 to-purple-50 rounded-3xl p-6">
      {state === 'READY' ? (
        <div className="text-center space-y-6">
          <div className="text-9xl">🏗️</div>
          <h3 className="text-3xl font-bold text-indigo-600">Arquitecto Invisible</h3>
          <p className="text-xl text-slate-600 max-w-md">Mira los bloques que se iluminan y tócalos en el <b>mismo orden</b>.</p>
          <button 
            onClick={startTrial}
            className="px-12 py-5 bg-purple-500 text-white rounded-3xl font-bold text-2xl hover:bg-purple-600 shadow-xl transition transform hover:scale-105"
          >
            ¡Empezar Obra!
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-6 bg-white p-6 rounded-3xl shadow-inner border-4 border-slate-100">
          {Array.from({ length: 9 }).map((_, i) => (
            <button
              key={i}
              onClick={() => handleBlockClick(i)}
              className={`w-24 h-24 rounded-2xl transition-all transform active:scale-90 ${
                highlighted === i 
                  ? 'bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.8)] scale-110' 
                  : userInput.includes(i) && state === 'INPUT'
                  ? 'bg-purple-300'
                  : 'bg-slate-50 hover:bg-slate-100 border-4 border-slate-200'
              }`}
            />
          ))}
        </div>
      )}

      {state === 'FEEDBACK' && (
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold text-emerald-500">¡Bien hecho!</p>
          <button 
            onClick={() => setState('READY')}
            className="px-10 py-4 bg-indigo-500 text-white rounded-2xl font-bold text-xl hover:bg-indigo-600 transition shadow-lg"
          >
            Siguiente Plano ➡️
          </button>
        </div>
      )}
    </div>
  );
};

export default VisuospatialTask;
