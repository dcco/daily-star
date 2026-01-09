
import React, { useState, useEffect } from 'react'
import orgData from '../json/org_data.json'

import { G_SHEET } from '../api_xcam'
import { readCodeList } from '../api_season'
import { G_HISTORY, SeasonHistory, findSeason, dateAndOffset, dispDate, historyTimeTable } from '../api_history'

import { VerOffset, StratOffset } from '../time_dat'
import { ColList } from '../org_strat_def'
import { StarDef, orgStarId, orgStarDef } from '../org_star_def'
import { TimeTable } from '../time_table'
import { PlayData } from '../play_data'
import { procStarSlug, makeStarSlug, prependSeasonSlug } from '../router_slug'
import { RouterMain, navRM } from '../router_main'
import { PlayDB } from '../table_parts/rx_star_row'
import { ViewBoard } from '../board_simple/rx_view_board'
import { SeasonSelProps, SeasonSel } from './rx_season_sel'

function historyStageList(histObj: SeasonHistory): number[]
{
	var stageList: number[] = [];
	var hList = histObj.header.starList;
	for (let i = 0; i < hList.length; i++) {
		var star = hList[i];
		if (star.special !== null) continue;
		if (i < histObj.data.length && !stageList.includes(star.stageid)) {
			stageList.push(star.stageid);
		}
	}
	return stageList.sort((a, b) => a - b);
}

function historyStarTable(histObj: SeasonHistory, stageList: number[]): [StarDef, number, number][][]
{
	var maxStage = 1;
	stageList.map((i) => { if (i >= maxStage) maxStage = i + 1; });
	var starTable: [StarDef, number, number, number][][] = Array(maxStage).fill(0).map(() => { return []; });

	for (const stageId of stageList) {
		for (let i = 0; i < histObj.header.starList.length; i++) {
			if (i >= histObj.data.length) continue;
			var glob = histObj.header.starList[i];
			if (glob.special !== null) continue;
			if (glob.stageid !== stageId) continue;
			var globIdList = readCodeList(glob.stageid, glob.staridlist);
			// for each glob in the glob list
			for (let j = 0; j < globIdList.length; j++) {
				var [globStageId, globId] = globIdList[j];
				var starId = orgStarId(globStageId, globId);
				starTable[globStageId].push([orgStarDef(globStageId, starId), i, j, starId]);
			}
		}
	}
	var retTable: [StarDef, number, number][][] = starTable.map((starList) => {
		starList.sort(function (a, b) { return a[3] - b[3]; });
		return starList.map((s) => [s[0], s[1], s[2]]);
	});
	return retTable;
}

	// if the defaults don't exist, use a fallback
/*function fallbackDefault(starTable: [StarDef, number, number][][], defStage: number, starSlug: string): [number, number]
{
	if (defStage >= starTable.length || starTable[defStage].length === 0) {
		defStage = 16;
		starTable.map((stage, i) => { if (stage.length > 0 && i < defStage) defStage = i; });
	}
	var defStar = 0;
	starTable[defStage].map(([starDef, _ix], i) => {
		if (starDef.id === starSlug) defStar = i;
	})
	return [defStage, defStar];
}*/

function findStageStarIndex(stageList: number[], starTable: [StarDef, number, number][][], stageId: number, starId: string): [number, number]
{
	var defStage = 0;
	stageList.map((stageX, i) => {
		if (stageX === stageId) defStage = i;
	})
	const starList = starTable[stageList[defStage]];
	starList.map((entry, i) => {
		const [starDef, _headIx, _globIx] = entry;
		if (starDef.id === starId) return [defStage, i];
	})
	return [defStage, 0];
}

