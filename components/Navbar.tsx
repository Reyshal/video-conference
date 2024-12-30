"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";
import MobileNav from "./MobileNav";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { motion } from "motion/react";

const Navbar = () => {
  return (
    <nav className="flex-between fixed z-50 w-full bg-dark-1 px-6 py-4 lg:px-10">
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9, rotate: "2deg" }}
      >
        <Link href="/" className="flex items-center gap-1 transition-colors">
          <Image
            src="/icons/logo.svg"
            width={32}
            height={32}
            alt="YOOK Logo"
            className="max-sm:size-10"
          />
          <p className="text-[26px] font-extrabold max-sm:hidden text-white ">
            YOOK
          </p>
        </Link>
      </motion.div>

      <div className="flex-between gap-5">
        {/* @ts-expect-error Server Component */}
        <SignedIn>
          <UserButton />
        </SignedIn>

        <MobileNav />
      </div>
    </nav>
  );
};

export default Navbar;
