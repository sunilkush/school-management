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
    
    {/* Background decoration blobs */}
    <div className="ld-blob" style={{
      width: 340, height: 340,
      background: "radial-gradient(circle, rgba(var(--primary-rgb),0.18) 0%, transparent 70%)",
      top: "-60px", left: "-80px",
      animationDuration: "5s",
    }} />
    <div className="ld-blob" style={{
      width: 280, height: 280,
      background: "radial-gradient(circle, rgba(var(--purple-rgb),0.14) 0%, transparent 70%)",
      bottom: "20px", right: "-40px",
      animationDuration: "6s",
      animationDelay: "1s",
    }} />
    <div className="ld-blob" style={{
      width: 200, height: 200,
      background: "radial-gradient(circle, rgba(var(--accent-rgb),0.12) 0%, transparent 70%)",
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
                '<span style="font-size:28px;font-weight:900;background:linear-gradient(135deg,var(--primary),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">S</span>';
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
