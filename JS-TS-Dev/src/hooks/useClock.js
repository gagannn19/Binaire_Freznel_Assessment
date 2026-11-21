import { useEffect, useState } from "react";

export function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer = setTimeout(function tick() {
      setNow(new Date());
      timer = setTimeout(tick, 1000 - (Date.now() % 1000));
    }, 1000 - (Date.now() % 1000));
    return () => clearTimeout(timer);
  }, []);
  return now;
}
