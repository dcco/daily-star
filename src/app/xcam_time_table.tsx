
//import xcamData from './json/xcam_dump.json'
//import rowData from './json/row_data.json'
import { G_SHEET } from './xcam_wrap' 

import { rawMS, newTimeDat, applyVerOffset } from "./time_dat"
import { rowDefStratDef } from "./strat_def"
import { newIdent, addTimeMap, buildTimeTable } from "./time_table"

	/* derived "sort_data" (determines a canonical order for column sorting) */

export function xcamTimeTable(colList, fs, verOffset) {
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
				var timeDat = newTimeDat(data.ms, data.link, data.note, rowDefStratDef(stratDef, xcamRef));
				applyVerOffset(timeDat, verOffset);
				// do not include times better than posted record
				if (record === undefined || data.ms >= rawMS(record)) {
					var playerId = newIdent("xcam", data.player);
					addTimeMap(timeMap, playerId, colId, timeDat);
				}
			}
		}
	}
	return buildTimeTable(timeMap, colList.length);
}
