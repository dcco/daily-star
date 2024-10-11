
import orgData from './json/org_data.json'

import { VerF, Ver, StratSet, ColList,
	mergeStratSet, hasExtStratSet, filterExtStratSet, stratSetToColList } from "./strat_def"
import { OffsetDat, VerOffset, newVerOffset } from "./time_dat"

	/*
		filter_state: filter settings for the xcam viewer
		* verState: which versions to display (when relevant)
		* extFlag: whether to display extension sheet columns/times
	*/

export type FilterState = {
	"verState": [boolean, boolean],
	"extFlag": boolean
}

export function newFilterState(): FilterState
{
	return {
		"verState": [true, false],
		"extFlag": false 
	};
}

export function newExtFilterState(): FilterState
{
	return {
		"verState": [true, false],
		"extFlag": true
	};
}

export function fullFilterState(): FilterState
{
	return {
		"verState": [true, true],
		"extFlag": true
	};
}

export function copyFilterState(fs: FilterState): FilterState
{
	return {
		"verState": [fs.verState[0], fs.verState[1]],
		"extFlag": fs.extFlag
	};
}

	/*
		star_def: definition of a star, read from org_data
		* name
		* def: defines the "default" version for a star
			- "na": no version diffs
			- "jp" / "us": only one version relevant at top-level
			- "offset": both versions relevant at top-level, can be compared with time offset
			- null: both versions relevant at top-level + strat diffs, can be compared with time offset
			- "spec": both versions relevant at top level, no meaningful time offset
				(we treat the latter two cases essentially the same as offset)
		* offset: a single integer, or a mapping of strat names to integers that define the JP/US offset
		* jp_set/us_set: mapping of strat names to strat defs
	*/

export type JSOffset = null | number | { [key: string]: number };

export type StarDef = {
	"name": string,
	"def": "na" | "jp" | "us" | "offset" | "spec" | null,
	"offset": JSOffset,
	"jp_set": StratSet,
	"us_set": StratSet,
	"variants": string[] | undefined,
	"open": string[] | null
}

	// from org_data - reads star definition

export function orgStarDef(stageId: number, starId: number): StarDef
{
	var UNSAFE_res: any = orgData[stageId].starList[starId];
	return UNSAFE_res;
}

export function mainVerStarDef(starDef: StarDef): VerF | null
{
	// if no version specified, no version diff
	if (starDef.def === undefined) return null;
	// in all cases except US, default to JP
	if (starDef.def === "us") return "us";
	return "jp";
}

function buildOffsetDat(offset: JSOffset): OffsetDat {
	if (offset === null) return { 'a': false, 'num': 0 };
	else if (typeof offset === 'number') return { 'a': false, 'num': offset };
	return { 'a': true, 'data': offset };
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
	return newVerOffset(focusVer, buildOffsetDat(starDef.offset));
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
	return verSet;
}

export function colListStarDef(starDef: StarDef, fs: FilterState): ColList {
	var vs = stratSetStarDef(starDef, fs);
	return stratSetToColList(vs);
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
	var fullSet = Object.entries(starDef.jp_set);
	fullSet = fullSet.concat(Object.entries(starDef.us_set));
	return hasExtStratSet(fullSet);
}
