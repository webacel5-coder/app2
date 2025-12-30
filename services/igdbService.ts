
const CLIENT_ID = '8ixdopirte0ogpdh4rkf3qgkib0dmb';
const CLIENT_SECRET = 'n6bb4v8pa5mhv6itpsvbkwcy8hmit7';

const PROXY = "https://corsproxy.io/?";
const IGDB_API_URL = "https://api.igdb.com/v4";
const TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2/token";

let accessToken: string | null = null;

async function getAccessToken(): Promise<string> {
  if (accessToken) return accessToken;
  
  try {
    const authParams = new URLSearchParams({ 
      client_id: CLIENT_ID, 
      client_secret: CLIENT_SECRET, 
      grant_type: 'client_credentials' 
    });

    const response = await fetch(`${PROXY}${encodeURIComponent(TWITCH_AUTH_URL)}`, { 
      method: 'POST',
      body: authParams
    });

    const data = await response.json();
    accessToken = data.access_token;
    return accessToken!;
  } catch (e) {
    console.warn("IGDB Auth failed, will try search without covers");
    throw e;
  }
}

export async function getCoverByGameName(gameName: string): Promise<string | undefined> {
  try {
    const token = await getAccessToken();
    const cleanName = gameName.replace(/[^\w\s]/gi, '').trim();
    
    const response = await fetch(`${PROXY}${encodeURIComponent(`${IGDB_API_URL}/games`)}`, {
      method: 'POST',
      headers: { 
        'Client-ID': CLIENT_ID, 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      },
      body: `fields cover.url; search "${cleanName}"; limit 1;`
    });

    const data = await response.json();
    if (data && data[0]?.cover?.url) {
      return `https:${data[0].cover.url.replace('t_thumb', 't_cover_big')}`;
    }
  } catch (error) {
    console.warn("Could not fetch cover for", gameName);
  }
  return undefined;
}
