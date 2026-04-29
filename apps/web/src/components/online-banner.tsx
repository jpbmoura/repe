import { useOnlineStatus } from '@/hooks/use-online-status';
import { useIsMutating } from '@tanstack/react-query';
import { CloudOff, Loader2 } from 'lucide-react';

export function OnlineBanner() {
  const online = useOnlineStatus();
  const mutating = useIsMutating();

  if (online && mutating === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3">
      <div
        role="status"
        className={
          'pointer-events-auto inline-flex items-center gap-2 rounded-pill border px-3 py-1.5 text-xs font-medium shadow-lg transition ' +
          (online
            ? 'bg-bg-elevated border-border text-text-secondary'
            : 'bg-warn/15 border-warn/30 text-warn')
        }
      >
        {online ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Salvando…
          </>
        ) : (
          <>
            <CloudOff size={14} />
            Sem conexão · suas alterações ficam salvas e enviam quando voltar
          </>
        )}
      </div>
    </div>
  );
}
