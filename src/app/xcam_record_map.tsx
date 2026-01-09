
//import rowData from './json/row_data.json'
import { G_SHEET } from './api_xcam'

import { TimeDat, VerOffset, StratOffset, rawMS,
	newTimeDat, maxTimeDat, applyVerOffset, applyStratOffset } from './time_dat'
import { zeroRowDef, begRowDef } from './row_def'
import { StratDef, ColList, readRefMap } from './org_strat_def'
import { FilterState } from './org_star_def'

	/*
		record_map: a mapping of strat names to time_dats
	*/

export type RecordMap = {
	[key: string]: TimeDat;
}

type BanMap = {
	[key: string]: [string, string][]
}

function makeBanMap(banList: string[][]): BanMap
{
	var bm: BanMap = {};
	for (const banData of banList)
	{
		if (bm[banData[1]] === undefined) bm[banData[1]] = [];
		bm[banData[1]].push([banData[0], banData[2]]);
	}
	return bm;
}

function checkBanMap(bm: BanMap, sDef: StratDef, timeDat: TimeDat): string | null
{
	if (bm[sDef.name] === undefined) return null;
	var banList = bm[sDef.name];
	for (const variant of timeDat.rowDef.variant_list)
	{
		var [vId, groupName] = variant;
		if (vId === -1) continue;
		var vName = sDef.vs.variants[vId];
		for (const banEx of banList) {
			var [xName, altName] = banEx;
			if (vName === xName) {
				return altName;
			}
		}
	}
	return null;
}

export function xcamRecordMapBan(colList: ColList, fs: FilterState,
	verOffset: VerOffset, stratOffset: StratOffset, banList: string[][], forceAdjust?: number): RecordMap
{
	var rowData = G_SHEET.rowData;
	var bm = makeBanMap(banList);
	// build record map
	var recordMap: RecordMap = {};
	var allRecord = maxTimeDat(zeroRowDef("Open"));
	var allRecordAlt = maxTimeDat(zeroRowDef("Open#Alt"));
	for (let i = 0; i < colList.length; i++) {
		var [colId, stratDef] = colList[i];
		var record = maxTimeDat(zeroRowDef(stratDef.name));
		var secondFlag = stratDef.diff.includes("second");
		if (stratDef.virtId === null) {
			for (const xcamRef of stratDef.id_list) {
				var [xs, xcamId] = xcamRef;
				var cellDat = rowData[xs][xcamId];
				if (cellDat === undefined) continue;
				var rawTime = rawMS(cellDat.record);
				if (rawTime === null) continue;
				// apply version offset
				var timeDat = newTimeDat(rawTime, cellDat.link, cellDat.note, null,
					readRefMap(stratDef.row_map, xcamRef, "rm:" + stratDef.name));
				applyVerOffset(timeDat, verOffset);
				applyStratOffset(timeDat, secondFlag, stratOffset, forceAdjust);
				var altName = checkBanMap(bm, stratDef, timeDat);
				if (altName === null && timeDat.time < record.time) record = timeDat;
				else if (altName !== null) {
					var banRecord = recordMap[altName];
					if (banRecord === undefined || timeDat.time < banRecord.time) recordMap[altName] = timeDat;
				}
				if (timeDat.time < allRecord.time && !secondFlag) allRecord = timeDat;
				if (timeDat.time < allRecordAlt.time && secondFlag) allRecordAlt = timeDat;
			}
		} else if (stratDef.virtId.kind === 'beg') {
			//console.log(stratDef);
			if (rowData.beg[stratDef.virtId.id] === undefined) {
				throw ("No beginner strat found for " + stratDef.virtId.id);
			}
			var rawTime = rawMS(rowData.beg[stratDef.virtId.id][0]);
			if (rawTime === null) throw ("Bad beginner time listed for " + stratDef.name);
			var timeDat = newTimeDat(rawTime, null, null, null, begRowDef(stratDef.name));
			applyVerOffset(timeDat, verOffset);
			applyStratOffset(timeDat, secondFlag, stratOffset, forceAdjust);
			if (timeDat.time < record.time) record = timeDat;
			if (timeDat.time < allRecord.time && !secondFlag) allRecord = timeDat;
			if (timeDat.time < allRecordAlt.time && secondFlag) allRecordAlt = timeDat;
		}
		recordMap[stratDef.name] = record;
	}
	recordMap["Open"] = allRecord;
	recordMap["Open#Alt"] = allRecordAlt;
	return recordMap;
}

export function xcamRecordMap(colList: ColList, fs: FilterState,
	verOffset: VerOffset, stratOffset: StratOffset, forceAdjust?: number): RecordMap
{
	return xcamRecordMapBan(colList, fs, verOffset, stratOffset, [], forceAdjust);
}

export function sortColList(colList: ColList, recordMap: RecordMap)
{
	colList.sort(function (a, b) {
		var open1 = a[1].name === "Open" || a[1].name === "Open#Alt";
		var open2 = b[1].name === "Open" || b[1].name === "Open#Alt";
		if (open1 && !open2) return -1;
		else if (!open1 && open2) return 1;
		var time1 = recordMap[a[1].name];
		var time2 = recordMap[b[1].name];
		return time1.time - time2.time;
	});
}
