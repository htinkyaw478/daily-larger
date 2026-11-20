import { useEffect, useRef, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type NavigatorWithInstall = Navigator & {
  install?: () => Promise<void>;
};

export function usePwaInstall() {
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const supportsWebInstall =
    typeof Navigator !== 'undefined' &&
    typeof (Navigator.prototype as unknown as { install?: unknown }).install === 'function';

  const [canInstall, setCanInstall] = useState<boolean>(supportsWebInstall);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      if (!supportsWebInstall) {
        setCanInstall(true);
      }
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [supportsWebInstall]);

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (isInstalling) return 'unavailable';
    setIsInstalling(true);
    try {
      if (supportsWebInstall) {
        await (navigator as NavigatorWithInstall).install?.();
        setCanInstall(false);
        return 'accepted';
      }

      const promptEvent = deferredPromptRef.current;
      if (!promptEvent) {
        setCanInstall(false);
        return 'unavailable';
      }
      // Clear single-use event before awaiting user choice
      deferredPromptRef.current = null;
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (!deferredPromptRef.current) {
        setCanInstall(false);
      }
      return outcome;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'dismissed';
      }
      throw error;
    } finally {
      setIsInstalling(false);
    }
  };

  return { canInstall, isInstalling, promptInstall };
}
