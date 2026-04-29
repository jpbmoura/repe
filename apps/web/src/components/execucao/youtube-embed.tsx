import { youtubeEmbedUrl, youtubeThumbnail } from '@repe/shared';
import { Play } from 'lucide-react';
import { useState } from 'react';

type Props = {
  youtubeId: string;
  className?: string;
};

export function YouTubeEmbed({ youtubeId, className = '' }: Props) {
  const [carregar, setCarregar] = useState(false);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-card ${className}`}
      style={{ aspectRatio: '16 / 9' }}
    >
      {carregar ? (
        <iframe
          src={youtubeEmbedUrl(youtubeId, true)}
          title="Vídeo demonstrativo"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setCarregar(true)}
          className="group absolute inset-0 flex items-center justify-center"
          aria-label="Carregar vídeo"
        >
          <img
            src={youtubeThumbnail(youtubeId)}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span className="absolute inset-0 bg-black/30 transition group-hover:bg-black/40" />
          <span className="bg-accent text-bg-base group-hover:bg-accent-hover relative flex h-14 w-14 items-center justify-center rounded-full transition">
            <Play size={22} fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );
}
