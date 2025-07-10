"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Music, MoreHorizontal, Trash2, Heart } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SongListItemProps {
  song: {
    id: string;
    title: string;
    artist: string;
    album?: string;
    cover_image?: string;
    duration?: number;
    plays?: number;
    likes?: number;
  };
  index: number;
  onPlay: () => void;
  showRemove?: boolean;
  onRemove?: () => void;
  showLike?: boolean;
}

export function SongListItem({
  song,
  index,
  onPlay,
  showRemove = false,
  onRemove,
  showLike = true,
}: SongListItemProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(song.likes || 0);

  useEffect(() => {
    if (showLike) {
      checkIfLiked();
      fetchCurrentLikesCount();
    }
  }, [song.id, showLike]);

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

  const checkIfLiked = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

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

  const toggleLike = async (e) => {
    e.stopPropagation();

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
        // Add like
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
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-800 transition-colors group">
      <div className="w-8 text-center">
        <span className="text-gray-400 group-hover:hidden">{index}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={onPlay}
          className="hidden group-hover:flex w-8 h-8 p-0 hover:bg-green-600"
        >
          <Play className="w-4 h-4" />
        </Button>
      </div>

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
        <h3 className="font-medium text-white truncate">{song.title}</h3>
        <p className="text-sm text-gray-400 truncate">{song.artist}</p>
      </div>

      {song.album && (
        <div className="hidden md:block flex-1 min-w-0">
          <p className="text-sm text-gray-400 truncate">{song.album}</p>
        </div>
      )}

      {showLike && (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleLike}
            className={`${
              isLiked
                ? "text-red-500 hover:text-red-400"
                : "text-gray-400 hover:text-red-400"
            } opacity-0 group-hover:opacity-100 transition-all`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
          </Button>
          {likesCount > 0 && (
            <span className="text-xs text-gray-400 w-8 text-center">
              {likesCount}
            </span>
          )}
        </div>
      )}

      <div className="hidden sm:block text-sm text-gray-400">
        {song.plays || 0} plays
      </div>

      {song.duration && (
        <div className="text-sm text-gray-400 w-12 text-right">
          {formatDuration(song.duration)}
        </div>
      )}

      {showRemove && onRemove ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-600/20"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
