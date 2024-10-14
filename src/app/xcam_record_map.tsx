
//import rowData from './json/row_data.json'
import { G_SHEET } from './xcam_wrap'

import { TimeDat, VerOffset, rawMS, newTimeDat, maxTimeDat, applyVerOffset } from './time_dat'
import { zeroRowDef, begRowDef } from './row_def'
import { ColList, readRefMap } from './org_strat_def'
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
	var allRecord = maxTimeDat(zeroRowDef("Open"));
	for (let i = 0; i < colList.length; i++) {
		var [colId, stratDef] = colList[i];
		var record = maxTimeDat(zeroRowDef(stratDef.name));
		if (stratDef.virtId === null) {
			for (const xcamRef of stratDef.id_list) {
				var [xs, xcamId] = xcamRef;
				var cellDat = rowData[xs][xcamId];
				var rawTime = rawMS(cellDat.record);
				if (rawTime === null) continue;
				// apply version offset
				var timeDat = newTimeDat(rawTime, cellDat.link, cellDat.note,
					readRefMap(stratDef.row_map, xcamRef, "rm:" + stratDef.name));
				applyVerOffset(timeDat, verOffset);
				if (timeDat.time < record.time) record = timeDat;
				if (timeDat.time < allRecord.time) allRecord = timeDat;
			}
		} else if (stratDef.virtId.kind === 'beg') {
			var rawTime = rawMS(rowData.beg[stratDef.virtId.id][0]);
			if (rawTime === null) throw ("Bad beginner time listed for " + stratDef.name);
			var timeDat = newTimeDat(rawTime, null, null, begRowDef(stratDef.name));
			applyVerOffset(timeDat, verOffset);
			if (timeDat.time < record.time) record = timeDat;
		}
		recordMap[stratDef.name] = record;
	}
	recordMap["Open"] = allRecord;
	return recordMap;
}

export function sortColList(colList: ColList, recordMap: RecordMap)
{
	colList.sort(function (a, b) {
		var open1 = a[1].name === "Open";
		var open2 = b[1].name === "Open";
		if (open1 && !open2) return -1;
		else if (!open1 && open2) return 1;
		var time1 = recordMap[a[1].name];
		var time2 = recordMap[b[1].name];
		return time1.time - time2.time;
	});
}
