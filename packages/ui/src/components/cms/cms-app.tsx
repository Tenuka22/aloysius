import * as stylex from "@stylexjs/stylex";
import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { EMPTY_ENTRIES, LIST_ENTRIES, NAV_ITEMS } from "../../content/cms";
import type { Entry, NavItem, ScreenId } from "../../content/cms";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { SidebarContent, SidebarDrawer, Topbar } from "./cms-chrome";
import { CmsButton } from "./cms-primitives";
import { Dashboard } from "./dashboard";
import { HomepageEditor, HomepageEditorActions } from "./homepage-editor";
import { ListScreen } from "./list-screen";
import { Profile } from "./profile";

/** The width at which the sidebar stops being a drawer and docks permanently. */
const DOCK_QUERY = "(min-width: 80rem)";

const styles = stylex.create({
  shell: {
    display: "grid",
    minHeight: "100dvh",
    backgroundColor: color.surfaceSunken,
    color: color.onSurface,
    // One column until the sidebar docks. `minmax(0, 1fr)` on the content
    // track is what stops a wide child (the block list, a long title) from
    // forcing the whole page wider than the viewport.
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xxl]: "16.75rem minmax(0, 1fr)",
    },
  },
  dockedSidebar: {
    display: {
      default: "none",
      [bp.xxl]: "block",
    },
  },
  content: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  screen: {
    paddingBlock: space.md,
    paddingInline: {
      default: space.sm,
      [bp.lg]: space.lg,
    },
    // Safe-area padding for landscape on notched phones, where the content
    // column runs to the physical edge of the display.
    paddingInlineStart: `max(${space.sm}, env(safe-area-inset-left))`,
    paddingInlineEnd: `max(${space.sm}, env(safe-area-inset-right))`,
    paddingBlockEnd: `max(${space["2xl"]}, env(safe-area-inset-bottom))`,
  },
  screenHead: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: space.sm,
    marginBlockEnd: space.md,
  },
  screenTitleWrap: {
    minWidth: 0,
  },
  screenEyebrow: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  screenTitle: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    textWrap: "balance",
  },
  screenNote: {
    margin: 0,
    marginBlockStart: space["3xs"],
    maxWidth: space.measure,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
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
  main: {
    outline: {
      default: null,
      ":focus": "none",
    },
  },
});

const MAIN_ID = "cms-main";

const SCREEN_NOTE: Partial<Record<ScreenId, string>> = {
  dashboard: "Overview of website content and pending work.",
  homepage: "Edit the sections that make up the public homepage.",
  profile: "Account details, role and permissions for the College CMS.",
};

export interface CmsAppProps {
  userName?: string;
  userRole?: string;
  crestSrc?: string;
  /** Screen to open on first render. */
  initialScreen?: ScreenId;
}

/**
 * The drawer's side effects: native <dialog> open/close, closing when the
 * viewport grows past the dock width, and the body scroll lock. Kept out of
 * `CmsApp` so the component body stays readable.
 */
