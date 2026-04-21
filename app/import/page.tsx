import { createClient } from "@/lib/supabase/server";
import { vocabulary } from "@/data/vocabulary";
import ImportClient from "./ImportClient";

export default async function ImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let masteredIds: number[] = [];
  let seenIds: number[] = [];
  if (user) {
    const { data } = await supabase
      .from("word_progress")
      .select("word_id, mastered")
      .eq("user_id", user.id);
    masteredIds = data?.filter((r) => r.mastered).map((r) => r.word_id) ?? [];
    seenIds = data?.map((r) => r.word_id) ?? [];
  }

  return (
    <ImportClient
      vocabulary={vocabulary}
      masteredIds={masteredIds}
      seenIds={seenIds}
      signedIn={!!user}
    />
  );
}
