import playData from '../json/player_data.json'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

import { DEV } from '../rx_multi_board'

import { IdService, Ident, newIdent, keyIdent, rawIdent } from '../time_table'
import { PlayData, newPlayData } from '../play_data'
import { orgStarId, orgStarDef } from '../org_star_def'
import { StxStarMap, statKey, starOnlyKey, recordStxStarData } from './stats_star_map'
import { UserStatMap, UserScore, IncScore, rankPts, fullScoreList, calcTopXStats } from './stats_user_map'
import { TimeCell, NameCell } from '../table_parts/rx_star_cell'
import { GenInput } from './rx_gen_input'

import { getRankValue } from '../standards/strat_ranks'
import { UserRankMap, UserRankStore } from '../standards/user_ranks'

const PERM = ["bob", "wf", "jrb", "ccm", "bbh", "hmc", "lll", "ssl",
	"ddd", "sl", "wdw", "ttm", "thi", "ttc", "rr", "sec", "bow"];

export function getStarColor(cat: string | null): string
{
	if (cat === "only:16" || cat === "notin:120") return "n120";
	if (cat === "in:16" || cat === "in:16no") return "c16";
	if (cat === "only:70") return "c70";
	if (cat === "only:120") return "c120";
	if (cat === "only:any" || cat === "only:beg"
		|| cat === "only:70beg" || cat === "only:120beg") return "rare";
	if (cat === null) return "default";
	throw ("Unknown category: " + cat);
}

type DetailTableProps = {
	hrefBase: [string, string],
	id: Ident,
	splitFlag: boolean,
	cornerNode: React.ReactNode | null,
	starMap: StxStarMap | null,
	userMap: UserStatMap | null,
	userRankMap: UserRankMap | null,
	pd?: PlayData,
	showStd: boolean
}

