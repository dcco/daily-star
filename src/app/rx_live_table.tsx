import React, { useState, useEffect } from 'react'

import { RowDef } from './row_def'
import { TimeDat } from './time_dat'
import { StratDef, filterVarColList, toSetColList } from './org_strat_def'
import { FilterState, fullFilterState,
	orgStarDef, verOffsetStarDef, colListStarDef } from './org_star_def'
import { Ident, TimeTable, newIdent, dropIdent,
	updateTimeTable, delTimeTable } from './time_table'
import { PlayData } from './play_data'
import { loadTimeTable, postNewTimes } from './api_live'
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

type LiveStarTableProps = {
	"stageId": number,
	"starId": number,
	"today": boolean,
	"fs": FilterState,
	"varFlag": number | null,
	"playData": PlayData,
	"reloadPlayData": () => void
};

export function LiveStarTable(props: LiveStarTableProps): React.ReactNode
{
	const stageId = props.stageId;
	const starId = props.starId;
	const fs = props.fs;
	const playData = props.playData;
	const userId = playData.local.userId;
	const reloadPlayData = props.reloadPlayData;

	var starDef = orgStarDef(stageId, starId);
	var verOffset = verOffsetStarDef(starDef, fs);
	var colList = colListStarDef(starDef, fs);

	// time table
	const [timeTable, setTimeTable] = useState([] as TimeTable);
	const [reload, setReload] = useState(1);

	// having last load time as key forces full edit state reload on table reload
	const [lastTime, setLastTime] = useState(Date.now());

	// time table loader
	useEffect(() => {
		var dirty = (reload !== 0);
		const f = async () => {
			if (dirty) {
				setTimeTable(await loadTimeTable(stageId, starId, props.today, colList, fs, verOffset));
				// reloads the player data since submitting a time
				// may have created a new user
				reloadPlayData();
				// if the user has changed, triggers a nickname data reload
				// since submitting a time may have created a new user
				/*if (playData.newUserSync === "unsync") {
					setPlayData(syncUserPD(playData));
				}*/
			}
		}
		setTimeout(f, reload);
		setReload(0);
	}, [reload]);

	// edit function
	var colTotal = colList.length;
	var [stratSet, indexSet] = toSetColList(colList);

	const editTT = (timeList: TimeDat[], delList: TimeDat[]) => {
		if (userId === null) throw("Reached time submission with null user.");
		var authId = userId;
		// update time table
		var newTable = timeTable.map((x) => x);
		timeList.map((timeDat) => {
			var colId = indexSet[timeDat.rowDef.name];
			updateTimeTable(newTable, colTotal, authId, colId, timeDat);
		})
		delList.map((delDat) => delTimeTable(newTable, authId, delDat));
		setTimeTable(newTable);
		// sync the times to the database
		postNewTimes(stageId, starId, authId, timeList, delList);
		setLastTime(Date.now());
		setReload(2000); // slight offset so the database has time to actually update
	};

	// add sort record + relevant records
	var sortRM = xcamRecordMap(colList, fullFilterState(), verOffset);
	var relRM = xcamRecordMap(colList, fs, verOffset);
	sortColList(colList, sortRM);

	// create star table
	var filterColList = filterVarColList(colList, props.varFlag);
	var filterCFG = openListColConfig(filterColList, starDef.open);
	
	var editObj = newEditObj(userEditPerm(userId), starDef, editTT);

	return(<StarTable cfg={ filterCFG } playData={ playData } timeTable={ timeTable } verOffset={ verOffset }
		recordMap={ relRM } editObj={ editObj } key={ lastTime }></StarTable>);
}
