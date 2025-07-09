"use client"

import { Button } from "@/components/ui/button"
import { Play, Music, MoreHorizontal } from "lucide-react"
import Link from "next/link"

interface PlaylistListItemProps {
  playlist: {
    id: string
    name: string
    description?: string
    cover_image?: string
    playlist_songs?: any[]
    created_at: string
  }
  index: number
}

export function PlaylistListItem({ playlist, index }: PlaylistListItemProps) {
  const songCount = playlist.playlist_songs?.[0]?.count || 0

  return (
    <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800 transition-colors group">
      <div className="w-8 text-center">
        <span className="text-gray-400 group-hover:hidden">{index}</span>
        <Button size="sm" variant="ghost" className="hidden group-hover:flex w-8 h-8 p-0 hover:bg-green-600">
          <Play className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
        {playlist.cover_image ? (
          <img
            src={playlist.cover_image || "/placeholder.svg"}
            alt={playlist.name}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <Music className="w-6 h-6 text-gray-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link href={`/playlists/${playlist.id}`}>
          <h3 className="font-medium text-white truncate hover:underline">{playlist.name}</h3>
        </Link>
        <p className="text-sm text-gray-400 truncate">{playlist.description || `${songCount} songs`}</p>
      </div>

      <div className="hidden md:block text-sm text-gray-400">{new Date(playlist.created_at).toLocaleDateString()}</div>

      <div className="text-sm text-gray-400 w-16 text-right">{songCount} songs</div>

      <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100">
        <MoreHorizontal className="w-4 h-4" />
      </Button>
    </div>
  )
}
