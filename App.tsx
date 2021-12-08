import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextStyle,
  Image,
  View,
  ScrollView,
  Animated,
  Pressable,
  PressableProps,
  Platform,
  Modal,
} from "react-native";
import { allWords } from "./src/allwords";
import { Coloring, Colorings, getAllColorings } from "./src/game";
import { words } from "./src/words";

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

const CrossPlatformPressable: React.FC<PressableProps> = (props) => {
  const [isDepressed, setIsDepressed] = useState(false);
  return (
    <Pressable
      {...props}
      onPressIn={() => {
        setIsDepressed(true);
      }}
      onPressOut={() => setTimeout(() => setIsDepressed(false), 100)}
      style={{
        opacity: isDepressed && Platform.OS === "web" ? 0.5 : 1,
      }}
    />
  );
};

const T: React.FC<{ style?: TextStyle }> = ({ style, children }) => {
  return (
    <Text
      style={{
        fontSize: 22,
        lineHeight: "1.25",
        color: colors.extraBlack,
        ...style,
      }}
    >
      {children}
    </Text>
  );
};

const Line: React.FC<{
  word: string;
  coloring: Coloring[];
  letterHints?: string[];
}> = ({ word, coloring, letterHints }) => {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {[...word].map((letter, i) => {
        return (
          <View
            key={i}
            style={{
              width: 64,
              height: 64,
              borderRadius,
              marginHorizontal: 4,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: backgroundColors[coloring[i]],
            }}
          >
            <Text
              style={{
                position: "absolute",
                left: 6,
                top: 4,
                fontSize: 14,
              }}
            >
              {letterHints?.[i]?.toUpperCase()}
            </Text>
            <Text
              style={{
                fontSize: 32,
                color: foregroundColors[coloring[i]],
              }}
            >
              {letter.toUpperCase()}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const Keyboard: React.FC<{
  colorings: Colorings;
  onKeyPress: (letter: string) => void;
}> = ({ colorings, onKeyPress }) => {
  const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM<"];
  return (
    <View>
      {rows.map((row) => (
        <View
          key={row}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {[...row].map((letter, i) => (
            <CrossPlatformPressable
              key={letter}
              onPress={() => {
                if (colorings[letter] === "wrong") {
                  return;
                }
                onKeyPress(letter);
              }}
              style={{
                ...(i === 0 ? { flex: 1, alignItems: "flex-end" } : {}),
                ...(i === row.length - 1 ? { flex: 1 } : {}),
                borderRadius,
              }}
            >
              <View
                style={{
                  width: "+<".indexOf(letter) !== -1 ? 32 + 32 + 2 : 32,
                  marginVertical: 2,
                  marginHorizontal: 2,
                  height: 48,
                  alignItems: "center",
                  justifyContent: "center",
                  ...(letter !== "<"
                    ? {
                        backgroundColor:
                          backgroundColors[colorings[letter] || "unknown"],
                      }
                    : { backgroundColor: colors.dark, marginRight: -34 }),
                  borderRadius,
                }}
              >
                {letter === "<" ? (
                  <Image
                    source={require("./assets/backspace.png")}
                    style={{
                      width: 32,
                      height: 32,
                      tintColor: colors.black,
                      resizeMode: "contain",
                    }}
                  />
                ) : (
                  <Text style={{ fontSize: 22, color: colors.black }}>
                    {letter}
                  </Text>
                )}
              </View>
            </CrossPlatformPressable>
          ))}
        </View>
      ))}
    </View>
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
  const [gameState, setGameState] = useState<"play" | "win" | "lose">("play");
  const [answer, setAnswer] = useState(() => {
    return words[(Math.random() * words.length) | 0];
  });
  const [shakeValue] = useState(() => new Animated.Value(0));

  const [showOrangeHelper, setShowOrangeHelper] =
    useState<HelperState>("not-shown-yet");
  const [showGreenHelper, setShowGreenHelper] =
    useState<HelperState>("not-shown-yet");

  const [attempts, setAttempts] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollViewRef = useRef<ScrollView | null>(null);

  const makeAttempt = (attempt: string) => {
    if (allWordsSet.has(attempt.toUpperCase())) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);

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
      shakeValue.setValue(0);
      Animated.timing(shakeValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  const playAgainButton = (
    <CrossPlatformPressable
      onPress={() => {
        setGameState("play");
        setAttempts([]);
        setAnswer(words[(Math.random() * words.length) | 0]);
      }}
      style={{
        borderRadius: 999,
        alignSelf: "center",
      }}
    >
      <View
        style={{
          paddingHorizontal: 32,
          paddingVertical: 16,
          borderRadius: 999,
          backgroundColor: colors.green,
          alignSelf: "center",
        }}
      >
        <T>Play again</T>
      </View>
    </CrossPlatformPressable>
  );

  const remainingAttempts = maxAttempts - attempts.length;

  const colorings = getAllColorings(answer, attempts);

  return (
    <View
      style={{
        backgroundColor: colors.dark,
        flex: 1,
        height: "100vh",
        maxHeight: "-webkit-fill-available",
      }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.container}>
          <StatusBar style="auto" />
          <Text
            style={{
              textAlign: "center",
              marginTop: 32,
              marginBottom: 32,
              fontSize: 32,
              fontWeight: "bold",
              color: colors.extraBlack,
            }}
          >
            Five Letters
          </Text>

          <ScrollView
            ref={scrollViewRef}
            style={{
              flex: 1,
              marginHorizontal: -16,
              marginBottom: 16,
            }}
          >
            {attempts.map((attempt, i) => (
              <View key={i} style={{ marginBottom: 8 }}>
                <Line word={attempt} coloring={colorings.attemptColorings[i]} />
              </View>
            ))}

            {gameState === "play" && (
              <Animated.View
                style={{
                  marginBottom: 16,
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
                }}
              >
                <Line
                  word={inputValue.padEnd(5, " ")}
                  coloring={[...new Array(answer.length)].map(() => "unknown")}
                  letterHints={colorings.deduced}
                />
              </Animated.View>
            )}

            {(showGreenHelper === "show-now" ||
              showOrangeHelper === "show-now") && (
              <View style={{ padding: 16 }}>
                {showGreenHelper === "show-now" && (
                  <T style={{ marginBottom: 16, color: colors.light }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        marginRight: 6,
                        marginBottom: -6,
                        borderRadius: 4,
                        backgroundColor: colors.green,
                      }}
                    />{" "}
                    correct letter, right place
                  </T>
                )}
                {showOrangeHelper === "show-now" && (
                  <T style={{ marginBottom: 16, color: colors.lightYellow }}>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        marginRight: 6,
                        marginBottom: -6,
                        borderRadius: 4,
                        backgroundColor: colors.yellow,
                      }}
                    />{" "}
                    correct letter, wrong place
                  </T>
                )}
              </View>
            )}

            <View style={{ flex: 1 }} />
          </ScrollView>
          {gameState === "play" && (
            <T style={{ marginBottom: 16 }}>
              {remainingAttempts === maxAttempts
                ? "Guess the word!"
                : `${remainingAttempts} attempt${
                    remainingAttempts === 1 ? "" : "s"
                  } remaining.`}
            </T>
          )}
          {gameState === "lose" && (
            <T style={{ marginBottom: 32 }}>You are out of attempts!</T>
          )}

          {gameState === "win" && (
            <View style={{ marginTop: 32 }}>
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
            </View>
          )}

          {gameState === "lose" && (
            <View style={{ marginTop: 16 }}>
              <T style={{ marginBottom: 16, textAlign: "center" }}>
                Better luck next time!
              </T>
              <T style={{ marginBottom: 32, textAlign: "center" }}>
                The solution was{"  "}
                <Text style={{ color: colors.yellow }}>{answer}</Text>
              </T>
              {playAgainButton}
            </View>
          )}

          {gameState === "play" && (
            <View style={{ marginHorizontal: -16 }}>
              <Keyboard
                colorings={colorings.keyboardColorings}
                onKeyPress={(letter) => {
                  if (letter === "<") {
                    setInputValue((old) => old.slice(0, -1));
                  } else {
                    setInputValue((old) =>
                      old.length < 5 ? old + letter : old
                    );
                    if (inputValue.length === 4) {
                      makeAttempt(inputValue + letter);
                    }
                  }
                }}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    maxWidth: 64 * 5 + 8 * 4 + 16 * 2,
    alignSelf: "center",
  },
});
