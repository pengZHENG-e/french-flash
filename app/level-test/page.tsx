import { createClient } from "@/lib/supabase/server";
import { vocabulary } from "@/data/vocabulary";
import { LEVEL_RANGES, getLevel, type Level } from "@/data/levels";
import { pickEnglishChoices } from "@/lib/quiz_types";
import { redirect } from "next/navigation";
import LevelTestClient from "./LevelTestClient";

const PER_LEVEL = 4;

export default async function LevelTestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sample PER_LEVEL random words per CEFR level, then shuffle the full set.
  const questions = LEVEL_RANGES.flatMap((range) => {
    const pool = vocabulary.filter((w) => getLevel(w.id, w.level) === range.level);
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, PER_LEVEL);
    return shuffled.map((word) => ({
      level: range.level as Level,
      levelLabel: range.label,
      word_id: word.id,
      french: word.french,
      pronunciation: word.pronunciation,
      partOfSpeech: word.partOfSpeech,
      english: word.english,
      choices: pickEnglishChoices(word, vocabulary),
    }));
  }).sort(() => Math.random() - 0.5);

  const { data: history } = await supabase
    .from("level_tests")
    .select("level, correct, total, taken_at")
    .eq("user_id", user.id)
    .order("taken_at", { ascending: false })
    .limit(5);

  return <LevelTestClient questions={questions} history={history ?? []} />;
}
