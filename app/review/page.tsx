import { redirect } from "next/navigation";

// /review now lives under /vocabulary as a tab. Preserve old bookmarks.
export default function ReviewRedirect() {
  redirect("/vocabulary?tab=due");
}
