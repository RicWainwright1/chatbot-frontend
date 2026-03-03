"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

function getFirstName(session: any): string | null {
  const name = session?.user?.name;
  if (!name) return null;
  return name.split(" ")[0];
}

function getGreeting(firstName: string | null): string {
  const hour = new Date().getHours();
  const name = firstName ?? "there";

  const greetings: string[] = [];

  if (hour < 12) {
    greetings.push(`Good morning ${name}!`);
  } else if (hour < 17) {
    greetings.push(`Good afternoon ${name}!`);
  } else {
    greetings.push(`Good evening ${name}!`);
  }

  if (firstName) {
    greetings.push(
      `Hello ${name}!`,
      `Welcome back ${name}!`,
      `What are we looking at today ${name}?`,
    );
  } else {
    greetings.push("Hello there!");
  }

  return greetings[Math.floor(Math.random() * greetings.length)];
}

export const Greeting = () => {
  const { data: session } = useSession();
  const firstName = getFirstName(session);
  const greeting = useMemo(() => getGreeting(firstName), [firstName]);

  return (
    <div
      className="mx-auto mt-4 flex size-full max-w-3xl flex-col justify-center px-4 md:mt-16 md:px-8"
      key="overview"
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="font-semibold text-xl md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
      >
        {greeting}
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="text-xl text-zinc-500 md:text-2xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
      >
        How can I help you today?
      </motion.div>
    </div>
  );
};
