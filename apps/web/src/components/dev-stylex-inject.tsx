import { useEffect } from "react";

const DevStyleXInjectImpl = () => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      import("virtual:stylex:runtime");
    }
  }, []);
  return <link rel="stylesheet" href="/virtual:stylex.css" />;
};

export const DevStyleXInject = ({ cssHref }: { cssHref: string }) =>
  import.meta.env.DEV ? (
    <DevStyleXInjectImpl />
  ) : (
    <link rel="stylesheet" href={cssHref} />
  );
