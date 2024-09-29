
import orgData from './json/org_data.json'
import playerData from './json/player_data.json'

import { mergeStratSet, filterExtStratSet } from "./strat_def"

	// converts a list of structs to a map

export function asPool(list, k, ix) {
	var pool = {};
	for (let i = 0; i < list.length; i++) {
		var obj = list[i];
		pool[obj[k]] = obj;
		if (ix) pool[obj[k]][ix] = i;
	}
	return pool;
}

	// misc star information

export function hasExt(starDef) {
	var fullSet = Object.entries(starDef.jp_set);
	fullSet = fullSet.concat(Object.entries(starDef.us_set));
	for (const [name, strat] of fullSet) {
		for (const ref of strat.id_list) {
			if (ref[0] === "ext") return true;
		}
	}
	return false;
}

	// column generation algorithm
/*
function containsRef(l, ref) {
	for (let i = 0; i < l.length; i++) {
		var rx = l[i];
		if (ref[0] === rx[0] && ref[1] === rx[1]) return true;
	}
	return false;
}

function mergeVarList(v1, v2) {
	var vx = [];
	var ver_map = {};
	v1.map((ref) => {
		vx.push(ref)
		ver_map[ref[0] + "_" + ref[1]] = "jp";
	});
	v2.map((ref) => {
		if (!containsRef(vx, ref)) {
			vx.push(ref);
			ver_map[ref[0] + "_" + ref[1]] = "us";
		} else {
			ver_map[ref[0] + "_" + ref[1]] = "both";
		}
	});
	return [vx, ver_map];
}

function mergeVerSet(vs1, vs2) {
	var vsx = {};
	Object.entries(vs1).map((strat) => {
		var [stratName, stratDef] = strat;
		if (vs2[stratName] !== undefined) {
			var [id_list, ver_map] = mergeVarList(stratDef.id_list, vs2[stratName].id_list);
			var newDef = {
				"name": stratName,
				"diff": stratDef.diff,
				"virtual": stratDef.virtual,
				"virtId": stratDef.virtId,
				"variant_map": stratDef.variant_map,
				"id_list": id_list,
				"ver_map": ver_map
			};
			vsx[stratName] = newDef;
		} else {
			vsx[stratName] = stratDef;
			vsx[stratName].ver_all = "jp";
		}
	});
	Object.entries(vs2).map((strat) => {
		var [stratName, stratDef] = strat;
		if (vs1[stratName] === undefined) {
			vsx[stratName] = stratDef;
			vsx[stratName].ver_all = "us";
		}
	});
	return vsx;
}

function filterExtVerSet(vs) {
	var vsx = {};
	Object.entries(vs).map((strat) => {
		var [stratName, stratDef] = strat;
		var newDef = {
			"name": stratName,
			"diff": stratDef.diff,
			"virtual": stratDef.virtual,
			"virtId": stratDef.virtId,
			"variant_map": stratDef.variant_map,
			"id_list": stratDef.id_list.filter((ref) => ref[0] === 'main'),
			"ver_map": stratDef.ver_map
		};
		vsx[stratName] = newDef;
	});
	return vsx;
}*/

export function orgColList(stageId, starId, verState, extFlag) {
	var starDef = orgData[stageId].starList[starId];
	// merge version sets if needed
	var verSet = {};
	if (verState[0] && verState[1]) verSet = mergeStratSet(starDef.jp_set, starDef.us_set);
	else if (verState[1]) verSet = starDef.us_set;
	else verSet = starDef.jp_set;
	// extension filter
	if (extFlag === false) verSet = filterExtStratSet(verSet);
	// build column list
	var colList = [];
	Object.entries(verSet).map((strat) => {
		var [stratName, stratDef] = strat;
		if (stratDef.virtual || stratDef.id_list.length !== 0) colList.push(stratDef);
	});
	return colList;
}

/*
export function orgVariantList(colList, variant) {
	var vList = [];
	colList.map((strat, i) => {
		var second = strat.diff.includes("second");
		if ((variant === null) === !second) {
			vList.push(i);
		}
	})
	return vList;
}
*/
export function orgVarColList(colList, variant) {
	var vList = [];
	colList.map((strat, i) => {
		var second = strat.diff.includes("second");
		if ((variant === null) === !second) {
			vList.push([i, colList[i]]);
		}
	})
	return vList;
}

	// time pool data structure
	// -- intermediate data structure used to create time tables
	// -- will only update with better times
	// : mapping of names to { map<column ids, pooldata> }
	// : pooldata { rawTime: int, time: int, ver: "jp"/"us"/"both", variant_list: array[int] }

export function addTimePool(timePool, name, colId, timeDat) {
	if (timeDat.variant_list === undefined) timeDat.variant_list = [];
	if (timePool[name] === undefined) timePool[name] = {};
	var colData = timePool[name][colId];
	if (colData === undefined) {
		timePool[name][colId] = timeDat;
		return;
	}
	if (timeDat.time < colData.time) {
		colData.rawTime = timeDat.rawTime;
		colData.time = timeDat.time;
		colData.ver = timeDat.ver;
		colData.variant_list = timeDat.variant_list;
	}
}

	/* time table data structure
		: 2d array of {
			name: string,
			tmList: array[pooldata],
			-- bestTime: int,
			<playStd>: string -- deprecated, standards lookup will be done separately
		}
	*/

	// creates a time table from a time pool

