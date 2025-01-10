import { StreamVideoProvider } from "@/providers/StreamVideoProvider";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "YOOK",
  description: "Video calling app for teams",
  icons: {
    icon: "/icons/logo.svg",
  },
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main>
      <StreamVideoProvider>{children}</StreamVideoProvider>
    </main>
  );
};

export default RootLayout;
