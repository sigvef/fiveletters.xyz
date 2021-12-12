export type Coloring =
  | "unknown"
  | "wrong"
  | "semi-correct"
  | "correct"
  | "outline";
export type Colorings = { [key: string]: Coloring };

export type HelperState = "not-shown-yet" | "show-now" | "never-show-again";

export const generateGameId = () =>
  [...new Array(24)]
    .map(() => ((Math.random() * 0xffffffff) | 0).toString(16).padStart(8, "0"))
    .join("-");

export function getAllColorings(
  answer: string,
  attempts: string[],
  hints: number[]
) {
  const attemptColorings: Coloring[][] = [];
  const keyboardColorings: { [key: string]: Coloring } = {};
  const deduced: string[] = [...new Array(answer.length)].map(() => "");

  for (const attempt of attempts) {
    const attemptColoring: Coloring[] = [...new Array(attempt.length)].map(
      () => "wrong"
    );
    attemptColorings.push(attemptColoring);
    const usedAttemptLetters = [...new Array(attempt.length)].map(() => false);
    const usedAnswerLetters = [...new Array(attempt.length)].map(() => false);

    /* Look for corrects */
    for (let i = 0; i < attempt.length; i++) {
      if (attempt[i] === answer[i]) {
        attemptColoring[i] = "correct";
        usedAnswerLetters[i] = true;
        usedAttemptLetters[i] = true;
        deduced[i] = answer[i];
      }
    }

    /* now, look for semi-corrects */
    for (let i = 0; i < attempt.length; i++) {
      if (usedAttemptLetters[i]) {
        continue;
      }

      for (let j = 0; j < answer.length; j++) {
        if (usedAnswerLetters[j]) {
          continue;
        }
        if (answer[j] === attempt[i] && attemptColoring[i] !== "correct") {
          usedAnswerLetters[j] = true;
          usedAttemptLetters[i] = true;
          attemptColoring[i] = "semi-correct";
          break;
        }
      }
    }

    /* Add hints to deduced */
    for (const hint of hints) {
      deduced[hint] = answer[hint];
    }

    /* Update keyboard colorings now that we have colored this attempt. */
    for (let i = 0; i < attempt.length; i++) {
      if (attemptColoring[i] === "correct") {
        keyboardColorings[attempt[i]] = "correct";
      } else if (
        attemptColoring[i] === "semi-correct" &&
        keyboardColorings[attempt[i]] !== "correct"
      ) {
        keyboardColorings[attempt[i]] = "semi-correct";
      } else if (
        attemptColoring[i] === "wrong" &&
        !keyboardColorings[attempt[i]]
      ) {
        keyboardColorings[attempt[i]] = "wrong";
      }
    }
  }

  return {
    attemptColorings,
    keyboardColorings,
    deduced,
  };
}
