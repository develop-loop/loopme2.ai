'use client'

import { useExplore, Column } from './useExplore'
import { FileCard } from './fileCard'
import { MilkdownEditorRef } from '../../components/MilkdownEditor'

const LoadingView = () => (
  <div className="min-h-[calc(100vh-80px)] w-full bg-gray-50 flex items-center justify-center overflow-hidden">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-500">Loading configuration...</p>
    </div>
  </div>
)

const ErrorView = ({ error }: { error: string }) => (
  <div className="min-h-[calc(100vh-80px)] w-full bg-gray-50 flex items-center justify-center overflow-hidden">
    <div className="text-center">
      <div className="rounded-md bg-red-50 p-4 max-w-md">
        <div className="text-sm text-red-700">
          <p className="font-medium mb-2">Configuration Error</p>
          <p>{error}</p>
        </div>
      </div>
    </div>
  </div>
)

interface ColumnComponentProps {
  column: Column
  index: number
  totalColumns: number
  savingFiles: Set<string>
  renamingFiles: Set<string>
  creatingFiles: Set<string>
  setEditorRef: (filePath: string) => (ref: MilkdownEditorRef | null) => void
  onSaveFile: (filePath: string, originalContent: string) => void
  onToggleExpansion: (filePath: string) => void
  onArchiveFile: (filePath: string) => void
  onRemoveWorkspace: (workspaceName: string) => void
  onRenameFile: (oldPath: string, newPath: string) => void
  onCreateNewFile: (workspaceName: string) => void
}

const ColumnComponent = ({ column, index, totalColumns, savingFiles, renamingFiles, creatingFiles, setEditorRef, onSaveFile, onToggleExpansion, onArchiveFile, onRemoveWorkspace, onRenameFile, onCreateNewFile }: ColumnComponentProps) => (
  <div
    key={column.title}
    className={`flex-1 overflow-y-auto bg-gray-50 overscroll-none ${
      index < totalColumns - 1 
        ? 'border-r lg:border-r border-gray-200 border-b lg:border-b-0' 
        : ''
    }`}
    style={{ overscrollBehavior: 'none' }}
  >
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{column.title}</h2>
      {column.cards.length > 0 ? (
        <div className="space-y-4">
          {column.cards.map((card, cardIndex) => (
            <FileCard
              key={cardIndex}
              card={card}
              cardIndex={cardIndex}
              savingFiles={savingFiles}
              renamingFiles={renamingFiles}
              setEditorRef={setEditorRef}
              onSaveFile={onSaveFile}
              onToggleExpansion={onToggleExpansion}
              onArchiveFile={onArchiveFile}
              onRenameFile={onRenameFile}
            />
          ))}
          
          {/* New Item Button */}
          <button
            onClick={() => onCreateNewFile(column.title)}
            disabled={creatingFiles.has(column.title)}
            className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors ${
              creatingFiles.has(column.title)
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
            }`}
          >
            <div className="flex flex-col items-center text-gray-500">
              {creatingFiles.has(column.title) ? (
                <>
                  <svg className="animate-spin w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm font-medium">Creating...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">New Item</span>
                </>
              )}
            </div>
          </button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 w-full">
            <p className="text-sm mb-3">No files in this workspace</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onCreateNewFile(column.title)}
                disabled={creatingFiles.has(column.title)}
                className={`w-full p-4 border-2 border-dashed rounded-lg transition-colors ${
                  creatingFiles.has(column.title)
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
                }`}
              >
                <div className="flex flex-col items-center text-gray-500">
                  {creatingFiles.has(column.title) ? (
                    <>
                      <svg className="animate-spin w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-sm font-medium">Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-sm font-medium">New Item</span>
                    </>
                  )}
                </div>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to remove the workspace "${column.title}"?`)) {
                    onRemoveWorkspace(column.title)
                  }
                }}
                className="w-full p-4 border-2 border-dashed rounded-lg transition-colors border-red-300 hover:border-red-400 hover:bg-red-50"
              >
                <div className="flex flex-col items-center text-red-600">
                  <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-sm font-medium">Remove Workspace</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)

export default function ExplorePage() {
  const { columns, loading, error, savingFiles, renamingFiles, creatingFiles, setEditorRef, handleSaveFile, toggleFileExpansion, handleArchiveFile, addNewColumn, removeWorkspace, handleRenameFile, createNewFile } = useExplore()

  const handleNewColumn = () => {
    const workspaceName = prompt('Enter new workspace name:')
    if (workspaceName && workspaceName.trim()) {
      addNewColumn(workspaceName.trim())
    }
  }

  if (loading) {
    return <LoadingView />
  }

  if (error) {
    return <ErrorView error={error} />
  }

  return (
    <div className="h-[calc(100vh-80px)] w-full bg-gray-50 flex flex-col lg:flex-row overflow-hidden relative">
      {columns.map((column, index) => (
        <ColumnComponent
          key={column.title}
          column={column}
          index={index}
          totalColumns={columns.length}
          savingFiles={savingFiles}
          renamingFiles={renamingFiles}
          creatingFiles={creatingFiles}
          setEditorRef={setEditorRef}
          onSaveFile={handleSaveFile}
          onToggleExpansion={toggleFileExpansion}
          onArchiveFile={handleArchiveFile}
          onRemoveWorkspace={removeWorkspace}
          onRenameFile={handleRenameFile}
          onCreateNewFile={createNewFile}
        />
      ))}
      
      {/* Floating New Workspace Button */}
      <button
        onClick={handleNewColumn}
        className="fixed top-24 right-6 z-10 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        title="Add new workspace"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Workspace
      </button>
    </div>
  )
}