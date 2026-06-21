import React from "react";

const Loader = () => (
  <div style={{
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(145deg, #f8fafc 0%, #eff6ff 55%, #f0fdfa 100%)",
    zIndex: 9999,
    overflow: "hidden",
  }}>
    <style>{`
      /* ── Keyframes ── */
      @keyframes ld-fadein {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes ld-spin {
        to { transform: rotate(360deg); }
      }
      @keyframes ld-spin-rev {
        to { transform: rotate(-360deg); }
      }
      @keyframes ld-dot {
        0%, 60%, 100% { transform: scale(0.55); opacity: 0.3; }
        30%            { transform: scale(1.15); opacity: 1; }
      }
      @keyframes ld-bg-pulse {
        0%, 100% { opacity: 0.35; transform: scale(1); }
        50%       { opacity: 0.55; transform: scale(1.08); }
      }
      @keyframes ld-bar {
        0%   { transform: translateX(-100%); }
        100% { transform: translateX(400%); }
      }

      /* ── Background blobs ── */
      .ld-blob {
        position: absolute;
        border-radius: 50%;
        filter: blur(60px);
        animation: ld-bg-pulse 4s ease-in-out infinite;
        pointer-events: none;
      }

      /* ── Wrapper ── */
      .ld-wrap {
        animation: ld-fadein 0.5s cubic-bezier(0.16,1,0.3,1) both;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 28px;
        z-index: 1;
      }

      /* ── Logo card ── */
      .ld-logo-outer {
        position: relative;
        width: 88px;
        height: 88px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ld-logo-card {
        width: 76px;
        height: 76px;
        border-radius: 22px;
        background: #ffffff;
        box-shadow:
          0 0 0 1px rgba(37,99,235,0.08),
          0 8px 28px rgba(37,99,235,0.14),
          0 2px 6px rgba(0,0,0,0.05);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
        z-index: 1;
      }
      .ld-ring-outer {
        position: absolute;
        inset: -6px;
        border-radius: 27px;
        border: 3px solid transparent;
        border-top-color: #2563EB;
        border-left-color: #8B5CF6;
        animation: ld-spin 1s linear infinite;
      }
      .ld-ring-inner {
        position: absolute;
        inset: -2px;
        border-radius: 23px;
        border: 2px solid transparent;
        border-bottom-color: #14B8A6;
        border-right-color: rgba(37,99,235,0.3);
        animation: ld-spin-rev 1.5s linear infinite;
      }

      /* ── Text ── */
      .ld-title {
        font-size: 23px;
        font-weight: 800;
        letter-spacing: -0.6px;
        background: linear-gradient(120deg, #1D4ED8 0%, #7C3AED 50%, #0D9488 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1;
      }
      .ld-sub {
        margin-top: 6px;
        font-size: 13px;
        color: #94A3B8;
        text-align: center;
        letter-spacing: 0.01em;
      }

      /* ── Dots ── */
      .ld-dots {
        display: flex;
        gap: 9px;
        align-items: center;
      }
      .ld-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        animation: ld-dot 1.3s ease-in-out infinite;
      }
      .ld-dot:nth-child(1) { animation-delay: 0s;    background: #2563EB; }
      .ld-dot:nth-child(2) { animation-delay: 0.2s;  background: #8B5CF6; }
      .ld-dot:nth-child(3) { animation-delay: 0.4s;  background: #14B8A6; }

      /* ── Progress bar ── */
      .ld-bar-track {
        width: 180px;
        height: 3px;
        background: rgba(37,99,235,0.1);
        border-radius: 99px;
        overflow: hidden;
      }
      .ld-bar-fill {
        height: 100%;
        width: 45%;
        background: linear-gradient(90deg, #2563EB, #8B5CF6, #14B8A6);
        border-radius: 99px;
        animation: ld-bar 1.4s ease-in-out infinite;
      }
    `}</style>

    {/* Background decoration blobs */}
    <div className="ld-blob" style={{
      width: 340, height: 340,
      background: "radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)",
      top: "-60px", left: "-80px",
      animationDuration: "5s",
    }} />
    <div className="ld-blob" style={{
      width: 280, height: 280,
      background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",
      bottom: "20px", right: "-40px",
      animationDuration: "6s",
      animationDelay: "1s",
    }} />
    <div className="ld-blob" style={{
      width: 200, height: 200,
      background: "radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%)",
      bottom: "-30px", left: "10%",
      animationDuration: "4.5s",
      animationDelay: "0.5s",
    }} />

    {/* Main content */}
    <div className="ld-wrap">
      {/* Logo with dual rings */}
      <div className="ld-logo-outer">
        <div className="ld-ring-outer" />
        <div className="ld-ring-inner" />
        <div className="ld-logo-card">
          <img
            src="/logo.png"
            alt="School ERP"
            style={{ width: 52, height: 52, objectFit: "contain" }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentElement.innerHTML =
                '<span style="font-size:28px;font-weight:900;background:linear-gradient(135deg,#2563EB,#8B5CF6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">S</span>';
            }}
          />
        </div>
      </div>

      {/* App name + subtitle */}
      <div style={{ textAlign: "center" }}>
        <div className="ld-title">School ERP</div>
        <div className="ld-sub">Loading your workspace…</div>
      </div>

      {/* Animated progress bar */}
      <div className="ld-bar-track">
        <div className="ld-bar-fill" />
      </div>

      {/* Pulsing dots */}
      <div className="ld-dots">
        <div className="ld-dot" />
        <div className="ld-dot" />
        <div className="ld-dot" />
      </div>
    </div>
  </div>
);

export default Loader;
