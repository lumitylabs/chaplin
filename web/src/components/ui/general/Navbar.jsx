import React from "react";
function Navbar() {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="font-extrabold text-white text-xl">persona</div>
      <div className="flex gap-3 font-medium">
        <div className="p-1 px-5 border-[#303136] border-2 rounded-4xl text-white w-25 flex justify-center items-center">
          Discord
        </div>
        <div className="p-1 px-5 bg-white rounded-4xl w-25 flex justify-center items-center">
          Docs
        </div>
      </div>
    </div>
  );
}

export default Navbar;
