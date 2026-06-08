interface Props {
  score: number | null
  size?: 'sm' | 'md' | 'lg'
  showScore?: boolean
}

function toHalfStar(score: number): number {
  return Math.round(score * 2) / 2
}

function renderStars(score: number): { full: number; half: boolean; empty: number } {
  const rounded = toHalfStar(score)
  const full = Math.floor(rounded)
  const half = rounded % 1 !== 0
  const empty = 5 - full - (half ? 1 : 0)
  return { full, half, empty }
}

export default function StarRating({ score, size = 'md', showScore = true }: Props) {
  if (!score || score <= 0) return <span style={{ color: 'var(--candao-text-muted)', fontSize: sizes[size].font }}>-</span>

  const { full, half, empty } = renderStars(score)
  const s = sizes[size]

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <div style={{ display: 'inline-flex', gap: 1 }}>
        {Array.from({ length: full }).map((_, i) => (
          <span key={`f${i}`} className="star-full" style={{ fontSize: s.star }}>★</span>
        ))}
        {half && <span className="star-half" style={{ fontSize: s.star }}>★</span>}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={`e${i}`} className="star-empty" style={{ fontSize: s.star }}>★</span>
        ))}
      </div>
      {showScore && <span className="star-score" style={{ fontSize: s.font }}>{score.toFixed(1)}</span>}
    </div>
  )
}

const sizes = {
  sm: { star: 12, font: 11 },
  md: { star: 16, font: 13 },
  lg: { star: 20, font: 15 },
}
