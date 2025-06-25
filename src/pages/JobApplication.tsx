import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const JobApplication = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) {
        setLoading(false);
        setError("Job ID is missing.");
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('jobs')
          .select(`
            *,
            hr:profiles (
              company_name
            )
          `)
          .eq('id', jobId)
          .single();

        if (error) throw error;
        
        setJob(data);
      } catch (err) {
        console.error("Error fetching job:", err);
        setError("Job not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleApply = () => {
    if (user) {
      navigate(`/job/${jobId}/apply`);
    } else {
      navigate(`/candidate?redirect=/job/${jobId}/apply`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>{error || "Job not found."}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold">{job.title}</CardTitle>
              <CardDescription className="text-lg text-gray-600">{job.hr?.company_name || 'Company not available'}</CardDescription>
            </div>
            <Badge variant="secondary" className="text-base">{job.type}</Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
            <div className="flex items-center space-x-1">
              <Briefcase size={16} />
              <span>{job.department}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin size={16} />
              <span>{job.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={16} />
              <span>Posted on {new Date(job.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <h3 className="text-xl font-semibold mb-4">Job Description</h3>
            <p className="whitespace-pre-wrap">{job.description}</p>
          </div>
          <div className="mt-8">
            <Button size="lg" className="w-full md:w-auto" onClick={handleApply}>
              Apply Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JobApplication;
