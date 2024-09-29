
import orgData from './json/org_data.json'
import rowData from './json/row_data.json'

import { orgColList } from "./timetable"
	
function _secMS(secText) {
	if (!secText.includes('.')) return parseInt(secText) * 100;
	var ft = secText.split('.');
	return (parseInt(ft[0]) * 100) + parseInt(ft[1]);
}

export function rawMS(fillText) {
	if (!fillText) return null;
	try {
		// does not need to include special fixes from xcam sheet
		if (!fillText.includes(':')) return _secMS(fillText);
		var ft = fillText.split(':');
		var min = parseInt(ft[0]);
		var sec = _secMS(ft[1]);
		return (min * 6000) + sec;
	} catch (err) {
		return null;
	}
}

export function msToFrames(ms) {
	var dFrames = Math.floor(ms / 10) * 3;
	var hs = ms % 10;
	var hFrames = 0;
	if (hs >= 3 && hs < 6) hFrames = 1;
	else if (hs >= 6) hFrames = 2;
	return dFrames + hFrames; 
}

export function framesToMS(frames) {
	// absolute value frames
	var neg = frames < 0;
	frames = Math.abs(frames);
	// calc each section
	var ts = Math.floor(frames / 3) * 10;
	var triMS = frames % 3;
	var hs = 0;
	if (triMS === 1) hs = 3;
	else if (triMS === 2) hs = 6;
	// final number
	var fs = ts + hs;
	if (neg) fs = -fs;
	return fs;
}

export function addFrames(frames, ms) {
	return framesToMS(frames + msToFrames(ms));
}

export function subFrames(frames, ms) {
	return framesToMS(msToFrames(ms) - frames);
}

	// version data

	/* focusVer: optional parameter, overrides focusVer in verData */
export function applyVerOffset(verData, rowVer, time, name, focusVer) {
	// calc offset
	var offset = verData.offset;
	if (verData.complexOff) {
		if (verData.offset[name] !== undefined) offset = verData.offset[name];
		else offset = 0;
	}
	// apply offset
	if (focusVer === undefined) focusVer = verData.focusVer;
	if (focusVer === "jp" && rowVer === "us") return addFrames(offset, time);
	else if (focusVer === "us" && rowVer === "jp") return addFrames(-offset, time);
	return time;
}

/*function readVerDef(verState, verText) {
	// if no version specified, there is no version diff
	if (verText === undefined) return "both";
	// if only one version is enabled, only one version matters
	if (verState[0] && !verState[1]) return "jp";
	if (verState[1] && !verState[0]) return "us";
	// if both columns matter, select jp by default
	if (verText === null || verText === "offset") return "jp";
	// otherwise, default to sepcified column
	if (verText === "jp" || verText === "us") return verText;
	return "none";
}*/

function _focusVer(verState, verText) {
	// if no version specified, no version diff
	if (verText === undefined) return null;
	// if only one US is enabled, focus on it
	if (!verState[0] && verState[1]) return "us";
	// in all cases except US, default to JP
	if (verText === "us") return "us";
	return "jp";
}

export function starVerData(starDef, verState) {
	var focusVer = _focusVer(verState, starDef.def);
	var offset = starDef.offset;
	var complexOff = (offset !== null && typeof offset !== "number");
	return {
		"focusVer": focusVer,
		"complexOff": complexOff,
		"offset": offset
	}
}

	// record map generation

export function stratRowVer(stratDef, rowRef) {
	if (stratDef.ver_all !== undefined) return stratDef.ver_all;
	else if (stratDef.ver_map !== undefined) return stratDef.ver_map[rowRef[0] + "_" + rowRef[1]];
	return "both";
}

export function orgRecordMap(stageId, starId, verState) {
	// extract column + version offset data
	var colList = orgColList(stageId, starId, verState, true);
	var verData = starVerData(orgData[stageId].starList[starId], verState);
	// build record map
	var recordMap = {};
	function recObj(rawTime, time, ver) {
		return { "rawTime": rawTime, "time": time, "ver": ver };
	}
	for (let i = 0; i < colList.length; i++) {
		var stratDef = colList[i];
		var record = recObj(999900, 999900, "jp");
		if (!stratDef.virtual) {
			for (const xcamRef of stratDef.id_list) {
				var [xs, xcamId] = xcamRef;
				var rawTime = rawMS(rowData[xs][xcamId].record);
				if (rawTime === null) continue;
				// apply version offset
				var rowVer = stratRowVer(stratDef, xcamRef);
				var time = applyVerOffset(verData, rowVer, rawTime, stratDef.name);
				if (time < record.time) record = recObj(rawTime, time, rowVer);
			}
		} else {
			var rawTime = rawMS(rowData.beg[stratDef.virtId][0]);
			var time = applyVerOffset(verData, "jp", rawTime, stratDef.name, "jp");
			if (time < record.time) record = recObj(rawTime, time, "jp");
		}
		recordMap[stratDef.name] = record;
	}
	return recordMap;
}

export function applyRecordMap(colList, key, recordMap) {
	colList.map(function (col) {
		col[key] = recordMap[col.name];
	})
}
