"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Music, Play, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface SongCardProps {
  song: {
    id: string
    title: string
    artist: string
    album?: string
    cover_image?: string
    duration?: number
    likes?: number
  }
  onPlay: () => void
  showLike?: boolean
}

export function SongCard({ song, onPlay, showLike = true }: SongCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(song.likes || 0)

  useEffect(() => {
    if (showLike) {
      checkIfLiked()
    }
  }, [song.id, showLike])

  const checkIfLiked = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("user_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("song_id", song.id)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Error checking like status:", error)
        return
      }

      setIsLiked(!!data)
    } catch (error) {
      console.error("Error checking like status:", error)
    }
  }

  const toggleLike = async (e) => {
    e.stopPropagation()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        alert("Please log in to like songs")
        return
      }

      if (isLiked) {
        // Remove like
        const { error: deleteError } = await supabase
          .from("user_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("song_id", song.id)

        if (deleteError) throw deleteError

        // Update song likes count
        const newLikesCount = Math.max(0, likesCount - 1)
        const { error: updateError } = await supabase.from("songs").update({ likes: newLikesCount }).eq("id", song.id)

        if (updateError) throw updateError

        setIsLiked(false)
        setLikesCount(newLikesCount)
      } else {
        // Add like
        const { error: insertError } = await supabase.from("user_likes").insert([
          {
            user_id: user.id,
            song_id: song.id,
          },
        ])

        if (insertError) throw insertError

        // Update song likes count
        const newLikesCount = likesCount + 1
        const { error: updateError } = await supabase.from("songs").update({ likes: newLikesCount }).eq("id", song.id)

        if (updateError) throw updateError

        setIsLiked(true)
        setLikesCount(newLikesCount)
      }
    } catch (error) {
      console.error("Error toggling like:", error)
      alert("Failed to update like status")
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return (
    <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors group cursor-pointer">
      <CardContent className="p-4">
        <div className="relative mb-4">
          <div className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
            {song.cover_image ? (
              <img
                src={song.cover_image || "/placeholder.svg"}
                alt={song.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Music className="w-12 h-12 text-gray-400" />
            )}
          </div>

          <div className="absolute bottom-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {showLike && (
              <Button
                size="sm"
                onClick={toggleLike}
                className={`${isLiked ? "bg-red-500 hover:bg-red-600 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-300"} rounded-full w-10 h-10`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              </Button>
            )}

            <Button size="sm" onClick={onPlay} className="bg-green-500 hover:bg-green-600 rounded-full w-10 h-10">
              <Play className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <h3 className="font-semibold text-white mb-1 truncate">{song.title}</h3>
        <p className="text-sm text-gray-400 truncate">{song.artist}</p>
        {song.album && <p className="text-xs text-gray-500 truncate">{song.album}</p>}

        <div className="flex items-center justify-between mt-2">
          {song.duration && <p className="text-xs text-gray-500">{formatDuration(song.duration)}</p>}
          {showLike && likesCount > 0 && (
            <div className="flex items-center space-x-1">
              <Heart className="w-3 h-3 text-red-400" />
              <span className="text-xs text-gray-500">{likesCount}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
