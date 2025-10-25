import { v1FilesService } from '../../services/V1FilesService'

// File operations using V1 Files API for markdown files only
export const saveFile = async (filePath: string, content: string, workspace?: string) => {
  // Only support markdown files
  if (!filePath.endsWith('.md') && !filePath.endsWith('.markdown')) {
    throw new Error('Only markdown files are supported in explore mode')
  }

  if (!workspace) {
    throw new Error('Workspace is required for markdown files')
  }
  
  // Use V1 Files API for markdown files with workspace in frontmatter
  const response = await v1FilesService.saveMarkdownWithWorkspace(
    filePath,
    content,
    workspace,
    `Update ${filePath}`,
    'User',
    'user@example.com'
  )

  if (!response.success) {
    throw new Error('Failed to save markdown file')
  }

  return response
}

export const renameFile = async (oldPath: string, newPath: string, workspace?: string) => {
  // Only support markdown files
  if (!oldPath.endsWith('.md') && !oldPath.endsWith('.markdown')) {
    throw new Error('Only markdown files are supported in explore mode')
  }

  if (!workspace) {
    throw new Error('Workspace is required for markdown files')
  }

  // Get current markdown file content using V1 API
  const response = await v1FilesService.getMarkdown(oldPath)
  if (!response.success || response.data.error_count > 0) {
    throw new Error('Failed to fetch markdown file content')
  }

  const markdownData = response.data.markdowns[0]
  if (!markdownData) {
    throw new Error('Markdown file not found')
  }

  // Rename the markdown file using V1 API with workspace preservation
  const renameResponse = await v1FilesService.renameMarkdownWithWorkspace(
    oldPath,
    newPath,
    markdownData.content,
    workspace,
    `Rename ${oldPath} to ${newPath}`,
    'User',
    'user@example.com',
    markdownData.frontmatter
  )

  if (!renameResponse.success) {
    throw new Error('Failed to rename markdown file')
  }

  return renameResponse
}

export const archiveFile = async (filePath: string) => {
  // Only support markdown files
  if (!filePath.endsWith('.md') && !filePath.endsWith('.markdown')) {
    throw new Error('Only markdown files are supported in explore mode')
  }

  // Use V1 API to delete workspace frontmatter for markdown files
  const response = await v1FilesService.deleteFrontmatterKeys(
    filePath,
    ['workspace'],
    `Archive ${filePath} by removing workspace`,
    'User',
    'user@example.com'
  )

  if (!response.success) {
    throw new Error('Failed to archive markdown file')
  }

  return response
}

export const loadFileContent = async (filePath: string) => {
  // Only support markdown files
  if (!filePath.endsWith('.md') && !filePath.endsWith('.markdown')) {
    throw new Error('Only markdown files are supported in explore mode')
  }

  // Use V1 API for markdown files
  const response = await v1FilesService.getMarkdown(filePath)
  
  if (!response.success || response.data.error_count > 0) {
    throw new Error('Failed to load markdown file content')
  }
  
  const markdownData = response.data.markdowns[0]
  if (!markdownData) {
    throw new Error('Markdown file not found')
  }
  
  return {
    content: markdownData.content,
    lineCount: countLines(markdownData.content),
    frontmatter: markdownData.frontmatter
  }
}

// Helper functions
export const countLines = (content: string): number => {
  if (!content || content.trim() === '') return 0
  return content.split('\n').length
}

// Helper function to get workspace from file path by checking which workspace contains it
export const getWorkspaceForFile = (filePath: string, columns: Array<{title: string, cards: Array<{title: string}>}>): string | undefined => {
  return columns.find(col => 
    col.cards.some(card => card.title === filePath)
  )?.title
}

