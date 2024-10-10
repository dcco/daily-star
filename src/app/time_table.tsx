
//import orgData from './json/org_data.json'
//import playerData from './json/player_data.json'

import { hasSubTimes } from './time_dat'

	/*
		ident: an identity used for differentiating submission sources (xcam sheet, google account, etc)
		-- services:
			* xcam - name from the xcam sheet
			* remote - anonymous player id registered in the daily star database
				- used to prevent personal user information from leaking
				- nickname table is loaded for the display 
			* google - google account
				- used locally + in tokens sent to the backend
	*/

export function newIdent(service, name) {
	return {
		"service": service,
		"name": name,
		"token": null
	}
}

export function keyIdent(id) {
	return id.service + "@" + id.name;
}

export function sameIdent(id1, id2) {
	return id1.service === id2.service && id1.name === id2.name;
}

	/*
		time_row: an array of multi_dats
	*/

export function freshTimeRow(len, newId) {
	return {
		"id": newId,
		"timeRow": Array(len).fill(null)
	};
}

export function hasSubRows(timeRow) {
	var flag = false;
	timeRow.map((multiDat) => {
		if (hasSubTimes(multiDat)) flag = true;
	});
	return flag;
}

	/*
		time_map: mapping of identifiers to { map[column id, multi_dat] }
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

export function addTimeMap(timeMap, id, colId, timeDat) {
	var key = keyIdent(id);
	if (timeMap[key] === undefined) timeMap[key] = {};
	timeMap[key]["_id"] = id;
	if (timeMap[key][colId] === undefined) timeMap[key][colId] = [];
	var curDat = timeMap[key][colId];
	sortInsert(curDat, timeDat, function(a, b) { return a.time - b.time; });
}

	/* time table: array of
		* id: ident - player identities
		* timeRow: array[multi_dat] - player times
	*/

	// creates a time table from a time pool

export function buildTimeTable(timeMap, colTotal) {
	// transform player map >> player table
	var timeTable = Object.entries(timeMap).map((user) => {
		// transform column map >> column list
		var [key, userDat] = user;
		var id = userDat._id;
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
			"id": id,
			"timeRow": timeRow,
		};
	});
	return timeTable;
}

	/* -- filter: filter table based on columns */

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
			"id": userDat.id,
			"timeRow": timeRow
		});
	}
	return filterTable;
}

	/* -- sort: sort table based on best times (can prioritize one column) */

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
