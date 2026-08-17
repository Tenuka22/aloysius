import { createAuth } from "@aloysius-web/auth";
import { getCookie } from "@tanstack/react-start/server";

export async function getServerSession() {
  const token = getCookie("better-auth.session_token");
  if (!token) return null;

  const headers = new Headers();
  headers.set("cookie", `better-auth.session_token=${token}`);

  const session = await createAuth().api.getSession({ headers });
  return session;
}
