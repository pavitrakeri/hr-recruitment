import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCandidate } from "@/hooks/useCandidate";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const aboutSchema = z.object({
  bio: z.string().max(500, "Bio must be 500 characters or less.").optional(),
});

interface AboutMeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutMeModal = ({ isOpen, onClose }: AboutMeModalProps) => {
  const { profile, updateProfile, fetchProfile } = useCandidate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<{ bio?: string }>({
    resolver: zodResolver(aboutSchema),
    defaultValues: { bio: profile?.bio || "" },
  });

  useEffect(() => {
    if (profile?.bio) {
      reset({ bio: profile.bio });
    }
  }, [profile, reset]);

  const onSubmit = async (data: { bio?: string }) => {
    setIsSaving(true);
    const { success, error } = await updateProfile({ bio: data.bio });
    setIsSaving(false);

    if (success) {
      toast({ title: "Bio updated successfully!" });
      fetchProfile();
      onClose();
    } else {
      toast({
        title: "Failed to update bio",
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
          <DialogTitle>Edit Your Bio</DialogTitle>
          <DialogDescription>
            Tell us a bit about yourself. Keep it concise and professional.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <Controller
            name="bio"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="Describe your experience and career goals..."
                rows={6}
              />
            )}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 