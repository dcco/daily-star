import React, { useState, useEffect } from 'react'

import { RowDef } from '../row_def'
import { TimeDat } from '../time_dat'
import { liftIdent } from '../time_table'
import { StratDef, filterVarColList, toSetColList } from '../org_strat_def'
import { StarDef, FilterState, fullFilterState, copyFilterState,
	starCode, orgStarDef, verOffsetStarDef, stratOffsetStarDef, colListStarDef } from '../org_star_def'
import { AuthIdent, Ident, TimeTable, newIdent, dropIdent,
	updateTimeTable, delTimeTable } from '../time_table'
import { PlayData } from '../play_data'
import { newColConfig, primaryColConfig } from '../col_config'
import { xcamRecordMap, xcamRecordMapRules, xcamIdealMapRules, sortColList } from '../xcam_record_map'

import { newEditObj, userEditPerm } from './edit_perm'
import { ExColumn } from './ex_column'
import { PlayDB } from './rx_star_row'
import { StarTable } from './rx_star_table'

import { ReadTimeObj, addTimeObj, delTimeObj } from '../api_types'
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
	"showRowId"?: boolean,
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

	// build filter state (fill in variant total)
	var varTotal = 0;
	if (starDef.variants) varTotal = starDef.variants.length;
	var ns = copyFilterState(fs);
	ns.varFlagList = new Array(varTotal).fill(true);
	
	// build column lists
	//var colList = colListStarDef(starDef, fullFilterState([true, true], varTotal));
	var colList = colListStarDef(starDef, ns);
	var fullColList = colListStarDef(starDef, fullFilterState([true, true], varTotal));

	// rules / rank key
	const rulesKey = starCode(stageId, starDef);
	var rankKey: string | undefined = undefined;
	if (props.showStd) rankKey = stageId + "_" + starDef.id;

	// raw time data
	const [readObj, setReadObj] = useState([] as ReadTimeObj);

	// time table
	const timeTable = readObjTimeTable(readObj, starDef, colList, verOffset, sOffset, fs.extFlag === "rules" ? rulesKey : null);
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
				setReadObj(readObj)
				// update the player count
				var newTable = readObjTimeTable(readObj, starDef, fullColList, verOffset, sOffset, fs.extFlag === "rules" ? rulesKey : null);
				if (props.updatePlayCount !== undefined) props.updatePlayCount(newTable.map((table) => table.id));
				// reloads the player data (if the previous table wasnt empty) since submitting a time
				// may have created a new user
				if (!firstInit) reloadPlayData();
				setFirstInit(false);
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
		// TODO: undo this hotfix
		if (_id.service === "remote" && userId.remoteId !== null && userId.remoteId.toString() === _id.name) authId = userId;
		// update time table
		var newTimeObj = readObj.map((x) => x);
		timeList.map((timeDat) => {
			addTimeObj(newTimeObj, _id, starDef, timeDat);
		})
		delList.map((delDat) => delTimeObj(newTimeObj, delDat));
		setReadObj(newTimeObj);
		/*var newTable = timeTable.map((x) => x);
		timeList.map((timeDat) => {
			var colId = indexSet[timeDat.rowDef.name];
			updateTimeTable(newTable, colTotal, authId, colId, timeDat);
		})
		delList.map((delDat) => delTimeTable(newTable, authId, delDat));
		setTimeTable(newTable);*/
		// sync the times to the database
		var myId = userId;
		props.api.postNewTimes(stageId, starDef, myId, authId, playData.local.nick, timeList, delList, verifList);
		setLastTime(Date.now());
		setReload(2000); // slight offset so the database has time to actually update
	};

	// add sort record + relevant records
	var sortRM = xcamRecordMap(colList, fullFilterState([true, true], varTotal), verOffset, sOffset);
	var relRM = xcamRecordMapRules(colList, fs, verOffset, sOffset, rulesKey);
	var idealRM = xcamIdealMapRules(colList, fs, verOffset, sOffset, rulesKey);
	sortColList(colList, sortRM);

	// create star table
	var filterColList = colList;
	if (fs.altState[0] && !fs.altState[1]) filterColList = filterVarColList(colList, null);
	else if (fs.altState[1] && !fs.altState[0]) filterColList = filterVarColList(colList, 1);
	
	var filterCFG = newColConfig(filterColList);
	primaryColConfig(filterCFG, starDef, fs);
	
	var editObj = newEditObj(userEditPerm(userId, props.playData.local.perm), starDef, editTT, fs.extFlag === "rules" ? rulesKey : null);

	return(<StarTable cfg={ filterCFG } playData={ playData } timeTable={ timeTable } verOffset={ verOffset }
		recordMap={ relRM } idealMap={ idealRM } showRowId={ props.showRowId } rankKey={ rankKey } editObj={ editObj } playDB={ props.playDB }
		extraColList={ props.extraColList } key={ lastTime }></StarTable>);
}
