import React, { useState, useEffect } from 'react'

import { RowDef, begRowDef } from './row_def'
import { StratDef, ColList, readRefMap, filterVarColList, toSetColList } from './org_strat_def'
import { VerOffset, newTimeDat, applyVerOffset } from "./time_dat"
import { FilterState, fullFilterState,
	orgStarDef, verOffsetStarDef, colListStarDef } from './org_star_def'
import { Ident, TimeMap, TimeTable, newIdent, addTimeMap, buildTimeTable } from './time_table'
import { openListColConfig } from './col_config'
import { newEditObj, userEditPerm } from './edit_perm'
import { xcamRecordMap, sortColList } from './xcam_record_map'
import { StarTable } from './rx_star_table'

	/*
		###############
		LIVE STAR TABLE
		###############
		star table react element where timetable information
		is synced with our backend database.
	*/

async function loadTimeTable(stageId: number, starId: number,
	colList: ColList, fs: FilterState, verOffset: VerOffset): Promise<TimeTable> {
	// load rows
	const getReq = await fetch("http://ec2-52-15-55-53.us-east-2.compute.amazonaws.com:5500/times/read?stage=" +
		stageId + "&star=" + starId);
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		return [];
	}
	// enumerate strats
	//var colList = orgColList(stageId, starId, verState);
	var [stratSet, indexSet] = toSetColList(colList);
	// build time table
	const timeMap: TimeMap = {};
	for (const data of res.res) {
		var playerId = newIdent("remote", "unknown");
		var stratDef = stratSet[data.stratname as string];
		if (stratDef === undefined) continue;
		var stratId = indexSet[data.stratname as string];
		// get row definition (if not in xcam sheet, use beginner template)
		var rowDef = begRowDef(stratDef.name);
		if (stratDef.virtId === null) {
			var xcamRef = stratDef.id_list[0];
			rowDef = readRefMap(stratDef.row_map, xcamRef, stratDef.name);	
		}
		// add time data
		var timeDat = newTimeDat(data.time, data.link, data.note, rowDef);
		applyVerOffset(timeDat, verOffset);
		addTimeMap(timeMap, playerId, stratId, timeDat);
	}
	console.log("Successfully loaded live table data.");
	return buildTimeTable(timeMap, colList.length);
}

//function completeEditRow(colTotal:, editText, colOrder) {
	// get columns / variant indices
	/*var colList = orgColList(stageId, starId);
	var variantList = orgVariantList(colList, variant);
	// fill new row
	var newRow = Array(colList.length).fill(null);
	for (let i = 0; i < variantList.length; i++) {
		var colId = variantList[i];
		newRow[colId] = rawMS(editText[i]);
	}
	return newRow;*/
	// fill new row
/*	var newRow = Array(colTotal).fill(null);
	for (let i = 0; i < editText.length; i++) {
		var colId = colOrder[i][0];
		newRow[colId] = rawMS(editText[i]);
	}
	return newRow;
}*/

//function postNewTimes(stageId, starId, name, diffText, colOrder) {
	/*var stratSet = Object.entries(orgData[stageId].starList[starId].jp_set);
	var stratList = stratSet.map((strat, i) => {
		const [stratName, stratDef] = strat;
		return stratName;
	});*/

	// get columns / variant indices
	//var colList = orgColList(stageId, starId);
	//var variantList = orgVariantList(colList, variant);
	// get list of times to submit
/*	var submitList = [];
	for (let i = 0; i < diffText.length; i++) {
		if (diffText[i] !== null) {
			var time = rawMS(diffText[i]);
			//var stratId = variantList[i];
			submitList.push({
				"player": name,
				"stageId": stageId,
				"starId": starId,
				"stratName": colOrder[i][1].name, //colList[stratId].name,
				"time": time,
				"submitTime": Date.now()
			})
		}
	}
	// send a post request
	fetch("http://ec2-52-15-55-53.us-east-2.compute.amazonaws.com:5500/times/submit", {
		method: "POST",
		body: JSON.stringify(submitList),
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		}
	});
}*/

type LiveStarTableProps = {
	"stageId": number,
	"starId": number,
	"fs": FilterState,
	"userId": Ident | null
};

export function LiveStarTable(props: LiveStarTableProps): React.ReactNode
{
	const stageId = props.stageId;
	const starId = props.starId;
	const fs = props.fs;
	const userId = props.userId;

	var starDef = orgStarDef(stageId, starId);
	var verOffset = verOffsetStarDef(starDef, fs);
	var colList = colListStarDef(starDef, fs);

	// time table
	const [timeTable, setTimeTable] = useState([] as TimeTable);
	const [reload, setReload] = useState(1);

	// time table loader
	useEffect(() => {
		var dirty = (reload !== 0);
		const f = async () => {
			if (dirty) setTimeTable(await loadTimeTable(stageId, starId, colList, fs, verOffset));
		}
		setTimeout(f, reload);
		setReload(0);
	}, [reload]);

	// edit function
	/*const editTT = (name, dfText, colOrder) => {
		// complete the row and update time table
		//var newRow = completeEditRow(stageId, starId, variant, dfText, colOrder);
		var newRow = completeEditRow(colList, dfText, colOrder);
		var tt = updateTimeTable(timeTable, name, newRow);
		setTimeTable(tt);
		// sync the times to the database
		postNewTimes(stageId, starId, name, dfText, colOrder);
		setReload(1000); // slight offset so the database has time to actually update
	}*/
	const editTT = () => {};

	/*var _colList = orgColList(stageId, starId, fs);

	// add sort record + relevant records
	var sortRM = orgRecordMap(stageId, starId, [true, true], true);
	var relRM = orgRecordMap(stageId, starId, fs, true);
	applyRecordMap(_colList, "sortRecord", sortRM);
	applyRecordMap(_colList, "record", relRM);

	var colList = filterVarColList(_colList, variant);

	return (<StarTable colList={ colList } timeTable={ timeTable } canWrite="true" editTT={ editTT }></StarTable>);*/

	// add sort record + relevant records
	var sortRM = xcamRecordMap(colList, fullFilterState(), verOffset);
	var relRM = xcamRecordMap(colList, fs, verOffset);
	sortColList(colList, sortRM);

	// create star table
	var filterColList = filterVarColList(colList, null);
	var filterCFG = openListColConfig(filterColList, starDef.open);
	
	var editObj = newEditObj(userEditPerm(userId), starDef, editTT);

	return(<StarTable cfg={ filterCFG } timeTable={ timeTable } verOffset={ verOffset }
		recordMap={ relRM } editObj={ editObj }></StarTable>);
}
