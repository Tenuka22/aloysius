import {
  CmsButton,
  EmptyState,
  Notice,
  Panel,
  PanelHead,
  Pill,
  RecordList,
  RecordRow,
} from "@aloysius/ui/components/cms/cms-primitives";
import { color, font, space } from "@aloysius/ui/tokens/tokens.stylex";
import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

/**
 * What a club asked for, field by field, against what is live.
 *
 * A reviewer used to be shown the raw JSON of the proposal, which means
 * approving a change means reading a wall of escaped text and mentally
 * reconstructing which three keys actually moved. `baseSnapshot` is captured
 * server-side at submit time precisely so this does not have to be guessed, and
 * it was being selected and then thrown away.
 *
 * For a `create` there is nothing to compare against, so every field is shown as
 * new — which is the honest presentation, and still a list of sentences rather
 * than a blob.
 */

/** Keys that are plumbing, not content. Shown only when a create names them. */
const NOISE = new Set(["id"]);

const styles = stylex.create({
  payload: {
    display: "grid",
    gap: space["2xs"],
    margin: 0,
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
  },
  changed: {
    color: color.onSurface,
    overflowWrap: "anywhere",
  },
  before: {
    color: color.onSurfaceSubtle,
    textDecoration: "line-through",
    overflowWrap: "anywhere",
  },
  after: {
    color: color.onSurface,
    fontWeight: font.weightSemibold,
    overflowWrap: "anywhere",
  },
  rawArea: {
    width: "100%",
    minHeight: "12rem",
    padding: space.xs,
    backgroundColor: color.surfaceSunken,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderStrong,
    color: color.onSurface,
    fontFamily: font.mono,
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
  },
});

interface FieldChange {
  key: string;
  label: string;
  before: string;
  after: string;
  isNew: boolean;
}

const parseJson = (raw: string): Record<string, unknown> | null => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* an unparseable payload is reported as-is rather than swallowed */
  }
  return null;
};

/** `albumUrl` -> `Album url`. Reads as a label rather than as a key. */
const labelFor = (key: string) => {
  const spaced = key.replaceAll(
    /(?<lower>[a-z])(?<upper>[A-Z])/gu,
    "$<lower> $<upper>"
  );
  const first = spaced.slice(0, 1).toUpperCase();
  return `${first}${spaced.slice(1)}`;
};

/** A value as a reviewable string, with the noisy cases made readable. */
const display = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "string") {
    return value.trim() === "" ? "—" : value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return JSON.stringify(value);
};

const truncate = (value: string, limit = 220) =>
  value.length > limit ? `${value.slice(0, limit)}…` : value;

/** The fields a submission proposes to change, newest value last. */
const changedFields = (
  payload: string,
  baseSnapshot: string | null
): FieldChange[] | null => {
  const after = parseJson(payload);
  if (!after) {
    return null;
  }
  const before = baseSnapshot ? parseJson(baseSnapshot) : null;
  const isCreate = before === null;

  const changes: FieldChange[] = [];
  for (const [key, nextValue] of Object.entries(after)) {
    if (isCreate && NOISE.has(key)) {
      continue;
    }
    const previous = before ? before[key] : undefined;
    const beforeText = display(previous);
    const afterText = display(nextValue);
    if (!isCreate && beforeText === afterText) {
      continue;
    }
    changes.push({
      after: truncate(afterText),
      before: truncate(beforeText),
      isNew: isCreate,
      key,
      label: labelFor(key),
    });
  }

  return changes.toSorted((a, b) => a.label.localeCompare(b.label));
};

const ChangeRow = ({ change }: { change: FieldChange }) => (
  <RecordRow
    actions={
      change.isNew ? (
        <Pill tone="warning">New</Pill>
      ) : (
        <Pill tone="neutral">Changed</Pill>
      )
    }
    key={change.key}
    meta={
      change.isNew ? null : (
        <>
          <span {...stylex.props(styles.before)}>{change.before}</span>
          <span aria-hidden="true">→</span>
          <span {...stylex.props(styles.after)}>{change.after}</span>
        </>
      )
    }
    name={change.label}
  />
);

export const SubmissionDiff = ({
  baseSnapshot,
  operation,
  payload,
}: {
  payload: string;
  baseSnapshot: string | null;
  operation: string;
}) => {
  const [showRaw, setShowRaw] = useState(false);
  const changes = changedFields(payload, baseSnapshot);

  if (!changes) {
    return (
      <Notice tone="danger">
        This payload is not readable JSON, so it cannot be shown field by field.
        Approving it will fail. Fix the payload with Edit.
      </Notice>
    );
  }

  if (changes.length === 0 && operation === "update") {
    return (
      <EmptyState
        note="The submitted payload matches what is already live. Approving it will change nothing."
        title="No differences."
      />
    );
  }

  return (
    <Panel>
      <PanelHead
        action={
          <CmsButton
            onClick={() => {
              setShowRaw((open) => !open);
            }}
            tone="quiet"
          >
            {showRaw ? "Hide raw JSON" : "Show raw JSON"}
          </CmsButton>
        }
        eyebrow={operation === "create" ? "New record" : "Proposed change"}
        note={
          operation === "create"
            ? "Every field below would be written when you approve."
            : "Only the fields below would change. Everything else is left alone."
        }
        title={changes.length === 1 ? "1 field" : `${changes.length} fields`}
      />

      {changes.length === 0 ? (
        <EmptyState note="The payload is empty." title="Nothing to apply." />
      ) : (
        <RecordList label="Proposed changes">
          {changes.map((change) => (
            <ChangeRow change={change} key={change.key} />
          ))}
        </RecordList>
      )}

      {showRaw ? (
        <pre {...stylex.props(styles.payload)}>
          {JSON.stringify(parseJson(payload), null, 2)}
        </pre>
      ) : null}
    </Panel>
  );
};

/** The editable textarea used by the payload editor. */
export const RawPayloadArea = ({
  onChange,
  value,
}: {
  value: string;
  onChange: (next: string) => void;
}) => (
  <textarea
    onChange={(event) => onChange(event.target.value)}
    rows={14}
    spellCheck={false}
    value={value}
    {...stylex.props(styles.rawArea)}
  />
);
