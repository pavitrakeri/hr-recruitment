import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Application {
  id: string;
  audio_url?: string;
}

interface ApplicationAudioPlayerProps {
  application: Application;
  currentlyPlaying: string | null;
  onAudioPlay: (applicationId: string, audioUrl: string) => void;
  onAudioPause: (applicationId: string) => void;
}

export const ApplicationAudioPlayer = ({
  application,
  currentlyPlaying,
  onAudioPlay,
  onAudioPause,
}: ApplicationAudioPlayerProps) => {
  const [audioError, setAudioError] = useState<string | null>(null);

  // Helper function to get public URL for audio files
  const getAudioPublicUrl = (filePath: string | null | undefined) => {
    if (!filePath) return null;
    
    try {
      const { data } = supabase.storage
        .from('applications')
        .getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error generating public URL:', error);
      return null;
    }
  };

  const audioPublicUrl = getAudioPublicUrl(application.audio_url);
  const isValidAudio = !!audioPublicUrl;

  const handlePlay = () => {
    setAudioError(null);
    if (isValidAudio && audioPublicUrl) {
      onAudioPlay(application.id, audioPublicUrl);
    } else {
      setAudioError("Audio file not available.");
    }
  };

  return (
    <div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          if (currentlyPlaying === application.id) {
            onAudioPause(application.id);
          } else {
            handlePlay();
          }
        }}
        disabled={!isValidAudio}
        title={!isValidAudio ? "Audio not available" : undefined}
      >
        {currentlyPlaying === application.id ? (
          <Pause className="w-4 h-4 mr-2" />
        ) : (
          <Play className="w-4 h-4 mr-2" />
        )}
        {currentlyPlaying === application.id ? 'Pause' : 'Audio'}
      </Button>
      {audioError && (
        <div className="text-xs text-red-600 mt-1">{audioError}</div>
      )}
      {application.audio_url && !isValidAudio && (
        <div className="text-xs text-orange-600 mt-1">
          File path: {application.audio_url}
        </div>
      )}
    </div>
  );
};
