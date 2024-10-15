
import orgData from './json/org_data.json'

import { VerF, Ver, VerInfo, VarSet, VarSpace,
	buildVarGroups, filterVarGroups } from './variant_def'
import { RawStratDef, StratSet, ColList,
	buildStratDef, openStratDef,
	mergeStratSet, hasExtStratSet, filterExtStratSet,
	filterVirtStratSet, toListStratSet } from './org_strat_def'
import { OffsetDat, VerOffset, newVerOffset } from './time_dat'

	/*
		filter_state: filter settings for the xcam viewer
		* verState: which versions to display (when relevant)
		* extFlag: whether to display extension sheet columns/times
	*/

export type FilterState = {
	"verState": [boolean, boolean],
	"extFlag": boolean,
	"virtFlag": boolean
}

export function newFilterState(virt: boolean): FilterState
{
	return {
		"verState": [true, false],
		"extFlag": false,
		"virtFlag": virt
	};
}

export function newExtFilterState(virt: boolean): FilterState
{
	return {
		"verState": [true, false],
		"extFlag": true,
		"virtFlag": virt
	};
}

export function fullFilterState(): FilterState
{
	return {
		"verState": [true, true],
		"extFlag": true,
		"virtFlag": true
	};
}

export function copyFilterState(fs: FilterState): FilterState
{
	return {
		"verState": [fs.verState[0], fs.verState[1]],
		"extFlag": fs.extFlag,
		"virtFlag": fs.virtFlag
	};
}

	/*
		raw_star_def: definition of a star, read from org_data
		* name
		* id
		* def: defines the "default" version for a star
			- "na": no version diffs
			- "jp" / "us": only one version relevant at top-level
			- "offset": both versions relevant at top-level, can be compared with time offset
			- null: both versions relevant at top-level + strat diffs, can be compared with time offset
			- "spec": both versions relevant at top level, no meaningful time offset
				(we treat the latter two cases essentially the same as offset)
		* variants: list of strings defining the variants
			(maintained even in the processed def for display purposes)
		* offset: a single integer, or a mapping of strat names to integers that define the JP/US offset
		* jp_set/us_set: mapping of strat names to strat defs
		* var_groups: list of groups consisting of a group name + numeric strings defining
			groups of disjoint variants (variants not present are assumed to make up independent groups)
		* open: a list of the columns that should be included with the open column.
			NULL only if the open column should not exist at all
	*/

export type JSOffset = null | number | { [key: string]: number };

export type RawStratSet = {
	[key: string]: RawStratDef
};

export type StarDesc = {
	"name": string,
	"id": string,
	"def": "na" | "jp" | "us" | "offset" | "spec" | null,
	"variants": string[] | undefined
};

export type RawStarDef = StarDesc & {
	"offset": JSOffset,
	"jp_set": RawStratSet,
	"us_set": RawStratSet,
	"var_groups": string[][] | undefined,
	"open": string[] | null
};

export function mainVerStarDef(starDef: StarDesc): VerF | null
{
	// if no version specified, no version diff
	if (starDef.def === "na") return null;
	// in all cases except US, default to JP
	if (starDef.def === "us") return "us";
	return "jp";
}

export function sampleStratDef(starDef: RawStarDef, stratName: string): RawStratDef | null
{
	var stratDef = starDef.jp_set[stratName];
	if (stratDef === undefined) stratDef = starDef.us_set[stratName];
	if (stratDef === undefined) return null;
	return stratDef;
}

function buildVerInfo(starDef: RawStarDef, stratName: string): VerInfo | null
{
	// determine which versions the strat is relevant to
	var jpFlag = starDef.jp_set[stratName] !== undefined;
	var usFlag = starDef.us_set[stratName] !== undefined;
	// find the strat to determine if version diff matters
	// if strat cannot be found (open column), use default star behavior
	var stratDef = sampleStratDef(starDef, stratName);
	if (stratDef === null) {
		if (mainVerStarDef(starDef) === null) return null;
		jpFlag = true;
		usFlag = true;
	}
	else if (!stratDef.ver_diff) return null;
	// default version based on star
	var defVer = mainVerStarDef(starDef);
	if (defVer === null) defVer = "jp";
	return {
		"def": defVer,
		"jpFlag": jpFlag,
		"usFlag": usFlag
	};
}

function buildVarSpace(starDef: RawStarDef, stratName: string): VarSpace
{
	// obtain initial variant group table
	var variants: string[] = [];
	var varGroups: string[][] = [];
	if (starDef.variants) variants = starDef.variants;
	if (starDef.var_groups) varGroups = starDef.var_groups;
	var varTable = buildVarGroups(variants, varGroups);
	// filter variants relevant to the strat (ignore if open column)
	var stratDef = sampleStratDef(starDef, stratName);
	if (stratDef !== null && stratDef.name !== "Open") {
		var varSet: VarSet = {};
		for (const [k, vl] of Object.entries(stratDef.variant_map)) {
			vl.map((x) => { varSet[x] = true });
		}
		varTable = filterVarGroups(varTable, varSet);
	}
	return {
		"stratName": stratName,
		"variants": variants,
		"verInfo": buildVerInfo(starDef, stratName),
		"varTable": varTable
	};
}

	/*
		star_def: definition of a star with version/variant information processed into the strat sets
		  * jp_set/us_set: mapping of strat names to (not raw) strat defs
		  * open: list of columns that make up the open column
		  		(if the open column should exist it will already be added as a virtual strat)
	*/

