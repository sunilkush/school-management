import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Empty, Skeleton } from "antd";
import { CalendarOutlined, IdcardOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, iconWell } from "../../../styles/pageStyles";
import { CATEGORICAL_COLORS } from "../../../utils/colorPalette";

const COLORS = CATEGORICAL_COLORS;

const MyChildren = () => {
  const dispatch = useDispatch();
  const { children = [], loading } = useSelector((state) => state.studentPortal || {});

  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);

  return (
    <>
      <PageHeader
        title="My Children"
        subtitle="Linked student profiles for your parent account."
        icon={<UserOutlined />}
      />
      <div style={pageWrapper}>
        {loading ? (
          <div style={sectionPanel}><Skeleton active paragraph={{ rows: 4 }} /></div>
        ) : !children.length ? (
          <div style={sectionPanel}><Empty description="No linked children found for this account" /></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {children.map((child, i) => {
              const color = COLORS[i % COLORS.length];
              const initials = (child.name || "S")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              return (
                <div
                  key={child._id || child.userId}
                  style={{ ...sectionPanel, padding: 0, overflow: "hidden", marginBottom: 0 }}
                >
                  <div style={{ height: 4, background: color }} />
                  <div style={{ padding: "20px 20px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: "50%",
                        background: `${color}18`, color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 18, flexShrink: 0,
                        border: `2px solid ${color}40`,
                      }}>
                        {initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", lineHeight: 1.3 }}>
                          {child.name || "Student"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                          {child.registrationNumber || "—"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={iconWell(color, 26)}><IdcardOutlined style={{ fontSize: 11 }} /></div>
                        <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                          Class {child.className || "—"} — {child.sectionName || "—"}
                        </span>
                      </div>
                      {child.email && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={iconWell(color, 26)}><MailOutlined style={{ fontSize: 11 }} /></div>
                          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{child.email}</span>
                        </div>
                      )}
                      {child.dateOfBirth && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={iconWell(color, 26)}><CalendarOutlined style={{ fontSize: 11 }} /></div>
                          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                            {dayjs(child.dateOfBirth).format("DD MMM YYYY")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default MyChildren;
