import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, User, Bell, Trash2, Building2, Mail, Building, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { JobCreationForm } from "@/components/JobCreationForm";
import { JobListings } from "@/components/JobListings";
import { CandidateReportView } from "@/components/CandidateReportView";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { EmailAutomation } from "@/components/EmailAutomation";
import { DashboardStats } from "@/components/DashboardStats";
import { DashboardHeader } from "@/components/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import HRDashboardOverview from "./HRDashboardOverview";
import { useToast } from "@/hooks/use-toast";

function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '' });
  const [company, setCompany] = useState({ name: '', description: '', website: '', location: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState({ profile: false, company: false, password: false });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      setLoading({ profile: true, company: true, password: false });
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error) {
          toast({ title: "Error", description: "Failed to load profile data.", variant: "destructive" });
          return;
        }
        if (data) {
          const [firstName, ...lastNameParts] = (data.full_name || '').split(' ');
          setProfile({
            firstName: firstName || '',
            lastName: lastNameParts.join(' ') || '',
            phone: data.phone || ''
          });
          setCompany({
            name: data.company_name || '',
            description: data.company_description || '',
            website: data.website || '',
            location: data.company_location || ''
          });
        }
      } catch (err) {
        toast({ title: "Error", description: "Failed to load profile data.", variant: "destructive" });
      } finally {
        setLoading({ profile: false, company: false, password: false });
      }
    };
    fetchProfile();
  }, [user, toast]);
  
  const handleUpdateProfile = async () => {
    if (!profile.firstName.trim()) {
      toast({ title: "Error", description: "First name is required.", variant: "destructive" });
      return;
    }
    
    setLoading({ ...loading, profile: true });
    try {
      // First update the full name
      const { error: nameError } = await supabase.from('profiles').update({
        full_name: `${profile.firstName} ${profile.lastName}`.trim(),
      }).eq('id', user.id);
      
      if (nameError) {
        toast({ title: "Error", description: "Failed to update profile: " + nameError.message, variant: "destructive" });
        return;
      }

      // Then try to update phone separately
      const { error: phoneError } = await supabase.from('profiles').update({
        phone: profile.phone,
      }).eq('id', user.id);
      
      // If phone update fails, it's likely because the column doesn't exist
      // We can ignore this error and still show success for the name update
      if (!phoneError) {
        toast({ title: "Success", description: "Profile updated successfully." });
      } else {
        toast({ title: "Partial Success", description: "Name updated successfully, but phone number could not be saved." });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally {
      setLoading({ ...loading, profile: false });
    }
  };
  
  const handleUpdateCompany = async () => {
    if (!company.name.trim()) {
      toast({ title: "Error", description: "Company name is required.", variant: "destructive" });
      return;
    }
    
    setLoading({ ...loading, company: true });
    try {
      const { error } = await supabase.from('profiles').update({
        company_name: company.name,
        company_description: company.description,
        website: company.website,
        company_location: company.location,
      }).eq('id', user.id);

      if (error) {
        toast({ title: "Error", description: "Failed to update company information: " + error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Company information updated successfully." });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to update company information.", variant: "destructive" });
    } finally {
      setLoading({ ...loading, company: false });
    }
  };
  
  const handleChangePassword = async () => {
    if (!password.currentPassword.trim()) {
      toast({ title: "Error", description: "Current password is required.", variant: "destructive" });
      return;
    }
    
    if (!password.newPassword.trim()) {
      toast({ title: "Error", description: "New password is required.", variant: "destructive" });
      return;
    }
    
    if (password.newPassword.length < 6) {
      toast({ title: "Error", description: "New password must be at least 6 characters long.", variant: "destructive" });
      return;
    }
    
    if (password.newPassword !== password.confirmPassword) {
      toast({ title: "Error", description: "New passwords do not match.", variant: "destructive" });
      return;
    }
    
    setLoading({ ...loading, password: true });
    try {
      const { error } = await supabase.auth.updateUser({ password: password.newPassword });
      
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Password changed successfully." });
        setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to change password.", variant: "destructive" });
    } finally {
      setLoading({ ...loading, password: false });
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your profile and company information</p>
      </div>

      {/* Profile Section */}
      <div className="px-8 py-6 border-t border-gray-200/80">
        <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2"><User className="w-5 h-5 text-blue-600" />Profile Information</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-1">
            <Label htmlFor="firstName">First Name *</Label>
            <Input 
              id="firstName" 
              value={profile.firstName} 
              onChange={(e) => setProfile({...profile, firstName: e.target.value})}
              placeholder="Enter your first name"
              disabled={loading.profile}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName">Last Name</Label>
            <Input 
              id="lastName" 
              value={profile.lastName} 
              onChange={(e) => setProfile({...profile, lastName: e.target.value})}
              placeholder="Enter your last name"
              disabled={loading.profile}
            />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={user?.email} disabled className="bg-gray-100 cursor-not-allowed" />
            <p className="text-xs text-gray-500">Email cannot be changed.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone" 
              value={profile.phone} 
              onChange={(e) => setProfile({...profile, phone: e.target.value})} 
              placeholder="+1 234 567 890"
              disabled={loading.profile}
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
           <Button onClick={handleUpdateProfile} disabled={loading.profile}>
            {loading.profile ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </div>

      {/* Company Information Section */}
      <div className="px-8 py-6 border-t border-gray-200/80">
        <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2"><Building className="w-5 h-5 text-purple-600" />Company Information</h2>
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input 
              id="companyName" 
              value={company.name} 
              onChange={(e) => setCompany({...company, name: e.target.value})}
              placeholder="Enter your company name"
              disabled={loading.company}
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="companyDescription">Company Description</Label>
            <Textarea 
              id="companyDescription" 
              value={company.description} 
              onChange={(e) => setCompany({...company, description: e.target.value})} 
              placeholder="Tell candidates about your company..."
              disabled={loading.company}
              rows={4}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="website">Website</Label>
            <Input 
              id="website" 
              value={company.website} 
              onChange={(e) => setCompany({...company, website: e.target.value})} 
              placeholder="https://example.com"
              disabled={loading.company}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              value={company.location} 
              onChange={(e) => setCompany({...company, location: e.target.value})} 
              placeholder="City, Country"
              disabled={loading.company}
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
           <Button onClick={handleUpdateCompany} disabled={loading.company}>
            {loading.company ? "Updating..." : "Update Company"}
          </Button>
        </div>
      </div>
      
      {/* Change Password Section */}
      <div className="px-8 py-6 border-t border-gray-200/80">
        <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2"><Lock className="w-5 h-5 text-red-600" />Change Password</h2>
        <div className="space-y-4 mt-6">
          <div className="space-y-1">
            <Label htmlFor="currentPassword">Current Password *</Label>
            <Input 
              id="currentPassword" 
              type="password" 
              value={password.currentPassword} 
              onChange={(e) => setPassword({...password, currentPassword: e.target.value})}
              placeholder="Enter your current password"
              disabled={loading.password}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="newPassword">New Password *</Label>
            <Input 
              id="newPassword" 
              type="password" 
              value={password.newPassword} 
              onChange={(e) => setPassword({...password, newPassword: e.target.value})}
              placeholder="Enter your new password (min 6 characters)"
              disabled={loading.password}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm New Password *</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              value={password.confirmPassword} 
              onChange={(e) => setPassword({...password, confirmPassword: e.target.value})}
              placeholder="Confirm your new password"
              disabled={loading.password}
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
           <Button onClick={handleChangePassword} disabled={loading.password}>
            {loading.password ? "Changing..." : "Change Password"}
          </Button>
        </div>
      </div>
      
    </div>
  );
}

export function NewHRDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (data && data.full_name) {
        setFullName(data.full_name);
      } else {
        setFullName(null);
      }
    };
    fetchProfile();
  }, [user]);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <HRDashboardOverview setActiveTab={setActiveTab} />;
      case "create-job":
        return <JobCreationForm />;
      case "job-listings":
        return <JobListings />;
      case "candidate-report":
        return <CandidateReportView />;
      case "subscription":
        return <SubscriptionManager />;
      case "email-automation":
        return <EmailAutomation />;
      case "settings":
        return <Settings />;
      default:
        return <JobCreationForm />;
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard";
      case "create-job":
        return "Create New Job";
      case "job-listings":
        return "Job Listings";
      case "candidate-report":
        return "Candidate Reports";
      case "subscription":
        return "Subscription Management";
      case "email-automation":
        return "Email Automation";
      case "settings":
        return "Settings";
      default:
        return "Job Post Management";
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-100 via-white to-purple-100">
        <DashboardSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white/90 border-b border-blue-100">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-xl font-bold text-blue-900">
                    {getHeaderTitle()}
                  </h1>
                  <p className="text-sm text-blue-400">Welcome back, {fullName || user?.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </header>
          {/* Main Content */}
          <div className="flex-1 p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
