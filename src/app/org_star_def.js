
import orgData from './json/org_data.json'

import { newVerOffset } from "./time_dat"
import { mergeStratSet, hasExtStratSet, filterExtStratSet, stratSetToColList } from "./strat_def"

	/*
		filter_state: filter settings for the xcam viewer
		* verState: which versions to display (when relevant)
		* extFlag: whether to display extension sheet columns/times
	*/

export function newFilterState()
{
	return {
		"verState": [true, false],
		"extFlag": false 
	};
}

export function fullFilterState()
{
	return {
		"verState": [true, true],
		"extFlag": true
	};
}

export function copyFilterState(fs)
{
	var nvs = [fs.verState[0], fs.verState[1]];
	return {
		"verState": nvs,
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

	// from org_data - reads star definition

export function orgStarDef(stageId, starId)
{
	return orgData[stageId].starList[starId];
}

function mainVerStarDef(starDef)
{
	// if no version specified, no version diff
	if (starDef.def === undefined) return null;
	// in all cases except US, default to JP
	if (starDef.def === "us") return "us";
	return "jp";
}

export function verOffsetStarDef(starDef, fs)
{
	// override default version if only one version is being viewed
	var verState = fs.verState;
	var focusVer = mainVerStarDef(starDef);
	if (focusVer !== null && verState[0] !== verState[1]) {
		if (verState[0]) focusVer = "jp";
		else if (verState[1]) focusVer = "us";
	}
	// build version offset
	var offset = starDef.offset;
	var complexOff = (offset !== null && typeof offset !== "number");
	return newVerOffset(focusVer, complexOff, offset);
}

export function stratSetStarDef(starDef, fs)
{
	// merge version sets if needed
	var verState = fs.verState;
	var verSet = {};
	if (verState[0] && verState[1]) verSet = mergeStratSet(starDef.jp_set, starDef.us_set);
	else if (verState[1]) verSet = starDef.us_set;
	else verSet = starDef.jp_set;
	// extension filter
	if (fs.extFlag === false) verSet = filterExtStratSet(verSet);
	return verSet;
}

export function colListStarDef(starDef, fs) {
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

export function hasExtStarDef(starDef) {
	var fullSet = Object.entries(starDef.jp_set);
	fullSet = fullSet.concat(Object.entries(starDef.us_set));
	return hasExtStratSet(fullSet);
}
