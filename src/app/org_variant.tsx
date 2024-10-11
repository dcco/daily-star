
import { VerF, Ver, RowDef, newRowDef } from './strat_def'
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
	"varTable": string[][]
}

function makeVarTable(variants: string[]): string[][]
{
	if (variants === undefined) return [];
	return variants.map((s, i) => ["" + i]);
}

export function varSpaceStarDef(starDef: StarDef, stratName: string): VarSpace
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
	var nameList: string[] = [];
	var varTable: string[][] = [];
	if (starDef.variants) {
		nameList = starDef.variants;
		varTable = makeVarTable(starDef.variants);
	}
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

