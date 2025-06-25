import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCandidate, Experience, Education } from "@/hooks/useCandidate";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

const experienceSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  description: z.string().optional(),
});

const educationSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
});

const formSchema = z.object({
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
});

interface ProfessionalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab: "experience" | "education";
}

export const ProfessionalHistoryModal = ({ isOpen, onClose, defaultTab }: ProfessionalHistoryModalProps) => {
  const { profile, updateProfile, fetchProfile } = useCandidate();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const { control, handleSubmit, reset } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      experience: [],
      education: [],
    },
  });

  useEffect(() => {
    reset({
      experience: profile?.experience || [],
      education: profile?.education || [],
    });
  }, [profile, reset]);

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control, name: "experience",
  });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control, name: "education",
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    const { success, error } = await updateProfile(data);
    setIsSaving(false);

    if (success) {
      toast({ title: "Profile updated successfully!" });
      fetchProfile();
      onClose();
    } else {
      toast({ title: "Update failed", description: error, variant: "destructive" });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Professional History</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue={defaultTab}>
            <TabsList>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="education">Education</TabsTrigger>
            </TabsList>
            <TabsContent value="experience" className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {expFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-2 relative">
                  <div className="grid grid-cols-2 gap-4">
                    <Controller name={`experience.${index}.title`} control={control} render={({ field }) => <Input placeholder="Job Title" {...field} />} />
                    <Controller name={`experience.${index}.company`} control={control} render={({ field }) => <Input placeholder="Company" {...field} />} />
                    <Controller name={`experience.${index}.start_date`} control={control} render={({ field }) => <Input placeholder="Start Date (e.g., Jan 2020)" {...field} />} />
                    <Controller name={`experience.${index}.end_date`} control={control} render={({ field }) => <Input placeholder="End Date (or Present)" {...field} />} />
                  </div>
                  <Controller name={`experience.${index}.description`} control={control} render={({ field }) => <Textarea placeholder="Description..." {...field} />} />
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeExp(index)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => appendExp({ id: uuidv4(), title: "", company: "", start_date: "", end_date: "", description: "" })}>
                <Plus className="w-4 h-4 mr-2" /> Add Experience
              </Button>
            </TabsContent>
            <TabsContent value="education" className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {eduFields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-md space-y-2 relative">
                  <div className="grid grid-cols-2 gap-4">
                     <Controller name={`education.${index}.institution`} control={control} render={({ field }) => <Input placeholder="Institution" {...field} />} />
                     <Controller name={`education.${index}.degree`} control={control} render={({ field }) => <Input placeholder="Degree/Certificate" {...field} />} />
                     <Controller name={`education.${index}.start_date`} control={control} render={({ field }) => <Input placeholder="Start Date (e.g., 2018)" {...field} />} />
                     <Controller name={`education.${index}.end_date`} control={control} render={({ field }) => <Input placeholder="End Date (e.g., 2022)" {...field} />} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeEdu(index)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => appendEdu({ id: uuidv4(), institution: "", degree: "", start_date: "" })}>
                <Plus className="w-4 h-4 mr-2" /> Add Education
              </Button>
            </TabsContent>
          </Tabs>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 