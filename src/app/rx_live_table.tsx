import React, { useState, useEffect } from 'react'

import { RowDef } from './row_def'
import { TimeDat } from './time_dat'
import { StratDef, filterVarColList, toSetColList } from './org_strat_def'
import { FilterState, fullFilterState,
	orgStarDef, verOffsetStarDef, colListStarDef } from './org_star_def'
import { Ident, TimeTable, newIdent, dropIdent, updateTimeTable } from './time_table'
import { PlayData, lookupNickPD } from './play_data'
import { loadTimeTable, postNewTimes } from './live_wrap'
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

type LiveStarTableProps = {
	"stageId": number,
	"starId": number,
	"fs": FilterState,
	"playData": PlayData
};

export function LiveStarTable(props: LiveStarTableProps): React.ReactNode
{
	const stageId = props.stageId;
	const starId = props.starId;
	const fs = props.fs;
	const playData = props.playData;
	const userId = playData.userId;

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
			if (dirty) {
				setTimeTable(await loadTimeTable(stageId, starId, colList, fs, verOffset));
			}
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
	var colTotal = colList.length;
	var [stratSet, indexSet] = toSetColList(colList);

	const editTT = (timeList: TimeDat[]) => {
		if (userId === null) throw("Reached time submission with null user.");
		var authId = userId;
		// update time table
		var newTable = timeTable.map((x) => x);
		timeList.map((timeDat) => {
			var colId = indexSet[timeDat.rowDef.name];
			updateTimeTable(newTable, colTotal, authId, colId, timeDat);
		})
		setTimeTable(newTable);
		// sync the times to the database
		postNewTimes(stageId, starId, authId, timeList);
		setReload(1000); // slight offset so the database has time to actually update
	};

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

	return(<StarTable cfg={ filterCFG } playData={ playData } timeTable={ timeTable } verOffset={ verOffset }
		recordMap={ relRM } editObj={ editObj }></StarTable>);
}
