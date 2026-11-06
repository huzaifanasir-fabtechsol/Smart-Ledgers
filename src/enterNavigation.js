// Enter-to-next-field navigation for every form and modal in the app.
//
// Pressing Enter in a field inside a <form> (or a modal) moves the cursor to
// the next field instead of submitting. On the last field it moves to the
// form's submit button, so a second Enter saves.
//
// Not affected:
//   - textareas (Enter still inserts a new line)
//   - Enter while an IME is composing (Japanese input confirms the text)
//   - Shift/Ctrl/Alt/Meta + Enter
//   - fields outside any form or modal (search boxes, filters)
//   - anything a component already handled (event.preventDefault())
//   - elements inside data-enter-nav="off"

const CONTAINER_SELECTOR = 'form, .modal-box, .modal, [role="dialog"], [data-enter-nav="on"]';
const FIELD_SELECTOR = 'input, select, textarea';
const NON_FIELD_INPUT_TYPES = new Set(['button', 'submit', 'reset', 'image', 'hidden']);
const SELECTABLE_INPUT_TYPES = new Set(['text', 'search', 'tel', 'url', 'email', 'password', 'number', '']);

const isField = (el) => {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true;
  if (el instanceof HTMLInputElement) return !NON_FIELD_INPUT_TYPES.has(el.type);
  return false;
};

const isFocusable = (el) => {
  if (el.disabled || el.tabIndex < 0) return false;
  if (el.readOnly && !(el instanceof HTMLSelectElement)) return false;
  if (el.closest('fieldset[disabled], [inert]')) return false;
  if (!el.getClientRects().length) return false;
  return window.getComputedStyle(el).visibility !== 'hidden';
};

const findSubmitButton = (container) => {
  const candidates =
    container instanceof HTMLFormElement
      ? Array.from(container.elements)
      : Array.from(container.querySelectorAll('button, input[type="submit"]'));

  const explicit = candidates.find(
    (el) => (el.type === 'submit') && (el.tagName === 'BUTTON' || el.tagName === 'INPUT'),
  );
  if (explicit) return explicit;

  // Modals without a <form>: fall back to the primary action button.
  return (
    container.querySelector('.modal-actions .btn-primary') ||
    container.querySelector('.btn-primary') ||
    null
  );
};

const focusElement = (el) => {
  el.focus();
  if (el instanceof HTMLInputElement && SELECTABLE_INPUT_TYPES.has(el.type)) {
    try {
      el.select();
    } catch {
      // number inputs in some browsers do not support select()
    }
  }
};

const handleKeyDown = (event) => {
  if (event.key !== 'Enter' || event.defaultPrevented) return;
  if (event.isComposing || event.keyCode === 229) return;
  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;

  const target = event.target;
  if (!(target instanceof HTMLElement) || !isField(target)) return;
  if (target instanceof HTMLTextAreaElement) return;
  if (target.closest('[data-enter-nav="off"]')) return;

  const container = target.closest(CONTAINER_SELECTOR);
  if (!container) return;

  const fields =
    container instanceof HTMLFormElement
      ? Array.from(container.elements).filter(isField)
      : Array.from(container.querySelectorAll(FIELD_SELECTOR)).filter(isField);

  const index = fields.indexOf(target);
  if (index === -1) return;

  const isSameRadioGroup = (el) =>
    target.type === 'radio' && el.type === 'radio' && el.name && el.name === target.name;

  const next = fields
    .slice(index + 1)
    .find((el) => !isSameRadioGroup(el) && isFocusable(el) && !el.closest('[data-enter-nav="off"]'));

  if (next) {
    event.preventDefault();
    focusElement(next);
    return;
  }

  const submit = findSubmitButton(container);
  if (submit && isFocusable(submit)) {
    event.preventDefault();
    submit.focus();
    return;
  }

  // Submit button exists but is disabled (e.g. while saving): just swallow
  // the Enter so it does not trigger a submit through another path.
  if (submit) event.preventDefault();
};

let installed = false;

export const installEnterNavigation = () => {
  if (installed || typeof document === 'undefined') return;
  installed = true;
  // Bubble phase: runs after React's own handlers, so a component that
  // handles Enter itself (and calls preventDefault) keeps working.
  document.addEventListener('keydown', handleKeyDown);
};
