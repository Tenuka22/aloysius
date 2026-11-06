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

const rise = stylex.keyframes({
  from: { opacity: 0, transform: "translateY(18px)" },
  to: { opacity: 1, transform: "translateY(0)" },
});

const EASE_OUT = "cubic-bezier(0.2, 0.7, 0.2, 1)";

const styles = stylex.create({
  header: {
    position: "sticky",
    insetBlockStart: 0,
    zIndex: layer.header,
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    boxShadow: "none",
    transitionProperty: "box-shadow, background-color, backdrop-filter",
    transitionDuration: "320ms",
    transitionTimingFunction: EASE_OUT,
    // Respect the notch in landscape on iPhone.
    paddingInline: space.gutter,
  },
  /**
   * Over the home page's video.
   *
   * Wide screens (the full link row): the header is transparent, and turns into
   * the frosted green bar once the page scrolls.
   *
   * Phones and tablets (menu button): the header is invisible and only the
   * capsule inside it (`innerCapsule`) is drawn, inset from the screen edges, so
   * nothing runs edge to edge across the footage.
   */
  headerOverlay: {
    backgroundColor: "transparent",
    boxShadow: "none",
    paddingBlockStart: {
      default: space.xs,
      [bp.xxl]: 0,
    },
  },
  headerOverlayScrolled: {
    backgroundColor: {
      default: "transparent",
      [bp.xxl]: "rgba(1, 52, 5, 0.86)",
    },
    backdropFilter: {
      default: "none",
      [bp.xxl]: "blur(16px) saturate(1.5)",
    },
  },
  overlayText: {
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.8), 0 0 12px rgba(0, 0, 0, 0.45)",
  },
  innerCapsule: {
    backgroundColor: {
      default: "rgba(6, 36, 9, 0.52)",
      [bp.xxl]: "transparent",
    },
    backdropFilter: {
      default: "blur(18px) saturate(1.6)",
      [bp.xxl]: "none",
    },
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: "rgba(255, 248, 231, 0.18)",
      [bp.xxl]: "transparent",
    },
    borderRadius: {
      default: "1.75rem",
      [bp.md]: "999px",
      [bp.xxl]: 0,
    },
    paddingInlineStart: {
      default: space.xs,
      [bp.xxl]: 0,
    },
    paddingInlineEnd: {
      default: space.xs,
      [bp.xxl]: 0,
    },
    transitionProperty: "background-color, border-color",
    transitionDuration: "320ms",
  },
  innerCapsuleScrolled: {
    backgroundColor: {
      default: "rgba(6, 36, 9, 0.82)",
      [bp.xxl]: "transparent",
    },
    borderColor: {
      default: "rgba(255, 178, 3, 0.32)",
      [bp.xxl]: "transparent",
    },
  },
  /** Frosted deep-green glass once the page is moving underneath it. */
  headerScrolled: {
    backgroundColor: "rgba(1, 52, 5, 0.86)",
    backdropFilter: "blur(16px) saturate(1.5)",
    boxShadow: "none",
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
      [bp.lg]: "5rem",
    },
    transitionProperty: "min-height",
    transitionDuration: "320ms",
    transitionTimingFunction: EASE_OUT,
  },
  innerCompact: {
    minHeight: {
      default: "3.5rem",
      [bp.lg]: "4.25rem",
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
      default: "2.5rem",
      [bp.lg]: "3.5rem",
    },
    width: "auto",
    objectFit: "contain",
    filter: "drop-shadow(0 2px 6px rgba(0, 0, 0, 0.35))",
    transitionProperty: "height",
    transitionDuration: "320ms",
    transitionTimingFunction: EASE_OUT,
  },
  crestCompact: {
    height: {
      default: "2.25rem",
      [bp.lg]: "2.75rem",
    },
  },
  /** A hairline between the crest and the name, as on a letterhead. */
  brandRule: {
    flexShrink: 0,
    width: space.px,
    alignSelf: "stretch",
    marginBlock: space["2xs"],
    marginInline: space["2xs"],
    backgroundColor: "rgba(255, 248, 231, 0.28)",
    display: {
      default: "none",
      [bp.sm]: "block",
    },
  },
  brandText: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    lineHeight: font.leadingSnug,
    overflowWrap: "break-word",
  },
  brandName: {
    fontFamily: font.display,
    fontSize: {
      default: font.sizeSm,
      [bp.sm]: font.sizeMd,
      [bp.lg]: font.sizeXl,
    },
    fontWeight: font.weightBold,
    letterSpacing: {
      default: "0.04em",
      [bp.lg]: "0.06em",
    },
    lineHeight: 1.1,
    textTransform: "uppercase",
  },
  brandPlace: {
    marginBlockStart: "0.2rem",
    // Never wraps: a second line of tracked capitals under the name is what made
    // the bar look broken on a 320px phone.
    whiteSpace: "nowrap",
    fontSize: {
      default: "0.625rem",
      [bp.sm]: font.size2xs,
    },
    fontWeight: font.weightSemibold,
    letterSpacing: {
      default: "0.18em",
      [bp.sm]: "0.32em",
    },
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
      [bp.xxl]: space.md,
    },
  },
  navLink: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    minHeight: "2.75rem",
    paddingInline: space["3xs"],
    fontSize: font.sizeMd,
    fontWeight: font.weightMedium,
    letterSpacing: "0.04em",
    textDecoration: "none",
    whiteSpace: "nowrap",
    color: {
      default: "rgba(255, 248, 231, 0.92)",
      ":hover": color.onInverse,
    },
    // The underline is a background that grows from the centre, so it can never
    // change the box and shift the links beside it.
    backgroundImage: `linear-gradient(${color.accent}, ${color.accent})`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center calc(100% - 0.55rem)",
    backgroundSize: {
      default: "0% 2px",
      ":hover": "100% 2px",
    },
    transitionProperty: "color, background-size",
    transitionDuration: "360ms",
    transitionTimingFunction: EASE_OUT,
  },
  navLinkActive: {
    color: color.accent,
    fontWeight: font.weightSemibold,
    backgroundSize: "100% 2px",
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
    fontSize: font.sizeMd,
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
    borderColor: {
      default: "rgba(255, 248, 231, 0.3)",
      ":hover": color.accent,
    },
    borderRadius: "999px",
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(255, 178, 3, 0.12)",
    },
    transitionProperty: "border-color, background-color",
    transitionDuration: "240ms",
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
    inset: 0,
    zIndex: layer.drawer,
    margin: 0,
    padding: 0,
    borderWidth: 0,
    // The designer's full-screen menu: it covers the page rather than sliding
    // over part of it, so there is nothing behind it to mis-tap.
    width: "100%",
    maxWidth: "100vw",
    height: "100%",
    maxHeight: "100dvh",
    overflow: "hidden",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    overscrollBehavior: "contain",
    "::backdrop": {
      backgroundColor: "rgba(1, 52, 5, 0.6)",
    },
  },
  // The watermark bleeds off the edge on purpose; clipping it in its own box
  // means it adds nothing to the menu's scrollable width.
  drawerWatermarkClip: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
  },
  drawerWatermark: {
    position: "absolute",
    insetInlineEnd: "-7rem",
    insetBlockEnd: "-5.5rem",
    height: "26rem",
    width: "auto",
    opacity: 0.07,
    pointerEvents: "none",
  },
  drawerCrest: {
    height: "2.5rem",
    width: "auto",
  },
  drawerInner: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    // Scrolls internally when a short landscape phone cannot show all the
    // items at once.
    overflowY: "auto",
    // The watermark deliberately bleeds off the right edge. Without this the
    // overflow made the whole menu scrollable sideways, and focusing the close
    // button scrolled the links out of view.
    overflowX: "hidden",
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
  drawerNav: {
    display: "flex",
    flexDirection: "column",
    // Centred in the space between the header row and the footer, as designed.
    marginBlock: "auto",
    paddingInline: space.sm,
  },
  drawerLink: {
    animationName: {
      default: rise,
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    animationDuration: "560ms",
    animationTimingFunction: EASE_OUT,
    animationFillMode: "both",
    display: "flex",
    alignItems: "baseline",
    gap: space.sm,
    minHeight: "3rem",
    paddingBlock: space["2xs"],
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "rgba(255, 248, 231, 0.1)",
    textDecoration: "none",
    color: {
      default: color.onInverse,
      ":hover": color.accent,
    },
  },
  drawerNumber: {
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    letterSpacing: "0.12em",
    color: "rgba(255, 248, 231, 0.55)",
  },
  drawerNumberActive: {
    color: color.accent,
  },
  drawerLabel: {
    fontFamily: font.display,
    fontSize: "clamp(1.75rem, 1.4rem + 1.8vw, 2.25rem)",
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
  },
  drawerLinkActive: {
    color: color.accent,
  },
  drawerFooter: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
    marginBlockStart: space.lg,
    paddingInline: space.sm,
  },
  drawerCta: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "3rem",
    backgroundColor: color.accent,
    color: color.onAccent,
    fontSize: font.sizeMd,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textDecoration: "none",
  },
  drawerMotto: {
    margin: 0,
    textAlign: "center",
    fontSize: font.size2xs,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: "rgba(255, 248, 231, 0.6)",
  },
});

