"use client"

import { useState, useRef, useEffect } from "react"
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
import { Upload, Music, Save } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface EditPlaylistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  playlist: any
  onSuccess: () => void
}

export function EditPlaylistDialog({ open, onOpenChange, playlist, onSuccess }: EditPlaylistDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [coverImage, setCoverImage] = useState(null)
  const [loading, setLoading] = useState(false)

  const imageInputRef = useRef(null)

  useEffect(() => {
    if (playlist && open) {
      setName(playlist.name || "")
      setDescription(playlist.description || "")
      setCoverImage(null)
    }
  }, [playlist, open])

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

  const handleSave = async (e) => {
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
        alert("Please log in to edit playlists")
        return
      }

      let coverImageUrl = playlist.cover_image

      // Upload new cover image if provided
      if (coverImage) {
        coverImageUrl = await uploadCoverImage(coverImage, user.id)
      }

      // Update playlist
      const { data, error } = await supabase
        .from("playlists")
        .update({
          name: name.trim(),
          description: description.trim() || null,
          cover_image: coverImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", playlist.id)
        .select()

      if (error) throw error

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Edit playlist error:", error)
      alert("Failed to update playlist: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center text-green-500">
            <Music className="w-5 h-5 mr-2" />
            Edit Playlist
          </DialogTitle>
          <DialogDescription className="text-gray-400">Update your playlist information.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
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
              ) : playlist.cover_image ? (
                <div>
                  <img
                    src={playlist.cover_image || "/placeholder.svg"}
                    alt="Current cover"
                    className="w-20 h-20 mx-auto mb-2 rounded object-cover"
                  />
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

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
