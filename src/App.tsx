import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { allWords } from "./allwords";
import { generateGameId, getAllColorings, HelperState } from "./game";
import { words } from "./words";
import { colors, containerMaxWidth } from "./colors";
import { Button } from "./Button";
import {
  capitalizeFirst,
  isSuperTinyMobileScreen,
  startAnimation,
} from "./utils";
import { Keyboard } from "./Keyboard";
import { verifyLicense } from "./api";
import { PaymentModal } from "./PaymentModal";
import { MemoizedRocketIcon } from "./icons";
import { Line } from "./Line";
import { storeAttempt } from "./db";
import { Stats } from "./Stats";
import { Modal } from "./Modal";

const allOutlineArray = [...new Array(5)].map(() => "outline" as const);

const allWordsSet = new Set(allWords);

let hasBootstrappedGumroad = false;

const maxAttempts = 5;

export default function App() {
  const [, _setForceRefresh] = useState({});
  const forceRefresh = () => {
    _setForceRefresh({});
  };
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
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [isFirstGame, setIsFirstGame] = useState(true);

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

  const letterGutter = isSuperTinyMobileScreen(containerSize.height) ? 4 : 8;
  const letterBoxSize = Math.min(
    64,
    (containerSize.width - 32 - (answer.length - 1) * letterGutter) /
      answer.length
  );

  useEffect(() => {
    const key = localStorage.getItem("fiveletters.xyz:license_key");
    if (key) {
      verifyLicense(key).then(setIsPremium);
    } else {
      setIsPremium(false);
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

  const gameId = useRef("");
  if (!gameId.current) {
    gameId.current = generateGameId();
  }

  const [showOrangeHelper, setShowOrangeHelper] =
    useState<HelperState>("not-shown-yet");
  const [showGreenHelper, setShowGreenHelper] =
    useState<HelperState>("not-shown-yet");
  const [hasNotMadeAnyAttemptYet, setHasNotMadeAnyAttemptYet] = useState(true);

  const [attempts, setAttempts] = useState<string[]>([]);
  const [hints, setHints] = useState<number[]>([]);
  const inputValueRef = useRef("");

  const makeAttempt = useCallback(
    (attempt: string, answer: string, attempts: string[]) => {
      const isValidAttempt = allWordsSet.has(attempt.toUpperCase());
      storeAttempt({
        attempt,
        answer,
        step: attempts.length + 1,
        is_valid_attempt: isValidAttempt,
        game_id: gameId.current,
      });
      if (isValidAttempt) {
        if (attempts.length === 1) {
          setHasNotMadeAnyAttemptYet(false);
        }

        const colorings = getAllColorings(
          answer,
          [...attempts, attempt],
          hints
        );
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
        inputValueRef.current = "";
        setAttempts((old) => [...old, attempt]);
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
    },
    []
  );

  const playAgainButton = (
    <Button
      onClick={() => {
        setGameState("play");
        setIsFirstGame(false);
        gameId.current = generateGameId();
        setAttempts([]);
        setHints([]);
        const newAnswer = words[(Math.random() * words.length) | 0];
        setAnswer(newAnswer);
        for (let i = 0; i < answer.length; i++) {
          setTimeout(() => {
            inputValueRef.current = answer.slice(0, i + 1);
            forceRefresh();
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

  const colorings = useMemo(
    () => getAllColorings(answer, attempts, hints),
    [answer, attempts, hints]
  );
  const paymentModalOnDismiss = React.useCallback(
    () => setShowPremiumModal(false),
    []
  );
  const paymentModalOnSuccess = React.useCallback(() => setIsPremium(true), []);
  const keyboardOnKeyPress = React.useCallback(
    (letter: string) => {
      if (letter === "b") {
        inputValueRef.current = inputValueRef.current.slice(0, -1);
        forceRefresh();
      } else {
        inputValueRef.current = (inputValueRef.current + letter).slice(0, 5);
        forceRefresh();
        if (inputValueRef.current.length === 5) {
          makeAttempt(inputValueRef.current, answer, attempts);
        }
      }
    },
    [makeAttempt, answer, attempts]
  );
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
              marginTop: hasNotMadeAnyAttemptYet
                ? isSuperTinyMobileScreen(containerSize.height)
                  ? 16
                  : 32
                : -64,
              marginBottom: hasNotMadeAnyAttemptYet
                ? isSuperTinyMobileScreen(containerSize.height)
                  ? 32
                  : 64
                : 32 + (isSuperTinyMobileScreen(containerSize.height) ? 0 : 16),
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
              overflowY: "auto",
              overflowX: "hidden",
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
                  gutterSize={letterGutter}
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
                  word={inputValueRef.current.padEnd(5, " ")}
                  coloring={[...new Array(answer.length)].map(() => "unknown")}
                  letterHints={colorings.deduced}
                  letterBoxSize={letterBoxSize}
                  gutterSize={letterGutter}
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
                      coloring={allOutlineArray}
                      letterBoxSize={letterBoxSize}
                      gutterSize={letterGutter}
                    />
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: letterBoxSize * 5 + letterGutter * 4,
                margin: "0 auto",
              }}
            >
              {(showGreenHelper === "show-now" ||
                showOrangeHelper === "show-now") && (
                <div
                  style={{
                    marginTop: isSuperTinyMobileScreen(containerSize.height)
                      ? 8
                      : 16,
                    marginBottom: isSuperTinyMobileScreen(containerSize.height)
                      ? 8
                      : 16,
                  }}
                >
                  {showGreenHelper === "show-now" && (
                    <div
                      style={{
                        marginBottom: isSuperTinyMobileScreen(
                          containerSize.height
                        )
                          ? 8
                          : 16,
                        color: colors.green,
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
                        marginBottom: isSuperTinyMobileScreen(
                          containerSize.height
                        )
                          ? 8
                          : 16,
                        color: colors.yellow,
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

              {gameState === "play" &&
                isFirstGame &&
                remainingAttempts === maxAttempts && (
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
                    marginTop: isSuperTinyMobileScreen(containerSize.height)
                      ? 8
                      : 32,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      marginBottom: isSuperTinyMobileScreen(
                        containerSize.height
                      )
                        ? 8
                        : 32,
                      textAlign: "center",
                      color: colors.green,
                    }}
                  >
                    You win!
                  </div>
                  {playAgainButton}

                  <a
                    href="#"
                    style={{
                      color: colors.black,
                      marginTop: isSuperTinyMobileScreen(containerSize.height)
                        ? 16
                        : 32,
                    }}
                    onClick={(e) => {
                      if (!isPremium) {
                        setShowPremiumModal(true);
                      } else {
                        setShowStatsModal(true);
                      }
                    }}
                  >
                    View stats
                  </a>
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
                      marginBottom: isSuperTinyMobileScreen(
                        containerSize.height
                      )
                        ? 16
                        : 32,
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
                    opacity:
                      !isFirstGame ||
                      attempts.length > 1 ||
                      (isPremium && attempts.length > 0)
                        ? 1
                        : 0,
                    transform:
                      attempts.length > 0
                        ? "translateY(0px)"
                        : "translateY(8px)",
                    pointerEvents:
                      !isFirstGame ||
                      attempts.length > 1 ||
                      (isPremium && attempts.length > 0)
                        ? "all"
                        : "none",
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
                    opacity:
                      !isFirstGame ||
                      attempts.length > 1 ||
                      (isPremium && attempts.length > 0)
                        ? 1
                        : 0,
                    transform:
                      attempts.length > 0
                        ? "translateY(0px)"
                        : "translateY(16px)",
                    pointerEvents:
                      !isFirstGame ||
                      attempts.length > 1 ||
                      (isPremium && attempts.length > 0)
                        ? "all"
                        : "none",
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
                      <MemoizedRocketIcon size={24} />
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
                onKeyPress={keyboardOnKeyPress}
              />
            </div>
          )}
        </div>
      </div>

      <Modal visible={showStatsModal} dismiss={() => setShowStatsModal(false)}>
        <Stats visible={showStatsModal} />
      </Modal>

      <PaymentModal
        visible={showPremiumModal}
        dismiss={paymentModalOnDismiss}
        onSuccess={paymentModalOnSuccess}
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