export function DetailTable(props: DetailTableProps): React.ReactNode
{
	const [hrefMain, hrefStar] = props.hrefBase;
	const splitFlag = props.splitFlag;
	var GS_userMap = props.userMap;
	//var GS_userMap = splitFlag ? G_SHEET.userMapSplit : G_SHEET.userMap;

	var userKey = keyIdent(props.id);
	if (GS_userMap === null || props.starMap === null
		|| GS_userMap.stats[userKey] === undefined) {
		return <div className="blurb-cont"><div className="para">Loading...</div></div>;
	}

	const [altFlag, setAltFlag] = useState(false);

	var playStats = GS_userMap.stats[userKey];
	playStats.starList.sort(function (a, b) {
		if (b.scorePts === a.scorePts) return b.rank[1] - a.rank[1];
		return b.scorePts - a.scorePts;
	});

	// can sort by normal or by best rank
	var initNum: number = 0;
	const [sortId, setSortId] = useState(initNum);

	// construct the board
	var playTableNodesEx: [number, React.ReactNode][] = [];
	var kx = 0;
	var ix = 0;
	var fullList = fullScoreList(playStats.starList, altFlag);
	var incompleteList = Object.entries(playStats.incomplete).map((x) => x[1]);
	incompleteList.sort(function(a, b) { return b.playTotal - a.playTotal });
	fullList = fullList.concat(incompleteList);
	// for every score in the completed list
	for (const userScore of fullList)
	{
		// get star / strat data
		var starKey = statKey(userScore);
		var starDef = orgStarDef(userScore.stageId, orgStarId(userScore.stageId, userScore.starId));
		var starData = props.starMap[starKey];
		// read record data
		var recordDat = recordStxStarData(starData, userScore.alt);
		// alternate display info may be needed for
		// 1. inherently different stars
		// 2. combination comparison stars when we are showing alternates
		// 3. offset stars if we are splitting offsets
		var altDisp = starDef.alt !== null && (starDef.alt.status === "diff" || (altFlag && starDef.alt.status !== "offset")
			|| (splitFlag && starDef.alt.status === "offset"));
		// star alt specific data
		var short = starDef.info.short;
		var catInfo = starDef.info.catInfo;
		// use alternate shortcodes when alt display is on
		if (starDef.alt !== null) {
			if (altDisp) {
				if (userScore.alt.state === "alt") {
					short = starDef.alt.info.short;
					catInfo = starDef.alt.info.catInfo;
				}
			} else short = starDef.alt.globShort;
		}
		// calculate star name
		var starName = short;
		if (userScore.stageId >= 0 && userScore.stageId <= 14) {
			starName = PERM[userScore.stageId].toUpperCase() + " " + short;
		}
		// calculate star color
		var starColor = "default";
		if (catInfo !== null) {
			starColor = getStarColor(catInfo);
			// if the color is "obsolete" use the other variant's color
			if (starColor === "rare" && starDef.alt !== null && !altDisp) {
				catInfo = starDef.alt.info.catInfo;
				starColor = getStarColor(catInfo);
			}
		}
		// do not display offset for cutscene / mergeOffset stars unless show alternates is on
		var showOffset = true;
		if (starDef.alt !== null && !altFlag &&
			(starDef.alt.status === "cutscene" || starDef.alt.status === "mergeOffset")) showOffset = false;
		// build player row
		var playNodes: React.ReactNode[] = [];
		playNodes.push(<td className="time-cell link-cont" data-active={ true } data-complete={ (userScore.comp).toString() }
			data-sc={ starColor } key="star">{ starName }
			<Link className="link-span" href={ hrefStar + "?star=" + PERM[userScore.stageId] + "_" + userScore.starId }></Link></td>);
			//<Link className="link-span" href={ "/xcam?star=" + PERM[userScore.stageId] + "_" + userScore.starId }></Link></td>);
		// incomplete case
		if (!userScore.comp) {
			var rankText = "?/" + userScore.playTotal;
			var score = "-";
			var timeNode: React.ReactNode = <td className="time-cell" colSpan={ 2 } key="time">-</td>;
			if (userScore.rank !== null) {
				var rankNo = userScore.rank + 1;
				rankText = rankNo + "/" + userScore.playTotal;
				score = (rankPts([userScore.rank, userScore.playTotal]) * 100).toFixed(2);
			}
			if (userScore.timeDat !== null) {
				timeNode = (<TimeCell timeDat={ userScore.timeDat } verOffset={ starData.vs } hideStratOffset={ !showOffset }
					complete={ "false" } active={ false } onClick={ () => {} } hiddenFlag={ false } key="time"/>);
			}
			playNodes.push(<td className="time-cell" key="no">-</td>);
			playNodes.push(<td className="time-cell" data-complete="false" key="rank">{ rankText }</td>);
			playNodes.push(<td className="time-cell" data-complete="false" key="score">{ score }</td>);
			playNodes.push(timeNode);
		} else {
			var rankNo = userScore.rank[0] + 1;
			playNodes.push(<td className="time-cell" key="no">{ ix + 1 }</td>);
			playNodes.push(<td className="time-cell" key="rank">{ rankNo + "/" + userScore.rank[1] }</td>);
			playNodes.push(<td className="time-cell" key="score">{ (userScore.scorePts * 100).toFixed(2) }</td>);
			playNodes.push(<TimeCell timeDat={ userScore.timeDat } verOffset={ starData.vs } hideStratOffset={ !showOffset }
				active={ false } onClick={ () => {} } hiddenFlag={ false } key="time"/>);
		}
		playNodes.push(<TimeCell timeDat={ recordDat } verOffset={ starData.vs } hideStratOffset={ !showOffset }
			complete={ (userScore.comp).toString() } active={ false } onClick={ () => {} } hiddenFlag={ false } key="best"/>);
		// default sort by score
		var sortIndex = 1;
		if (userScore.comp) sortIndex = 1 - userScore.scorePts;
		// best rank cells
		if (props.showStd && props.userRankMap !== null) {
			var rankName = "Unranked";
			var userStarMap = props.userRankMap[userKey];
			if (userStarMap !== undefined) {
				var [starKey, alt] = starOnlyKey(userScore);
				var rankData = userStarMap[starKey];
				if (rankData !== undefined) {
					if (alt.state === null && rankData.combRank) rankName = rankData.combRank;
					else if (alt.state === "alt" && rankData.altRank) rankName = rankData.altRank;
					else if (alt.state !== "alt") rankName = rankData.mainRank;
				}
			}
			var dc = userScore.comp;
			var style: any = { "opacity": "0.875" } ;
			if (!dc) {
				style.opacity = "0.7";
				style["fontStyle"] = "italic";
			}
			playNodes.push(<td className="time-cell" style={ style } colSpan={ 2 } data-ps={ rankName } key="bestRank">{ rankName }</td>);
			if (sortId === 2) sortIndex = getRankValue(rankName);
		}
		playTableNodesEx.push([sortIndex, <tr className="time-row" key={ kx }>{ playNodes }</tr>]);
		if (userScore.comp || userScore.rank === null) ix = ix + 1;
		kx = kx + 1;
	}

	// sort based on the stored sort index
	playTableNodesEx.sort(function (a, b) {
		return a[0] - b[0];
	});
	var playTableNodes = playTableNodesEx.map((a) => a[1]);

	var pd = newPlayData();
	if (props.pd !== undefined) pd = props.pd;
	var playerId = props.id;
	//<NameCell id={ playerId } pd={ pd } active={ true } onClick={ () => {} } href="/xcam/players"/>

	var imgNodeFun = (active: boolean): React.ReactNode => (<div className="float-frame">
		<img src="/icons/sort-icon.png" data-active={ active.toString() } className="float-icon" alt=""></img></div>);

	var cellSpan = "25.5%";
	var stdNode: React.ReactNode = "";
	var tableClass = "time-table small-table";
	if (props.showStd) {
		cellSpan = "20%";
		stdNode = (<td className="time-cell" data-active="true" onClick={ () => setSortId(2) }
			width="15%" colSpan={ 2 }>Best Rank { imgNodeFun(sortId === 2) }</td>);
		tableClass = "time-table med-table";
	}
	return (
		<div>
		<div className="row-wrap">
			<div className="toggle-sidebar big-indent"><div className="ver-cont row-wrap">
				{ props.cornerNode }
				<div className="toggle-box">
					<div className="toggle-button" data-plain="true"
						data-active={ altFlag.toString() } onClick={ () => setAltFlag(!altFlag) }>
						<div className="toggle-inner">Show Alternates</div>
					</div>
				</div>
			</div></div>
		</div>
		<div className="table-cont">
			<table className={ tableClass }><tbody>
				<tr className="time-row" key="header">
					<NameCell id={ playerId } pd={ pd } active={ true } onClick={ () => {} } href={ hrefMain }/>
					<td className="time-cell" width="5%">#</td>
					<td className="time-cell" width="10%">Rank</td>
					<td className="time-cell" data-active="true" onClick={ () => setSortId(1) }
						width="8%" >Score { imgNodeFun(sortId === 1) }</td>
					<td className="time-cell" width={ cellSpan } colSpan={ 2 }>Time</td>
					<td className="time-cell" width={ cellSpan } colSpan={ 2 }>Sheet Best</td>
					{ stdNode }
				</tr>
				{ playTableNodes }
			</tbody></table>
		</div>
		</div>
	);
}

