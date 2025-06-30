import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Mail, 
  Send, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useApplications } from "@/hooks/useApplications";
import { useToast } from "@/hooks/use-toast";
import { EmailTemplate, EmailLog } from "@/integrations/supabase/types";
import axios from 'axios';

export function EmailAutomation() {
  const { user } = useAuth();
  const { applications } = useApplications();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: ''
  });

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading templates",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchEmailLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select(`
          *,
          email_templates(name),
          applications(name, email, jobs(title))
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEmailLogs(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading email logs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert([templateForm])
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [...prev, data]);
      setTemplateForm({ name: '', subject: '', body: '' });
      setIsTemplateDialogOpen(false);
      
      toast({
        title: "Template created",
        description: "Email template has been created successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error creating template",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    try {
      const { data, error } = await supabase
        .from('email_templates')
        .update(templateForm)
        .eq('id', editingTemplate.id)
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? data : t));
      setEditingTemplate(null);
      setTemplateForm({ name: '', subject: '', body: '' });
      setIsTemplateDialogOpen(false);
      
      toast({
        title: "Template updated",
        description: "Email template has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating template",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('email_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      toast({
        title: "Template deleted",
        description: "Email template has been deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Add this function to send email via backend
  async function sendEmailViaBackend(form) {
    try {
      const res = await axios.post('/api/send-email', form);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || err.message);
    }
  }

  // Replace the simulated sendEmails with real API call
  const sendEmails = async () => {
    if (!selectedTemplate || selectedApplications.length === 0) return;
    try {
      const emailsToSend = applications.filter(app => selectedApplications.includes(app.id));
      for (const app of emailsToSend) {
        await sendEmailViaBackend({
          from: user?.email,
          to: app.email,
          cc: '', // Add CC if needed
          subject: selectedTemplate.subject,
          body: replaceTemplateVariables(selectedTemplate.body, app)
        });
      }
      setSelectedApplications([]);
      setSelectedTemplate(null);
      setIsSendDialogOpen(false);
      toast({ title: "Emails sent", description: `${emailsToSend.length} emails have been sent.` });
      fetchEmailLogs();
    } catch (error) {
      toast({ title: "Error sending emails", description: error.message, variant: "destructive" });
    }
  };

  const replaceTemplateVariables = (text: string, application: any) => {
    return text
      .replace(/\{\{candidate_name\}\}/g, application.name)
      .replace(/\{\{job_title\}\}/g, application.job?.title || '')
      .replace(/\{\{company_name\}\}/g, user?.email?.split('@')[1]?.split('.')[0] || 'Company');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchEmailLogs();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Email Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Manage email templates for automated candidate communication
              </CardDescription>
            </div>
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingTemplate(null);
                  setTemplateForm({ name: '', subject: '', body: '' });
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                  </DialogTitle>
                  <DialogDescription>
                    Create an email template with variables: {'{{candidate_name}}, {{job_title}}, {{company_name}}'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={editingTemplate ? updateTemplate : createTemplate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-subject">Subject</Label>
                    <Input
                      id="template-subject"
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-body">Body</Label>
                    <Textarea
                      id="template-body"
                      rows={8}
                      value={templateForm.body}
                      onChange={(e) => setTemplateForm({...templateForm, body: e.target.value})}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsTemplateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingTemplate ? 'Update Template' : 'Create Template'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.map((template) => (
              <Card key={template.id} className="border border-gray-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <h3 className="text-lg font-semibold">{template.name}</h3>
                      <p className="text-sm text-gray-600">{template.subject}</p>
                      <p className="text-sm text-gray-500 line-clamp-2">{template.body}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setIsSendDialogOpen(true);
                        }}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Send
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setEditingTemplate(template);
                          setTemplateForm({
                            name: template.name,
                            subject: template.subject,
                            body: template.body
                          });
                          setIsTemplateDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {templates.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No email templates</h3>
                <p className="text-gray-500">Create your first email template to start automating candidate communication.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Send Emails Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Emails</DialogTitle>
            <DialogDescription>
              Select candidates to send "{selectedTemplate?.name}" email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Candidates</Label>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {applications.map((application) => (
                  <div key={application.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={application.id}
                      checked={selectedApplications.includes(application.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedApplications([...selectedApplications, application.id]);
                        } else {
                          setSelectedApplications(selectedApplications.filter(id => id !== application.id));
                        }
                      }}
                    />
                    <label htmlFor={application.id} className="text-sm">
                      {application.name} ({application.email}) - {application.job?.title}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedTemplate && selectedApplications.length > 0 && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="font-medium">Subject: {selectedTemplate.subject}</div>
                  <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                    {replaceTemplateVariables(selectedTemplate.body, applications[0])}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsSendDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={sendEmails}
                disabled={selectedApplications.length === 0}
              >
                <Send className="w-4 h-4 mr-2" />
                Send {selectedApplications.length} Email{selectedApplications.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email History
          </CardTitle>
          <CardDescription>
            Track sent emails and their delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {emailLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(log.status)}
                    <span className="font-medium">
                      {(log as any).applications?.name || 'Unknown Candidate'}
                    </span>
                    <Badge variant={getStatusColor(log.status)}>
                      {log.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {(log as any).email_templates?.name} → {log.recipient_email}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            
            {emailLogs.length === 0 && !loading && (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No emails sent yet</h3>
                <p className="text-gray-500">Send your first email to see the history here.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
