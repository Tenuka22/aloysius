import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface AstryxRouterLinkProps {
  href?: string;
  children?: ReactNode;
}

export const AstryxRouterLink = ({
  href,
  children,
  ...rest
}: AstryxRouterLinkProps) => (
  <Link to={href} {...rest}>
    {children}
  </Link>
);
