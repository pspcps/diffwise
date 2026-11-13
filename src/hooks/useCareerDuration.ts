import { useEffect, useState } from "react";
import { getCareerDuration } from "../utils/careerDuration";
export function useCareerDuration() {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      const now = new Date();
      setToday(now);
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 25);
      clearTimeout(timer);
      timer = setTimeout(refresh, midnight.getTime() - now.getTime());
    };
    const visible = () => {
      if (!document.hidden) refresh();
    };
    const now = new Date(),
      midnight = new Date(now);
    midnight.setHours(24, 0, 0, 25);
    timer = setTimeout(refresh, midnight.getTime() - now.getTime());
    document.addEventListener("visibilitychange", visible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  return getCareerDuration(today);
}
