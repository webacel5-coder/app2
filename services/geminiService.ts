
import { GoogleGenAI, Type } from "@google/genai";

function cleanJsonResponse(text: string | undefined): string {
  if (!text) return "";
  let cleaned = text.trim();
  
  // Remove markdown code blocks if present
  cleaned = cleaned.replace(/^```json/gi, "").replace(/```$/gi, "").trim();
  
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1) {
    return cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
}

export async function searchGamesWithGemini(query: string, lang: 'pt-BR' | 'en-US'): Promise<{ games: any[], isModernRequest: boolean }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Você é o Retro Codex. O usuário busca por: "${query}".
    Encontre apenas jogos lançados originalmente até o ano 2002.

    REGRAS CRÍTICAS PARA CAPAS (coverUrl):
    1. Você DEVE encontrar a Box Art (capa) ORIGINAL da época do lançamento. 
    2. NÃO use capas de Remakes, Remasters ou coletâneas modernas.
    3. PROCEDIMENTO:
       - Use o Google Search para encontrar o jogo no IGDB ou MobyGames.
       - Tente extrair a URL de imagem que segue este padrão: https://images.igdb.com/igdb/image/upload/t_cover_big/[ID].jpg
       - Se não encontrar IGDB, use a capa oficial do MobyGames ou Steam (se for o jogo original).
    4. VALIDAÇÃO DE PLATAFORMA: Se o jogo é de SNES, a capa deve ter o logo da Nintendo/Super Nintendo. Se for de Mega Drive, o logo da Sega.
    5. Se a imagem for de um jogo diferente ou de uma versão moderna, deixe o coverUrl vazio "".

    RETORNO:
    JSON com lista de até 8 jogos. Seja extremamente preciso com "platform" e "name".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Upgrade para Pro para melhor raciocínio de imagem
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 4000 }, // Ativa raciocínio para validar se a imagem é correta
        tools: [{ googleSearch: {} }],
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
                  briefDescription: { type: Type.STRING },
                  coverUrl: { type: Type.STRING, description: "URL direta da Box Art ORIGINAL (.jpg/.png)" }
                },
                required: ["id", "name", "platform", "year", "briefDescription", "coverUrl"]
              }
            },
            isModernRequest: { type: Type.BOOLEAN }
          },
          required: ["games", "isModernRequest"]
        }
      }
    });

    const data = JSON.parse(cleanJsonResponse(response.text));
    
    const processedGames = (data.games || []).map((game: any) => {
      let url = game.coverUrl || "";
      if (url.startsWith("//")) url = "https:" + url;
      // Garante que se for IGDB, use o tamanho 'cover_big' para qualidade e compatibilidade
      if (url.includes('images.igdb.com') && !url.includes('t_cover_big')) {
         url = url.replace(/t_[a-zA-Z_]+/, 't_cover_big');
      }
      return { ...game, coverUrl: url };
    });

    return {
      games: processedGames,
      isModernRequest: !!data.isModernRequest
    };
  } catch (error) {
    console.error("Gemini Search Error:", error);
    return { games: [], isModernRequest: false };
  }
}

export async function fetchGameFullData(gameName: string, platform: string, lang: 'pt-BR' | 'en-US'): Promise<any> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const isPt = lang === 'pt-BR';

  const prompt = `
    Retorne detalhes técnicos e segredos para: "${gameName}" (${platform}).
    - summary: Sinopse histórica.
    - releaseDate: Ano.
    - cheats: Códigos originais de GameGenie, ProAction Replay ou botões.
    - tips: Dicas estratégicas.
    Idioma: ${isPt ? 'Português Brasileiro' : 'Inglês'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
