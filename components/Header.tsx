"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { SidebarTrigger } from "./ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "./ui/input";
import { Check } from "lucide-react";
import { Button } from "./ui/button";
import { FormEvent, useEffect, useState, useTransition } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { title } from "process";
import { useDocumentData } from "react-firebase-hooks/firestore";
import { ThemeToggle } from "./theme-toggle";

function Header({ id }: { id: string }) {
  const [input, setInput] = useState("");
  const [isUpdating, startTransition] = useTransition();
  const [data, loading, error] = useDocumentData(doc(db, "documents", id));
  const { user } = useUser();

  useEffect(() => {
    if(data) {
      setInput(data.title);
    }
  }, [data]);
  const updateTitle = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      startTransition(async () => {
        await updateDoc(doc(db, "documents", id), {
          title: input,
        });
      });
    }
  };
  return (
    <div className="flex items-center justify-between flex-1  mb-4">
      <div className="flex items-center gap-x-3">
        <SidebarTrigger />
        <Popover>
          <PopoverTrigger>{input}</PopoverTrigger>
          <PopoverContent>
            <form
              className="flex items-center space-x-2"
              onSubmit={updateTitle}
            >
              <Input className="outline-none" value={input} onChange={(e) => setInput(e.target.value)} />
              <Button
                variant="outline"
                size="icon"
                disabled={isUpdating}
                type="submit"
              >
                <Check />
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex items-center gap-x-3">
          <ThemeToggle/>
        <div>
        <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
        </div>
      </div>
      
    </div>
  );
}

export default Header;
