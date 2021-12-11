import React, { useEffect, useRef, useState } from "react";
import { allWords } from "./allwords";
import { Coloring, Colorings, getAllColorings } from "./game";
import { words } from "./words";
import backspaceImage from "./assets/backspace.png";

const containerMaxWidth = 560;

const allWordsSet = new Set(allWords);

const colors = {
  extraBlack: "#031514",
  black: "#0c2629",
  dark: "#265353",
  green: "#2a9d8f",
  yellow: "#e9c46a",
  lightYellow: "#b5ac97",
  light: "#6ea7a5",
  white: "white",
  red: "#e76f51",
};

const borderRadius = 8;

const makeFakeTouchList = (e: MouseEvent) => {
  return [
    {
      clientX: e.clientX,
      clientY: e.clientY,
      identifier: Math.random(),
    },
  ];
};

interface Animation {
  value: number;
  speed: number;
  friction: number;
  springiness: number;
  properties: {
    [key: string]: (value: number) => string;
  };
  element: HTMLElement;
}

const animations: { [key: string]: Animation } = {};

let previousTime = performance.now();
let isRunning = false;
let animationTimeAccumulator = 0;
const animationLoop = (time: number) => {
  animationTimeAccumulator += time - previousTime;
  const frameLength = 1000 / 60;
  let count = 0;
  while (animationTimeAccumulator >= frameLength) {
    animationTimeAccumulator -= frameLength;
    count = 0;
    const epsilon = 0.001;
    let loopBuster = 0;
    for (const key in animations) {
      count++;
      const animation = animations[key];
      loopBuster++;
      if (loopBuster > 1000) {
        debugger;
      }
      const originalValue = animation.value;
      animation.value = animation.value + animation.speed;
      animation.speed =
        animation.springiness * animation.speed +
        (1 - animation.springiness) * -animation.value;
      animation.speed *= animation.friction;
      if (
        Math.abs(originalValue - animation.value) < epsilon &&
        Math.abs(animation.value) < epsilon
      ) {
        animation.value = 0;
        delete animations[key];
      }
      for (const [property, getValue] of Object.entries(animation.properties)) {
        //@ts-expect-error dynamic style setting
        animation.element.style[property] = getValue(animation.value);
      }
    }
  }

  if (count > 0) {
    requestAnimationFrame(animationLoop);
  } else {
    isRunning = false;
  }
  previousTime = time;
};

const startAnimation = (key: string, animation: Animation) => {
  animations[key] = animation;
  isRunning = true;
  previousTime = performance.now();
  animationTimeAccumulator = 1000 / 60;
  requestAnimationFrame(animationLoop);
};

const T: React.FC<{ style?: any }> = ({ style, children }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        fontSize: 22,
        lineHeight: "1.25",
        color: colors.extraBlack,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

interface ContainerSize {
  width: number;
  height: number;
}

const Line: React.FC<{
  word: string;
  coloring: Coloring[];
  letterHints?: string[];
  letterBoxSize: number;
}> = React.forwardRef((props, ref) => {
  const { word, coloring, letterHints, letterBoxSize } = props;
  const size = letterBoxSize;
  return (
    <div
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
});

const Keyboard: React.FC<{
  colorings: Colorings;
  onKeyPress: (letter: string) => void;
}> = ({ colorings, onKeyPress }) => {
  const div = useRef<HTMLDivElement>();
  const currentTouch = useRef<any>();
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
                : { backgroundColor: colors.dark, marginRight: -34 }),
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
};

const maxAttempts = 5;

const backgroundColors = {
  unknown: "#f5f5f522",
  "semi-correct": colors.yellow,
  correct: colors.green,
  wrong: colors.black,
};

const foregroundColors = {
  unknown: colors.extraBlack,
  "semi-correct": colors.extraBlack,
  correct: colors.extraBlack,
  wrong: colors.dark,
};

const springAnimation = (() => {
  const inputRange = [];
  const outputRange = [];
  const n = 64;
  let dx = 1;
  let x = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    inputRange[i] = t;
    outputRange[i] = x;
    x += dx;
    dx = 0.9 * dx + 0.1 * -x;
    dx *= 0.98;
  }
  inputRange.push(1);
  outputRange.push(0);
  return { inputRange, outputRange };
})();

