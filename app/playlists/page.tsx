"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Music, Search, Plus, ArrowLeft, Grid, List } from "lucide-react"
import Link from "next/link"
import { PlaylistCard } from "@/components/playlist-card"
import { PlaylistListItem } from "@/components/playlist-list-item"
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState([])
  const [filteredPlaylists, setFilteredPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState("grid")
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    filterPlaylists()
  }, [playlists, searchQuery])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
    } else {
      setUser(user)
      fetchPlaylists()
    }
  }

  const fetchPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select(`
          *,
          playlist_songs(count)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPlaylists(data || [])
    } catch (error) {
      console.error("Error fetching playlists:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterPlaylists = () => {
    let filtered = playlists

    if (searchQuery) {
      filtered = filtered.filter(
        (playlist) =>
          playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (playlist.description && playlist.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    setFilteredPlaylists(filtered)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <Music className="w-16 h-16 mx-auto mb-4 animate-pulse text-green-500" />
          <p>Loading playlists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="bg-black border-b border-gray-800 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-4 ml-8">
              <Music className="w-8 h-8 text-green-500" />
              <h1 className="text-2xl font-bold">Recent Playlists</h1>
            </div>
          </div>

          <Button onClick={() => setShowCreatePlaylist(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Playlist
          </Button>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        {/* Search and View Toggle */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search playlists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <div className="flex border border-gray-700 rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Playlists Display */}
        {filteredPlaylists.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPlaylists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} onRefresh={fetchPlaylists} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPlaylists.map((playlist, index) => (
                <PlaylistListItem key={playlist.id} playlist={playlist} index={index + 1} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Music className="w-20 h-20 mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-semibold mb-2">{searchQuery ? "No playlists found" : "No playlists yet"}</h3>
            <p className="text-lg mb-6">
              {searchQuery
                ? `No playlists match "${searchQuery}". Try a different search term.`
                : "Create your first playlist to organize your favorite songs!"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreatePlaylist(true)} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Playlist
              </Button>
            )}
          </div>
        )}

        {/* Stats */}
        {filteredPlaylists.length > 0 && (
          <div className="mt-8 text-center text-gray-400">
            <p>
              Showing {filteredPlaylists.length} of {playlists.length} playlists
            </p>
          </div>
        )}
      </div>

      {/* Create Playlist Dialog */}
      <CreatePlaylistDialog open={showCreatePlaylist} onOpenChange={setShowCreatePlaylist} onSuccess={fetchPlaylists} />
    </div>
  )
}
