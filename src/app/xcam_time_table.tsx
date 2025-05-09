
//import xcamData from './json/xcam_dump.json'
//import rowData from './json/row_data.json'
import { G_SHEET } from './api_xcam'
import { StarLoadFun } from './api_season'

import { VerOffset, StratOffset, rawMS, newTimeDat, applyVerOffset, applyStratOffset } from "./time_dat"
import { ColList, readRefMap } from "./org_strat_def"
import { StarDef } from "./org_star_def"
import { TimeTable, newIdent, addTimeMap, buildTimeTable } from "./time_table"

	/* derived "sort_data" (determines a canonical order for column sorting) */

export function xcamTimeTable(colList: ColList, verOffset: VerOffset, stratOffset: StratOffset, forceAdjust?: number): TimeTable {
	var rowData = G_SHEET.rowData;
	var xcamData = G_SHEET.xcamData;
	const timeMap = {};
	for (let i = 0; i < colList.length; i++) {
		var [colId, stratDef] = colList[i];
		// for every relevant row in the xcam sheet
		for (const xcamRef of stratDef.id_list) {
			var [xs, xcamId] = xcamRef;
			if (xcamData[xs][xcamId] === undefined) continue;
			// load record + all times for the row
			var record = rowData[xs][xcamId].record;
			var timeList = xcamData[xs][xcamId].times;
			// iterate through every time for the xcam row
			for (const data of timeList) {
				var timeDat = newTimeDat(data.ms, data.link, data.note,
					readRefMap(stratDef.row_map, xcamRef, "tt:" + stratDef.name));
				applyVerOffset(timeDat, verOffset);
				applyStratOffset(timeDat, stratDef.diff.includes("second"), stratOffset, forceAdjust);
				// do not include times better than posted record
				var recordMS = rawMS(record);
				if (recordMS === null) {
					console.log("WARNING: Bad record pulled from xcam sheet for " + stratDef.name);
					recordMS = 999900;
				}
				if (record === undefined || data.ms >= recordMS) {
					var playerId = newIdent("xcam", data.player);
					addTimeMap(timeMap, playerId, colId, timeDat);
				}
			}
		}
	}
	var tt = buildTimeTable(timeMap, colList.length);
	return tt;
}

export const xcamTTFun: StarLoadFun = (stageId, starDef, colList, verOffset, stratOffset) => {
	return xcamTimeTable(colList, verOffset, stratOffset, 1);
}
