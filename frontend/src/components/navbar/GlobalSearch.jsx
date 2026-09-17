import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Modal } from "antd";
import { ClockCircleOutlined, EnterOutlined, FileSearchOutlined, SearchOutlined } from "@ant-design/icons";
import { GLOBAL_SEARCH_OPEN_EVENT, isMacPlatform } from "../../utils/globalSearch";

/**
 * Search the pages this user can open, and go to one.
 *
 * The top bar's search box stored what was typed and did nothing with it, and its "⌘K" hint was
 * wired to nothing. It now opens this: type part of a page's name (or its section, or a word from
 * its address) and press Enter. Ctrl+K / ⌘K or "/" opens it from anywhere.
 *
 * The pages are exactly the sidebar's for this user's role and additional roles, so search can
 * never offer a page the sidebar would not.
 */

const RECENT_MAX = 5;
const RESULTS_MAX = 12;


/** Every page in a sidebar tree, with the section it sits under. */
const flatten = (items = [], parent = null, parentIcon = null) => items.flatMap((item) => {
  if (Array.isArray(item?.subMenu) && item.subMenu.length) return flatten(item.subMenu, item.title, item.icon || parentIcon);
  return item?.path ? [{ title: item.title, parent, path: item.path, Icon: item.icon || parentIcon }] : [];
});

const words = (text) => String(text || "").toLowerCase().split(/[\s/_-]+/).filter(Boolean);

/** Marks where the query appears in a title. */
const Highlight = ({ text, query }) => {
  const q = query.trim().toLowerCase();
  const at = q ? text.toLowerCase().indexOf(q) : -1;
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <mark style={{ background: "color-mix(in srgb, var(--primary) 18%, transparent)", color: "inherit", padding: 0, borderRadius: 3 }}>
        {text.slice(at, at + q.length)}
      </mark>
      {text.slice(at + q.length)}
    </>
  );
};

