import { useUser } from "@clerk/nextjs";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useEffect, useState } from "react";

export const useGetLatestCall = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const client = useStreamVideoClient();
  const { user } = useUser();

  useEffect(() => {
    const loadCalls = async () => {
      if (!client || !user?.id) return;

      setIsLoading(true);

      try {
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

        setCalls(calls);
      } catch (error) {
        console.log(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCalls();
  }, [client, user?.id, user?.primaryEmailAddress?.emailAddress]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const todayCalls = calls.filter(({ state: { startsAt } }: Call) => {
    return (
      startsAt &&
      new Date(startsAt) > now &&
      new Date(startsAt) < new Date(now.getTime() + 24 * 60 * 60 * 1000)
    );
  });

  return {
    todayCalls,
    isLoading,
  };
};
