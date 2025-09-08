"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import MeetingSetup from "@/components/MeetingSetup";
import MeetingRoom from "@/components/MeetingRoom";
import { useGetCallById } from "@/hooks/use-get-call-by-id";
import Loader from "@/components/Loader";
import { Channel, useChatContext } from "stream-chat-react";
import { useParams } from "next/navigation";

export default function Meeting() {
	const { isLoaded } = useUser();
	const [isSetupComplete, setIsSetupComplete] = useState(false);
	const params = useParams<{ id: string }>();
	const id = params?.id as string;
	const { call, isCallLoading } = useGetCallById(id);
	const { client: chatClient } = useChatContext();

	if (!isLoaded || isCallLoading) return <Loader />;

	return (
		<main className="h-screen w-full">
			<Channel channel={chatClient.channel("messaging", id)}>
				<StreamCall call={call}>
					<StreamTheme>
						{!isSetupComplete ? (
							<MeetingSetup setIsSetupComplete={setIsSetupComplete} />
						) : (
							<MeetingRoom />
						)}
					</StreamTheme>
				</StreamCall>
			</Channel>
		</main>
	);
}