type PlayerTableProps = {
	hrefBase: [string, string],
	splitFlag: boolean,
	lowNum: number,
	midNum: number
	cornerNode: React.ReactNode | null,
	userMap: UserStatMap | null,
	idType: IdService,
	pd?: PlayData
};

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
			'top30': calcTopXStats(player, props.lowNum, DEV),
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
}

export function DetailAbout(props: {}): React.ReactNode
{
	const [about, setAbout] = useState(false);
	if (!about) return (<div className="blurb-cont" onClick={ () => setAbout(true) }><div className="para">
			<div className="h-em">[+] Score Calculation (Updated: Feb 3, 2025)</div>
		</div></div>);

	return(<div className="blurb-cont" onClick={ () => setAbout(false) }>
		<div className="para">
			<div className="h-em">[-] Score Calculation (Updated: Feb 3, 2025)</div>
			<div className="para-inner">
				For each star in the Xcam viewer, players are sorted based on their best time
				across all strats (adjusted for version differences). To calculate a score,
				this ordering is turned into a rank. Players are given scores for each star
				based on this rank, and a player's Best X scores are averaged to calculate
				the total score. (Name colors are calculated based on Best of 30 scores).
			</div>
		</div>
		<div className="para">
			<p>Click on a player's name for a detailed break down of scores, click again to return.</p>
			<p>NOTE: This feature is still in BETA, calculation method subject to change, errors may exist.</p>
			<p>* Change reflects changes to the Xcam sheet.</p>
		</div>
		<div className="para">
			<div className="h-em">Changelog:</div>
			<ul>
				<li>(NEW) Wing Mario Over the Rainbow + RR 100 (with carpet and with cannon) without the Cutscene
					no longer count for score*</li>
				<li>(NEW) The Slide -&gt; SJ strat for CCM Snowman's Lost his Head, as well as the alternate routes
					for SSL 100 and SL 100 now count for score*</li>
				<li>(NEW) THI 100c with 11c start no longer counts for score*</li>
				<li>The faster Toxic Maze BLJ Clip + Igloo Clip now count for score, reflecting changes to the Xcam sheet.</li>
				<li>Fixed offset for BitS Battle - 120 File and Normal File offsets were switched.</li>
				<li>Stars with external time differences (JRB Cannon vs Framewalk, TTC Time Stop vs Moving, etc)
					now have offsets applied and will only count once for scoring.</li>
				<li>Stars with small timing variations (Cutscene vs NC, Star Xcam vs Pipe, etc) have
					the same scores calculated, but only the best one will count for scoring.</li>
				<li>As a result, total competition slots have gone down from 128 to 119.</li>
				<li>NOTE: This was a complex change so feel free to contact me (dcco on Discord) about any scoring bugs. Thank you.</li>
			</ul>
		</div>
	</div>);
}

