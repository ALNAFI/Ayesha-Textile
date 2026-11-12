"use client";

import { useEffect, useState } from "react";

export function PwaClient() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    function sync() {
      setOffline(!navigator.onLine);
    }
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installation can fail in private modes; the app still works online.
      });
    }

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <p
      role="status"
      className="border-b border-border bg-surface px-4 py-2 text-center text-sm text-muted"
    >
      You are offline. Balances and files stay hidden until the connection
      returns.
    </p>
  );
}
