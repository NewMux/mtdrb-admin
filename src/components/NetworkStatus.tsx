import React, { useState, useEffect, useRef } from "react";
import { FiWifi, FiWifiOff } from "react-icons/fi";
import { supabase } from "../supabaseClient";
import { checkSupabaseHealth } from "../supabaseClient";
import toast from "react-hot-toast";

const NetworkStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const subscriptionRef = useRef<any>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      checkBackendHealth();
      toast.success("Connection restored");
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsBackendHealthy(false);
      setShowOfflineBanner(true);
      toast.error("Connection lost");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Check backend health periodically
  useEffect(() => {
    const checkBackendHealth = async () => {
      if (!isOnline) return;

      try {
        const isHealthy = await checkSupabaseHealth();
        setIsBackendHealthy(isHealthy);
        setShowOfflineBanner(!isHealthy);

        if (!isHealthy) {
          toast.error("Backend service is unavailable");
        }
      } catch (error) {
        console.error("Health check failed:", error);
        setIsBackendHealthy(false);
        setShowOfflineBanner(true);
      }
    };

    // Initial check
    checkBackendHealth();

    // Check every 30 seconds
    const interval = setInterval(checkBackendHealth, 30000);

    return () => clearInterval(interval);
  }, [isOnline]);

  // Simplified real-time subscription status monitoring
  useEffect(() => {
    if (!isOnline || !isBackendHealthy) return;

    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    // Create new subscription with unique channel name
    try {
      const channelName = `network_status_${Date.now()}`;
      subscriptionRef.current = supabase
        .channel(channelName)
        .on("presence", { event: "sync" }, () => {
          setIsBackendHealthy(true);
          setShowOfflineBanner(false);
        })
        .on("presence", { event: "join" }, () => {
          setIsBackendHealthy(true);
          setShowOfflineBanner(false);
        })
        .on("presence", { event: "leave" }, () => {
          setIsBackendHealthy(false);
          setShowOfflineBanner(true);
        })
        .subscribe((status) => {
          console.log("NetworkStatus subscription status:", status);
          if (status === "CHANNEL_ERROR") {
            console.error("NetworkStatus subscription error - retrying...");
            // Retry after a delay
            setTimeout(() => {
              if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
              }
            }, 5000);
          }
        });
    } catch (error) {
      console.error("Failed to create subscription:", error);
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [isOnline, isBackendHealthy]);

  if (!showOfflineBanner) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 p-4 ${
        isOnline && isBackendHealthy ? "bg-green-500" : "bg-red-500"
      } text-white z-50 flex items-center justify-between`}
    >
      <div className="flex items-center space-x-2">
        {isOnline && isBackendHealthy ? (
          <FiWifi className="h-5 w-5" />
        ) : (
          <FiWifiOff className="h-5 w-5" />
        )}
        <span>
          {isOnline
            ? isBackendHealthy
              ? "Connected to backend services"
              : "Backend services unavailable"
            : "You are offline"}
        </span>
      </div>
      <button
        onClick={() => setShowOfflineBanner(false)}
        className="text-white hover:text-gray-200 focus:outline-none"
      >
        Dismiss
      </button>
    </div>
  );
};

export default NetworkStatus;
