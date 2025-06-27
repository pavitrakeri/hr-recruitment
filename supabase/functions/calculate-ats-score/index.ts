// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Hello from Functions!")

import { serve } from "std/server";
import pdf from "pdf-parse";
import fetch from "node-fetch";

serve(async (req) => {
  try {
    const { application_id, resume_url, job_id } = await req.json();

    // 1. Download the resume PDF from Supabase Storage
    const resumeRes = await fetch(resume_url);
    if (!resumeRes.ok) throw new Error("Failed to download resume");
    const resumeBuffer = await resumeRes.arrayBuffer();

    // 2. Extract text from PDF
    const resumeText = await pdf(Buffer.from(resumeBuffer)).then(data => data.text);

    // 3. Fetch job description from your DB (call Supabase REST API)
    const jobRes = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/jobs?id=eq.${job_id}`,
      {
        headers: {
          apikey: Deno.env.get("SUPABASE_ANON_KEY"),
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
      }
    );
    const jobData = await jobRes.json();
    const jobDescription = jobData[0]?.description || "";

    // 4. Simple keyword match scoring
    const jobKeywords = jobDescription.toLowerCase().match(/\b\w+\b/g)?.filter(w => w.length > 3) || [];
    const resumeLower = resumeText.toLowerCase();
    let matches = 0;
    jobKeywords.forEach(word => {
      if (resumeLower.includes(word)) matches++;
    });
    const ai_score = jobKeywords.length ? Math.round((matches / jobKeywords.length) * 100) : 0;

    // 5. Update the application record with the score
    await fetch(
      `${Deno.env.get("SUPABASE_URL")}/rest/v1/applications?id=eq.${application_id}`,
      {
        method: "PATCH",
        headers: {
          apikey: Deno.env.get("SUPABASE_ANON_KEY"),
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ai_score }),
      }
    );

    return new Response(JSON.stringify({ ai_score }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/calculate-ats-score' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