export type StarDef = StarDesc & {
	"offset": OffsetDat,
	"jp_set": StratSet,
	"us_set": StratSet,
	"open": string[]
};
/*
function buildVarTable(variants: string[], varGroups: string[][]): VarGroup[]
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
}*/

function buildOffsetDat(offset: JSOffset): OffsetDat {
	if (offset === null) return { 'a': false, 'num': 0 };
	else if (typeof offset === 'number') return { 'a': false, 'num': offset };
	return { 'a': true, 'data': offset };
}

function buildStarDef(stageId: number, starDef: RawStarDef): StarDef
{
	// process jp/us strat definitions
	var jp_set: StratSet = {};
	Object.entries(starDef.jp_set).map((_strat) => {
		var [stratName, stratDef] = _strat;
		var vs = buildVarSpace(starDef, stratName);
		var ver: Ver = (vs.verInfo === null) ? "both" : "jp";
		jp_set[stratName] = buildStratDef(stratDef, "beg", ver, vs);
	});

	var us_set: StratSet = {};
	Object.entries(starDef.us_set).map((_strat) => {
		var [stratName, stratDef] = _strat;
		var vs = buildVarSpace(starDef, stratName);
		var ver: Ver = (vs.verInfo === null) ? "both" : "us";
		us_set[stratName] = buildStratDef(stratDef, "beg", ver, vs);
	});

	// get list of open strats, add open strat if non-existent
	var open: string[] = [];
	if (starDef.open !== null) {
		open = starDef.open;
		if (!open.includes("Open")) open.unshift("Open");
		if (!jp_set["Open"] && !us_set["Open"]) {
			var vs = buildVarSpace(starDef, "Open");
			var openDef = openStratDef(stageId + "_" + starDef.id + "_Open", vs);
			jp_set["Open"] = openDef;
			us_set["Open"] = openDef;
		}
	}

	return {
		"name": starDef.name,
		"id": starDef.id,
		"def": starDef.def,
		"offset": buildOffsetDat(starDef.offset),
		"variants": starDef.variants,
		"jp_set": jp_set,
		"us_set": us_set,
		"open": open
	};
}


export function verOffsetStarDef(starDef: StarDef, fs: FilterState): VerOffset
{
	// override default version if only one version is being viewed
	var verState = fs.verState;
	var focusVer = mainVerStarDef(starDef);
	if (focusVer !== null && verState[0] !== verState[1]) {
		if (verState[0]) focusVer = "jp";
		else if (verState[1]) focusVer = "us";
	}
	// build version offset
	/*var offset = starDef.offset;
	var complexOff = (offset !== null && typeof offset !== "number");*/
	return newVerOffset(focusVer, starDef.offset);
}

export function varSpaceStarDef(starDef: StarDef, stratName: string): VarSpace | null
{
	var stratDef = starDef.jp_set[stratName];
	if (stratDef === undefined) stratDef = starDef.us_set[stratName];
	if (stratDef === undefined) return null;
	return stratDef.vs;
}

export function stratSetStarDef(starDef: StarDef, fs: FilterState): StratSet
{
	// merge version sets if needed
	var verState = fs.verState;
	var verSet: StratSet = {};
	if (verState[0] && verState[1]) verSet = mergeStratSet(starDef.jp_set, starDef.us_set);
	else if (verState[1]) verSet = starDef.us_set;
	else verSet = starDef.jp_set;
	// extension filter
	if (fs.extFlag === false) verSet = filterExtStratSet(verSet);
	// virtual filter
	if (fs.virtFlag === false) verSet = filterVirtStratSet(verSet);
	return verSet;
}

export function colListStarDef(starDef: StarDef, fs: FilterState): ColList {
	var vs = stratSetStarDef(starDef, fs);
	return toListStratSet(vs);
}

/*
export function orgColList(stageId, starId, fs) {
	var starDef = orgStarDef(stageId, starId);
	// merge version sets if needed
	var verSet = stratSetStarDef(starDef, fs.verState);
	// extension filter
	if (fs.extFlag === false) verSet = filterExtStratSet(verSet);
	// build column list
	var colList = [];
	Object.entries(verSet).map((strat, i) => {
		var [stratName, stratDef] = strat;
		if (stratDef.virtual || stratDef.id_list.length !== 0) colList.push([i, stratDef]);
	});
	return colList;
}*/

export function hasExtStarDef(starDef: StarDef): boolean {
	//var fullSet = Object.entries(starDef.jp_set);
	//fullSet = fullSet.concat(Object.entries(starDef.us_set));
	return hasExtStratSet(starDef.jp_set) || hasExtStratSet(starDef.us_set);
}

	/*
		wrapper from reading organizational data
	*/

type OrgCache = {
	[k: string]: StarDef
};

const ORG_CACHE: OrgCache = {};

export function orgStarDef(stageId: number, starId: number): StarDef
{
	var k = stageId + "_" + starId;
	if (ORG_CACHE[k] === undefined) {
		var UNSAFE_star = orgData[stageId].starList[starId] as any;
		ORG_CACHE[k] = buildStarDef(stageId, UNSAFE_star);
	}
	return ORG_CACHE[k];
}