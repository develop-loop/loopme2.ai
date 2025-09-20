import { filesService } from '../../services/FilesService'

// File operations using new FilesService
export const saveFile = async (filePath: string, content: string) => {
  const response = await filesService.saveFile({
    file_path: filePath,
    content: content,
    encoding: 'text',
    commit_message: `Update ${filePath}`,
    author_name: 'User',
    author_email: 'user@example.com'
  })

  if (!response.success) {
    throw new Error('Failed to save file')
  }

  return response
}

export const renameFile = async (oldPath: string, newPath: string) => {
  // Get current file content
  const response = await filesService.getFile(oldPath)
  if (!response.success || response.data.error_count > 0) {
    throw new Error('Failed to fetch file content')
  }

  const fileData = response.data.files[0]
  if (!fileData) {
    throw new Error('File not found')
  }

  // Get file content
  let fileContent = fileData.content
  if (fileData.encoding === 'base64') {
    fileContent = atob(fileData.content)
  }

  // Rename the file using save with previous_path
  const renameResponse = await filesService.saveFile({
    file_path: newPath,
    content: fileContent,
    encoding: 'text',
    previous_path: oldPath,
    commit_message: `Rename ${oldPath} to ${newPath}`,
    author_name: 'User',
    author_email: 'user@example.com'
  })

  if (!renameResponse.success) {
    throw new Error('Failed to rename file')
  }

  return renameResponse
}

export const archiveFile = async (filePath: string) => {
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

  // Remove file from YAML
  const modifiedYaml = removeFileFromYaml(yamlContent, filePath)

  // Update explore.yaml file
  const updateResponse = await filesService.saveFile({
    file_path: 'explore.yaml',
    content: modifiedYaml,
    encoding: 'text',
    commit_message: `Archive ${filePath} from explore configuration`,
    author_name: 'User',
    author_email: 'user@example.com'
  })

  if (!updateResponse.success) {
    throw new Error('Failed to update explore.yaml')
  }

  return updateResponse
}

export const loadFileContent = async (filePath: string) => {
  const response = await filesService.getFile(filePath)
  
  if (!response.success || response.data.error_count > 0) {
    throw new Error('Failed to load file content')
  }
  
  const fileData = response.data.files[0]
  if (!fileData) {
    throw new Error('File not found')
  }
  
  // Parse file content
  let displayContent = 'File not found'
  if (fileData.content) {
    if (fileData.encoding === 'base64') {
      displayContent = atob(fileData.content)
    } else {
      displayContent = fileData.content
    }
    
    // Try to parse as JSON if it's a JSON file
    if (fileData.mime_type === 'application/json' || filePath.endsWith('.json')) {
      try {
        const parsed = JSON.parse(displayContent)
        displayContent = JSON.stringify(parsed, null, 2)
      } catch {
        // Keep as string if JSON parsing fails
      }
    }
  }

  return {
    content: displayContent,
    lineCount: countLines(displayContent)
  }
}

// Helper functions
export const countLines = (content: string): number => {
  if (!content || content.trim() === '') return 0
  return content.split('\n').length
}

const removeFileFromYaml = (yamlContent: string, filePathToRemove: string): string => {
  const lines = yamlContent.split('\n')
  const result: string[] = []
  let inFilesSection = false
  let currentWorkspaceIndent = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Track workspace sections
    if (line.startsWith('  - name:')) {
      currentWorkspaceIndent = line.search(/\S/)
      inFilesSection = false
      result.push(line)
      continue
    }

    // Track files section
    if (line.startsWith('    files:') && currentWorkspaceIndent > 0) {
      inFilesSection = true
      result.push(line)
      continue
    }

    // Check for file to remove
    if (inFilesSection && line.startsWith('      - ')) {
      const fileName = trimmed.substring(2).replace(/['\"]/g, '')
      if (fileName === filePathToRemove) {
        // Skip this file entry
        continue
      }
    }

    // End of files section
    if (inFilesSection && line.startsWith('  - ') && !line.includes('name:')) {
      inFilesSection = false
    }

    result.push(line)
  }

  return result.join('\n')
}