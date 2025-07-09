"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Music, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function CreatePlaylistPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
    } else {
      setUser(user)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()

    if (!user) {
      alert("Please log in to create playlists")
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase
        .from("playlists")
        .insert([
          {
            name,
            description: description || null,
            user_id: user.id,
          },
        ])
        .select()

      if (error) throw error

      alert("Playlist created successfully!")
      router.push("/")
    } catch (error) {
      console.error("Create playlist error:", error)
      alert("Failed to create playlist: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <Music className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="bg-black border-b border-gray-800 p-4">
        <div className="container mx-auto flex items-center">
          <Link href="/" className="flex items-center space-x-2 text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-4 ml-8">
            <Music className="w-8 h-8 text-green-500" />
            <h1 className="text-2xl font-bold">Create Playlist</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-green-500">
              <Plus className="w-6 h-6 mr-2" />
              Create New Playlist
            </CardTitle>
            <CardDescription className="text-gray-400">
              Create a new playlist to organize your favorite songs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-6">
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

              <Button type="submit" className="w-full bg-green-500 hover:bg-green-600" disabled={loading}>
                {loading ? "Creating..." : "Create Playlist"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
