const YOUTUBE_REGEX =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;

export function extractYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(YOUTUBE_REGEX);
  return match?.[1] ?? null;
}

export function youtubeEmbedUrl(id: string, autoplay = false): string {
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
  });
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function youtubeThumbnail(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
