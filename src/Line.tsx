import { forwardRef, memo, useEffect, useRef } from "react";
import { backgroundColors, borderRadius, foregroundColors } from "./colors";
import { Coloring } from "./game";
import { startAnimation } from "./utils";

export const Line: React.FC<{
  word: string;
  coloring: Coloring[];
  letterHints?: string[];
  letterBoxSize: number;
  gutterSize: number;
}> = memo(
  forwardRef((props, ref) => {
    const { word, coloring, letterHints, letterBoxSize } = props;
    const size = letterBoxSize;

    const id = useRef(() => Math.random());
    const boxRef0 = useRef();
    const boxRef1 = useRef();
    const boxRef2 = useRef();
    const boxRef3 = useRef();
    const boxRef4 = useRef();
    const refs = [boxRef0, boxRef1, boxRef2, boxRef3, boxRef4];

    useEffect(() => {
      const index = [...word].findIndex((x) => x === " ") - 1;
      const ref = refs[index];
      if (ref?.current) {
        startAnimation(`${id.current}-${index}`, {
          value: 0,
          speed: 1,
          friction: 0.9,
          springiness: 0.8,
          properties: {
            transform: (value) => `scale(${1 - value * 0.035})`,
          },
          element: ref.current,
        });
      }
    }, [word]);

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
              //@ts-expect-error
              ref={refs[i]}
              style={{
                display: "flex",
                width: size,
                height: size,
                borderRadius,
                marginLeft: props.gutterSize / 2,
                marginRight: props.gutterSize / 2,
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
