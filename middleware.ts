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

/**
 * Seules les routes qui lisent la session côté serveur (`auth()`).
 *
 * Le middleware s'exécutait sur chaque page, fichier de plan du site et
 * image de partage compris : une invocation de fonction par requête de
 * visiteur ou de robot, alors qu'aucune page ne lit la session en la
 * rendant. Les pages sont statiques et Clerk s'y charge dans le
 * navigateur ; le middleware ne passe plus que là où `auth()` est
 * appelé. Une route qui appelle `auth()` doit figurer ici, sinon Clerk
 * lève une erreur.
 */
export const config = {
  matcher: [
    "/api/me/:path*",
    "/api/dossiers/:uid/sondage",
    "/api/scrutins/:uid/sondage",
  ],
};
