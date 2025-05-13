// Import necessary hooks and types
import { useUser } from "@clerk/nextjs";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";

// Custom hook to fetch and categorize Stream calls for the current user
export const useGetCalls = () => {
  // State for storing all fetched calls and loading state
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Get the Stream client and current authenticated user
  const client = useStreamVideoClient();
  const { user } = useUser();

  // Fetch calls whenever the client or user changes
  useEffect(() => {
    const loadCalls = async () => {
      if (!client || !user?.id) return;

      setIsLoading(true); // Start loading

      try {
        // Query calls: sort by "starts_at" descending and filter by ownership or membership
        const { calls } = await client.queryCalls({
          sort: [
            {
              field: "starts_at",
              direction: -1,
            },
          ],
          filter_conditions: {
            starts_at: { $exists: true },
            $or: [
              { created_by_user_id: user.id },
              {
                "custom.members": {
                  $in: [user.primaryEmailAddress?.emailAddress],
                },
              },
            ],
          },
        });

        // Update state with fetched calls
        setCalls(calls);
      } catch (error) {
        // Log any errors during fetching
        console.log(error);
      } finally {
        // Stop loading after fetch attempt
        setIsLoading(false);
      }
    };

    loadCalls();
  }, [client, user?.id, user?.primaryEmailAddress?.emailAddress]);

  // Get current time to compare with call schedules
  const now = new Date();

  // Separate ended or past-start-time calls
  const endedCalls = calls.filter(({ state: { startsAt, endedAt } }: Call) => {
    return (startsAt && new Date(startsAt) < now) || !!endedAt;
  });

  // Separate upcoming calls (future start time and not ended)
  const upcomingCalls = calls.filter(
    ({ state: { startsAt, endedAt } }: Call) => {
      return startsAt && new Date(startsAt) > now && !endedAt;
    }
  );

  // Return categorized calls and loading state
  return {
    endedCalls,
    upcomingCalls,
    callRecordings: calls, // returning all calls under a different alias
    isLoading,
  };
};
