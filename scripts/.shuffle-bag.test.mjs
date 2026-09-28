// src/main/utils/shuffle-bag.ts
var RECENT_BLOCK = 5;
var MIN_POOL_FOR_PROTECT = 4;
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function buildPool(ids, recentlyPlayed) {
  const pool = shuffle(ids);
  if (pool.length < MIN_POOL_FOR_PROTECT) return pool;
  const recentSet = new Set(recentlyPlayed.slice(0, RECENT_BLOCK));
  let head = 0;
  while (head < pool.length && recentSet.has(pool[head])) head++;
  if (head > 0 && head < pool.length) {
    const moved = pool.splice(0, head);
    pool.push(...shuffle(moved));
  }
  return pool;
}
function takeFromBag(bag, isValid) {
  while (bag.pool.length > 0) {
    const id = bag.pool.shift();
    if (isValid(id)) return id;
  }
  return null;
}
function recordPlay(recentlyPlayed, id, limit = 10) {
  return [id, ...recentlyPlayed.filter((r) => r !== id)].slice(0, limit);
}
export {
  buildPool,
  recordPlay,
  shuffle,
  takeFromBag
};
