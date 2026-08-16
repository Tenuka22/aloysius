import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/tanstack-react-start";

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/"
        appearance={{
          elements: {
            rootBox: "w-full max-w-[400px]",
            card: "shadow-none border border-gold/20",
          },
        }}
      />
    </div>
  );
}

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
});
