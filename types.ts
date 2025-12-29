
export interface GameSearchResult {
  id: number;
  name: string;
  platform: string;
  year?: string;
  briefDescription: string;
  coverUrl?: string;
  timestamp?: number;
}

export interface GameInfo extends GameSearchResult {
  summary: string;
  releaseDate?: string;
  cheats: string;
  tips: string;
}
