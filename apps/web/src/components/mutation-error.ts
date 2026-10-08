/**
 * What to show for a failed mutation.
 *
 * `string | null` rather than a string, so a dialog prop can be handed straight
 * from this without a second ternary deciding whether there is anything to say:
 * no error means `null`, and a non-`Error` rejection still gets the caller's
 * fallback wording rather than a blank.
 */
export const mutationErrorText = (
  error: unknown,
  fallback: string
): string | null => {
  if (error instanceof Error) {
    return error.message;
  }
  return error ? fallback : null;
};
