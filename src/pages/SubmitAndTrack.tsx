import { useCandidate } from "@/hooks/useCandidate";
import { CandidateSidebar } from "@/components/CandidateSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Briefcase, MapPin, ArrowRight } from "lucide-react";
import JobApplicationForm from "@/components/JobApplicationForm";
import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";

const SubmitAndTrack = () => {
  const { jobs, loading, hasApplied } = useCandidate();
  const [openFormJobId, setOpenFormJobId] = useState(null);
  const isMobile = useIsMobile();

  return (
    <div className="flex bg-gradient-to-br from-blue-100 via-white to-purple-100 min-h-screen">
      <CandidateSidebar />
      <main className="flex-1 lg:ml-64 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-gray-900">Find Your Next Role</h1>
          <p className="text-gray-600 mb-8">Browse through the open positions and submit your application.</p>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading available jobs...</p>
              </div>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Available</h3>
              <p className="text-gray-600">Check back later for new opportunities.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map(job => (
                <Card key={job.id} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {job.company_name || 'Company'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-3">
                    <div className="flex items-center text-sm text-gray-500">
                      <Briefcase className="w-4 h-4 mr-2" />
                      <span>{job.department || 'Department'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{job.location || 'Location'}</span>
                    </div>
                    {job.salary_range && (
                      <div className="text-sm text-gray-500">
                        💰 {job.salary_range}
                      </div>
                    )}
                  </CardContent>
                  <div className="p-6 pt-0">
                    {hasApplied(job.id) ? (
                      <Button className="w-full" disabled variant="outline">
                        ✓ Applied
                      </Button>
                    ) : (
                      <Dialog open={openFormJobId === job.id} onOpenChange={open => setOpenFormJobId(open ? job.id : null)}>
                        <DialogTrigger asChild>
                          <Button className="w-full" onClick={() => setOpenFormJobId(job.id)}>
                            Apply Now <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-0">
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
        </div>
      </main>
    </div>
  );
};

export default SubmitAndTrack; 