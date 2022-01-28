import { useEffect, useRef } from "react";

export const TimerDisplay: React.FC<{
  startValue: Date | null;
  endValue: Date | null;
}> = ({ startValue, endValue }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const interval = setInterval(() => {
      if (ref.current) {
        const now = endValue || new Date();
        const secondTenths =
          startValue === null
            ? 0
            : Math.max(0, (((+now - +startValue) / 100) | 0) - 10);

        let display = "" + secondTenths / 10;
        if (display.indexOf(".") === -1) {
          display += ".0";
        }

        ref.current.innerText = `${display}s`;
      }
    }, 50);
    return () => {
      clearInterval(interval);
    };
  }, [startValue]);
  return <div ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}></div>;
};
