interface Props {
  id: string
  emoji: string
  label: string
  leftPercent: number
  animationClass: string
  onAnimationEnd: (id: string) => void
}

export function FallingEmoji({ id, emoji, label, leftPercent, animationClass, onAnimationEnd }: Props) {
  return (
    <span
      role="img"
      aria-label={label}
      aria-hidden="true"
      className={`fixed top-0 z-50 pointer-events-none select-none ${animationClass}`}
      style={{ left: `${leftPercent}%`, fontSize: '7.5rem' }}
      onAnimationEnd={() => onAnimationEnd(id)}
    >
      {emoji}
    </span>
  )
}
