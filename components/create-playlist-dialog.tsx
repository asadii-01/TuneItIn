"use client"

import { useState, useRef } from "react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, Music, Plus, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { SongSelector } from "@/components/song-selector"

interface CreatePlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreatePlaylistDialog({ open, onOpenChange, onSuccess }: CreatePlaylistDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [coverImage, setCoverImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedSongs, setSelectedSongs] = useState([])
  const [showSongSelector, setShowSongSelector] = useState(false)

  const imageInputRef = useRef(null)

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith("image/")) {
      setCoverImage(file)
    } else {
      alert("Please select a valid image file")
    }
  }

  const uploadCoverImage = async (file, userId) => {
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `playlist-covers/${userId}/${fileName}`

    const { data, error } = await supabase.storage.from("images").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) throw error

    const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath)
    return urlData.publicUrl
  }

  const handleCreate = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      alert("Please enter a playlist name")
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        alert("Please log in to create playlists")
        return
      }

      let coverImageUrl = null

      // Upload cover image if provided
      if (coverImage) {
        coverImageUrl = await uploadCoverImage(coverImage, user.id)
      }

      // Create playlist
      const { data, error } = await supabase
        .from("playlists")
        .insert([
          {
            name: name.trim(),
            description: description.trim() || null,
            cover_image: coverImageUrl,
            user_id: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Add songs to playlist if any selected
      if (selectedSongs.length > 0) {
        const playlistSongs = selectedSongs.map((song, index) => ({
          playlist_id: data.id,
          song_id: song.id,
          position: index,
        }))

        const { error: songsError } = await supabase.from("playlist_songs").insert(playlistSongs)

        if (songsError) throw songsError
      }

      // Reset form
      setName("")
      setDescription("")
      setCoverImage(null)
      setSelectedSongs([])
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Create playlist error:", error)
      alert("Failed to create playlist: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSong = (songId) => {
    setSelectedSongs((prev) => prev.filter((s) => s.id !== songId))
  }

  const handleClearAllSongs = () => {
    setSelectedSongs([])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center text-green-500">
            <Music className="w-5 h-5 mr-2" />
            Create New Playlist
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new playlist to organize your favorite songs.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <ScrollArea className="flex-1 pr-4">
          <form className="space-y-6">
            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label>Cover Image (Optional)</Label>
              <div
                className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-gray-600 transition-colors"
                onClick={() => imageInputRef.current?.click()}
              >
                {coverImage ? (
                  <div>
                    <img
                      src={URL.createObjectURL(coverImage) || "/placeholder.svg"}
                      alt="Cover preview"
                      className="w-20 h-20 mx-auto mb-2 rounded object-cover"
                    />
                    <p className="text-green-500 text-sm">{coverImage.name}</p>
                    <p className="text-xs text-gray-400">Click to change image</p>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400 text-sm">Click to upload cover image</p>
                    <p className="text-xs text-gray-500">JPG, PNG supported</p>
                  </div>
                )}
              </div>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Playlist Name *</Label>
              <Input
                id="name"
                placeholder="Enter playlist name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your playlist (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                rows={3}
              />
            </div>

            {/* Song Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Songs (Optional)</Label>
                <div className="flex items-center space-x-2">
                  {selectedSongs.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearAllSongs}
                      className="text-red-400 border-red-400 hover:bg-red-400 hover:text-black text-xs bg-transparent"
                    >
                      Clear All
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSongSelector(true)}
                    className="text-black bg-green-400 hover:bg-green-400/75 hover:text-black"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Songs
                  </Button>
                </div>
              </div>

              {selectedSongs.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-green-400">{selectedSongs.length} songs selected</p>
                    <p className="text-xs text-gray-500">Click × to remove songs</p>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedSongs.map((song, index) => (
                      <div
                        key={song.id}
                        className="flex items-center justify-between p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-xs text-gray-400 w-6">{index + 1}</span>
                          <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center flex-shrink-0">
                            {song.cover_image ? (
                              <img
                                src={song.cover_image || "/placeholder.svg"}
                                alt={song.title}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Music className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{song.title}</p>
                            <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSong(song.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-600/20 p-1 h-auto ml-2 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </ScrollArea>

        {/* Fixed Footer */}
        <DialogFooter className="flex-shrink-0 border-t border-gray-700 pt-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            className="bg-green-600 hover:bg-green-700"
            disabled={loading || !name.trim()}
          >
            {loading ? "Creating..." : "Create Playlist"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Song Selector Dialog */}
      <SongSelector
        open={showSongSelector}
        onOpenChange={setShowSongSelector}
        selectedSongs={selectedSongs}
        onSongsChange={setSelectedSongs}
      />
    </Dialog>
  )
}
