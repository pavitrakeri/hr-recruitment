// A script to fix historical data issues in the database.
// Run this script from your project root using: node ./scripts/fix_old_applications.mjs

import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// These values are taken from your src/integrations/supabase/client.ts file.
const SUPABASE_URL = "https://oljeyylnbfoudlssmmgg.supabase.co";

// IMPORTANT: You MUST provide your Supabase service role key below.
// This key is required to bypass Row Level Security for data migration.
// Find it in your Supabase project: Project Settings > API > Service role key
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9samV5eWxuYmZvdWRsc3NtbWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEzOTk3MiwiZXhwIjoyMDY1NzE1OTcyfQ.NhmlBjQsJAV-TDSfBlgcKQATwKOY_IfsAnnbwToDQRw";


// --- SCRIPT ---
if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY === "YOUR_SUPABASE_SERVICE_ROLE_KEY") {
    console.error("\n❌ ERROR: Supabase service role key is not set.");
    console.error("Please edit this script and replace 'YOUR_SUPABASE_SERVICE_ROLE_KEY' with your actual service key.");
    console.error("You can find the key in your Supabase project dashboard under: Project Settings > API > Service role key\n");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log("✅ Supabase client initialized. Starting data fix...");

async function fixFilePaths() {
    console.log("\n--- 1. Fixing file paths with 'uploads/' prefix ---");

    const { data: apps, error: fetchError } = await supabase
        .from('applications')
        .select('id, resume_url, audio_url')
        .or('resume_url.like.uploads/%,audio_url.like.uploads/%');

    if (fetchError) {
        console.error("❌ Error fetching applications:", fetchError.message);
        return;
    }

    if (!apps || apps.length === 0) {
        console.log("✅ No applications found with 'uploads/' prefix. Paths seem OK.");
        return;
    }

    console.log(`Found ${apps.length} applications with potential path issues.`);

    for (const app of apps) {
        const updates = {};

        if (app.resume_url && app.resume_url.startsWith('uploads/')) {
            const newResumePath = app.resume_url.replace('uploads/', '');
            const { data: file } = await supabase.storage.from('applications').list('', { search: newResumePath, limit: 1 });
            if (file && file.length > 0) {
                updates.resume_url = newResumePath;
                console.log(`[App ID: ${app.id}] Staging resume path update: ${newResumePath}`);
            } else {
                 console.warn(`[App ID: ${app.id}] ⚠️ Resume not found at new path '${newResumePath}'. Leaving original path unchanged.`);
            }
        }

        if (app.audio_url && app.audio_url.startsWith('uploads/')) {
            const newAudioPath = app.audio_url.replace('uploads/', '');
            const { data: file } = await supabase.storage.from('applications').list('', { search: newAudioPath, limit: 1 });
            if (file && file.length > 0) {
                updates.audio_url = newAudioPath;
                console.log(`[App ID: ${app.id}] Staging audio path update: ${newAudioPath}`);
            } else {
                console.warn(`[App ID: ${app.id}] ⚠️ Audio not found at new path '${newAudioPath}'. Leaving original path unchanged.`);
            }
        }

        if (Object.keys(updates).length > 0) {
            const { error: updateError } = await supabase.from('applications').update(updates).eq('id', app.id);
            if (updateError) {
                console.error(`[App ID: ${app.id}] ❌ Failed to update paths:`, updateError.message);
            } else {
                console.log(`[App ID: ${app.id}] ✅ Successfully updated paths in the database.`);
            }
        }
    }
    console.log("--- File path fixing finished ---");
}

async function linkOrphanApplications() {
    console.log("\n--- 2. Linking orphan applications to candidates ---");
    
    const { data: orphanApps, error: fetchError } = await supabase
        .from('applications')
        .select('id, email')
        .is('candidate_id', null);

    if (fetchError) {
        console.error("❌ Error fetching orphan applications:", fetchError.message);
        return;
    }

    if (!orphanApps || orphanApps.length === 0) {
        console.log("✅ No orphan applications found. All applications are linked.");
        return;
    }

    console.log(`Found ${orphanApps.length} orphan applications to link.`);

    for (const app of orphanApps) {
        if (!app.email) {
            console.warn(`[App ID: ${app.id}] ⚠️ Skipping, application has no email.`);
            continue;
        }

        const { data: candidate, error: candidateError } = await supabase
            .from('candidate_profiles')
            .select('id')
            .eq('email', app.email)
            .maybeSingle();
        
        if (candidateError) {
            console.error(`[App ID: ${app.id}] ❌ Error finding candidate for email ${app.email}:`, candidateError.message);
            continue;
        }

        if (candidate) {
            const { error: updateError } = await supabase
                .from('applications')
                .update({ candidate_id: candidate.id })
                .eq('id', app.id);
            
            if (updateError) {
                console.error(`[App ID: ${app.id}] ❌ Failed to link to candidate ${candidate.id}:`, updateError.message);
            } else {
                console.log(`[App ID: ${app.id}] ✅ Successfully linked to candidate ${candidate.id} for email ${app.email}.`);
            }
        } else {
            console.warn(`[App ID: ${app.id}] ⚠️ No candidate profile found for email: ${app.email}. Cannot link.`);
        }
    }
    console.log("--- Orphan application linking finished ---");
}

async function main() {
    await fixFilePaths();
    await linkOrphanApplications();
    console.log("\n🚀 Data fixing script finished. Please check your data in the Supabase dashboard.");
}

main().catch(err => {
    console.error("\n❌ An unexpected error occurred:", err);
});