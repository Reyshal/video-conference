import { useUser } from "@clerk/nextjs";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";

// Define a custom hook to fetch the latest upcoming call
export const useGetLatestCall = () => {
  // Initialize state for storing the latest call and loading status, and set up client and user
  const [call, setCalls] = useState<Call>();
  const [isLoading, setIsLoading] = useState(false);
  const client = useStreamVideoClient();
  const { user } = useUser();

  // Use useEffect to fetch calls when dependencies change
  useEffect(() => {
    // Async function to load calls, checking for client and user existence
    const loadCalls = async () => {
      if (!client || !user?.id) return;
      setIsLoading(true);

      try {
        // Query calls with sorting by start time (descending) and filters for user-created or user-included calls
        const { calls: newCalls } = await client.queryCalls({
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

        // Process the most recent call if available, checking if it starts within the next 24 hours
        if (newCalls.length > 0) {
          const newCall = newCalls[0];
          const { startsAt, endedAt } = newCall.state;

          if (startsAt) {
            const now = new Date();
            if (
              new Date(startsAt) > now &&
              new Date(startsAt) <
                new Date(now.getTime() + 24 * 60 * 60 * 1000) &&
              !endedAt
            ) {
              setCalls(newCall);
            }
          }
        }
      } catch (error) {
        // Handle errors by logging them
        console.log(error);
      } finally {
        // Reset loading state after the operation completes
        setIsLoading(false);
      }
    };

    // Execute the loadCalls function
    loadCalls();
  }, [client, user?.id, user?.primaryEmailAddress?.emailAddress]);

  // Return the call and loading state for use in components
  return {
    call,
    isLoading,
  };
};
