import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCandidate } from "@/hooks/useCandidate";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X } from "lucide-react";

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SkillsModal = ({ isOpen, onClose }: SkillsModalProps) => {
  const { profile, updateProfile, fetchProfile } = useCandidate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");

  useEffect(() => {
    if (profile?.skills) {
      setSkills(profile.skills);
    }
  }, [profile]);

  const handleAddSkill = () => {
    if (currentSkill && !skills.includes(currentSkill)) {
      setSkills([...skills, currentSkill]);
      setCurrentSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const onSubmit = async () => {
    setIsSaving(true);
    const { success, error } = await updateProfile({ skills });
    setIsSaving(false);

    if (success) {
      toast({ title: "Skills updated successfully!" });
      fetchProfile();
      onClose();
    } else {
      toast({
        title: "Failed to update skills",
        description: error,
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Your Skills</DialogTitle>
          <DialogDescription>
            Add or remove your professional skills.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 space-y-4">
          <div className="flex gap-2">
            <Input
              value={currentSkill}
              onChange={(e) => setCurrentSkill(e.target.value)}
              placeholder="e.g., React, Figma, UI/UX Design"
              onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
            />
            <Button type="button" onClick={handleAddSkill}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 p-2 min-h-[4rem] rounded-md border">
            {skills.map(skill => (
              <Badge key={skill} variant="secondary" className="text-sm">
                {skill}
                <button onClick={() => handleRemoveSkill(skill)} className="ml-2">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 