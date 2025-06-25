import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCandidate } from "@/hooks/useCandidate";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, File as FileIcon, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResumeUploadModal = ({ isOpen, onClose }: ResumeUploadModalProps) => {
  const { profile, updateProfile, fetchProfile } = useCandidate();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/msword': ['.doc', '.docx'] },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file || !profile) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
    const filePath = `resumes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('candidate-resumes')
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setIsUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
        .from('candidate-resumes')
        .getPublicUrl(filePath);

    const { success, error: updateError } = await updateProfile({ resume_url: publicUrl });
    
    setIsUploading(false);

    if (success) {
      toast({ title: "Resume uploaded successfully!" });
      fetchProfile();
      onClose();
      setFile(null);
    } else {
      toast({ title: "Failed to update profile", description: updateError, variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload new resume</DialogTitle>
          <DialogDescription>
            Upload your resume (PDF, DOC, DOCX). Your previous resume will be replaced.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer
              ${isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-gray-400"}`}
          >
            <input {...getInputProps()} />
            {file ? (
                <div className="text-center">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                    <p className="font-semibold">{file.name}</p>
                    <p className="text-sm text-gray-500">{Math.round(file.size / 1024)} KB</p>
                </div>
            ) : (
                <div className="text-center">
                    <UploadCloud className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="font-semibold">Drag & drop your file here</p>
                    <p className="text-sm text-gray-500">or click to select a file</p>
                </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setFile(null); onClose(); }}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Upload & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 