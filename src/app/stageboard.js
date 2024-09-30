
import React, { useState, useEffect } from 'react'
import orgData from './json/org_data.json'

import { newFilterState, orgColList, filterVarColList } from "./org_star_def"
import { LiveStarTable } from "./livetable"

	/*
		#################
		STAGE LEADERBOARD
		#################
		react element which displays times for all
		stages/stars/strats that we handle.
	*/

/*
function addStratTimePool(timePool, colId, timeList) {
	for (const timeDat of timeList) {
		if (timePool[timeDat.player] === undefined) {
			timePool[timeDat.player] = {};
		}
		timePool[timeDat.player][colId] = timeDat.ms;
	}
}

function poolTimeTable(colTotal, timePool, stdFlag) {
	var timeTable = Object.entries(timePool).map((user) => {
		var [name, userDat] = user;
		var bestTime = 999900;
		var timeList = [];
		for (let i = 0; i < colTotal; i++) {
			if (userDat[i]) {
				timeList.push(userDat[i]);
				if (userDat[i] < bestTime) { bestTime = userDat[i]; }
			} else {
				timeList.push(null);
			}
		}
		var standard = "Unranked";
		if (stdFlag && playerData[name] !== undefined && playerData[name].standard) {
			standard = playerData[name].standard;
		}
		return {
			"name": name,
			"timeList": timeList,
			"bestTime": bestTime,
			"playStd": standard
		};
	});
	timeTable.sort(function(a, b) { return a.bestTime - b.bestTime });
	return timeTable;
}

function starTimeTable(stageId, starId) {
	var starDef = orgData[stageId].starList[starId];
	var timePool = {};
	var colId = 0;
	for (const [stratName, stratDef] of Object.entries(starDef.jp_set)) {
		var xcamId = stratDef.id_list[0];
		addStratTimePool(timePool, colId, xcamData[xcamId].times);
		colId = colId + 1;
	}
	var colTotal = colId;
	return poolTimeTable(colTotal, timePool, true);*/
	/*Object.entries(timePool).map((user) => {
		var [name, userDat] = user;
		var bestTime = 999900;
		var timeList = [];
		for (let i = 0; i < colTotal; i++) {
			if (userDat[i]) {
				timeList.push(userDat[i]);
				if (userDat[i] < bestTime) { bestTime = userDat[i]; }
			} else {
				timeList.push(null);
			}
		}
		var standard = "Unranked";
		if (playerData[name] !== undefined && playerData[name].standard) {
			standard = playerData[name].standard;
		}
		return {
			"name": name,
			"timeList": timeList,
			"bestTime": bestTime,
			"playStd": standard
		};
	})*/
	//timeTable.sort(function(a, b) { return a.bestTime - b.bestTime });
/*} */

export function StageBoard() {
	// star state
	const [stageId, setStageId] = useState(0);
	const [starIdCache, setStarIdCache] = useState(Array(orgData.length).fill(0));
	const starId = starIdCache[stageId];

	// version state
	const [fs, setFilterState] = useState(newFilterState());

	// star functions
	const changeStage = (e) => {
		setStageId(e.target.value);
		/*setEditState(nullEditState());
		setEditText([]);
		setTimeTable([]);
		setReload(1);*/
	};

	const changeStar = (i) => {
		starIdCache[stageId] = i;
		setStarIdCache(starIdCache.map((x) => x));
		/*setEditState(nullEditState());
		setEditText([]);
		setTimeTable([]);
		setReload(1);*/
	}

/*
	const changeUser = (name) => {
		var newState = copyState(state);
		newState.user = name;
		setState(newState);
	};
*/
	var stageOptNodes = orgData.map((stage, i) =>
		<option key={ stage.name } value={ i }>{ stage.name }</option>
	);

	var starList = orgData[stageId].starList;
	var starBtnNodes = starList.map((star, i) => {
		var flag = (starIdCache[stageId] === i) ? "true" : "false";
		return <div key={ star.name } className="star-name" sel={ flag }
			onClick={ () => { changeStar(i) } }>{ star.name }</div>;
	});

	//var timeTable = starTimeTable(stageId, starIdCache[stageId]);
	//var timeTable = [];

	// build tables (in case of multiple tables)
	var tableList = [];
	// -- main column list
	//var mainColList = orgVarColList(colList, null);
	tableList.push(<LiveStarTable key={ stageId + "_" + starId + "_0" }
		stageId={ stageId } starId={ starId } fs={ fs } variant={ null }> </LiveStarTable>
	);
	// -- variant table
	var colList = orgColList(stageId, starId, fs);
	var varColList = filterVarColList(colList, 1);
	if (varColList.length !== 0) {
		tableList.push(<LiveStarTable key={ stageId + "_" + starId + "_1" }
			stageId={ stageId } starId={ starId } fs={ fs } variant={ 1 }> </LiveStarTable>
		);
	}

	return (
		<div>
		<div className="stage-select">
			<select value={ stageId }
				onChange={ changeStage }>
				{ stageOptNodes }
			</select>
		</div>
		<div className="star-select">
			{ starBtnNodes }
		</div>
		{ tableList }
		</div>
	);

}
