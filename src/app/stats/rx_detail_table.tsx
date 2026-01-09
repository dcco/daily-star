import React, { useState } from 'react'
import Link from 'next/link'

import { Ident, keyIdent } from '../time_table'
import { PlayData, newPlayData } from '../play_data'
import { orgStarId, orgStarDef } from '../org_star_def'
import { NameCell } from '../table_parts/rx_star_cell'
import { ScoreFilter, ScoreCache, getUserDataScoreCache } from './score_cache'
import { StxStarMap, StxStarData, statKey } from './stats_star_map'
import { UserScore, IncScore, UserStatMap, fullScoreList } from './stats_user_map'

import { UserRankMap } from '../standards/user_ranks'

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

export type DetColumn =
{
	name: string,
	key: string,
	colSpan?: number,
	widthRec?: number,
	mainFun: (score: UserScore, i: number, starData: StxStarData) => [React.ReactNode, number[]],
	incFun: (score: IncScore, i: number, starData: StxStarData) => [React.ReactNode, number[]]
};

	/*
		a board that shows scores for every star for a specific player
		- hrefBase / hrefEx: used to form links
		- id: target player
		- pd?: player data (used to know player ranks)
	*/

export type DetailBaseProps = {
	hrefBase: [string, string],
	hrefEx?: string,
	id: Ident,
	starFilter?: (userMap: UserStatMap) => UserStatMap,
	scoreFilter: ScoreFilter,
	altFlag: boolean,
	scoreData: ScoreCache | null,
	pd?: PlayData
}

export type DetailTableProps = DetailBaseProps & {
	colList: DetColumn[],
	wideFlag: boolean
	//showStd: boolean
}

export function DetailTable(props: DetailTableProps): React.ReactNode
{
	const [hrefMain, hrefStar] = props.hrefBase;
	const playerId = props.id;
	const scoreData = props.scoreData;
	const scoreFilter = props.scoreFilter;
	const splitFlag = scoreFilter.splitFlag;
	const altFlag = props.altFlag;

	var pd = newPlayData();
	if (props.pd !== undefined) pd = props.pd;

	if (scoreData === null) {
		return <div className="blurb-cont"><div className="para">Loading...</div></div>;
	}
	
	// sort functionality
	const [sortId, setSortId] = useState(0);

	var imgNodeFun = (active: boolean): React.ReactNode => (<div className="float-frame">
		<img src="/icons/sort-icon.png" data-active={ active.toString() } className="float-icon" alt=""></img></div>);

	/*
		build table rows
		- obtain list of stars for user
	*/
	const [starMap, _userMap] = getUserDataScoreCache(scoreData, scoreFilter);
	const userMap = props.starFilter ? props.starFilter(_userMap) : _userMap;

	var userKey = keyIdent(props.id);
	var playStats = userMap.stats[userKey];
	if (playStats === undefined) {
		return <div className="blurb-cont"><div className="para">Player not found for this season</div></div>;
	}

	// - sort by score data (TODO: change to sort by full score)
	playStats.starList.sort(function (a, b) {
		if (b.scorePts === a.scorePts) return b.rank[1] - a.rank[1];
		return b.scorePts - a.scorePts;
	});

	// - "complete" the list of stars (with the incomplete stars)
	var fullList = fullScoreList(playStats.starList, altFlag);

	var incompleteList = Object.entries(playStats.incomplete).map((x) => x[1]);
	incompleteList.sort(function(a, b) { return b.playTotal - a.playTotal });
	fullList = fullList.concat(incompleteList);

	// - for every score in the completed list
	var rx = 0;
	var kx = 0;
	const _playTableNodes: [React.ReactNode, number[]][] = [];
	for (const userScore of fullList) {
		var playNodes: React.ReactNode[] = [];
		var sortObj: number[] = [];
		/*
			calculate star color / display name
			- get star / strat data
		*/
		var starKey = statKey(userScore);
		var starDef = orgStarDef(userScore.stageId, orgStarId(userScore.stageId, userScore.starId));
		var starData = starMap[starKey];
		// - alternate display info may be needed for
		// 1. inherently different stars
		// 2. combination comparison stars when we are showing alternates
		// 3. offset stars if we are splitting offsets
		var altDisp = starDef.alt !== null && (starDef.alt.status === "diff" || (altFlag && starDef.alt.status !== "offset")
			|| (splitFlag && starDef.alt.status === "offset"));
		// - star alt specific data
		var short = starDef.info.short;
		var catInfo = starDef.info.catInfo;
		// - use alternate shortcodes when alt display is on
		if (starDef.alt !== null) {
			if (altDisp) {
				if (userScore.alt.state === "alt") {
					short = starDef.alt.info.short;
					catInfo = starDef.alt.info.catInfo;
				}
			} else short = starDef.alt.globShort;
		}
		// - calculate star name
		var starName = short;
		if (userScore.stageId >= 0 && userScore.stageId <= 14) {
			starName = PERM[userScore.stageId].toUpperCase() + " " + short;
		}
		// - calculate star color
		var starColor = "default";
		if (catInfo !== null) {
			starColor = getStarColor(catInfo);
			// if the color is "obsolete" use the other variant's color
			if (starColor === "rare" && starDef.alt !== null && !altDisp) {
				catInfo = starDef.alt.info.catInfo;
				starColor = getStarColor(catInfo);
			}
		}
		// build the star name + link
		var hrefStarPrefix = props.hrefEx ? hrefStar + "?" + props.hrefEx + "&" : hrefStar + "?";
		playNodes.push(<td className="time-cell link-cont" data-active={ true } data-complete={ (userScore.comp).toString() }
			data-sc={ starColor } key="star">{ starName }
			<Link className="link-span" href={ hrefStarPrefix + "star=" + PERM[userScore.stageId] + "_" + userScore.starId }></Link></td>);
		// build the column nodes
		if (userScore.comp) rx = rx + 1;
		props.colList.map((col, i) => {
			const [node, colSortObj] = userScore.comp ? col.mainFun(userScore, rx - 1, starData) : col.incFun(userScore, rx - 1, starData);
			if (i === sortId) sortObj = colSortObj;
			playNodes.push(node);
		});
		kx = kx + 1;
		_playTableNodes.push([<tr className="time-row" key={ kx }>{ playNodes }</tr>, sortObj]);
	}

	// sort players based on activated column
	_playTableNodes.sort(function (_a, _b) {
		const [a, b] = [_a[1], _b[1]];
		// we assume that they always have the same length
		for (let i = 0; i < a.length; i++) {
			if (a[i] === b[i]) continue;
			return a[i] - b[i];
		}
		return 0;
	})
	const playTableNodes = _playTableNodes.map((v) => v[0]);

	// build table header
	var headerNodes: React.ReactNode[] = [];
	props.colList.map((col, i) => {
		var colSpan = 1;
		if (col.colSpan) colSpan = col.colSpan
		if (col.widthRec) {
			headerNodes.push(<td className="time-cell" key={ col.key } onClick={ () => setSortId(i) }
				colSpan={ colSpan } width={ col.widthRec + "%" } data-active="true">{ col.name } { imgNodeFun(sortId === i) }</td>);
		} else {
			headerNodes.push(<td className="time-cell" key={ col.key }
				onClick={ () => setSortId(i) } colSpan={ colSpan } data-active="true">{ col.name } { imgNodeFun(sortId === i) }</td>);
		}
	});

	// table class (wide vs thin)
	var tableClass = "time-table small-table";
	if (props.wideFlag) tableClass = "time-table med-table";

	// - table back link
	const hrefMainEx = props.hrefEx ? (hrefMain + "?" + props.hrefEx) : hrefMain;
	
	return (
		<div>
		<div className="table-cont">
			<table className={ tableClass }><tbody>
				<tr className="time-row" key="header">
					<NameCell id={ playerId } key="player" pd={ pd } active={ true } onClick={ () => {} } href={ hrefMainEx }/>
					{ headerNodes }
				</tr>
				{ playTableNodes }
			</tbody></table>
		</div>
		</div>
	);
}

