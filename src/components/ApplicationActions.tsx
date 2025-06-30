import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Eye, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

interface Application {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cover_letter?: string;
  resume_url?: string;
}

interface ApplicationActionsProps {
  application: Application;
  deletingApplications: Set<string>;
  onResumeView: (resumeUrl: string) => void;
  onResumeDownload: (resumeUrl: string, candidateName: string) => void;
  onDeleteApplication: (applicationId: string, candidateName: string) => void;
}

export const ApplicationActions = ({
  application,
  deletingApplications,
  onResumeView,
  onResumeDownload,
  onDeleteApplication,
}: ApplicationActionsProps) => {
  const isValidResume = !!application.resume_url && application.resume_url.startsWith("http");
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  return (
    <>
      {isValidResume ? (
        <div className="flex space-x-1">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onResumeView(application.resume_url!)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onResumeDownload(application.resume_url!, application.name)}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      ) : (
        <div className="flex space-x-1">
          <Button variant="outline" size="sm" disabled title="Resume not available">
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button variant="outline" size="sm" disabled title="Resume not available">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      )}
      {/* Review Modal */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            Review
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Candidate Profile</DialogTitle>
            <DialogDescription>
              Detailed information for {application.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div><strong>Name:</strong> {application.name}</div>
            {application.email && <div><strong>Email:</strong> {application.email}</div>}
            {application.phone && <div><strong>Phone:</strong> {application.phone}</div>}
            {application.cover_letter && (
              <div>
                <strong>Cover Letter:</strong>
                <div className="bg-gray-50 p-2 rounded mt-1 text-sm text-gray-700">{application.cover_letter}</div>
              </div>
            )}
            {/* Add more fields as needed */}
          </div>
        </DialogContent>
      </Dialog>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => onDeleteApplication(application.id, application.name)}
        disabled={deletingApplications.has(application.id)}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        {deletingApplications.has(application.id) ? 'Deleting...' : 'Delete'}
      </Button>
    </>
  );
};
