import * as stylex from "@stylexjs/stylex";
import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";

import { bp } from "../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../tokens/tokens.stylex";

const MIN_TARGET = "2.75rem";

const styles = stylex.create({
  /* ------------------------------------------------------------- layout */
  shell: {
    display: "grid",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xxl]: "16.75rem minmax(0, 1fr)",
    },
    gridTemplateRows: "auto 1fr",
    minHeight: "100dvh",
    backgroundColor: color.surfaceSunken,
    color: color.onSurface,
  },

  /* ------------------------------------------------------------ sidebar */
  sidebar: {
    display: {
      default: "none",
      [bp.xxl]: "flex",
    },
    flexDirection: "column",
    gridColumn: 1,
    gridRow: "1 / -1",
    height: "100dvh",
    position: "sticky",
    top: 0,
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    overflowY: "auto",
    overscrollBehavior: "contain",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
    padding: space.md,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.borderInverse,
    color: color.onInverse,
    textDecoration: "none",
    minWidth: 0,
  },
  crest: {
    flexShrink: 0,
    height: "2.5rem",
    width: "auto",
    objectFit: "contain",
  },
  brandText: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    lineHeight: font.leadingSnug,
  },
  brandName: {
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    overflowWrap: "break-word",
  },
  brandSub: {
    marginBlockStart: "0.1rem",
    fontSize: font.size2xs,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    gap: "1px",
    padding: space["2xs"],
    overflowY: "auto",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
    width: "100%",
    minHeight: MIN_TARGET,
    paddingBlock: space["2xs"],
    paddingInline: space.xs,
    borderWidth: 0,
    borderInlineStartWidth: "3px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: "transparent",
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(255, 248, 231, 0.08)",
    },
    color: color.onInverseMuted,
    fontFamily: font.body,
    fontSize: font.sizeSm,
    fontWeight: font.weightSemibold,
    textAlign: "start",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    transitionProperty: "background-color, color",
    transitionDuration: motionToken.fast,
    textDecoration: "none",
  },
  navItemActive: {
    backgroundColor: "rgba(255, 178, 3, 0.14)",
    borderInlineStartColor: color.accent,
    color: color.accentOnInverse,
  },
  navNum: {
    flexShrink: 0,
    width: "1.4rem",
    fontFamily: font.mono,
    fontSize: font.size2xs,
    opacity: 0.65,
  },
  navLabel: {
    flex: 1,
    minWidth: 0,
    overflowWrap: "break-word",
  },
  navCount: {
    flexShrink: 0,
    paddingBlock: "0.15rem",
    paddingInline: space["3xs"],
    backgroundColor: "rgba(255, 178, 3, 0.18)",
    color: color.accentOnInverse,
    fontFamily: font.mono,
    fontSize: font.size2xs,
  },

  /* --------------------------------------------------------- account */
  account: {
    padding: space.md,
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.borderInverse,
  },
  accountRow: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
    minWidth: 0,
  },
  avatar: {
    display: "flex",
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    width: "2.375rem",
    height: "2.375rem",
    borderRadius: "50%",
    backgroundColor: color.accent,
    color: color.onAccent,
    fontSize: font.sizeSm,
    fontWeight: font.weightExtrabold,
  },
  accountText: {
    minWidth: 0,
    lineHeight: font.leadingSnug,
  },
  accountName: {
    margin: 0,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    overflowWrap: "break-word",
  },
  accountRole: {
    margin: 0,
    fontSize: font.size2xs,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  accountActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
    marginBlockStart: space.sm,
  },
  accountButton: {
    display: "inline-flex",
    flex: "1 1 7rem",
    alignItems: "center",
    justifyContent: "center",
    minHeight: MIN_TARGET,
    paddingBlockStart: space["2xs"],
    paddingBlockEnd: space["2xs"],
    paddingInlineStart: space.xs,
    paddingInlineEnd: space.xs,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: {
      default: "rgba(255, 248, 231, 0.22)",
      ":hover": color.accent,
    },
    backgroundColor: "transparent",
    color: {
      default: color.onInverse,
      ":hover": color.accent,
    },
    fontFamily: font.body,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    textAlign: "center",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    transitionProperty: "color, border-color",
    transitionDuration: motionToken.fast,
    textDecoration: "none",
  },
  accountButtonDanger: {
    borderColor: {
      default: "rgba(255, 248, 231, 0.22)",
      ":hover": color.dangerBright,
    },
    color: {
      default: color.onInverse,
      ":hover": color.dangerBright,
    },
  },

  /* ------------------------------------------------------------ drawer */
  drawer: {
    position: "fixed",
    insetInlineStart: 0,
    insetBlockStart: 0,
    width: "min(19rem, 88vw)",
    height: "100%",
    maxHeight: "100dvh",
    borderWidth: 0,
    padding: 0,
    margin: 0,
    zIndex: 20,
    "::backdrop": {
      backgroundColor: "rgba(1, 52, 5, 0.6)",
    },
  },
  drawerInner: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    overflowY: "auto",
    overscrollBehavior: "contain",
  },
  drawerClose: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBlock: space.sm,
    paddingInline: space.md,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.borderInverse,
  },
  drawerBody: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflowY: "auto",
  },

  /* ------------------------------------------------------------ topbar */
  topbar: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
    gridColumn: {
      default: 1,
      [bp.xxl]: 2,
    },
    gridRow: 1,
    height: "4rem",
    paddingInline: {
      default: space.sm,
      [bp.lg]: space.lg,
    },
    backgroundColor: color.surface,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  hamburger: {
    display: {
      default: "inline-flex",
      [bp.xxl]: "none",
    },
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    width: MIN_TARGET,
    height: MIN_TARGET,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(1, 52, 5, 0.06)",
    },
    color: color.onSurface,
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
  },
  breadcrumb: {
    display: "flex",
    minWidth: 0,
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceSubtle,
  },
  breadcrumbPrefix: {
    display: {
      default: "none",
      [bp.md]: "inline",
    },
  },
  breadcrumbCurrent: {
    color: color.onSurface,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  topbarActions: {
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
    marginInlineStart: "auto",
  },
  icon: {
    width: "1.15rem",
    height: "1.15rem",
  },

  /* ----------------------------------------------------------- content */
  content: {
    display: "flex",
    flexDirection: "column",
    gridColumn: {
      default: 1,
      [bp.xxl]: 2,
    },
    gridRow: 2,
    minWidth: 0,
  },
  main: {
    paddingBlock: space.md,
    paddingInline: {
      default: space.sm,
      [bp.lg]: space.lg,
    },
    paddingInlineStart: `max(${space.sm}, env(safe-area-inset-left))`,
    paddingInlineEnd: `max(${space.sm}, env(safe-area-inset-right))`,
    paddingBlockEnd: `max(${space["2xl"]}, env(safe-area-inset-bottom))`,
    outline: {
      default: null,
      ":focus": "none",
    },
  },
  skipLink: {
    position: "absolute",
    insetBlockStart: space["2xs"],
    insetInlineStart: space["2xs"],
    zIndex: 90,
    transform: {
      default: "translateY(-250%)",
      ":focus": "translateY(0)",
    },
    padding: space["2xs"],
    backgroundColor: color.accent,
    color: color.onAccent,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    textDecoration: "none",
  },
});

