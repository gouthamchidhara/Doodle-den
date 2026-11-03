// Onboarding 3: kid nickname (max 12), avatar, age band.
import { router } from "expo-router";
import { useEffect, useState } from "react";

import { KidForm } from "@/components/parent/KidForm";
import { OnboardingFrame } from "@/components/parent/OnboardingFrame";
import { AVATAR_IDS, type AvatarId } from "@/content/avatars";
import { createKid, updateKid } from "@/db/repositories/kidRepo";
import { getOnboardingKid, setOnboardingKid } from "@/services/onboarding";
import type { AgeMode } from "@/types/models";

import { useOnboardingStep } from "./useOnboardingStep";

// Profile form; editing again (after Back) updates the same kid.
export function AddKidScreen() {
  useOnboardingStep("add-kid");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState<AvatarId>("fox");
  const [age, setAge] = useState<AgeMode | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getOnboardingKid()
      .then((k) => {
        if (!k) return;
        setExistingId(k.id);
        setNickname(k.nickname);
        setAvatar(
          AVATAR_IDS.includes(k.avatarId as AvatarId)
            ? (k.avatarId as AvatarId)
            : "fox",
        );
        setAge(k.ageMode);
      })
      .catch((e: unknown) => console.warn("[onboarding] load kid failed", e));
  }, []);

  const valid = nickname.trim().length > 0 && age !== null;

  const onNext = async () => {
    if (!valid || !age) return;
    setBusy(true);
    try {
      if (existingId) {
        await updateKid(existingId, {
          nickname,
          avatarId: avatar,
          ageMode: age,
        });
      } else {
        const kid = await createKid({
          nickname,
          avatarId: avatar,
          ageMode: age,
        });
        await setOnboardingKid(kid.id);
      }
      router.push("/onboarding/time-rules");
    } catch (e) {
      console.warn("[onboarding] save kid failed", e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingFrame
      title="Who will play?"
      onBack={() => router.back()}
      onNext={onNext}
      nextDisabled={!valid || busy}
    >
      <KidForm
        value={{ nickname, avatar, age }}
        onChange={(v) => {
          setNickname(v.nickname);
          setAvatar(v.avatar);
          setAge(v.age);
        }}
      />
    </OnboardingFrame>
  );
}
