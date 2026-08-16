import { createFileRoute } from "@tanstack/react-router";
import { SignUp } from "@clerk/tanstack-react-start";

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/"
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

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});
