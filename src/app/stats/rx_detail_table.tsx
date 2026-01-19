import React, { useState } from 'react'
import Link from 'next/link'

import { Ident, keyIdent } from '../time_table'
import { PlayData, newPlayData } from '../play_data'
import { orgStarId, orgStarDef } from '../org_star_def'
import { starKeyExtern, lookupStarMap, unsafeLookupStarMap } from '../star_map'
import { NameCell } from '../table_parts/rx_star_cell'
import { lexicoSortFun } from '../table_parts/ex_column'
import { ScoreFilter, ScoreCache, getUserDataScoreCache, getDSScoreCacheSafe } from './score_cache'
import { StxStarMap, StxStarData } from './stats_star_map'
import { UserScore, IncScore, UserStatMap, FilterCodeList, fullScoreList, filterUserStatMap } from './stats_user_map'

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
	starFilter?: FilterCodeList,
	scoreFilter: ScoreFilter,
	altFlag: boolean,
	scoreData: ScoreCache | null,
	pd?: PlayData
}

export type DetailTableProps = DetailBaseProps & {
	defSortId: number,
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
	const [sortId, setSortId] = useState<number | null>(null);

	var imgNodeFun = (active: boolean): React.ReactNode => (<div className="float-frame">
		<img src="/icons/sort-icon.png" data-active={ active.toString() } className="float-icon" alt=""></img></div>);

	/*
		build table rows
		- obtain list of stars for user
	*/
	const [starMap, _userMap] = getUserDataScoreCache(scoreData, scoreFilter);
	const userMap = props.starFilter ? filterUserStatMap(_userMap, props.starFilter) : _userMap;
	const dsScore = getDSScoreCacheSafe(scoreData, scoreFilter);

	var userKey = keyIdent(props.id);
	var playStats = userMap.stats[userKey];
	if (playStats === undefined) {
		return <div className="blurb-cont"><div className="para">Player not found for this season</div></div>;
	}

	// - sort by score data (TODO: change to sort by full score)
	const dsStats = dsScore === null ? null : (dsScore[userKey] ? dsScore[userKey] : null);
	playStats.starList.sort(function (a, b) {
		var a_pts = a.scorePts;
		var b_pts = b.scorePts;
		if (dsStats !== null) {
			var _a = lookupStarMap(dsStats.starMap, a);
			if (_a !== null) a_pts = _a.totalPts;
			var _b = lookupStarMap(dsStats.starMap, b);
			if (_b !== null) b_pts = _b.totalPts;
			/*
			if (dsStats.starMap[a_key]) a_pts = dsStats.starMap[a_key].totalPts;
			if (dsStats.starMap[b_key]) b_pts = dsStats.starMap[b_key].totalPts;*/
		}
		if (b_pts === a_pts) return b.rank[1] - a.rank[1];
		return b_pts - a_pts;
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
		//var starKey = statKey(userScore);
		//var starDef = orgStarDef(userScore.stageId, orgStarId(userScore.stageId, userScore.starId));
		//console.log(userScore);
		var starDef = userScore.starDef;
		//var starData = starMap[starKey];
		const _starData = lookupStarMap(starMap, userScore, userScore.srcAlt);
		// -- if we need star data for a combination star (sample offset, record, etc), fall back to the main variant
		const starData = _starData !== null ? _starData : unsafeLookupStarMap(starMap, userScore, "main");
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
				//if (userScore.alt.state === "alt") {
				if (userScore.alt === "alt") {
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
			<Link className="link-span" href={ hrefStarPrefix + "star=" +
				starKeyExtern(userScore.stageId, userScore.starDef) }></Link></td>);
		// build the column nodes
		if (userScore.comp) rx = rx + 1;
		props.colList.map((col, i) => {
			const [node, colSortObj] = userScore.comp ? col.mainFun(userScore, rx - 1, starData) : col.incFun(userScore, rx - 1, starData);
			if ((sortId === null && i === props.defSortId) || i === sortId) sortObj = colSortObj;
			playNodes.push(node);
		});
		kx = kx + 1;
		_playTableNodes.push([<tr className="time-row" key={ kx }>{ playNodes }</tr>, sortObj]);
	}

	// sort players based on activated column
	_playTableNodes.sort(function (a, b) {
		return lexicoSortFun(a[1], b[1]);
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
