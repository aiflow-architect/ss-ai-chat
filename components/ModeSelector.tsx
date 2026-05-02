'use client'

import { MODE_LABELS } from '@/lib/types'
import type { Mode } from '@/lib/types'

interface Props {
  mode: Mode
  onChange: (mode: Mode) => void
}

const MODES: Mode[] = ['chat', 'marketing', 'artwork', 'code']

export default function ModeSelector({ mode, onChange }: Props) {
  return (
    <div className="flex gap-2 flex-wrap">
      {MODES.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`px-5 py-2.5 rounded-xl text-base font-semibold transition-all border-2 ${
            mode === m
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
          }`}
        >
          {MODE_LABELS[m]}
        </button>
      ))}
    </div>
  )
}
