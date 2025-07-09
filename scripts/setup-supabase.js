import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  console.log("Please set:");
  console.log("- NEXT_PUBLIC_SUPABASE_URL");
  console.log("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSupabase() {
  try {
    console.log("🚀 Setting up Supabase for TuneItIn...");

    // Test connection
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (error) {
      console.error("❌ Connection failed:", error.message);
      console.log("\n📝 Setup Instructions:");
      console.log("1. Run the SQL scripts in your Supabase Dashboard:");
      console.log("   - Go to your Supabase project dashboard");
      console.log("   - Navigate to SQL Editor");
      console.log("   - Run scripts/init-supabase.sql");
      console.log("   - Run scripts/setup-storage.sql");
      console.log(
        "\n2. Make sure your environment variables are set correctly"
      );
      return;
    }

    console.log("✅ Connected to Supabase successfully!");

    // Check if tables exist
    const tables = ["profiles", "songs", "playlists", "playlist_songs"];

    for (const table of tables) {
      const { error } = await supabase.from(table).select("count").limit(1);
      if (error) {
        console.log(`❌ Table '${table}' not found`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    }

    // Check storage buckets
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log("❌ Could not check storage buckets:", bucketsError.message);
    } else {
      const requiredBuckets = ["audio-files", "images"];
      requiredBuckets.forEach((bucket) => {
        const exists = buckets.find((b) => b.id === bucket);
        if (exists) {
          console.log(`✅ Storage bucket '${bucket}' exists`);
        } else {
          console.log(`❌ Storage bucket '${bucket}' not found`);
        }
      });
    }

    console.log("\n🎉 Supabase setup verification complete!");
    console.log("\n📋 Next steps:");
    console.log(
      "1. If any tables or buckets are missing, run the SQL scripts in Supabase Dashboard"
    );
    console.log("2. Start your Next.js application: npm run dev");
    console.log("3. Create an account and start uploading music!");
  } catch (error) {
    console.error("❌ Setup failed:", error.message);
  }
}

setupSupabase();
