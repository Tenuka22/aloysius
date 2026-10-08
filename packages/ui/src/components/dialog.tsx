import * as stylex from "@stylexjs/stylex";
import { Check, Copy, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

import { color, font, radius, shadow, space } from "../tokens/tokens.stylex";
import { CmsButton, Notice } from "./cms/cms-primitives";

const styles = stylex.create({
  dialog: {
    width: "min(32rem, calc(100vw - 2rem))",
    maxWidth: "none",
    maxHeight: "calc(100dvh - 2rem)",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    borderRadius: radius.lg,
    backgroundColor: color.surfaceRaised,
    color: color.onSurface,
    boxShadow: shadow.lg,
    overflow: "hidden",
    "::backdrop": {
      backgroundColor: color.surfaceOverlay,
    },
  },
  dialogWide: {
    width: "min(46rem, calc(100vw - 2rem))",
  },
  dialogClosed: {
    // StyleX's compiled class outranks the UA `dialog:not([open])` rule, so a
    // closed modal would otherwise render as a static box the instant it
    // mounts, before `showModal()` ever runs. Force it hidden until `open`.
    display: "none",
  },
  head: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space.xs,
    padding: space.sm,
    flexShrink: 0,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  headText: {
    display: "grid",
    gap: space["3xs"],
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    textWrap: "balance",
  },
  description: {
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  close: {
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.25rem",
    height: "2.25rem",
    padding: 0,
    borderWidth: 0,
    borderRadius: radius.circle,
    backgroundColor: {
      default: "transparent",
      ":hover": color.placeholder,
    },
    color: color.onSurfaceMuted,
    cursor: "pointer",
    opacity: {
      default: 1,
      ":disabled": 0.45,
    },
  },
  body: {
    display: "grid",
    gap: space.sm,
    padding: space.sm,
    overflowY: "auto",
    flex: "1 1 auto",
    minHeight: 0,
  },
  problemList: {
    display: "grid",
    gap: space["3xs"],
    margin: 0,
    paddingInlineStart: space.md,
    textWrap: "pretty",
  },
  /**
   * `Dialog`'s `form` prop wraps the head/body/footer in a real `<form>`.
   * Without this, the form is a block element with no height of its own, so
   * the body's `overflowY: auto` never gets a bounded height to scroll
   * within - the dialog's own `overflow: hidden` just clips the excess
   * instead of scrolling it. Carrying the flex column through the form
   * keeps the body the one flexible, scrollable region either way.
   */
  formShell: {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 auto",
    minHeight: 0,
  },
  footer: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: space["2xs"],
    padding: space.sm,
    flexShrink: 0,
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.border,
    backgroundColor: color.surface,
  },
  secret: {
    display: "grid",
    gap: space.xs,
    padding: space.sm,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: "rgba(122, 84, 0, 0.35)",
    borderRadius: radius.md,
    backgroundColor: "rgba(255, 178, 3, 0.14)",
  },
  secretValue: {
    margin: 0,
    padding: space.xs,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: radius.sm,
    backgroundColor: color.surface,
    fontFamily: font.mono,
    fontSize: font.sizeMd,
    // A password is one unbroken string; without this a narrow viewport
    // overflows rather than wraps.
    overflowWrap: "anywhere",
    letterSpacing: "0.01em",
    userSelect: "all",
  },
  secretHint: {
    margin: 0,
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
});

/**
 * A modal built on native `<dialog>` + `showModal()`, for the reasons given in
 * `site-header.tsx`: focus containment, Escape-to-close, the top layer and an
 * `inert` background come from the browser instead of from re-implemented
 * focus traps.
 *
 * Mount it always and drive it with `open` (the `HistoryDialog` pattern), so
 * the open/close transition is owned by one effect rather than by the caller's
 * render branches.
 */
export interface DialogProps {
  open: boolean;
  /** Called by Escape, the backdrop, and the close button. Cancel while `busy`. */
  onClose: () => void;
  title: string;
  /** One or two sentences under the title saying what this dialog decides. */
  description?: ReactNode;
  children?: ReactNode;
  /** Action row pinned below the body: cancel first, commit last. */
  footer?: ReactNode;
  /**
   * Wraps the head, body and footer in a `<form>`, so a submit button in the
   * footer is a real submit button and Enter in a field submits too.
   */
  form?: { id: string; onSubmit: () => void };
  size?: "default" | "wide";
  /** Locks dismissal while an action inside the dialog is in flight. */
  busy?: boolean;
  closeLabel?: string;
}

export const Dialog = ({
  busy = false,
  children,
  closeLabel = "Close",
  description,
  footer,
  form,
  onClose,
  open,
  size = "default",
  title,
}: DialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) {
      return;
    }
    if (open && !node.open) {
      node.showModal();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  const requestClose = () => {
    if (busy) {
      return;
    }
    onClose();
  };

  const contents = (
    <>
      <div {...stylex.props(styles.head)}>
        <div {...stylex.props(styles.headText)}>
          <h2 id={headingId} {...stylex.props(styles.title)}>
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} {...stylex.props(styles.description)}>
              {description}
            </p>
          ) : null}
        </div>
        <button
          aria-label={closeLabel}
          disabled={busy}
          onClick={requestClose}
          type="button"
          {...stylex.props(styles.close)}
        >
          <X aria-hidden="true" width={18} height={18} />
        </button>
      </div>

      {children ? <div {...stylex.props(styles.body)}>{children}</div> : null}

      {footer ? <div {...stylex.props(styles.footer)}>{footer}</div> : null}
    </>
  );

  return (
    <dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={headingId}
      onCancel={(event) => {
        // Escape fires `cancel`; take it over so the caller's state — not the
        // browser — decides what closing means.
        event.preventDefault();
        requestClose();
      }}
      ref={dialogRef}
      {...stylex.props(
        styles.dialog,
        size === "wide" && styles.dialogWide,
        !open && styles.dialogClosed
      )}
    >
      {form ? (
        <form
          id={form.id}
          onSubmit={(event) => {
            event.preventDefault();
            form.onSubmit();
          }}
          {...stylex.props(styles.formShell)}
        >
          {contents}
        </form>
      ) : (
        contents
      )}
    </dialog>
  );
};

