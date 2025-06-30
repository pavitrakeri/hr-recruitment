import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCandidate } from "@/hooks/useCandidate";
import { useAuth } from "@/hooks/useAuth";
import { 
  Upload, 
  FileText, 
  ExternalLink, 
  DollarSign, 
  MapPin, 
  Clock, 
  Building, 
  Mic,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  User
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  type: string;
  location: string;
  department: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  experience_level?: string;
  required_fields?: string[];
  custom_questions?: any[];
  created_at: string;
}

interface ApplicationFormData {
  cover_letter: string;
  resume: File | null;
  audio: File | null;
  githubUrl: string;
  linkedinUrl: string;
  portfolioUrl: string;
  customAnswers: Record<string, string>;
}

interface DynamicApplicationFormProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApplicationFormData) => Promise<void>;
  isSubmitting: boolean;
}

const DynamicApplicationForm = ({ 
  job, 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting 
}: DynamicApplicationFormProps) => {
  const { profile } = useCandidate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ApplicationFormData>({
    cover_letter: "",
    resume: null,
    audio: null,
    githubUrl: profile?.github_url || "",
    linkedinUrl: profile?.linkedin_url || "",
    portfolioUrl: profile?.portfolio_url || "",
    customAnswers: {}
  });

  const requiredFields = job.required_fields || [];
  const customQuestions = job.custom_questions || [];

  const isFieldRequired = (field: string) => {
    return requiredFields.includes(field);
  };

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return "Not specified";
    const currency = job.salary_currency || "USD";
    const symbol = currency === "USD" ? "$" : currency;
    
    if (job.salary_min && job.salary_max) {
      return `${symbol}${job.salary_min.toLocaleString()} - ${symbol}${job.salary_max.toLocaleString()}`;
    } else if (job.salary_min) {
      return `${symbol}${job.salary_min.toLocaleString()}+`;
    } else if (job.salary_max) {
      return `Up to ${symbol}${job.salary_max.toLocaleString()}`;
    }
    return "Not specified";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file only.",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setFormData(prev => ({ ...prev, resume: file }));
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type (e.g., mp3, wav, mpeg)
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an audio file (e.g., MP3, WAV).",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (e.g., 10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setFormData(prev => ({ ...prev, audio: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const missingFields = [];
    
    if (isFieldRequired("cover_letter") && !formData.cover_letter.trim()) {
      missingFields.push("Cover Letter");
    }
    
    if (isFieldRequired("resume") && !formData.resume) {
      missingFields.push("Resume");
    }
    
    if (isFieldRequired("audio") && !formData.audio) {
      missingFields.push("Audio Response");
    }
    
    if (isFieldRequired("github_url") && !formData.githubUrl.trim()) {
      missingFields.push("GitHub URL");
    }
    
    if (isFieldRequired("linkedin_url") && !formData.linkedinUrl.trim()) {
      missingFields.push("LinkedIn URL");
    }
    
    if (isFieldRequired("portfolio_url") && !formData.portfolioUrl.trim()) {
      missingFields.push("Portfolio URL");
    }
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/80 shadow-xl rounded-3xl border-0">
        <DialogHeader className="pb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold">Apply for {job.title}</DialogTitle>
              <DialogDescription className="text-base">
                Complete your application below. Required fields are marked with an asterisk (*).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Enhanced Job Summary */}
        <Card className="mb-8 border-2 border-gray-100 shadow-sm">
          <CardHeader className="pb-4 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-xl text-gray-900">{job.title}</CardTitle>
                <CardDescription className="mt-2 flex items-center text-base">
                  <Building className="w-5 h-5 mr-2 text-gray-500" />
                  {job.department}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1">{job.type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">{job.location}</span>
                </div>
                <div className="flex items-center text-sm">
                  <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">{formatSalary()}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-gray-500" />
                  <span className="font-medium">Posted {new Date(job.created_at).toLocaleDateString()}</span>
                </div>
                {job.experience_level && (
                  <div className="flex items-center">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      {job.experience_level} Level
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700 leading-relaxed">{job.description}</p>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information (Auto-filled) */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
              <User className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                <Input
                  id="name"
                  value={profile?.full_name || user?.user_metadata?.full_name || ""}
                  disabled
                  className="bg-gray-50 border-2 border-gray-200 h-11"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-50 border-2 border-gray-200 h-11"
                />
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          {isFieldRequired("cover_letter") && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Cover Letter</h3>
                <Badge variant="destructive" className="text-xs">Required</Badge>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cover-letter" className="text-sm font-medium">
                  Tell us why you're interested in this position
                </Label>
                <Textarea
                  id="cover-letter"
                  placeholder="Explain your interest in this role, relevant experience, and why you'd be a great fit..."
                  value={formData.cover_letter}
                  onChange={(e) => setFormData(prev => ({ ...prev, cover_letter: e.target.value }))}
                  rows={6}
                  required
                  className="border-2 border-gray-200 focus:border-green-500 transition-colors"
                />
              </div>
            </div>
          )}

          {/* Resume Upload */}
          {isFieldRequired("resume") && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Resume</h3>
                <Badge variant="destructive" className="text-xs">Required</Badge>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume" className="text-sm font-medium">
                  Upload your resume (PDF only, max 5MB)
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="resume" className="cursor-pointer">
                    <span className="text-green-600 hover:text-green-800 font-medium text-lg">
                      Click to upload
                    </span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.resume ? (
                      <span className="text-green-600 font-medium flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {formData.resume.name}
                      </span>
                    ) : (
                      "No file selected"
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Audio Upload */}
          {isFieldRequired("audio") && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <Mic className="w-5 h-5 text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Audio Response</h3>
                <Badge variant="destructive" className="text-xs">Required</Badge>
              </div>
              <div className="space-y-2">
                <Label htmlFor="audio" className="text-sm font-medium">
                  Upload your audio response (MP3, WAV, max 10MB)
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
                  <Mic className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <Input
                    id="audio"
                    type="file"
                    className="hidden"
                    onChange={handleAudioChange}
                    accept="audio/*"
                  />
                  <label htmlFor="audio" className="cursor-pointer">
                    <span className="text-green-600 hover:text-green-800 font-medium text-lg">
                      Choose an audio file
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    {formData.audio ? (
                      <span className="text-green-600 font-medium flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {formData.audio.name}
                      </span>
                    ) : (
                      "or drag and drop"
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Social Links */}
          {(isFieldRequired("github_url") || isFieldRequired("linkedin_url") || isFieldRequired("portfolio_url")) && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <ExternalLink className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">Social & Portfolio Links</h3>
              </div>
              
              {isFieldRequired("github_url") && (
                <div className="space-y-2">
                  <Label htmlFor="github-url" className="text-sm font-medium flex items-center">
                    GitHub Profile URL
                    <Badge variant="destructive" className="text-xs ml-2">Required</Badge>
                  </Label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="github-url"
                      type="url"
                      placeholder="https://github.com/yourusername"
                      value={formData.githubUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
                      className="pl-10 h-11 border-2 border-gray-200 focus:border-green-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              {isFieldRequired("linkedin_url") && (
                <div className="space-y-2">
                  <Label htmlFor="linkedin-url" className="text-sm font-medium flex items-center">
                    LinkedIn Profile URL
                    <Badge variant="destructive" className="text-xs ml-2">Required</Badge>
                  </Label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="linkedin-url"
                      type="url"
                      placeholder="https://linkedin.com/in/yourprofile"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                      className="pl-10 h-11 border-2 border-gray-200 focus:border-green-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              )}

              {isFieldRequired("portfolio_url") && (
                <div className="space-y-2">
                  <Label htmlFor="portfolio-url" className="text-sm font-medium flex items-center">
                    Portfolio URL
                    <Badge variant="destructive" className="text-xs ml-2">Required</Badge>
                  </Label>
                  <div className="relative">
                    <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="portfolio-url"
                      type="url"
                      placeholder="https://yourportfolio.com"
                      value={formData.portfolioUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                      className="pl-10 h-11 border-2 border-gray-200 focus:border-green-500 transition-colors"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Questions */}
          {customQuestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Additional Questions</h3>
              </div>
              {customQuestions.map((question, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`custom-${index}`} className="text-sm font-medium">
                    {question.question}
                    {question.required && <Badge variant="destructive" className="text-xs ml-2">Required</Badge>}
                  </Label>
                  {question.type === 'textarea' ? (
                    <Textarea
                      id={`custom-${index}`}
                      placeholder={question.placeholder || "Your answer..."}
                      value={formData.customAnswers[`custom-${index}`] || ""}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customAnswers: {
                          ...prev.customAnswers,
                          [`custom-${index}`]: e.target.value
                        }
                      }))}
                      rows={4}
                      required={question.required}
                      className="border-2 border-gray-200 focus:border-green-500 transition-colors"
                    />
                  ) : (
                    <Input
                      id={`custom-${index}`}
                      type="text"
                      placeholder={question.placeholder || "Your answer..."}
                      value={formData.customAnswers[`custom-${index}`] || ""}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        customAnswers: {
                          ...prev.customAnswers,
                          [`custom-${index}`]: e.target.value
                        }
                      }))}
                      required={question.required}
                      className="h-11 border-2 border-gray-200 focus:border-green-500 transition-colors"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} className="h-11 px-6">
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="h-11 px-8 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all duration-200"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit Application"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DynamicApplicationForm; 