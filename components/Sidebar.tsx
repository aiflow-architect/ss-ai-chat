'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import type { Mode, AIModel } from '@/lib/types'

interface ConvSummary {
  _id: string
  title: string
  mode: Mode
  model: AIModel
  folderId: string | null
  updatedAt: string
}

interface FolderItem {
  _id: string
  name: string
}

interface Props {
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  username: string
}

export default function Sidebar({ activeId, onSelect, onNew, username }: Props) {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [convs, setConvs] = useState<ConvSummary[]>([])
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set())
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    loadData()
  }, [activeId])

  async function loadData() {
    const [fRes, cRes] = await Promise.all([
      fetch('/api/folders'),
      fetch('/api/conversations'),
    ])
    const fData = await fRes.json()
    const cData = await cRes.json()
    setFolders(fData)
    setConvs(cData)
  }

  async function createFolder() {
    const name = prompt('ชื่อโฟลเดอร์:')
    if (!name) return
    const res = await fetch('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const folder = await res.json()
    setFolders((prev) => [...prev, folder])
    setOpenFolders((prev) => new Set([...prev, folder._id]))
  }

  async function deleteFolder(id: string) {
    if (!confirm('ลบโฟลเดอร์นี้? (แชทจะยังอยู่)')) return
    await fetch('/api/folders', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setFolders((prev) => prev.filter((f) => f._id !== id))
    setConvs((prev) => prev.map((c) => (c.folderId === id ? { ...c, folderId: null } : c)))
  }

  async function renameFolder(id: string) {
    if (!editName.trim()) return
    await fetch('/api/folders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editName }),
    })
    setFolders((prev) => prev.map((f) => (f._id === id ? { ...f, name: editName } : f)))
    setEditingFolder(null)
  }

  async function deleteConv(id: string) {
    if (!confirm('ลบแชทนี้?')) return
    await fetch('/api/conversations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setConvs((prev) => prev.filter((c) => c._id !== id))
    if (activeId === id) onNew()
  }

  async function moveToFolder(convId: string, folderId: string | null) {
    await fetch('/api/conversations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: convId, folderId }),
    })
    setConvs((prev) =>
      prev.map((c) => (c._id === convId ? { ...c, folderId } : c))
    )
  }

  function toggleFolder(id: string) {
    setOpenFolders((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const noFolderConvs = convs.filter((c) => !c.folderId)

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">🤖</span>
          <span className="font-bold text-gray-800 text-lg">SS AI Chat</span>
        </div>
        <button
          onClick={onNew}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-base font-semibold transition-colors"
        >
          + แชทใหม่
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Folders */}
        {folders.map((folder) => {
          const folderConvs = convs.filter((c) => c.folderId === folder._id)
          const isOpen = openFolders.has(folder._id)

          return (
            <div key={folder._id}>
              {/* Folder header */}
              <div className="flex items-center gap-1 group rounded-lg px-2 py-1.5 hover:bg-gray-200">
                <button
                  onClick={() => toggleFolder(folder._id)}
                  className="flex items-center gap-1.5 flex-1 text-left"
                >
                  <span className="text-gray-500 text-sm">{isOpen ? '▼' : '▶'}</span>
                  <span className="text-base">📁</span>
                  {editingFolder === folder._id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => renameFolder(folder._id)}
                      onKeyDown={(e) => e.key === 'Enter' && renameFolder(folder._id)}
                      className="flex-1 text-sm border border-blue-400 rounded px-1 outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-700 truncate flex-1">
                      {folder.name}
                    </span>
                  )}
                </button>
                <div className="hidden group-hover:flex gap-1">
                  <button
                    onClick={() => { setEditingFolder(folder._id); setEditName(folder.name) }}
                    className="text-gray-400 hover:text-gray-600 text-xs px-1"
                    title="เปลี่ยนชื่อ"
                  >✏️</button>
                  <button
                    onClick={() => deleteFolder(folder._id)}
                    className="text-gray-400 hover:text-red-500 text-xs px-1"
                    title="ลบ"
                  >🗑️</button>
                </div>
              </div>

              {/* Folder conversations */}
              {isOpen && (
                <div className="ml-4 space-y-0.5">
                  {folderConvs.map((conv) => (
                    <ConvItem
                      key={conv._id}
                      conv={conv}
                      active={activeId === conv._id}
                      onSelect={onSelect}
                      onDelete={deleteConv}
                      folders={folders}
                      onMove={moveToFolder}
                    />
                  ))}
                  {folderConvs.length === 0 && (
                    <p className="text-xs text-gray-400 px-3 py-1">ว่างอยู่</p>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* No-folder conversations */}
        {noFolderConvs.length > 0 && (
          <div className="space-y-0.5">
            {folders.length > 0 && (
              <p className="text-xs text-gray-400 px-2 pt-2 pb-1">แชทอื่นๆ</p>
            )}
            {noFolderConvs.map((conv) => (
              <ConvItem
                key={conv._id}
                conv={conv}
                active={activeId === conv._id}
                onSelect={onSelect}
                onDelete={deleteConv}
                folders={folders}
                onMove={moveToFolder}
              />
            ))}
          </div>
        )}

        {convs.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">ยังไม่มีแชท</p>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 space-y-2">
        <button
          onClick={createFolder}
          className="w-full text-left text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          📁 + สร้างโฟลเดอร์
        </button>
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm text-gray-500">👤 {username}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            ออก
          </button>
        </div>
      </div>
    </div>
  )
}

// Sub-component: แต่ละ conversation item
function ConvItem({
  conv,
  active,
  onSelect,
  onDelete,
  folders,
  onMove,
}: {
  conv: ConvSummary
  active: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  folders: FolderItem[]
  onMove: (convId: string, folderId: string | null) => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  const modeIcon: Record<string, string> = {
    chat: '💬',
    marketing: '📣',
    artwork: '🎨',
    code: '💻',
  }

  return (
    <div className="relative group">
      <button
        onClick={() => onSelect(conv._id)}
        className={`w-full text-left rounded-lg px-3 py-2 flex items-center gap-2 transition-colors ${
          active ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-200 text-gray-700'
        }`}
      >
        <span className="text-sm">{modeIcon[conv.mode] || '💬'}</span>
        <span className="text-sm truncate flex-1">{conv.title}</span>
      </button>

      {/* Menu button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 rounded"
      >
        ⋯
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <div
          className="absolute right-0 top-8 z-10 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[160px]"
          onMouseLeave={() => setShowMenu(false)}
        >
          {/* ย้ายไป folder */}
          {folders.length > 0 && (
            <>
              <p className="text-xs text-gray-400 px-3 py-1">ย้ายไป</p>
              {folders.map((f) => (
                <button
                  key={f._id}
                  onClick={() => { onMove(conv._id, f._id); setShowMenu(false) }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 text-gray-700"
                >
                  📁 {f.name}
                </button>
              ))}
              {conv.folderId && (
                <button
                  onClick={() => { onMove(conv._id, null); setShowMenu(false) }}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 text-gray-500"
                >
                  ↩️ ย้ายออกจากโฟลเดอร์
                </button>
              )}
              <hr className="my-1 border-gray-100" />
            </>
          )}
          <button
            onClick={() => { onDelete(conv._id); setShowMenu(false) }}
            className="w-full text-left px-3 py-1.5 text-sm hover:bg-red-50 text-red-500"
          >
            🗑️ ลบแชท
          </button>
        </div>
      )}
    </div>
  )
}
