export type Coloring = "unknown" | "wrong" | "semi-correct" | "correct";
export type Colorings = { [key: string]: Coloring };

export function getAllColorings(answer: string, attempts: string[]) {
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