export function HistoryBoard(props: SeasonSelProps & { playData: PlayData, rm: RouterMain }): React.ReactNode
{
	// Attempt to read history
	var histObj = G_HISTORY.current;
	if (props.seasonId !== null) {
		var fObj = findSeason(props.seasonId);
		if (fObj !== null) histObj = fObj;
	}

	// TODO: replace with real error messages, maybe even dont show a history tab
	var status = histObj.header.status;
	if (status === 'null') {
		return <div className="blurb-cont"><div className="para">Loading...</div></div>;
	} else if (status === 'err') {
		return <div className="blurb-cont"><div className="para">Error while loading season.</div></div>;
	} else if (status === 'none') {
		return <div className="blurb-cont"><div className="para">No active season.</div></div>;
	} else if (histObj.data.length === 0) {
		return <div className="blurb-cont"><div className="para">No stars for history.</div></div>;
	}

	// router state
	// - since star table may be incomplete, ignore star id returned from processing slug
	const rm = props.rm;
	var [defStageInit, starSlug, _defStar] = procStarSlug(rm.core.slug);

	const [playCount, setPlayCount] = useState(0);

	// build history star table, select defaults
	var stageList = historyStageList(histObj);
	var starTable = historyStarTable(histObj, stageList);
	const [rawId1, rawId2] = findStageStarIndex(stageList, starTable, defStageInit, starSlug);
	//const [defStage, defStar] = fallbackDefault(starTable, defStageInit, starSlug);

	// stage / star state -- NOTE: this is an id into the stage list, not the real stage id
	var [_id1, setId1] = useState(stageList[rawId1]);
	var defCache = Array(orgData.length).fill(0);
	defCache[_id1] = rawId2;

	// star state -- NOTE: this is an index into the star table, not the real star id
	const [id2Cache, setId2Cache] = useState(defCache);
	const _id2 = id2Cache[stageList[_id1]];

	// - failsafe if ids are invalid (happens when switching seasons)
	var id1 = starTable[stageList[_id1]].length === 0 ? rawId1 : _id1;
	const stageId = stageList[id1];
	var id2 = starTable[stageId][_id2] === undefined ? rawId2 : _id2;
	const [starDef, globIx, globIx2] = starTable[stageId][id2];

	// - clear cache if switching seasons
	useEffect(() => {
		setId2Cache(defCache);
	}, [props.seasonId]);

	// stage/star functions
	const changeStage = (e: React.ChangeEvent<HTMLSelectElement>) => {
		var newId1 = parseInt(e.target.value);
		var newStage = stageList[newId1];
		var newStar = starTable[newStage][0][0].id;
		setId1(newId1);
		navRM(rm, "home", "history", prependSeasonSlug(props.seasonId, makeStarSlug(newStage, newStar)));
		//router.push("/home/history?star=" + makeStarSlug(newStage, newStar));
	};

	const changeStar = (i: number) => {
		id2Cache[stageId] = i;
		setId2Cache(id2Cache.map((x: number) => x));
		var newStar = starTable[stageId][i][0].id;
		navRM(rm, "home", "history", prependSeasonSlug(props.seasonId, makeStarSlug(stageId, newStar)));
		//router.push("/home/history?star=" + makeStarSlug(id1, newStar));
	};

	// if route changes, re-render board
	useEffect(() => {
		const [newStageInit, newSlug, _xStar] = procStarSlug(rm.core.slug);
		//const [newStage, newStar] = fallbackDefault(starTable, newStageInit, newSlug);
		const [newStage, newStar] = findStageStarIndex(stageList, starTable, newStageInit, newSlug);
		if (id1 !== newStage || starDef.id !== newSlug) {
			var newCache = id2Cache.map((x) => x);
			newCache[newStage] = newStar;
			setId1(newStage);
			setId2Cache(newCache);
		}
	}, [rm.core]);

	// stage select option nodes
	var stageOptNodes = stageList.map((stageId, i) =>
		<option key={ orgData[stageId].name } value={ i }>{ orgData[stageId].name }</option>
	);

	// star select nodes
	var starBtnNodes = starTable[stageId].map((_star, i) => {
		var [star, ix] = _star;
		var flag = (id2Cache[stageId] === i) ? "true" : "false";
		return <div key={ star.name } className="star-name" data-sel={ flag }
			onClick={ () => { changeStar(i) } }>{ star.name }</div>;
	});

	// build date node
	var glob = histObj.header.starList[globIx];
	var startDate = dateAndOffset(histObj.header.season.startdate, glob.day);
	var dateNode: React.ReactNode = <div className='label-cont'>{ dispDate(startDate) }</div>;
	if (glob.weekly) {
		var dt1 = dispDate(startDate);
		var dt2 = dispDate(dateAndOffset(histObj.header.season.startdate, glob.day + 6));
		dateNode = <div className="row-wrap ds-cont">
			<div className='label-cont'>{ dt1 + " - " + dt2 + " "}
				<em className="label-em">(Weekly 100 Coin)</em></div>
		</div>;
	}

	// standard xcam player list
	var playNameList: string[] = [];
	if (G_SHEET.scoreData !== null) {
		playNameList = Object.entries(G_SHEET.scoreData.user["ext$"].stats).map(([k, v]) => k);
	}
	var playDB: PlayDB = {
		"baseUrl": "/xcam/players",
		"nameList": playNameList
	};

	// main nodes to pass into viewer
	var stageSelNode = (
		<div className="stage-select row-wrap">
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
		var newTable = historyTimeTable(histObj, globIx, globIx2, starDef, colList, verOffset, sOffset);
		// must be an effect to prevent illegal insta re-render
		useEffect(() => {
			if (playCount !== newTable.length) setPlayCount(newTable.length);
		}, [newTable]);
		return newTable;
	};

	var seasonSelNode = <SeasonSel seasonId={ props.seasonId } setSeasonId={ props.setSeasonId }/>;

	return (<div>
		<ViewBoard kind="view" mergeRaw={ true } stageId={ stageId } starDef={ starDef }
			playData={ props.playData } extAll={ true } ttFun= { ttFun } toggleNode={ seasonSelNode }
			cornerNode={ stageSelNode } headerNode={ starSelNode } showStd={ true } playDB={ playDB } />
	</div>);
}