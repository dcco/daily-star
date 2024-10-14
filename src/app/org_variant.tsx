
//import { VerF, Ver, RowDef, newRowDef, newStratDef } from './strat_def'
//import { StarDef, mainVerStarDef } from './org_star_def'

	/*
		variant_sel: stores currently selected variants 
	*/
/*
export type VariantSel = { [key: string]: string };

export function toVarList(sel: VariantSel): string[]
{
	return Object.entries(sel).map((entry) => entry[1]);
}



function makeVarTable(variants: string[], varGroups: string[][]): VarGroup[]
{
	// start with pre-existing groups
	var usedVars: string[] = [];
	var gId = 0;
	var allGroups = varGroups.map((l) => {
		// split the group name from the var ids
		var numList = l.map((v) => v);
		var groupName = numList.shift();
		if (groupName === undefined) {
			console.log(varGroups);
			throw('Undefined group name while generating variants.');
		}
		// add group to the list
		gId = gId + 1;
		usedVars = usedVars.concat(numList);
		return { "id": gId - 1, "name": groupName, "list": numList.map((i) => i) };
	}); 
	// add remaining variables as individual groups
	variants.map((x, i) => {
		if (!usedVars.includes("" + i)) {
			allGroups.push({ "id": gId, "name": variants[i], "list": ["" + i] });
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
		var varGroups: string[][] = [];
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
*/



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