const useNavDrawer = (
  navOpen: boolean,
  drawerRef: RefObject<HTMLDialogElement | null>,
  setNavOpen: (open: boolean) => void
) => {
  // Native <dialog> gives focus containment, Escape-to-close and an inert
  // background for free - all the things a hand-rolled drawer gets wrong.
  useEffect(() => {
    const node = drawerRef.current;
    if (!node) {
      return;
    }
    if (navOpen && !node.open) {
      node.showModal();
    } else if (!navOpen && node.open) {
      node.close();
    }
  }, [navOpen, drawerRef]);

  // Close the drawer if the viewport grows past the dock width while it is
  // open, otherwise the scroll lock persists behind a docked sidebar.
  useEffect(() => {
    if (!navOpen) {
      return;
    }
    const query = matchMedia(DOCK_QUERY);
    const onChange = () => {
      if (query.matches) {
        setNavOpen(false);
      }
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [navOpen, setNavOpen]);

  useEffect(() => {
    if (!navOpen) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [navOpen]);
};

/** Header-level actions, which differ per screen kind. */
const ScreenActions = ({ kind }: { kind?: NavItem["kind"] }) => {
  if (kind === "homepage") {
    return <HomepageEditorActions />;
  }
  if (kind === "list") {
    return <CmsButton tone="primary">+ Add entry</CmsButton>;
  }
  return null;
};

/** Dispatches to the screen matching the active nav item. */
const ScreenBody = ({
  item,
  entries,
  userName,
  userRole,
}: {
  item?: NavItem;
  entries: readonly Entry[];
  userName: string;
  userRole: string;
}) => {
  switch (item?.kind) {
    case "dashboard": {
      return <Dashboard />;
    }
    case "homepage": {
      return <HomepageEditor />;
    }
    case "profile": {
      return <Profile userName={userName} userRole={userRole} />;
    }
    case "list": {
      return <ListScreen entries={entries} noun={item.label.toLowerCase()} />;
    }
    default: {
      return null;
    }
  }
};

/**
 * The CMS shell.
 *
 * Screen state is local. There is no router integration and no data fetching:
 * the backend is being built separately, so every screen renders from the seed
 * content in `content/cms.ts` and every control mutates local state only.
 * Swapping that for oRPC queries is a change inside each screen, not here.
 */
export const CmsApp = ({
  userName = "A. Perera",
  userRole = "Editor — Media Unit",
  crestSrc = "/logo.png",
  initialScreen = "homepage",
}: CmsAppProps) => {
  const [screen, setScreen] = useState<ScreenId>(initialScreen);
  const [navOpen, setNavOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const active = NAV_ITEMS.find((item) => item.id === screen) ?? NAV_ITEMS[0];

  const closeNav = useCallback(() => {
    setNavOpen(false);
    // Focus goes back to the trigger; without this a keyboard user lands at
    // the top of the document every time they close the menu.
    menuButtonRef.current?.focus();
  }, []);

  useNavDrawer(navOpen, drawerRef, setNavOpen);

  const select = useCallback(
    (id: ScreenId) => {
      setScreen(id);
      if (navOpen) {
        closeNav();
      }
    },
    [navOpen, closeNav]
  );

  const sidebar = (docked: boolean) => (
    <SidebarContent
      crestSrc={crestSrc}
      current={screen}
      docked={docked}
      items={NAV_ITEMS}
      onSelect={select}
      userName={userName}
      userRole={userRole}
    />
  );

  const entries = LIST_ENTRIES[screen] ?? EMPTY_ENTRIES;

  return (
    <div {...stylex.props(styles.shell)}>
      <a href={`#${MAIN_ID}`} {...stylex.props(styles.skipLink)}>
        Skip to content
      </a>

      <div {...stylex.props(styles.dockedSidebar)}>{sidebar(true)}</div>

      {/*
        The drawer is only mounted below the dock width. Rendering both copies
        at once would put every nav link in the accessibility tree twice.
      */}
      <SidebarDrawer drawerRef={drawerRef} onClose={closeNav}>
        {sidebar(false)}
      </SidebarDrawer>

      <div {...stylex.props(styles.content)}>
        <Topbar
          menuButtonRef={menuButtonRef}
          navOpen={navOpen}
          onOpenNav={() => setNavOpen(true)}
          title={active?.label ?? "Dashboard"}
        />

        <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
          <div {...stylex.props(styles.screen)}>
            <div {...stylex.props(styles.screenHead)}>
              <div {...stylex.props(styles.screenTitleWrap)}>
                {active?.kind === "homepage" ? (
                  <p {...stylex.props(styles.screenEyebrow)}>
                    Pages / Homepage
                  </p>
                ) : null}
                {/*
                  One <h1> per screen. The topbar breadcrumb is a <p>, so this
                  stays the single document heading a screen reader announces.
                */}
                <h1 {...stylex.props(styles.screenTitle)}>{active?.label}</h1>
                {SCREEN_NOTE[screen] ? (
                  <p {...stylex.props(styles.screenNote)}>
                    {SCREEN_NOTE[screen]}
                  </p>
                ) : null}
              </div>

              <ScreenActions kind={active?.kind} />
            </div>

            <ScreenBody
              entries={entries}
              item={active}
              userName={userName}
              userRole={userRole}
            />
          </div>
        </main>
      </div>
    </div>
  );
};
