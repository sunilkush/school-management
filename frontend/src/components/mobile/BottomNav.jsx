import { memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTheme } from "../../context/ThemeContext";
import {
  LayoutDashboard, School, Users, FileBarChart2, GraduationCap,
  UserCheck, BookOpen, ClipboardCheck, FileCheck, CalendarClock,
  ListChecks, IndianRupee, Briefcase, Book, MapPinned, BusFront,
  Bed, Wrench, HelpCircle, UserPlus, MessageSquare, Clipboard,
  ClipboardList, Clock, User, AlignJustify, Receipt,
} from "lucide-react";
import RupeeIcon from "../icons/RupeeIcon";

/* ── Role → 4 quick-access tabs ─────────────────────────────────── */
const TABS = {
  "super admin": [
    { label: "Home",    path: "superadmin",             icon: LayoutDashboard },
    { label: "Schools", path: "superadmin/schools",     icon: School         },
    { label: "Users",   path: "superadmin/users/admins",icon: Users          },
    { label: "Reports", path: "superadmin/reports",     icon: FileBarChart2  },
  ],
  "school admin": [
    { label: "Home",       path: "schooladmin",                    icon: LayoutDashboard },
    { label: "Students",   path: "schooladmin/studentList",        icon: GraduationCap  },
    { label: "Attendance", path: "schooladmin/attendance/students", icon: UserCheck      },
    { label: "Fees",       path: "schooladmin/fees/collect",       icon: RupeeIcon      },
  ],
  teacher: [
    { label: "Home",       path: "teacher",                    icon: LayoutDashboard },
    { label: "Classes",    path: "teacher/classes",            icon: BookOpen        },
    { label: "Attendance", path: "teacher/attendance/students", icon: UserCheck      },
    { label: "Tasks",      path: "teacher/tasks",              icon: ListChecks      },
  ],
  student: [
    { label: "Home",      path: "student",           icon: LayoutDashboard },
    { label: "Homework",  path: "student/homework",  icon: ClipboardCheck  },
    { label: "Grades",    path: "student/grades",    icon: FileCheck       },
    { label: "Timetable", path: "student/timetable", icon: CalendarClock   },
  ],
  parent: [
    { label: "Home",       path: "parent",            icon: LayoutDashboard },
    { label: "Children",   path: "parent/children",   icon: Users           },
    { label: "Attendance", path: "parent/attendance", icon: UserCheck       },
    { label: "Fees",       path: "parent/fees",       icon: RupeeIcon       },
  ],
  accountant: [
    { label: "Home",    path: "accountant",              icon: LayoutDashboard },
    { label: "Fees",    path: "accountant/fees/collect", icon: RupeeIcon       },
    { label: "Income",  path: "accountant/income",       icon: IndianRupee     },
    { label: "Reports", path: "accountant/reports",      icon: FileBarChart2   },
  ],
  principal: [
    { label: "Home",     path: "principal",          icon: LayoutDashboard },
    { label: "Staff",    path: "principal/staff",    icon: Briefcase      },
    { label: "Students", path: "principal/students", icon: GraduationCap  },
    { label: "Tasks",    path: "principal/tasks",    icon: ListChecks     },
  ],
  "vice principal": [
    { label: "Home",       path: "viceprincipal",                   icon: LayoutDashboard },
    { label: "Academics",  path: "viceprincipal/academics",         icon: BookOpen        },
    { label: "Attendance", path: "viceprincipal/attendance/students",icon: UserCheck      },
    { label: "Tasks",      path: "viceprincipal/tasks",             icon: ListChecks      },
  ],
  "exam coordinator": [
    { label: "Home",     path: "examcoordinator",               icon: LayoutDashboard },
    { label: "Exams",    path: "examcoordinator/exams/create",  icon: GraduationCap   },
    { label: "Schedule", path: "examcoordinator/exams/schedule",icon: CalendarClock   },
    { label: "Tasks",    path: "examcoordinator/tasks",         icon: ListChecks      },
  ],
  "subject coordinator": [
    { label: "Home",     path: "subjectcoordinator",           icon: LayoutDashboard },
    { label: "Subjects", path: "subjectcoordinator/subjects",  icon: BookOpen        },
    { label: "Teachers", path: "subjectcoordinator/teachers",  icon: Users           },
    { label: "Tasks",    path: "subjectcoordinator/tasks",     icon: ListChecks      },
  ],
  librarian: [
    { label: "Home",    path: "librarian",              icon: LayoutDashboard },
    { label: "Catalog", path: "librarian/book-catalog", icon: Book            },
    { label: "Issue",   path: "librarian/issue-return", icon: ClipboardCheck  },
    { label: "Tasks",   path: "librarian/tasks",        icon: ListChecks      },
  ],
  "hostel warden": [
    { label: "Home",   path: "hostelwarden",              icon: LayoutDashboard },
    { label: "Rooms",  path: "hostelwarden/rooms",        icon: Bed             },
    { label: "Leaves", path: "hostelwarden/leaves",       icon: CalendarClock   },
    { label: "Tasks",  path: "hostelwarden/tasks",        icon: ListChecks      },
  ],
  "transport manager": [
    { label: "Home",     path: "transportmanager",          icon: LayoutDashboard },
    { label: "Routes",   path: "transportmanager/routes",   icon: MapPinned       },
    { label: "Vehicles", path: "transportmanager/vehicles", icon: BusFront        },
    { label: "Tasks",    path: "transportmanager/tasks",    icon: ListChecks      },
  ],
  receptionist: [
    { label: "Home",      path: "receptionist",           icon: LayoutDashboard },
    { label: "Visitors",  path: "receptionist/visitors",  icon: UserPlus        },
    { label: "Enquiries", path: "receptionist/enquiries", icon: MessageSquare   },
    { label: "Tasks",     path: "receptionist/tasks",     icon: ListChecks      },
  ],
  "it support": [
    { label: "Home",    path: "itsupport",             icon: LayoutDashboard },
    { label: "Maint.",  path: "itsupport/maintenance", icon: Wrench          },
    { label: "Tickets", path: "itsupport/tickets",     icon: HelpCircle      },
    { label: "Tasks",   path: "itsupport/tasks",       icon: ListChecks      },
  ],
  counselor: [
    { label: "Home",     path: "counselor",            icon: LayoutDashboard },
    { label: "Students", path: "counselor/students",   icon: Users           },
    { label: "Sessions", path: "counselor/sessions",   icon: CalendarClock   },
    { label: "Tasks",    path: "counselor/tasks",      icon: ListChecks      },
  ],
  security: [
    { label: "Home",  path: "security",                icon: LayoutDashboard },
    { label: "Entry", path: "security/entry-register", icon: Clipboard       },
    { label: "Gates", path: "security/gate-logs",      icon: ClipboardList   },
    { label: "Tasks", path: "security/tasks",          icon: ListChecks      },
  ],
  staff: [
    { label: "Home",       path: "staff",              icon: LayoutDashboard },
    { label: "Tasks",      path: "staff/tasks",        icon: CalendarClock   },
    { label: "Attendance", path: "staff/attendance",   icon: Clock           },
    { label: "Profile",    path: "staff/profile",      icon: User            },
  ],
};

