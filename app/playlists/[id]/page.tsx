"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Music,
  Play,
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Share,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SongListItem } from "@/components/song-list-item";
import { AudioPlayer } from "@/components/audio-player";
import { SongSelector } from "@/components/song-selector";
import { EditPlaylistDialog } from "@/components/edit-playlist-dialog";
import { supabase } from "@/lib/supabase";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id;

  const [playlist, setPlaylist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSongSelector, setShowSongSelector] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentUser, setUser] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (playlistId) {
      fetchPlaylist();
    }
  }, [playlistId, currentUser]);

  useEffect(() => {
    filterSongs();
  }, [songs, searchQuery]);

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
    } else {
      setUser(user);
    }
  };

  const fetchPlaylist = async () => {
    try {
      // Fetch playlist details
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .single();

      if (playlistError) throw playlistError;

      setPlaylist(playlistData);
      setIsOwner(currentUser?.id === playlistData.user_id);

      // Fetch playlist songs
      const { data: songsData, error: songsError } = await supabase
        .from("playlist_songs")
        .select(
          `
          *,
          songs(*)
        `
        )
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });

      if (songsError) throw songsError;

      const playlistSongs =
        songsData?.map((ps) => ({
          ...ps.songs,
          playlist_song_id: ps.id,
          position: ps.position,
        })) || [];

      setSongs(playlistSongs);

      let p = playlistData;
      p.songs = playlistSongs;
      setPlaylist(p);
    } catch (error) {
      console.error("Error fetching playlist:", error);
      if (error.code === "PGRST116") {
        router.push("/playlists");
      }
    } finally {
      setLoading(false);
    }
  };

  const filterSongs = () => {
    let filtered = songs;

    if (searchQuery) {
      filtered = filtered.filter(
        (song) =>
          song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (song.album &&
            song.album.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredSongs(filtered);
  };

  const handlePlaySong = (song) => {
    setCurrentSong(song);
  };

  const handleSongChange = (newSong) => {
    setCurrentSong(newSong);
  };

  const handleAddSongs = async (selectedSongs) => {
    try {
      const maxPosition = Math.max(...songs.map((s) => s.position), -1);

      const playlistSongs = selectedSongs.map((song, index) => ({
        playlist_id: playlistId,
        song_id: song.id,
        position: maxPosition + index + 1,
      }));

      const { error } = await supabase
        .from("playlist_songs")
        .insert(playlistSongs);

      if (error) throw error;

      await fetchPlaylist();
    } catch (error) {
      console.error("Error adding songs:", error);
      alert("Failed to add songs to playlist");
    }
  };

  const handleRemoveSong = async (playlistSongId) => {
    if (confirm("Remove this song from the playlist?")) {
      try {
        const { error } = await supabase
          .from("playlist_songs")
          .delete()
          .eq("id", playlistSongId);

        if (error) throw error;

        await fetchPlaylist();
      } catch (error) {
        console.error("Error removing song:", error);
        alert("Failed to remove song from playlist");
      }
    }
  };

  const handleDeletePlaylist = async () => {
    if (
      confirm(
        "Are you sure you want to delete this playlist? This action cannot be undone."
      )
    ) {
      try {
        const { error } = await supabase
          .from("playlists")
          .delete()
          .eq("id", playlistId);

        if (error) throw error;

        router.push("/playlists");
      } catch (error) {
        console.error("Error deleting playlist:", error);
        alert("Failed to delete playlist");
      }
    }
  };

  const calculateTotalDuration = () => {
    return songs.reduce((total, song) => total + (song.duration || 0), 0);
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <Music className="w-16 h-16 mx-auto mb-4 animate-pulse text-green-500" />
          <p>Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Playlist not found</h2>
          <p className="text-gray-400 mb-4">
            The playlist you're looking for doesn't exist.
          </p>
          <Link href="/playlists">
            <Button className="bg-green-600 hover:bg-green-700">
              Back to Playlists
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="bg-black border-b border-gray-800 p-4">
        <div className="container mx-auto flex items-center">
          <Link
            href="/playlists"
            className="flex items-center space-x-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Playlists</span>
          </Link>
        </div>
      </nav>

      <div className="container mx-auto p-6">
        {/* Playlist Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="w-64 h-64 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
            {playlist.cover_image ? (
              <img
                src={playlist.cover_image || "/placeholder.svg"}
                alt={playlist.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Music className="w-24 h-24 text-gray-400" />
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-2">PLAYLIST</p>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-gray-300 text-lg mb-4">
                {playlist.description}
              </p>
            )}

            <div className="flex items-center space-x-4 text-sm text-gray-400 mb-6">
              <span>{songs.length} songs</span>
              {songs.length > 0 && <span>•</span>}
              {songs.length > 0 && (
                <span>{formatDuration(calculateTotalDuration())}</span>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 rounded-full w-14 h-14"
                disabled={songs.length === 0}
                onClick={() => songs.length > 0 && handlePlaySong(songs[0])}
              >
                <Play className="w-6 h-6" />
              </Button>

              {isOwner && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowSongSelector(true)}
                    className="border-gray-600 hover:bg-gray-800"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Songs
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(true)}
                    className="border-gray-600 hover:bg-gray-800"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleDeletePlaylist}
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                className="border-gray-600 hover:bg-gray-800 bg-transparent"
              >
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Songs Section */}
        <div className="space-y-4">
          {songs.length > 0 && (
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Songs</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search in playlist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-gray-800 border-gray-700 text-white w-64"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Songs List */}
          {filteredSongs.length > 0 ? (
            <div className="space-y-1">
              {filteredSongs.map((song, index) => (
                <div key={song.playlist_song_id} className="group">
                  <SongListItem
                    song={song}
                    index={index + 1}
                    onPlay={() => handlePlaySong(song)}
                    showRemove={isOwner}
                    onRemove={() => handleRemoveSong(song.playlist_song_id)}
                  />
                </div>
              ))}
            </div>
          ) : songs.length > 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No songs match "{searchQuery}"</p>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Music className="w-20 h-20 mx-auto mb-6 opacity-50" />
              <h3 className="text-2xl font-semibold mb-2">
                This playlist is empty
              </h3>
              <p className="text-lg mb-6">Add some songs to get started!</p>
              {isOwner && (
                <Button
                  onClick={() => setShowSongSelector(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Songs
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audio Player */}
      {currentSong && (
        <AudioPlayer
          song={currentSong}
          playlist={playlist}
          onClose={() => setCurrentSong(null)}
          onSongChange={handleSongChange}
        />
      )}

      {/* Song Selector Dialog */}
      <SongSelector
        open={showSongSelector}
        onOpenChange={setShowSongSelector}
        selectedSongs={[]}
        onSongsChange={handleAddSongs}
        playlistId={playlistId}
      />

      {/* Edit Playlist Dialog */}
      <EditPlaylistDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        playlist={playlist}
        onSuccess={fetchPlaylist}
      />
    </div>
  );
}