/*
export function DetailTable(props: DetailTableProps): React.ReactNode
{
	const [hrefMain, hrefStar] = props.hrefBase;
	const scoreFilter = props.scoreFilter;
	const splitFlag = scoreFilter.splitFlag;
	const altFlag = props.altFlag;
	const scoreData = props.scoreData;

	// check for appropriate user map
	if (scoreData === null) {
		return <div className="blurb-cont"><div className="para">Loading...</div></div>;
	}

	const [starMap, _userMap] = getUserDataScoreCache(scoreData, scoreFilter);
	const userMap = props.starFilter ? props.starFilter(_userMap) : _userMap;
	const userRankMap = getRankScoreCache(scoreData, scoreFilter);

	var userKey = keyIdent(props.id);
	var playStats = userMap.stats[userKey];
	if (playStats === undefined) {
		return <div className="blurb-cont"><div className="para">Player not found for this season</div></div>;
	}

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
		var starData = starMap[starKey];
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
		var hrefStarPrefix = props.hrefEx ? hrefStar + "?" + props.hrefEx + "&" : hrefStar + "?";
		playNodes.push(<td className="time-cell link-cont" data-active={ true } data-complete={ (userScore.comp).toString() }
			data-sc={ starColor } key="star">{ starName }
			<Link className="link-span" href={ hrefStarPrefix + "star=" + PERM[userScore.stageId] + "_" + userScore.starId }></Link></td>);
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
		if (props.showStd && userRankMap !== null) {
			var rankName = "Unranked";
			var userStarMap = userRankMap[userKey];
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

	const hrefMainEx = props.hrefEx ? (hrefMain + "?" + props.hrefEx) : hrefMain;
	return (
		<div>
		<div className="table-cont">
			<table className={ tableClass }><tbody>
				<tr className="time-row" key="header">
					<NameCell id={ playerId } pd={ pd } active={ true } onClick={ () => {} } href={ hrefMainEx }/>
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
*/
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