const FALLBACK_TABS = [
  { label: "Home",   path: "",           icon: LayoutDashboard },
  { label: "Tasks",  path: "tasks",      icon: ListChecks      },
  { label: "Profile",path: "profile",    icon: User            },
  { label: "More",   path: "reports",    icon: FileBarChart2   },
];

/* ── BottomNav ───────────────────────────────────────────────────── */
const BottomNav = ({ onMenuOpen }) => {
  const { user }  = useSelector((s) => s.auth);
  const { isDark } = useTheme();
  const location  = useLocation();
  const navigate  = useNavigate();

  const roleName = user?.role?.name?.toLowerCase() || "";
  const tabs     = TABS[roleName] || FALLBACK_TABS;

  const bg      = isDark ? "rgba(15,23,42,0.97)"  : "rgba(255,255,255,0.97)";
  const border  = isDark ? "#1E2A3B"               : "#E8EEF6";
  const txtActive = isDark ? "#60A5FA" : "#2563EB";
  const txtMuted  = isDark ? "#475569" : "#94A3B8";
  const dotColor  = isDark ? "#3B82F6" : "#2563EB";
  const ripple    = isDark ? "rgba(59,130,246,0.12)" : "rgba(37,99,235,0.08)";

  /* All 5 tabs: 4 nav links + Menu */
  const allTabs = [
    ...tabs,
    { label: "Menu", icon: AlignJustify, isMenu: true },
  ];

  /* First tab is always the role dashboard — match it exactly.
     Other tabs match their full subtree to keep them highlighted
     while navigating sub-pages. */
  const homePath = tabs[0] ? `/dashboard/${tabs[0].path}` : null;

  const isTabActive = (tab, fullPath) => {
    if (tab.isMenu) return false;
    if (fullPath === homePath) {
      /* Home: exact match only */
      return location.pathname === fullPath;
    }
    return (
      location.pathname === fullPath ||
      location.pathname.startsWith(fullPath + "/")
    );
  };

  return (
    <>
      <style>{`
        .bottom-nav-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 8px 4px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: transform 0.15s ease;
          -webkit-tap-highlight-color: transparent;
          position: relative;
          min-width: 0;
        }
        .bottom-nav-btn:active {
          transform: scale(0.90);
        }
        .bottom-nav-btn::after {
          content: '';
          position: absolute;
          inset: 4px;
          border-radius: 12px;
          background: transparent;
          transition: background 0.18s ease;
        }
        .bottom-nav-btn:active::after {
          background: ${ripple};
        }
        .bn-icon-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 28px;
          border-radius: 14px;
          transition: background 0.2s ease;
        }
        .bn-active-dot {
          position: absolute;
          top: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: ${dotColor};
        }
        .bn-label {
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: 0.02em;
          line-height: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 56px;
        }
      `}</style>

      <div style={{
        position:   "fixed",
        bottom:     0,
        left:       0,
        right:      0,
        zIndex:     1000,
        height:     `calc(60px + env(safe-area-inset-bottom))`,
        paddingBottom: "env(safe-area-inset-bottom)",
        display:    "flex",
        alignItems: "stretch",
        background: bg,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop:  `1px solid ${border}`,
        boxShadow:  isDark
          ? "0 -4px 20px rgba(0,0,0,0.4)"
          : "0 -4px 20px rgba(37,99,235,0.08)",
      }}>
        {allTabs.map((tab) => {
          const isMenu   = !!tab.isMenu;
          const fullPath = isMenu ? null : `/dashboard/${tab.path}`;
          const isActive = isTabActive(tab, fullPath);
          const Icon  = tab.icon;
          const color = isActive ? txtActive : txtMuted;

          return (
            <button
              key={tab.label}
              className="bottom-nav-btn"
              onClick={() => isMenu ? onMenuOpen() : navigate(fullPath)}
              aria-label={tab.label}
              style={{ color }}
            >
              <div className="bn-icon-wrap"
                style={{
                  background: isActive
                    ? isDark ? "rgba(59,130,246,0.15)" : "rgba(37,99,235,0.08)"
                    : "transparent",
                }}>
                {isActive && <span className="bn-active-dot"/>}
                {/* RupeeIcon renders as span, others are SVG */}
                {tab.icon === RupeeIcon
                  ? <RupeeIcon size={20} style={{ color, fontWeight: 700 }}/>
                  : <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8}/>
                }
              </div>
              <span className="bn-label" style={{ color }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default memo(BottomNav);
