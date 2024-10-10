
//import rowData from './json/row_data.json'
import { G_SHEET } from './xcam_wrap'

import { ColList, zeroRowDef, begRowDef, rowDefStratDef } from './strat_def'
import { TimeDat, VerOffset, rawMS, newTimeDat, maxTimeDat, applyVerOffset } from './time_dat'
import { FilterState } from './org_star_def'

	/*
		record_map: a mapping of strat names to time_dats
	*/

export type RecordMap = {
	[key: string]: TimeDat;
}

export function xcamRecordMap(colList: ColList, fs: FilterState, verOffset: VerOffset): RecordMap
{
	var rowData = G_SHEET.rowData;
	// build record map
	var recordMap: RecordMap = {};
	for (let i = 0; i < colList.length; i++) {
		var [colId, stratDef] = colList[i];
		var record = maxTimeDat(zeroRowDef(stratDef.name));
		if (!stratDef.virtual) {
			for (const xcamRef of stratDef.id_list) {
				var [xs, xcamId] = xcamRef;
				var cellDat = rowData[xs][xcamId];
				var rawTime = rawMS(cellDat.record);
				if (rawTime === null) continue;
				// apply version offset
				var timeDat = newTimeDat(rawTime, cellDat.link, cellDat.note, rowDefStratDef(stratDef, xcamRef));
				applyVerOffset(timeDat, verOffset);
				if (timeDat.time < record.time) record = timeDat;
			}
		} else {
			if (stratDef.virtId === undefined) throw ("No virtual id for " + stratDef.name);
			var rawTime = rawMS(rowData.beg[stratDef.virtId][0]);
			if (rawTime === null) throw ("Bad beginner time listed for " + stratDef.name);
			var timeDat = newTimeDat(rawTime, null, null, begRowDef(stratDef.name));
			applyVerOffset(timeDat, verOffset);
			if (timeDat.time < record.time) record = timeDat;
		}
		recordMap[stratDef.name] = record;
	}
	return recordMap;
}

function openName(openList: string[] | null, name: string)
{
	if (name === "Open") return true;
	if (openList === null) return false;
	return openList.includes(name);
}

export function sortColList(colList: ColList, recordMap: RecordMap, openList: string[] | null)
{
	colList.sort(function (a, b) {
		var open1 = openName(openList, a[1].name);
		var open2 = openName(openList, b[1].name);
		if (open1 && !open2) return -1;
		else if (!open1 && open2) return 1;
		var time1 = recordMap[a[1].name];
		var time2 = recordMap[b[1].name];
		return time1.time - time2.time;
	});
}
