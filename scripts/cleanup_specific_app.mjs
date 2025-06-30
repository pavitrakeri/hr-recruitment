// A script to clean up specific broken application records in the database.
// Run this script from your project root using: node ./scripts/cleanup_specific_app.mjs

import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const SUPABASE_URL = "https://oljeyylnbfoudlssmmgg.supabase.co";

// This is the service key you provided earlier.
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9samV5eWxuYmZvdWRsc3NtbWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEzOTk3MiwiZXhwIjoyMDY1NzE1OTcyfQ.NhmlBjQsJAV-TDSfBlgcKQATwKOY_IfsAnnbwToDQRw";

// The ID of the specific application record to clean up.
const APPLICATION_ID_TO_FIX = "2c1f9f2b-aab5-4b60-ae46-f2d530e28347";

// --- SCRIPT ---
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log(`✅ Supabase client initialized. Attempting to clean up application ID: ${APPLICATION_ID_TO_FIX}`);

async function cleanupBrokenRecord() {
    const { data, error } = await supabase
        .from('applications')
        .update({
            resume_url: null,
            audio_url: null
        })
        .eq('id', APPLICATION_ID_TO_FIX)
        .select();

    if (error) {
        console.error(`❌ Error updating application record:`, error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log(`\n✅ Successfully cleaned up the application record.`);
        console.log("The 'resume_url' and 'audio_url' have been set to NULL to prevent 'Object not found' errors.");
    } else {
        console.warn(`\n⚠️ Could not find an application with the ID: ${APPLICATION_ID_TO_FIX}. No changes were made.`);
    }
}

cleanupBrokenRecord().catch(err => {
    console.error("\n❌ An unexpected error occurred:", err);
}); 