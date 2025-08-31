import React from "react";

const HomePreview = ({
  title = "update Offers",
  subtitle = "🚀 Add 4 more items to unlock your gift",
  buttonLabel = "Buy 2",
  progress = 0, // percentage (0 - 100)
  progressColor = "#4caf50", // default green
  extraOffer = "👉 Add {{new MWe Offerwsd}} to get free shipping"
}) => {
  return (
    <div className="max-w-md bg-white shadow-md rounded-xl p-4 border border-gray-200">
      {/* Title */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <button className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-full hover:bg-blue-50">
          {buttonLabel}
        </button>
      </div>

      {/* Subtitle */}
      <p className="text-gray-600 text-sm mt-1">{subtitle}</p>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
        <div
          className="h-2 rounded-full"
          style={{ width: `${progress}%`, backgroundColor: progressColor }}
        ></div>
      </div>
      <p className="text-gray-500 text-xs mt-1">{progress}% Complete</p>

      {/* Extra offer */}
      <p className="mt-2 text-sm">{extraOffer}</p>
    </div>
  );
};

export default HomePreview;
