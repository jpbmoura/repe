export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return (partes[0] ?? '?').slice(0, 2).toUpperCase();
  const primeira = partes[0]?.[0] ?? '';
  const ultima = partes[partes.length - 1]?.[0] ?? '';
  return (primeira + ultima).toUpperCase();
}

const PALETAS = [
  { bg: '#F2D8B6', text: '#5C3A14' },
  { bg: '#F8C8A8', text: '#7A2E0C' },
  { bg: '#F5B5C0', text: '#7A1A2C' },
  { bg: '#D8C8F0', text: '#3A2070' },
  { bg: '#B5D4E5', text: '#1A4060' },
  { bg: '#B0E0C8', text: '#0E4828' },
  { bg: '#E8D080', text: '#5C4A0A' },
  { bg: '#C8C8C8', text: '#2A2A2E' },
] as const;

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function corDoNome(nome: string): { bg: string; text: string } {
  const idx = hashString(nome) % PALETAS.length;
  return PALETAS[idx]!;
}
