import { Combatant, Player } from "../../../app/types/domain";;
import {
  parseAC,
  parseHP,
  parseAbilityScore,
  abilityMod,
} from "../utils/combatantParsing";

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;

export function useCombatantDerived(
  combatant: Combatant,
  player?: Player | null
) {
  const ac = parseAC(combatant.ac);
  const hp = parseHP(combatant.hpCurrent, combatant.hpMax);

  const abilities = ABILITIES.map((key) => {
    const score = parseAbilityScore((combatant as any)[key]);
    return {
      key,
      score,
      mod: score !== null ? abilityMod(score) : null,
    };
  });

  return {
    vitals: {
      ac: ac.value,
      acDetails: ac.details,
      hpCurrent: hp.current,
      hpMax: hp.max,
      hpDetails: hp.details,
    },
    abilities,
spells: [],
traits: [],
  };
}
