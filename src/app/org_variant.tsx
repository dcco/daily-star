
import { mainVerStarDef } from './org_star_def'

	/*
		ver_info: explicitly states version info about a strat.
		  * def: default version (must have either "jp" or "us")
		  * jpFlag: relevant to JP
		  * usFlag: relevant to US
	*/

	/*
		variant_space: abstract definition of all possible
			variant combinations for a strat.
		  * verInfo: version information about the strat (null if it doesn't matter)
		  * varTable: table of lists representing options for a variant
		  		TODO: currently every list is just Y/N
	*/

function makeVarTable(variants)
{
	if (variants === undefined) return [];
	return variants.map((s) => [s]);
}

export function varSpaceStarDef(starDef, stratName)
{
	// find the strat from either set
	var stratDef = starDef.jp_set[stratName];
	if (stratDef === undefined) stratDef = starDef.us_set[stratName];
	// get version info if relevant
	var verInfo = null;
	if (stratDef.ver_diff) {
		var defVer = mainVerStarDef(starDef);
		if (defVer === null) defVer = "jp";
		verInfo = {
			"def": defVer,
			"jpFlag": starDef.jp_set[stratName] !== undefined,
			"usFlag": starDef.us_set[stratName] !== undefined
		};
	}
	// get s
	return {
		"verInfo": verInfo,
		"varTable": makeVarTable(starDef.variants)
	};
}

	/*
		variant_map: a map of which variants for a strat
			have been selected for a submission (subject to some variant space)
	*/