const initialsOf = (name: string) =>
  name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

/* ------------------------------------------------------------------ types */

export interface ShellNavItem {
  num: string;
  label: string;
  href: string;
  active: boolean;
  count?: number;
}

export interface ShellProps {
  children: ReactNode;
  /** Topbar breadcrumb label. */
  title: string;
  /** Optional prefix shown before the title in the topbar. */
  eyebrow?: string;
  /** Actions slot rendered in the topbar (right side). */
  actions?: ReactNode;
  /** Navigation items shown in the sidebar. */
  navItems: readonly ShellNavItem[];
  /** Brand label shown under the crest in the sidebar. */
  brandName: string;
  /** Optional secondary brand label (e.g. "Content manager"). */
  brandSub?: string;
  /** Crest/logo image URL. */
  crestSrc: string;
  /** Display name for the account footer. */
  userName: string;
  /** Role label for the account footer. */
  userRole: string;
  /** Called when the user clicks a nav item. Receives the target href. */
  onNavigate?: (href: string) => void;
  /** Called when the user clicks "Sign out". */
  onSignOut?: () => void;
  /** Base path used in skip link (defaults to "main"). */
  mainId?: string;
  /** Optional class applied to the <main> element. */
  mainClassName?: string;
}

/* ------------------------------------------------------------------ shell */

