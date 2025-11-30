import { useState } from "react";
import { showToast } from "@/services/toast";

export const AdminSettings = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [supportEmail, setSupportEmail] = useState("support@example.com");

  const handleSave = () => {
    showToast("Settings saved (wire to backend)", "info");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Settings</p>
          <h2 className="text-3xl font-serif font-bold text-white">Platform configuration</h2>
          <p className="text-sm text-gray-400 mt-1">Placeholder controls; connect to backend APIs.</p>
        </div>
        <button
          onClick={handleSave}
          className="text-sm text-gray-200 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg px-3 py-2 transition-colors"
        >
          Save
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Maintenance mode</h3>
            <p className="text-sm text-gray-400">Temporarily disable public access.</p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-white">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="h-4 w-4 rounded border-white/30 bg-white/10 text-pink-500 focus:ring-pink-500"
            />
            {maintenanceMode ? "Enabled" : "Disabled"}
          </label>
        </div>

        <div className="space-y-2">
          <label className="flex flex-col gap-2 text-sm text-gray-200">
            <span className="font-semibold">Support email</span>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="rounded-lg bg-black/20 border border-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="support@example.com"
            />
          </label>
          <p className="text-xs text-gray-400">Shown in emails and the Help section.</p>
        </div>
      </div>
    </div>
  );
};
