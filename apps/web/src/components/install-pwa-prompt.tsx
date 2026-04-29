import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/dialog';
import { usePwaInstall, type PwaPlatform } from '@/hooks/use-pwa-install';
import { CloudOff, Download, Plus, Share, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

type Props = {
  /** Quando `true`, ignora a heurística de auto-suggest e abre direto. */
  manualOpen?: boolean;
  onManualClose?: () => void;
};

const AUTO_OPEN_DELAY_MS = 3000;

export function InstallPwaPrompt({ manualOpen, onManualClose }: Props) {
  const {
    platform,
    standalone,
    installable,
    autoSuggest,
    canPrompt,
    promptInstall,
    dismiss,
  } = usePwaInstall();
  const [autoOpen, setAutoOpen] = useState(false);

  useEffect(() => {
    if (!autoSuggest) return;
    const t = setTimeout(() => setAutoOpen(true), AUTO_OPEN_DELAY_MS);
    return () => clearTimeout(t);
  }, [autoSuggest]);

  const isOpen = manualOpen || autoOpen;

  const handleClose = () => {
    if (manualOpen) {
      onManualClose?.();
    } else {
      setAutoOpen(false);
      dismiss();
    }
  };

  const handleInstall = async () => {
    if (canPrompt) {
      await promptInstall();
    }
    if (manualOpen) {
      onManualClose?.();
    } else {
      setAutoOpen(false);
    }
  };

  if (standalone) return null;
  if (!isOpen) return null;
  if (!installable && platform !== 'ios') return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent>
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <div className="bg-accent/15 text-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-card">
              <Download size={22} />
            </div>
            <div className="min-w-0">
              <DialogTitle>Instalar Repê</DialogTitle>
              <DialogDescription className="mt-1">
                {platform === 'ios'
                  ? 'Adicione à tela de início pra abrir como app.'
                  : 'Instale como app pra abrir mais rápido.'}
              </DialogDescription>
            </div>
          </div>

          <BenefitsList />

          {platform === 'ios' ? <IosInstructions /> : null}

          <div className="space-y-2">
            {platform !== 'ios' && canPrompt && (
              <button
                type="button"
                onClick={handleInstall}
                className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed active:scale-[0.98] inline-flex w-full items-center justify-center gap-2 rounded-pill px-4 py-3 text-sm font-semibold transition"
              >
                <Download size={16} strokeWidth={2.5} />
                Instalar agora
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="bg-bg-subtle border-border text-text-secondary hover:text-text-primary w-full rounded-pill border py-3 text-sm font-medium"
            >
              {platform === 'ios' ? 'Entendi' : 'Mais tarde'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BenefitsList() {
  return (
    <ul className="space-y-2.5">
      <Benefit
        icon={<Zap size={14} className="text-accent" />}
        text="Abre direto, sem barra do navegador."
      />
      <Benefit
        icon={<CloudOff size={14} className="text-accent" />}
        text="Funciona offline durante o treino."
      />
    </ul>
  );
}

function Benefit({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className="bg-bg-subtle flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
        {icon}
      </span>
      <span className="text-sm">{text}</span>
    </li>
  );
}

function IosInstructions() {
  return (
    <div className="bg-bg-subtle border-border rounded-card border p-3">
      <p className="text-text-secondary mb-3 text-xs font-semibold uppercase tracking-wide">
        Como instalar
      </p>
      <ol className="space-y-2.5">
        <Step n={1}>
          <span>Toque em </span>
          <span className="bg-bg-elevated border-border inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs">
            <Share size={11} />
            Compartilhar
          </span>
          <span> na barra do Safari.</span>
        </Step>
        <Step n={2}>
          <span>Role e escolha </span>
          <span className="bg-bg-elevated border-border inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs">
            <Plus size={11} />
            Adicionar à Tela de Início
          </span>
          .
        </Step>
        <Step n={3}>Confirme e abra pelo ícone que aparecer no celular.</Step>
      </ol>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="bg-accent text-bg-base font-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
        {n}
      </span>
      <span className="text-sm leading-snug">{children}</span>
    </li>
  );
}

export function platformLabel(p: PwaPlatform): string {
  if (p === 'ios') return 'iOS';
  if (p === 'android') return 'Android';
  return 'Desktop';
}
