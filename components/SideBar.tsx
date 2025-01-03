"use client";

import React from "react";

import { sidebarLinks } from "@/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion } from "motion/react";

const SideBar = () => {
  const pathname = usePathname();

  return (
    <section className="sticky left-0 top-0 flex h-screen w-fit flex-col justify-between bg-dark-1 p-6 pt-28 text-white max-sm:hidden lg:w-[264px]">
      <div className="flex flex-1 flex-col gap-6">
        {sidebarLinks.map((link) => {
          const isActive =
            pathname === link.route || pathname.startsWith(`${link.route}/`);

          return (
            <motion.div
              key={link.label}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9, rotate: "2deg" }}
            >
              <Link
                href={link.route}
                className={cn(
                  "flex gap-4 items-center p-4 rounded justify-start",
                  { "bg-blue-1": isActive }
                )}
              >
                <Image
                  src={link.imgUrl}
                  alt={link.label}
                  width={24}
                  height={24}
                />
                <p className="text-lg font-semibold max-lg:hidden">
                  {link.label}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default SideBar;
