
import React, { useState, useEffect } from 'react'
import orgData from '../json/org_data.json'

import { loadTTRaw } from '../api_live'
import { G_SHEET } from '../api_xcam'

import { VerOffset, StratOffset } from '../time_dat'
import { ColList } from '../org_strat_def'
import { StarDef, orgStarId, orgStarDef } from '../org_star_def'
import { TimeTable } from '../time_table'
import { PlayData } from '../play_data'
import { G_HISTORY, dateAndOffset, dispDate } from '../api_season'
import { procStarSlug, makeStarSlug } from '../router_slug'
import { RouterMain, navRM } from '../router_main'
import { PlayDB } from '../table_parts/rx_star_row'
import { ViewBoard } from '../board_simple/rx_view_board'

function historyStageList(): number[]
{
	var stageList: number[] = [];
	var hList = G_HISTORY.header.starList;
	for (let i = 0; i < hList.length; i++) {
		var star = hList[i];
		if (i < G_HISTORY.data.length && !stageList.includes(star.stageid)) {
			stageList.push(star.stageid);
		}
	}
	return stageList.sort((a, b) => a - b);
}

function historyStarTable(stageList: number[]): [StarDef, number][][]
{
	var starTable: [StarDef, number][][] = [];
	for (const stageId of stageList) {
		var starList: [StarDef, number, number][] = [];
		for (let i = 0; i < G_HISTORY.header.starList.length; i++) {
			if (i >= G_HISTORY.data.length) continue;
			var glob = G_HISTORY.header.starList[i];
			if (glob.stageid !== stageId) continue;
			var globIdList = glob.staridlist.split(',');
			// for now we will only care about one star
			var globId = globIdList[0];
			var starId = orgStarId(stageId, globId);
			starList.push([orgStarDef(stageId, starId), i, starId]);
		}
		starList.sort(function (a, b) { return a[2] - b[2]; });
		starTable.push(starList.map((s) => [s[0], s[1]]));
	}
	return starTable;
}

function historyTimeTable(ix: number, starDef: StarDef, colList: ColList, verOffset: VerOffset, stratOffset: StratOffset): TimeTable {
	var data = G_HISTORY.data[ix].times[0];
	return loadTTRaw(data, starDef, colList, verOffset, stratOffset);
}

export function HistoryBoard(props: { playData: PlayData, rm: RouterMain }): React.ReactNode
{
	// TODO: replace with real error messages, maybe even dont show a history tab
	if (G_HISTORY.header.status !== 'active' || G_HISTORY.data.length === 0) {
		return <div className="blurb-cont"><div className="para">Loading...</div></div>;
	}

	// router state
	const rm = props.rm;
	const [defStage, starSlug, _defStar] = procStarSlug(rm.core.slug);
	var defStar = 0;

	const [playCount, setPlayCount] = useState(0);

	// stage state
	var stageList = historyStageList();
	const [id1, setId1] = useState(defStage);

	// re-calculate default star based on history table
	var starTable = historyStarTable(stageList);
	starTable[id1].map(([starDef, _ix], i) => {
		if (starDef.id === starSlug) defStar = i;
	})
	var defCache = Array(orgData.length).fill(0);
	defCache[defStage] = defStar;

	// star state
	const [id2Cache, setId2Cache] = useState(defCache);
	const id2 = id2Cache[id1];
	var [starDef, globIx] = starTable[id1][id2];

	// stage/star functions
	const changeStage = (e: React.ChangeEvent<HTMLSelectElement>) => {
		var newStage = parseInt(e.target.value);
		var newStar = starTable[newStage][0][0].id;
		setId1(newStage);
		navRM(rm, "home", "history", makeStarSlug(newStage, newStar));
		//router.push("/home/history?star=" + makeStarSlug(newStage, newStar));
	};

	const changeStar = (i: number) => {
		id2Cache[id1] = i;
		setId2Cache(id2Cache.map((x: number) => x));
		var newStar = starTable[id1][i][0].id;
		navRM(rm, "home", "history", makeStarSlug(id1, newStar));
		//router.push("/home/history?star=" + makeStarSlug(id1, newStar));
	};

	// if route changes, re-render board
	useEffect(() => {
		const [newStage, newSlug, _xStar] = procStarSlug(rm.core.slug);
		if (id1 !== newStage || starDef.id !== newSlug) {
			var newStar = 0;
			starTable[newStage].map(([starDef, _ix], i) => {
				if (starDef.id === newSlug) newStar = i;
			})
			id2Cache[newStage] = newStar;
			setId1(newStage);
			setId2Cache(id2Cache.map((x) => x));
		}
	}, [rm.core]);

	// stage select option nodes
	var stageOptNodes = stageList.map((stageId, i) =>
		<option key={ orgData[stageId].name } value={ i }>{ orgData[stageId].name }</option>
	);

	// star select nodes
	var starBtnNodes = starTable[id1].map((_star, i) => {
		var [star, ix] = _star;
		var flag = (id2Cache[id1] === i) ? "true" : "false";
		return <div key={ star.name } className="star-name" data-sel={ flag }
			onClick={ () => { changeStar(i) } }>{ star.name }</div>;
	});

	// build date node
	var glob = G_HISTORY.header.starList[globIx];
	var startDate = dateAndOffset(G_HISTORY.header.season.startdate, glob.day);
	var dateNode: React.ReactNode = <div className='label-cont'>{ dispDate(startDate) }</div>;
	if (glob.weekly) {
		var dt1 = dispDate(startDate);
		var dt2 = dispDate(dateAndOffset(G_HISTORY.header.season.startdate, glob.day + 6));
		dateNode = <div className="row-wrap ds-cont">
			<div className='label-cont'>{ dt1 + " - " + dt2 + " "}
				<em className="label-em">(Weekly 100 Coin)</em></div>
		</div>;
	}

	// standard xcam player list
	var playNameList: string[] = [];
	if (G_SHEET.userMap !== null) {
		playNameList = Object.entries(G_SHEET.userMap.stats).map(([k, v]) => k);
	}
	var playDB: PlayDB = {
		"baseUrl": "/xcam/players",
		"nameList": playNameList
	};

	// main nodes to pass into viewer
	var stageSelNode = (
		<div className="stage-select">
			<select value={ id1 }
				onChange={ changeStage }>
				{ stageOptNodes }
			</select>
		</div>);

	var starSelNode = (<div>
		<div className="star-select less-margin">
			{ starBtnNodes }
		</div>
		<div className="sep"><hr/></div>
		<div className="row-wrap row-margin no-space">
			<div className='label-cont'>Day { glob.day + 1 }</div>
			{ dateNode }
			<div className='label-cont alt-label'>Players: { playCount }</div>
		</div>
	</div>);

	const ttFun = (colList: ColList, verOffset: VerOffset, sOffset: StratOffset) => {
		var newTable = historyTimeTable(globIx, starDef, colList, verOffset, sOffset);
		// must be an effect to prevent illegal insta re-render
		useEffect(() => {
			if (playCount !== newTable.length) setPlayCount(newTable.length);
		}, [playCount]);
		return newTable;
	};

	return (<div>
		<ViewBoard stageId={ stageList[id1] } starDef={ starDef } playData={ props.playData } extAll={ true }
			ttFun= { ttFun } cornerNode={ stageSelNode } headerNode={ starSelNode } playDB={ playDB } />
	</div>);
}