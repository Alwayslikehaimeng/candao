// 随机播放池（Shuffle Bag）核心逻辑 —— 纯函数、无副作用，便于单元测试
//
// 规则：
// - 每次点击随机播放从当前池中取一个，取过的立即移除，同轮内不重复
// - 池耗尽后重新洗牌建池，新一轮允许重复上一轮（正常行为）
// - 建池时尽量避免最近播放过的视频出现在新池开头（数量太少时自动放宽）

export interface ShuffleBag {
  /** 池中剩余的视频 id（未播放） */
  pool: number[]
  /** 筛选条件指纹，变化时强制重建池 */
  key: string
  /** 最近播放记录（最新的在前） */
  recentlyPlayed: number[]
}

/** 跨轮保护：新池开头最多避开这么多个最近播放过的视频 */
const RECENT_BLOCK = 5
/** 候选数量小于该值时不做跨轮保护，避免无法播放 */
const MIN_POOL_FOR_PROTECT = 4

/** Fisher-Yates 洗牌（返回新数组，不改原数组） */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 构建新一轮播放池：全量洗牌 + 跨轮保护
 * - 数量足够时，把开头连续命中最近播放的元素挪到末尾（仍然洗牌）
 * - 数量太少时直接返回洗牌结果，保证所有视频都能被播放
 */
export function buildPool(ids: number[], recentlyPlayed: number[]): number[] {
  const pool = shuffle(ids)
  if (pool.length < MIN_POOL_FOR_PROTECT) return pool

  const recentSet = new Set(recentlyPlayed.slice(0, RECENT_BLOCK))
  let head = 0
  while (head < pool.length && recentSet.has(pool[head])) head++
  if (head > 0 && head < pool.length) {
    const moved = pool.splice(0, head)
    pool.push(...shuffle(moved))
  }
  return pool
}

/**
 * 从池中取下一个有效 id。
 * - 无效（如已被删除）自动跳过
 * - 池耗尽返回 null，调用方应据此重建新池
 */
export function takeFromBag(bag: ShuffleBag, isValid: (id: number) => boolean): number | null {
  while (bag.pool.length > 0) {
    const id = bag.pool.shift()!
    if (isValid(id)) return id
  }
  return null
}

/** 记录一次播放（最新的在前，去重，上限 10 条） */
export function recordPlay(recentlyPlayed: number[], id: number, limit = 10): number[] {
  return [id, ...recentlyPlayed.filter((r) => r !== id)].slice(0, limit)
}
