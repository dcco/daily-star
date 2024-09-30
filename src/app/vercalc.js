
import orgData from './json/org_data.json'
import rowData from './json/row_data.json'

	/*
function _secMS(secText) {
	if (!secText.includes('.')) return parseInt(secText) * 100;
	var ft = secText.split('.');
	return (parseInt(ft[0]) * 100) + parseInt(ft[1]);
}

export function rawMS(fillText) {
	if (!fillText) return null;
	try {
		// does not need to include special fixes from xcam sheet
		if (!fillText.includes(':')) return _secMS(fillText);
		var ft = fillText.split(':');
		var min = parseInt(ft[0]);
		var sec = _secMS(ft[1]);
		return (min * 6000) + sec;
	} catch (err) {
		return null;
	}
}*/

	// record map generation

	/*

export function stratRowVer(stratDef, rowRef) {
	if (stratDef.ver_all !== undefined) return stratDef.ver_all;
	else if (stratDef.ver_map !== undefined) return stratDef.ver_map[rowRef[0] + "_" + rowRef[1]];
	return "both";
}

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
}

export function applyRecordMap(colList, key, recordMap) {
	colList.map(function (col) {
		col[key] = recordMap[col.name];
	})
}
*/