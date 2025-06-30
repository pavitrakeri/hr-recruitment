import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { useApplications } from "@/hooks/useApplications";
import { useState } from "react";
import { ApplicationFilters } from "@/components/ApplicationFilters";
import { ApplicationCard } from "@/components/ApplicationCard";
import { EmptyStates } from "@/components/EmptyStates";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const JobApplications = () => {
  const { applications, loading, refetch } = useApplications();
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [deletingApplications, setDeletingApplications] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleAudioPlay = (applicationId: string, audioUrl: string) => {
    // Stop currently playing audio
    if (currentlyPlaying && audioElements[currentlyPlaying]) {
      audioElements[currentlyPlaying].pause();
      audioElements[currentlyPlaying].currentTime = 0;
    }

    // If clicking the same audio that's playing, just stop it
    if (currentlyPlaying === applicationId) {
      setCurrentlyPlaying(null);
      return;
    }

    // Create new audio element if it doesn't exist
    if (!audioElements[applicationId]) {
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', () => setCurrentlyPlaying(null));
      setAudioElements(prev => ({ ...prev, [applicationId]: audio }));
      audio.play();
    } else {
      audioElements[applicationId].play();
    }

    setCurrentlyPlaying(applicationId);
  };

  const handleAudioPause = (applicationId: string) => {
    if (audioElements[applicationId]) {
      audioElements[applicationId].pause();
    }
    setCurrentlyPlaying(null);
  };

  const handleResumeView = (resumeUrl: string) => {
    window.open(resumeUrl, '_blank');
  };

  const handleResumeDownload = (resumeUrl: string, candidateName: string) => {
    const link = document.createElement('a');
    link.href = resumeUrl;
    link.download = `${candidateName}_Resume.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteApplication = async (applicationId: string, candidateName: string) => {
    if (!confirm(`Are you sure you want to delete the application from ${candidateName}? This action cannot be undone.`)) {
      return;
    }

    setDeletingApplications(prev => new Set(prev).add(applicationId));

    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Application deleted",
        description: `Application from ${candidateName} has been deleted successfully.`,
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Error deleting application",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingApplications(prev => {
        const newSet = new Set(prev);
        newSet.delete(applicationId);
        return newSet;
      });
    }
  };

  const filteredApplications = applications.filter((application) => {
    // Search filter
    const matchesSearch = 
      application.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      application.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (application.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    // Status filter
    const matchesStatus = statusFilter === "all" || application.status === statusFilter;

    // Score filter
    let matchesScore = true;
    if (scoreFilter !== "all") {
      const score = application.ai_score;
      switch (scoreFilter) {
        case "90+":
          matchesScore = score >= 90;
          break;
        case "80-89":
          matchesScore = score >= 80 && score < 90;
          break;
        case "70-79":
          matchesScore = score >= 70 && score < 80;
          break;
        case "below-70":
          matchesScore = score < 70;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesScore;
  });

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setScoreFilter("all");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Loading Applications...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Candidate Applications
        </CardTitle>
        <CardDescription>
          Review and manage candidate applications with AI-powered insights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ApplicationFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          scoreFilter={scoreFilter}
          onScoreFilterChange={setScoreFilter}
          onClearFilters={handleClearFilters}
        />

        <div className="space-y-6">
          {filteredApplications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              currentlyPlaying={currentlyPlaying}
              deletingApplications={deletingApplications}
              onAudioPlay={handleAudioPlay}
              onAudioPause={handleAudioPause}
              onResumeView={handleResumeView}
              onResumeDownload={handleResumeDownload}
              onDeleteApplication={handleDeleteApplication}
            />
          ))}
          
          {filteredApplications.length === 0 && applications.length > 0 && (
            <EmptyStates type="no-matches" onClearFilters={handleClearFilters} />
          )}
          
          {applications.length === 0 && (
            <EmptyStates type="no-applications" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default JobApplications;
