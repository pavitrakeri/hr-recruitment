import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/components/ui/use-toast';

// --- Interfaces for Profile Data ---

export interface Experience {
  id: string;
  title: string;
  company: string;
  start_date: string;
  end_date?: string;
  description?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  start_date: string;
  end_date?: string;
}

export interface WorkDetails {
  status?: string;
  notice_period?: string;
  expected_salary?: string;
  relocation?: 'yes' | 'no' | 'within_country';
}

export interface Demographics {
  age_range?: string;
  gender?: string;
  ethnicity?: string;
}

export interface AudioQA {
  question: string;
  answer_url: string;
}

// --- Main Candidate Profile Interface ---

interface CandidateProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  resume_url?: string;
  skills?: string[];
  experience_years: number;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  created_at: string;
  updated_at: string;
  
  // New fields for enhanced profile
  bio?: string;
  avatar_url?: string;
  experience?: Experience[];
  education?: Education[];
  demographics?: Demographics;
  work_details?: WorkDetails;
  audio_qas?: AudioQA[];

  // Fields for settings page
  preferred_locations?: string[];
  preferred_job_types?: string[];
  salary_expectation_min?: number;
  salary_expectation_max?: number;
  is_active?: boolean;
}

interface Job {
  id: string;
  title: string;
  type: string;
  location: string;
  department: string;
  description: string;
  status: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  experience_level?: string;
  required_fields?: string[];
  custom_questions?: any[];
  created_at: string;
}

interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  name: string;
  email: string;
  phone: string;
  cover_letter?: string;
  resume_url?: string;
  audio_url?: string;
  audio_qas?: { question: string; answer_url: string }[];
  ai_score: number;
  status: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  custom_answers?: Record<string, string>;
  created_at: string;
  updated_at: string;
  job: Job;
}

export const useCandidate = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch candidate profile
  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      setProfile(data);
    } catch (error) {
      console.error('Detailed error fetching profile:', error);
    }
  };

  // Update candidate profile
  const updateProfile = async (updates: Partial<CandidateProfile>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('candidate_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Fetch available jobs (only from verified HRs)
  const fetchJobs = async () => {
    try {
      console.log('Fetching jobs...');
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        throw error;
      }
      
      console.log('Jobs fetched successfully:', data);
      console.log('Number of jobs:', data?.length || 0);
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Show error in UI
      toast({
        title: "Error loading jobs",
        description: "Failed to load available jobs. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch candidate's applications
  const fetchApplications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs (*)
        `)
        .eq('candidate_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Submit application with enhanced data
  const submitApplication = async (job: Job, applicationData: {
    cover_letter?: string;
    resume?: File;
    audio?: File;
    audio_qas?: AudioQA[];
    githubUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
    customAnswers?: Record<string, string>;
  }) => {
    if (!user || !profile) return { success: false, error: 'User or profile not loaded' };

    try {
      // Default to the resume from the candidate's main profile.
      let resumeUrl = profile.resume_url || null;
      let audioUrl = null;

      // If a candidate attaches a new, specific resume for this application, upload it.
      if (applicationData.resume) {
        // Create a unique path for this application's resume to avoid overwrites.
        const uniqueFileName = `${Date.now()}_${applicationData.resume.name}`;
        const applicationResumePath = `resumes/${user.id}/${job.id}/${uniqueFileName}`;
        
        const { data: resumeUpload, error: resumeError } = await supabase.storage
          .from('applications')
          .upload(applicationResumePath, applicationData.resume);

        if (resumeError) throw resumeError;
        
        // This specific application will use the path of the newly uploaded resume.
        resumeUrl = resumeUpload.path;
      }

      // Upload audio if provided, storing it in a unique path as well.
      if (applicationData.audio) {
        const uniqueAudioName = `${Date.now()}_${applicationData.audio.name}`;
        const applicationAudioPath = `audio/${user.id}/${job.id}/${uniqueAudioName}`;
        const { data: audioUpload, error: audioError } = await supabase.storage
          .from('applications')
          .upload(applicationAudioPath, applicationData.audio);

        if (audioError) throw audioError;
        audioUrl = audioUpload.path;
      }

      // Create the application record in the database.
      const { data, error } = await supabase
        .from('applications')
        .insert({
          job_id: job.id,
          candidate_id: user.id,
          name: profile?.full_name || user.user_metadata?.full_name || 'Unknown',
          email: user.email!,
          phone: profile?.phone || '',
          cover_letter: applicationData.cover_letter,
          resume_url: resumeUrl,
          audio_qas: applicationData.audio_qas,
          github_url: applicationData.githubUrl,
          linkedin_url: applicationData.linkedinUrl,
          portfolio_url: applicationData.portfolioUrl,
          custom_answers: applicationData.customAnswers,
          status: 'new'
        })
        .select()
        .single();

      if (error) throw error;

      // Update candidate profile with new URLs if provided
      if (applicationData.githubUrl || applicationData.linkedinUrl || applicationData.portfolioUrl) {
        const profileUpdates: Partial<CandidateProfile> = {};
        if (applicationData.githubUrl) profileUpdates.github_url = applicationData.githubUrl;
        if (applicationData.linkedinUrl) profileUpdates.linkedin_url = applicationData.linkedinUrl;
        if (applicationData.portfolioUrl) profileUpdates.portfolio_url = applicationData.portfolioUrl;
        
        await updateProfile(profileUpdates);
      }

      // Manually update the state for instant UI feedback
      const newApplication = { ...data, job };
      setApplications(prev => [newApplication, ...prev]);
      // Fetch applications from DB to ensure up-to-date state
      await fetchApplications();
      return { success: true, data: newApplication };
    } catch (error: any) {
      console.error('Error submitting application:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if candidate has already applied to a job
  const hasApplied = (jobId: string) => {
    return applications.some(app => app.job_id === jobId);
  };

  // Initialize data
  useEffect(() => {
    if (user) {
      Promise.all([
        fetchProfile(),
        fetchJobs(),
        fetchApplications()
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    profile,
    applications,
    jobs,
    loading,
    updateProfile,
    submitApplication,
    hasApplied,
    fetchProfile,
    fetchJobs,
    fetchApplications
  };
}; 