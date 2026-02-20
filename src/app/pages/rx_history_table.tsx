import React, { useState } from 'react'
import Link from 'next/link'

import { G_DAILY, GlobNorm, readCodeList } from '../api_season'
import { G_HISTORY, dateAndOffset, dispDate, findSeason, noVerifSeason } from '../api_history'
import { stageShort, makeStarSlug } from '../router_slug'

import { Ident } from '../time_table'
import { PlayData } from '../play_data'
import { orgStarId, orgStarDef } from '../org_star_def'
import { specStarRef } from '../star_map'
import { NameCell } from '../table_parts/rx_star_cell'
import { getStarColor } from '../stats/rx_detail_table'
import { ScoreCache } from '../stats/score_cache'
import { UserScoreMetaMap, findWinnerDSScore } from '../stats/ds_scoring'
import { SeasonSelProps, SeasonSel } from '../board_full/rx_season_sel'

const PERM = ["bob", "wf", "jrb", "ccm", "bbh", "hmc", "lll", "ssl",
	"ddd", "sl", "wdw", "ttm", "thi", "ttc", "rr", "sec", "bow"];

type ShortData = {
	'name': string,
	'color': string,
	'stageId': number,
	'starId': string,
	'winnerList': Ident[]
};

type DayData = {
	'special': false,
	'day': number,
	'weekly': boolean,
	'total': number,
	'def': ShortData,
	'shortList': ShortData[]
};

type SpecialData = {
	'special': true,
	'skey': string,
	'day': number,
	'weekly': boolean
};

type ShortDataEx = DayData | SpecialData;

	/*
		react nodes for display history rows (w/ expansion)
	*/

function SepRow(props: { len: number }): React.ReactNode
{
	var sepNodes: React.ReactNode[] = [];
	for (let i = 0; i < props.len; i++) {
		sepNodes.push(<td className="sep-cell" key={ i }></td>);
	}
	return <tr className="sep-row">{ sepNodes }</tr>;
}

type HistoryRowProps = {
	rowId: number,
	expandId: [number, number] | null,
	toggleRow: (i: [number, number] | null) => void,
	startDate: Date,
	histPrefix: string,
	playData: PlayData
}

function HistoryDayRow(props: HistoryRowProps & {
	headData: DayData | null,
	data: ShortData,
	subRowId: number
}): React.ReactNode
{
	// simple calcs
	const headData = props.headData;
	const data = props.data;
	const href = props.histPrefix + "star=" + makeStarSlug(data.stageId, data.starId);
	const expand = props.expandId !== null &&
		(props.expandId[0] === props.rowId && props.expandId[1] === props.subRowId);
	// display quirks
	var headerName = data.name;
	if (headData !== null && headData.shortList.length > 1) headerName = headerName + "+";
	var ps = "None";
	if (props.rowId % 2 === 0) ps = "Off-White"
	// activity / toggle check
	const active = data.winnerList.length > 1;
	const activeStr = active.toString();
	const toggleFun = active ? (() => props.toggleRow([props.rowId, props.subRowId])) : (() => {});
	// build header row
	var playNodes: React.ReactNode[] = [];
	playNodes.push(<td className="time-cell link-cont" data-active={ true } data-complete={ true }
		data-sc={ data.color } key="star">{ headerName }
		<Link className="link-span" href={ href }></Link></td>);
	// - special data for the very first row
	if (headData !== null) {
		const total = headData.total > 0 ? "" + headData.total : "-";
		playNodes.push(<td className="time-cell" key="day" data-ps={ ps }
			data-active={ activeStr } onClick={ toggleFun }>Day { headData.day + 1 }</td>);
		playNodes.push(<td className="time-cell" key="count" data-ps={ ps }
			data-active={ activeStr } onClick={ toggleFun }>{ total }</td>);
		playNodes.push(<td className="time-cell" key="date" data-ps={ ps }
			data-active={ activeStr } onClick={ toggleFun }>{ dispDate(props.startDate) }</td>);
		playNodes.push(<td className="time-cell" key="weekly" data-ps={ ps }
			data-active={ activeStr } onClick={ toggleFun }>{ headData.weekly ? "Yes" : "No" }</td>);
	} else {
		// - otherwise, fill with empty nodes
		for (let k = 0; k < 4; k++) {
			playNodes.push(<td className="dark-cell" key={ "" + k }></td>);
		}
	}
	// construct the winner node
	const winnerList = data.winnerList;
	const mt = expand ? "" : "*";
	 if (winnerList.length > 1) {
		playNodes.push(<td className="name-cell" data-active="true" data-ps="Multiple" key="winner"
			onClick={ toggleFun }>{ "Multiple (" + winnerList.length + ")" + mt }</td>);
	} else if (winnerList.length === 1) {
		playNodes.push(<NameCell key="winner" id={ winnerList[0] }
			pd={ props.playData } active={ active } onClick={ toggleFun }/>);
	}
	else playNodes.push(<td className="time-cell" key="winner" data-ps={ ps }>-</td>);
	// - if no expansion
	if (!expand) {
		return (<tr className="time-row" data-row-active={ activeStr }>{ playNodes }</tr>);
	}
	// - if expanded, build remaining info rows
	var extraRowNodes: React.ReactNode[] = [];
	for (let i = 0; i < winnerList.length; i++) {
		var colNodes: React.ReactNode[] = [];
		for (let k = 0; k < 5; k++) {
			colNodes.push(<td className="dark-cell" key={ "" + k }></td>);
		}
		colNodes.push(<NameCell key="winner" id={ winnerList[i] }
			pd={ props.playData } active={ true } onClick={ toggleFun }/>);
		extraRowNodes.push(<tr className="time-row" key={ i }>{ colNodes }</tr>);
	}
	return <React.Fragment>
		<SepRow len={ 6 }/>
		<tr className="time-row" data-row-active="true">{ playNodes }</tr>
		{ extraRowNodes }
		<SepRow len={ 6 }/>
	</React.Fragment>;
}

