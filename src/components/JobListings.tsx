import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Building2, MapPin, Calendar, Copy, ExternalLink, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useNavigate } from "react-router-dom";

export function JobListings() {
  const { jobs, updateJob, deleteJob, loading } = useJobs();
  const { toast } = useToast();
  const { getJobLimit, canCreateJob, userSubscription, plans } = useSubscriptions();
  const jobLimitReached = !canCreateJob(jobs.length);
  
  const [editingJob, setEditingJob] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const navigate = useNavigate();

  const currentPlan = userSubscription 
    ? plans.find(p => p.id === userSubscription.plan_id)
    : plans.find(p => p.name.toLowerCase() === "free");
  const isFreePlan = currentPlan?.name.toLowerCase() === 'free';

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
      {jobLimitReached && (
        <div className="text-red-600 mt-2 text-center">
          You have reached your job post limit ({getJobLimit()}).{' '}
          <button
            type="button"
            className="underline text-blue-600 cursor-pointer bg-transparent border-none p-0 m-0"
            onClick={() => navigate('/SubscriptionManager')}
          >
            Upgrade your plan
          </button> to post more jobs.
        </div>
      )}
      <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
        <CardHeader>
          <CardTitle>Your Job Listings</CardTitle>
          <CardDescription>
            Manage and view all your posted jobs
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
                        <div className="bg-white/60 p-4 rounded-2xl">
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-blue-900">Job Type:</span>
                              <span className="ml-2 text-gray-700 capitalize">{job.type}</span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-900">Department:</span>
                              <span className="ml-2 text-gray-700 capitalize">{job.department}</span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-900">Location:</span>
                              <span className="ml-2 text-gray-700">{job.location}</span>
                            </div>
                            <div>
                              <span className="font-medium text-blue-900">Created:</span>
                              <span className="ml-2 text-gray-700">
                                {new Date(job.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <span className="font-medium text-blue-900">Description:</span>
                            <p className="mt-1 text-gray-700 text-sm line-clamp-3">{job.description}</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
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
                                  Update the job posting details below.
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

                                <div className="grid md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-location">Location</Label>
                                    <Input
                                      id="edit-location"
                                      value={editingJob?.location || ""}
                                      onChange={(e) => setEditingJob({...editingJob, location: e.target.value})}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-department">Department</Label>
                                    <Select value={editingJob?.department || ""} onValueChange={(value) => setEditingJob({...editingJob, department: value})}>
                                      <SelectTrigger>
                                        <SelectValue />
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
                                  <Label htmlFor="edit-description">Job Description</Label>
                                  <Textarea
                                    id="edit-description"
                                    rows={6}
                                    value={editingJob?.description || ""}
                                    onChange={(e) => setEditingJob({...editingJob, description: e.target.value})}
                                    required
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

                          {!isFreePlan && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Job Post</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{job.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteJob(job.id, job.title)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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
