// UserSettings.tsx
import { CircleUser } from "lucide-react";

export default function UserSettings() {
  return (
    <div className="absolute bottom-[18px] left-[18px] z-50">
      <div className="bg-[#2E2E2E] p-2 rounded-xl shadow-md w-[60px] flex justify-center">
        <button className="w-[44px] h-[44px] text-[#C7C7C7] text-[27px] font-semibold flex items-center justify-center hover:bg-[#3a3a3a] rounded-lg transition">
          <CircleUser size={28} />
        </button>
      </div>
    </div>
  );
}
