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
 * `draft` is what the box displays; `onCommit` is what the URL hears.
 */
const DEFAULT_DELAY_MS = 300;

/** A draft, remembered together with the committed value it was typed against. */
interface Draft {
  /** The committed value in force when this text was typed. */
  committed: string;
  text: string;
}

export const useDebouncedListSearch = (
  value: string,
  onCommit: (next: string) => void,
  delayMs = DEFAULT_DELAY_MS
) => {
  const [typed, setTyped] = useState<Draft>({ committed: value, text: value });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const commitRef = useRef(onCommit);

  /*
   * The draft is stored against the committed value it was typed for, and
   * displayed only while that value is still the current one. So an external
   * change — Back, a cleared filter, a reset — makes the stored draft stale and
   * the box falls back to the committed value, which is what "the committed
   * value is the truth" means. Doing it this way rather than in an effect is the
   * difference between a re-render and a render *plus* another one.
   */
  const draft = typed.committed === value ? typed.text : value;

  /*
   * The timer outlives the render that scheduled it, so it must call the
   * `onCommit` in force *now* rather than the one captured when it was set.
   * Written in an effect, because assigning a ref during render is the one
   * version of this React is free to throw away.
   */
  useEffect(() => {
    commitRef.current = onCommit;
  }, [onCommit]);

  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    []
  );

  const setDraft = (next: string) => {
    setTyped({ committed: value, text: next });

    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      commitRef.current(next);
    }, delayMs);
  };

  return { draft, setDraft };
};
