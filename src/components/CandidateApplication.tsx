import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const CandidateApplication = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState<any>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      setJobLoading(true);
      try {
        const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).single();
        if (error || !data) {
          setJobError("Job not found.");
        } else {
          setJob(data);
        }
      } catch (err) {
        setJobError("Failed to fetch job details.");
      } finally {
        setJobLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const renderDescription = (description: string) => {
    if (!description) return null;
    return description.split('\n\n').map((section, index) => {
      const lines = section.split('\n').map(line => line.trim());
      const title = lines[0];
      const content = lines.slice(1).join('\n');
      
      if (title.endsWith(':')) {
        return (
          <div key={index} className="mb-6">
            <h3 className="text-gray-800 text-md font-semibold mt-4 mb-2">{title}</h3>
            <div className="pl-4 text-gray-600 whitespace-pre-wrap">{content}</div>
          </div>
        );
      }
      return <div key={index} className="mb-4 whitespace-pre-wrap">{section}</div>;
    });
  };

  if (jobLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (jobError) {
    return <div className="min-h-screen flex items-center justify-center">{jobError}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 sm:p-8">
      <main className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl">{job.title}</CardTitle>
                <CardDescription className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {job.company_name || 'Aimploy'}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{job.type}</Badge>
                <Badge variant="secondary">{job.department}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
             <div className="mt-6">
               <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">About the job</h3>
               <div className="mt-4 text-gray-700">
                 {renderDescription(job.description)}
               </div>
             </div>
            <Button asChild className="w-full mt-8">
              <Link to={`/job/${jobId}/apply`} target="_blank" rel="noopener noreferrer">
                Apply for this position
              </Link>
              </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CandidateApplication;
