"use client";
import { Scale } from "lucide-react";

const Loader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm z-[9999]">
      <div className="relative flex flex-col items-center justify-center gap-4">
        <div className="animate-pulse">
          <Scale className="h-16 w-16 text-green-600 dark:text-green-400" />
        </div>
        <p className="text-sm font-medium text-green-600/80 dark:text-green-400/80 animate-pulse">
          संसाधित हो रहा है...
        </p>
      </div>
    </div>
  );
};

export default Loader;
