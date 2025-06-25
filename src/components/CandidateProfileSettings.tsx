import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCandidate } from "@/hooks/useCandidate";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { 
  Settings, 
  Loader2, 
  User, 
  Phone, 
  Briefcase, 
  FileText, 
  Github, 
  Linkedin, 
  Globe, 
  Upload,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export const CandidateProfileSettings = () => {
  const { user } = useAuth();
  const { profile, updateProfile, fetchProfile } = useCandidate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    skills: "",
    experience_years: 0,
    github_url: "",
    linkedin_url: "",
    portfolio_url: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [currentResumeUrl, setCurrentResumeUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        skills: profile.skills?.join(", ") || "",
        experience_years: profile.experience_years || 0,
        github_url: profile.github_url || "",
        linkedin_url: profile.linkedin_url || "",
        portfolio_url: profile.portfolio_url || "",
      });

      if (profile.resume_url) {
        const { data } = supabase.storage.from('applications').getPublicUrl(profile.resume_url);
        setCurrentResumeUrl(data.publicUrl);
      } else {
        setCurrentResumeUrl(null);
      }
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === "application/pdf" && file.size <= 5 * 1024 * 1024) { // 5MB limit
        setResumeFile(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select a PDF file smaller than 5MB.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setIsSaving(true);

    try {
      let resume_url_path = profile.resume_url;

      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `resumes/${user.id}/resume.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("applications")
          .upload(fileName, resumeFile, { upsert: true });

        if (uploadError) throw uploadError;
        resume_url_path = uploadData.path;
      }

      const updates = {
        ...formData,
        skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        experience_years: Number(formData.experience_years),
        resume_url: resume_url_path,
      };

      const { success, error } = await updateProfile(updates);

      if (success) {
        toast({ 
          title: "Profile updated successfully!",
          description: "Your profile has been saved and will be used for future applications."
        });
        fetchProfile(); // refetch profile to get latest data
        setIsOpen(false);
      } else {
        throw new Error(error);
      }
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="hover:bg-green-50 hover:text-green-600 hover:border-green-200 transition-colors">
          <Settings className="w-4 h-4 mr-2" />
          Profile Settings
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl font-bold">Profile Settings</SheetTitle>
          <SheetDescription className="text-base">
            Update your profile information. This will be used to auto-fill future applications and help recruiters find you.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
              <User className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium">Full Name</Label>
                <Input 
                  id="full_name" 
                  value={formData.full_name} 
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="h-11 border-2 border-gray-200 focus:border-green-500 transition-colors"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="+1 (555) 123-4567" 
                  value={formData.phone} 
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-11 border-2 border-gray-200 focus:border-green-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
              <Briefcase className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="experience_years" className="text-sm font-medium">Years of Experience</Label>
                <Input 
                  id="experience_years" 
                  type="number" 
                  value={formData.experience_years} 
                  onChange={(e) => setFormData({ ...formData, experience_years: Number(e.target.value) })}
                  className="h-11 border-2 border-gray-200 focus:border-green-500 transition-colors"
                  min="0"
                  max="50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="skills" className="text-sm font-medium">Skills (comma-separated)</Label>
                <Textarea 
                  id="skills" 
                  placeholder="e.g. React, TypeScript, Figma, Project Management" 
                  value={formData.skills} 
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="border-2 border-gray-200 focus:border-green-500 transition-colors"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Resume Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Resume</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resume" className="text-sm font-medium">Upload Resume (PDF, max 5MB)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <Input 
                    id="resume" 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="resume" className="cursor-pointer">
                    <span className="text-green-600 hover:text-green-800 font-medium">
                      Click to upload
                    </span>
                    <span className="text-gray-500"> or drag and drop</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1">PDF files only, maximum 5MB</p>
                </div>
              </div>
              
              {currentResumeUrl && (
                <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">Current resume:</span>
                  <a 
                    href={currentResumeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-green-600 hover:text-green-800 underline"
                  >
                    View Current Resume
                  </a>
                </div>
              )}
              
              {resumeFile && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">New resume selected:</span>
                  <span className="text-sm font-medium text-blue-900">{resumeFile.name}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Social & Portfolio Links Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
              <Globe className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">Social & Portfolio Links</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github_url" className="text-sm font-medium flex items-center">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub URL
                </Label>
                <Input 
                  id="github_url" 
                  placeholder="https://github.com/username" 
                  value={formData.github_url} 
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  className="h-11 border-2 border-gray-200 focus:border-green-500 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="linkedin_url" className="text-sm font-medium flex items-center">
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn URL
                </Label>
                <Input 
                  id="linkedin_url" 
                  placeholder="https://linkedin.com/in/username" 
                  value={formData.linkedin_url} 
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  className="h-11 border-2 border-gray-200 focus:border-green-500 transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="portfolio_url" className="text-sm font-medium flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Portfolio URL
                </Label>
                <Input 
                  id="portfolio_url" 
                  placeholder="https://your-portfolio.com" 
                  value={formData.portfolio_url} 
                  onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                  className="h-11 border-2 border-gray-200 focus:border-green-500 transition-colors"
                />
              </div>
            </div>
          </div>
          
          <SheetFooter className="pt-6 border-t border-gray-200">
            <SheetClose asChild>
              <Button type="button" variant="outline" className="h-11 px-6">
                Cancel
              </Button>
            </SheetClose>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="h-11 px-6 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all duration-200"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}; 