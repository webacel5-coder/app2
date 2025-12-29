
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Limpa a resposta da IA para garantir que apenas o objeto JSON seja processado.
 */
function cleanJsonResponse(text: string | undefined): string {
  if (!text) return "";
  let cleaned = text.trim();
  
  // Remove blocos de código markdown se existirem
  cleaned = cleaned.replace(/^```json/gi, "").replace(/```$/gi, "").trim();
  
  // Localiza o objeto JSON se houver texto ao redor
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

/**
 * Busca jogos retro.
 */
export async function searchGamesWithGemini(query: string, lang: 'pt-BR' | 'en-US'): Promise<{ games: any[], isModernRequest: boolean }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isPt = lang === 'pt-BR';
  
  // Prompt mais flexível para evitar falsos negativos em jogos clássicos
  const prompt = isPt 
    ? `Você é o Retro Codex, um especialista em preservação de games.
       USUÁRIO BUSCA POR: "${query}".
       
       INSTRUÇÕES:
       1. Identifique jogos clássicos (consoles 8-bit, 16-bit, 32-bit, 64-bit e Arcade) relacionados à busca.
       2. Foque em lançamentos entre 1970 e 2002.
       3. Se a busca for por algo claramente moderno (ex: PS5, PS4, Xbox Series, jogos de 2010 em diante), defina isModernRequest como true.
       4. Caso contrário, liste os 10 melhores jogos que combinam com a busca.
       5. Retorne APENAS o JSON conforme o esquema.`
    : `You are Retro Codex, a game preservation expert.
       USER IS SEARCHING FOR: "${query}".
       
       INSTRUCTIONS:
       1. Identify classic games (8-bit, 16-bit, 32-bit, 64-bit consoles and Arcade) related to the search.
       2. Focus on releases between 1970 and 2002.
       3. If the search is clearly for something modern (e.g., PS5, PS4, Xbox Series, games from 2010 onwards), set isModernRequest to true.
       4. Otherwise, list the 10 best games that match the search.
       5. Return ONLY JSON according to the schema.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Usando Flash para velocidade máxima na busca
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
        },
        systemInstruction: "Atue como um banco de dados técnico de jogos retro. Seja preciso com anos e plataformas clássicas."
      }
    });

    const text = response.text;
    const data = JSON.parse(cleanJsonResponse(text));
    
    return {
      games: Array.isArray(data.games) ? data.games : [],
      isModernRequest: !!data.isModernRequest
    };
  } catch (error) {
    console.error("Erro na busca Gemini:", error);
    return { games: [], isModernRequest: false };
  }
}

/**
 * Busca detalhes profundos (dicas e cheats).
 */
export async function fetchGameFullData(gameName: string, platform: string, lang: 'pt-BR' | 'en-US'): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isPt = lang === 'pt-BR';

  const prompt = isPt 
    ? `DETALHAMENTO TÉCNICO: "${gameName}" para "${platform}".
       Gere um guia contendo:
       - Um resumo nostálgico e histórico curto (summary).
       - O ano exato de lançamento (releaseDate).
       - Uma lista organizada de CHEATS/CÓDIGOS como senhas, botões ou GameShark (cheats).
       - Dicas estratégicas para passar de fases ou chefes (tips).`
    : `TECHNICAL DETAILS: "${gameName}" for "${platform}".
       Generate a guide containing:
       - A short nostalgic and historical summary (summary).
       - The exact release year (releaseDate).
       - An organized list of CHEATS/CODES such as passwords, button sequences or GameShark (cheats).
       - Strategic tips for stages or bosses (tips).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Usando Pro para maior profundidade nos detalhes e cheats
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
    console.error("Erro nos detalhes Gemini:", error);
    return null;
  }
}
