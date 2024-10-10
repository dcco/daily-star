
import { filterTimeTable } from "./time_table"

	/*
		* how does the open column work?
		fundamentally split into the following cases:
		-- open list does not exist - no merge view is given
		-- open list is empty, open xcam row does not exist - open column is not acknowledged
		-- open list is non-empty, open xcam row does not exist - open strats merged into leftmost column
		-- open xcam row exists - other open strats merged into the open column
	*/

	/*
		merge_view: an abstract data structure defining sets of column ids
		 that should be viewed as individual columns. this system is used
		 to merge strats without having to actually make "merged strat defs"
		 (which would be more complicated overall).
		* list: an array of lists of [column id, strat def] pairs, each representing a "merged" column.
		* openName: non-null if the open column is something other than a column named "open".
	*/

	/* merge view creation functions */

export function newMergeView(colList)
{
	return {
		"list": colList.map((strat) => [strat]),
		"openName": null
	};
}

function findColMergeView(mv, name)
{
	for (let i = 0; i < mv.list.length; i++) {
		var sl = mv.list[i];
		for (let j = 0; j < sl.length; j++) {
			var [colId, strat] = sl[j];
			if (strat.name === name) return [i, sl[j]];
		}
	}
	return [-1, null];
}

function removeColMergeView(mv, name)
{
	var [i, _strat] = findColMergeView(mv, name);
	if (i === -1) throw ("Attempted to remove column with non-existent strat " + name + " from merge view.");
	mv.list.splice(i, 1);
	return _strat;
}

function addColMergeView(mv, name, strat)
{
	var [i, _s] = findColMergeView(mv, name);
	if (i === -1) throw ("Attempted to add strat " + strat[1].name + " to column with non-existent strat " + name + " from merge view.");
	mv.list[i].push(strat);
}

function mergeColMergeView(mv, n1, n2)
{
	if (n1 === n2) return;
	var _strat = removeColMergeView(mv, n2);
	addColMergeView(mv, n1, _strat);
}

function mergeColListMergeView(mv, n, nl)
{
	for (let i = 0; i < nl.length; i++) {
		mergeColMergeView(mv, n, nl[i]);
	}
}

function filterOpenList(colList, openList)
{
	var nameList = colList.map((_strat) => _strat[1].name);
	return openList.filter((name) => nameList.includes(name));
}

export function openListMergeView(colList, openList)
{
	// if open list is null, dont merge view
	if (openList === null) return null;
	var mv = newMergeView(colList);
	// exclude columns that dont matter
	openList = filterOpenList(colList, openList);
	// if open list is empty, dont merge view
	if (openList.length === 0) return null;
	// check if column list has an open column of its own
	var hasOpen = null;
	for (const _strat of colList) {
		var [colId, strat] = _strat;
		if (strat.name === "Open") hasOpen = _strat;
	}
	// if it does, merge everything from open list into it
	if (hasOpen !== null) {
		mergeColListMergeView(mv, "Open", openList);
		return mv;
	}
	// otherwise, the left-most column will become the open column
	mv.openName = openList[0];
	mergeColListMergeView(mv, mv.openName, openList);
	return mv;
}

export function formatMergeView(mv)
{
	if (mv === null) return "mv { null }";
	var str = "mv {";
	for (let i = 0; i < mv.list.length; i++)
	{
		if (i !== 0) str = str + ", ";
		var sl = mv.list[i];
		var cx = "[";
		for (let j = 0; j < sl.length; j++) {
			if (j !== 0) cx = cx + ", ";
			cx = cx + sl[j][1].name;
		}
		str = str + cx + "]";
	}
	str = str + "}";
	if (mv.openName !== null) str = str + ": " + mv.openName;
	return str;
}

	/* merge view utilization functions */

function hasNameStratList(sl, name)
{
	for (const _strat of sl)
	{
		if (_strat[1].name === name) return true;
	}
	return false;
}

function nameListStratList(sl, openName)
{
	var str = sl[0][1].name;
	for (let i = 1; i < sl.length; i++) {
		str = str + "/" + sl[i][1].name;
	}
	if (openName !== null && hasNameStratList(sl, openName)) {
		str = "Open/" + str;
	}
	return str;
}

export function nameListMergeView(mv, colList)
{
	if (mv === null) return colList.map((_strat) => _strat[1].name);
	return mv.list.map((sl) => nameListStratList(sl, mv.openName))
}

export function recordListMergeView(mv, colList, recordMap)
{
	if (mv === null) return colList.map((_strat) => recordMap[_strat[1].name]);
	return mv.list.map((sl, i) => {
		var recordDat = recordMap[sl[0][1].name];
		for (let j = 1; j < sl.length; j++) {
			var curDat = recordMap[sl[j][1].name];
			if (curDat.time < recordDat.time) recordDat = curDat;
		}
		return recordDat;
	});
}

export function filterTableMergeView(timeTable, mv, colList)
{
	if (mv === null) return filterTimeTable(timeTable, colList);
	var filterTable = [];
	for (let i = 0; i < timeTable.length; i++) {
		var userDat = timeTable[i];
		var empty = true;
		/*var timeRow = mv.list.map((sl) => {
			var timeDat = null;
			for (const _strat of sl) {
				var [colId, strat] = _strat;
				var curDat = userDat.tmList[colId];
				if (curDat === null) continue;
				empty = false;
				if (timeDat === null || curDat.time < timeDat.time) timeDat = curDat;
			}
			return timeDat;
		});*/
		var mergeRow = mv.list.map((sl) => {
			var mergeCell = [];
			for (const _strat of sl) {
				var [colId, strat] = _strat;
				var timeCell = userDat.timeRow[colId];
				if (timeCell === null) continue;
				empty = false;
				mergeCell = mergeCell.concat(timeCell);
			}
			mergeCell.sort(function(a, b) { return a.time - b.time });
			if (mergeCell.length === 0) mergeCell = null;
			return mergeCell;
		});
		if (!empty) filterTable.push({
			"id": userDat.id,
			"timeRow": mergeRow
		});
	}
	return filterTable;
}