
import { GoogleGenAI, Type } from "@google/genai";

function cleanJsonResponse(text: string | undefined): string {
  if (!text) return "";
  let cleaned = text.trim();
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/^```json/gi, "").replace(/```$/gi, "").trim();
  
  // Isolate the JSON object if needed
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

export async function searchGamesWithGemini(query: string, lang: 'pt-BR' | 'en-US'): Promise<{ games: any[], isModernRequest: boolean }> {
  // Always use a named parameter for the API key as per @google/genai guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Você é o Retro Codex. O usuário busca por: "${query}".
    
    INSTRUÇÕES:
    1. Retorne uma lista de até 10 jogos clássicos relacionados.
    2. Considere consoles: NES, Master System, SNES, Mega Drive, PS1, N64, GameBoy, Arcade.
    3. Mesmo que a busca seja vaga, tente encontrar os melhores matches.
    4. Se o usuário pedir algo de 2010 pra frente de forma explícita, defina isModernRequest: true.
    5. RESPONDA APENAS COM O JSON.
  `;

  try {
    // Upgraded to gemini-3-pro-preview for complex reasoning tasks
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
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
        }
      }
    });

    const data = JSON.parse(cleanJsonResponse(response.text));
    return {
      games: data.games || [],
      isModernRequest: !!data.isModernRequest
    };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    // Fallback safely if something goes wrong
    return { games: [], isModernRequest: false };
  }
}

export async function fetchGameFullData(gameName: string, platform: string, lang: 'pt-BR' | 'en-US'): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isPt = lang === 'pt-BR';

  const prompt = `
    Guia completo para: "${gameName}" (${platform}).
    Retorne: summary (história), releaseDate (ano), cheats (códigos e truques) e tips (estratégias).
    Se não encontrar cheats, invente dicas úteis de gameplay.
  `;

  try {
    // Upgraded to gemini-3-pro-preview for high-quality structured content
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
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
