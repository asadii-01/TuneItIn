"use client";

import { useState, useEffect, useRef } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  User,
  ArrowLeft,
  Camera,
  Music,
  Upload,
  Heart,
  Settings,
  Save,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ songs: 0, playlists: 0, totalPlays: 0 });

  const avatarInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUser(user);
      await fetchProfile(user.id);
      await fetchStats(user.id);
    } catch (error) {
      console.error("Error checking user:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProfile(data);
        setName(data.name || "");
        setBio(data.bio || "");
      } else {
        // Create profile if it doesn't exist
        const newProfile = {
          id: userId,
          name: user?.user_metadata?.name || "",
          bio: "",
        };

        const { data: createdProfile, error: createError } = await supabase
          .from("profiles")
          .insert([newProfile])
          .select()
          .single();

        if (createError) throw createError;
        setProfile(createdProfile);
        setName(createdProfile.name || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchStats = async (userId) => {
    try {
      // Get songs count
      const { count: songsCount } = await supabase
        .from("songs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Get playlists count
      const { count: playlistsCount } = await supabase
        .from("playlists")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Get total plays
      const { data: songsData } = await supabase
        .from("songs")
        .select("plays")
        .eq("user_id", userId);

      const totalPlays =
        songsData?.reduce((sum, song) => sum + (song.plays || 0), 0) || 0;

      setStats({
        songs: songsCount || 0,
        playlists: playlistsCount || 0,
        totalPlays,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setAvatarFile(file);
    } else {
      alert("Please select a valid image file");
    }
  };

  const uploadAvatar = async (file, userId) => {
    const fileName = `${userId}-${Date.now()}.${file.name.split(".").pop()}`;
    const filePath = `avatars/${fileName}`;

    const { data, error } = await supabase.storage
      .from("images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      let avatarUrl = profile?.avatar_url;

      // Upload new avatar if selected
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile, user.id);
      }

      // Update profile
      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          name,
          bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      setAvatarFile(null);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone and will delete all your songs and playlists."
      )
    ) {
      try {
        // This would typically be handled by a server function
        // For now, just sign out the user
        await supabase.auth.signOut();
        router.push("/");
      } catch (error) {
        console.error("Error deleting account:", error);
        alert("Failed to delete account");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-center">
          <User className="w-16 h-16 mx-auto mb-4 animate-pulse text-green-500" />
          <p>Loading profile...</p>
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
            <User className="w-8 h-8 text-green-500" />
            <h1 className="text-2xl font-bold">Profile Settings</h1>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-6 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="text-center">
                <div className="relative mx-auto w-32 h-32 mb-4">
                  <div className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url || avatarFile ? (
                      <img
                        src={
                          avatarFile
                            ? URL.createObjectURL(avatarFile)
                            : profile?.avatar_url || "/placeholder.svg"
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-green-600 hover:bg-green-700 rounded-full w-10 h-10"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <CardTitle className="text-xl text-white">
                  {name || "Anonymous User"}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {user?.email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Music className="w-4 h-4 text-green-500" />
                      <span className="text-sm">Songs</span>
                    </div>
                    <span className="font-semibold">{stats.songs}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Upload className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Playlists</span>
                    </div>
                    <span className="font-semibold">{stats.playlists}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      <span className="text-sm">Total Plays</span>
                    </div>
                    <span className="font-semibold">{stats.totalPlays}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Settings */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center text-gray-300">
                  <Settings className="w-5 h-5 mr-2 text-green-500" />
                  Profile Settings
                </CardTitle>
                <CardDescription>
                  Update your profile information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2 text-gray-400">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your display name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>

                  <div className="space-y-2 text-gray-400">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-gray-800 border-gray-700 text-gray-400"
                    />
                    <p className="text-xs text-gray-500">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="space-y-2 text-gray-400">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Tell us about yourself..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                      rows={4}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </form>

                <Separator className="my-6 bg-gray-700" />

                {/* Danger Zone */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-400">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-gray-400">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <Button
                    onClick={handleDeleteAccount}
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
