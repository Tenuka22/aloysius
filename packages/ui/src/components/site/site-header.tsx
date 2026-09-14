import * as stylex from "@stylexjs/stylex";
import { Menu, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import {
  COLLEGE_LOCATION,
  COLLEGE_NAME,
  MOTTO,
  NAV_ITEMS,
} from "../../content/home";
import type { NavItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import {
  color,
  font,
  layer,
  motionToken,
  space,
} from "../../tokens/tokens.stylex";

const SCROLL_THRESHOLD_PX = 24;

const styles = stylex.create({
  header: {
    position: "sticky",
    insetBlockStart: 0,
    zIndex: layer.header,
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    boxShadow: "0 1px 0 rgba(255, 178, 3, 0.25)",
    transitionProperty: "box-shadow, background-color",
    transitionDuration: motionToken.base,
    // Respect the notch in landscape on iPhone.
    paddingInline: space.gutter,
  },
  headerScrolled: {
    boxShadow: "0 8px 28px rgba(0, 0, 0, 0.28)",
  },
  inner: {
    display: "flex",
    alignItems: "center",
    gap: space.md,
    marginInline: "auto",
    maxWidth: space.contentWide,
    // 64px on phones, 78px from tablet up - matches the design without
    // stealing a fifth of a small phone's viewport.
    minHeight: {
      default: "4rem",
      [bp.lg]: "4.875rem",
    },
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
    // Must be allowed to shrink: at 320px the crest, the wordmark, the menu
    // button and the gutters together exceed the viewport otherwise.
    minWidth: 0,
    marginInlineEnd: "auto",
    color: color.onInverse,
    textDecoration: "none",
  },
  crest: {
    flexShrink: 0,
    height: {
      default: "2.25rem",
      [bp.lg]: "3.25rem",
    },
    width: "auto",
    objectFit: "contain",
  },
  brandText: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    lineHeight: font.leadingSnug,
    overflowWrap: "break-word",
  },
  brandName: {
    fontSize: {
      default: font.sizeXs,
      [bp.lg]: font.sizeSm,
    },
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
  },
  brandPlace: {
    fontSize: font.size2xs,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accent,
  },

  /**
   * The desktop nav is hidden below 80rem rather than 64rem: eight links plus a
   * CTA genuinely do not fit on an iPad in portrait, and a cramped nav is worse
   * than a drawer.
   */
  desktopNav: {
    display: {
      default: "none",
      [bp.xxl]: "flex",
    },
    alignItems: "center",
    minWidth: 0,
    gap: {
      default: space.sm,
      [bp.xxxl]: space.md,
    },
  },
  navLink: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    minHeight: "2.75rem",
    fontSize: font.sizeSm,
    fontWeight: font.weightSemibold,
    textDecoration: "none",
    whiteSpace: "nowrap",
    color: {
      default: color.onInverse,
      ":hover": color.accent,
    },
    // The underline is a permanently-present transparent border rather than a
    // pseudo-element that appears on hover: it can never change the box and
    // shift the links beside it.
    borderBlockEndWidth: "2px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: {
      default: "transparent",
      ":hover": color.accent,
    },
    transitionProperty: "color, border-color",
    transitionDuration: motionToken.fast,
  },
  navLinkActive: {
    color: color.accent,
    borderBlockEndColor: color.accent,
  },

  cta: {
    display: {
      default: "none",
      [bp.md]: "inline-flex",
    },
    alignItems: "center",
    minHeight: "2.75rem",
    paddingInline: space.md,
    backgroundColor: {
      default: color.accent,
      ":hover": color.accentHover,
    },
    color: color.onAccent,
    fontSize: font.sizeXs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textDecoration: "none",
    whiteSpace: "nowrap",
    transitionProperty: "background-color",
    transitionDuration: motionToken.fast,
  },

  menuButton: {
    display: {
      default: "inline-flex",
      [bp.xxl]: "none",
    },
    alignItems: "center",
    justifyContent: "center",
    width: "2.75rem",
    height: "2.75rem",
    padding: 0,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderInverse,
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(255, 248, 231, 0.1)",
    },
    color: color.onInverse,
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
  },
  /**
   * The drawer's own close button. It reuses `menuButton` for the box, but must
   * override the `display: none` that hides the *header's* trigger from 80rem
   * up - otherwise, during the frame between a resize past 80rem and the effect
   * that closes the drawer, the only way out of an open drawer is invisible.
   */
  drawerClose: {
    display: "inline-flex",
  },
  menuIcon: {
    width: "1.35rem",
    height: "1.35rem",
  },

  /*
   * `<dialog>` styling. Note the absence of a `display` declaration: setting one
   * here would override the UA's `display: none` for the closed state and leave
   * the drawer permanently on screen. Everything else has to be reset because
   * the UA stylesheet centres dialogs with `margin: auto` and a border.
   */
  drawer: {
    position: "fixed",
    insetBlock: 0,
    insetInlineStart: "auto",
    insetInlineEnd: 0,
    zIndex: layer.drawer,
    margin: 0,
    padding: 0,
    borderWidth: 0,
    // Never wider than the viewport on a 320px phone, never a full-bleed wall
    // on a tablet.
    width: "min(22rem, 92vw)",
    maxWidth: "100vw",
    height: "100%",
    maxHeight: "100dvh",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.35)",
    overscrollBehavior: "contain",
    "::backdrop": {
      backgroundColor: "rgba(1, 52, 5, 0.6)",
    },
  },
  drawerInner: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    // Scrolls internally when a short landscape phone cannot show all the
    // items at once.
    overflowY: "auto",
    paddingBlock: space.md,
    paddingInline: space.md,
    paddingInlineEnd: `max(${space.md}, env(safe-area-inset-right))`,
  },
  drawerHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
    marginBlockEnd: space.md,
  },
  drawerTitle: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accent,
  },
  drawerNav: {
    display: "flex",
    flexDirection: "column",
  },
  drawerLink: {
    display: "flex",
    alignItems: "center",
    minHeight: "3rem",
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.borderInverse,
    fontSize: font.sizeLg,
    fontWeight: font.weightSemibold,
    textDecoration: "none",
    color: {
      default: color.onInverse,
      ":hover": color.accent,
    },
  },
  drawerLinkActive: {
    color: color.accent,
  },
  drawerFooter: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
    marginBlockStart: space.lg,
  },
  drawerCta: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "3rem",
    backgroundColor: color.accent,
    color: color.onAccent,
    fontSize: font.sizeSm,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textDecoration: "none",
  },
  drawerMotto: {
    margin: 0,
    fontFamily: font.display,
    fontStyle: "italic",
    fontSize: font.sizeLg,
    color: color.onInverseSubtle,
  },
});

