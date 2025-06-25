import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardStats } from "@/components/DashboardStats";
import { JobCreationForm } from "@/components/JobCreationForm";
import { JobListings } from "@/components/JobListings";
import JobApplications from "@/components/JobApplications";

const HRDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <DashboardHeader />

      <div className="container mx-auto px-6 py-8">
        <DashboardStats />

        <Tabs defaultValue="create-job" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create-job">Create Job Post</TabsTrigger>
            <TabsTrigger value="job-listings">Job Listings</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
          </TabsList>

          <TabsContent value="create-job">
            <JobCreationForm />
          </TabsContent>

          <TabsContent value="job-listings">
            <JobListings />
          </TabsContent>

          <TabsContent value="applications">
            <JobApplications />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HRDashboard;
