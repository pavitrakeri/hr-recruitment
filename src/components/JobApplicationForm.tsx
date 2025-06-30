import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Mic, Square, CheckCircle, Pause, Play, Repeat } from "lucide-react";
import { useApplications } from "@/hooks/useApplications";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCandidate } from "@/hooks/useCandidate";

const AUDIO_QUESTIONS = [
  "Why are you interested in working for our company?",
  "Why is this particular role important to you?",
  "Describe a significant decision you've made recently.",
  "Describe a project you've recently taken responsibility for.",
  "How do you know when you've done something well?",
  "Tell me about a work experience you really enjoyed"
];

export default function JobApplicationForm({ job, onSubmitted }) {
  const { user } = useAuth();
  const { submitApplication } = useApplications();
  const { toast } = useToast();
  const { profile: candidateProfile } = useCandidate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cover_letter: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);

  // Audio QAs state
  const [audioQAs, setAudioQAs] = useState(
    AUDIO_QUESTIONS.map(() => ({
      isRecording: false,
      isPaused: false,
      hasRecording: false,
      audioBlob: null,
      audioUrl: null,
      mediaRecorder: null,
      audioChunks: [],
      uploading: false,
      uploadedUrl: null
    }))
  );

  const modalContentRef = useRef(null);

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

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) setResumeFile(file);
  };

  // Audio recording handlers for each question
  const startRecording = async (idx) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      const newAudioQAs = [...audioQAs];
      newAudioQAs[idx].mediaRecorder = mediaRecorder;
      newAudioQAs[idx].audioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) newAudioQAs[idx].audioChunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(newAudioQAs[idx].audioChunks, { type: 'audio/webm' });
        newAudioQAs[idx].audioBlob = audioBlob;
        newAudioQAs[idx].hasRecording = true;
        newAudioQAs[idx].audioUrl = URL.createObjectURL(audioBlob);
        newAudioQAs[idx].isRecording = false;
        newAudioQAs[idx].isPaused = false;
        setAudioQAs([...newAudioQAs]);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      newAudioQAs[idx].isRecording = true;
      newAudioQAs[idx].isPaused = false;
      setAudioQAs([...newAudioQAs]);
    } catch (error) {
      toast({ title: "Microphone Error", description: "Could not access microphone. Please grant permission.", variant: "destructive" });
    }
  };

  const pauseRecording = (idx) => {
    const newAudioQAs = [...audioQAs];
    if (newAudioQAs[idx].mediaRecorder && newAudioQAs[idx].isRecording) {
      newAudioQAs[idx].mediaRecorder.pause();
      newAudioQAs[idx].isPaused = true;
      setAudioQAs([...newAudioQAs]);
    }
  };

  const resumeRecording = (idx) => {
    const newAudioQAs = [...audioQAs];
    if (newAudioQAs[idx].mediaRecorder && newAudioQAs[idx].isPaused) {
      newAudioQAs[idx].mediaRecorder.resume();
      newAudioQAs[idx].isPaused = false;
      setAudioQAs([...newAudioQAs]);
    }
  };

  const stopRecording = (idx) => {
    const newAudioQAs = [...audioQAs];
    if (newAudioQAs[idx].mediaRecorder && newAudioQAs[idx].isRecording) {
      newAudioQAs[idx].mediaRecorder.stop();
      newAudioQAs[idx].isRecording = false;
      setAudioQAs([...newAudioQAs]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!job?.id) return;
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setPhoneError("Phone number must be at least 10 digits.");
      return;
    } else {
      setPhoneError(null);
    }
    if (!audioQAs.every(q => q.hasRecording)) {
      toast({ title: "Please record all audio answers before submitting." });
      return;
    }
    setIsSubmitting(true);
    try {
      let resume_url;
      const safeJobTitle = job?.title?.replace(/[^a-zA-Z0-9-_]/g, "_") || "job";
      
      // Upload resume
      if (resumeFile) {
        const ext = resumeFile.name.split('.').pop();
        const resumePath = `${job.id}/${safeJobTitle}/resume.${ext}`;
        const { data, error } = await supabase.storage.from('applications').upload(resumePath, resumeFile, { upsert: true });
        if (error) throw new Error(`Resume upload failed: ${error.message}`);
        resume_url = data.path;
      }

      // Upload all audio answers
      const audio_qas = [];
      for (let i = 0; i < AUDIO_QUESTIONS.length; i++) {
        const q = audioQAs[i];
        if (q.audioBlob) {
          const audioPath = `${job.id}/${safeJobTitle}/audio_q${i + 1}.webm`;
          const { data, error } = await supabase.storage.from('applications').upload(audioPath, q.audioBlob, { upsert: true });
          if (error) throw new Error(`Audio upload failed for Q${i + 1}: ${error.message}`);
          audio_qas.push({ question: AUDIO_QUESTIONS[i], answer_url: data.path });
        }
      }
      
      await submitApplication({ job_id: job.id, ...formData, resume_url, audio_qas } as any);
      
      toast({
        title: "Application Submitted!",
        description: "Your application has been successfully submitted.",
      });

      if (onSubmitted) onSubmitted();
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message || "An unknown error occurred.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto my-6">
      <CardHeader>
        <CardTitle className="text-2xl sm:text-3xl">Apply for {job?.title}</CardTitle>
        <CardDescription>Fill out the form below to submit your application.</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="john@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 123-4567" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
              {phoneError && <div className="text-red-600 text-sm mt-1">{phoneError}</div>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="resume">Resume/CV</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">{resumeFile ? resumeFile.name : "Upload your resume (PDF, DOC, DOCX)"}</p>
                <Input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={handleFileUpload} className="hidden" required />
                <Button type="button" variant="outline" onClick={() => document.getElementById('resume')?.click()}>Choose File</Button>
              </div>
            </div>
            <div className="space-y-6">
              <Label className="text-base font-medium">Audio Questions</Label>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">{audioQAs.filter(q => q.hasRecording).length} / {AUDIO_QUESTIONS.length} answered</span>
                <span className="text-xs text-gray-400">You can play or re-record any answer before submitting.</span>
              </div>
              {AUDIO_QUESTIONS.map((q, idx) => (
                <Card key={idx} className="bg-white border border-gray-200 shadow-sm rounded-2xl mb-6 transition-all hover:shadow-lg">
                  <CardContent className="pt-4 pb-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900 text-base">Q{idx + 1}. {q}</p>
                      <span className="text-xs text-gray-500">
                        {audioQAs[idx].isRecording
                          ? "Recording..."
                          : audioQAs[idx].isPaused
                          ? "Paused"
                          : audioQAs[idx].hasRecording
                          ? "Ready to Play"
                          : "Not answered"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center mb-2">
                      <Button
                        type="button"
                        variant={audioQAs[idx].isRecording ? "destructive" : "default"}
                        className={audioQAs[idx].isRecording ? "bg-red-600 hover:bg-red-700" : ""}
                        onClick={() => audioQAs[idx].isRecording ? stopRecording(idx) : startRecording(idx)}
                        title={audioQAs[idx].isRecording ? "Stop Recording" : "Start Recording"}
                      >
                        {audioQAs[idx].isRecording ? (
                          <><Square className="w-4 h-4 mr-2" /> Stop</>
                        ) : (
                          <><Mic className="w-4 h-4 mr-2" /> Record</>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => audioQAs[idx].isPaused ? resumeRecording(idx) : pauseRecording(idx)}
                        disabled={!audioQAs[idx].isRecording}
                        title={audioQAs[idx].isPaused ? "Resume Recording" : "Pause Recording"}
                      >
                        <Pause className="w-4 h-4 mr-2" /> {audioQAs[idx].isPaused ? "Resume" : "Pause"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          if (audioQAs[idx].audioUrl) {
                            const audio = new Audio(audioQAs[idx].audioUrl);
                            audio.play();
                          }
                        }}
                        disabled={!audioQAs[idx].hasRecording}
                        title="Play Answer"
                      >
                        <Play className="w-4 h-4 mr-2" /> Play
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          const newAudioQAs = [...audioQAs];
                          newAudioQAs[idx] = {
                            ...newAudioQAs[idx],
                            isRecording: false,
                            isPaused: false,
                            hasRecording: false,
                            audioBlob: null,
                            audioUrl: null,
                            mediaRecorder: null,
                            audioChunks: [],
                            uploading: false,
                            uploadedUrl: null
                          };
                          setAudioQAs(newAudioQAs);
                        }}
                        disabled={!audioQAs[idx].hasRecording}
                        title="Re-record Answer"
                      >
                        <Repeat className="w-4 h-4 mr-2" /> Re-record
                      </Button>
                    </div>
                    {audioQAs[idx].audioUrl && (
                      <audio controls src={audioQAs[idx].audioUrl} className="w-full rounded-lg border mt-2" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button type="submit" disabled={isSubmitting || !resumeFile || !audioQAs.every(q => q.hasRecording)} className="w-full">
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
} 