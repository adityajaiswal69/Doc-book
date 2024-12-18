'use client'
import { PlusIcon } from "lucide-react"
import { Button } from "./ui/button"
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDocument } from "@/actions/actions";

function NewDocumentButton() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const handleCreateDocument = () => {
        startTransition(async () => {
            const {docId} = await createDocument();
            router.push(`/doc/${docId}`);
        })
    }
  return (
    <Button  variant="ghost" size="icon" onClick={handleCreateDocument} disabled={isPending}>
        <PlusIcon/>
    </Button>
  )
}

export default NewDocumentButton