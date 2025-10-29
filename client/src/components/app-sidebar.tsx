"use client"

import * as React from "react"
import {
  FileText,
  Search,
  MessageSquare,
  Clock,
  Settings2,
  Code,
  FolderTree,
  GitBranch,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// TurboMe workspace data
const data = {
  user: {
    name: "TurboMe User",
    email: "user@turbome.ai",
    avatar: "/avatars/user.jpg",
  },
  teams: [
    {
      name: "TurboMe",
      logo: FileText,
      plan: "Workspace",
    },
  ],
  navMain: [
    {
      title: "Explore",
      url: "/explore",
      icon: FolderTree,
      isActive: true,
      items: [
        {
          title: "All Files",
          url: "/explore",
        },
        {
          title: "Recent",
          url: "/explore?filter=recent",
        },
        {
          title: "Favorites",
          url: "/explore?filter=favorites",
        },
      ],
    },
    {
      title: "Conversation",
      url: "/conversation",
      icon: MessageSquare,
      items: [
        {
          title: "New Chat",
          url: "/conversation",
        },
        {
          title: "History",
          url: "/conversation/history",
        },
      ],
    },
    {
      title: "Analytics",
      url: "/timeline",
      icon: Clock,
      items: [
        {
          title: "Timeline",
          url: "/timeline",
        },
        {
          title: "Git History",
          url: "/timeline?view=git",
        },
      ],
    },
    {
      title: "API",
      url: "/api-docs",
      icon: Code,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/settings",
        },
        {
          title: "Workspace",
          url: "/settings/workspace",
        },
        {
          title: "Git Config",
          url: "/settings/git",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Current Workspace",
      url: "/dashboard",
      icon: GitBranch,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
