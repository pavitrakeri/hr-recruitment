import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Mic, MicOff, Play, Square, CheckCircle, ArrowLeft } from "lucide-react";
import { useApplications } from "@/hooks/useApplications";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCandidate } from "@/hooks/useCandidate";

const ApplyForJob = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams();
  const { submitApplication } = useApplications();
  const { toast } = useToast();
  const { profile: candidateProfile, loading: candidateLoading } = useCandidate();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cover_letter: ""
  });
  
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [job, setJob] = useState<any>(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);

  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Candidate authentication check
  useEffect(() => {
    if (!loading) {
      if (!user || user.user_metadata.user_type !== "candidate" || !user.email_confirmed_at) {
        // Redirect to candidate login with redirect param
        navigate(`/candidate?redirect=${encodeURIComponent(location.pathname)}`, { replace: true });
      }
    }
  }, [user, loading, navigate, location.pathname]);

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      setJobLoading(true);
      try {
        const { data, error } = await supabase.from('jobs').select('title, company_name').eq('id', jobId).single();
        if (error || !data) {
          setJobError("Job not found.");
        } else {
          setJob(data);
        }
      } catch (err) {
        setJobError("Failed to fetch job details.");
      } finally {
        setJobLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  // Prefill form fields with candidate profile data if available
  useEffect(() => {
    if (candidateProfile) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || candidateProfile.full_name || "",
        email: prev.email || candidateProfile.email || "",
        phone: prev.phone || candidateProfile.phone || "",
      }));
    }
  }, [candidateProfile]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setHasRecording(true);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({ title: "Microphone Error", description: "Could not access microphone. Please grant permission.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setPhoneError("Phone number must be at least 10 digits.");
      return;
    } else {
      setPhoneError(null);
    }

    setIsSubmitting(true);
    try {
      let audio_url, resume_url;

      // Sanitize job title and email for folder names
      const safeJobTitle = job?.title?.replace(/[^a-zA-Z0-9-_]/g, "_") || "job";
      const safeEmail = formData.email.replace(/[^a-zA-Z0-9@._-]/g, "_");

      if (audioBlob) {
        const audioPath = `${safeJobTitle}/${safeEmail}/audio.webm`;
        const { data, error } = await supabase.storage.from('applications').upload(audioPath, audioBlob);
        if (error) throw new Error(`Audio upload failed: ${error.message}`);
        audio_url = data.path;
      }
      
      if (resumeFile) {
        const ext = resumeFile.name.split('.').pop();
        const resumePath = `${safeJobTitle}/${safeEmail}/resume.${ext}`;
        const { data, error } = await supabase.storage.from('applications').upload(resumePath, resumeFile);
        if (error) throw new Error(`Resume upload failed: ${error.message}`);
        resume_url = data.path;
      }

      await submitApplication({ job_id: jobId, ...formData, resume_url, audio_url });
      
      await supabase.auth.admin.inviteUserByEmail(formData.email, {
        data: { created_from_application: true }
      });

      setIsSubmitted(true);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({ title: "Submission Failed", description: error.message || "An unknown error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Application Submitted!</h2>
            <p className="text-gray-600 my-4">Thank you for applying for the {job?.title} position. You'll receive an email with instructions to track your application status.</p>
            <Button asChild className="w-full">
              <Link to="/">Explore Other Positions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          {jobLoading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
          ) : (
            <CardTitle className="text-2xl sm:text-3xl">Apply for {job?.title}</CardTitle>
          )}
          <CardDescription>Fill out the form below to submit your application.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
              {phoneError && <div className="text-red-600 text-sm mt-1">{phoneError}</div>}
            </div>

            {/* Resume Upload */}
            <div className="space-y-2">
              <Label htmlFor="resume">Resume/CV</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">{resumeFile ? resumeFile.name : "Upload your resume (PDF, DOC, DOCX)"}</p>
                <Input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" required />
                <Button type="button" variant="outline" onClick={() => document.getElementById('resume')?.click()}>Choose File</Button>
              </div>
            </div>

            {/* Cover Letter */}
            <div className="space-y-2">
              <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
              <Textarea id="cover-letter" placeholder="Tell us why you're interested in this position..." rows={4} value={formData.cover_letter} onChange={(e) => setFormData({...formData, cover_letter: e.target.value})} />
            </div>

            {/* Audio Response */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Audio Response</Label>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <p className="font-medium text-blue-900">{`"Tell us about your experience and why you're passionate about this role."`}</p>
                </CardContent>
              </Card>
              <div className="flex items-center space-x-4">
                <Button type="button" variant={isRecording ? "destructive" : "default"} onClick={() => isRecording ? stopRecording() : startRecording()}>
                  {isRecording ? <><Square className="w-4 h-4 mr-2" /> Stop Recording</> : <><Mic className="w-4 h-4 mr-2" /> Start Recording</>}
                </Button>
                {hasRecording && <div className="flex items-center space-x-2 text-green-600"><CheckCircle className="w-4 h-4" /><span>Recording complete</span></div>}
                {isRecording && <div className="flex items-center space-x-2 text-red-600"><div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div><span>Recording...</span></div>}
              </div>
              {audioUrl && <audio controls src={audioUrl} className="w-full" />}
            </div>

            <Button type="submit" disabled={isSubmitting || !resumeFile || !hasRecording} className="w-full">
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
          <div className="mt-4 text-center">
             <Link to={`/job/${jobId}`} className="text-sm text-gray-600 hover:underline inline-flex items-center">
               <ArrowLeft className="w-4 h-4 mr-1" />
               Back to Job Details
             </Link>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplyForJob; 