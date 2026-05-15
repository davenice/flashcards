export interface TrophyItem {
  id: string
  emoji: string
  label: string
}

interface Props {
  items: TrophyItem[]
}

export function CorkBoard({ items }: Props) {
  return (
    <div
      role="region"
      aria-label="Trophy cork board"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-40 animate-corkboard-slide-up"
      style={{ background: 'linear-gradient(180deg, #c8a97e 0%, #b8955f 100%)', borderTop: '3px solid #8b6340' }}
    >
      <div className="flex items-center px-4 h-14 gap-1 overflow-x-auto">
        <span className="text-xs font-bold uppercase tracking-widest shrink-0 mr-2" style={{ color: '#5c3d1e' }}>
          🪵 Trophies
        </span>
        {items.map((item, i) => (
          <span
            key={item.id}
            role="img"
            aria-label={item.label}
            title={item.label}
            className={`text-2xl shrink-0 relative ${i === items.length - 1 ? 'animate-pin-drop' : ''}`}
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}
          >
            {item.emoji}
          </span>
        ))}
      </div>
    </div>
  )
}
