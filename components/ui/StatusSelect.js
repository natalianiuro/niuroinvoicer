/**
 * Inline status selector — renders as a badge, click to open a dropdown.
 * options: [{ value, label, badgeClass }]
 */
import { useState, useRef, useEffect } from "react";

export default function StatusSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        className={`badge ${current.badgeClass}`}
        onClick={() => setOpen((o) => !o)}
        style={{ cursor: "pointer", border: "none" }}
        title="Click to change status"
      >
        {current.label} ▾
      </button>

      {open && (
        <div className="status-dropdown">
          {options.map((opt) => (
            <button
              key={opt.value}
              className={`status-dropdown__item badge ${opt.badgeClass}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
