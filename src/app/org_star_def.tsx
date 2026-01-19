
import orgData from './json/org_data.json'

import { VerF, Ver, VerInfo, VarSet, VarSpace,
	buildVarGroups, filterVarGroups } from './variant_def'
import { RawStratDef, StratSet, ColList,
	buildStratDef, openStratDef,
	mergeStratSet, hasExtStratSet, hasExtOnlyStratSet, filterExtStratSet, filterRulesStratSet,
	filterVirtStratSet, filterVariantStratSet, toListStratSet } from './org_strat_def'
import { OffsetDat, VerOffset, StratOffset, newVerOffset, newStratOffset } from './time_dat'

	/*
		star codes
	*/

export const PERM = ["bob", "wf", "jrb", "ccm", "bbh", "hmc", "lll", "ssl",
	"ddd", "sl", "wdw", "ttm", "thi", "ttc", "rr", "sec", "bow"];

export function starCode(stageId: number, starDef: StarDef): string
{
	return PERM[stageId] + "_" + starDef.id;
}

export function starCodeX(stageId: number, starId: string): string
{
	return PERM[stageId] + "_" + starId;
}

	/*
		filter_state: filter settings for the xcam viewer
		* verState: which versions to display (when relevant)
		* extFlag: whether to display extension sheet columns/times
		* altState: alternate strat combination state
		* virtFlag: whether to show virtual rows (beginner / artificial open)
		* varFlagList: which variants to display
	*/

export type ExtState = null | "ext" | "rules"

export type FilterState = {
	"verState": [boolean, boolean],
	"extFlag": ExtState,
	"altState": [boolean, boolean],
	"virtFlag": boolean,
	"varFlagList": boolean[]
}

export function newFilterState(alt: [boolean, boolean], virt: boolean, varTotal: number): FilterState
{
	return {
		"verState": [true, true],
		"extFlag": null,
		"altState": alt,
		"virtFlag": virt,
		"varFlagList": new Array(varTotal).fill(true)
	};
}

export function newExtFilterState(alt: [boolean, boolean], virt: boolean, varTotal: number): FilterState
{
	return {
		"verState": [true, true],
		"extFlag": "ext",
		"altState": alt,
		"virtFlag": virt,
		"varFlagList": new Array(varTotal).fill(true)
	};
}

export function newRulesFilterState(alt: [boolean, boolean], rules: boolean, virt: boolean, varTotal: number): FilterState
{
	return {
		"verState": [true, true],
		"extFlag": rules ? "ext" : "rules",
		"altState": alt,
		"virtFlag": virt,
		"varFlagList": new Array(varTotal).fill(true)
	};
}

export function fullFilterState(alt: [boolean, boolean], varTotal: number): FilterState
{
	return {
		"verState": [true, true],
		"extFlag": "ext",
		"altState": alt,
		"virtFlag": true,
		"varFlagList": new Array(varTotal).fill(true)
	};
}