export const SiteHeader = ({
  activeHref = "/",
  items = NAV_ITEMS,
  extraNavItems,
  crestSrc = "/logo.png",
  overlay = false,
}: {
  overlay?: boolean;
  activeHref?: string;
  items?: readonly NavItem[];
  extraNavItems?: readonly NavItem[];
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
    // Feature-detected for the same reason as in `Reveal`: where `matchMedia`
    // is missing this is a lost convenience, not a reason to throw out of the
    // effect and tear the header down.
    if (!open || typeof matchMedia !== "function") {
      return;
    }
    const query = matchMedia("(min-width: 96rem)");
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

  const allItems = extraNavItems ? [...items, ...extraNavItems] : items;

  return (
    <>
      <header
        {...stylex.props(
          styles.header,
          !overlay && scrolled && styles.headerScrolled,
          overlay && styles.headerOverlay,
          overlay && scrolled && styles.headerOverlayScrolled,
          overlay && !scrolled && styles.overlayText
        )}
      >
        <div
          {...stylex.props(
            styles.inner,
            overlay && styles.innerCapsule,
            overlay && scrolled && styles.innerCapsuleScrolled,
            scrolled && styles.innerCompact
          )}
        >
          <a href="/" {...stylex.props(styles.brand)}>
            <img
              alt={`${COLLEGE_NAME} crest`}
              height={52}
              src={crestSrc}
              width={52}
              {...stylex.props(styles.crest, scrolled && styles.crestCompact)}
            />
            <span aria-hidden="true" {...stylex.props(styles.brandRule)} />
            <span {...stylex.props(styles.brandText)}>
              <span {...stylex.props(styles.brandName)}>{COLLEGE_NAME}</span>
              <span {...stylex.props(styles.brandPlace)}>
                {COLLEGE_LOCATION}
              </span>
            </span>
          </a>

          <nav aria-label="Primary" {...stylex.props(styles.desktopNav)}>
            {allItems.map((item) => {
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

          {/*
            No Admissions call to action here any more. It pointed at the
            College's own admissions subdomain, which this site does not own,
            so it was the one item in the bar that left the product - and it
            sat after "Contact" as if it were another page of this site. The
            footer's "Visit the College" band still carries it, which is where
            a prospective applicant is actually being asked.
          */}

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
        <div data-lenis-prevent {...stylex.props(styles.drawerInner)}>
          <div aria-hidden="true" {...stylex.props(styles.drawerWatermarkClip)}>
            <img
              alt=""
              decoding="async"
              loading="lazy"
              src={crestSrc}
              {...stylex.props(styles.drawerWatermark)}
            />
          </div>
          <div {...stylex.props(styles.drawerHead)}>
            <img
              alt=""
              aria-hidden="true"
              decoding="async"
              loading="lazy"
              src={crestSrc}
              {...stylex.props(styles.drawerCrest)}
            />
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
            {allItems.map((item, index) => {
              const isActive = item.href === activeHref;
              const linkProps = stylex.props(
                styles.drawerLink,
                isActive && styles.drawerLinkActive
              );
              return (
                <a
                  aria-current={isActive ? "page" : undefined}
                  href={item.href}
                  key={item.id}
                  onClick={close}
                  {...linkProps}
                  style={{
                    ...linkProps.style,
                    animationDelay: `${120 + index * 55}ms`,
                  }}
                >
                  <span
                    aria-hidden="true"
                    {...stylex.props(
                      styles.drawerNumber,
                      isActive && styles.drawerNumberActive
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span {...stylex.props(styles.drawerLabel)}>
                    {item.label}
                  </span>
                </a>
              );
            })}
          </nav>

          <div {...stylex.props(styles.drawerFooter)}>
            <p {...stylex.props(styles.drawerMotto)}>{MOTTO}</p>
          </div>
        </div>
      </dialog>
      {/* oxlint-enable jsx-a11y/click-events-have-key-events,
          jsx-a11y/no-noninteractive-element-interactions */}
    </>
  );
};
