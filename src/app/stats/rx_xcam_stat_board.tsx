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
export function PlayerTable(props: PlayerTableProps): React.ReactNode
{
	const [hrefMain, hrefStar] = props.hrefBase;
	const splitFlag = props.splitFlag;
	var GS_userMap = props.userMap;
	//splitFlag ? G_SHEET.userMapSplit : G_SHEET.userMap;

	if (GS_userMap === null) return <div></div>;
	var starTotal = GS_userMap.starTotal;

	const [sortId, setSortId] = useState(1);

	// custom "best of" sort
	const [number, setNumber] = useState(props.midNum);

	const validNumber = (x: string) => {
		var ii = parseInt(x);
		if (isNaN(ii)) return false;
		if (GS_userMap === null) return false;
		if (ii > 0 && ii <= GS_userMap.starTotal) return true;
		return false;
	}

	useEffect(() => {
		if (GS_userMap !== null && number > GS_userMap.starTotal) setNumber(GS_userMap.starTotal);
	}, [splitFlag]);

	useEffect(() => {
		if (number <= 0) setNumber(50);
	}, [number]);

	const updateNumber = (x: string) => { setNumber(parseInt(x)); }

	// perform calcs for board
	var playerList = Object.entries(GS_userMap.stats).map((_player) => {
		var [userKey, player] = _player;
		var total = player.starList.length;
		return {
			'id': player.id,
			'total': total,
			// CHANGE FOR THE LAUNCH
			'top30': calcTopXStats(player, props.lowNum, ALTER_RANKS),
			'topNum': calcTopXStats(player, number, false),
			'topAll': calcTopXStats(player, starTotal, false)
		};
	});
	playerList.sort(function (a, b) {
		if (sortId === 0) return b.total - a.total;
		else if (sortId === 2) return b.topNum - a.topNum;
		else if (sortId === 3) return b.topAll - a.topAll;
		else return b.top30 - a.top30;
	});

	// construct the board
	var pd = newPlayData();
	if (props.pd !== undefined) pd = props.pd;
	var playTableNodes: React.ReactNode[] = [];
	for (const data of playerList)
	{
		var playerId = data.id;
		var playNodes: React.ReactNode[] = [];
		var hrefX = "name";
		if (props.idType === "remote") hrefX = "id";
		playNodes.push(<NameCell id={ playerId } pd={ pd } active={ true } onClick={ () => {} }
			href={ hrefMain + "?" + hrefX + "=" + encodeURIComponent(rawIdent(playerId)) } key="user"/>);
		playNodes.push(<td className="time-cell" key="total">{ data.total }</td>);
		playNodes.push(<td className="time-cell" key="perc">{ (data.total * 100 / starTotal).toFixed(1) }</td>);
		playNodes.push(<td className="time-cell" key="0">{ data.top30.toFixed(2) }</td>);
		playNodes.push(<td className="time-cell" key="1">{ data.topNum.toFixed(2) }</td>);
		playNodes.push(<td className="time-cell" key="2">{ data.topAll.toFixed(2) }</td>);
		playTableNodes.push(<tr className="time-row" key={ keyIdent(playerId) }>{ playNodes }</tr>);
	}

	var imgNodeFun = (active: boolean): React.ReactNode => (<div className="float-frame">
		<img src="/icons/sort-icon.png" data-active={ active.toString() } className="float-icon" alt=""></img></div>);
	return (
		<div>
		<div className="row-wrap">
			<div className="big-indent ver-cont">
				{ props.cornerNode }
			</div>
			<div className="right-indent ver-cont">
			<div className="toggle-sidebar">
				<div className="passive-box">
					<div className="passive-button">Custom Best:</div>
				</div>
				<GenInput value={ "" + number } inputWidth="54px"
					setValue={ updateNumber } validFun={ validNumber }></GenInput>
			</div>
			<div></div>
		</div></div>
		<div className="table-cont">
			<table className="time-table small-table"><tbody>
				<tr className="time-row" key="header">
					<td className="time-cell" width="20%">Player</td>
					<td className="time-cell" width="8%" data-active="true"
						onClick={ () => setSortId(0) }>Fill { imgNodeFun(sortId === 0) }</td>
					<td className="time-cell" width="8%">%</td>
					<td className="time-cell" data-active="true" onClick={ () => setSortId(1) }>Best of { props.lowNum } { imgNodeFun(sortId === 1) }</td>
					<td className="time-cell" data-active="true" onClick={ () => setSortId(2) }>Best of { number } { imgNodeFun(sortId === 2) }</td>
					<td className="time-cell" data-active="true" onClick={ () => setSortId(3) }>Best of All ({ starTotal }) { imgNodeFun(sortId === 3) }</td>
				</tr>
				{ playTableNodes }
			</tbody></table>
		</div>
		</div>
	);
}*/

/*export function CustomNumNode(): React.ReactNode
{
	// custom "best of" sort
	const [number, setNumber] = useState(props.midNum);
	const updateNumber = (x: string) => { setNumber(parseInt(x)); }

	const validNumber = (x: string) => {
		var ii = parseInt(x);
		if (isNaN(ii)) return false;
		if (GS_userMap === null) return false;
		if (ii > 0 && ii <= GS_userMap.starTotal) return true;
		return false;
	}

	const customNumNode =
		<div className="toggle-sidebar">
			<div className="passive-box">
				<div className="passive-button">Custom Best:</div>
			</div>
			<GenInput value={ "" + number } inputWidth="54px"
				setValue={ updateNumber } validFun={ validNumber }></GenInput>
		</div>;
}*/

	/*
		xcam player board: shows best of 30, [custom], and ALL
	*/

export function XcamPlayerBoard(props: PlayerTableProps): React.ReactNode
{
	if (props.userMap === null) return <div></div>;
	const starTotal = props.userMap.starTotal;

	const colList = [
		totalColumn(props.userMap),
		percentColumn(props.userMap),
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

	return <DetailTable hrefBase={ props.hrefBase } id={ props.id } colList={ colList }
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
	const fsx = newScoreFilter(extFlag, splitFlag, false);
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

	// select map based on flag
	/*var starMap = extFlag && props.altStarMap && props.altStarMap !== null ? props.altStarMap : props.starMap;

	var GS_userMap = splitFlag ? (extFlag ? altMap["ext_split"] : altMap["split"]) :
		(extFlag ? altMap["ext"] : props.userMap);*/

	//var idType: IdService = "xcam";
	//if (props.idType !== undefined) idType = props.idType;

	/*var userRankMap: UserRankMap | null = null;
	if (props.userRankStore !== null) {
		userRankMap = extFlag ? props.userRankStore.extMap : props.userRankStore.bestMap;
	}*/

	var board = null;
	if (player === null) board = <XcamPlayerBoard hrefBase={ props.hrefBase } userMap={ userMap } pd={ props.pd }/>;
	else board = <XcamDetailBoard hrefBase={ props.hrefBase } id={ newIdent("xcam", player) }
		altFlag={ altFlag } scoreFilter={ fsx } scoreData={ props.scoreData } pd={ props.pd } showStd={ props.showStd }/>;
	/* */
	/*
		<div className="right-indent ver-cont">
			{ props.cornerNode2 }
		</div>
	*/
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