export const SiteHeader = ({
  activeHref = "/",
  items = NAV_ITEMS,
  admissionsHref = "/admissions",
  crestSrc = "/logo.png",
}: {
  activeHref?: string;
  items?: readonly NavItem[];
  admissionsHref?: string;
  crestSrc?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to the control that opened the drawer - without this a
    // keyboard user is dumped back at the top of the document.
    menuButtonRef.current?.focus();
  }, []);

  // Close the drawer if the viewport grows past the desktop breakpoint while it
  // is open, otherwise the scroll lock persists with no visible drawer.
  useEffect(() => {
    if (!open) {
      return;
    }
    const query = matchMedia("(min-width: 80rem)");
    const onChange = () => {
      if (query.matches) {
        setOpen(false);
      }
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [open]);

  // Lock background scroll while the drawer is open. The dialog itself makes
  // the rest of the page inert, but it does not stop the body scrolling behind.
  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  /*
   * `showModal()` rather than a `role="dialog"` div: the browser gives us focus
   * containment, Escape-to-close, the top layer and `inert` background content
   * for free, and it behaves correctly with every screen reader. A hand-rolled
   * Tab trap is the classic source of "keyboard users can tab out of the menu".
   */
  useEffect(() => {
    const node = drawerRef.current;
    if (!node) {
      return;
    }
    if (open && !node.open) {
      node.showModal();
    } else if (!open && node.open) {
      node.close();
    }
  }, [open]);

  return (
    <>
      <header
        {...stylex.props(styles.header, scrolled && styles.headerScrolled)}
      >
        <div {...stylex.props(styles.inner)}>
          <a href="/" {...stylex.props(styles.brand)}>
            <img
              alt={`${COLLEGE_NAME} crest`}
              height={52}
              src={crestSrc}
              width={52}
              {...stylex.props(styles.crest)}
            />
            <span {...stylex.props(styles.brandText)}>
              <span {...stylex.props(styles.brandName)}>{COLLEGE_NAME}</span>
              <span {...stylex.props(styles.brandPlace)}>
                {COLLEGE_LOCATION}
              </span>
            </span>
          </a>

          <nav aria-label="Primary" {...stylex.props(styles.desktopNav)}>
            {items.map((item) => {
              const isActive = item.href === activeHref;
              return (
                <a
                  aria-current={isActive ? "page" : undefined}
                  href={item.href}
                  key={item.id}
                  {...stylex.props(
                    styles.navLink,
                    isActive && styles.navLinkActive
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <a href={admissionsHref} {...stylex.props(styles.cta)}>
            Admissions
          </a>

          <button
            aria-controls={drawerId}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => (open ? close() : setOpen(true))}
            ref={menuButtonRef}
            type="button"
            {...stylex.props(styles.menuButton)}
          >
            {open ? (
              <X aria-hidden="true" {...stylex.props(styles.menuIcon)} />
            ) : (
              <Menu aria-hidden="true" {...stylex.props(styles.menuIcon)} />
            )}
          </button>
        </div>
      </header>

      {/*
        oxlint-disable jsx-a11y/click-events-have-key-events,
        jsx-a11y/no-noninteractive-element-interactions --
        a modal <dialog> is interactive and already closes on Escape through
        onCancel below. The click handler only adds click-outside-to-close,
        which has no keyboard equivalent by definition.
      */}
      <dialog
        aria-label="Site menu"
        id={drawerId}
        onCancel={(event) => {
          // Escape fires `cancel`; take it over so React state stays in sync
          // and focus returns to the menu button.
          event.preventDefault();
          close();
        }}
        onClick={(event) => {
          // A click landing on the dialog element itself is a click on the
          // backdrop - the content sits in child elements.
          if (event.target === drawerRef.current) {
            close();
          }
        }}
        ref={drawerRef}
        {...stylex.props(styles.drawer)}
      >
        <div {...stylex.props(styles.drawerInner)}>
          <div {...stylex.props(styles.drawerHead)}>
            <p {...stylex.props(styles.drawerTitle)}>Menu</p>
            <button
              aria-label="Close menu"
              onClick={close}
              type="button"
              {...stylex.props(styles.menuButton, styles.drawerClose)}
            >
              <X aria-hidden="true" {...stylex.props(styles.menuIcon)} />
            </button>
          </div>

          <nav aria-label="Mobile" {...stylex.props(styles.drawerNav)}>
            {items.map((item) => {
              const isActive = item.href === activeHref;
              return (
                <a
                  aria-current={isActive ? "page" : undefined}
                  href={item.href}
                  key={item.id}
                  onClick={close}
                  {...stylex.props(
                    styles.drawerLink,
                    isActive && styles.drawerLinkActive
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div {...stylex.props(styles.drawerFooter)}>
            <a href={admissionsHref} {...stylex.props(styles.drawerCta)}>
              Admissions
            </a>
            <p {...stylex.props(styles.drawerMotto)}>{MOTTO}</p>
          </div>
        </div>
      </dialog>
      {/* oxlint-enable jsx-a11y/click-events-have-key-events,
          jsx-a11y/no-noninteractive-element-interactions */}
    </>
  );
};
