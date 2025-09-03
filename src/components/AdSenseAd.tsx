import { useEffect, useRef, useState } from 'react';

// Declare AdSense global
declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

interface AdSenseAdProps {
  adSlot?: string;
  style?: React.CSSProperties;
  onAdComplete?: () => void;
  viewDuration?: number; // seconds to consider as 'viewed'
}

/**
 * Enhanced AdSense component for real ad display.
 * - Dynamically loads the AdSense script using Vite env var VITE_ADSENSE_CLIENT.
 * - Renders an <ins class="adsbygoogle"> element and pushes an ad.
 * - Uses multiple detection methods for ad completion.
 *
 * Notes:
 * - This component now properly handles real AdSense ads.
 * - Ad completion is detected through iframe insertion and visibility.
 * - To enable: set VITE_ADSENSE_CLIENT and VITE_ADSENSE_AD_SLOT in your environment.
 */
export function AdSenseAd({ adSlot = '', onAdComplete, viewDuration = 8, style }: AdSenseAdProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
    const disabled = import.meta.env.VITE_ADSENSE_DISABLED === 'true';
    const forceSimulated = import.meta.env.VITE_ADSENSE_FORCE_SIMULATED === 'true';

    if (disabled || forceSimulated) {
      setError(forceSimulated ? 'Using simulated ads (forced via environment)' : 'AdSense disabled via environment variable');
      return;
    }

    if (!client) {
      setError('AdSense client not configured');
      return;
    }

    // Test network connectivity first
    const testConnectivity = async () => {
      try {
        console.log('Testing AdSense server connectivity...');
        const response = await fetch('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=test', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache'
        });
        console.log('AdSense server reachable');
      } catch (e) {
        console.warn('AdSense server connectivity test failed:', e);
        // Don't set error here, just log it
      }
    };

    testConnectivity();

    // Check if AdSense is already loaded
    if (typeof window !== 'undefined' && window.adsbygoogle) {
      console.log('AdSense already loaded globally');
      setLoaded(true);
      return;
    }

    // Load script if not present
    const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    let script = document.querySelector(`script[src*="${src}"]`) as HTMLScriptElement | null;

    if (!script) {
      console.log('Creating AdSense script element');
      script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = src;
      script.onload = () => {
        console.log('✅ AdSense script loaded successfully');
        setLoaded(true);
      };
      script.onerror = (e) => {
        console.error('❌ Failed to load AdSense script:', e);
        // Don't immediately set error - try again in a few seconds
        setTimeout(() => {
          if (!loaded) {
            setError('Failed to load AdSense script. Retrying...');
            // Try to reload the script
            const retryScript = document.createElement('script');
            retryScript.async = true;
            retryScript.crossOrigin = 'anonymous';
            retryScript.src = src + '&retry=' + Date.now(); // Add cache buster
            retryScript.onload = () => {
              console.log('✅ AdSense script loaded on retry');
              setLoaded(true);
              setError(null);
            };
            retryScript.onerror = () => {
              setError('Failed to load AdSense script after retry. Check network or ad blocker.');
            };
            document.head.appendChild(retryScript);
          }
        }, 3000);
      };

      // Add error handling for blocked scripts
      script.onabort = () => {
        console.warn('⚠️ AdSense script loading aborted (possibly blocked)');
        setError('AdSense script blocked - disable ad blocker or set VITE_ADSENSE_DISABLED=true');
      };

      try {
        document.head.appendChild(script);
        console.log('AdSense script appended to head');
      } catch (e) {
        console.error('Failed to append AdSense script to head:', e);
        setError('Failed to load AdSense script - DOM error');
      }
    } else {
      console.log('AdSense script element already exists');
      // Check if it's already loaded
      if (window.adsbygoogle) {
        console.log('AdSense already available');
        setLoaded(true);
      } else {
        // Wait for it to load with a longer timeout
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.adsbygoogle) {
            console.log('AdSense loaded after waiting');
            setLoaded(true);
            clearInterval(checkInterval);
          } else if (attempts > 100) { // 10 seconds
            console.warn('AdSense still not loaded after waiting');
            clearInterval(checkInterval);
            // Try to reload
            script.remove();
            setTimeout(() => {
              const newScript = document.createElement('script');
              newScript.async = true;
              newScript.crossOrigin = 'anonymous';
              newScript.src = src + '&reload=' + Date.now();
              newScript.onload = () => {
                console.log('AdSense reloaded successfully');
                setLoaded(true);
              };
              newScript.onerror = () => {
                setError('Failed to reload AdSense script');
              };
              document.head.appendChild(newScript);
            }, 1000);
          }
        }, 100);
      }
    }

    // Fallback timeout in case script never loads (increased to 45 seconds for slow networks)
    const timeout = setTimeout(() => {
      if (!loaded) {
        console.warn('AdSense script loading timeout after 45 seconds - this may indicate network issues');
        // Don't set error immediately, just log and keep trying
        setError('AdSense taking longer than expected to load. Please wait or check your connection.');
      }
    }, 45000);

    return () => clearTimeout(timeout);
  }, [loaded]);

  useEffect(() => {
    if (!loaded || !containerRef.current) return;

    const client = import.meta.env.VITE_ADSENSE_CLIENT as string;
    const slot = adSlot || (import.meta.env.VITE_ADSENSE_AD_SLOT as string) || '';

    // Clear any existing content
    containerRef.current.innerHTML = '';

    // Create ins element with proper AdSense attributes
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.style.width = '100%';
    ins.style.minHeight = '250px';
    ins.setAttribute('data-ad-client', client);
    if (slot) {
      ins.setAttribute('data-ad-slot', slot);
    }
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');

    containerRef.current.appendChild(ins);

    // Push the ad
    try {
      // Ensure adsbygoogle is available
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        console.log('Pushing AdSense ad');
        window.adsbygoogle.push({});
        setAdLoaded(true);
      } else {
        console.error('AdSense not available');
        setError('AdSense not available');
      }
    } catch (e) {
      console.error('Error pushing AdSense ad:', e);
      setError('Error loading ad');
    }

    // Watch for iframe insertion (ad rendered)
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of Array.from(m.addedNodes)) {
          if ((node as HTMLElement).tagName?.toLowerCase() === 'iframe') {
            console.log('Ad iframe detected, starting view timer');
            // Start view timer
            setTimeout(() => {
              console.log('Ad view completed, calling onAdComplete');
              onAdComplete?.();
            }, viewDuration * 1000);
            obs.disconnect();
            return;
          }
        }
      }
    });

    obs.observe(ins, { childList: true, subtree: true });

    // Fallback: if no iframe appears in 10s, still call complete after viewDuration
    const fallback = setTimeout(() => {
      console.log('Ad fallback timer triggered');
      onAdComplete?.();
      obs.disconnect();
    }, 10000 + viewDuration * 1000);

    return () => {
      obs.disconnect();
      clearTimeout(fallback);
    };
  }, [loaded, adSlot, onAdComplete, viewDuration]);

  // If no client configured, render informative placeholder
  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;

  if (!client) {
    return (
      <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded-md p-4 text-center" style={style}>
        <div>
          <div className="text-sm font-medium text-gray-700">AdSense not configured</div>
          <div className="text-xs text-gray-500">Set VITE_ADSENSE_CLIENT in your environment to enable real ads.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-40 flex items-center justify-center bg-red-50 rounded-md p-4 text-center" style={style}>
        <div>
          <div className="text-sm font-medium text-red-700">Loading Real Ad...</div>
          <div className="text-xs text-red-500 mb-3">{error}</div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                setError(null);
                setLoaded(false);
                // Force reload the component
                window.location.reload();
              }}
              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={style} className="w-full min-h-[250px] bg-gray-50 rounded-md flex items-center justify-center">
      {!adLoaded && (
        <div className="text-sm text-gray-500">Loading ad...</div>
      )}
    </div>
  );
}
