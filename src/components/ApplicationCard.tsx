
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone } from "lucide-react";
import { ApplicationActions } from "./ApplicationActions";
import { ApplicationAudioPlayer } from "./ApplicationAudioPlayer";

interface Application {
  id: string;
  job_id: string;
  name: string;
  email: string;
  phone: string;
  cover_letter?: string;
  resume_url?: string;
  audio_url?: string;
  ai_score: number;
  status: string;
  created_at: string;
  jobs?: {
    title: string;
  };
}

interface ApplicationCardProps {
  application: Application;
  currentlyPlaying: string | null;
  deletingApplications: Set<string>;
  onAudioPlay: (applicationId: string, audioUrl: string) => void;
  onAudioPause: (applicationId: string) => void;
  onResumeView: (resumeUrl: string) => void;
  onResumeDownload: (resumeUrl: string, candidateName: string) => void;
  onDeleteApplication: (applicationId: string, candidateName: string) => void;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return "text-green-600 bg-green-50";
  if (score >= 80) return "text-blue-600 bg-blue-50";
  if (score >= 70) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "new": return "bg-blue-100 text-blue-800";
    case "reviewed": return "bg-yellow-100 text-yellow-800";
    case "shortlisted": return "bg-green-100 text-green-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

export const ApplicationCard = ({
  application,
  currentlyPlaying,
  deletingApplications,
  onAudioPlay,
  onAudioPause,
  onResumeView,
  onResumeDownload,
  onDeleteApplication,
}: ApplicationCardProps) => {
  return (
    <Card key={application.id} className="border border-gray-200">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback>
                {application.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-2">
              <div>
                <h3 className="text-lg font-semibold">{application.name}</h3>
                <p className="text-sm text-gray-600">Applied for: {application.jobs?.title}</p>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  {application.email}
                </span>
                <span className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  {application.phone}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(application.status)}>
                  {application.status}
                </Badge>
                <Badge variant="outline" className={`${getScoreColor(application.ai_score)} border-current`}>
                  AI Score: {application.ai_score}%
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ApplicationActions
              application={application}
              deletingApplications={deletingApplications}
              onResumeView={onResumeView}
              onResumeDownload={onResumeDownload}
              onDeleteApplication={onDeleteApplication}
            />
            
            {application.audio_url && (
              <ApplicationAudioPlayer
                application={application}
                currentlyPlaying={currentlyPlaying}
                onAudioPlay={onAudioPlay}
                onAudioPause={onAudioPause}
              />
            )}
          </div>
        </div>

        {/* AI Analysis Preview */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">AI Analysis Preview</h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Experience Match:</span>
              <div className="font-medium">Excellent (90%)</div>
            </div>
            <div>
              <span className="text-gray-600">Skills Alignment:</span>
              <div className="font-medium">Very Good (85%)</div>
            </div>
            <div>
              <span className="text-gray-600">Communication:</span>
              <div className="font-medium">Excellent (95%)</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