export function buildTimeTable(timePool, colTotal) {
	// transform player map >> player table
	var timeTable = Object.entries(timePool).map((user) => {
		var [name, userDat] = user;
		//var bestTime = 999900;
		// transform column map >> column list + calc best time
		var timeList = [];
		var metaList = [];
		for (let i = 0; i < colTotal; i++) {
			if (userDat[i]) {
				timeList.push(userDat[i]);
				//if (userDat[i] < bestTime) { bestTime = userDat[i]; }
			} else {
				timeList.push(null);
			}
		}
		// DEPRECATED
		var standard = "Unranked";
		if (playerData[name] !== undefined && playerData[name].standard) {
			standard = playerData[name].standard;
		}
		// row object
		return {
			"name": name,
			"tmList": timeList,
			//"bestTime": bestTime,
			"playStd": standard
		};
	});
	return timeTable;
}

export function hasTimeTable(timeTable, name) {
	for (let i = 0; i < timeTable.length; i++) {
		if (timeTable[i].name === name) return i;
	}
	return -1;
}

export function updateTimeTable(timeTable, name, newList) {
	var tt = timeTable.map((x) => x);
	if (hasTimeTable(tt, name) === -1) {
		tt.push({
			"name": name,
			"timeList": Array(newList.length).fill(null),
			"metaList": Array(newList.length).fill(null),
			//"bestTime": 999900,
			"playStd": "Unranked"
		})
	}
	// new time list calc
	var rowId = hasTimeTable(tt, name);
	var timeList = tt[rowId].timeList.map((x) => x);
	//var bestTime = tt[rowId].bestTime;
	for (let i = 0; i < timeList.length; i++) {
		var time = newList[i];
		if (time !== null) {
			if (timeList[i] === null || time < timeList[i]) {
				timeList[i] = {
					"time": time,
					// need to actually include version info
					"ver": "both"
				}
			}
			//if (bestTime < time) bestTime = time;
		}
	}
	tt[rowId].tmList = timeList;
	//tt[rowId].bestTime = bestTime; 
	// DEPRECATED
	var standard = "Unranked";
	if (playerData[name] !== undefined && playerData[name].standard) {
		standard = playerData[name].standard;
	}
	return tt;
}

	// filter table based on columns + adds best times
export function filterTimeTable(timeTable, colList) {
	var filterTable = [];
	for (let i = 0; i < timeTable.length; i++) {
		var userDat = timeTable[i];
		var empty = true;
		var bestTime = 999900;
		var timeList = colList.map((_strat, j) => {
			var [colId, strat] = _strat;
			var timeDat = userDat.tmList[colId];
			if (timeDat !== null) {
				empty = false;
				if (timeDat.time < bestTime) bestTime = timeDat.time;
			}
			return timeDat;
		});
		if (!empty) filterTable.push({
			"name": userDat.name,
			"tmList": timeList,
			"bestTime": bestTime,
			"playStd": userDat.playStd // DEPRECATE
		});
	}
	return filterTable;
}

function firstColName(colList, nameList) {
	// for loops because the exact ordering matters + early return
	for (let i = 0; i < nameList.length; i++) {
		var name = nameList[i];
		for (let j = 0; j < colList.length; j++) {
			var [colId, strat] = colList[j];
			if (strat.name === name) return [name, j];
		}
	}
	return null;
}

	// merges a list of columns in the time table
export function mergeColTimeTable(timeTable, colList, nameList) {
	// find the column to merge into
	var fnDat = firstColName(colList, nameList);
	if (fnDat === null) return timeTable;
	var [firstName, mergeId] = fnDat;
	
	// make a mapping of names to column ids
	var nameMap = {};
	for (const name of nameList) {
		colList.map((_strat, i) => {
			var [colId, strat] = _strat;
			if (strat.name === name) nameMap[name] = i;
		});
	}

	// merge the times into the required column
	for (let i = 0; i < timeTable.length; i++) {
		var userDat = timeTable[i];
		var bestDat = null;
		for (const name of nameList) {
			var nameId = nameMap[name];
			if (nameId !== undefined) {
				var nameDat = userDat.tmList[nameId];
				if (nameDat !== null) {
					if (bestDat === null || nameDat.time < bestDat.time) bestDat = nameDat;
				}
			}
		}
		userDat.tmList[mergeDat] = bestDat; 
	}

	// remove the remaining columns
	for (let i = 0; i < timeTable.length; i++) {
		var userDat = timeTable[i];
		var newList = [];
		userDat.tmList.map((timeDat, i) => {
			var colName = colList[i][1].name;
			if (colName === firstName || nameMap[colName] === undefined) {
				newList.push(timeDat);
			}
		});
		userDat.tmList = newList;
	}
}

/*
export function updateTimeTable(timeTable, name, timeList) {

}*/

/*
export function buildTimeTable(colTotal, timePool, stdFlag) {
	var timeTable = Object.entries(timePool).map((user) => {
		var [name, userDat] = user;
		var bestTime = 999900;
		var timeList = [];
		for (let i = 0; i < colTotal; i++) {
			if (userDat[i]) {
				timeList.push(userDat[i]);
				if (userDat[i] < bestTime) { bestTime = userDat[i]; }
			} else {
				timeList.push(null);
			}
		}
		var standard = "Unranked";
		if (stdFlag && playerData[name] !== undefined && playerData[name].standard) {
			standard = playerData[name].standard;
		}
		return {
			"name": name,
			"timeList": timeList,
			"bestTime": bestTime,
			"playStd": standard
		};
	});
	timeTable.sort(function(a, b) { return a.bestTime - b.bestTime });
	return timeTable;
}*/
