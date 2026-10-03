/**
 * Toggle chips for picking several values from a managed list (emotions, tags).
 * Values already selected but no longer in the list (removed on the Admin page) stay visible, so old trades keep their data.
 */
export default function ChipPicker({
  options,
  selected,
  onToggle,
  emptyHint,
  label = (v) => v,
}: {
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  emptyHint?: string
  /** How a value is shown (the stored value does not change). */
  label?: (value: string) => string
}) {
  const all = [...options, ...selected.filter((s) => !options.includes(s))]
  if (!all.length) return <p className="text-sm text-muted">{emptyHint}</p>
  return (
    <div className="flex flex-wrap gap-2">
      {all.map((v) => (
        <button
          type="button"
          key={v}
          onClick={() => onToggle(v)}
          className={`rounded-full border px-3 py-1 text-sm ${
            selected.includes(v) ? 'border-green bg-green text-black' : 'border-line text-muted hover:text-green'
          }`}
        >
          {label(v)}
        </button>
      ))}
    </div>
  )
}
