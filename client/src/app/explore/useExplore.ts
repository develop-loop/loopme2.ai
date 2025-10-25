import { useState, useEffect, useRef, useCallback } from 'react'
import { saveFile, renameFile, archiveFile, loadFileContent, countLines } from './utils'
import { v1FilesService } from '../../services/V1FilesService'
import { v1WorkspaceService } from '../../services/V1WorkspaceService'
import { clientStorageService } from '../../services/ClientStorageService'
import { MilkdownEditorRef } from '../../components/MilkdownEditor'

export interface Card {
  title: string
  description?: string
  lineCount?: number
  badgeColor?: string
  isFileContent?: boolean
  fileType?: string
  isExpanded?: boolean
  isLoaded?: boolean
  isLoading?: boolean
}

export interface Column {
  title: string
  cards: Card[]
}

export const useExplore = () => {
  const [columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingFiles, setSavingFiles] = useState<Set<string>>(new Set())
  const [renamingFiles, setRenamingFiles] = useState<Set<string>>(new Set())
  const [creatingFiles, setCreatingFiles] = useState<Set<string>>(new Set())
  const [savedFiles, setSavedFiles] = useState<Set<string>>(new Set())
  const [editingFiles, setEditingFiles] = useState<Set<string>>(new Set())
  const [allWorkspaces, setAllWorkspaces] = useState<string[]>([])
  const editorRefs = useRef<Record<string, MilkdownEditorRef>>({})

  const setEditorRef = (filePath: string) => (ref: MilkdownEditorRef | null) => {
    if (ref) {
      editorRefs.current[filePath] = ref
    } else {
      delete editorRefs.current[filePath]
    }
  }

  // Mark file as being edited
  const handleFileEdit = (filePath: string) => {
    setEditingFiles(prev => new Set([...prev, filePath]))
    setSavedFiles(prev => {
      const newSet = new Set(prev)
      newSet.delete(filePath)
      return newSet
    })
  }

  // Get available workspaces for transfer (excluding current workspace)
  const getAvailableWorkspacesForFile = (filePath: string): string[] => {
    const currentWorkspace = columns.find(col => 
      col.cards.some(card => card.title === filePath)
    )?.title

    if (!currentWorkspace) {
      return allWorkspaces
    }

    return allWorkspaces.filter(ws => ws !== currentWorkspace)
  }

  // Update line count for a specific file
  const updateFileLineCount = (filePath: string, content: string) => {
    const newLineCount = countLines(content)
    setColumns(prevColumns => 
      prevColumns.map(column => ({
        ...column,
        cards: column.cards.map(card => 
          card.title === filePath 
            ? { ...card, lineCount: newLineCount }
            : card
        )
      }))
    )
  }

  // Load single file content
  const loadSingleFileContent = async (filePath: string) => {
    // Set loading state
    setColumns(prevColumns => 
      prevColumns.map(column => ({
        ...column,
        cards: column.cards.map(card => 
          card.title === filePath 
            ? { ...card, isLoading: true }
            : card
        )
      }))
    )

    try {
      const result = await loadFileContent(filePath)
      const { content, lineCount } = result

      // Update the card with loaded content
      setColumns(prevColumns => 
        prevColumns.map(column => ({
          ...column,
          cards: column.cards.map(card => 
            card.title === filePath 
              ? { 
                  ...card, 
                  description: content,
                  lineCount: lineCount,
                  isLoaded: true,
                  isLoading: false
                }
              : card
          )
        }))
      )

    } catch (error) {
      console.error(`Error loading file ${filePath}:`, error)
      
      // Update with error state
      setColumns(prevColumns => 
        prevColumns.map(column => ({
          ...column,
          cards: column.cards.map(card => 
            card.title === filePath 
              ? { 
                  ...card, 
                  description: 'Error loading file',
                  lineCount: 0,
                  isLoaded: true,
                  isLoading: false
                }
              : card
          )
        }))
      )
    }
  }

  // Toggle file expansion
  const toggleFileExpansion = async (filePath: string) => {
    const currentCard = columns
      .flatMap(col => col.cards)
      .find(card => card.title === filePath)

    if (!currentCard) return

    if (currentCard.isExpanded) {
      // Collapse file
      setColumns(prevColumns => 
        prevColumns.map(column => ({
          ...column,
          cards: column.cards.map(card => 
            card.title === filePath 
              ? { ...card, isExpanded: false }
              : card
          )
        }))
      )
    } else {
      // Expand file
      setColumns(prevColumns => 
        prevColumns.map(column => ({
          ...column,
          cards: column.cards.map(card => 
            card.title === filePath 
              ? { ...card, isExpanded: true }
              : card
          )
        }))
      )

      // Always reload content when expanding to ensure we have the latest version
      if (!currentCard.isLoading) {
        await loadSingleFileContent(filePath)
      }

      // Clear saved state when expanding file (user might want to edit again)
      setSavedFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(filePath)
        return newSet
      })
    }
  }

  // Archive file by removing workspace frontmatter
  const handleArchiveFile = async (filePath: string) => {
    try {
      // First, remove the file from frontend display immediately
      setColumns(prevColumns => 
        prevColumns.map(column => ({
          ...column,
          cards: column.cards.filter(card => card.title !== filePath)
        }))
      )

      // Use the archiveFile function to remove workspace frontmatter
      await archiveFile(filePath)
      console.log(`File ${filePath} archived by removing workspace frontmatter`)

      // Refresh the page data to show the updated state
      await fetchConfig()

    } catch (error) {
      console.error('Error archiving file:', error)
      // Restore the file if update failed
      await fetchConfig()
      alert(`Error archiving file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }


  // Transfer file to another workspace
  const handleTransferFile = async (filePath: string, targetWorkspace: string) => {
    try {
      // Check if it's a markdown file and use appropriate service
      if (filePath.endsWith('.md') || filePath.endsWith('.markdown')) {
        // For markdown files, update the workspace in frontmatter
        const updateResponse = await v1FilesService.updateWorkspace(
          filePath,
          targetWorkspace,
          `Transfer ${filePath} to ${targetWorkspace} workspace`,
          'User',
          'user@example.com'
        )

        if (!updateResponse.success) {
          throw new Error('Failed to transfer markdown file')
        }

        console.log(`Markdown file ${filePath} transferred to workspace ${targetWorkspace}`)
      } else {
        // For non-markdown files, we'll need to handle this through YAML updates
        // This is a simplified approach - in practice you might want a dedicated API
        alert('Transfer of non-markdown files is not currently supported. Only markdown files can be transferred between workspaces.')
        return
      }

      // Refresh the page data to reflect the transfer
      await fetchConfig()

    } catch (error) {
      console.error('Error transferring file:', error)
      alert(`Error transferring file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Rename file
  const handleRenameFile = async (oldPath: string, newPath: string) => {
    if (oldPath === newPath) return // No change needed

    try {
      setRenamingFiles(prev => new Set([...prev, oldPath]))

      // Find the workspace for this file
      const currentCard = columns
        .flatMap(col => col.cards)
        .find(card => card.title === oldPath)
      
      const workspace = columns.find(col => 
        col.cards.some(card => card.title === oldPath)
      )?.title

      if (!workspace) {
        throw new Error('Could not find workspace for file')
      }

      // Immediately update the UI to show the new name while processing
      setColumns(prevColumns => 
        prevColumns.map(column => ({
          ...column,
          cards: column.cards.map(card => 
            card.title === oldPath 
              ? { ...card, title: newPath }
              : card
          )
        }))
      )

      // Update renamingFiles to track the new path since UI now shows new name
      setRenamingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(oldPath)
        newSet.add(newPath)
        return newSet
      })

      // Use the renameFile function with workspace
      const result = await renameFile(oldPath, newPath, workspace)
      console.log(`File renamed from ${oldPath} to ${newPath}`, result)


      // Update the editor refs to use the new path
      const editorRef = editorRefs.current[oldPath]
      if (editorRef) {
        editorRefs.current[newPath] = editorRef
        delete editorRefs.current[oldPath]
      }

    } catch (error) {
      console.error('Error renaming file:', error)
      
      // Revert the UI change on error
      setColumns(prevColumns => 
        prevColumns.map(column => ({
          ...column,
          cards: column.cards.map(card => 
            card.title === newPath 
              ? { ...card, title: oldPath }
              : card
          )
        }))
      )
      
      // Revert renamingFiles state to use old path
      setRenamingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(newPath)
        newSet.add(oldPath)
        return newSet
      })
      
      alert(`Error renaming file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setRenamingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(newPath) // Clean up the new path since that's what we're tracking now
        newSet.delete(oldPath) // Also clean up old path in case of error rollback
        return newSet
      })
    }
  }


  // Create new file in a specific workspace
  const createNewFile = async (workspaceName: string) => {
    try {
      setCreatingFiles(prev => new Set([...prev, workspaceName]))

      // Read draftPath from localStorage settings
      const settings = clientStorageService.getExploreSettings()
      const draftPath = settings.draftPath

      // Generate timestamp-based filename
      const now = new Date()
      const timestamp = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0')
      
      const fileName = `${timestamp}.md`
      const filePath = `${draftPath}/${fileName}`.replace(/\/+/g, '/') // normalize slashes

      // Default content for new markdown file
      const defaultContent = `# New Document

Created on ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}

---

Your content here...
`

      // Create the new markdown file using V1 API with workspace in frontmatter
      const createResponse = await v1FilesService.saveMarkdownWithWorkspace(
        filePath,
        defaultContent,
        workspaceName,
        `Create new file ${fileName}`,
        'User',
        'user@example.com'
      )

      if (!createResponse.success) {
        throw new Error('Failed to create file')
      }

      console.log(`New file created: ${filePath}`)

      // Refresh the page data to show the new file (V1 workspace API will pick up the new file automatically)
      await fetchConfig()

    } catch (error) {
      console.error('Error creating new file:', error)
      alert(`Error creating new file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreatingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(workspaceName)
        return newSet
      })
    }
  }






  const handleSaveFile = async (filePath: string, originalContent: string) => {
    try {
      setSavingFiles(prev => new Set([...prev, filePath]))
      
      // Get content from editor ref if available, otherwise use original content
      let contentToSave = originalContent
      const editorRef = editorRefs.current[filePath]
      if (editorRef) {
        contentToSave = editorRef.getContent()
      }
      
      // Find the workspace for this file
      const workspace = columns.find(col => 
        col.cards.some(card => card.title === filePath)
      )?.title

      if (!workspace) {
        throw new Error('Could not find workspace for file')
      }
      
      // Use the saveFile function with workspace
      const result = await saveFile(filePath, contentToSave, workspace)
      console.log(`File saved successfully:`, result)
      
      // Update line count after successful save
      updateFileLineCount(filePath, contentToSave)
      
      // Mark file as saved and remove from editing state
      setSavedFiles(prev => new Set([...prev, filePath]))
      setEditingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(filePath)
        return newSet
      })
      
    } catch (error) {
      console.error('Error saving file:', error)
      alert(`Error saving file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSavingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(filePath)
        return newSet
      })
    }
  }

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Use V1 Workspace API instead of reading turbome.yaml directly
      const response = await v1WorkspaceService.getWorkspaces()
      
      if (!response.success) {
        throw new Error('Failed to load workspaces')
      }
      
      // Convert V1 workspace data to columns format
      const workspaceColumns = v1WorkspaceService.transformToExploreColumns(response.data.workspaces)
      
      // Extract all workspace names for transfer dropdown
      const workspaceNames = response.data.workspaces.map(ws => ws.workspace)
      
      setColumns(workspaceColumns)
      setAllWorkspaces(workspaceNames)
    } catch (err) {
      console.error('Error fetching workspace config:', err)
      setError(err instanceof Error ? err.message : 'Failed to load workspace configuration')
      
      // Fallback to default columns if API fails
      setColumns([])
      setAllWorkspaces([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    columns,
    loading,
    error,
    savingFiles,
    renamingFiles,
    creatingFiles,
    savedFiles,
    editingFiles,
    setEditorRef,
    handleSaveFile,
    handleFileEdit,
    toggleFileExpansion,
    handleArchiveFile,
    handleRenameFile,
    handleTransferFile,
    getAvailableWorkspacesForFile,
    createNewFile
  }
}