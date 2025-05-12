import { useUser } from "@clerk/nextjs";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "./use-toast";

// Custom hook to fetch a call by its ID and check its status
export const useGetCallById = (id: string) => {
  const [call, setCall] = useState<Call>(); // Stores the fetched call object
  const [isCallLoading, setIsCallLoading] = useState(true); // Tracks loading state
  const { user } = useUser(); // Current user from Clerk
  const router = useRouter(); // Navigation router
  const { toast } = useToast(); // Toast notification

  const client = useStreamVideoClient(); // Stream video client

  useEffect(() => {
    // Return early if the client hasn't loaded yet
    if (!client) return;

    const loadCall = async () => {
      const call = client.call("default", id); // Get the call instance
      await call.get(); // Fetch latest call data

      // Proceed only if the call and its state exist
      if (call && call.state) {
        // Check if the user is blocked
        if (call.state.blockedUserIds.includes(user?.id || "")) {
          toast({
            title: "Call is blocked",
            description: "You have been blocked from this call.",
            variant: "destructive",
          });
          router.push("/"); // Redirect to home
          return;
        }

        // Check if the call has already ended
        if (call.state.endedAt) {
          toast({
            title: "Call ended",
            description: "This call has already ended.",
            variant: "destructive",
          });
          router.push("/"); // Redirect to home
          return;
        }

        // Check for scheduled call permissions
        if (call.state.custom.is_scheduled) {
          const userEmail = user?.primaryEmailAddress?.emailAddress;
          const isAllowed = call.state.custom.members.includes(userEmail);

          if (isAllowed) {
            setCall(call); // Grant access
          } else {
            toast({
              title: "You are not a member of this call",
              description: "You are not a member of this call.",
              variant: "destructive",
            });
            router.push("/"); // Redirect to home
          }
        } else {
          // If not scheduled, allow access
          setCall(call);
        }
      } else {
        toast({
          title: "Call not found",
          description: "This call does not exist.",
          variant: "destructive",
        });
        router.push("/"); // Redirect to home
      }

      setIsCallLoading(false); // Stop loading
    };

    loadCall(); // Execute fetch on mount or dependency change
  }, [client, id, user, router, toast]);

  return { call, isCallLoading }; // Expose call and loading state
};
