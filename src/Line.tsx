import { forwardRef, memo } from "react";
import { backgroundColors, borderRadius, foregroundColors } from "./colors";
import { Coloring } from "./game";

export const Line: React.FC<{
  word: string;
  coloring: Coloring[];
  letterHints?: string[];
  letterBoxSize: number;
}> = memo(
  forwardRef((props, ref) => {
    const { word, coloring, letterHints, letterBoxSize } = props;
    const size = letterBoxSize;
    return (
      <div
        //@ts-expect-error
        ref={ref}
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {[...word].map((letter, i) => {
          return (
            <div
              key={i}
              style={{
                display: "flex",
                width: size,
                height: size,
                borderRadius,
                marginLeft: 4,
                marginRight: 4,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: backgroundColors[coloring[i]],
                position: "relative",
                border:
                  coloring[i] === "outline"
                    ? "2px dotted " + backgroundColors.unknown
                    : 0,
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 6,
                  top: 4,
                  fontSize: 14,
                }}
              >
                {letterHints?.[i]?.toUpperCase()}
              </span>
              <span
                style={{
                  fontSize: 32,
                  color: foregroundColors[coloring[i]],
                }}
              >
                {letter.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>
    );
  })
);
