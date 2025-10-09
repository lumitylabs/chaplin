import React from "react";
import ExpandIcon from "../../../assets/expand_icon.svg";

function ExpandBox({
  size,
  value, 
  placeholder,
  onOpenModal, 
  hasButton = false,
  buttonName = null,
}) {
  return (
    <div
      className="flex flex-col gap-1 text-sm text-[#B0B0B0]"
      style={{ width: size }}
    >
      <div className="relative h-full">

        <div
          onClick={onOpenModal} 
          style={{ width: size }}
          className={`cursor-pointer bg-transparent border border-[#666] rounded-md px-3 py-2 text-[#E0E0E0] placeholder-gray-500 focus:outline-none focus:border-[#888] transition truncate h-10 flex items-center ${ // NEW: flex items-center to vertically center text
            hasButton ? "pr-20" : ""
          }`}
        >

          {value ? (
            value
          ) : (
            <span className="text-[#777]">{placeholder}</span>
          )}
        </div>

        {hasButton ? (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-16 bg-[#E0E0E0] text-[#222] text-xs font-medium rounded-full px-3 flex items-center justify-center hover:bg-[#d5d5d5] transition cursor-pointer"
          >
            {buttonName}
          </button>
        ) : (
          <div>
            <img
              src={ExpandIcon}
              alt=""
              className="absolute right-1 top-1/2 -translate-y-1/2 px-3 flex items-center justify-center pointer-events-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpandBox;