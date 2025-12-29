
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
  const url = `${PROXY}${TWITCH_AUTH_URL}?${authParams.toString()}`;
  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) throw new Error('Erro na autenticação.');
  const data = await response.json();
  accessToken = data.access_token;
  return accessToken!;
}

async function igdbFetch(endpoint: string, query: string) {
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
  if (!response.ok) throw new Error(`Erro IGDB: ${response.status}`);
  return response.json();
}

/**
 * Busca a URL da capa de um jogo pelo nome exato ou aproximado.
 * @param gameName Nome do jogo retornado pelo Gemini
 */
export async function getCoverByGameName(gameName: string): Promise<string | undefined> {
  const escapedName = gameName.replace(/"/g, '\\"');
  // Busca por nome ou nomes alternativos para maior precisão
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
    console.error(`Erro ao buscar capa para ${gameName}:`, error);
  }
  return undefined;
}
