import { useEffect, useState } from "react";

export function useSystemSnapshot(monitor) {
  const [snap, setSnap] = useState(() => monitor.snapshot());
  useEffect(() => {
    const onUpdate = (s) => setSnap(s);
    monitor.on("update", onUpdate);
    monitor.start();
    return () => {
      monitor.off("update", onUpdate);
      monitor.stop();
    };
  }, [monitor]);
  return snap;
}
