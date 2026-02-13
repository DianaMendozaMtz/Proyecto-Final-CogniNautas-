
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useState, useEffect, useRef } from 'react';
import { AssetsLoaded } from '../types';
import { GoogleGenAI } from "@google/genai";

/**
 * Custom hook to manage loading all game assets (images and audio).
 * It returns the loaded status and refs to the loaded assets.
 * Includes a generation step to create a custom main character and crowd using Gemini.
 */
export function useGameAssets() {
    const batImageRef = useRef(new Image());
    const batsmanImageRef = useRef(new Image());
    const dhBatsmanImageRef = useRef(new Image());
    const ballImageRef = useRef(new Image());
    const grassImageRef = useRef(new Image());
    const crowdImageRef = useRef(new Image());
    
    const [assetsLoaded, setAssetsLoaded] = useState<AssetsLoaded>({ 
        bat: false, batsman: false, dhBatsman: false, ball: false, grass: false, crowd: false, all: false 
    });

    const batHitSoundRef = useRef<HTMLAudioElement | null>(null);
    const wicketSoundRef = useRef<HTMLAudioElement | null>(null);

    const generateCrowd = async () => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [{
                        text: "16-bit arcade sprite of a cheering cricket crowd fan, head and shoulders, wearing a colorful jersey, pixel art, transparent background, retro video game aesthetic, sharp pixel edges."
                    }]
                }
            });
            const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (part?.inlineData) {
                crowdImageRef.current.src = `data:image/png;base64,${part.inlineData.data}`;
                return true;
            }
            throw new Error("No image data");
        } catch (error) {
            console.error("Failed to generate crowd:", error);
            crowdImageRef.current.src = 'https://storage.googleapis.com/gemini-95-icons/spbatsman.png'; // Very basic fallback
            return true;
        }
    };

    /**
     * Generates a new character sprite using Gemini to match the "woman with dark hair" request.
     */
    const generateMainCharacter = async () => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: {
                    parts: [{
                        text: "Full body 16-bit arcade sprite of a female cricket player with long dark hair, wearing a white cricket uniform and pads, in a batting stance, side profile, pixel art, transparent background, retro game aesthetic, sharp pixel edges."
                    }]
                }
            });

            // Iterate through parts to find the generated image
            const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (part?.inlineData) {
                const base64Data = part.inlineData.data;
                batsmanImageRef.current.src = `data:image/png;base64,${base64Data}`;
                return true;
            }
            throw new Error("No image data in response");
        } catch (error) {
            console.error("Failed to generate main character, falling back to default:", error);
            // Fallback to original asset if generation fails
            batsmanImageRef.current.src = 'https://storage.googleapis.com/gemini-95-icons/spbatsman.png';
            return true;
        }
    };

    useEffect(() => {
        // Preload sounds
        batHitSoundRef.current = new Audio('https://storage.googleapis.com/gemini-95-icons/bathit.mp3');
        batHitSoundRef.current.preload = 'auto';
        wicketSoundRef.current = new Audio('https://storage.googleapis.com/gemini-95-icons/wicket.m4a');
        wicketSoundRef.current.preload = 'auto';

        let loadedCount = 0;
        const totalToLoad = 6;
        
        const markLoaded = (type: 'bat' | 'batsman' | 'dhBatsman' | 'ball' | 'grass' | 'crowd', success: boolean) => {
            setAssetsLoaded(prev => {
                const newAssets = { ...prev, [type]: success };
                loadedCount++;
                if (loadedCount === totalToLoad) {
                    newAssets.all = newAssets.bat && newAssets.batsman && newAssets.dhBatsman && newAssets.ball && newAssets.grass && newAssets.crowd;
                }
                return newAssets;
            });
        };

        // Standard image load handlers
        batImageRef.current.onload = () => markLoaded('bat', true);
        dhBatsmanImageRef.current.onload = () => markLoaded('dhBatsman', true);
        ballImageRef.current.onload = () => markLoaded('ball', true);
        grassImageRef.current.onload = () => markLoaded('grass', true);
        batsmanImageRef.current.onload = () => markLoaded('batsman', true);
        crowdImageRef.current.onload = () => markLoaded('crowd', true);

        batImageRef.current.onerror = () => markLoaded('bat', false);
        dhBatsmanImageRef.current.onerror = () => markLoaded('dhBatsman', false);
        ballImageRef.current.onerror = () => markLoaded('ball', false);
        grassImageRef.current.onerror = () => markLoaded('grass', false);
        batsmanImageRef.current.onerror = () => markLoaded('batsman', false);
        crowdImageRef.current.onerror = () => markLoaded('crowd', false);

        // Initial static asset sources
        batImageRef.current.src = 'https://storage.googleapis.com/gemini-95-icons/cricketbat-flipped-s.png';
        dhBatsmanImageRef.current.src = 'https://storage.googleapis.com/gemini-95-icons/demisbatsman.png';
        ballImageRef.current.src = 'https://storage.googleapis.com/gemini-95-icons/cricketball.png';
        grassImageRef.current.src = 'https://storage.googleapis.com/gemini-95-icons/grass.jpg';

        // Trigger dynamic character generation
        generateMainCharacter();
        generateCrowd();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        assetsLoaded,
        batImageRef,
        batsmanImageRef,
        dhBatsmanImageRef,
        ballImageRef,
        grassImageRef,
        crowdImageRef,
        batHitSoundRef,
        wicketSoundRef
    };
}
