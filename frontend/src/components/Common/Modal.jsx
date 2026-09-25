import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog: labelled by its title, closes on Escape or a backdrop
 * click, keeps Tab inside itself and gives focus back to whatever opened it.
 */
const Modal = ({ title, onClose, children, maxWidth = 'max-w-md', panelClassName = 'p-6' }) => {
  const panelRef = useRef(null);
  const bodyRef = useRef(null);
  const titleId = useId();
  // Callers pass a new onClose each render; reading it through a ref keeps the
  // effect below from re-running (and stealing focus) while the user types
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement;
    const panel = panelRef.current;
    // Start on the first field, not the close button
    const first = bodyRef.current?.querySelector(FOCUSABLE);
    (first || panel)?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll(FOCUSABLE)];
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`bg-white rounded-xl w-full max-h-[90vh] overflow-y-auto focus:outline-none ${maxWidth} ${panelClassName}`}
      >
        <div className="flex justify-between items-start gap-4 mb-4">
          <h3 id={titleId} className="text-xl font-bold text-gray-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div ref={bodyRef}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
