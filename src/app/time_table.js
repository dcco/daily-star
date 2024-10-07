
//import orgData from './json/org_data.json'
//import playerData from './json/player_data.json'

	/*
		time_map: mapping of names to { map[column id, multi_dat] }
			intermediate data structure used to create time tables
	*/

function sortInsert(list, v, compareFn) {
	// invariant:
	// -- FORALL i >= r. v < list[i]
	// -- FORALL i < l. list[i] <= v
	function sih(l, r) {
		if (r === 0) { list.unshift(v); return; }
		if (r <= l) { list.splice(l, 0, v); return; }
		var m = Math.floor((l + r) / 2);
		if (compareFn(v, list[m]) < 0) sih(l, m);
		else sih(m + 1, r);
	}
	sih(0, list.length);
} 

export function addTimeMap(timeMap, name, colId, timeDat) {
	if (timeMap[name] === undefined) timeMap[name] = {};
	if (timeMap[name][colId] === undefined) timeMap[name][colId] = [];
	var curDat = timeMap[name][colId];
	sortInsert(curDat, timeDat, function(a, b) { return a.time - b.time; });
}

	/* time table: array of
		* name: string - player names
		* tmList: array[multi_dat] - player times
	*/

	// creates a time table from a time pool

export function buildTimeTable(timeMap, colTotal) {
	// transform player map >> player table
	var timeTable = Object.entries(timeMap).map((user) => {
		// transform column map >> column list
		var [name, userDat] = user;
		var timeRow = [];
		var metaList = [];
		for (let i = 0; i < colTotal; i++) {
			if (userDat[i]) {
				timeRow.push(userDat[i]);
			} else {
				timeRow.push(null);
			}
		}
		// row object
		return {
			"name": name,
			"timeRow": timeRow,
		};
	});
	return timeTable;
}

	// filter table based on columns

export function filterTimeTable(timeTable, colList) {
	var filterTable = [];
	for (let i = 0; i < timeTable.length; i++) {
		var userDat = timeTable[i];
		var empty = true;
		var timeRow = colList.map((_strat, j) => {
			var [colId, strat] = _strat;
			var timeCell = userDat.timeRow[colId];
			if (timeCell !== null) empty = false;
			return timeCell;
		});
		if (!empty) filterTable.push({
			"name": userDat.name,
			"timeRow": timeRow
		});
	}
	return filterTable;
}

	// sorts a time table

function sortTimeRow(timeRow)
{
	var sortRow = timeRow.filter((v) => v !== null);
	return sortRow.sort(function (a, b) {
		return a[0].time - b[0].time;
	});
}

function compTimeRow(l1, l2)
{
	// start with the "best" times
	var diff = l1[0][0].time - l2[0][0].time;
	if (diff !== 0) return diff;
	// otherwise, iterate through remaining times
	var ml = Math.min(l1.length, l2.length);
	for (let i = 1; i < ml; i++) {
		var diff = l1[i][0].time - l2[i][0].time;
		if (diff !== 0) return diff;
	}
	// length final tiebreaker
	return l2.length - l1.length;
}

function sortCopy(table, fun) {
	return table.map((x) => x).sort(fun);
}

export function sortTimeTable(timeTable, sortId) {
	// do an initial sort of all times
	timeTable.map(function (v) {
		v["_sort"] = sortTimeRow(v.timeRow);
	});
	// use these time arrays to sort
	if (sortId === 0) {
		return sortCopy(timeTable, function (a, b) {
			return compTimeRow(a._sort, b._sort);
		});
	} else {
		return sortCopy(timeTable, function (a, b) {
			var si = sortId - 1;
			if (a.timeRow[si] === null) {
				if (b.timeRow[si] === null) return compTimeRow(a._sort, b._sort);
				else return 1;
			} else if (b.timeRow[si] === null) return -1;
			var diff = a.timeRow[si][0].time - b.timeRow[si][0].time;
			if (diff !== 0) return diff;
			return compTimeRow(a._sort, b._sort);
		});
	}
}

/*

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


*/
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
