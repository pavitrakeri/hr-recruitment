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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCandidate } from "@/hooks/useCandidate";
import { WorkDetails } from "@/hooks/useCandidate";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const workDetailsSchema = z.object({
  status: z.string().optional(),
  notice_period: z.string().optional(),
  expected_salary: z.string().optional(),
  relocation: z.enum(["yes", "no", "within_country"]).optional(),
});

interface WorkDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkDetailsModal = ({ isOpen, onClose }: WorkDetailsModalProps) => {
  const { profile, updateProfile, fetchProfile } = useCandidate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkDetails>({
    resolver: zodResolver(workDetailsSchema),
    defaultValues: profile?.work_details || {},
  });

  useEffect(() => {
    if (profile?.work_details) {
      reset(profile.work_details);
    }
  }, [profile, reset]);

  const onSubmit = async (data: WorkDetails) => {
    setIsSaving(true);
    const { success, error } = await updateProfile({ work_details: data });
    setIsSaving(false);

    if (success) {
      toast({ title: "Work details updated successfully!" });
      fetchProfile();
      onClose();
    } else {
      toast({
        title: "Failed to update work details",
        description: error,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Work Details</DialogTitle>
          <DialogDescription>
            Tell us about your current employment situation and your preferences.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Current status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uk_citizen">UK/Irish Citizen</SelectItem>
                    <SelectItem value="skilled_worker_visa">Skilled Worker Visa</SelectItem>
                    <SelectItem value="student_visa">Student Visa</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Notice period</Label>
             <Controller
              name="notice_period"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your notice period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_week">1 week - 2 weeks</SelectItem>
                    <SelectItem value="1_month">1 month</SelectItem>
                    <SelectItem value="2_months">2 months</SelectItem>
                    <SelectItem value="immediately">Immediately available</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Expected salary (£)</Label>
            <Controller
                name="expected_salary"
                control={control}
                render={({ field }) => <Input {...field} placeholder="e.g., £50,000 - £60,000" />}
            />
          </div>

          <div className="space-y-2">
            <Label>Are you willing to relocate if required?</Label>
            <Controller
              name="relocation"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="yes" />
                    <Label htmlFor="yes">Yes, to any location</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="within_country" id="within_country" />
                    <Label htmlFor="within_country">Yes, within the same country</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no" />
                    <Label htmlFor="no">Prefer not to say</Label>
                  </div>
                </RadioGroup>
              )}
            />
          </div>
          
          <DialogFooter className="pt-4">
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