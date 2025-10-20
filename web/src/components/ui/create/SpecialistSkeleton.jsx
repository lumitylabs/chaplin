import React from "react";

function SpecialistSkeleton() {
  return (
    <div className="w-80 h-50 border border-[#333] rounded-2xl font-inter text-sm flex flex-col justify-between animate-pulse">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex justify-between">
          <div className="flex flex-row gap-2 w-full">
            <div className="h-4 bg-[#464646] rounded w-1/4"></div>
            <div className="h-4 bg-[#464646] rounded w-2/4"></div>
          </div>
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <div className="h-3 bg-[#464646] rounded w-1/3"></div>
          <div className="h-10 bg-[#464646] rounded w-full"></div>
        </div>
      </div>
      <div className="w-full h-10 bg-[#333] rounded-b-[10px] mt-4"></div>
    </div>
  );
}

export default SpecialistSkeleton;