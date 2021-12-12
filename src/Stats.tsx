import { useEffect, useState } from "react";
import { borderRadius, colors } from "./colors";
import { db } from "./db";

export const Stats: React.FC<{ visible: boolean }> = ({ visible }) => {
  const [allAttempts, setAllAttempts] = useState<any>(null);
  const [tab, setTab] = useState<"week" | "month" | "all-time">("all-time");
  const gameIdSet = new Set();
  const stepCount: any = {};
  const wordCounts: { [key: string]: number } = {};
  for (const attempt of allAttempts || []) {
    gameIdSet.add(attempt.game_id);
    stepCount[attempt.step] = (stepCount[attempt.step] || 0) + 1;
    if (attempt.is_valid_attempt) {
      wordCounts[attempt.attempt] = (wordCounts[attempt.attempt] || 0) + 1;
    }
  }
  const favoriteWords = Object.entries(wordCounts).sort((a, b) =>
    b[1] > a[1] ? 1 : -1
  );
  let mostGuessedStepCount = 0;
  let mostGuessedStepNumber = 0;
  for (let i = 0; i < 5; i++) {
    if (stepCount[i] > mostGuessedStepCount) {
      mostGuessedStepCount = stepCount[i];
      mostGuessedStepNumber = i;
    }
  }
  useEffect(() => {
    db.then((db) => db.getAllFromIndex("attempts", "created_at")).then(
      setAllAttempts
    );
  }, [visible]);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16 }}>
        Stats are currently under construction. *insert gif here*
      </div>
      <div
        style={{
          display: "flex",
          alignSelf: "center",
          alignItems: "center",
          justifyContent: "center",
          borderRadius,
          background: colors.dark,
          padding: 4,
          color: colors.light,
        }}
      >
        {[
          { text: "Week", key: "week" },
          { text: "Month", key: "month" },
          { text: "All time", key: "all-time" },
        ].map((item) => (
          <div
            key={item.key}
            style={{
              padding: "4px 16px 4px 16px",
              whiteSpace: "nowrap",
              borderRadius: borderRadius - 2,
              background: tab === item.key ? colors.light : "transparent",
              color: tab === item.key ? colors.darkContrastText : colors.light,
            }}
          >
            {item.text}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 32 }}>{gameIdSet.size} games played.</div>
      <div style={{ marginTop: 16 }}>
        Most attempts at step {mostGuessedStepNumber}.
      </div>
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 8,
            paddingBottom: 4,
            borderBottom: "4px double " + colors.dark,
          }}
        >
          <div style={{ fontWeight: "bold" }}>Favorite words</div>
          <div>Times used</div>
        </div>
        <ol>
          {favoriteWords.slice(0, 5).map(([word, count]) => (
            <li
              key={word}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontFamily: "monospace" }}>{word}</div>
              <div style={{ fontVariantNumeric: "tabular-nums" }}>{count}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
