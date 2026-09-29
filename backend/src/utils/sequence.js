import { Counter } from "../models/Counter.model.js";

/**
 * The next number in a named sequence, handed out by one atomic $inc so two requests at the same
 * moment never get the same value. "Read the highest number and add one" does give them the same.
 *
 * On first use the counter starts after `seed()`, the highest number already issued before the
 * counter existed (compare those as numbers: as text "…1000" sorts before "…999").
 *
 * `count` reserves that many consecutive numbers in the same $inc and returns the first of them,
 * so a bulk insert can number its rows without a round trip each.
 */
export const nextSequence = async (key, seed = async () => 0, count = 1) => {
  if (!(await Counter.exists({ _id: key }))) {
    const start = Number(await seed()) || 0;
    try {
      await Counter.updateOne({ _id: key }, { $setOnInsert: { seq: start } }, { upsert: true });
    } catch (error) {
      if (error?.code !== 11000) throw error; // another request created it first
    }
  }
  const { seq } = await Counter.findOneAndUpdate({ _id: key }, { $inc: { seq: count } }, { new: true }).lean();
  return seq - count + 1; // the first of the block; for count = 1, the number itself
};

/** Highest numeric suffix after `prefix` among the given codes. */
export const highestSuffix = (codes, prefix) =>
  codes.reduce((max, code) => {
    const n = parseInt(String(code || "").slice(prefix.length), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);
