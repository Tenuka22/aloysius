import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import type { EntryStatus } from "../../content/cms";
import { STATUS_LABEL } from "../../content/cms";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";

const highlightPulse = stylex.keyframes({
  "0%": { backgroundColor: "rgba(255, 178, 3, 0.25)" },
  "100%": { backgroundColor: "transparent" },
});

/**
 * Shared building blocks for the admin screens.
 *
 * The public site and the CMS draw from the same token file, so the admin can
 * never drift from the brand. What differs is density: the site is generous,
 * the CMS is compact, because an editor is reading a form rather than a page.
 */

const MIN_TARGET = "2.75rem";

const styles = stylex.create({
  panel: {
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    padding: {
      default: space.md,
      [bp.lg]: space.lg,
    },
    // Panels sit in grids; without this a long unbroken string (an email, a
    // URL) sets the track width and pushes the layout wider than the viewport.
    minWidth: 0,
  },
  panelAccent: {
    borderBlockStartWidth: "2px",
    borderBlockStartColor: color.accent,
  },
  panelInverse: {
    backgroundColor: color.surfaceInverse,
    borderColor: "transparent",
    color: color.onInverse,
  },

  panelHead: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: space["2xs"],
    marginBlockEnd: space.md,
  },
  panelEyebrow: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  panelEyebrowInverse: {
    color: color.accentOnInverse,
  },
  panelTitle: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    textWrap: "balance",
  },
  panelNote: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  panelNoteInverse: {
    color: color.onInverseMuted,
  },

  /* ------------------------------------------------------------- badges */
  badge: {
    display: "inline-flex",
    alignItems: "center",
    // `fit-content` + `nowrap`: a status badge that wraps mid-word reads as
    // broken, and these strings are short enough to never need two lines.
    width: "fit-content",
    whiteSpace: "nowrap",
    paddingBlock: space["3xs"],
    paddingInline: space["2xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
  },
  badgePublished: {
    backgroundColor: "rgba(1, 52, 5, 0.12)",
    color: color.onSurface,
  },
  badgeDraft: {
    backgroundColor: "rgba(255, 178, 3, 0.24)",
    // Not gold-on-cream (1.9:1). A darkened gold clears 4.5:1 and still reads
    // as the same status colour.
    color: "#7a5400",
  },
  badgeScheduled: {
    backgroundColor: "rgba(47, 74, 133, 0.16)",
    color: "#2f4a85",
  },
  badgeAuto: {
    backgroundColor: "rgba(47, 74, 133, 0.16)",
    color: "#2f4a85",
  },
  badgeGlobal: {
    backgroundColor: "rgba(1, 52, 5, 0.07)",
    color: color.onSurfaceSubtle,
  },

  /* ------------------------------------------------------------- fields */
  fieldGrid: {
    display: "grid",
    gap: space.md,
    // One column on a phone, two once there is room for a label and a control
    // side by side without either being squeezed.
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.lg]: "repeat(2, minmax(0, 1fr))",
    },
  },
  fieldWide: {
    gridColumn: {
      default: "auto",
      [bp.lg]: "1 / -1",
    },
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: space["3xs"],
    minWidth: 0,
  },
  fieldRow: {
    display: "flex",
    gap: space["2xs"],
    alignItems: "stretch",
  },
  fieldRowControl: {
    flex: "1 1 0",
    minWidth: 0,
  },
  clearButton: {
    flexShrink: 0,
    width: MIN_TARGET,
    minHeight: MIN_TARGET,
    display: "grid",
    placeItems: "center",
    padding: 0,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: color.borderStrong,
      ":hover": color.danger,
    },
    backgroundColor: {
      default: color.surfaceSunken,
      ":hover": color.danger,
    },
    color: {
      default: color.onSurfaceMuted,
      ":hover": color.surface,
    },
    fontFamily: font.body,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    cursor: "pointer",
    transitionProperty: "background-color, color, border-color",
    transitionDuration: motionToken.fast,
  },
  label: {
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurface,
  },
  control: {
    width: "100%",
    minHeight: MIN_TARGET,
    paddingBlock: space["2xs"],
    paddingInline: space.xs,
    backgroundColor: color.surfaceSunken,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: color.borderStrong,
      ":hover": color.onSurfaceSubtle,
    },
    color: color.onSurface,
    fontFamily: font.body,
    // 16px minimum on the control itself: iOS Safari zooms the whole page in
    // when a focused input's text is smaller than that, which on a phone looks
    // exactly like the layout breaking.
    fontSize: "1rem",
    lineHeight: font.leadingNormal,
    transitionProperty: "border-color, background-color",
    transitionDuration: motionToken.fast,
  },
  controlDirty: {
    backgroundColor: "rgba(255, 178, 3, 0.12)",
    borderColor: color.accent,
  },
  customSelect: {
    position: "relative",
    width: "100%",
  },
  customSelectButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    minHeight: MIN_TARGET,
    paddingBlock: space["2xs"],
    paddingInline: space.xs,
    backgroundColor: color.surfaceSunken,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: color.borderStrong,
      ":hover": color.onSurfaceSubtle,
    },
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: "1rem",
    lineHeight: font.leadingNormal,
    textAlign: "start",
    cursor: "pointer",
    transitionProperty: "border-color, background-color",
    transitionDuration: motionToken.fast,
  },
  customSelectButtonOpen: {
    borderColor: color.onSurfaceSubtle,
  },
  customSelectChevron: {
    width: "1rem",
    height: "1rem",
    flexShrink: 0,
    marginInlineStart: space.xs,
    transitionProperty: "transform",
    transitionDuration: motionToken.fast,
  },
  customSelectChevronOpen: {
    transform: "rotate(180deg)",
  },
  customSelectMenu: {
    position: "absolute",
    insetBlockStart: "100%",
    insetInlineStart: 0,
    insetInlineEnd: 0,
    zIndex: 1000,
    marginTop: space.px,
    maxHeight: "15rem",
    overflowY: "auto",
    backgroundColor: color.surfaceSunken,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    boxShadow: "0 8px 28px rgba(0, 0, 0, 0.18)",
  },
  customSelectOption: {
    display: "block",
    width: "100%",
    paddingBlock: space["2xs"],
    paddingInline: space.xs,
    border: "none",
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(1, 52, 5, 0.08)",
    },
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: "1rem",
    lineHeight: font.leadingNormal,
    textAlign: "start",
    cursor: "pointer",
  },
  customSelectOptionActive: {
    backgroundColor: "rgba(1, 52, 5, 0.12)",
  },
  customSelectOptionSelected: {
    backgroundColor: "rgba(255, 178, 3, 0.18)",
    color: color.onSurface,
    fontWeight: font.weightSemibold,
  },
  textarea: {
    minHeight: "6rem",
    resize: "vertical",
  },
  readonly: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: space["2xs"],
    minHeight: MIN_TARGET,
    paddingBlock: space["2xs"],
    paddingInline: space.xs,
    backgroundColor: "rgba(1, 52, 5, 0.05)",
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    color: color.onSurfaceMuted,
    fontSize: font.sizeSm,
  },
  hint: {
    margin: 0,
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceSubtle,
    textWrap: "pretty",
  },

  /* ------------------------------------------------------------ switch */
  switchRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.sm,
    paddingBlock: space.xs,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  switchText: {
    // `16rem` basis: the row keeps label and control on one line until the text
    // would be narrower than that, then the control drops below it.
    flex: "1 1 16rem",
    minWidth: 0,
  },
  switchLabel: {
    margin: 0,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    color: color.onSurface,
  },
  switchDesc: {
    margin: 0,
    marginBlockStart: "0.1rem",
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  switchControls: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
    marginInlineStart: "auto",
  },
  /*
   * A real <button role="switch">, not a styled <span>. It is reachable by Tab,
   * toggles on Space and Enter, and announces its state - none of which the
   * comp's clickable <span> would have done.
   */
  switchButton: {
    position: "relative",
    flexShrink: 0,
    width: "2.875rem",
    height: MIN_TARGET,
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    cursor: {
      default: "pointer",
      ":disabled": "not-allowed",
    },
    opacity: {
      default: 1,
      ":disabled": 0.45,
    },
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
  },
  switchTrack: {
    position: "absolute",
    insetBlockStart: "50%",
    insetInlineStart: 0,
    width: "2.875rem",
    height: "1.625rem",
    marginBlockStart: "-0.8125rem",
    borderRadius: "999px",
    transitionProperty: "background-color",
    transitionDuration: motionToken.fast,
  },
  switchTrackOn: { backgroundColor: color.surfaceInverse },
  switchTrackOff: { backgroundColor: "rgba(1, 52, 5, 0.25)" },
  switchKnob: {
    position: "absolute",
    insetBlockStart: "0.1875rem",
    width: "1.25rem",
    height: "1.25rem",
    borderRadius: "50%",
    backgroundColor: color.surface,
    transitionProperty: "inset-inline-start",
    transitionDuration: motionToken.fast,
    transitionTimingFunction: motionToken.ease,
  },
  switchKnobOn: { insetInlineStart: "1.4375rem" },
  switchKnobOff: { insetInlineStart: "0.1875rem" },

  /* ------------------------------------------------------------ buttons */
  button: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space["3xs"],
    minHeight: MIN_TARGET,
    paddingBlock: space["2xs"],
    paddingInline: space.md,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: "transparent",
    fontFamily: font.body,
    fontSize: font.sizeXs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    textDecoration: "none",
    whiteSpace: "nowrap",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    transitionProperty: "background-color, color, border-color",
    transitionDuration: motionToken.fast,
  },
  buttonPrimary: {
    backgroundColor: {
      default: color.accent,
      ":hover": color.accentHover,
    },
    color: color.onAccent,
  },
  buttonDark: {
    backgroundColor: {
      default: color.surfaceInverse,
      ":hover": color.surfaceInverseDeep,
    },
    color: color.accentOnInverse,
  },
  buttonQuiet: {
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(1, 52, 5, 0.06)",
    },
    borderColor: color.borderStrong,
    color: color.onSurface,
  },
  buttonDanger: {
    backgroundColor: {
      default: "transparent",
      ":hover": color.danger,
    },
    borderColor: "rgba(165, 25, 25, 0.45)",
    color: {
      default: color.danger,
      ":hover": color.onInverse,
    },
  },
  buttonBlock: {
    width: {
      default: "100%",
      [bp.sm]: "auto",
    },
  },
  buttonDisabled: {
    cursor: "not-allowed",
    opacity: 0.45,
  },
  highlightFlash: {
    animationName: {
      default: highlightPulse,
      [bp.reducedMotion]: "none",
    },
    animationDuration: "1.5s",
    animationTimingFunction: "ease-out",
  },
});

