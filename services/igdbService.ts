
import { GameSearchResult } from "../types";

const CLIENT_ID = '8ixdopirte0ogpdh4rkf3qgkib0dmb';
const CLIENT_SECRET = 'n6bb4v8pa5mhv6itpsvbkwcy8hmit7';

const PROXY = "https://corsproxy.io/?";
const IGDB_API_URL = "https://api.igdb.com/v4";
const TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2/token";

let accessToken: string | null = null;

async function getAccessToken(): Promise<string> {
  if (accessToken) return accessToken;
  
  const authParams = new URLSearchParams({ 
    client_id: CLIENT_ID, 
    client_secret: CLIENT_SECRET, 
    grant_type: 'client_credentials' 
  });

  // A Twitch recomenda enviar parâmetros no corpo ou URL para Client Credentials
  const url = `${PROXY}${TWITCH_AUTH_URL}`;
  
  try {
    const response = await fetch(url, { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: authParams.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Falha Auth Twitch:", errorText);
      throw new Error(`Auth fail: ${response.status}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    return accessToken!;
  } catch (error) {
    console.error("Erro Crítico de Autenticação IGDB:", error);
    throw error;
  }
}

async function igdbFetch(endpoint: string, query: string) {
  try {
    const token = await getAccessToken();
    const url = `${PROXY}${IGDB_API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Accept': 'application/json', 
        'Client-ID': CLIENT_ID, 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'text/plain' 
      },
      body: query
    });

    if (!response.ok) {
        if (response.status === 401) accessToken = null; // Token expirado
        throw new Error(`IGDB API Error: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("IGDB Fetch Error:", error);
    return [];
  }
}

/**
 * Busca a URL da capa de um jogo pelo nome.
 */
export async function getCoverByGameName(gameName: string): Promise<string | undefined> {
  // Limpa o nome do jogo para busca mais precisa (remove caracteres especiais)
  const cleanName = gameName.replace(/[^\w\s]/gi, '').trim();
  const escapedName = cleanName.replace(/"/g, '\\"');
  
  const igdbQuery = `
    fields cover.url; 
    search "${escapedName}";
    limit 1;
  `;

  try {
    const data = await igdbFetch("/games", igdbQuery);
    if (data && data.length > 0 && data[0].cover?.url) {
      return `https:${data[0].cover.url.replace('t_thumb', 't_cover_big')}`;
    }
  } catch (error) {
    console.warn(`Capa não encontrada para ${gameName}`);
  }
  return undefined;
}
