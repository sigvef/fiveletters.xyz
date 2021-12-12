import React, { useEffect, useRef, useState } from "react";
import { allWords } from "./allwords";
import { Coloring, getAllColorings, HelperState } from "./game";
import { words } from "./words";
import { RocketIcon } from "@primer/octicons-react";
import {
  backgroundColors,
  borderRadius,
  colors,
  containerMaxWidth,
  foregroundColors,
} from "./colors";
import { Button } from "./Button";
import { capitalizeFirst, startAnimation } from "./utils";
import { Keyboard } from "./Keyboard";
import { verifyLicense } from "./api";
import { PaymentModal } from "./PaymentModal";

const allWordsSet = new Set(allWords);

let hasBootstrappedGumroad = false;

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
});

const maxAttempts = 5;

export default function App() {
  const [isPremium, _setIsPremium] = useState(
    localStorage.getItem("fiveletters.xyz:cachedIsPremium") === "true"
  );
  const setIsPremium = (value: boolean) => {
    localStorage.setItem(
      "fiveletters.xyz:cachedIsPremium",
      JSON.stringify(value)
    );
    _setIsPremium(value);
  };
  const [showPremiumModal, _setShowPremiumModal] = useState(false);

  const setShowPremiumModal = (value: boolean) => {
    _setShowPremiumModal(value);
    if (value && !hasBootstrappedGumroad) {
      hasBootstrappedGumroad = true;
      const script = document.createElement("script");
      script.src = "https://gumroad.com/js/gumroad.js";
      script.async = true;
      document.body.appendChild(script);
      const loop = () => {
        try {
          //@ts-expect-error
          createGumroadOverlay();
        } catch (e) {
          setTimeout(loop, 50);
        }
      };
      loop();
    }
  };

  const [containerSize, setContainerSize] = useState({
    width: Math.min(containerMaxWidth, window.innerWidth),
    height: window.innerHeight,
  });
  const [gameState, setGameState] = useState<"play" | "win" | "lose">("play");
  const inputLineRef = useRef<HTMLDivElement | null>();
  const [answer, setAnswer] = useState(() => {
    return words[(Math.random() * words.length) | 0];
  });

  const letterBoxSize = Math.min(
    64,
    (containerSize.width - 32 - (answer.length - 1) * 8) / answer.length
  );

  useEffect(() => {
    const key = localStorage.getItem("fiveletters.xyz:license_key");
    if (key) {
      verifyLicense(key).then(setIsPremium);
    }

    const handler = () => {
      setContainerSize({
        width: Math.min(containerMaxWidth, window.innerWidth),
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("resize", handler);
    };
  }, []);

  const [showOrangeHelper, setShowOrangeHelper] =
    useState<HelperState>("not-shown-yet");
  const [showGreenHelper, setShowGreenHelper] =
    useState<HelperState>("not-shown-yet");
  const [hasNotMadeAnyAttemptYet, setHasNotMadeAnyAttemptYet] = useState(true);

  const [attempts, setAttempts] = useState<string[]>([]);
  const [hints, setHints] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState("");

  const makeAttempt = (attempt: string, answer: string, attempts: string[]) => {
    if (allWordsSet.has(attempt.toUpperCase())) {
      if (attempts.length === 2) {
        setHasNotMadeAnyAttemptYet(false);
      }

      const colorings = getAllColorings(answer, [...attempts, attempt], hints);
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
    <Button
      onClick={() => {
        setGameState("play");
        setAttempts([]);
        setHints([]);
        const newAnswer = words[(Math.random() * words.length) | 0];
        setAnswer(newAnswer);
        for (let i = 0; i < answer.length; i++) {
          setTimeout(() => {
            setInputValue(answer.slice(0, i + 1));
          }, 300 + i * 75);
        }
        setTimeout(() => {
          makeAttempt(answer, newAnswer, []);
        }, 300 + answer.length * 75);
      }}
      buttonColor={colors.green}
      textColor={colors.black}
      shadowColor={colors.black}
    >
      Play again
    </Button>
  );

  const remainingAttempts = maxAttempts - attempts.length;

  const colorings = getAllColorings(answer, attempts, hints);

  return (
    <div
      style={{
        backgroundColor: colors.black,
        flex: 1,
        height: "100vh",
        maxHeight: "-webkit-fill-available",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={styles.container}>
          <div
            className="animate-all"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              opacity: hasNotMadeAnyAttemptYet ? 1 : 1,
              height: 32,
              marginTop: hasNotMadeAnyAttemptYet ? 32 : -64,
              marginBottom: hasNotMadeAnyAttemptYet ? 64 : 32 + 16,
              fontSize: 32,
              fontWeight: "bold",
              color: colors.extraBlack,
            }}
          >
            <div>Five Letters</div>
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
                }}
              >
                <Line
                  //@ts-expect-error
                  ref={inputLineRef}
                  word={inputValue.padEnd(5, " ")}
                  coloring={[...new Array(answer.length)].map(() => "unknown")}
                  letterHints={colorings.deduced}
                  letterBoxSize={letterBoxSize}
                />
              </div>
            )}

            {gameState === "play" && !hasNotMadeAnyAttemptYet && (
              <div style={{ marginTop: -8, marginBottom: 8 }}>
                {[
                  ...new Array(Math.max(maxAttempts - attempts.length - 1, 0)),
                ].map((_, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <Line
                      word={"     "}
                      coloring={[...new Array(answer.length)].map(
                        () => "outline"
                      )}
                      letterBoxSize={letterBoxSize}
                    />
                  </div>
                ))}
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
                    <div
                      style={{
                        marginBottom: 16,
                        color: colors.light,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
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
                    </div>
                  )}
                  {showOrangeHelper === "show-now" && (
                    <div
                      style={{
                        marginBottom: 16,
                        color: colors.lightYellow,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
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
                    </div>
                  )}
                </div>
              )}

              {gameState === "play" && remainingAttempts === maxAttempts && (
                <div
                  style={{
                    marginTop: 32,
                    marginBottom: 16,
                    justifyContent: "center",
                  }}
                >
                  Guess the word.
                </div>
              )}

              <div style={{ flex: 1 }} />

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
                  <div
                    style={{
                      marginBottom: 32,
                      textAlign: "center",
                      color: colors.green,
                    }}
                  >
                    You win!
                  </div>
                  {playAgainButton}
                </div>
              )}

              {gameState === "lose" && (
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      marginBottom: 16,
                      textAlign: "center",
                      display: "block",
                    }}
                  >
                    Better luck next time!
                  </div>
                  <div
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
                  </div>
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
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <div
                  className="animate-all-fast"
                  style={{
                    marginBottom: 16,
                    marginLeft: 16,
                    color: colors.black,
                    alignSelf: "flex-end",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: attempts.length > 0 ? 1 : 0,
                    transform:
                      attempts.length > 0
                        ? "translateY(0px)"
                        : "translateY(8px)",
                    pointerEvents: attempts.length > 0 ? "all" : "none",
                  }}
                >
                  <a
                    href="#"
                    style={{ color: colors.black }}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isPremium) {
                        setShowPremiumModal(true);
                        return;
                      }
                      const hintableIndexes = colorings.deduced
                        .map((x, i) => (x ? -1 : i))
                        .filter((x) => x > -1);
                      const hintIndex =
                        hintableIndexes[
                          (Math.random() * hintableIndexes.length) | 0
                        ];
                      setHints((old) => [...old, hintIndex]);
                    }}
                  >
                    Hint
                  </a>
                </div>
                <div
                  className="animate-all-fast"
                  style={{
                    marginBottom: 16,
                    marginLeft: 16,
                    color: colors.black,
                    alignSelf: "flex-end",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: attempts.length > 0 ? 1 : 0,
                    transform:
                      attempts.length > 0
                        ? "translateY(0px)"
                        : "translateY(16px)",
                    pointerEvents: attempts.length > 0 ? "all" : "none",
                  }}
                >
                  <a
                    href="#"
                    style={{ color: colors.black }}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isPremium) {
                        setShowPremiumModal(true);
                        return;
                      }
                      const word = attempts[attempts.length - 1].toLowerCase();
                      fetch(
                        "https://api.dictionaryapi.dev/api/v2/entries/en/" +
                          word
                      )
                        .then((response) => response.json())
                        .then((data) =>
                          alert(
                            capitalizeFirst(
                              `${word}: ${
                                data[0]?.meanings[0]?.definitions[0]
                                  ?.definition || "unknown."
                              }`
                            )
                          )
                        );
                    }}
                  >
                    Define
                  </a>
                </div>
                <div style={{ flex: 1 }} />
                {isPremium && (
                  <div
                    style={{
                      marginBottom: 16,
                      marginRight: 16,
                      color: colors.light,
                      opacity: 0.5,
                      alignSelf: "flex-end",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    Premium
                    <div style={{ marginLeft: 8 }}>
                      <RocketIcon size={24} />
                    </div>
                  </div>
                )}
                {!isPremium && (
                  <div
                    style={{
                      marginBottom: 16,
                      marginRight: 16,
                      color: colors.black,
                      alignSelf: "flex-end",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <a
                      href="#"
                      style={{ color: colors.black }}
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPremiumModal(true);
                      }}
                    >
                      Get premium
                    </a>
                  </div>
                )}
              </div>
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
                      makeAttempt(inputValue + letter, answer, attempts);
                    }
                    if (inputValue.length === 5) {
                      makeAttempt(inputValue, answer, attempts);
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        visible={showPremiumModal}
        dismiss={() => setShowPremiumModal(false)}
        onSuccess={() => setIsPremium(true)}
      />
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    flex: 1,
    paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
    paddingLeft: "calc(env(safe-area-inset-left, 0px) + 16px)",
    paddingRight: "calc(env(safe-area-inset-right, 0px) + 16px)",
    paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
    width: "100%",
    maxWidth: containerMaxWidth,
    margin: "0 auto",
    alignSelf: "center",
    overflow: "hidden",
    backgroundColor: colors.dark,
    boxShadow: "0px 0px 32px " + colors.extraBlack + "88",
  },
};
