import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import {
  ACTIVITY_STATS,
  PERMISSIONS,
  RECENT_ACTIVITY,
  formatCmsDate,
} from "../../content/cms";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import {
  CmsButton,
  Field,
  FieldGrid,
  Panel,
  PanelHead,
  SwitchRow,
} from "./cms-primitives";

const styles = stylex.create({
  layout: {
    display: "grid",
    gap: space.md,
    alignItems: "start",
    // The account card only becomes a sidebar once the main column can still
    // hold a two-up field grid beside it.
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xxl]: "minmax(0, 20rem) minmax(0, 1fr)",
    },
  },
  side: {
    display: "flex",
    flexDirection: "column",
    gap: space.md,
    minWidth: 0,
  },
  main: {
    display: "flex",
    flexDirection: "column",
    gap: space.md,
    minWidth: 0,
  },

  identity: {
    textAlign: "center",
  },
  avatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "7rem",
    height: "7rem",
    marginInline: "auto",
    borderRadius: "50%",
    backgroundColor: color.surfaceInverse,
    color: color.accentOnInverse,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
  },
  name: {
    margin: 0,
    marginBlockStart: space.sm,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
  },
  role: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  email: {
    margin: 0,
    marginBlockStart: space["2xs"],
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
    // Long addresses must break rather than widen the card.
    overflowWrap: "anywhere",
  },
  photoActions: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space["2xs"],
    marginBlockStart: space.md,
  },

  statRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: space["2xs"],
    paddingBlock: space.xs,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.borderInverse,
  },
  statLabel: {
    margin: 0,
    fontSize: font.sizeSm,
    color: color.onInverseMuted,
  },
  statValue: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    color: color.accentOnInverse,
  },
  statFoot: {
    margin: 0,
    marginBlockStart: space.sm,
    fontSize: font.sizeXs,
    color: color.onInverseSubtle,
  },

  level: {
    flexShrink: 0,
    paddingBlock: "0.15rem",
    paddingInline: space["3xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  levelFull: {
    backgroundColor: "rgba(1, 52, 5, 0.12)",
    color: color.onSurface,
  },
  levelEdit: {
    backgroundColor: "rgba(255, 178, 3, 0.24)",
    color: "#7a5400",
  },
  levelNone: {
    backgroundColor: "rgba(1, 52, 5, 0.07)",
    color: color.onSurfaceSubtle,
  },

  securityRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space["2xs"],
    paddingBlock: space.xs,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  securityText: {
    flex: "1 1 16rem",
    minWidth: 0,
  },
  securityLabel: {
    margin: 0,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
  },
  securityDesc: {
    margin: 0,
    marginBlockStart: "0.1rem",
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  warn: {
    flexShrink: 0,
    paddingBlock: "0.15rem",
    paddingInline: space["3xs"],
    backgroundColor: "rgba(165, 25, 25, 0.12)",
    color: color.danger,
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },

  activityRow: {
    display: "grid",
    gap: space["3xs"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.lg]: "6.5rem minmax(0, 1fr) auto",
    },
    alignItems: {
      default: "start",
      [bp.lg]: "center",
    },
    paddingBlock: space.xs,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  verb: {
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
  },
  verbPublished: { color: color.onSurface },
  verbEdited: { color: "#7a5400" },
  verbUploaded: { color: color.onSurface },
  verbDrafted: { color: color.onSurfaceSubtle },
  verbDeleted: { color: color.danger },
  activityItem: {
    margin: 0,
    minWidth: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    textWrap: "pretty",
  },
  activityAt: {
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    color: color.onSurfaceSubtle,
    whiteSpace: "nowrap",
  },
});

const VERB_TONE = {
  Published: styles.verbPublished,
  Edited: styles.verbEdited,
  Uploaded: styles.verbUploaded,
  Drafted: styles.verbDrafted,
  Deleted: styles.verbDeleted,
} as const;

const LEVEL_TONE = {
  Full: styles.levelFull,
  Edit: styles.levelEdit,
  None: styles.levelNone,
} as const;

