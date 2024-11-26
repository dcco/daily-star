
import React, { useState } from 'react'
import orgData from './json/org_data.json'

import { VerOffset } from './time_dat'
import { ColList } from './org_strat_def'
import { StarDef, orgStarId, orgStarDef } from './org_star_def'
import { TimeTable } from './time_table'
import { PlayData } from './play_data'
import { loadTTRaw } from './api_live'
import { G_HISTORY, dateAndOffset, dispDate } from './api_season'
import { ViewBoard } from './rx_view_board'

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
		var starList: [StarDef, number][] = [];
		for (let i = 0; i < G_HISTORY.header.starList.length; i++) {
			if (i >= G_HISTORY.data.length) continue;
			var glob = G_HISTORY.header.starList[i];
			if (glob.stageid !== stageId) continue;
			var globIdList = glob.staridlist.split(',');
			// for now we will only care about one star
			var globId = globIdList[0];
			var starId = orgStarId(stageId, globId);
			starList.push([orgStarDef(stageId, starId), i]);
		}
		starTable.push(starList);
	}
	return starTable;
}

function historyTimeTable(ix: number, starDef: StarDef, colList: ColList, verOffset: VerOffset): TimeTable {
	var data = G_HISTORY.data[ix].times[0];
	return loadTTRaw(data, starDef, colList, verOffset);
}

export function HistoryBoard(props: { playData: PlayData }): React.ReactNode
{
	// TODO: replace with real error messages, maybe even dont show a history tab
	if (G_HISTORY.header.status !== 'active' || G_HISTORY.data.length === 0) {
		return <div className="blurb-cont"><div className="para">Loading...</div></div>;
	}

	const [playCount, setPlayCount] = useState(0);

	// stage state
	var stageList = historyStageList();
	const [id1, setId1] = useState(0);

	// star state
	var starTable = historyStarTable(stageList);
	const [id2Cache, setId2Cache] = useState(Array(stageList.length).fill(0));
	const id2 = id2Cache[id1];
	var [starDef, globIx] = starTable[id1][id2];

	// stage/star functions
	const changeStage = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setId1(parseInt(e.target.value));
	};

	const changeStar = (i: number) => {
		id2Cache[id1] = i;
		setId2Cache(id2Cache.map((x: number) => x));
	};

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

	return (<div>
		<ViewBoard stageId={ stageList[id1] } starDef={ starDef } playData={ props.playData } extAll={ true }
			ttFun= { (colList: ColList, verOffset: VerOffset) => {
				var newTable = historyTimeTable(globIx, starDef, colList, verOffset);
				if (playCount !== newTable.length) setPlayCount(newTable.length);
				return newTable;
			} }
			cornerNode={ stageSelNode } headerNode={ starSelNode }/>
	</div>);
}