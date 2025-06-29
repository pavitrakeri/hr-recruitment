import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Mic, Play, Pause, Square, Loader2, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { useCandidate } from '@/hooks/useCandidate';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const questions = [
    { id: 1, text: "Why are you interested in working for our company?" },
    { id: 2, text: "Why is this particular role important to you?" },
    { id: 3, text: "Describe a significant decision you've made recently." },
    { id: 4, text: "Describe a project you've recently taken responsibility for." },
    { id: 5, text: "How do you know when you've done something well?" },
    { id: 6, text: "Tell me about a work experience you really enjoyed" },
];

const AudioQAModal = ({ isOpen, onClose }) => {
    const { profile, updateProfile, fetchProfile } = useCandidate();
    const { toast } = useToast();
    const [step, setStep] = useState(0); // 0: Intro, 1-3: Questions, 4: Outro
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [audioAnswers, setAudioAnswers] = useState(profile?.audio_qas || []);

    const mediaRecorderRef = useRef(null);
    const audioRef = useRef(null);

    const startRecording = async () => {
        setAudioBlob(null);
        setAudioUrl('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorderRef.current.ondataavailable = event => chunks.push(event.data);
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
            };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            toast({ title: "Microphone access denied", description: "Please allow microphone access to record.", variant: "destructive" });
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
    };

    const handleNext = async () => {
        if (step > 0 && step <= questions.length) {
            if (!audioBlob) {
                toast({ title: "No audio recorded", description: "Please record an answer before proceeding.", variant: "destructive" });
                return;
            }
            setIsUploading(true);
            const question = questions[step - 1];
            const fileName = `${profile.id}-q${question.id}-${Date.now()}.webm`;
            const filePath = `audio-answers/${fileName}`;

            const { error } = await supabase.storage.from('candidate').upload(filePath, audioBlob);
            if (error) {
                toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
                setIsUploading(false);
                return;
            }
            const { data: { publicUrl } } = supabase.storage.from('candidate').getPublicUrl(filePath);
            
            const newAnswer = { question: question.text, answer_url: publicUrl };
            const updatedAnswers = [...audioAnswers.filter(a => a.question !== question.text), newAnswer];
            setAudioAnswers(updatedAnswers);
        }

        if (step === questions.length) {
            // Final submission: ensure all 6 answers are present
            const answersToSave = questions.map(q => audioAnswers.find(a => a.question === q.text) || { question: q.text, answer_url: "" });
            const { success, error } = await updateProfile({ audio_qas: answersToSave });
             if (success) {
                toast({ title: "Audio answers saved successfully!" });
                fetchProfile();
             } else {
                toast({ title: "Failed to save answers", description: error, variant: "destructive" });
             }
        }
        
        setIsUploading(false);
        setAudioBlob(null);
        setAudioUrl('');
        setStep(s => s + 1);
    };

    const renderStep = () => {
        const currentQuestion = questions[step - 1];

        if (step === 0) {
            return (
                <div>
                    <DialogTitle className="text-2xl font-bold">Audio Q&As</DialogTitle>
                    <DialogDescription className="mt-2">Answer short questions to stand out to employers. This is your chance to add a personal touch to your application.</DialogDescription>
                    <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
                        <li>Test your microphone before you start.</li>
                        <li>You'll have 3 questions to answer.</li>
                        <li>You can re-record your answer if you're not happy.</li>
                    </ul>
                </div>
            );
        }

        if (step > 0 && step <= questions.length) {
            return (
                <div>
                    <DialogTitle>Question {step}/{questions.length}</DialogTitle>
                    <p className="mt-2 text-lg font-semibold">{currentQuestion.text}</p>
                    <div className="my-8 flex flex-col items-center justify-center gap-4">
                        {isRecording ? (
                            <Button onClick={stopRecording} variant="destructive" size="lg" className="rounded-full w-24 h-24">
                                <Square className="w-10 h-10" />
                            </Button>
                        ) : (
                            <Button onClick={startRecording} size="lg" className="rounded-full w-24 h-24">
                                <Mic className="w-10 h-10" />
                            </Button>
                        )}
                        {audioUrl && (
                            <div className="w-full mt-4">
                                <p className="text-sm font-medium mb-2">Your recording:</p>
                                <audio ref={audioRef} src={audioUrl} controls className="w-full" />
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <DialogTitle className="text-2xl font-bold">All Done!</DialogTitle>
                <DialogDescription>Your audio answers have been saved to your profile.</DialogDescription>
            </div>
        )
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader className="mb-4">
                    <Progress value={(step / (questions.length + 1)) * 100} className="w-full" />
                </DialogHeader>
                
                {renderStep()}

                <DialogFooter className="mt-8">
                    {step > 0 && (
                        <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={isUploading}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                    )}
                    <div className="flex-grow"></div>
                    {step < questions.length + 1 && (
                        <Button onClick={handleNext} disabled={isUploading || (step > 0 && !audioBlob)}>
                            {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {step === 0 && 'Get Started'}
                            {step > 0 && step <= questions.length && 'Next'}
                            {step > questions.length && 'Finish'}
                             <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                     {step === questions.length + 1 && (
                        <Button onClick={onClose}>Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AudioQAModal; 