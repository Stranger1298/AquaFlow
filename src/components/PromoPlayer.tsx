import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { AdSenseAd } from './AdSenseAd';

interface AdPlayerProps {
  onClose: () => void;
}

// Note: filename avoids 'Ad' substring to reduce ad-blocker false-positives.
export function AdPlayer({ onClose }: AdPlayerProps) {
  const [adProgress, setAdProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);
  const [useAdsense, setUseAdsense] = useState<boolean>(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const adIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();

  const adDuration = 10; // 10 seconds ad (simulated)

  // Detect if AdSense is configured and not disabled
  useEffect(() => {
    const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
    const disabled = import.meta.env.VITE_ADSENSE_DISABLED === 'true';
    const forceSim = import.meta.env.VITE_ADSENSE_FORCE_SIMULATED === 'true';
    setUseAdsense(!!client && !disabled && !forceSim);
  }, []);

  // Setup simulated ad progress tracking (only for fallback)
  useEffect(() => {
    if (isPlaying) {
      adIntervalRef.current = window.setInterval(() => {
        setAdProgress(prev => {
          const newProgress = prev + (100 / (adDuration * 10));
          if (newProgress >= 100) {
            clearInterval(adIntervalRef.current!);
            setAdCompleted(true);
            setIsPlaying(false);
            toast({
              title: "Ad completed",
              description: "Thanks for watching! Your delivery fee will be waived.",
            });
            // Notify parent to close dialog and perform waiver at a higher level
            onClose();
            return 100;
          }
          return newProgress;
        });
      }, 100);
    } else if (adIntervalRef.current) {
      clearInterval(adIntervalRef.current);
    }

    return () => {
      if (adIntervalRef.current) {
        clearInterval(adIntervalRef.current);
      }
    };
  }, [isPlaying, toast, onClose]);

  // Check if user navigates away
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isPlaying) {
        setIsPlaying(false);
        toast({
          title: "Ad paused",
          description: "You need to keep the ad visible to waive the delivery fee.",
          variant: "destructive",
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, toast]);

  const handlePlayAd = () => {
    setIsPlaying(true);
    setUserInteracted(true);
  };

  const handleSkipAd = () => {
    if (adIntervalRef.current) {
      clearInterval(adIntervalRef.current);
    }
    toast({
      title: "Ad skipped",
      description: "You will be charged the delivery fee.",
    });
    onClose();
  };

  // Called when AdSense reports completion (heuristic)
  const handleAdsenseComplete = () => {
    setAdCompleted(true);
    toast({
      title: 'Ad completed',
      description: 'Thanks for watching! Your delivery fee will be waived.',
    });
    onClose();
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-2xl font-semibold text-center text-gray-800">
        {adCompleted ? "Thank You!" : "Watch Ad to Waive Delivery Fee"}
      </h3>

      {adCompleted ? (
        <div className="w-full text-center space-y-4">
          <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-600"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <p className="text-gray-600">Your delivery fee has been waived!</p>
          <Button onClick={onClose}>Continue</Button>
        </div>
      ) : (
        <>
          <div className="w-full max-w-md h-64 bg-gray-200 rounded-lg relative flex items-center justify-center overflow-hidden">
            {useAdsense ? (
              <AdSenseAd adSlot={import.meta.env.VITE_ADSENSE_AD_SLOT as string} onAdComplete={handleAdsenseComplete} viewDuration={8} />
            ) : (
              <div className="flex flex-col items-center justify-center">
                {!userInteracted ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-500 mb-4"
                    >
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <span className="text-gray-600">Click to play ad</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-500 mb-4"
                    >
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                    <span className="text-gray-600">Ad paused</span>
                  </>
                )}
              </div>
            )}
          </div>

          {!useAdsense && (
            <div className="w-full max-w-md space-y-3">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Ad progress:</span>
                <span>{Math.round(adProgress)}%</span>
              </div>
              <Progress value={adProgress} />
              <p className="text-xs text-gray-500 text-center">
                Watch the full ad ({adDuration} seconds) to waive your delivery fee
              </p>
            </div>
          )}

          <div className="flex space-x-4">
            {!useAdsense && (isPlaying ? (
              <Button variant="outline" onClick={() => setIsPlaying(false)}>
                Pause
              </Button>
            ) : (
              <Button onClick={handlePlayAd}>
                {userInteracted ? "Resume" : "Play Ad"}
              </Button>
            ))}
            <Button variant="outline" onClick={handleSkipAd}>
              Skip (Keep Delivery Fee)
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
