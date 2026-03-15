"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // On iOS, show manual instructions since beforeinstallprompt isn't supported
    const isIos =
      /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) &&
      !(window.navigator as Navigator & { standalone?: boolean }).standalone;
    if (isIos) {
      setVisible(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => setVisible(false);

  if (!visible) return null;

  const isIos =
    typeof window !== "undefined" &&
    /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="relative rounded-2xl border border-purple-500/30 bg-[#0d1020]/95 backdrop-blur-md shadow-2xl shadow-purple-900/40 p-4">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-purple-300/60 hover:text-purple-200 transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3 pr-5">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center">
            <span className="text-lg font-black text-purple-300">F7</span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">
              Install Flip7
            </p>
            {isIos && !deferredPrompt ? (
              <p className="text-xs text-purple-300/80 mt-0.5 leading-snug">
                Tap <strong>Share</strong> then{" "}
                <strong>Add to Home Screen</strong> to install.
              </p>
            ) : (
              <p className="text-xs text-purple-300/80 mt-0.5 leading-snug">
                Add to your home screen for the best experience.
              </p>
            )}
          </div>
        </div>

        {/* Install button — only shown when native prompt is available */}
        {deferredPrompt && (
          <button
            onClick={handleInstall}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 transition-colors py-2 text-sm font-semibold text-white"
          >
            <Download size={15} />
            Install App
          </button>
        )}
      </div>
    </div>
  );
}