type HelperState = "not-shown-yet" | "show-now" | "never-show-again";

export default function App() {
  const [containerSize, setContainerSize] = useState({
    width: Math.min(containerMaxWidth, window.innerWidth),
    height: window.innerHeight,
  });
  const [gameState, setGameState] = useState<"play" | "win" | "lose">("play");
  const [isFirstPlaythrough, setIsFirstPlaythrough] = useState(true);
  const inputLineRef = useRef<HTMLDivElement | null>();
  const [answer, setAnswer] = useState(() => {
    return words[(Math.random() * words.length) | 0];
  });

  const letterBoxSize = Math.min(
    64,
    (containerSize.width - 32 - (answer.length - 1) * 8) / answer.length
  );

  useEffect(() => {
    const handler = () => {
      setContainerSize({
        width: Math.min(containerMaxWidth, window.innerWidth),
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const [showOrangeHelper, setShowOrangeHelper] =
    useState<HelperState>("not-shown-yet");
  const [showGreenHelper, setShowGreenHelper] =
    useState<HelperState>("not-shown-yet");
  const [hasNotMadeAnyAttemptYet, setHasNotMadeAnyAttemptYet] = useState(true);

  const [attempts, setAttempts] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const makeAttempt = (attempt: string) => {
    if (allWordsSet.has(attempt.toUpperCase())) {
      if (attempts.length === 2) {
        setHasNotMadeAnyAttemptYet(false);
      }

      const colorings = getAllColorings(answer, [...attempts, attempt]);
      const latest =
        colorings.attemptColorings[colorings.attemptColorings.length - 1];

      setShowGreenHelper((old) => {
        if (old === "never-show-again") {
          return old;
        }
        if (old === "show-now") {
          return "never-show-again";
        }
        if (latest.indexOf("correct") !== -1) {
          return "show-now";
        }
        return old;
      });
      setShowOrangeHelper((old) => {
        if (old === "never-show-again") {
          return old;
        }
        if (old === "show-now") {
          return "never-show-again";
        }
        if (latest.indexOf("semi-correct") !== -1) {
          return "show-now";
        }
        return old;
      });
      setAttempts((old) => [...old, attempt]);
      setInputValue("");
      if (attempt === answer) {
        setGameState("win");
      } else if (attempts.length + 1 === maxAttempts) {
        setGameState("lose");
      }
    } else {
      if (inputLineRef.current) {
        startAnimation("inputline-shake", {
          value: 0,
          speed: 3,
          springiness: 0.9,
          friction: 0.92,
          properties: {
            transform: (value) => `translateX(${value}px)`,
          },
          element: inputLineRef.current,
        });
      }
    }
  };

  const playAgainButton = (
    <div
      onClick={() => {
        setGameState("play");
        setAttempts([]);
        setAnswer(words[(Math.random() * words.length) | 0]);
        setIsFirstPlaythrough(false);
        for (let i = 0; i < answer.length; i++) {
          setTimeout(() => {
            setAttempts([answer.slice(0, i + 1).padEnd(5, " ")]);
          }, 100 + i * 50);
        }
      }}
      style={{
        borderRadius: 999,
        alignSelf: "center",
        justifyContent: "center",
        alignItems: "center",
        display: "flex",
      }}
    >
      <div
        style={{
          paddingLeft: 32,
          paddingRight: 32,
          paddingTop: 16,
          paddingBottom: 16,
          borderRadius: 999,
          backgroundColor: colors.green,
          alignSelf: "center",
          display: "flex",
        }}
      >
        <T>Play again</T>
      </div>
    </div>
  );

  const remainingAttempts = maxAttempts - attempts.length;

  const colorings = getAllColorings(answer, attempts);

  return (
    <div
      style={{
        backgroundColor: colors.black,
        flex: 1,
        height: "100vh",
        maxHeight: "-webkit-fill-available",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={styles.container}>
          <div
            className="animate-all"
            style={{
              textAlign: "center",
              opacity: hasNotMadeAnyAttemptYet ? 1 : 0,
              height: 32,
              marginTop: hasNotMadeAnyAttemptYet ? 32 : -64,
              marginBottom: hasNotMadeAnyAttemptYet ? 32 : 32,
              fontSize: 32,
              fontWeight: "bold",
              color: colors.extraBlack,
            }}
          >
            Five Letters
          </div>

          <div
            style={{
              flex: 1,
              marginLeft: -16,
              marginRight: -16,
              marginBottom: 16,
            }}
          >
            {attempts.map((attempt, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <Line
                  word={attempt}
                  coloring={colorings.attemptColorings[i]}
                  letterBoxSize={letterBoxSize}
                />
              </div>
            ))}

            {gameState === "play" && (
              <div
                style={{
                  marginBottom: 16,
                  /*
                  transform: [
                    {
                      translateX: Animated.multiply(
                        2,
                        shakeValue.interpolate({
                          inputRange: springAnimation.inputRange,
                          outputRange: springAnimation.outputRange,
                        })
                      ),
                    },
                  ],
                   */
                }}
              >
                <Line
                  ref={inputLineRef}
                  word={inputValue.padEnd(5, " ")}
                  coloring={[...new Array(answer.length)].map(() => "unknown")}
                  letterHints={colorings.deduced}
                  letterBoxSize={letterBoxSize}
                />
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: letterBoxSize * 5 + 8 * 4,
                margin: "0 auto",
              }}
            >
              {(showGreenHelper === "show-now" ||
                showOrangeHelper === "show-now") && (
                <div style={{ marginTop: 16, marginBottom: 16 }}>
                  {showGreenHelper === "show-now" && (
                    <T style={{ marginBottom: 16, color: colors.light }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          marginRight: 8,
                          borderRadius: 4,
                          backgroundColor: colors.green,
                        }}
                      />{" "}
                      correct letter, right place
                    </T>
                  )}
                  {showOrangeHelper === "show-now" && (
                    <T style={{ marginBottom: 16, color: colors.lightYellow }}>
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          marginRight: 8,
                          borderRadius: 4,
                          backgroundColor: colors.yellow,
                        }}
                      />{" "}
                      correct letter, wrong place
                    </T>
                  )}
                </div>
              )}

              {gameState === "play" && remainingAttempts === maxAttempts && (
                <T
                  style={{
                    marginTop: 32,
                    marginBottom: 16,
                    justifyContent: "center",
                  }}
                >
                  Guess the word!
                </T>
              )}

              <div style={{ flex: 1 }} />

              {gameState === "play" && isFirstPlaythrough && (
                <T style={{ marginBottom: 16 }}>
                  {remainingAttempts === maxAttempts
                    ? ""
                    : `${remainingAttempts} attempt${
                        remainingAttempts === 1 ? "" : "s"
                      } remaining.`}
                </T>
              )}

              {gameState === "win" && (
                <div
                  style={{
                    marginTop: 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                  }}
                >
                  <T
                    style={{
                      marginBottom: 32,
                      textAlign: "center",
                      color: colors.green,
                    }}
                  >
                    You win!
                  </T>
                  {playAgainButton}
                </div>
              )}

              {gameState === "lose" && (
                <div style={{ marginTop: 16 }}>
                  <T
                    style={{
                      marginBottom: 16,
                      textAlign: "center",
                      display: "block",
                    }}
                  >
                    Better luck next time!
                  </T>
                  <T
                    style={{
                      marginBottom: 32,
                      textAlign: "center",
                      display: "block",
                    }}
                  >
                    The solution was{" "}
                    <span style={{ marginLeft: 4, color: colors.yellow }}>
                      {answer}
                    </span>
                  </T>
                  {playAgainButton}
                </div>
              )}
            </div>
          </div>

          {gameState === "play" && (
            <div
              style={{
                marginLeft: -16,
                marginRight: -16,
              }}
            >
              <Keyboard
                colorings={colorings.keyboardColorings}
                onKeyPress={(letter) => {
                  if (letter === "b") {
                    setInputValue((old) => old.slice(0, -1));
                  } else {
                    setInputValue((old) => {
                      return old.length < 5 ? old + letter : old;
                    });
                    if (inputValue.length === 4) {
                      makeAttempt(inputValue + letter);
                    }
                    if (inputValue.length === 5) {
                      makeAttempt(inputValue);
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    flex: 1,
    padding: 16,
    width: "100%",
    maxWidth: containerMaxWidth,
    margin: "0 auto",
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: colors.dark,
    boxShadow: "0px 0px 32px " + colors.extraBlack + "88",
  },
};
