"use client";

import React, { useState } from "react";
import HomeCard from "./HomeCard";
import { useRouter } from "next/navigation";
import MeetingModal from "./MeetingModal";
import { useUser } from "@clerk/nextjs";
import { Call, useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "./ui/textarea";
import ReactDatePicker from "react-datepicker";
import { Input } from "@/components/ui/input";
import { useChatContext } from "stream-chat-react";
import CreatableSelect from "react-select/creatable";

// Type definition for a meeting participant
interface MemberOptionType {
  label: string;
  value: string;
}

// Type definition for meeting form values
interface ValuesType {
  dateTime: Date;
  description: string;
  link: string;
  members: MemberOptionType[];
}

const MeetingTypeList = () => {
  const router = useRouter();

  // Tracks the current meeting state (schedule, join, instant)
  const [meetingState, setMeetingState] = useState<
    "isScheduleMeeting" | "isJoiningMeeting" | "isInstantMeeting" | undefined
  >();

  const { user } = useUser(); // Authenticated user
  const videoClient = useStreamVideoClient(); // Stream video client
  const { client: chatClient } = useChatContext(); // Chat client from Stream

  // Initial form state
  const [values, setValues] = useState<ValuesType>({
    dateTime: new Date(),
    description: "",
    link: "",
    members: [],
  });

  const [callDetails, setCallDetails] = useState<Call>(); // Stores call info
  const { toast } = useToast(); // Notification/toast hook

  // Handles meeting creation (instant or scheduled)
  const createMeeting = async () => {
    if (!videoClient || !user) return;

    try {
      // Show warning if no date/time is selected
      if (!values.dateTime) {
        toast({ title: "Please select a date and time" });
        return;
      }

      const id = crypto.randomUUID(); // Unique ID for meeting
      const call = videoClient.call("default", id); // Create call on Stream
      const channel = chatClient.channel("messaging", id); // Create chat channel

      // Show errors if either fail
      if (!call) toast({ title: "Failed to create meeting" });
      if (!channel) toast({ title: "Failed to create channel" });

      // Create the chat channel and add user
      await channel.create();
      await channel.addMembers([user.id]);

      // Format meeting metadata
      const startAt = values.dateTime.toISOString();
      const description = values.description || "Instant meeting";
      const isScheduled = Boolean(values.description);
      const members = values.members
        .map((member) => member.value)
        .filter((member) => validateEmail(member));

      // Create or fetch the call on Stream
      await call.getOrCreate({
        data: {
          starts_at: startAt,
          custom: { is_scheduled: isScheduled, description, members },
        },
      });

      setCallDetails(call); // Store call details

      // Navigate to meeting page if it's an instant meeting
      if (!values.description) {
        router.push(`/meeting/${id}`);
      }

      toast({ title: "Meeting created" }); // Notify user
    } catch (error) {
      console.log(error);
      toast({ title: "Failed to create meeting" });
    }
  };

  // Handle changes to participants list
  const handleChangeMembers = (value: ReadonlyArray<MemberOptionType>) => {
    const members = value as MemberOptionType[];
    setValues({ ...values, members });
  };

  // Simple email validation function
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Generate meeting link using call ID
  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetails?.id}`;

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl-grid-cols-4">
      {/* Buttons for different meeting types */}
      <HomeCard
        img="/icons/add-meeting.svg"
        title="New Meeting"
        description="Start an instant meeting"
        handleClick={() => setMeetingState("isInstantMeeting")}
        className="bg-orange-1"
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Meeting"
        description="Plan your meeting"
        handleClick={() => setMeetingState("isScheduleMeeting")}
        className="bg-blue-1"
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="View Recordings"
        description="Check out your recordings"
        handleClick={() => router.push("/recordings")}
        className="bg-purple-1"
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="Via invitation link"
        handleClick={() => setMeetingState("isJoiningMeeting")}
        className="bg-yellow-1"
      />

      {/* Schedule Meeting Modal */}
      {!callDetails ? (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => setMeetingState(undefined)}
          title="Create Meeting"
          handleClick={createMeeting}
        >
          {/* Description input */}
          <div className="flex flex-col gap-2.5">
            <label className="text-base text-normal leading-[22px] text-sky-2">
              Add a description
            </label>
            <Textarea
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
              placeholder="Daily Meeting..."
            />
          </div>

          {/* Date/time input */}
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-base text-normal leading-[22px] text-sky-2">
              Select Date and Time
            </label>
            <ReactDatePicker
              selected={values.dateTime}
              onChange={(date) => setValues({ ...values, dateTime: date! })}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded bg-dark-3 p-2 focus:outline-none"
            />
          </div>

          {/* Participants input */}
          <div className="flex w-full flex-col">
            <label className="text-base text-normal leading-[22px] text-sky-2">
              Participants
            </label>
            <p className="text-sm text-slate-400 mb-2.5">
              If empty then everyone can join & only valid emails will be added
            </p>
            <CreatableSelect
              isMulti
              placeholder="reyke.svb@gmail.com"
              value={values.members}
              onChange={(value) =>
                handleChangeMembers(value as ReadonlyArray<MemberOptionType>)
              }
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: "#252A41",
                  color: "#ffffff",
                  border: "none",
                }),
                input: (base) => ({
                  ...base,
                  color: "#ffffff",
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: "#252A41",
                  color: "#ffffff",
                }),
                option: (base) => ({
                  ...base,
                  backgroundColor: "#252A41",
                  color: "#ffffff",
                }),
                multiValue: (base) => ({
                  ...base,
                  backgroundColor: "#252A41",
                  color: "#ffffff",
                  border: "1px solid #ffffff",
                  marginRight: "4px",
                }),
                multiValueLabel: (base) => ({
                  ...base,
                  backgroundColor: "#252A41",
                  color: "#ffffff",
                }),
                multiValueRemove: (base) => ({
                  ...base,
                  backgroundColor: "#252A41",
                  color: "#ffffff",
                }),
              }}
            />
          </div>
        </MeetingModal>
      ) : (
        // Modal shown after meeting is created
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => setMeetingState(undefined)}
          title="Meeting Created"
          className="text-center"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({ title: "Link copied" });
          }}
          image="/icons/checked.svg"
          buttonIcon="/icons/copy.svg"
          buttonText="Copy Meeting Link"
        />
      )}

      {/* Instant meeting modal */}
      <MeetingModal
        isOpen={meetingState === "isInstantMeeting"}
        onClose={() => setMeetingState(undefined)}
        title="Start an Instant Meeting"
        className="text-center"
        buttonText="Start Meeting"
        handleClick={createMeeting}
      />

      {/* Join meeting modal */}
      <MeetingModal
        isOpen={meetingState === "isJoiningMeeting"}
        onClose={() => setMeetingState(undefined)}
        title="Type the link here"
        className="text-center"
        buttonText="Join Meeting"
        handleClick={() => router.push(values.link)}
      >
        <Input
          placeholder="Meeting link"
          className="border-none bg-dark-3 focus-visible::ring-0 focus-visible:ring-offset-0"
          onChange={(e) => setValues({ ...values, link: e.target.value })}
        />
      </MeetingModal>
    </section>
  );
};

export default MeetingTypeList;
