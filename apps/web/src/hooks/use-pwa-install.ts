import { useCallback, useEffect, useState } from 'react';

export type PwaPlatform = 'ios' | 'android' | 'desktop' | 'unknown';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const STORAGE_KEY = 'repe.pwa_state';
const REPROMPT_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

function detectPlatform(): PwaPlatform {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  const nav = navigator as { standalone?: boolean };
  return nav.standalone === true;
}

type StoredState =
  | { kind: 'installed' }
  | { kind: 'dismissed'; at: number }
  | { kind: 'none' };

function readStored(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { kind: 'none' };
    if (raw === 'installed') return { kind: 'installed' };
    if (raw.startsWith('dismissed:')) {
      const ts = Number(raw.split(':')[1]);
      if (!Number.isNaN(ts)) return { kind: 'dismissed', at: ts };
    }
  } catch {
    // ignore
  }
  return { kind: 'none' };
}

function writeStored(value: 'installed' | string | null) {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

export function usePwaInstall() {
  const [platform] = useState<PwaPlatform>(() => detectPlatform());
  const [standalone, setStandalone] = useState<boolean>(() => detectStandalone());
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [stored, setStored] = useState<StoredState>(() => readStored());

  useEffect(() => {
    if (standalone) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setStandalone(true);
      writeStored('installed');
      setStored({ kind: 'installed' });
      setEvent(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [standalone]);

  const promptInstall = useCallback(async () => {
    if (!event) return null;
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === 'accepted') {
      writeStored('installed');
      setStored({ kind: 'installed' });
      setStandalone(true);
    } else {
      writeStored(`dismissed:${Date.now()}`);
      setStored({ kind: 'dismissed', at: Date.now() });
    }
    setEvent(null);
    return choice.outcome;
  }, [event]);

  const dismiss = useCallback(() => {
    const at = Date.now();
    writeStored(`dismissed:${at}`);
    setStored({ kind: 'dismissed', at });
  }, []);

  // Decide se vamos sugerir auto-mostrar (banner inicial).
  // Botão manual em /perfil ignora isso e sempre mostra dialog.
  const autoSuggest = (() => {
    if (standalone) return false;
    if (stored.kind === 'installed') return false;
    if (
      stored.kind === 'dismissed' &&
      Date.now() - stored.at < REPROMPT_AFTER_MS
    ) {
      return false;
    }
    if (platform === 'ios') return true; // iOS sempre pode (sem evento)
    return event !== null; // Android/desktop: precisa do evento
  })();

  const installable = standalone
    ? false
    : platform === 'ios' || event !== null;

  return {
    platform,
    standalone,
    installable,
    autoSuggest,
    canPrompt: !!event,
    promptInstall,
    dismiss,
  };
}
