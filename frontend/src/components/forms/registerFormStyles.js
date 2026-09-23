/**
 * Styling shared by the two registration forms.
 *
 * RegisterForm (a school's staff — account, employee profile, payroll) and
 * RegisterSchoolAdminForm (Super Admin creating the person who runs a school) are separate
 * components because they do separate jobs, but they are the same form to look at. This is the
 * part worth sharing; duplicating it would let the two drift apart visually for no reason.
 *
 * Injected with a <style> tag by each form, which is how it already worked.
 */
export const REGISTER_FORM_CSS = `
  .reg-form .ant-form-item-label > label {
    font-size: 11px !important; font-weight: 700 !important; color: var(--text-muted) !important;
    text-transform: uppercase !important; letter-spacing: 0.07em !important; height: auto !important;
  }
  .reg-form .ant-input, .reg-form .ant-input-affix-wrapper,
  .reg-form .ant-input-number, .reg-form .ant-picker {
    border-radius: 10px !important; border: 1px solid var(--border) !important;
    font-size: 13px !important; height: 38px !important;
    background: var(--surface) !important; color: var(--text) !important; width: 100% !important;
  }
  .reg-form .ant-input-affix-wrapper { padding: 0 12px !important; }
  .reg-form .ant-input-affix-wrapper > .ant-input {
    height: 36px !important; background: transparent !important; width: auto !important;
    flex: 1 1 auto !important; border: none !important; box-shadow: none !important; border-radius: 0 !important;
  }
  .reg-form .ant-input-affix-wrapper .ant-input-suffix { margin-left: 8px; color: var(--text-muted); }
  .reg-form .ant-input:focus, .reg-form .ant-input-affix-wrapper-focused,
  .reg-form .ant-input-number-focused, .reg-form .ant-picker-focused {
    border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.12) !important;
  }
  .reg-form .ant-select .ant-select-selector {
    border-radius: 10px !important; border: 1px solid var(--border) !important;
    height: 38px !important; background: var(--surface) !important;
    align-items: center !important; font-size: 13px !important;
  }
  .reg-form .ant-select-focused .ant-select-selector {
    border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.12) !important;
  }
  .reg-form .ant-checkbox-checked .ant-checkbox-inner {
    background: var(--primary) !important; border-color: var(--primary) !important;
  }
  .reg-form .ant-form-item-explain-error { font-size: 11px !important; margin-top: 3px !important; }
  .reg-form .ant-form-item { margin-bottom: 16px !important; }
  .reg-form .ant-input-number-handler-wrap { display: none; }

  /* Section divider inside a step, e.g. "Employee Profile" / "Payroll Setup". */
  .reg-section {
    font-size: 11px; font-weight: 700; color: var(--primary);
    text-transform: uppercase; letter-spacing: 0.07em;
    margin: 4px 0 14px; padding-bottom: 7px; border-bottom: 1px solid var(--border);
  }

  .reg-alert {
    padding: 10px 14px; border-radius: 10px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 500;
  }
  .reg-alert.success { background: var(--success-light); color: var(--success-hover); border: 1px solid rgba(var(--success-rgb), 0.3); }
  .reg-alert.error   { background: var(--danger-light); color: var(--danger-hover); border: 1px solid rgba(var(--danger-rgb), 0.3); }

  .reg-btn {
    height: 40px; border-radius: 10px; font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .reg-btn-primary { background: var(--primary); color: #fff; padding: 0 20px; }
  .reg-btn-primary:hover:not(:disabled) { background: var(--primary-hover); }
  .reg-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
  .reg-btn-ghost {
    background: var(--surface); color: var(--text);
    border: 1px solid var(--border) !important; padding: 0 16px;
  }
  .reg-btn-ghost:hover:not(:disabled) { border-color: var(--primary) !important; color: var(--primary); }
  .reg-btn-ghost:disabled { opacity: 0.55; cursor: not-allowed; }

  .upload-zone {
    display: flex; align-items: center; gap: 12px; padding: 10px 14px;
    border: 1px dashed var(--border); border-radius: 10px; background: var(--surface-soft);
    cursor: pointer; transition: border-color 0.2s, background 0.2s;
  }
  .upload-zone:hover { border-color: var(--primary); background: var(--primary-light); }

  /* The whole row toggles the checkbox, not just the 16px box on the right. */
  .reg-toggle-row {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 12px 14px; background: var(--surface-soft); border: 1px solid var(--border);
    border-radius: 10px; margin-bottom: 20px; cursor: pointer;
  }
  .reg-toggle-row:hover { border-color: var(--primary); }

  .step-status-row { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
  .step-status-item {
    display: flex; align-items: center; gap: 10px; padding: 8px 12px;
    border-radius: 10px; font-size: 12px; font-weight: 500;
  }
  .step-status-item.done    { background: var(--success-light); color: var(--success-hover); }
  .step-status-item.loading { background: var(--primary-light); color: var(--primary); }
  .step-status-item.error   { background: var(--danger-light); color: var(--danger-hover); }
  .step-status-item.idle    { background: var(--surface-soft); color: var(--text-muted); }

  .reg-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18px; }
  @media (max-width: 600px) {
    .reg-grid-2 { grid-template-columns: 1fr; }
    .reg-actions { flex-direction: column-reverse; }
    .reg-actions .reg-btn { width: 100%; }
  }

  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default REGISTER_FORM_CSS;
