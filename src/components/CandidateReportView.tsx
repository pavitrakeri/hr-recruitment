import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  User, 
  FileText, 
  Headphones, 
  Star, 
  Calendar, 
  Mail, 
  Phone, 
  Building2,
  ArrowLeft,
  Filter,
  TrendingUp,
  Brain,
  Target
} from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { useApplications, TimeFilter } from "@/hooks/useApplications";
import { ApplicationWithDetails } from "@/hooks/useApplications";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseFileUrl } from "@/lib/utils";

type ViewMode = 'job-selection' | 'candidate-list' | 'individual-report';

export function CandidateReportView() {
  const { jobs } = useJobs();
  const { 
    applications, 
    loading, 
    selectedJobId, 
    timeFilter,
    filterByJob, 
    filterByTime,
    updateApplicationStatus 
  } = useApplications();
  
  const [viewMode, setViewMode] = useState<ViewMode>('job-selection');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const { toast } = useToast();

  const handleJobSelect = (jobId: string) => {
    filterByJob(jobId);
    setViewMode('candidate-list');
  };

  const handleCandidateSelect = (application: ApplicationWithDetails) => {
    setSelectedApplication(application);
    setViewMode('individual-report');
  };

  const handleBackToJobs = () => {
    setViewMode('job-selection');
    filterByJob(null);
  };

  const handleBackToCandidates = () => {
    setViewMode('candidate-list');
    setSelectedApplication(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'reviewing': return 'secondary';
      case 'shortlisted': return 'default';
      case 'interviewed': return 'secondary';
      case 'hired': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getTimeFilterLabel = (filter: TimeFilter) => {
    switch (filter) {
      case '24h': return 'Last 24 Hours';
      case '3d': return 'Last 3 Days';
      case '1w': return 'Last Week';
      case 'all': return 'All Time';
    }
  };

  function SendEmailSection({ candidate }) {
    const { user } = useAuth();
    const [form, setForm] = useState({
      from: user?.email || "",
      to: candidate.email,
      cc: "",
      subject: `Regarding your application for ${candidate.job?.title || ""}`,
      body: "",
    });
    const [sending, setSending] = useState(false);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSend = async (e) => {
      e.preventDefault();
      setSending(true);
      // TODO: Replace with your actual email sending logic (API call or Supabase function)
      // Example: await sendEmail(form);
      setTimeout(() => {
        setSending(false);
        toast({ title: "Email sent!", description: "Your message has been sent to the candidate." });
      }, 1000);
    };

    return (
      <form onSubmit={handleSend} className="space-y-3 mt-6 max-w-xl">
        <div>
          <label className="block text-sm font-medium mb-1">From</label>
          <Input name="from" value={form.from} disabled />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To</label>
          <Input name="to" value={form.to} onChange={handleChange} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">CC</label>
          <Input name="cc" value={form.cc} onChange={handleChange} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <Input name="subject" value={form.subject} onChange={handleChange} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Body</label>
          <Textarea name="body" value={form.body} onChange={handleChange} required />
        </div>
        <Button type="submit" disabled={sending}>{sending ? "Sending..." : "Send Email"}</Button>
      </form>
    );
  }

  if (viewMode === 'job-selection') {
  return (
    <div className="space-y-6">
      <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
              Select Job for Candidate Reports
          </CardTitle>
          <CardDescription>
              Choose a job position to view candidate applications and reports
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid gap-4">
              {jobs.map((job) => (
                <Card 
                  key={job.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow bg-white/80 shadow-xl rounded-3xl border-0"
                  onClick={() => handleJobSelect(job.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">{job.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Building2 className="w-4 h-4 mr-1" />
                            {job.department}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(job.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline">
                        View Candidates
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {jobs.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs available</h3>
                  <p className="text-gray-500">Create a job posting to start receiving applications.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewMode === 'candidate-list') {
    return (
      <div className="space-y-6">
        <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBackToJobs}
                    className="p-0 h-auto"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>
                  Candidate Applications
                </CardTitle>
                <CardDescription>
                  {jobs.find(j => j.id === selectedJobId)?.title}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={timeFilter} onValueChange={(value: TimeFilter) => filterByTime(value)}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="3d">Last 3 Days</SelectItem>
                    <SelectItem value="1w">Last Week</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications.map((application) => (
                <Card 
                  key={application.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow bg-white/80 shadow-xl rounded-3xl border-0"
                  onClick={() => handleCandidateSelect(application)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold">{application.name}</h3>
                          <Badge variant={getStatusColor(application.status)}>
                            {application.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {application.email}
                          </span>
                          <span className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {application.phone}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(application.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {application.ai_score > 0 && (
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium">AI Score: {application.ai_score}/100</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {application.resume_url && (
                          <Badge variant="outline" className="flex items-center">
                            <FileText className="w-3 h-3 mr-1" />
                            Resume
                          </Badge>
                        )}
                        {application.audio_url && (
                          <Badge variant="outline" className="flex items-center">
                            <Headphones className="w-3 h-3 mr-1" />
                            Audio
                          </Badge>
                        )}
                        <Button variant="outline" size="sm">
                          View Report
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {applications.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
                  <p className="text-gray-500">
                    {timeFilter === 'all' 
                      ? "No candidates have applied to this position yet."
                      : `No applications in the ${getTimeFilterLabel(timeFilter).toLowerCase()}.`
                    }
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (viewMode === 'individual-report' && selectedApplication) {
    // Get public URLs for files
    const resumePublicUrl = getSupabaseFileUrl(selectedApplication.resume_url);
    const audioPublicUrl = getSupabaseFileUrl(selectedApplication.audio_url);

    return (
      <div className="space-y-6">
        <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBackToCandidates}
                    className="p-0 h-auto"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                  </Button>
                  Candidate Report
                </CardTitle>
                <CardDescription>
                  {selectedApplication.name} - {selectedApplication.job?.title}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusColor(selectedApplication.status)}>
                  {selectedApplication.status}
                </Badge>
                <Select 
                  value={selectedApplication.status} 
                  onValueChange={(value) => updateApplicationStatus(selectedApplication.id, value)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="interviewed">Interviewed</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="resume">Resume Analysis</TabsTrigger>
                <TabsTrigger value="audio">Audio Analysis</TabsTrigger>
                <TabsTrigger value="ai-assessment">AI Assessment</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
                    <CardHeader>
                      <CardTitle className="text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="font-medium">Name:</span>
                        <span className="ml-2">{selectedApplication.name}</span>
                      </div>
                      <div>
                        <span className="font-medium">Email:</span>
                        <span className="ml-2">{selectedApplication.email}</span>
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span>
                        <span className="ml-2">{selectedApplication.phone}</span>
                      </div>
                      <div>
                        <span className="font-medium">Applied:</span>
                        <span className="ml-2">
                          {new Date(selectedApplication.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
                    <CardHeader>
                      <CardTitle className="text-lg">AI Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {selectedApplication.ai_score || 0}
                        </div>
                        <div className="text-sm text-gray-500">out of 100</div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${selectedApplication.ai_score || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedApplication.cover_letter && (
                  <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
                    <CardHeader>
                      <CardTitle className="text-lg">Cover Letter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedApplication.cover_letter}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="resume" className="space-y-4">
                {selectedApplication.resume_url && resumePublicUrl ? (
                  <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
                    <CardHeader>
                      <CardTitle className="text-lg">Resume Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">Resume Document</span>
                        </div>
                        <div className="space-y-2">
                          <Button 
                            variant="outline" 
                            onClick={() => window.open(resumePublicUrl, '_blank')}
                          >
                            View Resume
                          </Button>
                          <p className="text-sm text-gray-500">
                            File path: {selectedApplication.resume_url}
                          </p>
                        </div>
                        {selectedApplication.candidate_report?.skills_assessment && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Skills Assessment</h4>
                            <div className="bg-white/60 p-4 rounded-2xl">
                              <pre className="text-sm text-gray-700">
                                {JSON.stringify(selectedApplication.candidate_report.skills_assessment, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
                    <CardContent className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Resume Uploaded</h3>
                      <p className="text-gray-500">
                        {selectedApplication.resume_url 
                          ? "Unable to load resume file. Check if the file exists and the path is correct."
                          : "This candidate did not upload a resume."
                        }
                      </p>
                      {selectedApplication.resume_url && (
                        <p className="text-xs text-gray-400 mt-2">
                          Path: {selectedApplication.resume_url}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="audio" className="space-y-4">
                {Array.isArray(selectedApplication.audio_qas) && selectedApplication.audio_qas.length > 0 ? (
                  <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
                    <CardHeader>
                      <CardTitle className="text-lg">Audio Q&A Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {selectedApplication.audio_qas.map((qa, idx) => (
                          <div key={idx} className="mb-6">
                            <div className="font-medium mb-2">{qa.question}</div>
                            <audio controls className="w-full mb-1">
                              <source src={getSupabaseFileUrl(qa.answer_url)} type="audio/webm" />
                              Your browser does not support the audio element.
                            </audio>
                            <div className="text-xs text-gray-500 break-all">File path: {qa.answer_url}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : selectedApplication.audio_url && getSupabaseFileUrl(selectedApplication.audio_url) ? (
                  <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
                    <CardHeader>
                      <CardTitle className="text-lg">Audio Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Headphones className="w-5 h-5 text-green-600" />
                          <span className="font-medium">Audio Recording</span>
                        </div>
                        <div className="space-y-2">
                          <audio controls className="w-full">
                            <source src={getSupabaseFileUrl(selectedApplication.audio_url)} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                          <p className="text-sm text-gray-500">
                            File path: {selectedApplication.audio_url}
                          </p>
                        </div>
                        {selectedApplication.audio_transcription?.transcription_text && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Transcription</h4>
                            <div className="bg-white/60 p-4 rounded-2xl">
                              <p className="text-sm text-gray-700">
                                {selectedApplication.audio_transcription.transcription_text}
                              </p>
                            </div>
                          </div>
                        )}
                        {selectedApplication.candidate_report?.personality_insights && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Personality Insights</h4>
                            <div className="bg-white/60 p-4 rounded-2xl">
                              <pre className="text-sm text-gray-700">
                                {JSON.stringify(selectedApplication.candidate_report.personality_insights, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
                    <CardContent className="text-center py-8">
                      <Headphones className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Audio Recording</h3>
                      <p className="text-gray-500">
                        This candidate did not submit any audio Q&A recordings.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="ai-assessment" className="space-y-4">
                <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
                  <CardHeader>
                    <CardTitle className="text-lg">AI Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedApplication.candidate_report?.ai_analysis ? (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-white/60 rounded-2xl">
                            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-blue-600">
                              {selectedApplication.candidate_report.overall_score}
                            </div>
                            <div className="text-sm text-gray-600">Overall Score</div>
                          </div>
                          <div className="text-center p-4 bg-white/60 rounded-2xl">
                            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-green-600">
                              {selectedApplication.ai_score}
                            </div>
                            <div className="text-sm text-gray-600">AI Score</div>
                          </div>
                          <div className="text-center p-4 bg-white/60 rounded-2xl">
                            <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <div className="text-2xl font-bold text-purple-600">
                              {selectedApplication.candidate_report.overall_score}
                            </div>
                            <div className="text-sm text-gray-600">Match Score</div>
                          </div>
                        </div>
                        <div className="bg-white/60 p-4 rounded-2xl">
                          <h4 className="font-medium mb-2">Detailed Analysis</h4>
                          <pre className="text-sm text-gray-700">
                            {JSON.stringify(selectedApplication.candidate_report.ai_analysis, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Assessment Available</h3>
                        <p className="text-gray-500">AI analysis has not been performed for this candidate yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <Card className="bg-white/80 shadow-xl rounded-3xl border-0">
                  <CardHeader>
                    <CardTitle>Send Email to Candidate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SendEmailSection candidate={selectedApplication} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
