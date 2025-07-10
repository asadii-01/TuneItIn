"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Music,
  Plus,
  Upload,
  User,
  LogOut,
  Library,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { AudioPlayer } from "@/components/audio-player";
import { PlaylistCard } from "@/components/playlist-card";
import { SongCard } from "@/components/song-card";
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        await fetchUserData();
      }
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      // Fetch playlists with song count
      const { data: playlistsData, error: playlistsError } = await supabase
        .from("playlists")
        .select(
          `
          *,
          playlist_songs(count)
        `
        )
        .order("created_at", { ascending: false })
        .limit(4);

      if (playlistsError) throw playlistsError;
      setPlaylists(playlistsData || []);

      // Fetch recent songs
      const { data: songsData, error: songsError } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      if (songsError) throw songsError;
      setRecentSongs(songsData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handlePlaySong = (song) => {
    setCurrentSong(song);
  };

  const handleSongChange = (newSong) => {
    setCurrentSong(newSong);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  // Create a simple playlist for recent songs
  const recentSongsPlaylist =
    recentSongs.length > 0
      ? {
          id: "recent-songs",
          name: "Recently Added",
          songs: recentSongs,
        }
      : undefined;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <Music className="w-16 h-16 mx-auto mb-4 animate-pulse text-green-500" />
          <p className="text-lg">Loading TuneItIn...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center text-white">
            <img src="/TuneItIn-Logo.png" alt="TuneItIn Logo" className="w-20 h-20 mx-auto mb-8" />
            <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              TuneItIn
            </h1>
            <p className="text-2xl mb-12 text-gray-300 max-w-2xl mx-auto">
              Your personal music streaming platform. Upload, organize, and
              stream your favorite songs.
            </p>
            <div className="space-x-6">
              <Link href="/auth/login">
                <Button
                  size="lg"
                  className="bg-green-500 hover:bg-green-600 text-lg px-8 py-3"
                >
                  Log In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-white border-white hover:bg-white hover:text-black bg-transparent text-lg px-8 py-3"
                >
                  Sign Up Free
                </Button>
              </Link>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <h3 className="text-xl font-semibold mb-2">Upload Music</h3>
                <p className="text-gray-400">
                  Upload your favorite songs and build your personal library
                </p>
              </div>
              <div className="text-center">
                <Library className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <h3 className="text-xl font-semibold mb-2">Create Playlists</h3>
                <p className="text-gray-400">
                  Organize your music into custom playlists for every mood
                </p>
              </div>
              <div className="text-center">
                <Heart className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                <h3 className="text-xl font-semibold mb-2">Stream Anywhere</h3>
                <p className="text-gray-400">
                  Access your music library from any device, anytime
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="bg-black border-b border-gray-800 p-4 sticky top-0 z-40">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3">
            <img src="/TuneItIn-Logo.png" alt="TuneItIn Logo" className="w-12 h-12 mx-auto" />
              <h1 className="text-2xl font-bold">TuneItIn</h1>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-gray-300 hover:text-green-400 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/songs"
                className="text-gray-300 hover:text-green-400 transition-colors"
              >
                Songs
              </Link>
              <Link
                href="/playlists"
                className="text-gray-300 hover:text-green-400 transition-colors"
              >
                Playlists
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/upload">
              <Button variant="ghost" size="sm" className="hover:bg-green-600">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm" className="hover:bg-green-600">
                <User className="w-4 h-4 mr-2" />
                {user.user_metadata?.name || "Profile"}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hover:bg-green-600"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Welcome back, {user.user_metadata?.name || "Music Lover"}!
          </h2>
          <p className="text-gray-400 text-lg">
            Ready to discover your next favorite song?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card
            className="bg-gradient-to-br from-green-600 to-green-700 border-green-500 hover:from-green-500 hover:to-green-600 transition-all cursor-pointer group"
            onClick={() => setShowCreatePlaylist(true)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-white">
                <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Create Playlist
              </CardTitle>
            </CardHeader>
          </Card>

          <Link href="/upload">
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500 hover:from-blue-500 hover:to-blue-600 transition-all cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center justify-center text-white">
                  <Upload className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Upload Songs
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/songs">
            <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500 hover:from-purple-500 hover:to-purple-600 transition-all cursor-pointer group">
              <CardHeader>
                <CardTitle className="flex items-center justify-center text-white">
                  <Library className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Browse Songs
                </CardTitle>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/*Playlists */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold">Playlists</h3>
            <Link href="/playlists">
              <Button
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-black"
              >
                View All
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {playlists.length > 0 ? (
              playlists.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  playlist={playlist}
                  onRefresh={fetchUserData}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-400">
                <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No playlists yet</p>
                <p className="text-sm">
                  Create your first playlist to get started!
                </p>
                <Button
                  onClick={() => setShowCreatePlaylist(true)}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Playlist
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Recently Added */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold">Recently Added</h3>
            <Link href="/songs">
              <Button
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-black"
              >
                View All
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSongs.length > 0 ? (
              recentSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onPlay={() => handlePlaySong(song)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-400">
                <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No songs uploaded yet</p>
                <p className="text-sm">
                  Upload your first song to start building your library!
                </p>
                <Link href="/upload">
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Song
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Audio Player with Playlist Support */}
      {currentSong && (
        <AudioPlayer
          song={currentSong}
          playlist={recentSongsPlaylist}
          onClose={() => setCurrentSong(null)}
          onSongChange={handleSongChange}
        />
      )}

      {/* Create Playlist Dialog */}
      <CreatePlaylistDialog
        open={showCreatePlaylist}
        onOpenChange={setShowCreatePlaylist}
        onSuccess={fetchUserData}
      />
    </div>
  );
}