type PlayerBoardProps = {
	slug?: string,
	hrefBase: [string, string],
	lowNum: number,
	midNum: number,
	aboutNode: React.ReactNode,
	starMap: StxStarMap | null,
	userMap: UserStatMap | null,
	userRankStore: UserRankStore | null,
	altStarMap?: StxStarMap | null,
	altMap?: { [key: string]: UserStatMap },
	idType?: IdService,
	pd?: PlayData,
	showStd?: boolean
};

export function PlayerBoard(props: PlayerBoardProps): React.ReactNode
{
	var initPlayer: string | null = null;
	if (props.slug !== undefined && props.slug !== "") {
		initPlayer = decodeURIComponent(props.slug); 
	}

	var altMap: { [key: string]: UserStatMap } = {};
	if (props.altMap) altMap = props.altMap;

	const [splitFlag, setSplitFlag] = useState(false);
	const [extFlag, setExtFlag] = useState(false);
	const [player, setPlayer] = useState(initPlayer);

	var toggleNodeList: React.ReactNode[] = [];
	if (altMap["split"] !== undefined) toggleNodeList.push(<div className="toggle-box slight-margin" key="split">
		<div className="toggle-button" data-plain="true"
			data-active={ splitFlag.toString() } onClick={ () => setSplitFlag(!splitFlag) }>
			<div className="toggle-inner">Split Offset Stars</div>
		</div></div>);
	if (altMap["ext"] !== undefined) toggleNodeList.push(<div className="toggle-box slight-margin" key="ext">
		<div className="toggle-button" data-plain="true"
			data-active={ extFlag.toString() } onClick={ () => setExtFlag(!extFlag) }>
			<div className="toggle-inner">Allow Extensions</div>
		</div></div>);
	var toggleNode = <div className="row-wrap no-space">{ toggleNodeList }</div>;

	var starMap = extFlag && props.altStarMap && props.altStarMap !== null ? props.altStarMap : props.starMap;

	var GS_userMap = splitFlag ? (extFlag ? altMap["ext_split"] : altMap["split"]) :
		(extFlag ? altMap["ext"] : props.userMap);

	var idType: IdService = "xcam";
	if (props.idType !== undefined) idType = props.idType;

	var showStd = false;
	if (props.showStd) showStd = props.showStd;

	var userRankMap: UserRankMap | null = null;
	if (props.userRankStore !== null) {
		userRankMap = extFlag ? props.userRankStore.extMap : props.userRankStore.bestMap;
	}

	var board = null;
	if (player === null) board = <PlayerTable hrefBase={ props.hrefBase } splitFlag={ splitFlag } cornerNode={ toggleNode }
		lowNum={ props.lowNum } midNum={ props.midNum } userMap={ GS_userMap } idType={ idType } pd={ props.pd }/>;
	else board = <DetailTable hrefBase={ props.hrefBase } id={ newIdent(idType, player) } splitFlag={ splitFlag }
		cornerNode={ toggleNode } starMap={ starMap } userMap={ GS_userMap } userRankMap={ userRankMap }
		pd={ props.pd } showStd={ showStd }/>;

	return (<div>
		{ props.aboutNode }
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