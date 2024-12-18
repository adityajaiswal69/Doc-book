"use server";

import { auth } from "@clerk/nextjs/server";
import { adminDb } from "@/firebase-admin";

export async function createDocument() {
  const { sessionClaims } = await auth();

  if (!sessionClaims?.email) {
    throw new Error("Unauthorized - User must be logged in");
  }

  const docCollectionRef = adminDb.collection("documents");

  const docRef = await docCollectionRef.add({
    title: "Untitled Document",
  });

  await adminDb
    .collection("users")
    .doc(sessionClaims.email)
    .collection("rooms")
    .doc(docRef.id)
    .set({
      userId: sessionClaims.email,
      role: "owner", 
      createdAt: new Date(),
      roomId: docRef.id,
    });

    return { docId: docRef.id };
}