import ruleData from './json/rules.json'

type DSRule = {
		// RULES: special requirements that affect daily star scoring
		// -- allow: allows certain strat combinations to not get filtered by normal "rules" filtering
		// -- [strat name]: allow any version of the strat
	"allow"?: string[][],
		// -- ban: removes certain strat combinations for scoring purpose
	"ban"?: string[][],
		// -- flags: miscellaneous flags
		// --- noStratScore: removes per-strat scoring
	"flags"?: string[]
}

export const RULE_DATA = ruleData as { [key: string]: DSRule };

export function allowStratRule(starCode: string, stratName: string): boolean
{
	if (RULE_DATA[starCode] === undefined) return false;
	var starRule = RULE_DATA[starCode];
	if (starRule.allow === undefined) return false;
	for (const allowRule of starRule.allow) {
		if (allowRule.length === 1 && allowRule[0] === stratName) return true;
	}
	return false;
}

export function hasFlagStratRule(starCode: string, flagName: string): boolean
{
	if (RULE_DATA[starCode] === undefined) return false;
	var starRule = RULE_DATA[starCode];
	if (starRule.flags === undefined) return false;
	return starRule.flags.includes(flagName);
}