const STATUS_STYLE: Record<EntryStatus, stylex.StyleXStyles> = {
  published: styles.badgePublished,
  draft: styles.badgeDraft,
  scheduled: styles.badgeScheduled,
  auto: styles.badgeAuto,
  global: styles.badgeGlobal,
};

export const StatusBadge = ({ status }: { status: EntryStatus }) => (
  <span {...stylex.props(styles.badge, STATUS_STYLE[status])}>
    {STATUS_LABEL[status]}
  </span>
);

export const Panel = ({
  children,
  tone = "default",
  accent = false,
  style,
}: {
  children: ReactNode;
  tone?: "default" | "inverse";
  accent?: boolean;
  style?: stylex.StyleXStyles;
}) => (
  <section
    {...stylex.props(
      styles.panel,
      accent && styles.panelAccent,
      tone === "inverse" && styles.panelInverse,
      style
    )}
  >
    {children}
  </section>
);

export const PanelHead = ({
  eyebrow,
  title,
  note,
  action,
  inverse = false,
  titleId,
}: {
  eyebrow?: string;
  title: string;
  note?: string;
  action?: ReactNode;
  inverse?: boolean;
  titleId?: string;
}) => (
  <div {...stylex.props(styles.panelHead)}>
    <div>
      {eyebrow ? (
        <p
          {...stylex.props(
            styles.panelEyebrow,
            inverse && styles.panelEyebrowInverse
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2 id={titleId} {...stylex.props(styles.panelTitle)}>
        {title}
      </h2>
      {note ? (
        <p
          {...stylex.props(
            styles.panelNote,
            inverse && styles.panelNoteInverse
          )}
        >
          {note}
        </p>
      ) : null}
    </div>
    {action}
  </div>
);

export const FieldGrid = ({ children }: { children: ReactNode }) => (
  <div {...stylex.props(styles.fieldGrid)}>{children}</div>
);

const CUSTOM_OPTION_VALUE = "__custom_link__";

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...stylex.props(
      styles.customSelectChevron,
      open && styles.customSelectChevronOpen
    )}
  >
    <path d="M4 6l4 4 4-4" />
  </svg>
);

const CustomSelect = ({
  "aria-describedby": ariaDescribedBy,
  dirty,
  id,
  onChange,
  options,
  selectedValue,
}: {
  "aria-describedby"?: string;
  dirty: boolean;
  id: string;
  onChange: ((next: string) => void) | undefined;
  options: { label: string; value: string }[] | undefined;
  selectedValue: string | undefined;
}) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedLabel =
    options?.find((o) => o.value === selectedValue)?.label ?? "Custom link...";

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, close]);

  useEffect(() => {
    if (open && activeIndex >= 0 && optionRefs.current[activeIndex]) {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  const allOptions = options ?? [];

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!open) {
      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault();
        setActiveIndex((prev) => (prev < allOptions.length - 1 ? prev + 1 : 0));
        break;
      }
      case "ArrowUp": {
        event.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : allOptions.length - 1));
        break;
      }
      case "Enter":
      case " ": {
        event.preventDefault();
        {
          const option = allOptions[activeIndex];
          if (option) {
            onChange?.(option.value);
            close();
          }
        }
        break;
      }
      case "Home": {
        event.preventDefault();
        setActiveIndex(0);
        break;
      }
      case "End": {
        event.preventDefault();
        setActiveIndex(allOptions.length - 1);
        break;
      }
      default: {
        break;
      }
    }
  };

  return (
    <div {...stylex.props(styles.customSelect)}>
      <button
        aria-describedby={ariaDescribedBy}
        aria-expanded={open}
        aria-haspopup="listbox"
        id={id}
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) {
            setActiveIndex(0);
          }
        }}
        onKeyDown={handleKeyDown}
        ref={buttonRef}
        type="button"
        {...stylex.props(
          styles.customSelectButton,
          styles.control,
          dirty && styles.controlDirty,
          open && styles.customSelectButtonOpen
        )}
      >
        <span>{selectedLabel}</span>
        <ChevronIcon open={open} />
      </button>
      {open ? (
        /* oxlint-disable jsx-a11y/prefer-tag-over-role -- custom dropdown, not native select */
        <div
          aria-labelledby={id}
          ref={menuRef}
          role="listbox"
          {...stylex.props(styles.customSelectMenu)}
        >
          {allOptions.map((option, index) => (
            <button
              aria-selected={option.value === selectedValue}
              key={option.value}
              onClick={() => {
                onChange?.(option.value);
                close();
              }}
              onMouseEnter={() => setActiveIndex(index)}
              ref={(el) => {
                optionRefs.current[index] = el;
              }}
              role="option"
              type="button"
              {...stylex.props(
                styles.customSelectOption,
                index === activeIndex && styles.customSelectOptionActive,
                option.value === selectedValue &&
                  styles.customSelectOptionSelected
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : /* oxlint-enable jsx-a11y/prefer-tag-over-role */
      null}
    </div>
  );
};

const renderSelectControl = (
  id: string,
  hintId: string,
  value: string | undefined,
  dirty: boolean,
  onChange: ((next: string) => void) | undefined,
  hint: string | undefined,
  options: { label: string; value: string }[] | undefined
) => {
  const knownValue = options?.some((option) => option.value === value);
  const selectedValue = knownValue ? value : CUSTOM_OPTION_VALUE;

  return (
    <CustomSelect
      aria-describedby={hint ? hintId : undefined}
      dirty={dirty}
      id={id}
      onChange={onChange}
      options={options}
      selectedValue={selectedValue}
    />
  );
};

const renderControl = (
  kind: string,
  id: string,
  hintId: string,
  value: string | undefined,
  dirty: boolean,
  onChange: ((next: string) => void) | undefined,
  hint: string | undefined,
  options: { label: string; value: string }[] | undefined
) => {
  if (kind === "select") {
    return renderSelectControl(
      id,
      hintId,
      value,
      dirty,
      onChange,
      hint,
      options
    );
  }

  if (kind === "readonly") {
    return (
      <div id={id} {...stylex.props(styles.readonly)}>
        <span>{value || "—"}</span>
      </div>
    );
  }

  if (kind === "textarea") {
    return (
      <textarea
        aria-describedby={hint ? hintId : undefined}
        id={id}
        onChange={(event) => onChange?.(event.target.value)}
        rows={3}
        value={value ?? ""}
        {...stylex.props(
          styles.control,
          styles.textarea,
          dirty && styles.controlDirty
        )}
      />
    );
  }

  const inputType = kind === "email" ? "email" : "text";
  return (
    <input
      aria-describedby={hint ? hintId : undefined}
      id={id}
      onChange={(event) => onChange?.(event.target.value)}
      type={inputType}
      value={value ?? ""}
      {...stylex.props(styles.control, dirty && styles.controlDirty)}
    />
  );
};

/**
 * A labelled control.
 *
 * The label is a real `<label htmlFor>` rather than a wrapping `<span>`, so
 * tapping it focuses the control - which on a phone is most of the hit area an
 * editor actually aims at.
 */
export const Field = ({
  label,
  kind = "text",
  value,
  hint,
  wide = false,
  dirty = false,
  highlighted = false,
  onChange,
  onReset,
  options,
}: {
  label: string;
  kind?: "text" | "textarea" | "readonly" | "select" | "email";
  value?: string;
  hint?: string;
  wide?: boolean;
  dirty?: boolean;
  highlighted?: boolean;
  onChange?: (next: string) => void;
  onReset?: () => void;
  options?: { label: string; value: string }[];
}) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const showClear = dirty && onReset;

  return (
    <div
      {...stylex.props(
        styles.field,
        wide && styles.fieldWide,
        highlighted && styles.highlightFlash
      )}
    >
      <label htmlFor={id} {...stylex.props(styles.label)}>
        {label}
      </label>

      <div {...stylex.props(styles.fieldRow)}>
        <div {...stylex.props(styles.fieldRowControl)}>
          {renderControl(
            kind,
            id,
            hintId,
            value,
            dirty,
            onChange,
            hint,
            options
          )}
        </div>
        {showClear ? (
          <button
            aria-label={`Reset ${label}`}
            onClick={onReset}
            type="button"
            {...stylex.props(styles.clearButton)}
          >
            ×
          </button>
        ) : null}
      </div>

      {hint ? (
        <p id={hintId} {...stylex.props(styles.hint)}>
          {hint}
        </p>
      ) : null}
    </div>
  );
};

export const SwitchRow = ({
  label,
  description,
  checked,
  onToggle,
  disabled = false,
  badge,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  badge?: ReactNode;
}) => {
  const labelId = useId();

  return (
    <div {...stylex.props(styles.switchRow)}>
      <div {...stylex.props(styles.switchText)}>
        <p id={labelId} {...stylex.props(styles.switchLabel)}>
          {label}
        </p>
        {description ? (
          <p {...stylex.props(styles.switchDesc)}>{description}</p>
        ) : null}
      </div>
      <div {...stylex.props(styles.switchControls)}>
        {badge}
        <button
          aria-checked={checked}
          aria-labelledby={labelId}
          disabled={disabled}
          onClick={onToggle}
          role="switch"
          type="button"
          {...stylex.props(styles.switchButton)}
        >
          <span
            {...stylex.props(
              styles.switchTrack,
              checked ? styles.switchTrackOn : styles.switchTrackOff
            )}
          />
          <span
            {...stylex.props(
              styles.switchKnob,
              checked ? styles.switchKnobOn : styles.switchKnobOff
            )}
          />
        </button>
      </div>
    </div>
  );
};

type ButtonTone = "primary" | "dark" | "quiet" | "danger";

const BUTTON_TONE: Record<ButtonTone, stylex.StyleXStyles> = {
  primary: styles.buttonPrimary,
  dark: styles.buttonDark,
  quiet: styles.buttonQuiet,
  danger: styles.buttonDanger,
};

export const CmsButton = ({
  children,
  tone = "quiet",
  block = false,
  disabled = false,
  onClick,
  type = "button",
  style,
}: {
  children: ReactNode;
  tone?: ButtonTone;
  block?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  style?: stylex.StyleXStyles;
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    type={type === "submit" ? "submit" : "button"}
    {...stylex.props(
      styles.button,
      BUTTON_TONE[tone],
      block && styles.buttonBlock,
      disabled && styles.buttonDisabled,
      style
    )}
  >
    {children}
  </button>
);

export const CmsLink = ({
  children,
  href,
  tone = "quiet",
  external = false,
}: {
  children: ReactNode;
  href: string;
  tone?: ButtonTone;
  external?: boolean;
}) => (
  <a
    href={href}
    rel={external ? "noopener noreferrer" : undefined}
    target={external ? "_blank" : undefined}
    {...stylex.props(styles.button, BUTTON_TONE[tone])}
  >
    {children}
  </a>
);
