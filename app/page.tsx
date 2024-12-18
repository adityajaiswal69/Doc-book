import Header from "@/components/Header";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <SidebarTrigger />

        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
      <h1>Hello</h1>
    </div>
  );
}
