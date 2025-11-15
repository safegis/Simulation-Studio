// UserSettings.tsx
import { CircleUser } from "lucide-react";

export default function UserSettings() {
  return (
    <div className="absolute bottom-[15px] left-[15px] z-50">
      <div className="bg-[#2E2E2E] p-1 rounded-md shadow-md w-[40px] h-[40px] flex justify-center items-center">
        <button className="w-[32px] h-[32px] text-[#C7C7C7] text-base font-semibold inline-flex items-center justify-center hover:bg-[#3a3a3a] rounded transition">
          <CircleUser size={18} className="shrink-0" />
        </button>
      </div>
    </div>
  );
}
