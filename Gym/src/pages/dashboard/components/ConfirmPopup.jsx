import { useEffect } from "react";
import "./styl/ConfirmPopup.css";

const ConfirmPopup = ({
  open,
  title,
  message,
  badgeLabel = "Confirm delete",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="confirm-popup__backdrop" onClick={onCancel}>
      <div
        className="confirm-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-popup-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="confirm-popup__badge">{badgeLabel}</div>
        <h2 id="confirm-popup-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-popup__actions">
          <button
            type="button"
            className="confirm-popup__button confirm-popup__button--cancel"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirm-popup__button confirm-popup__button--confirm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPopup;
