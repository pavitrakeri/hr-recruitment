import { useCandidate } from "@/hooks/useCandidate";
import { CandidateSidebar } from "@/components/CandidateSidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const MyApplications = () => {
  const { applications, loading, jobs } = useCandidate();

  const getJobTitle = (jobId: string) => {
      const job = jobs.find(j => j.id === jobId);
      return job ? job.title : "Unknown Job";
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'reviewed':
        return <Badge variant="secondary">Reviewed</Badge>;
      case 'shortlisted':
        return <Badge className="bg-blue-500 text-white">Shortlisted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'hired':
        return <Badge className="bg-green-500 text-white">Hired</Badge>;
      default:
        return <Badge variant="outline">Submitted</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="flex bg-gray-100 min-h-screen">
        <CandidateSidebar />
        <main className="flex-1 lg:ml-64 p-8">
          <h1 className="text-3xl font-bold mb-6">My Applications</h1>
          <div className="bg-white rounded-lg shadow-md">
              {loading ? (
                  <p className="p-4">Loading applications...</p>
              ) : (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Job Title</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Submitted</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {applications.length > 0 ? applications.map(app => (
                              <TableRow key={app.id}>
                                  <TableCell className="font-medium">{getJobTitle(app.job_id)}</TableCell>
                                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                                  <TableCell>
                                    {app.created_at
                                      ? new Date(app.created_at).toLocaleDateString()
                                      : "N/A"}
                                  </TableCell>
                              </TableRow>
                          )) : (
                              <TableRow>
                                  <TableCell colSpan={3} className="text-center">You haven't applied to any jobs yet.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyApplications; 