function HistoryRow(props: HistoryRowProps & { data: DayData }): React.ReactNode
{
	/*
		build the initial header row. this will always be visible, and has special properties compared to the normal row
	*/
	// commons
	const data = props.data;
	const shortList = data.shortList;
	// build default day row
	const defRowNode = <HistoryDayRow headData={ data } data={ data.def } 
		rowId={ props.rowId } subRowId={ 0 } expandId={ props.expandId }
		toggleRow={ props.toggleRow } startDate={ props.startDate }
		histPrefix={ props.histPrefix } playData={ props.playData }/>;
	// build remaining day rows
	const extraDayNodes: React.ReactNode[] = [];
	for (let i = 1; i < shortList.length; i++) {
		const dayData = shortList[i];
		extraDayNodes.push(<HistoryDayRow headData={ null } data={ dayData } key={ i }
			rowId={ props.rowId } subRowId={ i } expandId={ props.expandId }
			toggleRow={ props.toggleRow } startDate={ props.startDate }
			histPrefix={ props.histPrefix } playData={ props.playData }/>);
	}
	return <React.Fragment>
		{ defRowNode }
		{ extraDayNodes }
	</React.Fragment>;
}

	/*
		react component for the full history table page
	*/

export function HistoryTable(props: SeasonSelProps & { playData: PlayData }): React.ReactNode
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

	// daily star scores
	var dsScore: UserScoreMetaMap | null = null;
	if (histObj.scoreData !== null) {
		const scoreData = histObj.scoreData;
		if (scoreData.dsScore !== null) {
			var dsKey = noVerifSeason(props.seasonId) ? "rules$" : "verif$rules$";
			if (scoreData.dsScore[dsKey]) dsScore = scoreData.dsScore[dsKey];
		}
	}

	// detail expansion state
	const [expandId, setExpandId] = useState<[number, number] | null>(null);
	
	const toggleRow = (rowId: [number, number] | null) => {
		if (rowId === null) return;
		if (expandId === null || expandId[0] !== rowId[0] || expandId[1] !== rowId[1]) setExpandId(rowId);
		else setExpandId(null);
	}

	// season message
	var seasonEnd = G_DAILY.status === "none" || (G_DAILY.starGlob !== undefined && G_DAILY.starGlob.day === null);
	var msgNode: React.ReactNode = null;
	//if (seasonEnd) msgNode = <div className="msg-cont">Daily Star season has ended :)
	//	Check back in March / in the Discord for news on when it will resume. Thanks for playing the Daily Star!</div>;

	const [sortId, setSortId] = useState(0);
	// calculate star data
	var playList: ShortDataEx[] = histObj.header.starList.map((glob, ix) => {
		// short code
		if (glob.special !== null) return { 'special': true, 'skey': glob.special,
			'day': ix, 'weekly': glob.weekly };
		const starCodeList = readCodeList(glob.stageid, glob.staridlist);
		const allPlayerList: number[] = [];
		const shortList: ShortData[] = [];
		starCodeList.map((starEntry) => {
			const [stageId, starCode] = starEntry;
			const starDef = orgStarDef(stageId, orgStarId(stageId, starCode));
			var short = starDef.info.short;
			if (starDef.alt !== null && starDef.alt.status !== "diff") short = starDef.alt.globShort;
			// calculate star name
			var starName = short;
			var ss = stageShort(stageId);
			if (ss !== null) starName = ss + " " + short;
			//if (starCodeList.length > 1) starName = starName + "+";
			// calculate star color
			var starColor = "default";
			if (starDef.info.catInfo !== null) starColor = getStarColor(starDef.info.catInfo);
			// calculate player count
			// const playerList: number[] = [];
			if (ix < histObj.data.length) {
				for (const timeList of histObj.data[ix].times) {
					for (const timeObj of timeList) {
						if (!allPlayerList.includes(timeObj.p_id)) allPlayerList.push(timeObj.p_id);
					}
				}
			}
			// calculate day's winner + finish the star
			var winnerList: Ident[] = [];
			var altWinList: Ident[] = [];
			if (dsScore !== null) {
				if (starDef.alt === null || starDef.alt.status !== "diff") {
					winnerList = findWinnerDSScore(dsScore, specStarRef(starDef, null));
				} else {
					winnerList = findWinnerDSScore(dsScore, specStarRef(starDef, "main"));
					altWinList = findWinnerDSScore(dsScore, specStarRef(starDef, "alt"));
				}
			}
			shortList.push({ 'name': starName, 'color': starColor,
				'stageId': stageId, 'starId': starCode, 'winnerList': winnerList });
			// diff case, we add it as well
			if (starDef.alt !== null && starDef.alt.status === "diff") {
				// - diff case, we must find both star names
				var altName = starDef.alt.info.short;
				if (ss !== null) altName = ss + " " + altName;
				const altColor = getStarColor(starDef.alt.info.catInfo);
				shortList.push({ 'name': altName, 'color': altColor,
					'stageId': stageId, 'starId': starCode, 'winnerList': altWinList });
			}
		});
		return { 'special': false, 'day': ix, 'weekly': glob.weekly,
			'total': allPlayerList.length, 'def': shortList[0], 'shortList': shortList };
	});

	playList.sort((a, b) => {
		// special days ignore
		if (a.special && b.special) return 0;
		else if (a.special) return 1;
		else if (b.special) return -1;
		// main sorting logic
		if (sortId === 1) {
			return b.total - a.total;
		} else if (sortId === 3) {
			if (a.weekly === b.weekly) return a.day - b.day;
			if (a.weekly) return -1;
			return 1;
		} else if (sortId === 4) {
			if (a.shortList.length !== b.shortList.length) return a.shortList.length - b.shortList.length;
			var a0 = a.def;
			var b0 = b.def;
			if (a0.winnerList.length !== b0.winnerList.length) return a0.winnerList.length - b0.winnerList.length;
			return a0.winnerList[0].name.localeCompare(b0.winnerList[0].name);
		}
		return a.day - b.day;
	});

	var histPrefix = "/home/history?";
	if (props.seasonId !== null) histPrefix = histPrefix + "season=" + props.seasonId + "&";

	// construct the board
	var playTableNodes: React.ReactNode[] = playList.map((data, rowId) => {
		var startDate = dateAndOffset(histObj.header.season.startdate, data.day);
		if (data.special) {
			const ps = rowId % 2 === 0 ? "Off-White" : "None";
			var dsEndNode = null;
			if (dsScore !== null) dsEndNode = <td className="time-cell" data-ps={ ps }>-</td>;
			return (<tr className="time-row" key={ data.day }>
				<td className="time-cell" data-ps={ ps }>Skip</td>
				<td className="time-cell" data-ps={ ps }>Day { data.day + 1 }</td>
				<td className="time-cell" data-ps={ ps }>-</td>
				<td className="time-cell" key="date" data-ps={ ps }>{ dispDate(startDate) }</td>
				<td className="time-cell" data-ps={ ps }>-</td>
				{ dsEndNode }
			</tr>);
		}
		return <HistoryRow data={ data } startDate={ startDate } rowId={ rowId } toggleRow={ toggleRow }
			expandId={ expandId } histPrefix={ histPrefix } playData={ props.playData } key={ data.day }/>;
	});

	var imgNodeFun = (active: boolean): React.ReactNode => (<div className="float-frame">
		<img src="/icons/sort-icon.png" data-active={ active.toString() } className="float-icon" alt=""></img></div>);

	// season selection node
	const seasonSelNode = <div className="row-wrap">
			<div></div>
			<SeasonSel seasonId={ props.seasonId } setSeasonId={ props.setSeasonId }/>
		</div>;

	// old layout: 25, 12, 15, _, 15
	var dsHeaderNode = null;
	var wTable = ["25%", "12%", "15%", "15%"];
	if (dsScore !== null) {
		dsHeaderNode = <td className="time-cell" width="18%"
			data-active="true" onClick={ () => setSortId(4) }>Winner { imgNodeFun(sortId === 4) }</td>;
		wTable = ["25%", "10%", "20%", "10%"];
	}
	return (
		<div className="super-cont">
		{ msgNode }
		{ seasonSelNode }
		<div className="table-cont">
			<table className="time-table small-table"><tbody>
				<tr className="time-row" key="header">
					<td className="time-cell" width={ wTable[0] }>Star</td>
					<td className="time-cell" width={ wTable[1] } data-active="true" onClick={ () => setSortId(0) }># { imgNodeFun(sortId === 0) }</td>
					<td className="time-cell" width={ wTable[2] } data-active="true"
						onClick={ () => setSortId(1) }>Players { imgNodeFun(sortId === 1) }</td>
					<td className="time-cell" data-active="true">Start Date</td>
					<td className="time-cell" width={ wTable[3] } data-active="true" onClick={ () => setSortId(3) }>Weekly { imgNodeFun(sortId === 3) }</td>
					{ dsHeaderNode }
				</tr>
				{ playTableNodes }
			</tbody></table>
		</div>
		</div>
	);
}
				/* { playTableNodes } */