"use client";

import { useCall, useCallStateHooks } from "@stream-io/video-react-sdk";
import React from "react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

const EndCallButton = () => {
  const call = useCall(); // Access the current call instance
  const router = useRouter();

  const { useLocalParticipant } = useCallStateHooks();
  const localParticipant = useLocalParticipant(); // Get the current user's participant info

  // Determine if the local participant is the meeting owner (host)
  const isMeetingOwner =
    localParticipant &&
    call?.state.createdBy &&
    localParticipant.userId === call.state.createdBy.id;

  // If not the host, do not render the button
  if (!isMeetingOwner) return null;

  return (
    <Button
      onClick={async () => {
        // End the call for everyone
        await call.endCall();

        // Emit a custom event so other participants know the call has ended
        await call.sendCustomEvent({
          type: "call.ended",
        });

        // Redirect the host to home page
        router.push("/");
      }}
      className="bg-red-500 rounded"
    >
      End call for everyone
    </Button>
  );
};

export default EndCallButton;
