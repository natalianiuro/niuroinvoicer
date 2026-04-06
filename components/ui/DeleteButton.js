import { useState } from "react";
import { Trash2 } from "lucide-react";

/**
 * Inline delete button with two-step confirmation.
 * Shows trash icon → click → shows "Delete? Yes / No" inline.
 */
export default function DeleteButton({ onDelete, label = "Delete" }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="confirm-delete" onClick={(e) => e.stopPropagation()}>
        <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Delete?</span>
        <button
          className="confirm-delete__yes"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          Yes
        </button>
        <button
          className="confirm-delete__no"
          onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="row-actions" onClick={(e) => e.stopPropagation()}>
      <button
        className="btn-delete"
        onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
        title={label}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
