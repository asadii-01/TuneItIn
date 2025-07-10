"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  X,
  Heart,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { set } from "react-hook-form";

interface AudioPlayerProps {
  song: {
    id: string;
    title: string;
    artist: string;
    audio_url: string;
    cover_image?: string;
    likes?: number;
  };
  playlist?: {
    id: string;
    name: string;
    songs: any[];
  };
  onClose: () => void;
  onSongChange?: (song: any) => void;
}

export function AudioPlayer({
  song,
  playlist,
  onClose,
  onSongChange,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [shuffleOrder, setShuffleOrder] = useState<number[]>([]);
  const [shuffleIndex, setShuffleIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [hasPlayStarted, setHasPlayStarted] = useState(false);
  const [playCountUpdated, setPlayCountUpdated] = useState(false);
  const [isNewSong, setIsNewSong] = useState(true);

  const audioRef = useRef<HTMLAudioElement>(null);

  // Initialize song data when song changes
  useEffect(() => {
    if (song) {
      setLikesCount(song.likes || 0);
      setHasPlayStarted(false);
      setPlayCountUpdated(false);
      setIsNewSong(true);
      checkIfLiked();
      fetchCurrentLikesCount();
    }
  }, [song]);

  const fetchCurrentLikesCount = async () => {
    try {
      const { data, error } = await supabase
        .from("songs")
        .select("likes")
        .eq("id", song.id)
        .single();

      if (error) throw error;
      setLikesCount(data.likes || 0);
    } catch (error) {
      console.error("Error fetching likes count:", error);
    }
  };

  // Initialize current song index and shuffle order when playlist changes
  useEffect(() => {
    if (playlist?.songs && song) {
      const index = playlist.songs.findIndex((s) => s.id === song.id);
      setCurrentSongIndex(index >= 0 ? index : 0);

      // Generate shuffle order
      const indices = Array.from(
        { length: playlist.songs.length },
        (_, i) => i
      );
      const shuffled = [...indices].sort(() => Math.random() - 0.5);
      setShuffleOrder(shuffled);

      // Set shuffle index to current song position in shuffle order
      const shufflePos = shuffled.findIndex(
        (i) => i === (index >= 0 ? index : 0)
      );
      setShuffleIndex(shufflePos >= 0 ? shufflePos : 0);
    }
  }, [playlist, song]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);

      // Update play count when song reaches 30 seconds or 50% completion
      if (
        !playCountUpdated &&
        (audio.currentTime >= 30 || audio.currentTime >= audio.duration * 0.5)
      ) {
        updatePlayCount();
        setPlayCountUpdated(true);
      }
    };

    const updateDuration = () => setDuration(audio.duration);
    const handlePlayEvent = () => setIsPlaying(true);
    const handlePauseEvent = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("play", handlePlayEvent);
    audio.addEventListener("pause", handlePauseEvent);
    audio.addEventListener("ended", handleSongEnd);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("play", handlePlayEvent);
      audio.removeEventListener("pause", handlePauseEvent);
      audio.removeEventListener("ended", handleSongEnd);
    };
  }, [song, playCountUpdated]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isNewSong) return;

    const handleCanPlay = () => {
      if (isNewSong) {
        audio
          .play()
          .then(() => {
            setIsNewSong(false);
            setIsPlaying(true);
          })
          .catch((error) => {
            console.log("Auto-play prevented by browser:", error);
            // Browser prevented auto-play, user will need to click play
            setIsNewSong(false);
          });
      }
    };

    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [song, isNewSong]);

  const checkIfLiked = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !song) return;

      const { data, error } = await supabase
        .from("user_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("song_id", song.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking like status:", error);
        return;
      }

      setIsLiked(!!data);
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };

  const updatePlayCount = async () => {
    try {
      const { error } = await supabase
        .from("songs")
        .update({ plays: song.plays + 1 })
        .eq("id", song.id);

      if (error) {
        console.error("Error updating play count:", error);
      }
    } catch (error) {
      console.error("Error updating play count:", error);
    }
  };

  const toggleLike = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        alert("Please log in to like songs");
        return;
      }

      if (isLiked) {
        // Remove like
        const { error } = await supabase.rpc("unlike_song", {
          user_uuid: user.id,
          song_uuid: song.id,
        });

        if (error) throw error;

        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));
      } else {
        // Add like - use RPC function for atomic operation
        const { error } = await supabase.rpc("like_song", {
          user_uuid: user.id,
          song_uuid: song.id,
        });

        if (error) throw error;

        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }

      // Refresh the actual count from database to ensure accuracy
      setTimeout(fetchCurrentLikesCount, 100);
    } catch (error) {
      console.error("Error toggling like:", error);
      alert("Failed to update like status");
      // Revert optimistic update
      await checkIfLiked();
      await fetchCurrentLikesCount();
    }
  };

  const handleSongEnd = () => {
    if (isRepeat) {
      audioRef.current?.play();
    } else if (playlist?.songs && playlist.songs.length > 1) {
      handleNext();
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = value[0];
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const getNextSongIndex = () => {
    if (!playlist?.songs) return -1;

    if (isShuffle) {
      const nextShuffleIndex = (shuffleIndex + 1) % shuffleOrder.length;
      return shuffleOrder[nextShuffleIndex];
    } else {
      return (currentSongIndex + 1) % playlist.songs.length;
    }
  };

  const getPreviousSongIndex = () => {
    if (!playlist?.songs) return -1;

    if (isShuffle) {
      const prevShuffleIndex =
        shuffleIndex === 0 ? shuffleOrder.length - 1 : shuffleIndex - 1;
      return shuffleOrder[prevShuffleIndex];
    } else {
      return currentSongIndex === 0
        ? playlist.songs.length - 1
        : currentSongIndex - 1;
    }
  };

  const handleNext = () => {
    if (!playlist?.songs || playlist.songs.length <= 1) return;

    const nextIndex = getNextSongIndex();
    if (nextIndex >= 0) {
      const nextSong = playlist.songs[nextIndex];
      setCurrentSongIndex(nextIndex);

      if (isShuffle) {
        setShuffleIndex((shuffleIndex + 1) % shuffleOrder.length);
      }

      onSongChange?.(nextSong);
    }
  };

  const handlePrevious = () => {
    if (!playlist?.songs || playlist.songs.length <= 1) return;

    // If more than 3 seconds have passed, restart current song
    if (currentTime > 3) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }
      return;
    }

    const prevIndex = getPreviousSongIndex();
    if (prevIndex >= 0) {
      const prevSong = playlist.songs[prevIndex];
      setCurrentSongIndex(prevIndex);

      if (isShuffle) {
        setShuffleIndex(
          shuffleIndex === 0 ? shuffleOrder.length - 1 : shuffleIndex - 1
        );
      }

      onSongChange?.(prevSong);
    }
  };

  const toggleShuffle = () => {
    const newShuffle = !isShuffle;
    setIsShuffle(newShuffle);

    if (newShuffle && playlist?.songs) {
      // Generate new shuffle order
      const indices = Array.from(
        { length: playlist.songs.length },
        (_, i) => i
      );
      const shuffled = [...indices].sort(() => Math.random() - 0.5);
      setShuffleOrder(shuffled);

      // Set shuffle index to current song position in new shuffle order
      const shufflePos = shuffled.findIndex((i) => i === currentSongIndex);
      setShuffleIndex(shufflePos >= 0 ? shufflePos : 0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const hasPlaylist = playlist?.songs && playlist.songs.length > 1;
  const canGoNext = hasPlaylist;
  const canGoPrevious = hasPlaylist;

  return (
    <Card className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-50">
      <audio ref={audioRef} src={song.audio_url} />

      <div className="flex items-center justify-between">
        {/* Song Info */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
            {song.cover_image ? (
              <img
                src={song.cover_image || "/placeholder.svg"}
                alt={song.title}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <Play className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-white font-medium truncate">{song.title}</h4>
            <p className="text-gray-400 text-sm truncate">{song.artist}</p>
            {playlist && (
              <p className="text-gray-500 text-xs truncate">
                {isShuffle ? "Shuffling" : "Playing from"} {playlist.name} •{" "}
                {currentSongIndex + 1} of {playlist.songs.length}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center space-y-2 flex-2">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleShuffle}
              className={`${isShuffle ? "text-green-500" : "text-gray-400"} ${
                !hasPlaylist ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={!hasPlaylist}
              title={
                hasPlaylist
                  ? isShuffle
                    ? "Disable shuffle"
                    : "Enable shuffle"
                  : "Shuffle requires a playlist"
              }
            >
              <Shuffle className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              className={`text-gray-400 hover:text-white ${
                !canGoPrevious ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={!canGoPrevious}
              title={
                canGoPrevious ? "Previous song" : "Previous requires a playlist"
              }
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="bg-white text-black hover:bg-gray-200 w-10 h-10 rounded-full"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className={`text-gray-400 hover:text-white ${
                !canGoNext ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={!canGoNext}
              title={canGoNext ? "Next song" : "Next requires a playlist"}
            >
              <SkipForward className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRepeat(!isRepeat)}
              className={isRepeat ? "text-green-500" : "text-gray-400"}
              title={isRepeat ? "Disable repeat" : "Enable repeat"}
            >
              <Repeat className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center space-x-2 w-full max-w-md">
            <span className="text-xs text-gray-400 w-10">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs text-gray-400 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Like, Volume & Close */}
        <div className="flex items-center space-x-4 flex-1 justify-end">
          {/* Like Button */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLike}
              className={`${
                isLiked
                  ? "text-red-500 hover:text-red-400"
                  : "text-gray-400 hover:text-red-400"
              } transition-colors`}
              title={isLiked ? "Remove from liked songs" : "Add to liked songs"}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            </Button>
            {likesCount > 0 && (
              <span className="text-xs text-gray-400 min-w-0">
                {likesCount}
              </span>
            )}
          </div>

          {/* Volume Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-gray-400"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
