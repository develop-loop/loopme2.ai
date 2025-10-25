'use client'

import { useState } from 'react'
import { Card } from './useExplore'
import MilkdownEditor, { MilkdownEditorRef } from '../../components/MilkdownEditor'


// Component interfaces
export interface SaveButtonProps {
  isFileContent: boolean
  isSaving: boolean
  isSaved: boolean
  onSave: () => void
  filePath: string
}


export interface ArchiveButtonProps {
  isFileContent: boolean
  onArchive: () => void
  filePath: string
}

export interface TransferButtonProps {
  isFileContent: boolean
  onTransfer: (targetWorkspace: string) => void
  filePath: string
  availableWorkspaces: string[]
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
  savedFiles: Set<string>
  editingFiles: Set<string>
  setEditorRef: (filePath: string) => (ref: MilkdownEditorRef | null) => void
  onSaveFile: (filePath: string, originalContent: string) => void
  onFileEdit: (filePath: string) => void
  onToggleExpansion: (filePath: string) => void
  onArchiveFile: (filePath: string) => void
  onRenameFile: (oldPath: string, newPath: string) => void
  onTransferFile: (filePath: string, targetWorkspace: string) => void
  availableWorkspaces: string[]
}


export const SaveButton = ({ isFileContent, isSaving, isSaved, onSave }: SaveButtonProps) => {
  if (!isFileContent) return null

  return (
    <button
      onClick={onSave}
      disabled={isSaving || isSaved}
      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
        isSaving
          ? 'text-gray-500 bg-gray-100 border border-gray-200 cursor-not-allowed'
          : isSaved
          ? 'text-green-700 bg-green-100 border border-green-200 cursor-default'
          : 'text-white bg-indigo-600 border border-indigo-600 hover:bg-indigo-700'
      }`}
      title={isSaving ? 'Saving...' : isSaved ? 'Saved successfully' : 'Save file'}
    >
      {isSaving ? (
        <>
          <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving...
        </>
      ) : isSaved ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          Saved
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
          </svg>
          Save
        </>
      )}
    </button>
  )
}

export const TransferButton = ({ isFileContent, onTransfer, availableWorkspaces }: TransferButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showNewWorkspace, setShowNewWorkspace] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')

  if (!isFileContent) return null

  const handleNewWorkspaceSubmit = () => {
    if (newWorkspaceName.trim()) {
      onTransfer(newWorkspaceName.trim())
      setIsOpen(false)
      setShowNewWorkspace(false)
      setNewWorkspaceName('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNewWorkspaceSubmit()
    } else if (e.key === 'Escape') {
      setShowNewWorkspace(false)
      setNewWorkspaceName('')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        title="Transfer file to another workspace"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 mr-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        Transfer
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 ml-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            {/* Existing workspaces */}
            {availableWorkspaces.map((workspace) => (
              <button
                key={workspace}
                onClick={() => {
                  onTransfer(workspace)
                  setIsOpen(false)
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                {workspace}
              </button>
            ))}
            
            {/* Separator if there are existing workspaces */}
            {availableWorkspaces.length > 0 && (
              <div className="border-t border-gray-200 my-1"></div>
            )}
            
            {/* New workspace option */}
            {!showNewWorkspace ? (
              <button
                onClick={() => setShowNewWorkspace(true)}
                className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 hover:text-green-900 transition-colors font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 inline mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Workspace...
              </button>
            ) : (
              <div className="px-4 py-2">
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter workspace name"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => {
                      setShowNewWorkspace(false)
                      setNewWorkspaceName('')
                    }}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNewWorkspaceSubmit}
                    disabled={!newWorkspaceName.trim()}
                    className="px-2 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false)
            setShowNewWorkspace(false)
            setNewWorkspaceName('')
          }}
        />
      )}
    </div>
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


// Enhanced text editor using MilkdownEditor
const EnhancedTextEditor = ({ 
  content, 
  fileType, 
  className, 
  editorRef,
  onEdit
}: { 
  content: string
  fileType?: string
  className?: string
  editorRef?: (ref: MilkdownEditorRef | null) => void
  onEdit?: () => void
}) => {
  return (
    <div onClick={onEdit}>
      <MilkdownEditor
        ref={editorRef}
        content={content}
        fileType={fileType}
        readOnly={false}
        className={className}
      />
    </div>
  )
}

export const FileCard = ({ card, cardIndex, savingFiles, renamingFiles, savedFiles, setEditorRef, onSaveFile, onFileEdit, onToggleExpansion, onArchiveFile, onRenameFile, onTransferFile, availableWorkspaces }: FileCardProps) => (
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
          <TransferButton
            isFileContent={!!card.isFileContent}
            onTransfer={(targetWorkspace) => onTransferFile(card.title, targetWorkspace)}
            filePath={card.title}
            availableWorkspaces={availableWorkspaces}
          />
          <ArchiveButton
            isFileContent={!!card.isFileContent}
            onArchive={() => onArchiveFile(card.title)}
            filePath={card.title}
          />
          {card.isExpanded && (
            <SaveButton
              isFileContent={!!card.isFileContent}
              isSaving={savingFiles.has(card.title)}
              isSaved={savedFiles.has(card.title)}
              onSave={() => onSaveFile(card.title, card.description || '')}
              filePath={card.title}
            />
          )}
        </div>
      </div>
      {card.isExpanded && card.description && (
        <div className="text-sm">
          {card.isFileContent ? (
            // Using enhanced MilkdownEditor for file content editing
            <EnhancedTextEditor
              content={card.description}
              fileType={card.fileType}
              className="mt-2"
              editorRef={setEditorRef(card.title)}
              onEdit={() => onFileEdit(card.title)}
            />
          ) : (
            <p className="text-gray-600">{card.description}</p>
          )}
        </div>
      )}
    </div>
)