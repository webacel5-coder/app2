
/**
 * Serviço para lidar com status PRO do usuário
 */

export function setProUserStatus(status: boolean) {
  localStorage.setItem('retro-codex-pro', status ? 'true' : 'false');
}

export function isProUser(): boolean {
  return localStorage.getItem('retro-codex-pro') === 'true';
}
