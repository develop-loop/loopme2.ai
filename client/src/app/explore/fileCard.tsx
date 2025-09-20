'use client'

import { useState } from 'react'
import { Card } from './useExplore'

// Component interfaces
export interface SaveButtonProps {
  isFileContent: boolean
  isSaving: boolean
  onSave: () => void
  filePath: string
}

export interface ArchiveButtonProps {
  isFileContent: boolean
  onArchive: () => void
  filePath: string
}

export interface EditableFileNameProps {
  fileName: string
  onRename: (newName: string) => void
  isRenaming: boolean
  isSaving?: boolean
}

export interface FileCardProps {
  card: Card
  cardIndex: number
  savingFiles: Set<string>
  renamingFiles: Set<string>
  setEditorRef: (filePath: string) => (ref: HTMLElement | null) => void
  onSaveFile: (filePath: string, originalContent: string) => void
  onToggleExpansion: (filePath: string) => void
  onArchiveFile: (filePath: string) => void
  onRenameFile: (oldPath: string, newPath: string) => void
}

export const SaveButton = ({ isFileContent, isSaving, onSave }: SaveButtonProps) => {
  if (!isFileContent) return null

  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
        isSaving
          ? 'text-gray-500 bg-gray-100 border border-gray-200 cursor-not-allowed'
          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
      }`}
      title={isSaving ? 'Saving...' : 'Save file'}
    >
      {isSaving ? (
        <>
          <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving...
        </>
      ) : (
        <>
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Save
        </>
      )}
    </button>
  )
}

export const ArchiveButton = ({ isFileContent, onArchive, filePath }: ArchiveButtonProps) => {
  if (!isFileContent) return null

  const handleClick = () => {
    if (confirm(`Are you sure you want to archive "${filePath}"? This will remove it from the explore page.`)) {
      onArchive()
    }
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      title="Archive file from explore page"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.750 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
      Archive
    </button>
  )
}

export const EditableFileName = ({ fileName, onRename, isRenaming, isSaving = false }: EditableFileNameProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(fileName)

  const handleSubmit = () => {
    if (editValue.trim() && editValue !== fileName) {
      onRename(editValue.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'Escape') {
      setEditValue(fileName)
      setIsEditing(false)
    }
  }

  const handleBlur = () => {
    handleSubmit()
  }

  if (isEditing) {
    return (
      <input
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="w-full font-medium text-base text-gray-900 bg-transparent border-none outline-none px-1 py-0.5"
        autoFocus
        disabled={isRenaming || isSaving}
      />
    )
  }

  return (
    <h3 
      className="w-full font-medium text-base text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors truncate"
      onClick={() => {
        if (!isRenaming && !isSaving) {
          setEditValue(fileName)
          setIsEditing(true)
        }
      }}
      title="Click to rename file"
    >
      {isRenaming || isSaving ? (
        <span className="inline-flex items-center">
          <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {fileName}
        </span>
      ) : (
        fileName
      )}
    </h3>
  )
}

// Simple text editor component as fallback until MilkdownEditor is available
const SimpleTextEditor = ({ content, onChange, className }: { content: string, onChange?: (content: string) => void, className?: string }) => {
  return (
    <textarea
      value={content}
      onChange={(e) => onChange?.(e.target.value)}
      className={`w-full h-40 p-3 border border-gray-300 rounded-md font-mono text-sm resize-vertical ${className}`}
      placeholder="File content..."
    />
  )
}

export const FileCard = ({ card, cardIndex, savingFiles, renamingFiles, onSaveFile, onToggleExpansion, onArchiveFile, onRenameFile }: FileCardProps) => (
  <div key={cardIndex} className="bg-white rounded-lg shadow p-4">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center space-x-2 flex-1">
        <button
          onClick={() => onToggleExpansion(card.title)}
          className="flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors flex-shrink-0"
          title={card.isExpanded ? 'Collapse file' : 'Expand file'}
        >
          {card.isLoading ? (
            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : card.isExpanded ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
          )}
        </button>
        <div className="flex-1 min-w-0">
          <EditableFileName
            fileName={card.title}
            onRename={(newName) => onRenameFile(card.title, newName)}
            isRenaming={renamingFiles.has(card.title)}
            isSaving={savingFiles.has(card.title)}
          />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {card.lineCount !== undefined && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${card.badgeColor}`}>
            {card.lineCount} lines
          </span>
        )}
        <ArchiveButton
          isFileContent={!!card.isFileContent}
          onArchive={() => onArchiveFile(card.title)}
          filePath={card.title}
        />
        {card.isExpanded && (
          <SaveButton
            isFileContent={!!card.isFileContent}
            isSaving={savingFiles.has(card.title)}
            onSave={() => onSaveFile(card.title, card.description || '')}
            filePath={card.title}
          />
        )}
      </div>
    </div>
    {card.isExpanded && card.description && (
      <div className="text-sm">
        {card.isFileContent ? (
          // Using simple text editor for now - can be replaced with MilkdownEditor when available
          <SimpleTextEditor
            content={card.description}
            className="mt-2"
          />
        ) : (
          <p className="text-gray-600">{card.description}</p>
        )}
      </div>
    )}
  </div>
)