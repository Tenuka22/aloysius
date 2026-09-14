import * as stylex from "@stylexjs/stylex";
import { Bell, Menu, Search, X } from "lucide-react";
import type { RefObject } from "react";

import type { NavItem, ScreenId } from "../../content/cms";
import { COLLEGE_NAME } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import {
  color,
  font,
  layer,
  motionToken,
  space,
} from "../../tokens/tokens.stylex";
import { VisuallyHidden } from "../primitives/layout";

/**
 * The admin chrome: brand block, nav list, account footer, and the top bar.
 *
 * The nav is authored *once* and rendered into two containers - a permanent
 * column from 80rem up, and a modal drawer below it. Rendering the same markup
 * twice into the DOM would duplicate every link for a screen reader, so the
 * drawer and the column are mutually exclusive: only one is mounted at a time,
 * decided by a media query the shell listens to.
 */

const MIN_TARGET = "2.75rem";

const styles = stylex.create({
  /* ------------------------------------------------------------- sidebar */
  sidebar: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
  },
  sidebarDocked: {
    // Its own scroll context, so a long nav scrolls without moving the page.
    position: "sticky",
    insetBlockStart: 0,
    height: "100dvh",
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
  brandRole: {
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
    // Only the docked sidebar scrolls internally; in the drawer the whole
    // panel scrolls, which feels right on a phone.
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
    // The active marker is an always-present transparent border, so switching
    // screens never shifts the label by 3px.
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
    paddingInline: space["2xs"],
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: color.borderInverse,
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
    textDecoration: "none",
    whiteSpace: "nowrap",
    cursor: "pointer",
    transitionProperty: "color, border-color",
    transitionDuration: motionToken.fast,
  },
  accountButtonDanger: {
    borderColor: {
      default: color.borderInverse,
      ":hover": color.dangerBright,
    },
    color: {
      default: color.onInverse,
      ":hover": color.dangerBright,
    },
  },

  /* -------------------------------------------------------------- drawer */
  drawer: {
    position: "fixed",
    insetBlock: 0,
    insetInlineStart: 0,
    insetInlineEnd: "auto",
    zIndex: layer.drawer,
    margin: 0,
    padding: 0,
    borderWidth: 0,
    width: "min(19rem, 88vw)",
    maxWidth: "100vw",
    height: "100%",
    maxHeight: "100dvh",
    backgroundColor: color.surfaceInverse,
    overscrollBehavior: "contain",
    "::backdrop": {
      backgroundColor: "rgba(1, 52, 5, 0.6)",
    },
  },
  drawerBody: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflowY: "auto",
  },
  drawerClose: {
    position: "absolute",
    insetBlockStart: space["2xs"],
    insetInlineEnd: space["2xs"],
    zIndex: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: MIN_TARGET,
    height: MIN_TARGET,
    borderWidth: 0,
    backgroundColor: "transparent",
    color: color.onInverse,
    cursor: "pointer",
  },

  /* -------------------------------------------------------------- topbar */
  topbar: {
    position: "sticky",
    insetBlockStart: 0,
    zIndex: layer.header,
    display: "flex",
    alignItems: "center",
    gap: space["2xs"],
    minHeight: "4rem",
    paddingInline: {
      default: space.sm,
      [bp.lg]: space.lg,
    },
    backgroundColor: color.surface,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  menuButton: {
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
  crumb: {
    display: "flex",
    minWidth: 0,
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceSubtle,
  },
  crumbRoot: {
    // The "CMS /" prefix is decoration; below 40rem the screen name alone is
    // the useful half and the prefix would eat the whole bar.
    display: {
      default: "none",
      [bp.md]: "inline",
    },
  },
  crumbCurrent: {
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
  search: {
    // Hidden below 64rem: a 10rem search box that cannot show its own results
    // is worse than the icon-only button that replaces it.
    display: {
      default: "none",
      [bp.xl]: "block",
    },
    width: "14rem",
    minHeight: MIN_TARGET,
    paddingBlock: space["2xs"],
    paddingInline: space.xs,
    backgroundColor: color.surfaceSunken,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    color: color.onSurface,
    fontFamily: font.body,
    fontSize: "1rem",
  },
  iconButton: {
    position: "relative",
    display: "inline-flex",
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
  },
  searchButton: {
    display: {
      default: "inline-flex",
      [bp.xl]: "none",
    },
  },
  bellDot: {
    position: "absolute",
    insetBlockStart: "0.35rem",
    insetInlineEnd: "0.35rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "1.05rem",
    height: "1.05rem",
    paddingInline: "0.2rem",
    borderRadius: "999px",
    backgroundColor: color.danger,
    color: color.onInverse,
    fontSize: "0.625rem",
    fontWeight: font.weightExtrabold,
    lineHeight: 1,
  },
  icon: {
    width: "1.15rem",
    height: "1.15rem",
  },
  newButton: {
    display: "inline-flex",
    flexShrink: 0,
    alignItems: "center",
    minHeight: MIN_TARGET,
    paddingInline: {
      default: space.xs,
      [bp.lg]: space.md,
    },
    borderWidth: 0,
    backgroundColor: {
      default: color.surfaceInverse,
      ":hover": color.surfaceInverseDeep,
    },
    color: color.accentOnInverse,
    fontFamily: font.body,
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    cursor: "pointer",
  },
  newLabelLong: {
    display: {
      default: "none",
      [bp.lg]: "inline",
    },
  },
  newLabelShort: {
    display: {
      default: "inline",
      [bp.lg]: "none",
    },
  },
});

const initialsOf = (name: string) =>
  name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const SidebarContent = ({
  items,
  current,
  onSelect,
  userName,
  userRole,
  crestSrc,
  docked,
}: {
  items: readonly NavItem[];
  current: ScreenId;
  onSelect: (id: ScreenId) => void;
  userName: string;
  userRole: string;
  crestSrc: string;
  docked: boolean;
}) => (
  <div {...stylex.props(styles.sidebar, docked && styles.sidebarDocked)}>
    <a href="/cms" {...stylex.props(styles.brand)}>
      <img
        alt=""
        aria-hidden="true"
        height={40}
        src={crestSrc}
        width={40}
        {...stylex.props(styles.crest)}
      />
      <span {...stylex.props(styles.brandText)}>
        <span {...stylex.props(styles.brandName)}>{COLLEGE_NAME}</span>
        <span {...stylex.props(styles.brandRole)}>Content manager</span>
      </span>
    </a>

    <nav aria-label="CMS sections" {...stylex.props(styles.nav)}>
      {items.map((item) => {
        const isActive = item.id === current;
        return (
          <button
            // `aria-current` rather than styling alone: the active screen has to
            // be announced, not just coloured.
            aria-current={isActive ? "page" : undefined}
            key={item.id}
            onClick={() => onSelect(item.id)}
            type="button"
            {...stylex.props(styles.navItem, isActive && styles.navItemActive)}
          >
            <span aria-hidden="true" {...stylex.props(styles.navNum)}>
              {item.num}
            </span>
            <span {...stylex.props(styles.navLabel)}>{item.label}</span>
            {typeof item.count === "number" ? (
              // The digit is shown; the phrase is what gets announced. Relying
              // on a leading space inside the hidden span does not survive JSX
              // whitespace collapsing - it reads as "Pages9entries".
              <span {...stylex.props(styles.navCount)}>
                <span aria-hidden="true">{item.count}</span>
                <VisuallyHidden>{`${item.count} entries`}</VisuallyHidden>
              </span>
            ) : null}
          </button>
        );
      })}
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
        <a href="/" {...stylex.props(styles.accountButton)}>
          View site
        </a>
        <button
          type="button"
          {...stylex.props(styles.accountButton, styles.accountButtonDanger)}
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
);

export const SidebarDrawer = ({
  drawerRef,
  onClose,
  children,
}: {
  drawerRef: RefObject<HTMLDialogElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <dialog
    aria-label="CMS navigation"
    onCancel={(event) => {
      event.preventDefault();
      onClose();
    }}
    ref={drawerRef}
    {...stylex.props(styles.drawer)}
  >
    <button
      aria-label="Close navigation"
      onClick={onClose}
      type="button"
      {...stylex.props(styles.drawerClose)}
    >
      <X aria-hidden="true" {...stylex.props(styles.icon)} />
    </button>
    <div {...stylex.props(styles.drawerBody)}>{children}</div>
  </dialog>
);

export const Topbar = ({
  title,
  onOpenNav,
  menuButtonRef,
  navOpen,
}: {
  title: string;
  onOpenNav: () => void;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  navOpen: boolean;
}) => (
  <div {...stylex.props(styles.topbar)}>
    <button
      aria-expanded={navOpen}
      aria-label="Open navigation"
      onClick={onOpenNav}
      ref={menuButtonRef}
      type="button"
      {...stylex.props(styles.menuButton)}
    >
      <Menu aria-hidden="true" {...stylex.props(styles.icon)} />
    </button>

    <p {...stylex.props(styles.crumb)}>
      <span aria-hidden="true" {...stylex.props(styles.crumbRoot)}>
        CMS&nbsp;/&nbsp;
      </span>
      <span {...stylex.props(styles.crumbCurrent)}>{title}</span>
    </p>

    <div {...stylex.props(styles.topbarActions)}>
      <input
        aria-label="Search content"
        placeholder="Search content…"
        type="search"
        {...stylex.props(styles.search)}
      />
      <button
        aria-label="Search content"
        type="button"
        {...stylex.props(styles.iconButton, styles.searchButton)}
      >
        <Search aria-hidden="true" {...stylex.props(styles.icon)} />
      </button>
      <button type="button" {...stylex.props(styles.iconButton)}>
        <Bell aria-hidden="true" {...stylex.props(styles.icon)} />
        <span aria-hidden="true" {...stylex.props(styles.bellDot)}>
          3
        </span>
        <VisuallyHidden>Notifications, 3 unread</VisuallyHidden>
      </button>
      {/*
        The visible label shortens to "+ New" on narrow screens, but the
        accessible name stays "New post" at every width - a control whose name
        changes with the viewport is a control users cannot be told about.
      */}
      <button type="button" {...stylex.props(styles.newButton)}>
        <span aria-hidden="true" {...stylex.props(styles.newLabelLong)}>
          + New post
        </span>
        <span aria-hidden="true" {...stylex.props(styles.newLabelShort)}>
          + New
        </span>
        <VisuallyHidden>New post</VisuallyHidden>
      </button>
    </div>
  </div>
);
