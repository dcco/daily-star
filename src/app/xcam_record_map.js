
import rowData from './json/row_data.json'

import { zeroRowDef, begRowDef, rowDefStratDef } from './strat_def'
import { rawMS, newTimeDat, maxTimeDat, applyVerOffset } from './time_dat'

	/*
		record_map: a mapping of strat names to time_dats
	*/

export function xcamRecordMap(colList, fs, verOffset)
{
	// build record map
	var recordMap = {};
	for (let i = 0; i < colList.length; i++) {
		var [colId, stratDef] = colList[i];
		var record = maxTimeDat(zeroRowDef(stratDef.name));
		if (!stratDef.virtual) {
			for (const xcamRef of stratDef.id_list) {
				var [xs, xcamId] = xcamRef;
				var rawTime = rawMS(rowData[xs][xcamId].record);
				if (rawTime === null) continue;
				// apply version offset
				var timeDat = newTimeDat(rawTime, rowDefStratDef(stratDef, xcamRef));
				applyVerOffset(timeDat, verOffset);
				if (timeDat.time < record.time) record = timeDat;
			}
		} else {
			var rawTime = rawMS(rowData.beg[stratDef.virtId][0]);
			var timeDat = newTimeDat(rawTime, begRowDef(stratDef.name));
			applyVerOffset(timeDat, verOffset);
			if (timeDat.time < record.time) record = timeDat;
		}
		recordMap[stratDef.name] = record;
	}
	return recordMap;
}

export function sortColList(colList, recordMap)
{
	colList.sort(function (a, b) {
		if (a[1].name === "Open") return -1;
		else if (b[1].name === "Open") return 1;
		var time1 = recordMap[a[1].name];
		var time2 = recordMap[b[1].name];
		return time1.time - time2.time;
	});
}

/*
export function orgRecordMap(stageId, starId, fs) {
	// extract column + version offset data
	var colList = orgColList(stageId, starId, fs);
	var verData = starVerData(orgData[stageId].starList[starId], fs);
	// build record map
	var recordMap = {};
	function recObj(rawTime, time, ver) {
		return { "rawTime": rawTime, "time": time, "ver": ver };
	}
	for (let i = 0; i < colList.length; i++) {
		var stratDef = colList[i];
		var record = recObj(999900, 999900, "jp");
		if (!stratDef.virtual) {
			for (const xcamRef of stratDef.id_list) {
				var [xs, xcamId] = xcamRef;
				var rawTime = rawMS(rowData[xs][xcamId].record);
				if (rawTime === null) continue;
				// apply version offset
				var rowVer = stratRowVer(stratDef, xcamRef);
				var time = applyVerOffset(verData, rowVer, rawTime, stratDef.name);
				if (time < record.time) record = recObj(rawTime, time, rowVer);
			}
		} else {
			var rawTime = rawMS(rowData.beg[stratDef.virtId][0]);
			var time = applyVerOffset(verData, "jp", rawTime, stratDef.name, "jp");
			if (time < record.time) record = recObj(rawTime, time, "jp");
		}
		recordMap[stratDef.name] = record;
	}
	return recordMap;
}*/
