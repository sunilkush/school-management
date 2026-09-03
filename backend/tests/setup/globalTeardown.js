/** Stops the shared in-memory MongoDB started by globalSetup. */
export default async function globalTeardown() {
  const replSet = globalThis.__MONGO_REPLSET__;
  if (replSet) await replSet.stop();
}
