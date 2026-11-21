import { useCallback, useEffect, useRef, useState } from "react";

export function useFlash(ms = 3000) {
  const [flash, setFlash] = useState(null);
  const timer = useRef(null);
  const show = useCallback(
    (value) => {
      clearTimeout(timer.current);
      setFlash(value);
      timer.current = setTimeout(() => setFlash(null), ms);
    },
    [ms],
  );
  useEffect(() => () => clearTimeout(timer.current), []);
  return [flash, show];
}
