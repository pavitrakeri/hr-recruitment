import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useJobs } from "@/hooks/useJobs";
import { useApplications } from "@/hooks/useApplications";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, FileText, User, Crown, ArrowUpRight, Eye, Smile, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function HRDashboardOverview({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const { user } = useAuth();
  const { jobs } = useJobs();
  const { applications } = useApplications();
  const { plans, userSubscription } = useSubscriptions();
  const [fullName, setFullName] = useState<string | null>(null);
  const [recentApplications, setRecentApplications] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch full name from profile
    async function fetchProfile() {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (data && data.full_name) setFullName(data.full_name);
    }
    fetchProfile();
  }, [user]);

  useEffect(() => {
    // Count applications in the last 7 days
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    setRecentApplications(applications.filter(app => new Date(app.created_at) >= weekAgo).length);
  }, [applications]);

  const totalJobPosts = jobs.length;
  const activeJobs = jobs.filter(j => j.status === "active").length;
  const totalApplications = applications.length;

  const currentPlan = userSubscription
    ? plans.find(p => p.id === userSubscription.plan_id)
    : plans.find(p => p.name.toLowerCase() === "free");

  // Navigation handlers using useNavigate
  const handleViewJobs = () => {
    if (setActiveTab) {
      setActiveTab("job-listings");
    } else {
      navigate("/hr?tab=job-listings");
    }
  };
  const handleViewApplications = () => {
    if (setActiveTab) {
      setActiveTab("candidate-report");
    } else {
      navigate("/hr?tab=candidate-report");
    }
  };
  const handleSubscription = () => {
    if (setActiveTab) {
      setActiveTab("subscription");
    } else {
      navigate("/hr?tab=subscription");
    }
  };
  const handleCreateJob = () => {
    if (setActiveTab) {
      setActiveTab("create-job");
    } else {
      navigate("/hr?tab=create-job");
    }
  };

  // Recent activity: show last 5 jobs/applications
  const recentJobs = jobs.slice(0, 3);
  const recentApps = applications.slice(0, 3);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1 flex items-center gap-2">
            Welcome {fullName || user?.email || "!"} <Smile className="inline w-7 h-7 text-yellow-400 ml-1" />
          </h1>
          <p className="text-gray-500 text-lg">Here's what's happening with your recruitment today.</p>
        </div>
        <Button onClick={handleCreateJob} className="flex items-center gap-2 text-base font-semibold px-6 py-3" size="lg">
          <Plus className="w-5 h-5" /> Create Job Post
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-md">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="w-7 h-7 text-blue-500 bg-blue-100 rounded-full p-1.5" />
              <span className="text-lg font-semibold">Total Job Posts</span>
            </div>
            <div className="text-3xl font-bold">{totalJobPosts}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <ArrowUpRight className="w-7 h-7 text-green-500 bg-green-100 rounded-full p-1.5" />
              <span className="text-lg font-semibold">Active Jobs</span>
            </div>
            <div className="text-3xl font-bold">{activeJobs}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-7 h-7 text-purple-500 bg-purple-100 rounded-full p-1.5" />
              <span className="text-lg font-semibold">Total Applications</span>
            </div>
            <div className="text-3xl font-bold">{totalApplications}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-7 h-7 text-orange-500 bg-orange-100 rounded-full p-1.5" />
              <span className="text-lg font-semibold">Recent Applications</span>
            </div>
            <div className="text-3xl font-bold">{recentApplications}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Briefcase className="w-6 h-6" />
              <span className="text-xl font-bold">Manage Job Posts</span>
            </div>
            <p className="text-gray-500 mb-4">Create, edit, and manage your job postings</p>
            <Button variant="outline" className="w-full" onClick={handleViewJobs}>
              View Jobs
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6" />
              <span className="text-xl font-bold">Review Applications</span>
            </div>
            <p className="text-gray-500 mb-4">Review and manage candidate applications</p>
            <Button variant="outline" className="w-full" onClick={handleViewApplications}>
              <Eye className="w-4 h-4 mr-2" /> View Applications
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Crown className="w-6 h-6" />
              <span className="text-xl font-bold">Subscription</span>
            </div>
            <p className="text-gray-500 mb-4">Manage your subscription and billing</p>
            <Button variant="secondary" className="mb-2" onClick={handleSubscription}>
              Current: {currentPlan?.name || "Free Plan"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        {(recentJobs.length === 0 && recentApps.length === 0) ? (
          <div className="flex flex-col items-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
            <p className="text-gray-500">Create a job post to start receiving applications</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Recent Jobs</h3>
              {recentJobs.map(job => (
                <div key={job.id} className="mb-3 p-3 rounded-lg bg-gray-50 flex flex-col">
                  <span className="font-medium">{job.title}</span>
                  <span className="text-xs text-gray-500">{job.location} • {job.department}</span>
                  <span className="text-xs text-gray-400">Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Recent Applications</h3>
              {recentApps.map(app => (
                <div key={app.id} className="mb-3 p-3 rounded-lg bg-gray-50 flex flex-col">
                  <span className="font-medium">{app.name}</span>
                  <span className="text-xs text-gray-500">{app.email}</span>
                  <span className="text-xs text-gray-400">Applied: {new Date(app.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 