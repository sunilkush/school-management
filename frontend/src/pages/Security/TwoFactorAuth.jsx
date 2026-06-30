import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetch2FAStatus,
  enable2FA,
  confirm2FA,
  requestDisableOTP,
  disable2FA,
  resetTwoFactorState,
} from "../../features/twoFactorSlice";

export default function TwoFactorAuth() {
  const dispatch = useDispatch();
  const { enabled, email, otpSent, loading, error, success } = useSelector((s) => s.twoFactor);
  const [otp, setOtp] = useState("");
  const [flow, setFlow] = useState(null); // "enable" | "disable"

  useEffect(() => {
    dispatch(fetch2FAStatus());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => dispatch(resetTwoFactorState()), 3000);
      return () => clearTimeout(t);
    }
  }, [success, dispatch]);

  const handleStartEnable = () => {
    setFlow("enable");
    setOtp("");
    dispatch(enable2FA());
  };

  const handleConfirmEnable = (e) => {
    e.preventDefault();
    dispatch(confirm2FA(otp)).then((res) => {
      if (!res.error) { setFlow(null); setOtp(""); }
    });
  };

  const handleStartDisable = () => {
    setFlow("disable");
    setOtp("");
    dispatch(requestDisableOTP());
  };

  const handleConfirmDisable = (e) => {
    e.preventDefault();
    dispatch(disable2FA(otp)).then((res) => {
      if (!res.error) { setFlow(null); setOtp(""); }
    });
  };

  const handleCancel = () => {
    setFlow(null);
    setOtp("");
    dispatch(resetTwoFactorState());
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Two-Factor Authentication</h2>
      <p className="text-sm text-gray-500 mb-6">
        Add an extra layer of security. When enabled, a one-time code is sent to your email on every login.
      </p>

      {/* Status Card */}
      <div className={`rounded-lg border p-4 mb-6 flex items-center gap-4 ${enabled ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${enabled ? "bg-green-100" : "bg-gray-200"}`}>
          {enabled ? "✅" : "🔓"}
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-800">2FA is currently <span className={enabled ? "text-green-600" : "text-gray-500"}>{enabled ? "enabled" : "disabled"}</span></p>
          {enabled && email && <p className="text-sm text-gray-500">Codes are sent to: <strong>{email}</strong></p>}
        </div>
        {!flow && (
          <button
            onClick={enabled ? handleStartDisable : handleStartEnable}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              enabled
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            } disabled:opacity-50`}
          >
            {loading ? "..." : enabled ? "Disable 2FA" : "Enable 2FA"}
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      {/* OTP Form */}
      {flow && otpSent && (
        <div className="border border-indigo-200 rounded-lg p-5 bg-indigo-50">
          <p className="text-sm text-indigo-800 mb-4">
            A 6-digit code has been sent to <strong>{email}</strong>. Enter it below to {flow === "enable" ? "enable" : "disable"} 2FA.
          </p>
          <form onSubmit={flow === "enable" ? handleConfirmEnable : handleConfirmDisable} className="flex gap-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-center text-xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
            <button type="button" onClick={handleCancel} className="px-4 py-2.5 text-gray-600 hover:text-gray-800 text-sm">
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* How it works */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">How it works</h3>
        <ol className="space-y-2 text-sm text-gray-500">
          <li className="flex gap-2"><span className="text-indigo-500 font-bold">1.</span> You enter your email and password as usual</li>
          <li className="flex gap-2"><span className="text-indigo-500 font-bold">2.</span> A 6-digit code is sent to your registered email</li>
          <li className="flex gap-2"><span className="text-indigo-500 font-bold">3.</span> Enter the code to complete sign-in</li>
        </ol>
      </div>
    </div>
  );
}
