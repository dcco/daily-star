import React, { useState, useEffect } from 'react'

import { RowDef } from '../row_def'
import { TimeDat } from '../time_dat'
import { liftIdent } from '../time_table'
import { StratDef, filterVarColList, toSetColList } from '../org_strat_def'
import { StarDef, FilterState, fullFilterState,
	orgStarDef, verOffsetStarDef, stratOffsetStarDef, colListStarDef } from '../org_star_def'
import { AuthIdent, Ident, TimeTable, newIdent, dropIdent,
	updateTimeTable, delTimeTable } from '../time_table'
import { PlayData } from '../play_data'
import { newColConfig, primaryColConfig } from '../col_config'
import { xcamRecordMap, sortColList } from '../xcam_record_map'

import { newEditObj, userEditPerm } from './edit_perm'
import { ExColumn } from './ex_column'
import { PlayDB } from './rx_star_row'
import { StarTable } from './rx_star_table'

import { ReadTimeObj } from '../api_types'
import { TTLoadType, readObjTimeTable } from '../api_live'

//import { TTLoadType, readObjTimeTable, loadTimes, postNewTimes } from '../api_live'

	/*
		###############
		LIVE STAR TABLE
		###############
		star table react element where timetable information
		is synced with our backend database.
	*/

export type LiveStarIface = {
	"loadTimes": (stageId: number, starDef: StarDef, today: TTLoadType) => Promise<ReadTimeObj>,
	"postNewTimes": (stageId: number, starDef: StarDef, myId: AuthIdent, userId: AuthIdent,
		nick: string | null, timeList: TimeDat[], delList: TimeDat[], verifList: TimeDat[]) => void
}

export type LiveStarTableProps = {
	"stageId": number,
	"starDef": StarDef,
	"today": TTLoadType,
	"showStd": boolean,
	"fs": FilterState,
	"api": LiveStarIface,
	"playData": PlayData,
	"reloadPlayData": () => void,
	"updatePlayCount"?: (a: Ident[]) => void,
	"playDB"?: PlayDB,
	"extraColList"?: ExColumn[]
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

	// rank key
	var rankKey: string | undefined = undefined;
	if (props.showStd) rankKey = stageId + "_" + starDef.id;

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
				var readObj = await props.api.loadTimes(stageId, starDef, props.today);
				var newTable = readObjTimeTable(readObj, starDef, colList, verOffset, sOffset);
				//var newTable = await loadTimeTable(stageId, starDef, props.today, colList, fs, verOffset, sOffset);
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

	const editTT = (_id: Ident, timeList: TimeDat[], delList: TimeDat[], verifList: TimeDat[]) => {
		if (userId === null) throw("Reached time submission with null user.");
		var authId = liftIdent(_id);
		// update time table
		var newTable = timeTable.map((x) => x);
		timeList.map((timeDat) => {
			var colId = indexSet[timeDat.rowDef.name];
			updateTimeTable(newTable, colTotal, authId, colId, timeDat);
		})
		delList.map((delDat) => delTimeTable(newTable, authId, delDat));
		setTimeTable(newTable);
		// sync the times to the database
		var myId = userId;
		props.api.postNewTimes(stageId, starDef, myId, authId, playData.local.nick, timeList, delList, verifList);
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
	
	var editObj = newEditObj(userEditPerm(userId, props.playData.local.perm), starDef, editTT);

	return(<StarTable cfg={ filterCFG } playData={ playData } timeTable={ timeTable } verOffset={ verOffset }
		recordMap={ relRM } rankKey={ rankKey } editObj={ editObj } playDB={ props.playDB }
		extraColList={ props.extraColList } key={ lastTime }></StarTable>);
}
