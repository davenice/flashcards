interface Props {
  prompt: string
  direction: string
}

export function FlashCard({ prompt, direction }: Props) {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center min-h-40 text-center">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">{direction}</p>
      <p className="text-3xl font-bold text-slate-800 break-words">{prompt}</p>
    </div>
  )
}
