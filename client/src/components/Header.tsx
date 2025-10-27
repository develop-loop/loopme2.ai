'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Menu,
  Search,
  X,
  ChevronDown,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

const analyticsItems = [
  {
    name: 'Timeline',
    description: 'View git commit history and project timeline',
    href: '/timeline',
    icon: Clock
  },
]

interface SearchResult {
  type: 'file' | 'content'
  path: string
  filename: string
  line?: number
  content?: string
  matchedText?: string
  score: number
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 执行搜索
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`)
      const data = await response.json()

      if (data.success) {
        setSearchResults(data.data.results)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // 处理搜索输入变化
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setShowResults(true)

    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // 设置新的定时器，300ms 后执行搜索
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(query)
    }, 300)
  }

  // 处理搜索结果点击
  const handleResultClick = (result: SearchResult) => {
    setShowResults(false)
    setSearchQuery('')
    // 这里可以添加打开文件的逻辑
    console.log('Selected result:', result)
  }

  // 处理点击外部关闭搜索结果
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return (
    <header className="border-b bg-background">
      <nav className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex items-center lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 mr-4">
            <span className="sr-only">TurboMe</span>
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">TM</span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="relative hidden lg:block lg:max-w-md lg:flex-1" ref={searchContainerRef}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <Input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 pr-3"
                placeholder="Search files and content..."
                autoComplete="off"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && (searchResults.length > 0 || searchQuery.trim()) && (
              <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-60 py-1 overflow-auto">
                {searchResults.length > 0 ? (
                  searchResults.map((result, index) => (
                    <button
                      key={`${result.path}-${index}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full text-left px-4 py-2 hover:bg-accent focus:outline-none focus:bg-accent"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            result.type === 'file'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          )}>
                            {result.type === 'file' ? 'File' : 'Content'}
                          </span>
                        </div>
                        <div className="ml-3 flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {result.filename}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {result.path}
                            {result.line && ` (line ${result.line})`}
                          </p>
                          {result.matchedText && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              {result.matchedText}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : searchQuery.trim() && !isSearching ? (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <span className="sr-only">Open main menu</span>
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-sm">
              <SheetHeader>
                <SheetTitle>
                  <Link href="/" className="flex items-center">
                    <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">TM</span>
                    </div>
                    <span className="ml-2">TurboMe</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flow-root">
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start" asChild>
                      <Link href="/timeline">
                        <Clock className="mr-2 h-4 w-4" />
                        Timeline
                      </Link>
                    </Button>
                  </div>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/explore">Explore</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/conversation">Conversation</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/api-docs">API</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/settings">Settings</Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden lg:flex lg:ml-auto lg:mr-8">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Analytics</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4">
                  {analyticsItems.map((item) => (
                    <li key={item.name}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-sm font-medium leading-none">{item.name}</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/explore" className={cn(
                  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                )}>
                  Explore
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/conversation" className={cn(
                  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                )}>
                  Conversation
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/api-docs" className={cn(
                  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                )}>
                  API
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop Settings Link */}
        <div className="hidden lg:flex">
          <Button variant="ghost" asChild>
            <Link href="/settings">Settings</Link>
          </Button>
        </div>
      </nav>
    </header>
  )
}
