
import React from 'react';
import { SessionData } from '../types';
import { generateCSV } from '../utils/scoring';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  session: SessionData;
  onRestart: () => void;
}

const Report: React.FC<Props> = ({ session, onRestart }) => {
  const summary = session.summary;
  
  const phon = session.trials.filter(t => t.module === 'PHONOLOGICAL');
  const vis = session.trials.filter(t => t.module === 'VISUOSPATIAL');
  const exe = session.trials.filter(t => t.module === 'EXECUTIVE');

  const chartData = [
    { name: 'Verbal', accuracy: (phon.reduce((a,b) => a + b.accuracy, 0) / (phon.length || 1)) * 100, color: '#f59e0b' },
    { name: 'Visual', accuracy: (vis.reduce((a,b) => a + b.accuracy, 0) / (vis.length || 1)) * 100, color: '#8b5cf6' },
    { name: 'Control', accuracy: (exe.reduce((a,b) => a + b.accuracy, 0) / (exe.length || 1)) * 100, color: '#10b981' },
  ];

  const downloadCSV = () => {
    const csv = generateCSV(session);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluacion_cognitiva_${session.userName}_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-sky-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header con estilo de Carnet de Explorador */}
        <div className="bg-white rounded-[40px] p-10 shadow-xl flex flex-col md:flex-row justify-between items-center border-b-8 border-indigo-200">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black text-slate-800 mb-2">Informe de Misión: {session.userName}</h1>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="bg-indigo-100 text-indigo-700 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">Edad: {session.userAge} años</span>
              <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">{summary?.classification}</span>
            </div>
          </div>
          <button 
            onClick={onRestart}
            className="mt-6 md:mt-0 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition transform hover:scale-105 active:scale-95"
          >
            Nueva Misión 🚀
          </button>
        </div>

        {/* Feedback para el niño */}
        <div className="bg-gradient-to-r from-orange-400 to-yellow-400 text-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-4 flex items-center gap-3">
              <span className="text-4xl">🏆</span> ¡MEDALLA DE HONOR!
            </h2>
            <p className="text-3xl font-medium leading-tight drop-shadow-md">"{summary?.feedback}"</p>
          </div>
          <div className="absolute -right-10 -bottom-10 text-[200px] opacity-20 rotate-12 select-none pointer-events-none">⭐</div>
        </div>

        {/* DashBoard de Estadísticas */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Gráfico de Barras Moderno */}
          <div className="bg-white rounded-[40px] p-8 shadow-lg border-2 border-slate-100">
            <h3 className="text-xl font-black mb-8 text-slate-700 text-center uppercase tracking-widest">Precisión del Cerebro</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 'bold'}} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="accuracy" radius={[20, 20, 20, 20]} barSize={50}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tarjetas de Span Máximo */}
          <div className="grid grid-rows-2 gap-8">
            <div className="bg-amber-100 rounded-[40px] p-8 shadow-md border-4 border-amber-200 flex items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-inner">🦜</div>
              <div>
                <p className="text-amber-800 font-bold uppercase text-xs tracking-widest">Dígitos al Revés</p>
                <p className="text-4xl font-black text-amber-600">{Math.max(0, ...phon.map(t => t.sequenceLength || 0))} Pasos</p>
              </div>
            </div>
            <div className="bg-purple-100 rounded-[40px] p-8 shadow-md border-4 border-purple-200 flex items-center gap-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-inner">🏗️</div>
              <div>
                <p className="text-purple-800 font-bold uppercase text-xs tracking-widest">Bloques Visuales</p>
                <p className="text-4xl font-black text-purple-600">{Math.max(0, ...vis.map(t => t.sequenceLength || 0))} Pasos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informe detallado para padres */}
        <div className="bg-white rounded-[40px] p-10 shadow-lg border-2 border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
              <span className="text-indigo-500">📄</span> Resumen para los Padres
            </h3>
            <button 
              onClick={downloadCSV}
              className="flex items-center gap-2 px-6 py-2 bg-slate-800 text-white rounded-full text-sm font-bold hover:bg-slate-700 transition"
            >
              <span>📥</span> Descargar Datos CSV
            </button>
          </div>
          <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed text-lg italic">
            {summary?.parentReport}
          </div>
          <p className="mt-8 text-xs text-slate-400 text-center uppercase tracking-tighter">
            MindSpan v2.0 • Diseñado para mentes brillantes • Basado en el modelo Baddeley-Hitch
          </p>
        </div>
      </div>
    </div>
  );
};

export default Report;
