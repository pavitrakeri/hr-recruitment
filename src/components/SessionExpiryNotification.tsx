import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';
import { getSessionTimeRemaining, isSessionExpired } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const SessionExpiryNotification = () => {
  // Disable session expiry notification - return null immediately
  return null;

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showWarning, setShowWarning] = useState(false);
  const { signOut } = useAuth();

  useEffect(() => {
    const updateTimeRemaining = () => {
      const remaining = getSessionTimeRemaining();
      setTimeRemaining(remaining);
      
      // Show warning when less than 10 minutes remaining
      if (remaining < 10 * 60 * 1000 && remaining > 0) {
        setShowWarning(true);
      } else if (remaining <= 0) {
        setShowWarning(false);
        // Session has expired, sign out
        signOut();
      } else {
        setShowWarning(false);
      }
    };

    // Update immediately
    updateTimeRemaining();

    // Update every 30 seconds
    const interval = setInterval(updateTimeRemaining, 30000);

    return () => clearInterval(interval);
  }, [signOut]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!showWarning || timeRemaining <= 0) {
    return null;
  }

  return (
    <Alert className="fixed top-4 right-4 w-80 z-50 bg-yellow-50 border-yellow-200">
      <Clock className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        <div className="flex items-center justify-between">
          <span>
            Your session will expire in {formatTime(timeRemaining)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="ml-2 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
          >
            <LogOut className="h-3 w-3 mr-1" />
            Sign Out
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default SessionExpiryNotification; 