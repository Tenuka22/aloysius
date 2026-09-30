import { useEffect, useRef, useState } from "react";

/**
 * A list search box's debounce, in one hook.
 *
 * A search that writes to the URL on every keystroke is a request per letter and a
 * history entry per letter; a search that waits for a blur is a box that hides its
 * results until the user thinks to leave it. So the box holds a **draft** locally,
 * reports it on a timer, and the URL — and therefore the query — only hears about
 * terms somebody stopped typing long enough to mean.
 *
 * `draft` is what the box displays; `onCommit` is what the URL hears. They start
 * equal and the draft is reset whenever the committed value catches up to what the
 * draft was, which is also what makes an external change (Back, a cleared filter)
 * repaint the box: the effect below notices the committed value has moved off the
 * last draft and re-adopts it.
 */
const DEFAULT_DELAY_MS = 300;

export const useDebouncedListSearch = (
  value: string,
  onCommit: (next: string) => void,
  delayMs = DEFAULT_DELAY_MS
) => {
  const [draft, setDraft] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ onCommit, value });

  latest.current = { onCommit, value };

  useEffect(() => {
    // The committed value is the truth. A draft that no longer differs from it is
    // either the initial mount or a round trip that caught up, and both mean the
    // box should show the truth.
    setDraft((current) => (current === latest.current.value ? current : latest.current.value));
  }, [value]);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  const setDraftAndSchedule = (next: string) => {
    setDraft(next);

    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      latest.current.onCommit(next);
    }, delayMs);
  };

  return { draft, setDraft: setDraftAndSchedule };
};
