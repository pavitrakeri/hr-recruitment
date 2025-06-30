import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Copy, ExternalLink, MapPin, Calendar, Building2, Briefcase, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSubscriptions } from "@/hooks/useSubscriptions";

export function JobPostForm() {
  const { jobs, createJob, updateJob, deleteJob, loading } = useJobs();
  const { toast } = useToast();
  const { canCreateJob, getJobLimit } = useSubscriptions();
  
  const [jobForm, setJobForm] = useState({
    title: "",
    type: "",
    location: "",
    department: "",
    description: ""
  });

  const [editingJob, setEditingJob] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const jobLimitReached = !canCreateJob(jobs.length);

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createJob(jobForm);
      setJobForm({
        title: "",
        type: "",
        location: "",
        department: "",
        description: ""
      });
    } catch (error) {
      // Error handled by useJobs hook
    }
  };

  const handleEditJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    
    try {
      await updateJob(editingJob.id, {
        title: editingJob.title,
        type: editingJob.type,
        location: editingJob.location,
        department: editingJob.department,
        description: editingJob.description
      });
      setIsEditDialogOpen(false);
      setEditingJob(null);
    } catch (error) {
      // Error handled by useJobs hook
    }
  };

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    try {
      await deleteJob(jobId);
      toast({
        title: "Job deleted",
        description: `"${jobTitle}" has been deleted successfully.`,
      });
    } catch (error) {
      // Error handled by useJobs hook
    }
  };

  const handleToggleStatus = async (jobId: string, currentStatus: string, jobTitle: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await updateJob(jobId, { status: newStatus });
      toast({
        title: "Status updated",
        description: `"${jobTitle}" is now ${newStatus}.`,
      });
    } catch (error) {
      // Error handled by useJobs hook
    }
  };

  const copyJobLink = (jobId: string) => {
    const link = `${window.location.origin}/job/${jobId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Job application link has been copied to clipboard.",
    });
  };

  const openJobLink = (jobId: string) => {
    const link = `${window.location.origin}/job/${jobId}`;
    window.open(link, '_blank');
  };

  const openEditDialog = (job: any) => {
    setEditingJob({ ...job });
    setIsEditDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    return status === "active" ? "default" : "secondary";
  };

  const getStatusIcon = (status: string) => {
    return status === "active" ? Eye : EyeOff;
  };

  return (
    <div className="space-y-6">
      {/* Job Creation Form */}
      <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Job Post
          </CardTitle>
          <CardDescription>
            Create a new job posting and generate a unique application link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJobSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="job-title">Job Title</Label>
                <Input
                  id="job-title"
                  placeholder="e.g. Senior Frontend Developer"
                  value={jobForm.title}
                  onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-type">Job Type</Label>
                <Select value={jobForm.type} onValueChange={(value) => setJobForm({...jobForm, type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. San Francisco, CA or Remote"
                  value={jobForm.location}
                  onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={jobForm.department} onValueChange={(value) => setJobForm({...jobForm, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the role, responsibilities, requirements, and benefits..."
                rows={8}
                value={jobForm.description}
                onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={loading || jobLimitReached}
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading ? "Creating..." : "Create Job Post"}
            </Button>
            {jobLimitReached && (
              <div className="text-red-600 mt-2 text-center">
                You have reached your job post limit ({getJobLimit()}). <a href="/subscription" className="underline text-blue-600">Upgrade your plan</a> to post more jobs.
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Posted Jobs List */}
      <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
        <CardHeader>
          <CardTitle>Your Posted Jobs</CardTitle>
          <CardDescription>
            Manage and share your job postings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.map((job) => {
              const StatusIcon = getStatusIcon(job.status);
              return (
                <Card key={job.id} className="bg-white/80 shadow-xl rounded-3xl border-0">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Job Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <h3 className="text-xl font-semibold">{job.title}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Building2 className="w-4 h-4 mr-1" />
                              {job.department}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.location}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(job.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Job Type:</span>
                            <span className="ml-2 text-gray-600 capitalize">{job.type}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Department:</span>
                            <span className="ml-2 text-gray-600 capitalize">{job.department}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Location:</span>
                            <span className="ml-2 text-gray-600">{job.location}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Created:</span>
                            <span className="ml-2 text-gray-600">
                              {new Date(job.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 space-y-4">
                          <span className="font-medium text-gray-700 text-lg">About the Job</span>
                          <div className="job-description whitespace-pre-wrap break-words font-sans leading-7">
                            {job.description.split('\n\n').map((section, index) => {
                              const lines = section.split('\n');
                              const title = lines[0].trim();
                              const content = lines.slice(1).join('\n');
                              
                              if (title.endsWith(':')) {
                                return (
                                  <div key={index} className="mb-6">
                                    <h3 className="text-gray-700 text-lg font-semibold mt-6 mb-3">{title}</h3>
                                    <div className="pl-4">
                                      {content.split('\n').map((line, i) => {
                                        if (line.trim().startsWith('•')) {
                                          return <div key={i} className="pl-2 mb-1">{line}</div>;
                                        }
                                        return <div key={i} className="mb-1">{line}</div>;
                                      })}
                                    </div>
                                  </div>
                                );
                              }
                              return <div key={index} className="mb-4">{section}</div>;
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => copyJobLink(job.id)}
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy Link
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openJobLink(job.id)}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleToggleStatus(job.id, job.status, job.title)}
                        >
                          <StatusIcon className="w-4 h-4 mr-1" />
                          {job.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openEditDialog(job)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Job Post</DialogTitle>
                              <DialogDescription>
                                Update the job posting details
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleEditJob} className="space-y-6">
                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-title">Job Title</Label>
                                  <Input
                                    id="edit-title"
                                    value={editingJob?.title || ""}
                                    onChange={(e) => setEditingJob({...editingJob, title: e.target.value})}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="edit-type">Job Type</Label>
                                  <Select value={editingJob?.type || ""} onValueChange={(value) => setEditingJob({...editingJob, type: value})}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="full-time">Full-time</SelectItem>
                                      <SelectItem value="part-time">Part-time</SelectItem>
                                      <SelectItem value="contract">Contract</SelectItem>
                                      <SelectItem value="internship">Internship</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-description">Job Description</Label>
                                <Textarea
                                  id="edit-description"
                                  rows={15}
                                  value={editingJob.description}
                                  onChange={(e) => setEditingJob({...editingJob, description: e.target.value})}
                                  required
                                  className="font-mono whitespace-pre-wrap"
                                />
                              </div>
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={() => setIsEditDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit">
                                  Update Job
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {jobs.length === 0 && !loading && (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                <p className="text-gray-500">Create your first job posting to get started.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 