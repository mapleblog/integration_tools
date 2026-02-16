"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { bentoItemVariants } from "@/lib/motion-variants";
import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface BentoItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  href: string;
  color?: string; // e.g. "bg-blue-500/10 text-blue-500"
}

export function BentoGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[180px]", className)}>
      {children}
    </div>
  );
}

export function BentoItem({ title, description, icon, className, href, color }: BentoItemProps) {
  return (
    <motion.div
      variants={bentoItemVariants}
      initial="initial"
      animate="animate"
      whileHover="whileHover"
      whileTap="whileTap"
      className={cn("group relative", className)}
    >
      <Link href={href} className="block h-full">
        <Card className="h-full w-full overflow-hidden border bg-card p-6 transition-colors hover:bg-muted/50 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className={cn("rounded-lg p-2.5", color || "bg-primary/10 text-primary")}>
              {icon}
            </div>
            <ArrowRight className="h-5 w-5 -rotate-45 text-muted-foreground opacity-0 transition-all duration-300 group-hover:rotate-0 group-hover:opacity-100" />
          </div>
          
          <div>
            <h3 className="font-semibold tracking-tight text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
