import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { Application, AudioTranscription, CandidateReport } from '@/integrations/supabase/types';

export interface ApplicationWithDetails extends Application {
  job?: {
    title: string;
    department: string;
  };
  audio_transcription?: AudioTranscription;
  candidate_report?: CandidateReport;
}

export type TimeFilter = '24h' | '3d' | '1w' | 'all';

export const useApplications = () => {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchApplications = async (jobId?: string) => {
    if (!user) return;

    try {
      // First, get the job IDs that belong to the user
      const { data: userJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .eq('hr_id', user.id);

      if (jobsError) throw jobsError;

      const jobIds = userJobs.map(job => job.id);
      if (jobIds.length === 0) {
        setApplications([]);
        applyFilters([], jobId, timeFilter);
        return;
      }

      // Build the applications query
      let query = supabase
        .from('applications')
        .select(`
          *,
          job:jobs(title, department)
        `)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data: applicationsData, error: applicationsError } = await query;

      if (applicationsError) throw applicationsError;

      // Now fetch audio transcriptions and candidate reports separately
      const applicationIds = applicationsData.map(app => app.id);
      
      let audioTranscriptions: any[] = [];
      let candidateReports: any[] = [];

      if (applicationIds.length > 0) {
        // Fetch audio transcriptions
        const { data: audioData, error: audioError } = await supabase
          .from('audio_transcriptions')
          .select('*')
          .in('application_id', applicationIds);

        if (!audioError) {
          audioTranscriptions = audioData || [];
        }

        // Fetch candidate reports
        const { data: reportsData, error: reportsError } = await supabase
          .from('candidate_reports')
          .select('*')
          .in('application_id', applicationIds);

        if (!reportsError) {
          candidateReports = reportsData || [];
        }
      }

      // Combine the data
      const enrichedApplications = applicationsData.map(app => ({
        ...app,
        audio_transcription: audioTranscriptions.find(at => at.application_id === app.id),
        candidate_report: candidateReports.find(cr => cr.application_id === app.id)
      }));

      setApplications(enrichedApplications);
      applyFilters(enrichedApplications, jobId, timeFilter);
    } catch (error: any) {
      toast({
        title: "Error loading applications",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (apps: ApplicationWithDetails[], jobId: string | null, timeFilter: TimeFilter) => {
    let filtered = [...apps];

    // Apply job filter
    if (jobId) {
      filtered = filtered.filter(app => app.job_id === jobId);
    }

    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      switch (timeFilter) {
        case '24h':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '3d':
          cutoffDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          break;
        case '1w':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(app => new Date(app.created_at) >= cutoffDate);
    }

    setFilteredApplications(filtered);
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status } : app
        )
      );

      setFilteredApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status } : app
        )
      );

      toast({
        title: "Status updated",
        description: "Application status has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const createAudioTranscription = async (applicationId: string, audioUrl: string) => {
    try {
      const { data, error } = await supabase
        .from('audio_transcriptions')
        .insert([{
          application_id: applicationId,
          audio_url: audioUrl,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // Update applications state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, audio_transcription: data }
            : app
        )
      );

      setFilteredApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, audio_transcription: data }
            : app
        )
      );

      return data;
    } catch (error: any) {
      toast({
        title: "Error creating transcription",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTranscription = async (transcriptionId: string, transcriptionText: string) => {
    try {
      const { data, error } = await supabase
        .from('audio_transcriptions')
        .update({ 
          transcription_text: transcriptionText,
          status: 'completed'
        })
        .eq('id', transcriptionId)
        .select()
        .single();

      if (error) throw error;

      // Update applications state
      setApplications(prev => 
        prev.map(app => 
          app.audio_transcription?.id === transcriptionId
            ? { ...app, audio_transcription: data }
            : app
        )
      );

      setFilteredApplications(prev => 
        prev.map(app => 
          app.audio_transcription?.id === transcriptionId
            ? { ...app, audio_transcription: data }
            : app
        )
      );

      toast({
        title: "Transcription updated",
        description: "Audio transcription has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating transcription",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const createCandidateReport = async (applicationId: string, reportData: any) => {
    try {
      const { data, error } = await supabase
        .from('candidate_reports')
        .insert([{
          application_id: applicationId,
          ai_analysis: reportData.ai_analysis,
          skills_assessment: reportData.skills_assessment,
          personality_insights: reportData.personality_insights,
          overall_score: reportData.overall_score || 0
        }])
        .select()
        .single();

      if (error) throw error;

      // Update applications state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, candidate_report: data }
            : app
        )
      );

      setFilteredApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, candidate_report: data }
            : app
        )
      );

      toast({
        title: "Report created",
        description: "Candidate report has been created successfully.",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error creating report",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const filterByJob = (jobId: string | null) => {
    setSelectedJobId(jobId);
    applyFilters(applications, jobId, timeFilter);
  };

  const filterByTime = (filter: TimeFilter) => {
    setTimeFilter(filter);
    applyFilters(applications, selectedJobId, filter);
  };

  const submitApplication = async (
    application: Omit<Application, "id" | "ai_score" | "status" | "created_at" | "updated_at" | "candidate_id" | "resume_url" | "audio_qas"> & {
      resumeFile?: File;
      audioQAs?: { question: string, audioBlob: Blob }[];
    }
  ) => {
    if (!user) {
      throw new Error("User is not authenticated.");
    }

    let { resumeFile, audioQAs, ...applicationData } = application;
    let resume_url: string | undefined = undefined;
    let audio_qas_urls: { question: string, answer_url: string }[] = [];

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, hr_id, title')
      .eq('id', application.job_id)
      .single();

    if (jobError || !job) {
      throw new Error("Job not found or user does not have permission.");
    }

    const safeJobTitle = job.title.replace(/[^a-zA-Z0-9-_]/g, "_");

    // Upload resume if provided
    if (resumeFile) {
      const ext = resumeFile.name.split('.').pop();
      const resumePath = `${job.id}/${job.hr_id}/${safeJobTitle}/resume.${ext}`;
      const { data, error } = await supabase.storage
        .from('applications')
        .upload(resumePath, resumeFile, { upsert: true });

      if (error) throw new Error(`Resume upload failed: ${error.message}`);
      resume_url = data.path;
    }

    // Upload audio answers if provided
    if (audioQAs) {
      for (let i = 0; i < audioQAs.length; i++) {
        const qa = audioQAs[i];
        const audioPath = `${job.id}/${job.hr_id}/${safeJobTitle}/audio_q${i + 1}.webm`;
        const { data, error } = await supabase.storage
          .from('applications')
          .upload(audioPath, qa.audioBlob, { upsert: true });
        if (error) throw new Error(`Audio upload failed for Q${i + 1}: ${error.message}`);
        audio_qas_urls.push({ question: qa.question, answer_url: data.path });
      }
    }

    const applicationToInsert = {
      ...applicationData,
      candidate_id: user.id,
      resume_url,
      audio_qas: audio_qas_urls,
      status: 'new' as const,
    };
    
    // Insert application into the database
    const { data: newApplication, error } = await supabase
      .from('applications')
      .insert(applicationToInsert)
      .select()
      .single();

    if (error) throw error;
    
    // Refresh applications list
    await fetchApplications();

    return newApplication;
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  useEffect(() => {
    if (selectedJobId) {
      fetchApplications(selectedJobId);
    }
  }, [selectedJobId]);

  return {
    applications: filteredApplications,
    allApplications: applications,
    loading,
    selectedJobId,
    timeFilter,
    updateApplicationStatus,
    createAudioTranscription,
    updateTranscription,
    createCandidateReport,
    filterByJob,
    filterByTime,
    refetch: () => fetchApplications(selectedJobId || undefined),
    submitApplication,
  };
};
