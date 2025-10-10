import React, { useState, useEffect } from 'react'

import { RowDef } from '../row_def'
import { TimeDat } from '../time_dat'
import { StratDef, filterVarColList, toSetColList } from '../org_strat_def'
import { StarDef, FilterState, fullFilterState,
	orgStarDef, verOffsetStarDef, stratOffsetStarDef, colListStarDef } from '../org_star_def'
import { Ident, TimeTable, newIdent, dropIdent,
	updateTimeTable, delTimeTable } from '../time_table'
import { PlayData } from '../play_data'
import { TTLoadType, loadTimeTable, postNewTimes } from '../api_live'
import { newColConfig, primaryColConfig } from '../col_config'
import { newEditObj, userEditPerm } from './edit_perm'
import { xcamRecordMap, sortColList } from '../xcam_record_map'
import { PlayDB } from './rx_star_row'
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
	"starDef": StarDef,
	"today": TTLoadType,
	"fs": FilterState,
	"playData": PlayData,
	"reloadPlayData": () => void,
	"updatePlayCount"?: (a: Ident[]) => void,
	"playDB"?: PlayDB
};

export function LiveStarTable(props: LiveStarTableProps): React.ReactNode
{
	const stageId = props.stageId;
	const starDef = props.starDef;
	const fs = props.fs;
	const playData = props.playData;
	const userId = playData.local.userId;
	const reloadPlayData = props.reloadPlayData;

	var verOffset = verOffsetStarDef(starDef, fs);
	var sOffset = stratOffsetStarDef(starDef, fs);
	var varTotal = 0;
	if (starDef.variants) varTotal = starDef.variants.length;
	var colList = colListStarDef(starDef, fullFilterState([true, true], varTotal));

	// time table
	const [timeTable, setTimeTable] = useState([] as TimeTable);
	const [firstInit, setFirstInit] = useState(true);
	const [reload, setReload] = useState(1);

	// having last load time as key forces full edit state reload on table reload
	const [lastTime, setLastTime] = useState(Date.now());

	// time table loader
	useEffect(() => {
		var dirty = (reload !== 0);
		const f = async () => {
			if (dirty) {
				var newTable = await loadTimeTable(stageId, starDef, props.today, colList, fs, verOffset, sOffset);
				setTimeTable(newTable);
				if (props.updatePlayCount !== undefined) props.updatePlayCount(newTable.map((table) => table.id));
				// reloads the player data (if the previous table wasnt empty) since submitting a time
				// may have created a new user
				if (!firstInit) reloadPlayData();
				setFirstInit(false);
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
		console.log(authId);
		// update time table
		var newTable = timeTable.map((x) => x);
		timeList.map((timeDat) => {
			var colId = indexSet[timeDat.rowDef.name];
			updateTimeTable(newTable, colTotal, authId, colId, timeDat);
		})
		delList.map((delDat) => delTimeTable(newTable, authId, delDat));
		setTimeTable(newTable);
		// sync the times to the database
		postNewTimes(stageId, starDef, authId, playData.local.nick, timeList, delList);
		setLastTime(Date.now());
		setReload(2000); // slight offset so the database has time to actually update
	};

	// add sort record + relevant records
	var sortRM = xcamRecordMap(colList, fullFilterState([true, true], varTotal), verOffset, sOffset);
	var relRM = xcamRecordMap(colList, fs, verOffset, sOffset);
	sortColList(colList, sortRM);

	// create star table
	var filterColList = colList;
	if (fs.altState[0] && !fs.altState[1]) filterColList = filterVarColList(colList, null);
	else if (fs.altState[1] && !fs.altState[0]) filterColList = filterVarColList(colList, 1);
	
	var filterCFG = newColConfig(filterColList);
	primaryColConfig(filterCFG, starDef, fs);
	
	var editObj = newEditObj(userEditPerm(userId), starDef, editTT);

	return(<StarTable cfg={ filterCFG } playData={ playData } timeTable={ timeTable } verOffset={ verOffset }
		recordMap={ relRM } editObj={ editObj } playDB={ props.playDB } key={ lastTime }></StarTable>);
}
