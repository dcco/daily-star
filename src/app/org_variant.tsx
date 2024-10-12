
import { VerF, Ver, RowDef, newRowDef, newStratDef } from './strat_def'
import { StarDef, mainVerStarDef } from './org_star_def'

	/*
		variant_sel: stores currently selected variants 
	*/

export type VariantSel = { [key: string]: string };

export function toVarList(sel: VariantSel): string[]
{
	return Object.entries(sel).map((entry) => entry[1]);
}

	/*
		ver_info: explicitly states version info about a strat.
		  * def: default version (must have either "jp" or "us")
		  * jpFlag: relevant to JP
		  * usFlag: relevant to US
	*/

export type VerInfo = {
	"def": VerF,
	"jpFlag": boolean,
	"usFlag": boolean
}

	/*
		variant_group: a list of variants to select from (N/A exists as an implicit option)
		  * id: unique identifier (relative to a specific star)
		  * list: string list of variant ids
	*/

export type VarGroup = {
	"id": number,
	"list": string[]
}

	/*
		variant_space: abstract definition of all possible
			variant combinations for a strat.
		  * verInfo: version information about the strat (null if it doesn't matter)
		  * nameList: raw list of variant names taken from the star def
		  * varTable: table of lists representing options for a variant
		  		TODO: currently every list is just Y/N
	*/

export type VarSpace = {
	"stratName": string,
	"verInfo": VerInfo | null,
	"nameList": string[],
	"varTable": VarGroup[]
}

function makeVarTable(variants: string[], varGroups: number[][]): VarGroup[]
{
	if (variants === undefined) return [];
	// start with pre-existing groups
	var usedVars: number[] = [];
	var gId = 0;
	var allGroups = varGroups.map((l) => {
		gId = gId + 1;
		usedVars = usedVars.concat(l);
		return { "id": gId - 1, "list": l.map((i) => "" + i) };
	}); 
	// add remaining variables as individual groups
	variants.map((x, i) => {
		if (!usedVars.includes(i)) {
			allGroups.push({ "id": gId, "list": ["" + i] });
			gId = gId + 1;
		}
	})
	return allGroups;
}

type VarSet = {
	[key: string]: boolean
}

export function varSpaceStarDef(starDef: StarDef, stratName: string): VarSpace
{
	// find the strat from either set
	var stratDef = starDef.jp_set[stratName];
	if (stratDef === undefined) stratDef = starDef.us_set[stratName];
	// strat doesn't actually exist (usually open column or virtual column)
	if (stratDef === undefined) {
		var ver_diff = mainVerStarDef(starDef) !== null;
		var var_all: string[] = [];
		if (starDef.variants) var_all = starDef.variants.map((v, i) => "" + i);
		stratDef = newStratDef(stratName, "hard", ver_diff,
			false, undefined, [], { "open": var_all });
	}
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
	// collect all the variant groups
	var nameList: string[] = [];
	var varTable: VarGroup[] = [];
	if (starDef.variants) {
		nameList = starDef.variants;
		var varGroups: number[][] = [];
		if (starDef.var_groups) varGroups = starDef.var_groups;
		varTable = makeVarTable(starDef.variants, varGroups);
	}
	// filter variants relevant to the strat
	var varSet: VarSet = {};
	for (const [k, vl] of Object.entries(stratDef.variant_map)) {
		vl.map((x) => varSet[x] = true);
	}
	varTable = varTable.filter((group) => {
		var varFlag = false;
		group.list.map((x) => { if (varSet[x]) varFlag = true });
		return varFlag;
	})
	return {
		"stratName": stratName,
		"verInfo": verInfo,
		"nameList": nameList,
		"varTable": varTable
	};
}

export function defVerVarSpace(vs: VarSpace): Ver
{
	if (vs.verInfo === null) return "both";
	return vs.verInfo.def;
}

export function defRowVarSpace(vs: VarSpace): RowDef
{
	return newRowDef(vs.stratName, defVerVarSpace(vs), []);
}

export function toVarSel(vList: string[]): VariantSel
{
	var sel: VariantSel = {};
	vList.map((v, i) => { sel["ix:" + i] = v; });
	return sel;
}
/*
export function varSelVarSpace(vs: VarSpace, vList: number[]): VariantSel
{
	var sel: VariantSel = {};
	// for every option list
	vs.varTable.map((subList, i) => {
		// if an option is in the variant list, select it
		var selFlag = false;
		for (let j = 0; j < subList.length; j++) {
			if (vList.includes(subList[j])) {
				sel["var:" + i] = subList[j];
				selFlag = true;
				break;
			}
		}
		// otherwise add -1 ('normal' selection)
		if (!selFlag) sel["var:" + i] = -1;
	});
	return sel;
}
*/


/*
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
	// filter variants relevant to a strat
	return {
		"verInfo": verInfo,
		"varTable": makeVarTable(starDef.variants)
	};
}*/

	/*
		variant_map: a map of which variants for a strat
			have been selected for a submission (subject to some variant space)
	*/

