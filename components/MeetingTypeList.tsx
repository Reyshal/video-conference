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

interface MemberOptionType {
  label: string;
  value: string;
}

interface ValuesType {
  dateTime: Date;
  description: string;
  link: string;
  members: MemberOptionType[];
}

const MeetingTypeList = () => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<
    "isScheduleMeeting" | "isJoiningMeeting" | "isInstantMeeting" | undefined
  >();
  const { user } = useUser();
  const videoClient = useStreamVideoClient();
  const { client: chatClient } = useChatContext();
  const [values, setValues] = useState<ValuesType>({
    dateTime: new Date(),
    description: "",
    link: "",
    members: [],
  });
  const [callDetails, setCallDetails] = useState<Call>();
  const { toast } = useToast();

  const createMeeting = async () => {
    if (!videoClient || !user) return;

    try {
      if (!values.dateTime) {
        toast({
          title: "Please select a date and time",
        });
        return;
      }

      const id = crypto.randomUUID();
      const call = videoClient.call("default", id);
      const channel = chatClient.channel("messaging", id);

      if (!call) {
        toast({
          title: "Failed to create meeting",
        });
      }
      if (!channel) {
        toast({
          title: "Failed to create channel",
        });
      }

      await channel.create();
      await channel.addMembers([user?.id]);

      const startAt =
        values.dateTime.toISOString() || new Date(Date.now()).toISOString();
      const description = values.description || "Instant meeting";
      const members =
        values.members
          .map((member) => member.value)
          .filter((member) => validateEmail(member)) || [];

      await call.getOrCreate({
        data: {
          starts_at: startAt,
          custom: {
            description,
            members,
          },
        },
      });

      setCallDetails(call);

      if (!values.description) {
        router.push(`/meeting/${id}`);
      }

      toast({
        title: "Meeting created",
      });
    } catch (error) {
      console.log(error);
      toast({
        title: "Failed to create meeting",
      });
    }
  };

  const handleChangeMembers = (value: ReadonlyArray<MemberOptionType>) => {
    const members = value as MemberOptionType[];
    setValues({
      ...values,
      members,
    });
  };

  const validateEmail = (email: string) => {
    // Simple regex for email validation
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetails?.id}`;

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl-grid-cols-4">
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

      {!callDetails ? (
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => setMeetingState(undefined)}
          title="Create Meeting"
          handleClick={createMeeting}
        >
          <div className="flex flex-col gap-2.5">
            <label className="text-base text-normal leading-[22px] text-sky-2">
              Add a description
            </label>
            <Textarea
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              onChange={(e) => {
                setValues({ ...values, description: e.target.value });
              }}
              placeholder="Daily Meeting..."
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-base text-normal leading-[22px] text-sky-2">
              Select Date and Time
            </label>
            <ReactDatePicker
              selected={values.dateTime}
              onChange={(date) => {
                setValues({ ...values, dateTime: date! });
              }}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded bg-dark-3 p-2 focus:outline-none"
            />
          </div>
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
              onChange={(value) => {
                handleChangeMembers(value as ReadonlyArray<MemberOptionType>);
              }}
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
        <MeetingModal
          isOpen={meetingState === "isScheduleMeeting"}
          onClose={() => setMeetingState(undefined)}
          title="Meeting Created"
          className="text-center"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({
              title: "Link copied",
            });
          }}
          image="/icons/checked.svg"
          buttonIcon="/icons/copy.svg"
          buttonText="Copy Meeting Link"
        />
      )}
      <MeetingModal
        isOpen={meetingState === "isInstantMeeting"}
        onClose={() => setMeetingState(undefined)}
        title="Start an Instant Meeting"
        className="text-center"
        buttonText="Start Meeting"
        handleClick={createMeeting}
      />
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
