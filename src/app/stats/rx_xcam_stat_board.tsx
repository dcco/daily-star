import React, { useState, useEffect } from 'react'

import { DEV } from '../rx_multi_board'

import { IdService, newIdent } from '../time_table'
import { PlayData } from '../play_data'

import { totalColumn, percentColumn, bestOfXColumn,
	numDetCol, placementDetCol, scoreDetCol, timeDetCol, recordDetCol, rankDetCol } from './stat_columns'
import { UserStatMap } from './stats_user_map' 
import { ScoreCache, newScoreFilter, getUserDataScoreCache, getRankScoreCache } from './score_cache'
import { GenInput } from './rx_gen_input'
import { PlayerTableProps, PlayerTable } from './rx_player_table'
import { DetailBaseProps, DetailTable } from './rx_detail_table'

	/*
		xcam player board: shows best of 30, [custom], and ALL
	*/

export function XcamPlayerBoard(props: PlayerTableProps): React.ReactNode
{
	if (props.userMap === null) return <div></div>;
	const starTotal = props.userMap.starTotal;

	const colList = [
		totalColumn(props.userMap, 8),
		percentColumn(props.userMap, 8),
		bestOfXColumn(props.userMap, "Best of 30", "best_30", 30),
		bestOfXColumn(props.userMap, "Best of 50", "best_X", 50),
		bestOfXColumn(props.userMap, "Best of All (" + starTotal + ")", "all", starTotal)
	];

	return <PlayerTable hrefBase={ props.hrefBase }
		defSortId={ 2 } colList={ colList } userMap={ props.userMap } idType={ "xcam" } pd={ props.pd }/>;
}

	/*
		xcam detail board: shows #, rank (x/X), time, sheet best, and (sometimes) rank
	*/

export function XcamDetailBoard(props: DetailBaseProps & { showStd?: boolean }): React.ReactNode
{
	var cellSpan = 25.5;
	if (props.showStd === true) cellSpan = 20;

	const colList = [
		numDetCol("#", 5),
		placementDetCol("Rank", 10),
		scoreDetCol("Score", 8),
		timeDetCol("Time", cellSpan, props.altFlag),
		recordDetCol("Sheet Best", cellSpan, props.altFlag)
	];

	if (props.showStd === true && props.scoreData !== null) {
		colList.push(rankDetCol(props.scoreData, props.scoreFilter, props.id, "Best Rank", 15));
	}

	return <DetailTable hrefBase={ props.hrefBase } id={ props.id } colList={ colList } defSortId={ 2 }
		altFlag={ props.altFlag } scoreFilter={ props.scoreFilter } scoreData={ props.scoreData }
		pd={ props.pd } wideFlag={ props.showStd === true }/>;
}

	/*
		complete xcam player board - adds:
		- toggles
		- detail view
	*/

type XcamSBProps = {
	slug?: string,
	hrefBase: [string, string],
	aboutNode: React.ReactNode,
	scoreData: ScoreCache | null,
	pd?: PlayData,
	showStd?: boolean
};

export function XcamStatBoard(props: XcamSBProps): React.ReactNode
{
	// load slug informatioon
	var initPlayer: string | null = null;
	if (props.slug !== undefined && props.slug !== "") {
		initPlayer = decodeURIComponent(props.slug); 
	}

	// setup flags
	const [splitFlag, setSplitFlag] = useState(false);
	const [extFlag, setExtFlag] = useState(false);
	const [altFlag, setAltFlag] = useState(false);
	const [player, setPlayer] = useState(initPlayer);

	var showStd = false;
	if (props.showStd) showStd = props.showStd;

	// initialize get appropriate score data
	var userMap: UserStatMap | null = null;
	const fsx = newScoreFilter(extFlag ? "ext" : null, splitFlag, false);
	if (props.scoreData !== null) {
		var [_starMap, _userMap] = getUserDataScoreCache(props.scoreData, fsx);
		userMap = _userMap;
	}

	// setup toggle nodes
	var toggleNodeList: React.ReactNode[] = [];
	// if (altMap["split"] !== undefined) 
	toggleNodeList.push(<div className="toggle-box slight-margin" key="split">
		<div className="toggle-button" data-plain="true"
			data-active={ splitFlag.toString() } onClick={ () => setSplitFlag(!splitFlag) }>
			<div className="toggle-inner">Split Offset Stars</div>
		</div></div>);
	//if (altMap["ext"] !== undefined)
	toggleNodeList.push(<div className="toggle-box slight-margin" key="ext">
		<div className="toggle-button" data-plain="true"
			data-active={ extFlag.toString() } onClick={ () => setExtFlag(!extFlag) }>
			<div className="toggle-inner">Allow Extensions</div>
		</div></div>);
	// - detailed table only toggle
	if (player !== null) toggleNodeList.push(
		<div className="toggle-box" key="alt">
			<div className="toggle-button" data-plain="true"
				data-active={ altFlag.toString() } onClick={ () => setAltFlag(!altFlag) }>
				<div className="toggle-inner">Show Alternates</div>
		</div></div>);
	var toggleNode = <div className="row-wrap no-space">{ toggleNodeList }</div>;

	var board = null;
	if (player === null) board = <XcamPlayerBoard hrefBase={ props.hrefBase } userMap={ userMap } pd={ props.pd }/>;
	else board = <XcamDetailBoard hrefBase={ props.hrefBase } id={ newIdent("xcam", player) }
		altFlag={ altFlag } scoreFilter={ fsx } scoreData={ props.scoreData } pd={ props.pd } showStd={ props.showStd }/>;

	return (<div>
		{ props.aboutNode }
		<div className="row-wrap">
			<div className="toggle-sidebar big-indent">
				{ toggleNode }
			</div>
		</div>
		{ board }
	</div>);
}

//  <li>(Updated: Dec 8, 2024) The faster Toxic Maze BLJ Clip + Igloo Clip now count for score, reflecting changes to the Xcam sheet.</li>

/*
	var imgNodeFun = (active: boolean): React.ReactNode => (<div className="float-frame">
		<img src="/icons/sort-icon.png" data-active={ active.toString() } className="float-icon" alt=""></img></div>);
	var headerNodes: React.ReactNode[] = nameList.map((name, i) => {
		return (<td className="time-cell" key={ name } data-active={ sortActive.toString() } width={ tdWidth }
			onClick={ () => { if (sortActive) setSortId(i + 1) } }>{ name } { imgNodeFun(sortId === i + 1) }</td>);
	});
	headerNodes.unshift(<td className="time-cell" key="strat" data-active={ sortActive.toString() } width="15%"
		onClick={ () => setSortId(0) }>Strat { imgNodeFun(sortId === 0) }</td>);*/