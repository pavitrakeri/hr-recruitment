import { useCandidate } from "@/hooks/useCandidate";
import { CandidateSidebar } from "@/components/CandidateSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Briefcase, MapPin, ArrowRight } from "lucide-react";
import JobApplicationForm from "@/components/JobApplicationForm";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const SubmitAndTrack = () => {
  const { jobs, loading, hasApplied } = useCandidate();
  const [openFormJobId, setOpenFormJobId] = useState(null);

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <CandidateSidebar />
      <main className="flex-1 lg:ml-64 p-8">
        <h1 className="text-3xl font-bold mb-6">Find Your Next Role</h1>
        <p className="text-gray-600 mb-8">Browse through the open positions and submit your application.</p>
        
        {loading ? (
            <p>Loading jobs...</p>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map(job => (
                    <Card key={job.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{job.title}</CardTitle>
                            <CardDescription>Company</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-3">
                            <div className="flex items-center text-sm text-gray-500">
                                <Briefcase className="w-4 h-4 mr-2" />
                                <span>{job.department}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                                <MapPin className="w-4 h-4 mr-2" />
                                <span>{job.location}</span>
                            </div>
                        </CardContent>
                        <div className="p-6 pt-0">
                           {hasApplied(job.id) ? (
                               <Button className="w-full" disabled>Applied</Button>
                           ) : (
                               <Dialog open={openFormJobId === job.id} onOpenChange={open => setOpenFormJobId(open ? job.id : null)}>
                                 <DialogTrigger asChild>
                                   <Button className="w-full" onClick={() => setOpenFormJobId(job.id)}>
                                     Apply Now <ArrowRight className="w-4 h-4 ml-2" />
                                   </Button>
                                 </DialogTrigger>
                                 <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-0 flex items-center justify-center">
                                   <div className="w-full p-6">
                                     <JobApplicationForm job={job} onSubmitted={() => setOpenFormJobId(null)} />
                                   </div>
                                 </DialogContent>
                               </Dialog>
                           )}
                        </div>
                    </Card>
                ))}
            </div>
        )}
      </main>
    </div>
  );
};

export default SubmitAndTrack; 