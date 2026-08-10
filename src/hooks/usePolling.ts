import { useEffect, useRef } from "react";

export function usePolling(callback: () => void | Promise<void>, delay: number | null, deps: any[] = []) {
  const savedCallback = useRef(callback);

  // Recuerda la última versión del callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Configura el intervalo
  useEffect(() => {
    // No hacer polling si el delay es null
    if (delay === null) {
      return;
    }

    const tick = () => {
      savedCallback.current();
    };

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay, ...deps]); // Reinicia el intervalo si cambian las dependencias relevantes
}
