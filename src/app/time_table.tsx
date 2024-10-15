
//import orgData from './json/org_data.json'
//import playerData from './json/player_data.json'

import { TimeDat, MultiDat, vtagTimeDat, hasSubTimes } from './time_dat'
import { ColList } from './org_strat_def'

	/*
		ident: an identity used for viewing times
		-- services:
			* xcam - name from the xcam sheet
			* remote - anonymous player id registered in the daily star database
				- used to prevent personal user information from leaking
				- nickname table is loaded for the display 
			* google - google account
				- used locally + implicit in tokens sent to the backend
	*/

export type IdService = "xcam" | "remote" | "google";

export type Ident = {
	"service": IdService,
	"name": string
};

export function newIdent(service: IdService, name: string): Ident {
	return {
		"service": service,
		"name": name
	}
}

export function keyIdent(id: Ident): string {
	return id.service + "@" + id.name;
}

	/*
		auth_ident: an identity used for submitting times (includes a token for verification)
			stronger but compatible with the regular identitiy token
	*/

export type AuthIdent = {
	"name": string,
	"remoteId": string | null,
	"token": any,
};

export function newAuthIdent(name: string): AuthIdent {
	return {
		"name": name,
		"remoteId": null,
		"token": null
	}
}

export function dropIdent(id: AuthIdent): Ident {
	return {
		"service": "google",
		"name": id.name
	};
}

export function matchIdent(id1: AuthIdent, id2: Ident): boolean {
	if (id1.remoteId !== null && id2.service === "remote" && id1.remoteId === id2.name) return true;
	return id2.service === "google" && id1.name === id2.name;
}

	/*
		time_row: an array of multi_dats
		user_dat: time_row with user attached
	*/

export type TimeEntry = MultiDat | null;
export type TimeRow = TimeEntry[];

export function hasSubRows(timeRow: TimeRow): boolean {
	var flag = false;
	timeRow.map((multiDat) => {
		if (hasSubTimes(multiDat)) flag = true;
	});
	return flag;
}

export type UserDat = {
	"id": Ident,
	"timeRow": TimeRow
}

export function freshUserDat(len: number, newId: Ident): UserDat {
	return {
		"id": newId,
		"timeRow": Array(len).fill(null)
	};
}

	/*
		time_map: mapping of identifiers to { map[column id, map["vtag", time_dat]] }
			intermediate data structure used to create time tables
			("vtag" is a string made up of the strat + version names + variants, used
				to ensure that the only times used have unique variant combinations)
	*/

type MMap = {
	[key: string]: TimeDat
};

export type TimeMap = {
	[key: string]: {
		"data": { [key: string]: MMap },
		"id": Ident
	}
};
/*
function sortInsert<T>(list: T[], v: T, compareFn: (a: T, b: T) => number) {
	// invariant:
	// -- FORALL i >= r. v < list[i]
	// -- FORALL i < l. list[i] <= v
	function sih(l: number, r: number) {
		if (r === 0) { list.unshift(v); return; }
		if (r <= l) { list.splice(l, 0, v); return; }
		var m = Math.floor((l + r) / 2);
		if (compareFn(v, list[m]) < 0) sih(l, m);
		else sih(m + 1, r);
	}
	sih(0, list.length);
}*/

export function addTimeMap(timeMap: TimeMap, id: Ident, colId: number, timeDat: TimeDat) {
	var key = keyIdent(id);
	if (timeMap[key] === undefined) timeMap[key] = { "data": {}, "id": id };
	if (timeMap[key].data["" + colId] === undefined) timeMap[key].data["" + colId] = {};
	var multiMap = timeMap[key].data["" + colId];
	var vtag = vtagTimeDat(timeDat);
	if (multiMap[vtag] === undefined || timeDat.time < multiMap[vtag].time) multiMap[vtag] = timeDat;
	//sortInsert(curDat, timeDat, function(a, b) { return a.time - b.time; });
}

