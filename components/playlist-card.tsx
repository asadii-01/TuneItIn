"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect } from "react";
import { set } from "react-hook-form";

interface PlaylistCardProps {
  playlist: {
    id: string;
    name: string;
    description?: string;
    playlist_songs?: any[];
    cover_image?: string;
  };
  onRefresh?: () => void;
}

export function PlaylistCard({ playlist, onRefresh }: PlaylistCardProps) {
  const [songCount, setSongCount] = useState(0);

  const fetchSongCount = async () => {
    const { data, error } = await supabase
      .from("playlist_songs")
      .select("*", { count: "exact" })
      .eq("playlist_id", playlist.id);

    setSongCount(data?.length || 0);
  };

  useEffect(() => {
    fetchSongCount();
  }, [playlist]);

  return (
    <Link href={`/playlists/${playlist.id}`}>
      <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors group cursor-pointer">
        <CardContent className="p-4">
          <div className="relative mb-4">
            <div className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center">
              {playlist.cover_image ? (
                <img
                  src={playlist.cover_image || "/placeholder.svg"}
                  alt={playlist.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Music className="w-12 h-12 text-gray-400" />
              )}
            </div>
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute bottom-2 right-2 bg-green-500 hover:bg-green-600 rounded-full w-10 h-10 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Play className="w-4 h-4" />
            </Button>
          </div>
          <h3 className="font-semibold text-white mb-1 truncate">
            {playlist.name}
          </h3>
          <p className="text-sm text-gray-400 truncate">
            {playlist.description || `${songCount} songs`}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
