// A script to find applications with missing resume URLs and link them to the candidate's primary profile resume.
// Run this script from your project root using: node ./scripts/link_profile_resumes.mjs

import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const SUPABASE_URL = "https://oljeyylnbfoudlssmmgg.supabase.co";

// This is the service key you provided earlier.
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9samV5eWxuYmZvdWRsc3NtbWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEzOTk3MiwiZXhwIjoyMDY1NzE1OTcyfQ.NhmlBjQsJAV-TDSfBlgcKQATwKOY_IfsAnnbwToDQRw";

// --- SCRIPT ---
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log("✅ Supabase client initialized. Attempting to link missing resume URLs.");

async function linkMissingResumes() {
    // Find applications that are missing a resume_url but are linked to a candidate
    const { data: apps, error: fetchError } = await supabase
        .from('applications')
        .select('id, candidate_id')
        .is('resume_url', null)
        .not('candidate_id', 'is', null);

    if (fetchError) {
        console.error("❌ Error fetching applications with missing resumes:", fetchError.message);
        return;
    }

    if (!apps || apps.length === 0) {
        console.log("✅ No applications found that need resume linking. All records seem OK.");
        return;
    }

    console.log(`Found ${apps.length} applications with missing resume URLs to process.`);

    for (const app of apps) {
        // Find the candidate's profile to get their primary resume
        const { data: candidate, error: candidateError } = await supabase
            .from('candidate_profiles')
            .select('resume_url')
            .eq('id', app.candidate_id)
            .maybeSingle();

        if (candidateError) {
            console.error(`[App ID: ${app.id}] ❌ Error fetching profile for candidate ${app.candidate_id}:`, candidateError.message);
            continue;
        }

        if (candidate && candidate.resume_url) {
            // If the candidate has a primary resume, update the application record with it.
            const { error: updateError } = await supabase
                .from('applications')
                .update({ resume_url: candidate.resume_url })
                .eq('id', app.id);
            
            if (updateError) {
                console.error(`[App ID: ${app.id}] ❌ Failed to link resume:`, updateError.message);
            } else {
                console.log(`[App ID: ${app.id}] ✅ Successfully linked application to profile resume: ${candidate.resume_url}`);
            }
        } else {
            console.warn(`[App ID: ${app.id}] ⚠️ Candidate ${app.candidate_id} has no primary resume on their profile. Skipping.`);
        }
    }
    console.log("\n--- Resume linking finished ---");
}

linkMissingResumes().catch(err => {
    console.error("\n❌ An unexpected error occurred:", err);
}); 