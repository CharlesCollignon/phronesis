import { NextResponse } from "next/server";
import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";

const hasClerk =
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
  Boolean(process.env.CLERK_SECRET_KEY);

const isMeApi = createRouteMatcher(["/api/me(.*)"]);
const isSondageApi = createRouteMatcher([
  "/api/dossiers/(.*)/sondage",
  "/api/scrutins/(.*)/sondage",
]);

const clerkHandler = clerkMiddleware(async (auth, req) => {
  if (isMeApi(req)) {
    await auth.protect();
    return;
  }
  if (
    isSondageApi(req) &&
    (req.method === "POST" || req.method === "PUT")
  ) {
    await auth.protect();
  }
});

export default hasClerk
  ? clerkHandler
  : function passthrough() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
