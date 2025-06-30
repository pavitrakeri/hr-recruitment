import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  title: string;
  type: string;
  location: string;
  department: string;
  description: string;
  status: string;
  created_at: string;
}

export const useJobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchJobs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('hr_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading jobs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (jobData: Omit<Job, 'id' | 'created_at' | 'status'>) => {
    if (!user) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([{
          ...jobData,
          hr_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setJobs(prev => [data, ...prev]);
      toast({
        title: "Job created successfully!",
        description: "Your job posting is now live.",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error creating job",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setCreating(false);
    }
  };

  const updateJob = async (jobId: string, jobData: Partial<Job>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', jobId)
        .eq('hr_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setJobs(prev => prev.map(job => job.id === jobId ? data : job));
      toast({
        title: "Job updated successfully!",
        description: "Your job posting has been updated.",
      });

      return data;
    } catch (error: any) {
      toast({
        title: "Error updating job",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('hr_id', user.id);

      if (error) throw error;

      setJobs(prev => prev.filter(job => job.id !== jobId));
      await fetchJobs();
      return true;
    } catch (error: any) {
      toast({
        title: "Error deleting job",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  return {
    jobs,
    loading,
    creating,
    createJob,
    updateJob,
    deleteJob,
    refetch: fetchJobs,
  };
};
