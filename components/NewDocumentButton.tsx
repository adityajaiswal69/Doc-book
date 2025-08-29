'use client'
import { PlusIcon } from "lucide-react"
import { Button } from "./ui/button"
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDocument } from "@/actions/actions";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";

function NewDocumentButton() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const { user } = useAuth();
    
    const handleCreateDocument = () => {
        if (!user?.id) {
            toast.error('Please sign in to create a document');
            return;
        }

        startTransition(async () => {
            try {
                const {docId} = await createDocument(user.id);
                router.push(`/doc/${docId}`);
                toast.success('Document created successfully!');
            } catch (error) {
                console.error('Failed to create document:', error);
                toast.error('Failed to create document. Please try again.');
            }
        })
    }
  return (
    <Button  variant="ghost" size="icon" onClick={handleCreateDocument} disabled={isPending}>
        <PlusIcon/>
    </Button>
  )
}

export default NewDocumentButton