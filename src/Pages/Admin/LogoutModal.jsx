import {
  useEffect,
  useRef,
} from "react";

import {
  FiLogOut,
  FiAlertTriangle,
  FiX,
} from "react-icons/fi";

import "./LogoutModal.css";

export default function LogoutModal({
  open,
  onClose,
  onConfirm,
}) {
  const modalRef =
    useRef(null);

  // =========================================================
  // ESC KEY + BODY SCROLL LOCK
  // =========================================================

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown =
      (event) => {
        if (
          event.key ===
          "Escape"
        ) {
          onClose();
        }
      };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        "";
    };
  }, [
    open,
    onClose,
  ]);

  // =========================================================
  // CLOSED
  // =========================================================

  if (!open) {
    return null;
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      className="logout-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      onClick={(event) => {
        if (
          modalRef.current &&
          !modalRef.current.contains(
            event.target
          )
        ) {
          onClose();
        }
      }}
    >
      <div
        className="logout-modal"
        ref={modalRef}
      >
        {/* CLOSE */}

        <button
          type="button"
          className="logout-modal-close"
          onClick={onClose}
          aria-label="Close logout modal"
        >
          <FiX />
        </button>

        {/* ICON */}

        <div className="logout-modal-icon-wrap">
          <FiLogOut />
        </div>

        {/* TITLE */}

        <h2
          id="logout-modal-title"
          className="logout-modal-title"
        >
          Confirm Logout
        </h2>

        {/* MESSAGE */}

        <p className="logout-modal-message">
          <FiAlertTriangle className="logout-modal-warn-icon" />

          <span>
            Are you sure you want to log out
            of the Healthcare Monitoring
            System? You will need to sign in
            again to continue.
          </span>
        </p>

        {/* ACTIONS */}

        <div className="logout-modal-actions">
          <button
            type="button"
            className="logout-btn logout-btn-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="logout-btn logout-btn-confirm"
            onClick={onConfirm}
          >
            <FiLogOut />

            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
}