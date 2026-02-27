
import { TrialResult, SessionData, SessionSummary, ClassificationProfile } from '../types';

export const calculateLevenshtein = (a: string, b: string): number => {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0)
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

export const classifyProfile = (trials: TrialResult[]): { profile: ClassificationProfile; features: any } => {
  const phon = trials.filter(t => t.module === 'PHONOLOGICAL');
  const vis = trials.filter(t => t.module === 'VISUOSPATIAL');
  const exe = trials.filter(t => t.module === 'EXECUTIVE');

  const pAcc = phon.length ? phon.reduce((acc, t) => acc + t.accuracy, 0) / phon.length : 0;
  const vAcc = vis.length ? vis.reduce((acc, t) => acc + t.accuracy, 0) / vis.length : 0;
  const eAcc = exe.length ? exe.reduce((acc, t) => acc + t.accuracy, 0) / exe.length : 0;
  
  const pMax = Math.max(0, ...phon.map(t => t.sequenceLength || 0));
  const vMax = Math.max(0, ...vis.map(t => t.sequenceLength || 0));

  let profile = ClassificationProfile.BALANCED_PROFILE;

  if (eAcc < 0.6) {
    profile = ClassificationProfile.EXECUTIVE_WEAKNESS;
  } else if (vMax > pMax + 1) {
    profile = ClassificationProfile.VISUAL_DOMINANT;
  } else if (pMax > vMax + 1) {
    profile = ClassificationProfile.VERBAL_DOMINANT;
  }

  return {
    profile,
    features: { pAcc, vAcc, eAcc, pMax, vMax }
  };
};

export const generateCSV = (session: SessionData): string => {
  const headers = ['Modulo', 'Ensayo', 'LongitudSecuencia', 'Precision', 'Latencia', 'TipoError', 'Fecha'];
  const rows = session.trials.map((t, i) => [
    t.module,
    i + 1,
    t.sequenceLength || 'N/A',
    t.accuracy.toFixed(2),
    t.latency.toFixed(0),
    t.errorType,
    new Date(t.timestamp).toISOString()
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
};
