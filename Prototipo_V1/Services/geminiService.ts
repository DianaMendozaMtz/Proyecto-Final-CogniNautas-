
import { GoogleGenAI } from "@google/genai";
import { SessionData, ClassificationProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getExpertFeedback = async (session: SessionData, profile: ClassificationProfile) => {
  const prompt = `
    Actúa como un neuropsicólogo pediátrico cálido, empático y experto. 
    Analiza los siguientes resultados de una evaluación de memoria de trabajo en la aplicación "Cogninautas" para un explorador llamado ${session.userName} (Edad: ${session.userAge}).
    
    Perfil Clasificado: ${profile}
    Total de Ensayos: ${session.trials.length}
    Amplitud Máxima Fonológica (Dígitos al Revés): ${Math.max(0, ...session.trials.filter(t => t.module === 'PHONOLOGICAL').map(t => t.sequenceLength || 0))}
    Amplitud Máxima Visoespacial: ${Math.max(0, ...session.trials.filter(t => t.module === 'VISUOSPATIAL').map(t => t.sequenceLength || 0))}
    
    Genera una respuesta en ESPAÑOL con dos partes:
    1. Un mensaje corto, muy motivador y lleno de energía directamente para el niño/a (máximo 3 líneas). Usa un lenguaje que celebre su curiosidad y esfuerzo.
    2. Un informe estructurado para los padres que incluya fortalezas, áreas de mejora y 3 estrategias cognitivas prácticas y divertidas para hacer en casa.
    
    Usa un tono humano, cercano y profesional. Evita sonar como un robot. Incluye el descargo de responsabilidad obligatorio: "Esta aplicación proporciona una detección del rendimiento cognitivo y no sustituye una evaluación profesional."
    Devuelve estrictamente un JSON con las claves: "childFeedback" y "parentReport".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (error) {
    console.error("Fallo en análisis de Gemini:", error);
    return {
      childFeedback: "¡Hiciste un trabajo increíble con estos juegos mentales!",
      parentReport: "El análisis no está disponible temporalmente. Por favor, consulte las puntuaciones brutas."
    };
  }
};
