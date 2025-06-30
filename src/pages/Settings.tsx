import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCandidate } from '@/hooks/useCandidate';
import { useToast } from '@/hooks/use-toast';
import { CandidateSidebar } from '@/components/CandidateSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const settingsSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().optional(),
  github_url: z.string().url().optional().or(z.literal('')),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  portfolio_url: z.string().url().optional().or(z.literal('')),
  salary_expectation_min: z.coerce.number().optional(),
  salary_expectation_max: z.coerce.number().optional(),
  is_active: z.boolean().default(true),
});

const Settings = () => {
  const { profile, loading, updateProfile, fetchProfile } = useCandidate();
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
        full_name: '',
        phone: '',
        github_url: '',
        linkedin_url: '',
        portfolio_url: '',
        salary_expectation_min: 0,
        salary_expectation_max: 0,
        is_active: true,
    },
  });

  useEffect(() => {
    if (profile) {
      reset(profile);
    }
  }, [profile, reset]);

  const onSubmit = async (data: z.infer<typeof settingsSchema>) => {
    const { success, error } = await updateProfile(data);
    if (success) {
      toast({ title: 'Settings saved successfully!' });
      fetchProfile();
    } else {
      toast({ title: 'Failed to save settings', description: error, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <CandidateSidebar />
      <main className="flex-1 lg:ml-64 p-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        {loading ? (
          <p>Loading settings...</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Controller name="full_name" control={control} render={({ field }) => <Input {...field} />} />
                  {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Controller name="phone" control={control} render={({ field }) => <Input {...field} />} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professional Links</CardTitle>
                <CardDescription>Add links to your professional profiles and portfolio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label>GitHub URL</Label>
                  <Controller name="github_url" control={control} render={({ field }) => <Input {...field} />} />
                   {errors.github_url && <p className="text-red-500 text-sm">{errors.github_url.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Controller name="linkedin_url" control={control} render={({ field }) => <Input {...field} />} />
                   {errors.linkedin_url && <p className="text-red-500 text-sm">{errors.linkedin_url.message}</p>}
                </div>
                 <div className="space-y-2">
                  <Label>Portfolio URL</Label>
                  <Controller name="portfolio_url" control={control} render={({ field }) => <Input {...field} />} />
                   {errors.portfolio_url && <p className="text-red-500 text-sm">{errors.portfolio_url.message}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Preferences</CardTitle>
                <CardDescription>Let us know your salary expectations.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label>Minimum Salary Expectation (£)</Label>
                  <Controller name="salary_expectation_min" control={control} render={({ field }) => <Input type="number" {...field} />} />
                </div>
                 <div className="space-y-2">
                  <Label>Maximum Salary Expectation (£)</Label>
                  <Controller name="salary_expectation_max" control={control} render={({ field }) => <Input type="number" {...field} />} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Account Status</CardTitle>
                    <CardDescription>Deactivate your account if you are no longer looking for jobs.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4">
                        <Controller name="is_active" control={control} render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
                        <Label>{control._getWatch('is_active') ? "Your profile is active and visible to recruiters." : "Your profile is inactive."}</Label>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default Settings; 