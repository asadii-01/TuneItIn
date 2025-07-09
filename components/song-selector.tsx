"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Music, Plus, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface SongSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedSongs: any[]
  onSongsChange: (songs: any[]) => void
  playlistId?: string // For editing existing playlists
}

export function SongSelector({ open, onOpenChange, selectedSongs, onSongsChange, playlistId }: SongSelectorProps) {
  const [songs, setSongs] = useState([])
  const [filteredSongs, setFilteredSongs] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [tempSelected, setTempSelected] = useState([])

  useEffect(() => {
    if (open) {
      fetchSongs()
      setTempSelected([...selectedSongs])
    }
  }, [open, selectedSongs])

  useEffect(() => {
    filterSongs()
  }, [songs, searchQuery])

  const fetchSongs = async () => {
    setLoading(true)
    try {
      let query = supabase.from("songs").select("*").order("created_at", { ascending: false })

      // If editing a playlist, exclude songs already in the playlist
      if (playlistId) {
        const { data: playlistSongs } = await supabase
          .from("playlist_songs")
          .select("song_id")
          .eq("playlist_id", playlistId)

        const excludeIds = playlistSongs?.map((ps) => ps.song_id) || []
        if (excludeIds.length > 0) {
          query = query.not("id", "in", `(${excludeIds.join(",")})`)
        }
      }

      const { data, error } = await query

      if (error) throw error
      setSongs(data || [])
    } catch (error) {
      console.error("Error fetching songs:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterSongs = () => {
    let filtered = songs

    if (searchQuery) {
      filtered = filtered.filter(
        (song) =>
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (song.album && song.album.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    setFilteredSongs(filtered)
  }

  const handleSongToggle = (song, checked) => {
    if (checked) {
      setTempSelected((prev) => [...prev, song])
    } else {
      setTempSelected((prev) => prev.filter((s) => s.id !== song.id))
    }
  }

  const handleSelectAll = () => {
    const allVisible = filteredSongs.filter((song) => !tempSelected.find((s) => s.id === song.id))
    setTempSelected((prev) => [...prev, ...allVisible])
  }

  const handleDeselectAll = () => {
    const visibleIds = filteredSongs.map((song) => song.id)
    setTempSelected((prev) => prev.filter((song) => !visibleIds.includes(song.id)))
  }

  const handleSave = () => {
    onSongsChange(tempSelected)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setTempSelected([...selectedSongs])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center text-green-500">
            <Music className="w-5 h-5 mr-2" />
            Select Songs
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose songs to add to your playlist. You can search and select multiple songs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          {/* Search */}
          <div className="flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search songs, artists, albums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          {filteredSongs.length > 0 && (
            <div className="flex-shrink-0 flex items-center justify-between py-2 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-xs bg-transparent"
                >
                  Select All Visible
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="text-xs bg-transparent"
                >
                  Deselect All Visible
                </Button>
              </div>
              <div className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-sm">
                {tempSelected.length} songs selected
              </div>
            </div>
          )}

          {/* Songs List */}
          <div className="flex-1 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Music className="w-12 h-12 animate-pulse text-green-500 mx-auto mb-4" />
                  <p className="text-gray-400">Loading songs...</p>
                </div>
              </div>
            ) : filteredSongs.length > 0 ? (
              <ScrollArea className="h-full border border-gray-700 rounded-lg">
                <div className="p-3 space-y-2">
                  {filteredSongs.map((song) => {
                    const isSelected = tempSelected.find((s) => s.id === song.id)
                    return (
                      <div
                        key={song.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer ${
                          isSelected ? "bg-green-600/20 border border-green-600/30" : "hover:bg-gray-800"
                        }`}
                        onClick={() => handleSongToggle(song, !isSelected)}
                      >
                        <Checkbox
                          checked={!!isSelected}
                          onCheckedChange={(checked) => handleSongToggle(song, checked)}
                          className="border-gray-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />

                        <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center flex-shrink-0">
                          {song.cover_image ? (
                            <img
                              src={song.cover_image || "/placeholder.svg"}
                              alt={song.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <Music className="w-6 h-6 text-gray-400" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">{song.title}</h4>
                          <p className="text-sm text-gray-400 truncate">
                            {song.artist} {song.album && `• ${song.album}`}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {song.duration && (
                            <span className="text-xs text-gray-500">
                              {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, "0")}
                            </span>
                          )}
                          {isSelected && <Check className="w-5 h-5 text-green-500" />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Music className="w-16 h-16 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">{searchQuery ? "No songs found" : "No songs available"}</h3>
                <p className="text-sm text-center">
                  {searchQuery
                    ? `No songs match "${searchQuery}". Try a different search term.`
                    : "Upload some songs to add them to your playlists."}
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t border-gray-700 pt-4">
          <Button type="button" variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700"
            disabled={tempSelected.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add {tempSelected.length} Song{tempSelected.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