export function copyFilterState(fs: FilterState): FilterState
{
	return {
		"verState": [fs.verState[0], fs.verState[1]],
		"extFlag": fs.extFlag,
		"altState": fs.altState,
		"virtFlag": fs.virtFlag,
		"varFlagList": fs.varFlagList.map((b) => b)
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

export type StarInfo = {
	"short": string,
	"option": string,
	"catInfo": string | null
};

export type StarAltDef = {
	"globShort": string,
	"status": "cutscene" | "diff" | "offset" | "mergeOffset",
	"offset"?: number,
	"info": StarInfo,
	"specMerge"?: string[]
};

export type StarDesc = {
	"name": string,
	"id": string,
	"info": StarInfo,
	"alt": null | StarAltDef,
	"100c": boolean,
	"def": "na" | "jp" | "us" | "offset" | "spec" | null,
	"variants": string[] | undefined,
	"stageId": number
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
	if (stratDef !== null && !stratDef.name.startsWith("Open")) {
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
		  		(if the open column should exist we will add it as a virtual strat)
	*/

export type StarDef = StarDesc & {
	"offset": OffsetDat,
	"secondFlag": boolean,
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

	/*
		open list behavior: (for generating from raw)
		-- open: null, rows: [...] => rows: [...]
		-- open: ["A", ...], rows: ["Open", ...] => rows: ["Open/A", ...]  < may generate the open column >

		if a secondary strat is introduced, we generate a second "open" column
	*/

function addOpenStrat(stageId: number, starDef: RawStarDef, jp_set: StratSet, us_set: StratSet, name: string)
{
	if (!jp_set[name] && !us_set[name]) {
		var vs = buildVarSpace(starDef, name);
		var second = name === "Open#Alt";
		var openDef = openStratDef(stageId + "_" + starDef.id + "_" + name, second, vs);
		jp_set[name] = openDef;
		us_set[name] = openDef;
	}
}

function buildStarDef(stageId: number, starDef: RawStarDef): StarDef
{
	var secondFlag = false;

	// process jp/us strat definitions
	var jp_set: StratSet = {};
	Object.entries(starDef.jp_set).map((_strat) => {
		var [stratName, stratDef] = _strat;
		if (stratDef.diff === 'second') secondFlag = true;
		var vs = buildVarSpace(starDef, stratName);
		var ver: Ver = (vs.verInfo === null) ? "both" : "jp";
		jp_set[stratName] = buildStratDef(stratDef, "beg", ver, vs);
	});

	var us_set: StratSet = {};
	Object.entries(starDef.us_set).map((_strat) => {
		var [stratName, stratDef] = _strat;
		if (stratDef.diff === 'second') secondFlag = true;
		var vs = buildVarSpace(starDef, stratName);
		var ver: Ver = (vs.verInfo === null) ? "both" : "us";
		us_set[stratName] = buildStratDef(stratDef, "beg", ver, vs);
	});

	// get list of open strats, add open strat if non-existent
	var open: string[] = [];
	if (starDef.open !== null) {
		// construct open list
		open = starDef.open;
		if (!open.includes("Open")) open.unshift("Open");
		if (starDef.alt !== null) open.unshift("Open#Alt");
		// build strats if necessary
		addOpenStrat(stageId, starDef, jp_set, us_set, "Open");
		if (starDef.alt !== null) addOpenStrat(stageId, starDef, jp_set, us_set, "Open#Alt");
	}

	return {
		"name": starDef.name,
		"id": starDef.id,
		"info": starDef.info,
		"alt": starDef.alt,
		"100c": starDef["100c"],
		"def": starDef.def,
		"offset": buildOffsetDat(starDef.offset),
		"secondFlag": secondFlag,
		"variants": starDef.variants,
		"jp_set": jp_set,
		"us_set": us_set,
		"open": open,
		"stageId": stageId
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

export function stratOffsetStarDef(starDef: StarDef, fs: FilterState): StratOffset
{
	if (starDef.alt === null || !fs.altState[0] || !fs.altState[1]) return newStratOffset("-", ["", ""], null, 0);
	var rawName: [string, string] = [starDef.info.option, starDef.alt.info.option];
	var offset = starDef.alt.offset;
	if (starDef.alt.status === "diff") return newStratOffset("-", rawName, null, 0);
	if (offset === undefined) return newStratOffset("-", rawName, "none", 0);
	// merge offsets require a name
	var name = "Raw";
	if (starDef.alt.status === "mergeOffset") name = starDef.alt.info.option;
	return newStratOffset(name, rawName, starDef.alt.status, offset);
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
	if (fs.extFlag === null) verSet = filterExtStratSet(verSet);
	else if (fs.extFlag === "rules") verSet = filterRulesStratSet(starCode(starDef.stageId, starDef), verSet);
	// virtual filter
	if (fs.virtFlag === false) verSet = filterVirtStratSet(verSet);
	// variant filter
	var varAllFlag = true;
	for (let i = 0; i < fs.varFlagList.length; i++) {
		if (!fs.varFlagList[i]) varAllFlag = false;
	}
	if (!varAllFlag) verSet = filterVariantStratSet(verSet, fs.varFlagList);
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
	return hasExtStratSet(starDef.jp_set) || hasExtStratSet(starDef.us_set);
}

export function hasExtOnlyStarDef(starDef: StarDef): boolean {
	return hasExtOnlyStratSet(starDef.jp_set, starDef.us_set);
}

	/*
		wrapper from reading organizational data
	*/

type OrgCache = {
	[k: string]: StarDef
};

const ORG_CACHE: OrgCache = {};

export function orgStageTotal(): number
{
	return orgData.length;
}

export function orgStarDef(stageId: number, starId: number): StarDef
{
	var k = stageId + "_" + starId;
	if (ORG_CACHE[k] === undefined) {
		var UNSAFE_star = orgData[stageId].starList[starId] as any;
		ORG_CACHE[k] = buildStarDef(stageId, UNSAFE_star);
	}
	return ORG_CACHE[k];
}

export function orgStarId(stageId: number, starCode: string): number
{
	var UNSAFE_stage = orgData[stageId];
	for (let i = 0; i < UNSAFE_stage.starList.length; i++) {
		if (UNSAFE_stage.starList[i].id === starCode) return i;
	}
	throw('Lookup of non-existent star code: ' + starCode + ' for stage id: ' + stageId + '.');	
}