const levelFor = (granted: boolean, adminOnly?: boolean) => {
  if (!granted) {
    return "None";
  }
  return adminOnly ? "Full" : "Edit";
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const Profile = ({
  userName,
  userRole,
}: {
  userName: string;
  userRole: string;
}) => {
  const [granted, setGranted] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PERMISSIONS.map((p) => [p.id, p.granted]))
  );

  return (
    <div {...stylex.props(styles.layout)}>
      <div {...stylex.props(styles.side)}>
        <Panel accent style={styles.identity}>
          <span aria-hidden="true" {...stylex.props(styles.avatar)}>
            {initialsOf(userName)}
          </span>
          <p {...stylex.props(styles.name)}>{userName}</p>
          <p {...stylex.props(styles.role)}>{userRole}</p>
          <p {...stylex.props(styles.email)}>No email address on file yet.</p>
          <div {...stylex.props(styles.photoActions)}>
            <CmsButton tone="quiet">Change photo</CmsButton>
            <CmsButton tone="danger">Remove</CmsButton>
          </div>
        </Panel>

        <Panel tone="inverse">
          <PanelHead inverse title="Activity" />
          {ACTIVITY_STATS.map((stat) => (
            <div key={stat.id} {...stylex.props(styles.statRow)}>
              <p {...stylex.props(styles.statLabel)}>{stat.label}</p>
              <p {...stylex.props(styles.statValue)}>{stat.value}</p>
            </div>
          ))}
          <p {...stylex.props(styles.statFoot)}>
            Last sign-in is recorded once sessions are wired up.
          </p>
        </Panel>
      </div>

      <div {...stylex.props(styles.main)}>
        <Panel>
          <PanelHead
            eyebrow="Section 01"
            note="Your details as they appear on author bylines."
            title="Account details"
          />
          <FieldGrid>
            <Field label="Full name" value={userName} />
            <Field label="Display name" value={userName} />
            <Field label="Email" />
            <Field label="Telephone" />
            <Field label="Department" hint="For example, Media Unit." />
            <Field
              hint="Roles are assigned by an administrator."
              kind="readonly"
              label="Role"
              value={userRole}
            />
            <Field
              kind="textarea"
              label="Short bio"
              hint="Appears under your name on News posts."
              wide
            />
          </FieldGrid>
        </Panel>

        <Panel>
          <PanelHead
            eyebrow="Section 02"
            note="What this account may edit and publish across the College website."
            title="Permissions"
          />
          {PERMISSIONS.map((permission) => {
            const on = granted[permission.id] ?? false;
            const level = levelFor(on, permission.adminOnly);
            return (
              <SwitchRow
                badge={
                  <span {...stylex.props(styles.level, LEVEL_TONE[level])}>
                    {level}
                  </span>
                }
                checked={on}
                description={permission.description}
                disabled={permission.adminOnly}
                key={permission.id}
                label={permission.area}
                onToggle={() =>
                  setGranted((prev) => ({
                    ...prev,
                    [permission.id]: !prev[permission.id],
                  }))
                }
              />
            );
          })}
        </Panel>

        <Panel>
          <PanelHead eyebrow="Section 03" title="Security" />
          <div {...stylex.props(styles.securityRow)}>
            <div {...stylex.props(styles.securityText)}>
              <p {...stylex.props(styles.securityLabel)}>Password</p>
              <p {...stylex.props(styles.securityDesc)}>
                Change it if you think anyone else knows it.
              </p>
            </div>
            <CmsButton tone="quiet">Change password</CmsButton>
          </div>
          <div {...stylex.props(styles.securityRow)}>
            <div {...stylex.props(styles.securityText)}>
              <p {...stylex.props(styles.securityLabel)}>
                Two-factor authentication
              </p>
              <p {...stylex.props(styles.securityDesc)}>
                Recommended for Editor and Administrator accounts.
              </p>
            </div>
            <span {...stylex.props(styles.warn)}>Not enabled</span>
            <CmsButton tone="dark">Enable</CmsButton>
          </div>
          <div {...stylex.props(styles.securityRow)}>
            <div {...stylex.props(styles.securityText)}>
              <p {...stylex.props(styles.securityLabel)}>Active sessions</p>
              <p {...stylex.props(styles.securityDesc)}>
                Signing out everywhere ends every session except this one.
              </p>
            </div>
            <CmsButton tone="danger">Sign out all</CmsButton>
          </div>
        </Panel>

        <Panel>
          <PanelHead eyebrow="Section 04" title="Recent activity" />
          {RECENT_ACTIVITY.map((entry) => (
            <div key={entry.id} {...stylex.props(styles.activityRow)}>
              <span {...stylex.props(styles.verb, VERB_TONE[entry.verb])}>
                {entry.verb}
              </span>
              <p {...stylex.props(styles.activityItem)}>{entry.item}</p>
              <span {...stylex.props(styles.activityAt)}>
                {formatCmsDate(entry.at)}
              </span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
};
