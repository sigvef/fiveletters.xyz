import { memo, useEffect, useRef } from "react";
import backspaceImage from "./assets/backspace.png";
import {
  backgroundColors,
  borderRadius,
  colors,
  containerMaxWidth,
} from "./colors";
import { Colorings } from "./game";
import { makeFakeTouchList } from "./utils";

export const Keyboard: React.FC<{
  colorings: Colorings;
  onKeyPress: (letter: string) => void;
}> = memo(({ colorings, onKeyPress }) => {
  const div = useRef<HTMLDivElement>();
  const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNMb"];
  const longestRow = rows.reduce((row, accumulator) =>
    row.length > accumulator.length ? row : accumulator
  );
  const totalWidth = Math.min(containerMaxWidth, window.innerWidth) - 32;
  const keyWidth =
    (totalWidth - (longestRow.length - 1) * 4) / longestRow.length;
  const keyHeight = 48;
  useEffect(() => {
    if (div.current) {
      const getCurrentKey = (
        touches: Pick<Touch, "clientX" | "clientY" | "identifier">[]
      ) => {
        if (div.current && touches.length > 0) {
          const rect = div.current.getBoundingClientRect();
          const x = touches[0].clientX - rect.left;
          const y = touches[0].clientY - rect.top;
          const j = ((y + 2) / (keyHeight + 4)) | 0;
          const i = Math.max(
            Math.min(
              ((-0.5 * (j * (keyWidth + 4)) + x - 16 + 2) / (keyWidth + 4)) | 0,
              rows[j].length - 1
            ),
            0
          );
          const letter = rows[j][i];
          return letter;
        }
        return null;
      };
      const setActive = (letter: string | null) => {
        if (div.current) {
          [...div.current.querySelectorAll(".key.active")].forEach((key) => {
            key.classList.remove("active");
          });
          if (letter) {
            div.current
              .querySelector(`.key[data-letter=${letter}]`)
              ?.classList.add("active");
          }
        }
      };
      const touchstart = (e: TouchEvent | MouseEvent) => {
        e.preventDefault();
        const letter = getCurrentKey(
          "touches" in e ? [...e.touches] : makeFakeTouchList(e)
        );
        setActive(colorings[letter || ""] === "wrong" ? null : letter);
      };
      const touchmove = (e: TouchEvent | MouseEvent) => {
        e.preventDefault();
        const letter = getCurrentKey(
          "touches" in e ? [...e.touches] : makeFakeTouchList(e)
        );
        setActive(colorings[letter || ""] === "wrong" ? null : letter);
      };
      const touchend = (e: TouchEvent | MouseEvent) => {
        e.preventDefault();
        setActive(null);
        const letter = getCurrentKey(
          "touches" in e ? [...e.changedTouches] : makeFakeTouchList(e)
        );
        if (letter && colorings[letter] !== "wrong") {
          onKeyPress(letter);
        }
      };
      const touchcancel = (e: TouchEvent) => {
        e.preventDefault();
        setActive(null);
      };
      const keydown = (e: KeyboardEvent) => {
        let letter = e.key.toUpperCase();
        if (letter === "BACKSPACE") {
          letter = "b";
        }
        if ("QWERTYUIOPASDFGHJKLZXCVBNMb".indexOf(letter) === -1) {
          return;
        }
        if (colorings[letter] !== "wrong") {
          setActive(letter);
        }
      };
      const keyup = (e: KeyboardEvent) => {
        let letter = e.key.toUpperCase();
        if (letter === "BACKSPACE") {
          letter = "b";
        }
        if ("QWERTYUIOPASDFGHJKLZXCVBNMb".indexOf(letter) === -1) {
          return;
        }
        setActive(null);
        if (letter && colorings[letter] !== "wrong") {
          onKeyPress(letter);
        }
      };
      document.addEventListener("keydown", keydown);
      document.addEventListener("keyup", keyup);
      div.current.addEventListener("mousedown", touchstart);
      div.current.addEventListener("mouseup", touchend);
      div.current.addEventListener("touchstart", touchstart);
      div.current.addEventListener("touchmove", touchmove);
      div.current.addEventListener("touchend", touchend);
      div.current.addEventListener("touchcancel", touchcancel);
      return () => {
        document.removeEventListener("keydown", keydown);
        document.removeEventListener("keyup", keyup);
        div.current?.removeEventListener("mousedown", touchstart);
        div.current?.removeEventListener("mouseup", touchend);
        div.current?.removeEventListener("touchstart", touchstart);
        div.current?.removeEventListener("touchmove", touchmove);
        div.current?.removeEventListener("touchend", touchend);
        div.current?.removeEventListener("touchcancel", touchcancel);
      };
    }
  }, [div.current, onKeyPress]);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        height: keyHeight * rows.length + 4 * (rows.length - 1),
      }}
      //@ts-expect-error
      ref={div}
    >
      {rows.map((row, j) =>
        [...row].map((letter, i) => (
          <div
            key={letter}
            className="key"
            data-letter={letter}
            data-coloring={colorings[letter]}
            style={{
              position: "absolute",
              left: (j * (keyWidth + 4)) / 2 + 16 + (keyWidth + 4) * i,
              top: (keyHeight + 4) * j,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              pointerEvents: "none",
              userSelect: "none",
              borderRadius,
              width: "b".indexOf(letter) !== -1 ? keyWidth * 2 + 2 : keyWidth,
              height: keyHeight,
              ...(letter !== "b"
                ? {
                    backgroundColor:
                      backgroundColors[colorings[letter] || "unknown"],
                  }
                : { backgroundColor: colors.dark, marginRight: -keyWidth - 2 }),
            }}
          >
            {letter === "b" ? (
              <img
                src={backspaceImage}
                style={{
                  width: 32,
                  height: 32,
                }}
              />
            ) : (
              <span style={{ fontSize: 22, color: colors.black }}>
                {letter}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
});