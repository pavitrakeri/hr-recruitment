import { useState } from "react";
import { useCandidate } from "@/hooks/useCandidate";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Briefcase, GraduationCap, MapPin, Building, FileText, Mic, User, Check, GitBranch, Linkedin, Link as LinkIcon, Phone } from "lucide-react";
import { format } from 'date-fns/format';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Import the new components
import { ProfileSectionCard } from "@/components/profile/ProfileSectionCard";
import { WorkDetailsModal } from "@/components/profile/WorkDetailsModal";
import { ResumeUploadModal } from "@/components/profile/ResumeUploadModal";
import AudioQAModal from "@/components/profile/AudioQAModal";
import { AboutMeModal } from "@/components/profile/AboutMeModal";
import { SkillsModal } from "@/components/profile/SkillsModal";
import { ProfessionalHistoryModal } from "@/components/profile/ProfessionalHistoryModal";

const CandidateDashboard = () => {
  const { profile, applications, loading } = useCandidate();
  const [activeTab, setActiveTab] = useState("about");

  // State for controlling modals
  const [isWorkDetailsModalOpen, setWorkDetailsModalOpen] = useState(false);
  const [isResumeModalOpen, setResumeModalOpen] = useState(false);
  const [isAudioQAModalOpen, setAudioQAModalOpen] = useState(false);
  const [isAboutModalOpen, setAboutModalOpen] = useState(false);
  const [isSkillsModalOpen, setSkillsModalOpen] = useState(false);
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [historyModalTab, setHistoryModalTab] = useState<"experience" | "education">("experience");

  if (loading) return <div className="p-8">Loading profile...</div>;
  if (!profile) return <div className="p-8">Could not find candidate profile.</div>;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const workStatusMap: { [key: string]: string } = {
    uk_citizen: "UK/Irish Citizen",
    skilled_worker_visa: "Skilled Worker Visa",
    student_visa: "Student Visa"
  };

  const noticePeriodMap: { [key: string]: string } = {
    "1_week": "1-2 weeks",
    "1_month": "1 month",
    "2_months": "2 months",
    "immediately": "Immediately available"
  };

  const openHistoryModal = (tab: "experience" | "education") => {
    setHistoryModalTab(tab);
    setHistoryModalOpen(true);
  }

  // Dashboard summary stats
  const totalApplications = applications.length;
  const inProgress = applications.filter(app => app.status === 'in_progress' || app.status === 'reviewing').length;
  const interviews = applications.filter(app => app.status === 'interviewed').length;
  const offers = applications.filter(app => app.status === 'offered' || app.status === 'hired').length;
  const recentApplications = applications.slice(0, 3);

  return (
    <div className="flex-1 p-8 bg-gray-50/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="text-2xl">{getInitials(profile.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{profile.full_name}</h1>
            <p className="text-gray-500">{profile.bio || "No bio provided."}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline"><User className="w-4 h-4 mr-2" /> Edit Profile</Button>
            <p className="text-sm text-gray-500">Profile completed:</p>
            <div className="flex items-center gap-1 text-green-600 font-semibold">
                <Check className="w-5 h-5" /> 75%
            </div>
        </div>
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalApplications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Interviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{interviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Offers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{offers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentApplications.length === 0 ? (
              <div className="text-gray-500">No recent applications.</div>
            ) : (
              <ul className="space-y-2">
                {recentApplications.map(app => (
                  <li key={app.id} className="flex flex-col">
                    <span className="font-medium">Applied to {app.job?.title || 'a job'}</span>
                    <span className="text-xs text-gray-500">{new Date(app.created_at).toLocaleDateString()} &middot; Status: {app.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Tabs */}
        <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="about">About</TabsTrigger>
                    <TabsTrigger value="demographics">Demographics</TabsTrigger>
                    <TabsTrigger value="work">Work</TabsTrigger>
                </TabsList>
                <TabsContent value="about" className="mt-6 space-y-6">
                    <ProfileSectionCard title="About" onEdit={() => setAboutModalOpen(true)}>
                        <p className="text-gray-600">{profile.bio || "No bio provided. Click edit to add a bio."}</p>
                    </ProfileSectionCard>
                    <ProfileSectionCard title="Skills" onEdit={() => setSkillsModalOpen(true)}>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills?.length > 0 ? profile.skills?.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>) : <p className="text-sm text-gray-500">No skills added yet.</p>}
                        </div>
                    </ProfileSectionCard>
                    <ProfileSectionCard title="Experience" onEdit={() => openHistoryModal("experience")}>
                        <div className="space-y-4">
                        {profile.experience?.length > 0 ? profile.experience?.map(exp => (
                            <div key={exp.id} className="flex gap-4">
                                <Briefcase className="w-5 h-5 mt-1 text-gray-400"/>
                                <div>
                                    <h4 className="font-semibold">{exp.title} at {exp.company}</h4>
                                    <p className="text-sm text-gray-500">{exp.start_date} - {exp.end_date || 'Present'}</p>
                                </div>
                            </div>
                        )) : <p className="text-sm text-gray-500">No experience added yet.</p>}
                        </div>
                    </ProfileSectionCard>
                    <ProfileSectionCard title="Education" onEdit={() => openHistoryModal("education")}>
                         <div className="space-y-4">
                        {profile.education?.length > 0 ? profile.education?.map(edu => (
                            <div key={edu.id} className="flex gap-4">
                                <GraduationCap className="w-5 h-5 mt-1 text-gray-400"/>
                                <div>
                                    <h4 className="font-semibold">{edu.institution}</h4>
                                    <p className="text-sm text-gray-500">{edu.degree} &middot; {edu.start_date} - {edu.end_date || 'Present'}</p>
                                </div>
                            </div>
                        )) : <p className="text-sm text-gray-500">No education added yet.</p>}
                        </div>
                    </ProfileSectionCard>
                </TabsContent>
                <TabsContent value="demographics" className="mt-6">
                    <ProfileSectionCard title="Demographic Info" onEdit={() => alert("Edit Demographics")}>
                        <p>Not implemented yet.</p>
                    </ProfileSectionCard>
                </TabsContent>
                <TabsContent value="work" className="mt-6">
                    <ProfileSectionCard title="Work Details" onEdit={() => setWorkDetailsModalOpen(true)}>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-medium text-gray-500">Current Status</p>
                                <p>{profile.work_details?.status ? workStatusMap[profile.work_details.status] : 'Not specified'}</p>
                            </div>
                             <div>
                                <p className="font-medium text-gray-500">Notice Period</p>
                                <p>{profile.work_details?.notice_period ? noticePeriodMap[profile.work_details.notice_period] : 'Not specified'}</p>
                            </div>
                             <div>
                                <p className="font-medium text-gray-500">Salary Expectation</p>
                                <p>{profile.work_details?.expected_salary || 'Not specified'}</p>
                            </div>
                             <div>
                                <p className="font-medium text-gray-500">Relocation</p>
                                <p className="capitalize">{profile.work_details?.relocation?.replace('_', ' ') || 'Not specified'}</p>
                            </div>
                        </div>
                    </ProfileSectionCard>
                </TabsContent>
            </Tabs>
        </div>

        {/* Right Side: Resume & Links */}
        <div className="space-y-6">
            <ProfileSectionCard title="Resume" onEdit={() => setResumeModalOpen(true)}>
                <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-primary"/>
                    <div>
                        <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                          View Resume
                        </a>
                        <p className="text-sm text-gray-500">Uploaded on {profile.updated_at ? format(new Date(profile.updated_at), 'MMM d, yyyy') : 'N/A'}</p>
                    </div>
                </div>
            </ProfileSectionCard>

            <ProfileSectionCard title="Audio Q&As">
                 <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">Answer short questions to stand out.</p>
                    <Button onClick={() => setAudioQAModalOpen(true)}>Start</Button>
                 </div>
            </ProfileSectionCard>

             <ProfileSectionCard title="Links">
                <div className="space-y-3">
                    {profile.github_url && <a href={profile.github_url} className="flex items-center gap-2 text-sm hover:text-primary"><GitBranch className="w-4 h-4"/> GitHub</a>}
                    {profile.linkedin_url && <a href={profile.linkedin_url} className="flex items-center gap-2 text-sm hover:text-primary"><Linkedin className="w-4 h-4"/> LinkedIn</a>}
                    {profile.portfolio_url && <a href={profile.portfolio_url} className="flex items-center gap-2 text-sm hover:text-primary"><LinkIcon className="w-4 h-4"/> Portfolio</a>}
                </div>
            </ProfileSectionCard>
        </div>
      </div>
      
      {/* Modals */}
      {isWorkDetailsModalOpen && <WorkDetailsModal 
        isOpen={isWorkDetailsModalOpen} 
        onClose={() => setWorkDetailsModalOpen(false)} 
      />}
      {isResumeModalOpen && <ResumeUploadModal 
        isOpen={isResumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
      />}
      {isAudioQAModalOpen && <AudioQAModal 
        isOpen={isAudioQAModalOpen}
        onClose={() => setAudioQAModalOpen(false)}
      />}
      {isAboutModalOpen && <AboutMeModal isOpen={isAboutModalOpen} onClose={() => setAboutModalOpen(false)} />}
      {isSkillsModalOpen && <SkillsModal isOpen={isSkillsModalOpen} onClose={() => setSkillsModalOpen(false)} />}
      {isHistoryModalOpen && <ProfessionalHistoryModal isOpen={isHistoryModalOpen} onClose={() => setHistoryModalOpen(false)} defaultTab={historyModalTab} />}

    </div>
  );
};

export default CandidateDashboard;