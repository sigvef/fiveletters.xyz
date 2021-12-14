import { IDBPDatabase, openDB } from "idb";

export const db = new Promise<IDBPDatabase>((resolve) => {
  openDB("fiveletters.xyz:stats", 1, {
    upgrade(db) {
      const store = db.createObjectStore("attempts", {
        keyPath: "id",
        autoIncrement: true,
      });
      store.createIndex("created_at", "created_at");
      store.createIndex("game_id", "game_id");
    },
  }).then(resolve);
});

export const storeAttempt = async (record: {
  attempt: string;
  answer: string;
  game_id: string;
  step: number;
  is_valid_attempt: boolean;
  is_solution_word: boolean;
}) => {
  const created_at = new Date();
  (await db).add("attempts", {
    created_at,
    ...record,
  });
};
