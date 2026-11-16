"use client";

import { IconCheck, IconX } from "@tabler/icons-react";
import { useAcademic } from "@/context/academic-context";

export function Toast() {
  const { toastMessage, clearToast } = useAcademic();
  if (!toastMessage) return null;

  return (
    <div className="study-toast" role="status" aria-live="polite">
      <div className="toast show" role="alert">
        <div className="toast-header">
          <span className="avatar avatar-xs bg-green-lt text-green me-2" aria-hidden="true">
            <IconCheck className="icon" />
          </span>
          <strong className="me-auto">Saved</strong>
          <button className="btn-close" type="button" aria-label="Dismiss notification" onClick={clearToast}>
            <IconX className="visually-hidden" />
          </button>
        </div>
        <div className="toast-body">{toastMessage}</div>
      </div>
    </div>
  );
}
