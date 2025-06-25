import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useNavigate } from "react-router-dom";

export function JobCreationForm() {
  const { createJob, loading } = useJobs();
  const { getJobLimit, canCreateJob } = useSubscriptions();
  const { jobs } = useJobs();
  const jobLimitReached = !canCreateJob(jobs.length);
  const navigate = useNavigate();
  
  const [jobForm, setJobForm] = useState({
    title: "",
    type: "",
    location: "",
    department: "",
    description: ""
  });

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

  return (
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
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
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
            <Label htmlFor="description" className="text-lg font-semibold">Job Description</Label>
            <div className="space-y-2">
              <div className="text-sm text-gray-500 space-y-1 bg-blue-50 p-4 rounded-md">
                <p className="font-medium">Formatting Tips:</p>
                <ul className="list-disc pl-5">
                  <li>Use double line breaks between sections</li>
                  <li>End section headers with ":" (e.g., "About the Role:")</li>
                  <li>Use "•" for bullet points</li>
                  <li>Indentation and spacing will be preserved exactly as entered</li>
                </ul>
              </div>
              <Textarea
                id="description"
                placeholder={`About the Role:

We are looking for a talented developer...

What will you do:

• First responsibility
• Second responsibility

Required Skills & Qualifications:

• Skill 1
• Skill 2

Benefits:

• Benefit 1
• Benefit 2`}
                rows={15}
                value={jobForm.description}
                onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                required
                className="font-mono whitespace-pre-wrap min-h-[400px] resize-y"
                style={{ lineHeight: '1.6' }}
              />
            </div>
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
              You have reached your job post limit ({getJobLimit()}).{' '}
              <button
                type="button"
                className="underline text-blue-600 cursor-pointer bg-transparent border-none p-0 m-0"
                onClick={() => navigate('/subscription-manager')}
              >
                Upgrade your plan
              </button> to post more jobs.
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