const GlobalSearch = () => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [menus, setMenus] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const roleKey = String(user?.role?.name || "").toLowerCase();
  const extraRoles = (user?.additionalRoles || []).map((r) => String(typeof r === "string" ? r : r?.name || "").toLowerCase()).filter(Boolean);
  const recentKey = `search-recent-${user?._id || "guest"}`;

  /* The sidebar config is loaded the first time search opens, as the sidebar itself loads it. */
  useEffect(() => {
    if (!open || menus) return;
    import("../../utils/sidebar").then((m) => setMenus({ main: m.sidebarMenu || {}, extra: m.additionalRoleMenus || {} }));
  }, [open, menus]);

  const pages = useMemo(() => {
    if (!menus) return [];
    const all = [
      ...flatten(menus.main[roleKey] || []),
      ...extraRoles.flatMap((r) => flatten(menus.extra[r] || [])),
    ];
    const seen = new Set();
    return all.filter((p) => (seen.has(p.path) ? false : seen.add(p.path)));
  }, [menus, roleKey, extraRoles.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const recent = useMemo(() => {
    if (!open) return [];
    try {
      const paths = JSON.parse(localStorage.getItem(recentKey) || "[]");
      return paths.map((path) => pages.find((p) => p.path === path)).filter(Boolean);
    } catch {
      return [];
    }
  }, [open, pages, recentKey]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const terms = words(q);
    return pages
      .map((page) => {
        const title = page.title.toLowerCase();
        const haystack = [title, String(page.parent || "").toLowerCase(), ...words(page.path)].join(" ");
        if (!terms.every((t) => haystack.includes(t))) return null;
        const score = title.startsWith(q) ? 3 : title.includes(q) ? 2 : 1;
        return { page, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title))
      .slice(0, RESULTS_MAX)
      .map((r) => r.page);
  }, [pages, query]);

  const shown = query.trim() ? results : recent;

  const close = useCallback(() => { setOpen(false); setQuery(""); setActive(0); }, []);

  const go = useCallback((page) => {
    if (!page) return;
    try {
      const prev = JSON.parse(localStorage.getItem(recentKey) || "[]").filter((p) => p !== page.path);
      localStorage.setItem(recentKey, JSON.stringify([page.path, ...prev].slice(0, RECENT_MAX)));
    } catch { /* storage blocked */ }
    close();
    navigate(`/dashboard/${page.path}`);
  }, [close, navigate, recentKey]);

  /* Ctrl+K / ⌘K from anywhere; "/" when not typing somewhere else. */
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName) || e.target?.isContentEditable;
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(GLOBAL_SEARCH_OPEN_EVENT, onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener(GLOBAL_SEARCH_OPEN_EVENT, onOpen); };
  }, []);

  useEffect(() => { setActive(0); }, [query]);

  // The dialog takes focus for itself as it opens; put it in the box so typing starts at once.
  useEffect(() => {
    if (!open) return undefined;
    const timers = [0, 80, 250].map((ms) => setTimeout(() => inputRef.current?.focus(), ms));
    return () => timers.forEach(clearTimeout);
  }, [open]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, Math.max(shown.length - 1, 0))); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(shown[active]); }
  };

  const kbd = { fontSize: 11, padding: "1px 6px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--surface-soft)", color: "var(--text-secondary)" };

  return (
    <Modal
      open={open}
      onCancel={close}
      footer={null}
      closable={false}
      width={600}
      style={{ top: 72 }}
      destroyOnClose
      afterOpenChange={(visible) => { if (visible) inputRef.current?.focus(); }}
      styles={{ body: { padding: 0 }, content: { padding: 0, overflow: "hidden", borderRadius: 16 } }}
      aria-label="Search pages"
    >
      {/* The whole header row is the field; the app-wide focus ring on the bare input drew a box inside it. */}
      <style>{".gs-input:focus-visible { outline: none !important; }"}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--border-muted)" }}>
        <SearchOutlined style={{ fontSize: 18, color: "var(--text-muted)" }} />
        <input
          ref={inputRef}
          className="gs-input"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search pages — e.g. attendance, fees, timetable"
          aria-label="Search pages"
          aria-controls="global-search-results"
          aria-activedescendant={shown[active] ? `gs-${active}` : undefined}
          autoComplete="off"
          style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 16, color: "var(--text-primary)", font: "inherit" }}
        />
        <span style={kbd}>Esc</span>
      </div>

      <div id="global-search-results" role="listbox" ref={listRef} style={{ maxHeight: "min(420px, 60vh)", overflowY: "auto", padding: 8 }}>
        {!query.trim() && (
          <div style={{ padding: "8px 10px 4px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>
            {recent.length ? "Recently opened" : "Type to search"}
          </div>
        )}
        {!query.trim() && !recent.length && (
          <div style={{ padding: "6px 10px 14px", fontSize: 13, color: "var(--text-muted)" }}>
            Find any page you can open from the sidebar — {pages.length || "all"} pages. Try “attendance”, “fees” or “reports”.
          </div>
        )}
        {query.trim() && results.length === 0 && (
          <div style={{ padding: "28px 16px", textAlign: "center", color: "var(--text-muted)" }}>
            <FileSearchOutlined style={{ fontSize: 28, display: "block", marginBottom: 8 }} />
            No page matches “{query.trim()}”
          </div>
        )}
        {shown.map((page, i) => {
          const Icon = page.Icon;
          const isActive = i === active;
          return (
            <div
              key={page.path}
              id={`gs-${i}`}
              role="option"
              aria-selected={isActive}
              data-index={i}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(page)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                background: isActive ? "color-mix(in srgb, var(--primary) 9%, transparent)" : "transparent",
              }}
            >
              <span style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: isActive ? "var(--primary)" : "var(--surface-soft)", color: isActive ? "#fff" : "var(--text-secondary)",
              }}>
                {query.trim() || !Icon ? (Icon ? <Icon size={15} strokeWidth={1.9} /> : <SearchOutlined />) : <ClockCircleOutlined />}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <Highlight text={page.title} query={query} />
                </span>
                {page.parent && <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)" }}>{page.parent}</span>}
              </span>
              {isActive && <EnterOutlined style={{ color: "var(--text-muted)" }} />}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", padding: "10px 18px", borderTop: "1px solid var(--border-muted)", fontSize: 12, color: "var(--text-muted)" }}>
        <span><span style={kbd}>↑</span> <span style={kbd}>↓</span> move</span>
        <span><span style={kbd}>Enter</span> open</span>
        <span><span style={kbd}>{isMacPlatform() ? "⌘" : "Ctrl"} K</span> search from anywhere</span>
      </div>
    </Modal>
  );
};

export default GlobalSearch;
