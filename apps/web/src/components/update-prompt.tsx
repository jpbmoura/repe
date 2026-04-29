import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 mx-auto flex max-w-md justify-center px-3">
      <div className="bg-bg-elevated border-border flex w-full items-center gap-3 rounded-card border p-3 shadow-lg">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Nova versão disponível</p>
          <p className="text-text-secondary text-xs">
            Atualize para receber as últimas melhorias.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="text-text-secondary text-sm"
        >
          Depois
        </button>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="bg-accent text-bg-base hover:bg-accent-hover rounded-pill px-3 py-1.5 text-sm font-medium"
        >
          Atualizar
        </button>
      </div>
    </div>
  );
}
