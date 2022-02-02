import { useEffect, useRef } from "react";

export const TimerDisplay: React.FC<{
  startValue: Date | null;
  endValue: Date | null;
  showTenths: boolean;
}> = ({ startValue, endValue, showTenths }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      if (ref.current) {
        const now = endValue || new Date();
        const totalSecondTenths =
          startValue === null
            ? 0
            : Math.max(0, (((+now - +startValue) / 100) | 0) - 10);

        const totalSeconds = (totalSecondTenths / 10) | 0;
        const tenths = totalSecondTenths - totalSeconds * 10;
        const seconds = totalSeconds % 60;
        const minutes = (totalSeconds / 60) | 0;
        const display = `${minutes}m ${seconds.toString().padStart(2, "0")}${
          showTenths ? `.${tenths}` : ""
        }s`;

        ref.current.innerText = display;
      }
    }, 50);
    return () => {
      clearInterval(interval);
    };
  }, [startValue]);
  return <div ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}></div>;
};
