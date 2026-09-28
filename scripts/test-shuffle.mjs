// 随机播放池单元测试
// 运行：先编译 TS，再执行本脚本
//   npx esbuild src/main/utils/shuffle-bag.ts --bundle --format=esm --outfile=scripts/.shuffle-bag.test.mjs
//   node scripts/test-shuffle.mjs
import assert from 'node:assert/strict'
import { buildPool, takeFromBag, recordPlay } from './.shuffle-bag.test.mjs'

const alwaysValid = () => true

let passed = 0
let failed = 0
function test(name, fn) {
  try {
    fn()
    passed++
    console.log(`  ✓ ${name}`)
  } catch (e) {
    failed++
    console.log(`  ✗ ${name}`)
    console.log(`    ${e.message}`)
  }
}

console.log('== 测试 1：100 个视频，同轮内不重复 ==')
test('100 次抽取全部不同', () => {
  const ids = Array.from({ length: 100 }, (_, i) => i + 1)
  const bag = { pool: buildPool(ids, []), key: 'k', recentlyPlayed: [] }
  const played = []
  for (let i = 0; i < 100; i++) {
    const id = takeFromBag(bag, alwaysValid)
    assert.notEqual(id, null, `第 ${i + 1} 次抽取不应为 null`)
    played.push(id)
  }
  assert.equal(new Set(played).size, 100, '100 次播放必须全部不同')
  assert.equal(takeFromBag(bag, alwaysValid), null, '池耗尽后应返回 null')
})

console.log('== 测试 2：第二轮（重新建池）==')
test('第二轮覆盖全部 100 个，且顺序与第一轮不同', () => {
  const ids = Array.from({ length: 100 }, (_, i) => i + 1)
  const recentlyPlayed = Array.from({ length: 10 }, (_, i) => i + 1) // 模拟上一轮末尾
  const round1 = []
  let bag = { pool: buildPool(ids, []), key: 'k', recentlyPlayed: [] }
  for (let i = 0; i < 100; i++) round1.push(takeFromBag(bag, alwaysValid))

  const round2 = []
  bag = { pool: buildPool(ids, recentlyPlayed), key: 'k', recentlyPlayed }
  for (let i = 0; i < 100; i++) round2.push(takeFromBag(bag, alwaysValid))

  assert.equal(new Set(round2).size, 100, '第二轮也必须包含全部 100 个')
  assert.deepEqual(new Set(round1), new Set(round2), '两轮覆盖的集合应相同')
  assert.notDeepEqual(round1, round2, '两轮顺序不应相同（概率上几乎必然，随机失败重跑）')
})

console.log('== 测试 3：快速点击不重建池 ==')
test('key 不变时连续取不重复、不重新洗牌', () => {
  const ids = Array.from({ length: 10 }, (_, i) => i + 1)
  // 模拟 handlers 的状态机：key 相同且池非空 → 直接用现有池
  let bag = { pool: buildPool(ids, []), key: 'filters-v1', recentlyPlayed: [] }
  const picked = []
  for (let i = 0; i < 5; i++) {
    if (bag.key === 'filters-v1' && bag.pool.length > 0) {
      const id = takeFromBag(bag, alwaysValid)
      bag.recentlyPlayed = recordPlay(bag.recentlyPlayed, id)
      picked.push(id)
    } else {
      throw new Error('不应重建池')
    }
  }
  assert.equal(new Set(picked).size, 5, '快速点击 5 次必须全不同')
})

console.log('== 测试 4：筛选变化重建池 ==')
test('key 变化后新池只包含新筛选下的 id', () => {
  // 旧筛选 5 个，新筛选 3 个
  let bag = { pool: buildPool([1, 2, 3, 4, 5], []), key: 'old-filters', recentlyPlayed: [] }
  takeFromBag(bag, alwaysValid) // 已经播放了 1 个

  const newFilters = { keyword: 'abc' } // 新筛选只命中 1/2/3
  if (bag.key !== JSON.stringify(newFilters)) {
    bag = { pool: buildPool([1, 2, 3], bag.recentlyPlayed), key: JSON.stringify(newFilters), recentlyPlayed: bag.recentlyPlayed }
  }
  const played = [takeFromBag(bag, alwaysValid), takeFromBag(bag, alwaysValid), takeFromBag(bag, alwaysValid)]
  assert.deepEqual(new Set(played), new Set([1, 2, 3]), '新池只能包含 1/2/3')
})

console.log('== 测试 5：小视频库 ==')
test('1 个视频', () => {
  const bag = { pool: buildPool([1], []), key: 'k', recentlyPlayed: [] }
  assert.equal(takeFromBag(bag, alwaysValid), 1)
  assert.equal(takeFromBag(bag, alwaysValid), null, '取完后应为 null，不报错不死循环')
  // 重新建池继续能播
  bag.pool = buildPool([1], bag.recentlyPlayed)
  assert.equal(takeFromBag(bag, alwaysValid), 1)
})
test('2 个视频', () => {
  const bag = { pool: buildPool([1, 2], []), key: 'k', recentlyPlayed: [] }
  const p1 = takeFromBag(bag, alwaysValid)
  const p2 = takeFromBag(bag, alwaysValid)
  assert.notEqual(p1, p2, '两个都播一次，不重复')
  assert.equal(takeFromBag(bag, alwaysValid), null)
})
test('3 个视频', () => {
  const bag = { pool: buildPool([1, 2, 3], [1]), key: 'k', recentlyPlayed: [1] }
  const played = [takeFromBag(bag, alwaysValid), takeFromBag(bag, alwaysValid), takeFromBag(bag, alwaysValid)]
  assert.equal(new Set(played).size, 3, '3 个视频全不重复')
  assert.equal(takeFromBag(bag, alwaysValid), null)
})

console.log('== 测试 6：已删除视频自动跳过 ==')
test('池中视频不存在时跳过并继续', () => {
  const bag = { pool: buildPool([1, 2, 3, 4], []), key: 'k', recentlyPlayed: [] }
  const isValid = (id) => id !== 2 && id !== 3 // 2、3 已删除
  const played = [takeFromBag(bag, isValid), takeFromBag(bag, isValid)]
  assert.ok(!played.includes(2) && !played.includes(3), '不应播放已删除的视频')
})

console.log('== 测试 7：跨轮保护 ==')
test('新池开头避免最近播放过的视频（数量足够时）', () => {
  // 重复多次建池，统计开头第一个出现在最近列表中的频率应远小于随机
  const ids = Array.from({ length: 100 }, (_, i) => i + 1)
  const recent = [1, 2, 3, 4, 5]
  let collision = 0
  for (let i = 0; i < 200; i++) {
    const pool = buildPool(ids, recent)
    if (recent.includes(pool[0])) collision++
  }
  assert.ok(collision < 20, `200 次建池中开头命中最近播放的只有 ${collision} 次（<20）`)
})
test('候选太少时不保护，保证能播', () => {
  const pool = buildPool([1, 2], [1])
  assert.equal(pool.length, 2, '2 个视频时不做保护，直接洗牌')
  assert.ok(pool.includes(1) && pool.includes(2))
})
test('最近播放记录去重 + 上限 10', () => {
  let recent = []
  for (let i = 0; i < 15; i++) recent = recordPlay(recent, i % 5)
  assert.equal(recent.length, 5, '去重后最多 5 个')
  assert.deepEqual(recent, [4, 3, 2, 1, 0])
})

console.log(`\n结果：${passed} 通过，${failed} 失败`)
process.exit(failed > 0 ? 1 : 0)
