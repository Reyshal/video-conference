import { useUser } from "@clerk/nextjs";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "./use-toast";

export const useGetCallById = (id: string | string[]) => {
  const [call, setCall] = useState<Call>();
  const [isCallLoading, setIsCallLoading] = useState(true);
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const client = useStreamVideoClient();

  useEffect(() => {
    if (!client) return;

    const loadCall = async () => {
      const { calls } = await client.queryCalls({
        filter_conditions: {
          id,
        },
      });

      if (
        calls.length > 0 &&
        (calls[0].state?.custom?.members?.includes(
          user?.primaryEmailAddress?.emailAddress
        ) ||
          calls[0].state.createdBy?.id === user?.id)
      ) {
        setCall(calls[0]);
      } else {
        toast({
          title: "Call not found",
          description: "This call does not exist.",
          variant: "destructive",
        });
        router.push("/");
      }

      setIsCallLoading(false);
    };

    loadCall();
  }, [client, id, user, router]);

  return { call, isCallLoading };
};
