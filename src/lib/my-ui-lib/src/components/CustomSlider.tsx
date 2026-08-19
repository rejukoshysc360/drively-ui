import React from "react";

type Props = {
  viewMode: "Day" | "Week" | "Month";
  setViewMode: (m: "Day" | "Week" | "Month") => void;
};

const CustomSlider: React.FC<Props> = ({ viewMode, setViewMode }) => {
  return (
    <div className="flex gap-2 mb-3">
      {["Day", "Week", "Month"].map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode as "Day" | "Week" | "Month")}
          className={`px-3 py-1 rounded ${
            viewMode === mode
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
};

export default CustomSlider;
