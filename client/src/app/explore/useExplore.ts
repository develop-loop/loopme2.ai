import { useState, useEffect, useRef, useCallback } from 'react'
import { saveFile, renameFile, archiveFile, loadFileContent, countLines } from './utils'
import { filesService } from '../../services/FilesService'
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

export interface WorkspaceItem {
  name: string
  files?: string[]
}

export interface Column {
  title: string
  cards: Card[]
}

export interface ExploreConfig {
  columns: Column[]
  workspace?: WorkspaceItem[]
}

export const useExplore = () => {
  const [columns, setColumns] = useState<Column[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingFiles, setSavingFiles] = useState<Set<string>>(new Set())
  const [renamingFiles, setRenamingFiles] = useState<Set<string>>(new Set())
  const [creatingFiles, setCreatingFiles] = useState<Set<string>>(new Set())
  const editorRefs = useRef<Record<string, MilkdownEditorRef>>({})

  const setEditorRef = (filePath: string) => (ref: MilkdownEditorRef | null) => {
    if (ref) {
      editorRefs.current[filePath] = ref
    } else {
      delete editorRefs.current[filePath]
    }
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
      const { content, lineCount } = await loadFileContent(filePath)

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
    }
  }

  // Archive file from explore page and update explore.yaml
  const handleArchiveFile = async (filePath: string) => {
    try {
      // First, remove the file from frontend display immediately
      setColumns(prevColumns => 
        prevColumns.map(column => ({
          ...column,
          cards: column.cards.filter(card => card.title !== filePath)
        }))
      )

      // Use the archiveFile function from fileCard.ts
      await archiveFile(filePath)
      console.log(`File ${filePath} removed from explore configuration`)

    } catch (error) {
      console.error('Error archiving file:', error)
      // Restore the file if update failed
      await fetchConfig()
      alert(`Error archiving file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Remove workspace from explore page and update explore.yaml
  const removeWorkspace = async (workspaceName: string) => {
    try {
      // Get current explore.yaml content
      const response = await filesService.getFile('explore.yaml')
      if (!response.success || response.data.error_count > 0) {
        throw new Error('Failed to fetch explore.yaml')
      }

      const fileData = response.data.files[0]
      if (!fileData) {
        throw new Error('explore.yaml not found')
      }

      // Parse current YAML content
      let yamlContent = fileData.content
      if (fileData.encoding === 'base64') {
        yamlContent = atob(fileData.content)
      }

      // Remove workspace from YAML
      const modifiedYaml = removeWorkspaceFromYaml(yamlContent, workspaceName)

      // Update explore.yaml file
      const updateResponse = await filesService.saveFile({
        file_path: 'explore.yaml',
        content: modifiedYaml,
        encoding: 'text',
        commit_message: `Remove workspace "${workspaceName}" from explore configuration`,
        author_name: 'User',
        author_email: 'user@example.com'
      })

      if (!updateResponse.success) {
        throw new Error('Failed to update explore.yaml')
      }

      console.log(`Workspace "${workspaceName}" removed from explore configuration`)
      
      // Refresh the page data to remove the workspace
      await fetchConfig()

    } catch (error) {
      console.error('Error removing workspace:', error)
      alert(`Error removing workspace: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Rename file
  const handleRenameFile = async (oldPath: string, newPath: string) => {
    if (oldPath === newPath) return // No change needed

    try {
      setRenamingFiles(prev => new Set([...prev, oldPath]))

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

      // Use the renameFile function from fileCard.ts
      const result = await renameFile(oldPath, newPath)
      console.log(`File renamed from ${oldPath} to ${newPath}`, result)

      // Update explore.yaml to reflect the rename
      await updateExploreYamlFileReferences(oldPath, newPath)

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

  // Helper function to update file references in explore.yaml
  const updateExploreYamlFileReferences = async (oldPath: string, newPath: string) => {
    try {
      const response = await filesService.getFile('explore.yaml')
      if (!response.success || response.data.error_count > 0) return // If explore.yaml doesn't exist, skip update

      const fileData = response.data.files[0]
      if (!fileData) return

      let yamlContent = fileData.content
      if (fileData.encoding === 'base64') {
        yamlContent = atob(fileData.content)
      }

      // Update file references in YAML
      const updatedYaml = yamlContent.replace(
        new RegExp(`(\\s*-\\s*['"]?)${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(['"]?)`, 'g'),
        `$1${newPath}$2`
      )

      if (updatedYaml !== yamlContent) {
        await filesService.saveFile({
          file_path: 'explore.yaml',
          content: updatedYaml,
          encoding: 'text',
          commit_message: `Update file reference from ${oldPath} to ${newPath}`,
          author_name: 'User',
          author_email: 'user@example.com'
        })
      }
    } catch (error) {
      console.error('Error updating explore.yaml:', error)
    }
  }

  // Create new file in a specific workspace
  const createNewFile = async (workspaceName: string) => {
    try {
      setCreatingFiles(prev => new Set([...prev, workspaceName]))

      // Read draftPath from settings.yaml
      let draftPath = './drafts' // default fallback
      try {
        const settingsResponse = await filesService.getFile('settings.yaml')
        if (settingsResponse.success && settingsResponse.data.error_count === 0) {
          const settingsData = settingsResponse.data.files[0]
          if (settingsData && settingsData.content) {
            let yamlContent = settingsData.content
            if (settingsData.encoding === 'base64') {
              yamlContent = atob(settingsData.content)
            }
            
            // Parse draftPath from YAML
            const lines = yamlContent.split('\n')
            for (const line of lines) {
              const trimmed = line.trim()
              if (trimmed.startsWith('draftPath:')) {
                const value = trimmed.split('draftPath:')[1]?.trim().replace(/['"`]/g, '') || ''
                if (value) {
                  draftPath = value
                }
                break
              }
            }
          }
        }
      } catch (error) {
        console.warn('Could not read settings.yaml, using default draftPath:', error)
      }

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

      // Create the new file
      const createResponse = await filesService.saveFile({
        file_path: filePath,
        content: defaultContent,
        encoding: 'text',
        commit_message: `Create new file ${fileName}`,
        author_name: 'User',
        author_email: 'user@example.com'
      })

      if (!createResponse.success) {
        throw new Error('Failed to create file')
      }

      console.log(`New file created: ${filePath}`)

      // Add the new file to the specified workspace in explore.yaml
      await addFileToWorkspace(workspaceName, filePath)

      // Refresh the page data to show the new file
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

  // Helper function to add a file to a specific workspace in explore.yaml
  const addFileToWorkspace = async (workspaceName: string, filePath: string) => {
    try {
      console.log(`Adding file ${filePath} to workspace ${workspaceName}`)
      
      const response = await filesService.getFile('explore.yaml')
      if (!response.success || response.data.error_count > 0) {
        console.log('explore.yaml not found, skipping update')
        return
      }

      const fileData = response.data.files[0]
      if (!fileData) {
        console.log('Error reading explore.yaml')
        return
      }

      let yamlContent = fileData.content
      if (fileData.encoding === 'base64') {
        yamlContent = atob(fileData.content)
      }

      console.log('Original YAML content:', yamlContent)

      // Add file to the specified workspace
      const updatedYaml = addFileToYamlWorkspace(yamlContent, workspaceName, filePath)
      
      console.log('Updated YAML content:', updatedYaml)

      if (updatedYaml !== yamlContent) {
        console.log('YAML content changed, updating file')
        const updateResponse = await filesService.saveFile({
          file_path: 'explore.yaml',
          content: updatedYaml,
          encoding: 'text',
          commit_message: `Add new file ${filePath} to workspace ${workspaceName}`,
          author_name: 'User',
          author_email: 'user@example.com'
        })
        
        if (!updateResponse.success) {
          console.error('Failed to update explore.yaml')
        } else {
          console.log('Successfully updated explore.yaml')
        }
      } else {
        console.log('YAML content unchanged, no update needed')
      }
    } catch (error) {
      console.error('Error updating explore.yaml:', error)
    }
  }

  // Helper function to add a file to a specific workspace in YAML content
  const addFileToYamlWorkspace = (yamlContent: string, workspaceName: string, filePath: string): string => {
    const lines = yamlContent.split('\n')
    const result: string[] = []
    let inTargetWorkspace = false
    let inFilesSection = false
    let fileAdded = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      // Check if this is the target workspace
      if (line.startsWith('  - name:')) {
        const currentWorkspaceName = trimmed.split('name:')[1]?.trim().replace(/['"`]/g, '') || ''
        
        // If we were in target workspace and haven't added file yet, add it now
        if (inTargetWorkspace && inFilesSection && !fileAdded) {
          result.push(`      - "${filePath}"`)
          fileAdded = true
        }
        
        inTargetWorkspace = currentWorkspaceName === workspaceName
        inFilesSection = false
        result.push(line)
        continue
      }

      // Check for files section in target workspace
      if (inTargetWorkspace && line.startsWith('    files:')) {
        inFilesSection = true
        result.push(line)
        continue
      }

      // If we're leaving the files section or workspace, add the file if we haven't yet
      if (inTargetWorkspace && inFilesSection && !fileAdded) {
        // Check if we're leaving the files section
        if (line.trim() && !line.startsWith('      - ') && !line.startsWith('    files:')) {
          result.push(`      - "${filePath}"`)
          fileAdded = true
          inFilesSection = false
        }
      }

      result.push(line)
    }

    // If we're still in the target workspace at the end and haven't added the file, add it now
    if (inTargetWorkspace && inFilesSection && !fileAdded) {
      result.push(`      - "${filePath}"`)
    }

    return result.join('\n')
  }

  // Add new column to explore page and update explore.yaml
  const addNewColumn = async (columnName: string) => {
    try {
      // Get current explore.yaml content
      const response = await filesService.getFile('explore.yaml')
      if (!response.success || response.data.error_count > 0) {
        throw new Error('Failed to fetch explore.yaml')
      }

      const fileData = response.data.files[0]
      if (!fileData) {
        throw new Error('explore.yaml not found')
      }

      // Parse current YAML content
      let yamlContent = fileData.content
      if (fileData.encoding === 'base64') {
        yamlContent = atob(fileData.content)
      }

      // Add new workspace item to YAML
      const modifiedYaml = addColumnToYaml(yamlContent, columnName)

      // Update explore.yaml file
      const updateResponse = await filesService.saveFile({
        file_path: 'explore.yaml',
        content: modifiedYaml,
        encoding: 'text',
        commit_message: `Add new column "${columnName}" to explore configuration`,
        author_name: 'User',
        author_email: 'user@example.com'
      })

      if (!updateResponse.success) {
        throw new Error('Failed to update explore.yaml')
      }

      console.log(`New column "${columnName}" added to explore configuration`)
      
      // Refresh the page data to show the new column
      await fetchConfig()

    } catch (error) {
      console.error('Error adding new column:', error)
      alert(`Error adding new column: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Helper function to remove workspace from YAML content
  const removeWorkspaceFromYaml = (yamlContent: string, workspaceNameToRemove: string): string => {
    const lines = yamlContent.split('\n')
    const result: string[] = []
    let skipWorkspace = false
    let workspaceIndent = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      // Check if this is a workspace name line
      if (line.startsWith('  - name:')) {
        const workspaceName = trimmed.split('name:')[1]?.trim().replace(/['\"]/g, '') || ''
        
        if (workspaceName === workspaceNameToRemove) {
          // Start skipping this workspace
          skipWorkspace = true
          workspaceIndent = line.search(/\S/)
          continue
        } else {
          // This is a different workspace, stop skipping
          skipWorkspace = false
          result.push(line)
          continue
        }
      }
      
      // If we're skipping a workspace, check if we should stop
      if (skipWorkspace) {
        const currentIndent = line.search(/\S/)
        
        // If we hit another workspace item or section at the same or lower indent level, stop skipping
        if (line.trim() && currentIndent <= workspaceIndent) {
          skipWorkspace = false
          result.push(line)
        }
        // Otherwise, keep skipping (this line belongs to the workspace we're removing)
        continue
      }
      
      // Add the line if we're not skipping
      result.push(line)
    }
    
    return result.join('\n')
  }

  // Helper function to add new column to YAML content
  const addColumnToYaml = (yamlContent: string, columnName: string): string => {
    const lines = yamlContent.split('\n')
    const result: string[] = []
    let workspaceFound = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      // Find the workspace section
      if (line.startsWith('workspace:')) {
        workspaceFound = true
        result.push(line)
        continue
      }

      // If we're in workspace section and hit end of file or new section
      if (workspaceFound && (i === lines.length - 1 || (line.trim() && !line.startsWith(' ')))) {
        // Add new workspace item before this line (if not end of file)
        if (i < lines.length - 1) {
          result.push(`  - name: "${columnName}"`)
          result.push(`    files: []`)
          result.push(line)
        } else {
          // End of file, add new workspace item
          result.push(line)
          result.push(`  - name: "${columnName}"`)
          result.push(`    files: []`)
        }
        workspaceFound = false
        continue
      }

      result.push(line)
    }

    // If workspace section wasn't found or we're at the end, add new item
    if (workspaceFound) {
      result.push(`  - name: "${columnName}"`)
      result.push(`    files: []`)
    }

    return result.join('\n')
  }

  // Get badge color based on file extension
  const getBadgeColor = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const colorMap: Record<string, string> = {
      'yaml': 'bg-blue-100 text-blue-800',
      'yml': 'bg-blue-100 text-blue-800',
      'json': 'bg-green-100 text-green-800',
      'md': 'bg-purple-100 text-purple-800',
      'txt': 'bg-gray-100 text-gray-800',
      'js': 'bg-yellow-100 text-yellow-800',
      'ts': 'bg-indigo-100 text-indigo-800',
      'log': 'bg-red-100 text-red-800',
      'csv': 'bg-orange-100 text-orange-800'
    }
    return colorMap[ext || ''] || 'bg-slate-100 text-slate-800'
  }

  // Simple YAML parser for workspace structure
  const parseYAML = (yamlString: string): ExploreConfig => {
    try {
      const lines = yamlString.split('\n')
      const result: ExploreConfig = { columns: [], workspace: [] }
      let currentWorkspaceItem: WorkspaceItem | null = null
      let inFilesSection = false
      
      for (const line of lines) {
        const trimmed = line.trim()
        
        if (trimmed.startsWith('workspace:')) {
          continue
        }
        
        // New workspace item
        if (line.startsWith('  - name:')) {
          if (currentWorkspaceItem) {
            result.workspace!.push(currentWorkspaceItem)
          }
          currentWorkspaceItem = {
            name: trimmed.split('name:')[1]?.trim().replace(/['\"]/g, '') || '',
            files: []
          }
          inFilesSection = false
          continue
        }
        
        // Files section start
        if (line.startsWith('    files:') && currentWorkspaceItem) {
          inFilesSection = true
          continue
        }
        
        // File items
        if (inFilesSection && line.startsWith('      - ') && currentWorkspaceItem) {
          const fileName = trimmed.substring(2).replace(/['\"]/g, '')
          currentWorkspaceItem.files = currentWorkspaceItem.files || []
          currentWorkspaceItem.files.push(fileName)
          continue
        }
        
        // End of files section if we hit another workspace item or different section
        if (line.startsWith('  - ') && !line.includes('name:')) {
          inFilesSection = false
        }
      }
      
      // Add the last workspace item
      if (currentWorkspaceItem) {
        result.workspace!.push(currentWorkspaceItem)
      }
      
      return result
    } catch (err) {
      console.error('YAML parsing error:', err)
      return { columns: [], workspace: [] }
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
      
      // Use the saveFile function from fileCard.ts
      const result = await saveFile(filePath, contentToSave)
      console.log(`File saved successfully:`, result)
      
      // Update line count after successful save
      updateFileLineCount(filePath, contentToSave)
      
      alert(`File saved successfully: ${filePath}`)
      
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
      
      const response = await filesService.getFile('explore.yaml')
      
      if (!response.success || response.data.error_count > 0) {
        throw new Error('Failed to load explore.yaml')
      }
      
      const fileData = response.data.files[0]
      if (!fileData) {
        throw new Error('explore.yaml not found')
      }
      
      // Parse YAML content
      let configData: ExploreConfig
      if (fileData.encoding === 'text') {
        // For text encoding, parse the YAML content
        configData = parseYAML(fileData.content)
      } else {
        // For base64 encoding, decode first then parse
        const yamlContent = atob(fileData.content)
        configData = parseYAML(yamlContent)
      }
      
      // Convert workspace data to columns without loading file content initially
      const workspaceColumns = (configData.workspace || []).map(item => ({
        title: item.name,
        cards: (item.files || []).map((filename) => ({
          title: filename,
          description: undefined,
          lineCount: undefined,
          badgeColor: getBadgeColor(filename),
          isFileContent: true,
          fileType: filename.split('.').pop()?.toLowerCase() || 'txt',
          isExpanded: false,
          isLoaded: false,
          isLoading: false
        }))
      }))
      
      setColumns(workspaceColumns)
    } catch (err) {
      console.error('Error fetching explore config:', err)
      setError(err instanceof Error ? err.message : 'Failed to load configuration')
      
      // Fallback to default columns if API fails
      setColumns([])
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
    setEditorRef,
    handleSaveFile,
    toggleFileExpansion,
    handleArchiveFile,
    addNewColumn,
    removeWorkspace,
    handleRenameFile,
    createNewFile
  }
}