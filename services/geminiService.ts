
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Limpa a resposta da IA de forma extremamente robusta.
 * Remove blocos de markdown, textos explicativos e garante que apenas o JSON seja extraído.
 */
function cleanJsonResponse(text: string | undefined): string {
  if (!text) return "";
  
  let cleaned = text.trim();
  
  // Remove blocos de código markdown explicitamente
  cleaned = cleaned.replace(/```json/gi, "").replace(/```/gi, "").trim();
  
  // Localiza o primeiro '{' e o último '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

/**
 * Busca jogos retro com alta precisão.
 * Prioriza consoles 8/16-bits e lida com franquias famosas.
 */
export async function searchGamesWithGemini(query: string, lang: 'pt-BR' | 'en-US'): Promise<{ games: any[], isModernRequest: boolean }> {
  // Instanciação direta conforme diretrizes para garantir uso da chave correta
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isPt = lang === 'pt-BR';
  
  const prompt = isPt 
    ? `BUSCA DE JOGOS CLÁSSICOS: "${query}".
       
       Você é um banco de dados de consoles retro.
       FOCO: Master System, Mega Drive/Genesis, NES, SNES, GameBoy, PS1.
       
       REGRAS CRÍTICAS:
       1. Liste apenas jogos lançados até o ano 2000.
       2. Se o usuário digitar um nome genérico como "Sonic" ou "Mario", liste os títulos mais famosos dos consoles acima.
       3. Se a busca for estritamente moderna (ex: "PS5", "GTA 5", "Elden Ring"), marque isModernRequest como true.
       4. Retorne no máximo 10 resultados reais.
       5. A resposta DEVE ser um objeto JSON válido.`
    : `CLASSIC GAMES SEARCH: "${query}".
       
       You are a retro console database.
       FOCUS: Master System, Mega Drive/Genesis, NES, SNES, GameBoy, PS1.
       
       CRITICAL RULES:
       1. List only games released until the year 2000.
       2. If the user types a generic name like "Sonic" or "Mario", list the most famous titles from the consoles above.
       3. If the search is strictly modern (e.g., "PS5", "GTA 5", "Elden Ring"), set isModernRequest to true.
       4. Return maximum 10 real results.
       5. The response MUST be a valid JSON object.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 1000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            games: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.NUMBER },
                  name: { type: Type.STRING },
                  platform: { type: Type.STRING },
                  year: { type: Type.STRING },
                  briefDescription: { type: Type.STRING }
                },
                required: ["id", "name", "platform", "year", "briefDescription"]
              }
            },
            isModernRequest: { type: Type.BOOLEAN }
          },
          required: ["games", "isModernRequest"]
        },
        systemInstruction: "Você é o Retro Codex AI. Sua única função é retornar dados JSON sobre jogos de videogame lançados entre 1970 e 2000."
      }
    });

    const cleanedText = cleanJsonResponse(response.text);
    const data = JSON.parse(cleanedText);
    
    return {
      games: Array.isArray(data.games) ? data.games : [],
      isModernRequest: !!data.isModernRequest
    };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    // Retorno de fallback para evitar que o app trave
    return { games: [], isModernRequest: false };
  }
}

/**
 * Busca segredos e dicas detalhadas para um jogo específico.
 */
export async function fetchGameFullData(gameName: string, platform: string, lang: 'pt-BR' | 'en-US'): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isPt = lang === 'pt-BR';

  const prompt = isPt 
    ? `Gere um guia completo para "${gameName}" no "${platform}".
       Inclua:
       - Resumo histórico nostálgico.
       - Data de lançamento.
       - LISTA DE CÓDIGOS (Cheat codes, Passwords, GameShark).
       - DICAS E SEGREDOS.`
    : `Generate a full guide for "${gameName}" on "${platform}".
       Include:
       - Nostalgic historical summary.
       - Release date.
       - CODES LIST (Cheat codes, Passwords, GameShark).
       - TIPS AND SECRETS.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            releaseDate: { type: Type.STRING },
            cheats: { type: Type.STRING },
            tips: { type: Type.STRING }
          },
          required: ["summary", "releaseDate", "cheats", "tips"]
        }
      }
    });

    return JSON.parse(cleanJsonResponse(response.text));
  } catch (error) {
    console.error("Gemini Details Error:", error);
    return null;
  }
}
