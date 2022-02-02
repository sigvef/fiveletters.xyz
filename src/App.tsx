import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { allWords3 } from "./allwords3";
import { allWords4 } from "./allwords4";
import { allWords5 } from "./allwords5";
import { allWords6 } from "./allwords6";
import { allWordNorwegian5 } from "./norwegian5";
import { wordsNorwegian5 } from "./shortnorwegian5";
import { generateGameId, getAllColorings, HelperState } from "./game";
import { words3 } from "./words3";
import { words4 } from "./words4";
import { words5 } from "./words5";
import { words6 } from "./words6";
import { colors, containerMaxWidth, timeChallengeTarget } from "./colors";
import { Button } from "./Button";
import {
  capitalizeFirst,
  isMobileScreen,
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
import { MarkGithubIcon } from "@primer/octicons-react";
import { SettingsModal } from "./SettingsModal";
import { TimerDisplay } from "./TimerDisplay";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const allOutlineArray = [...new Array(99)].map(() => "outline" as const);

const allWordsSet3 = new Set(allWords3);
const allWordsSet4 = new Set(allWords4);
const allWordsSet5 = new Set(allWords5);
const allWordsSet6 = new Set(allWords6);
const allWordsSetNorwegian5 = new Set(allWordNorwegian5);

let hasBootstrappedGumroad = false;

const maxAttempts = 5;

const translationsMap = {
  no: {
    titles: [
      "",
      "",
      "",
      "Tre bokstaver",
      "Fire bokstaver",
      "Fem bokstaver",
      "Seks bokstaver",
    ],
    about: "Instillinger",
    correctLetterRightPlace: "riktig bokstav, rett sted",
    correctLetterWrongPlace: "riktig bokstav, feil sted",
    guessTheWord: "Gjett ordet.",
    youMustGuessAnExistingWord: "Du må gjette et fullstendig norsk ord.",
    toGetStartedTry: "Prøv for eksempel",
    youWin: "Riktig!",
    viewStats: "Vis statistikk",
    youLose: "Bedre lykke neste gang!",
    theSolutionWas: "Riktig løsning var",
    getPremium: "Skaff premium",
    theSolutionIsEllipsis: "Løsningen er...",
    playAgain: "Nytt spill",
  },
  en: {
    titles: [
      "",
      "",
      "",
      "Three Letters",
      "Four Letters",
      "Five Letters",
      "Six Letters",
    ],
    about: "Settings",
    correctLetterRightPlace: "correct letter, right place",
    correctLetterWrongPlace: "correct letter, wrong place",
    guessTheWord: "Guess the word.",
    youMustGuessAnExistingWord: "You must guess an existing English word.",
    toGetStartedTry: "To get started, try",
    youWin: "You win!",
    viewStats: "View stats",
    youLose: "Better luck next time!",
    theSolutionWas: "The solution was",
    getPremium: "Get premium",
    theSolutionIsEllipsis: "The solution is...",
    playAgain: "Play again",
  },
};

export default function App() {
  const [, _setForceRefresh] = useState({});
  const [timeChallengeStartTimestamp, setTimeChallengeStartTimestamp] =
    useState<Date | null>(null);
  const [timeChallengeEndTimestamp, setTimeChallengeEndTimestamp] =
    useState<Date | null>(null);
  const forceRefresh = () => {
    _setForceRefresh({});
  };
  const [isPremium, _setIsPremium] = useState(
    localStorage.getItem("fiveletters.xyz:cachedIsPremium") === "true"
  );

  const [winCount, setWinCount] = useState(0);

  let slug = window.location.pathname;
  if (
    !(
      slug in
      {
        "/three": true,
        "/four": true,
        "/six": true,
        "/": true,
        "/getpremium": true,
        "/no/five": true,
        "/no/getpremium": true,
      }
    )
  ) {
    window.location.href = "/";
    slug = "/";
  }

  const language =
    {
      "/three": "en" as const,
      "/four": "en" as const,
      "/": "en" as const,
      "/six": "en" as const,
      "/getpremium": "en" as const,
      "/no/five": "no" as const,
      "/no/getpremium": "no" as const,
    }[slug] || ("en" as const);
  const keyboardMap = {
    no: ["QWERTYUIOPÅ", "ASDFGHJKLØÆ", "ZXCVBNMb"],
    en: ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNMb"],
  }[language];
  const isHintEnabled =
    {
      no: false,
      en: true,
    }[language] && timeChallengeStartTimestamp === null;
  const isDefinesEnabledForLanguage = {
    no: false,
    en: true,
  }[language];
  const translations = translationsMap[language];
  const allWords =
    {
      "/no/five": allWordNorwegian5,
      "/no/getpremium": allWordNorwegian5,
      "/three": allWords3,
      "/four": allWords4,
      "/": allWords5,
      "/getpremium": allWords5,
      "/six": allWords6,
    }[slug] || allWords5;
  const words =
    {
      "/no/getpremium": wordsNorwegian5,
      "/no/five": wordsNorwegian5,
      "/three": words3,
      "/four": words4,
      "/": words5,
      "/getpremium": words5,
      "/six": words6,
    }[slug] || words5;
  const allWordsSet =
    {
      "/no/getpremium": allWordsSetNorwegian5,
      "/no/five": allWordsSetNorwegian5,
      "/three": allWordsSet3,
      "/four": allWordsSet4,
      "/": allWordsSet5,
      "/getpremium": allWordsSet5,
      "/six": allWordsSet6,
    }[slug] || allWordsSet5;

  const count = words[0].length;

  const setIsPremium = (value: boolean) => {
    localStorage.setItem(
      "fiveletters.xyz:cachedIsPremium",
      JSON.stringify(value)
    );
    _setIsPremium(value);
  };
  const [showPremiumModal, _setShowPremiumModal] = useState(
    slug === "/getpremium" || slug === "/no/getpremium"
  );
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTimeChallengeCompleteModal, setShowTimeChallengeCompleteModal] =
    useState(false);
  const [isFirstGame, setIsFirstGame] = useState(true);
  const [defineHint, setDefineHint] = useState({
    shouldShowModal: false,
    value: "",
  });

  const setShowPremiumModal = (value: boolean) => {
    _setShowPremiumModal(value);
    if (!value && slug === "/getpremium") {
      history.replaceState({}, "", "/");
    }
    if (!value && slug === "/no/getpremium") {
      history.replaceState({}, "", "/no/five");
    }
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
  const [definition, setDefinition] = useState({
    isLoading: false,
    value: "",
    word: "",
  });
  const [hints, setHints] = useState<number[]>([]);
  const inputValueRef = useRef("");
  const currentlyDefinedWordRef = useRef("");

  const makeAttempt = useCallback(
    (
      attempt: string,
      answer: string,
      attempts: string[],
      isSolutionWord: boolean
    ) => {
      const isValidAttempt = allWordsSet.has(attempt.toUpperCase());
      storeAttempt({
        attempt,
        answer,
        step: attempts.length + 1,
        is_valid_attempt: isValidAttempt,
        game_id: gameId.current,
        is_solution_word: !!isSolutionWord,
      });
      if (isValidAttempt) {
        const word = attempt.toLowerCase();
        if (isDefinesEnabledForLanguage) {
          if (word !== currentlyDefinedWordRef.current) {
            setDefinition((old) => ({ ...old, isLoading: true }));
            Promise.all([
              delay(1000),
              fetch(
                "https://api.dictionaryapi.dev/api/v2/entries/en/" + word
              ).then((response) => response.json()),
            ]).then(([, data]) => {
              currentlyDefinedWordRef.current = word;
              setDefinition({
                isLoading: false,
                word,
                value: capitalizeFirst(
                  data[0]?.meanings[0]?.definitions[0]?.definition || "unknown."
                ),
              });
            });
          }
        }

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
          if (
            winCount === timeChallengeTarget - 1 &&
            timeChallengeStartTimestamp
          ) {
            setTimeChallengeEndTimestamp(new Date());
            setShowTimeChallengeCompleteModal(true);
          }
          setWinCount((old) => old + 1);
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
    [winCount]
  );

  const startTimeChallenge = () => {
    setGameState("play");
    setWinCount(0);
    setIsFirstGame(false);
    setHasNotMadeAnyAttemptYet(false);
    gameId.current = generateGameId();
    setAttempts([]);
    setHints([]);
    const newAnswer = words[(Math.random() * words.length) | 0];
    setAnswer(newAnswer);
    setTimeChallengeStartTimestamp(new Date());
  };

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
          makeAttempt(answer, newAnswer, [], true);
        }, 300 + answer.length * 75);
      }}
      buttonColor={colors.green}
      textColor={colors.black}
      shadowColor={colors.black}
    >
      {translations.playAgain}
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
        inputValueRef.current = (inputValueRef.current + letter).slice(
          0,
          answer.length
        );
        forceRefresh();
        if (inputValueRef.current.length === answer.length) {
          makeAttempt(inputValueRef.current, answer, attempts, false);
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
      {timeChallengeEndTimestamp && (
        <Modal
          visible={showTimeChallengeCompleteModal}
          dismiss={() =>
            //@ts-expect-error
            (window.location = slug)
          }
        >
          <div style={{ fontWeight: "bold" }}>
            <div style={{ marginBottom: 32 }}>Time challenge complete!</div>

            <div style={{ fontSize: 32, textAlign: "center" }}>
              <TimerDisplay
                startValue={timeChallengeStartTimestamp}
                endValue={timeChallengeEndTimestamp}
                showTenths={true}
              />
            </div>
          </div>
        </Modal>
      )}
      <SettingsModal
        visible={showAboutModal}
        onRequestDismiss={() => setShowAboutModal(false)}
        language={language}
        variant={slug}
        startTimeChallenge={startTimeChallenge}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          className="animate-all"
          style={{
            ...styles.container,
            ...(isMobileScreen(window.innerWidth, window.innerHeight)
              ? {}
              : {
                  margin: "16px auto",
                  borderRadius: 16,
                }),
          }}
        >
          <select
            className="animate-all"
            style={{
              background: "transparent",
              border: 0,
              outline: 0,
              fontSize: 22,
              lineHeight: 1.33,
              color: colors.black,
              position: "absolute",
              top: 16,
              left: 16,
              textDecoration: "underline",
              opacity: hasNotMadeAnyAttemptYet ? 1 : 0,
              pointerEvents:
                isFirstGame && hasNotMadeAnyAttemptYet ? "all" : "none",
              transform:
                isFirstGame && hasNotMadeAnyAttemptYet
                  ? "translateY(0px)"
                  : "translateY(-32px)",
            }}
            value={slug}
            onChange={(e) => {
              e.preventDefault();
              window.location.href = e.target.value;
            }}
          >
            <option value="/no/five">Fem 🇳🇴</option>
            <option value="/three">Three</option>
            <option value="/four">Four</option>
            <option value="/">Five</option>
            <option value="/six">Six</option>
          </select>
          <a
            className="animate-all"
            href="#"
            style={{
              color: colors.black,
              position: "absolute",
              top: 16,
              right: 16,
              opacity: hasNotMadeAnyAttemptYet ? 1 : 0,
              pointerEvents:
                isFirstGame && hasNotMadeAnyAttemptYet ? "all" : "none",
              transform:
                isFirstGame && hasNotMadeAnyAttemptYet
                  ? "translateY(0px)"
                  : "translateY(-32px)",
            }}
            onClick={(e) => {
              e.preventDefault();
              setShowAboutModal(true);
            }}
          >
            {translations.about}
          </a>
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
            <div>{translations.titles[count]}</div>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
              marginLeft: -16,
              marginRight: -16,
              marginBottom: 16,
              display: "flex",
              flexDirection: "column",
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
                  word={inputValueRef.current.padEnd(answer.length, " ")}
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
                      word={"".padEnd(answer.length, " ")}
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
                width:
                  letterBoxSize * answer.length +
                  letterGutter * (answer.length - 1),
                margin: "0 auto",
                flex: 1,
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
                      {translations.correctLetterRightPlace}
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
                      {translations.correctLetterWrongPlace}
                    </div>
                  )}
                </div>
              )}

              {gameState === "play" &&
                isFirstGame &&
                remainingAttempts === maxAttempts &&
                inputValueRef.current.length !== answer.length && (
                  <div
                    style={{
                      marginTop: 32,
                      marginBottom: 16,
                      justifyContent: "center",
                    }}
                  >
                    {translations.guessTheWord}
                  </div>
                )}

              {gameState === "play" &&
                isFirstGame &&
                remainingAttempts === maxAttempts &&
                inputValueRef.current.length === answer.length && (
                  <>
                    <div
                      style={{
                        marginTop: 32,
                        justifyContent: "center",
                        marginBottom: 16,
                      }}
                    >
                      {translations.youMustGuessAnExistingWord}
                    </div>
                    <div>
                      {translations.toGetStartedTry}{" "}
                      <span
                        style={{
                          color: colors.yellow,
                        }}
                      >
                        {words[(Math.random() * words.length) | 0]}
                      </span>
                    </div>
                  </>
                )}

              {gameState === "play" ? (
                <div
                  className="animate-all"
                  style={{
                    marginTop: 16,
                    opacity: definition.isLoading ? 0 : 1,
                    paddingRight: 16,
                    fontSize: 16,
                    transform: definition.isLoading
                      ? "translateY(8px)"
                      : "translateY(0px)",
                  }}
                >
                  <div style={{ marginBottom: 4 }}>
                    {definition.word.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontStyle: "italic",
                    }}
                  >
                    {definition.value}
                  </div>
                </div>
              ) : (
                ""
              )}

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
                    flex: 1,
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
                    {translations.youWin}
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
                      e.preventDefault();
                      setShowStatsModal(true);
                    }}
                  >
                    {translations.viewStats}
                  </a>

                  <div style={{ flex: 1 }} />
                </div>
              )}

              {gameState === "lose" && (
                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      marginBottom: 16,
                      textAlign: "center",
                      display: "block",
                    }}
                  >
                    {translations.youLose}
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
                    {translations.theSolutionWas}
                    <span style={{ marginLeft: 4, color: colors.yellow }}>
                      {answer}
                    </span>
                  </div>
                  {playAgainButton}

                  <div style={{ flex: 1 }} />
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
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
                      !isFirstGame || attempts.length > 1 || attempts.length > 0
                        ? 1
                        : 0,
                    transform:
                      !isFirstGame || attempts.length > 1 || attempts.length > 0
                        ? "translateY(0px)"
                        : "translateY(8px)",
                    pointerEvents:
                      !isFirstGame || attempts.length > 1 || attempts.length > 0
                        ? "all"
                        : "none",
                  }}
                >
                  <div style={{ width: 128 }}>
                    {timeChallengeStartTimestamp && (
                      <div>
                        {winCount} / {timeChallengeTarget}
                      </div>
                    )}
                    {isHintEnabled && (
                      <a
                        href="#"
                        style={{ color: colors.black }}
                        onClick={(e) => {
                          e.preventDefault();
                          fetch(
                            "https://api.dictionaryapi.dev/api/v2/entries/en/" +
                              answer
                          )
                            .then((response) => response.json())
                            .then((data) =>
                              setDefineHint({
                                shouldShowModal: true,
                                value:
                                  data[0]?.meanings[0]?.definitions[0]
                                    ?.definition || "unknown.",
                              })
                            );
                        }}
                      >
                        Hint
                      </a>
                    )}
                  </div>
                </div>
                {timeChallengeStartTimestamp && (
                  <div
                    style={{
                      marginBottom: 16,
                      marginLeft: 16,
                      textAlign: "center",
                    }}
                  >
                    <TimerDisplay
                      startValue={timeChallengeStartTimestamp}
                      endValue={timeChallengeEndTimestamp}
                      showTenths={false}
                    />
                  </div>
                )}
                {isPremium && (
                  <div
                    style={{
                      marginBottom: 16,
                      marginRight: 16,
                      color: colors.light,
                      width: 128,
                      textAlign: "right",
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
                      {translations.getPremium}
                    </a>
                  </div>
                )}
              </div>
              <Keyboard
                map={keyboardMap}
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

      <Modal
        visible={defineHint.shouldShowModal}
        dismiss={() =>
          setDefineHint((old) => ({ ...old, shouldShowModal: false }))
        }
      >
        <div style={{ fontWeight: "bold", marginBottom: 16 }}>
          {translations.theSolutionIsEllipsis}
        </div>
        <div style={{ marginBottom: 16, fontSize: 18 }}>
          ...{defineHint.value}
        </div>
        <Button
          onClick={(e) => {
            e.preventDefault();
            setDefineHint((old) => ({ ...old, shouldShowModal: false }));
          }}
        >
          OK
        </Button>
      </Modal>

      <PaymentModal
        visible={showPremiumModal}
        dismiss={paymentModalOnDismiss}
        onSuccess={paymentModalOnSuccess}
        language={language}
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
    position: "relative" as const,
  },
};
