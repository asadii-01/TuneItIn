"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Music, Search, Upload, ArrowLeft, Filter, Grid, List } from "lucide-react"
import Link from "next/link"
import { SongCard } from "@/components/song-card"
import { SongListItem } from "@/components/song-list-item"
import { AudioPlayer } from "@/components/audio-player"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SongsPage() {
  const [songs, setSongs] = useState([])
  const [filteredSongs, setFilteredSongs] = useState([])
  const [currentSong, setCurrentSong] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [viewMode, setViewMode] = useState("grid")
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    filterAndSortSongs()
  }, [songs, searchQuery, sortBy])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth/login")
    } else {
      setUser(user)
      fetchSongs()
    }
  }

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase.from("songs").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setSongs(data || [])
    } catch (error) {
      console.error("Error fetching songs:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortSongs = () => {
    let filtered = songs

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (song) =>
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (song.album && song.album.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    // Sort songs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "artist":
          return a.artist.localeCompare(b.artist)
        case "plays":
          return b.plays - a.plays
        case "created_at":
        default:
          return new Date(b.created_at) - new Date(a.created_at)
      }
    })

    setFilteredSongs(filtered)
  }

  const handlePlaySong = (song) => {
    setCurrentSong(song)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <Music className="w-16 h-16 mx-auto mb-4 animate-pulse text-green-500" />
          <p>Loading songs...</p>
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
              <h1 className="text-2xl font-bold">All Songs</h1>
            </div>
          </div>

          <Link href="/upload">
            <Button className="bg-green-600 hover:bg-green-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Song
            </Button>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
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

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-700">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="created_at">Recently Added</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
                <SelectItem value="artist">Artist A-Z</SelectItem>
                <SelectItem value="plays">Most Played</SelectItem>
              </SelectContent>
            </Select>

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
        </div>

        {/* Songs Display */}
        {filteredSongs.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredSongs.map((song) => (
                <SongCard key={song.id} song={song} onPlay={() => handlePlaySong(song)} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSongs.map((song, index) => (
                <SongListItem key={song.id} song={song} index={index + 1} onPlay={() => handlePlaySong(song)} />
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16 text-gray-400">
            <Music className="w-20 h-20 mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-semibold mb-2">
              {searchQuery ? "No songs found" : "No songs in your library"}
            </h3>
            <p className="text-lg mb-6">
              {searchQuery
                ? `No songs match "${searchQuery}". Try a different search term.`
                : "Start building your music library by uploading your first song!"}
            </p>
            {!searchQuery && (
              <Link href="/upload">
                <Button className="bg-green-600 hover:bg-green-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Song
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Stats */}
        {filteredSongs.length > 0 && (
          <div className="mt-8 text-center text-gray-400">
            <p>
              Showing {filteredSongs.length} of {songs.length} songs
            </p>
          </div>
        )}
      </div>

      {/* Audio Player */}
      {currentSong && <AudioPlayer song={currentSong} onClose={() => setCurrentSong(null)} />}
    </div>
  )
}
