
import xcamData from './json/xcam_dump.json'
import rowData from './json/row_data.json'

import { rawMS, newTimeDat, applyVerOffset } from "./time_dat"
import { rowDefStratDef } from "./strat_def"
import { addTimeMap, buildTimeTable } from "./time_table"

	/* derived "sort_data" (determines a canonical order for column sorting) */

export function xcamTimeTable(colList, fs, verOffset) {
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
				var timeDat = newTimeDat(data.ms, rowDefStratDef(stratDef, xcamRef));
				applyVerOffset(timeDat, verOffset);
				// do not include times better than posted record
				if (record === undefined || data.ms >= rawMS(record)) {
					addTimeMap(timeMap, data.player, colId, timeDat);
				}
			}
		}
	}
	return buildTimeTable(timeMap, colList.length);
}
/*
function xcamTimeTable(stageId, starId, verState, verData, extFlag) {
	// for every xcam column
	//var focusVer = verData.focusVer;
	var colList = orgColList(stageId, starId, verState, extFlag);
	const timePool = {};
	for (let i = 0; i < colList.length; i++) {
		var stratDef = colList[i];
		// for every relevant row in the xcam sheet
		for (const xcamRef of stratDef.id_list) {
			var [xs, xcamId] = xcamRef;
			if (xcamData[xs][xcamId] === undefined) continue;
			var record = rowData[xs][xcamId].record;
			var timeList = xcamData[xs][xcamId].times;
			// check whether the xcam row is relevant to both versions 
			var rowVer = stratRowVer(stratDef, xcamRef);
			// iterate through every time listed for the xcam row
			for (const data of timeList) {
				// use offset when not default + the alt version is enabled
				var ms = applyVerOffset(verData, rowVer, data.ms, stratDef.name);
				if (record === undefined || data.ms >= rawMS(record)) {
					addTimePool(timePool, data.player, i, {
						"rawTime": data.ms,
						"time": ms,
						"ver": rowVer,
						"variant_list": stratDef.variant_map[xs + "_" + xcamId]
					});
				}
			}
		}
	}
	return buildTimeTable(timePool, colList.length);
	//timeTable.sort(function(a, b) { return a.bestTime - b.bestTime });
}*/