import { useEffect } from 'react';
import { sendPresenceHeartbeat } from '@/services/presenceApi';

const HEARTBEAT_INTERVAL_MS = 45_000;

function PresenceBootstrap() {
  useEffect(() => {
    const ping = () => {
      void sendPresenceHeartbeat().catch(() => undefined);
    };

    ping();
    const timer = window.setInterval(ping, HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);

  return null;
}

export {
  PresenceBootstrap,
}
