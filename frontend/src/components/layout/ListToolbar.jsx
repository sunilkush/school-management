import React from "react";
import { toolbarRow } from "../../styles/pageStyles";

/**
 * ListToolbar — standardised wrapper for a list page's search/filter row.
 * Only owns the outer flex/gap/wrap shell and an optional right-aligned
 * slot (e.g. a "Showing X of Y" counter) — the filter controls themselves
 * (Input, Select, RangePicker, ...) stay page-specific and are passed as
 * children, since that's where real per-page variation lives.
 *
 * Props:
 *  children  ReactNode — the filter controls, in order
 *  right     ReactNode — optional right-aligned content (counter, button, ...)
 *  style     object    — merged onto the outer container
 *  className string    — optional extra class (e.g. "page-toolbar" for the global
 *                         mobile flex-wrap rules some pages rely on — see index.css)
 */
const ListToolbar = ({ children, right, style, className }) => (
  <div className={className} style={{ ...toolbarRow, ...style }}>
    {children}
    {right && <span style={{ marginLeft: "auto" }}>{right}</span>}
  </div>
);

export default ListToolbar;
