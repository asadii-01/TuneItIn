"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Music, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { parseBlob } from "music-metadata-browser";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [description, setDescription] = useState("");
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [user, setUser] = useState(null);

  const audioInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

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

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file);
    } else {
      alert("Please select a valid audio file");
    }
  };

  const getMetaData = async () => {
    const metaData = await parseBlob(audioFile);
    return metaData;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setCoverImage(file);
    } else {
      alert("Please select a valid image file");
    }
  };

  const uploadFile = async (file, bucket, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;
    return data;
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!audioFile) {
      alert("Please select an audio file");
      return;
    }

    if (!user) {
      alert("Please log in to upload songs");
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // Upload audio file
      const audioFileName = `${Date.now()}-${audioFile.name}`;
      const safeName = audioFileName.replace(/[^a-z0-9.\-_]/gi, "_");
      console.log(safeName);
      const audioPath = `songs/${user.id}/${safeName}`;

      setUploadProgress(25);
      await uploadFile(audioFile, "audio-files", audioPath);

      // Get public URL for audio
      const { data: audioUrlData } = supabase.storage
        .from("audio-files")
        .getPublicUrl(audioPath);

      setUploadProgress(50);

      // Upload cover image if provided
      let coverImageUrl = null;
      if (coverImage) {
        const imageFileName = `${Date.now()}-${coverImage.name}`;
        const safeImagName = imageFileName.replace(/[^a-z0-9.\-_]/gi, '_');
        console.log(safeImagName);
        const imagePath = `covers/${user.id}/${safeImagName}`;

        await uploadFile(coverImage, "images", imagePath);

        const { data: imageUrlData } = supabase.storage
          .from("images")
          .getPublicUrl(imagePath);

        coverImageUrl = imageUrlData.publicUrl;
      }

      setUploadProgress(75);

      // Get audio metadata
      const metaData = await getMetaData();
      console.log(metaData.format.duration);

      // Save song metadata to database
      const { data, error } = await supabase
        .from("songs")
        .insert([
          {
            title,
            artist,
            album: album || null,
            description: description || null,
            audio_url: audioUrlData.publicUrl,
            cover_image: coverImageUrl,
            user_id: user.id,
            duration: Math.floor(metaData.format.duration),
            plays: 0,
            likes: 0,
          },
        ])
        .select();

      if (error) throw error;

      setUploadProgress(100);
      alert("Song uploaded successfully!");
      router.push("/");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed: " + error.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <Music className="w-16 h-16 mx-auto mb-4 animate-pulse" />
          <p>Loading...</p>
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
            href="/"
            className="flex items-center space-x-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-4 ml-8">
            <Music className="w-8 h-8 text-green-500" />
            <h1 className="text-2xl font-bold">Upload Music</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-green-500">
              <Upload className="w-6 h-6 mr-2" />
              Upload Your Song
            </CardTitle>
            <CardDescription className="text-gray-400">
              Share your music with the world. Fill in the details below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              {/* Audio File Upload */}
              <div className="space-y-2 text-gray-400">
                <Label htmlFor="audio">Audio File *</Label>
                <div
                  className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-gray-600 transition-colors"
                  onClick={() => audioInputRef.current?.click()}
                >
                  {audioFile ? (
                    <div>
                      <Music className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p className="text-green-500">{audioFile.name}</p>
                      <p className="text-sm text-gray-400">
                        Click to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-400">
                        Click to upload audio file
                      </p>
                      <p className="text-sm text-gray-500">
                        MP3, WAV, FLAC, M4a supported
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioChange}
                  className="hidden"
                  required
                />
              </div>

              {/* Cover Image Upload */}
              <div className="space-y-2 text-gray-400">
                <Label htmlFor="image">Cover Image</Label>
                <div
                  className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-gray-600 transition-colors"
                  onClick={() => imageInputRef.current?.click()}
                >
                  {coverImage ? (
                    <div>
                      <img
                        src={
                          URL.createObjectURL(coverImage) || "/placeholder.svg"
                        }
                        alt="Cover preview"
                        className="w-20 h-20 mx-auto mb-2 rounded object-cover"
                      />
                      <p className="text-green-500">{coverImage.name}</p>
                      <p className="text-sm text-gray-400">
                        Click to change image
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-400">
                        Click to upload cover image
                      </p>
                      <p className="text-sm text-gray-500">
                        JPG, PNG supported
                      </p>
                    </div>
                  )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* Song Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 text-gray-400">
                  <Label htmlFor="title">Song Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter song title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
                <div className="space-y-2 text-gray-400">
                  <Label htmlFor="artist">Artist *</Label>
                  <Input
                    id="artist"
                    placeholder="Enter artist name"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    required
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2 text-gray-400">
                <Label htmlFor="album">Album</Label>
                <Input
                  id="album"
                  placeholder="Enter album name (optional)"
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div className="space-y-2 text-gray-400">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell us about your song (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  rows={3}
                />
              </div>

              {/* Upload Progress */}
              {loading && (
                <div className="space-y-2 text-gray-400">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600"
                disabled={loading}
              >
                {loading ? "Uploading..." : "Upload Song"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
