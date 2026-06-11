/**
 * 从文件名中解析番号
 * 支持常见格式：
 * - AV: JUR-258, ABP-123, SSNI-001
 * - FC2: FC2-PPV-1234567
 * - 无码: n1234, carib-123456
 */
export function parseCode(filename: string): string | null {
  // 移除文件扩展名
  const name = filename.replace(/\.[^.]+$/, '')

  // FC2 格式
  const fc2Match = name.match(/FC2[-_\s]?PPV[-_\s]?\d{5,8}/i)
  if (fc2Match) {
    return fc2Match[0].replace(/[-_\s]/g, '-').toUpperCase()
  }

  // 标准番号格式 (ABC-123)
  const stdMatch = name.match(/[A-Z]{2,5}[-_]?\d{3,5}/i)
  if (stdMatch) {
    return stdMatch[0].replace(/[-_]/, '-').toUpperCase()
  }

  // 无码番号格式
  const uncensoredMatch = name.match(/(?:n|carib|1pondo|heyzo)[-_]?\d{4,8}/i)
  if (uncensoredMatch) {
    return uncensoredMatch[0].replace(/[-_]/, '-').toUpperCase()
  }

  // Caribbeancom 格式 (072015-925, 010217-340)
  const caribMatch = name.match(/\d{6}[-_]\d{2,4}/)
  if (caribMatch) {
    return caribMatch[0].replace(/[-_]/, '-')
  }

  return null
}
