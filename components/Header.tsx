"use client";

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
import { useDocument } from "@/hooks/use-documents";
import { updateDocument } from "@/actions/actions";
import { ThemeToggle } from "./theme-toggle";

function Header({ id }: { id: string }) {
  const [input, setInput] = useState("");
  const [isUpdating, startTransition] = useTransition();
  const { document, loading, error } = useDocument(id);

  useEffect(() => {
    if (document) {
      setInput(document.title);
    }
  }, [document]);

  const updateTitle = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && document) {
      startTransition(async () => {
        try {
          await updateDocument(id, { title: input });
        } catch (error) {
          console.error('Error updating title:', error);
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-between flex-1 mb-4">
        <div className="flex items-center gap-x-3">
          <SidebarTrigger />
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex items-center gap-x-3">
          <ThemeToggle />
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="flex items-center justify-between flex-1 mb-4">
        <div className="flex items-center gap-x-3">
          <SidebarTrigger />
          <div className="text-red-500">Error loading document</div>
        </div>
        <div className="flex items-center gap-x-3">
          <ThemeToggle />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between flex-1 mb-4">
      <div className="flex items-center gap-x-3">
        <SidebarTrigger />
        <Popover>
          <PopoverTrigger>{input}</PopoverTrigger>
          <PopoverContent>
            <form
              className="flex items-center space-x-2"
              onSubmit={updateTitle}
            >
              <Input 
                className="outline-none" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
              />
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
        <ThemeToggle />
      </div>
    </div>
  );
}

export default Header;
