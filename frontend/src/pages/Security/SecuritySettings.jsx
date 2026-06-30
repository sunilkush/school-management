import React, { useState } from "react";
import TwoFactorAuth from "./TwoFactorAuth";
import DeviceHistory from "./DeviceHistory";
import IpRestrictions from "./IpRestrictions";

const TABS = [
  { key: "2fa", label: "Two-Factor Auth", icon: "🔐" },
  { key: "devices", label: "Login History", icon: "📱" },
  { key: "ip", label: "IP Restrictions", icon: "🌐" },
];

export default function SecuritySettings() {
  const [activeTab, setActiveTab] = useState("2fa");

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
          <p className="text-gray-500 mt-1">Manage account security, device history, and access controls</p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {activeTab === "2fa" && <TwoFactorAuth />}
          {activeTab === "devices" && <DeviceHistory />}
          {activeTab === "ip" && <IpRestrictions />}
        </div>
      </div>
    </div>
  );
}