export const Shell = ({
  children,
  title,
  eyebrow,
  actions,
  navItems,
  brandName,
  brandSub,
  crestSrc,
  userName,
  userRole,
  onNavigate,
  onSignOut,
  mainId = "main",
}: ShellProps) => {
  const drawerRef = useRef<HTMLDialogElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = () => {
    if (drawerRef.current) {
      drawerRef.current.close();
      setDrawerOpen(false);
    }
  };

  const sidebarBody = (
    <>
      <a href="/" {...stylex.props(styles.brand)}>
        <img
          alt=""
          aria-hidden="true"
          height={40}
          src={crestSrc}
          width={40}
          {...stylex.props(styles.crest)}
        />
        <span {...stylex.props(styles.brandText)}>
          <span {...stylex.props(styles.brandName)}>{brandName}</span>
          {brandSub ? (
            <span {...stylex.props(styles.brandSub)}>{brandSub}</span>
          ) : null}
        </span>
      </a>

      <nav aria-label={`${brandName} sections`} {...stylex.props(styles.nav)}>
        {navItems.map((item) => (
          <a
            aria-current={item.active ? "page" : undefined}
            href={item.href}
            key={item.href}
            onClick={(e) => {
              e.preventDefault();
              onNavigate?.(item.href);
              closeDrawer();
            }}
            type="button"
            {...stylex.props(
              styles.navItem,
              item.active && styles.navItemActive
            )}
          >
            <span aria-hidden="true" {...stylex.props(styles.navNum)}>
              {item.num}
            </span>
            <span {...stylex.props(styles.navLabel)}>{item.label}</span>
            {typeof item.count === "number" ? (
              <span {...stylex.props(styles.navCount)}>{item.count}</span>
            ) : null}
          </a>
        ))}
      </nav>

      <div {...stylex.props(styles.account)}>
        <div {...stylex.props(styles.accountRow)}>
          <span aria-hidden="true" {...stylex.props(styles.avatar)}>
            {initialsOf(userName)}
          </span>
          <div {...stylex.props(styles.accountText)}>
            <p {...stylex.props(styles.accountName)}>{userName}</p>
            <p {...stylex.props(styles.accountRole)}>{userRole}</p>
          </div>
        </div>
        <div {...stylex.props(styles.accountActions)}>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate?.("/");
            }}
            {...stylex.props(styles.accountButton)}
          >
            View site
          </a>
          <button
            onClick={onSignOut}
            type="button"
            {...stylex.props(styles.accountButton, styles.accountButtonDanger)}
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div {...stylex.props(styles.shell)}>
      <a href={`#${mainId}`} {...stylex.props(styles.skipLink)}>
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside {...stylex.props(styles.sidebar)}>{sidebarBody}</aside>

      {/* Mobile drawer */}
      <dialog
        aria-label={`${brandName} navigation`}
        onCancel={(e) => {
          e.preventDefault();
          closeDrawer();
        }}
        onClose={() => setDrawerOpen(false)}
        ref={drawerRef}
        {...stylex.props(styles.drawer)}
      >
        <div {...stylex.props(styles.drawerInner)}>
          <div {...stylex.props(styles.drawerClose)}>
            <button
              aria-label="Close navigation"
              onClick={closeDrawer}
              type="button"
              {...stylex.props(styles.hamburger)}
            >
              <X aria-hidden="true" {...stylex.props(styles.icon)} />
            </button>
          </div>
          <div {...stylex.props(styles.drawerBody)}>{sidebarBody}</div>
        </div>
      </dialog>

      {/* Topbar */}
      <header {...stylex.props(styles.topbar)}>
        <button
          aria-expanded={drawerOpen}
          aria-label="Open navigation"
          onClick={() => {
            setDrawerOpen(true);
            drawerRef.current?.showModal();
          }}
          type="button"
          {...stylex.props(styles.hamburger)}
        >
          <Menu aria-hidden="true" {...stylex.props(styles.icon)} />
        </button>

        <p {...stylex.props(styles.breadcrumb)}>
          {eyebrow ? (
            <span aria-hidden="true" {...stylex.props(styles.breadcrumbPrefix)}>
              {eyebrow}&nbsp;/&nbsp;
            </span>
          ) : null}
          <span {...stylex.props(styles.breadcrumbCurrent)}>{title}</span>
        </p>

        {actions ? (
          <div {...stylex.props(styles.topbarActions)}>{actions}</div>
        ) : null}
      </header>

      {/* Content */}
      <main id={mainId} tabIndex={-1} {...stylex.props(styles.content)}>
        <div {...stylex.props(styles.main)}>{children}</div>
      </main>
    </div>
  );
};