/** Stable default: a fresh `[]` on every render would break referential equality. */
const NO_PROBLEMS: readonly string[] = [];

/**
 * A dialog whose body is a form: the shell for the workspace's small
 * create-forms (a gallery, an event proposal, an announcement).
 * The alternative — a `Panel` with a form living on the page — turns every
 * screen that offers one into a two-section page whose top half is an empty
 * text box. A dialog lets the page stay a list, and it gives the form a title
 * that names the *task* rather than the panel ("New gallery"), which is what the
 * trigger button should have said in the first place.
 *
 * Uses a real `<form>` (via `Dialog`'s `form` prop) so Enter submits and the
 * submit button is a submit button, rather than a `<div>` of buttons that
 * happen to call the same handler.
 */
export interface FormDialogProps {
  open: boolean;
  title: string;
  /** What this form creates, and what happens after it is sent. */
  description?: ReactNode;
  children: ReactNode;
  submitLabel: string;
  cancelLabel?: string;
  /** Validation messages, shown as one warning the operator has to clear. */
  problems?: readonly string[];
  /** A failure from the server, named with its recovery. */
  error?: string | null;
  /** True while the submit is in flight; locks the dialog and the button. */
  busy?: boolean;
  /** Disables the submit button without hiding the problems that explain it. */
  submitDisabled?: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export const FormDialog = ({
  busy = false,
  cancelLabel = "Cancel",
  children,
  description,
  error,
  onClose,
  onSubmit,
  open,
  problems = NO_PROBLEMS,
  submitDisabled = false,
  submitLabel,
  title,
}: FormDialogProps) => {
  const formId = useId();
  const hasProblems = problems.length > 0;

  return (
    <Dialog
      busy={busy}
      description={description}
      footer={
        <>
          <CmsButton disabled={busy} onClick={onClose} tone="quiet">
            {cancelLabel}
          </CmsButton>
          <CmsButton
            disabled={busy || submitDisabled}
            tone="primary"
            type="submit"
          >
            {busy ? "Sending…" : submitLabel}
          </CmsButton>
        </>
      }
      form={{ id: formId, onSubmit }}
      onClose={onClose}
      open={open}
      title={title}
    >
      {children}

      {hasProblems ? (
        <Notice tone="warning">
          <ul {...stylex.props(styles.problemList)}>
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </Notice>
      ) : null}

      {error ? <Notice tone="danger">{error}</Notice> : null}
    </Dialog>
  );
};

/**
 * "Are you sure?" for an action that cannot be undone — a ban, a rotation, a
 * delete. The one dialog that earns interruption by default: it gates a
 * destructive, single-click action behind focus the operator cannot lose.
 *
 * Contract: `onConfirm` runs inside the dialog. While it runs the dialog is
 * locked (`busy`) and the confirm button reads as working. When it resolves,
 * the dialog closes itself; when it rejects, it stays open and shows the
 * failure as a `Notice`, so an error never lands on a screen the operator has
 * already dismissed.
 */
export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** What exactly changes, and what it means for the person on the other end. */
  message?: ReactNode;
  /** Extra body content — a reason field, a consequence list. */
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmDialog = ({
  cancelLabel = "Cancel",
  children,
  confirmLabel,
  message,
  onClose,
  onConfirm,
  open,
  title,
  tone = "danger",
}: ConfirmDialogProps) => {
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const handleCancel = () => {
    if (pending) {
      return;
    }
    setProblem(null);
    onClose();
  };

  const handleConfirm = async () => {
    setProblem(null);
    setPending(true);
    let failed = false;
    try {
      await onConfirm();
    } catch (error) {
      failed = true;
      setProblem(
        error instanceof Error
          ? error.message
          : "That action could not be completed. Nothing has changed."
      );
    }
    setPending(false);
    if (!failed) {
      onClose();
    }
  };

  return (
    <Dialog
      busy={pending}
      description={message}
      footer={
        <>
          <CmsButton disabled={pending} onClick={handleCancel} tone="quiet">
            {cancelLabel}
          </CmsButton>
          <CmsButton
            disabled={pending}
            onClick={() => {
              void handleConfirm();
            }}
            tone={tone}
          >
            {pending ? "Working…" : confirmLabel}
          </CmsButton>
        </>
      }
      onClose={handleCancel}
      open={open}
      title={title}
    >
      {children || problem ? (
        <>
          {children}
          {problem ? <Notice tone="danger">{problem}</Notice> : null}
        </>
      ) : null}
    </Dialog>
  );
};

/**
 * A credential shown exactly once, in the amber treatment the workspace uses
 * for one-time secrets, with copy-to-clipboard and an explicit dismissal.
 *
 * This replaces the hand-rolled secret boxes that were duplicated — down to
 * the hard-coded hex — in the club access panel and the club account page.
 */
export interface SecretDialogProps {
  open: boolean;
  /** The one-time value. Never rendered anywhere else. */
  secret: string;
  title?: string;
  /** What the value is for, and when it stops working. */
  hint?: ReactNode;
  onClose: () => void;
}

export const SecretDialog = ({
  hint,
  onClose,
  open,
  secret,
  title = "Copy this password now",
}: SecretDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  /**
   * Reset on the way out rather than in an effect on `open`: "Copied" belongs to
   * the secret that was on screen, so it must never survive into the next one.
   */
  const handleClose = () => {
    setCopied(false);
    setProblem(null);
    onClose();
  };

  const handleCopy = async () => {
    setProblem(null);
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      setProblem(
        "The password could not be copied automatically. Select it and copy it manually."
      );
    }
  };

  return (
    <Dialog
      description="Shown once. Put it somewhere safe before you close this dialog."
      footer={
        <>
          <CmsButton
            onClick={() => {
              void handleCopy();
            }}
            tone="primary"
          >
            {copied ? (
              <>
                <Check aria-hidden="true" width={14} height={14} /> Copied
              </>
            ) : (
              <>
                <Copy aria-hidden="true" width={14} height={14} /> Copy password
              </>
            )}
          </CmsButton>
          <CmsButton onClick={handleClose} tone="quiet">
            Done
          </CmsButton>
        </>
      }
      onClose={handleClose}
      open={open}
      title={title}
    >
      <div {...stylex.props(styles.secret)}>
        <p {...stylex.props(styles.secretValue)}>{secret}</p>
        {hint ? <p {...stylex.props(styles.secretHint)}>{hint}</p> : null}
      </div>
      {problem ? <Notice tone="danger">{problem}</Notice> : null}
    </Dialog>
  );
};
