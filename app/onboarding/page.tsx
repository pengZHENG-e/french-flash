import { createClient } from "@/lib/supabase/server";
import { vocabulary } from "@/data/vocabulary";
import { LEVEL_RANGES } from "@/data/levels";
import { pickEnglishChoices } from "@/lib/quiz_types";
import { redirect } from "next/navigation";
import OnboardingClient from "./OnboardingClient";

const PER_LEVEL = 2;

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sample `PER_LEVEL` random words per level (avoid duplicates).
  const questions = LEVEL_RANGES.flatMap((range) => {
    const pool = vocabulary.filter((w) => w.id >= range.startId && w.id <= range.endId);
    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, PER_LEVEL);
    return shuffled.map((word) => ({
      level: range.level,
      levelLabel: range.label,
      word_id: word.id,
      french: word.french,
      pronunciation: word.pronunciation,
      partOfSpeech: word.partOfSpeech,
      english: word.english,
      choices: pickEnglishChoices(word, vocabulary),
    }));
  });

  return <OnboardingClient questions={questions} />;
}