function buildMMap(multiMap: MMap | undefined): MultiDat | null {
	if (multiMap === undefined) return null;
	var multiDat = Object.entries(multiMap).map((entry) => entry[1]);
	if (multiDat.length === 0) return null;
	multiDat.sort(function(a, b) { return a.time - b.time; });
	return multiDat;
}

	/* time table: array of
		* id: ident - player identities
		* timeRow: array[multi_dat] - player times
	*/

export type TimeTable = UserDat[];

	// creates a time table from a time pool

export function buildTimeTable(timeMap: TimeMap, colTotal: number): TimeTable {
	// transform player map >> player table
	var timeTable: TimeTable = Object.entries(timeMap).map((user) => {
		// transform column map >> column list
		var [key, userDat] = user;
		var id = userDat.id;
		var timeRow: TimeRow = [];
		for (let i = 0; i < colTotal; i++) {
			timeRow.push(buildMMap(userDat.data[i]));
		}
		// row object
		return {
			"id": id,
			"timeRow": timeRow,
		};
	});
	return timeTable;
}

export function findIdTimeTable(timeTable: TimeTable, id: AuthIdent): number
{
	for (let i = 0; i < timeTable.length; i++) {
		if (matchIdent(id, timeTable[i].id)) return i;
	}
	return -1;
}

export function updateTimeTable(timeTable: TimeTable, colTotal: number,
	id: AuthIdent, colId: number, timeDat: TimeDat)
{
	// find row for the user
	var uId = findIdTimeTable(timeTable, id);
	// if the user does not exist, add them
	if (uId === -1) {
		var timeRow: TimeRow = Array(colTotal).fill(null);
		uId = timeTable.length;
		timeTable.push({ "id": dropIdent(id), "timeRow": timeRow });
	}
	// find specified column
	var userDat = timeTable[uId];
	var multiDat: MultiDat = [];
	if (userDat.timeRow[colId] !== null) {
		multiDat = userDat.timeRow[colId];
	} else {
		userDat.timeRow[colId] = multiDat;
	}
	// check if the time is better than other relevant entries
	var addFlag = true;
	for (let i = 0; i < multiDat.length; i++) {
		var curDat = multiDat[i];
		if (vtagTimeDat(curDat) === vtagTimeDat(timeDat)) {
			addFlag = timeDat.time < curDat.time;
			if (addFlag) {
				multiDat.splice(i, 1);
				break;
			}
		}
	}
	// add if it is
	if (addFlag) {
		multiDat.push(timeDat);
		multiDat.sort(function(a, b) { return a.time - b.time });
	}
}

	/* -- filter: filter table based on columns */

export function filterTimeTable(timeTable: TimeTable, colList: ColList): TimeTable {
	var filterTable: TimeTable = [];
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

type CompRow = MultiDat[];
type ExUserDat = UserDat & { "_sort": CompRow };
type ExTimeTable = ExUserDat[];

function sortTimeRow(timeRow: TimeRow): CompRow
{
	var sortRow: CompRow = (timeRow.filter((v) => v !== null) as any);
	return sortRow.sort(function (a, b) {
		return a[0].time - b[0].time;
	});
}

function compTimeRow(l1: CompRow, l2: CompRow): number
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

function sortCopy(table: ExTimeTable, fun: (a: ExUserDat, b: ExUserDat) => number): ExTimeTable {
	return table.map((x) => x).sort(fun);
}

export function sortTimeTable(timeTable: TimeTable, sortId: number): TimeTable {
	// do an initial sort of all times
	var exTable: ExTimeTable = timeTable.map(function (v) {
		return { "id": v.id, "timeRow": v.timeRow, "_sort": sortTimeRow(v.timeRow) };
	});
	// use these time arrays to sort
	if (sortId === 0) {
		return sortCopy(exTable, function (a, b) {
			return compTimeRow(a._sort, b._sort);
		});
	} else {
		return sortCopy(exTable, function (a, b) {
			var si = sortId - 1;
			var ai = a.timeRow[si];
			var bi = b.timeRow[si];
			if (ai === null) {
				if (bi === null) return compTimeRow(a._sort, b._sort);
				else return 1;
			} else if (bi === null) return -1;
			var diff = ai[0].time - bi[0].time;
			if (diff !== 0) return diff;
			return compTimeRow(a._sort, b._sort);
		});
	}
}
