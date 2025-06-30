// A script to fix another specific incorrect file path in the database.
// Run this script from your project root using: node ./scripts/fix_another_specific_path.mjs

import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
const SUPABASE_URL = "https://oljeyylnbfoudlssmmgg.supabase.co";

// This is the service key you provided earlier.
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9samV5eWxuYmZvdWRsc3NtbWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEzOTk3MiwiZXhwIjoyMDY1NzE1OTcyfQ.NhmlBjQsJAV-TDSfBlgcKQATwKOY_IfsAnnbwToDQRw";

const INCORRECT_PATH = "uploads/PAVITRA-KERI-1.pdf";
const CORRECT_PATH = "resumes/bd256d9a-f8ea-47bc-ac3b-b3c80ec9fe09/resume.pdf";

// --- SCRIPT ---
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log(`✅ Supabase client initialized. Attempting to fix a specific file path.`);
console.log(`Searching for records with path: ${INCORRECT_PATH}`);

async function fixSpecificPath() {
    const { data, error } = await supabase
        .from('applications')
        .update({
            resume_url: CORRECT_PATH
        })
        .eq('resume_url', INCORRECT_PATH)
        .select();

    if (error) {
        console.error(`❌ Error updating application record:`, error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log(`\n✅ Successfully updated ${data.length} record(s).`);
        console.log(`The 'resume_url' has been updated to: ${CORRECT_PATH}`);
    } else {
        console.warn(`\n⚠️ Could not find any applications with the path: ${INCORRECT_PATH}. No changes were made.`);
    }
}

fixSpecificPath().catch(err => {
    console.error("\n❌ An unexpected error occurred:", err);
}); 