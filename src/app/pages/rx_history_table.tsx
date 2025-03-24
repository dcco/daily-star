import React, { useState } from 'react'
import Link from 'next/link'

import { orgStarId, orgStarDef } from '../org_star_def'
import { G_DAILY, G_HISTORY, GlobNorm, dateAndOffset, dispDate, readCodeList } from '../api_season'
import { stageShort, makeStarSlug } from '../router_slug'
import { getStarColor } from '../stats/rx_player_board'

const PERM = ["bob", "wf", "jrb", "ccm", "bbh", "hmc", "lll", "ssl",
	"ddd", "sl", "wdw", "ttm", "thi", "ttc", "rr", "sec", "bow"];

type ShortData = {
	'special': false,
	'name': string,
	'color': string,
	'total': number,
	'stageId': number,
	'starId': string,
	'day': number,
	'weekly': boolean
};

type SpecialData = {
	'special': true,
	'skey': string,
	'day': number,
	'weekly': boolean
};

type ShortDataEx = ShortData | SpecialData;

export function HistoryTable(props: {}): React.ReactNode
{
	// TODO: replace with real error messages, maybe even dont show a history tab
	if (G_HISTORY.header.status !== 'active' || G_HISTORY.data.length === 0) {
		return <div className="blurb-cont"><div className="para">Loading...</div></div>;
	}

	// season message
	var seasonEnd = G_DAILY.status === "none" || (G_DAILY.starGlob !== undefined && G_DAILY.starGlob.day === null);
	var msgNode: React.ReactNode = null;
	if (seasonEnd) msgNode = <div className="msg-cont">Daily Star season has ended :)
		Check back in March / in the Discord for news on when it will resume. Thanks for playing the Daily Star!</div>;

	const [sortId, setSortId] = useState(0);
	// calculate star data
	var playList: ShortDataEx[] = G_HISTORY.header.starList.map((glob, ix) => {
		// short code
		if (glob.special !== null) return { 'special': true, 'skey': glob.special,
			'day': ix, 'weekly': glob.weekly };
		var starCodeList = readCodeList(glob.stageid, glob.staridlist);
		var [stageId0, starCode0] = starCodeList[0];
		var starDef0 = orgStarDef(stageId0, orgStarId(stageId0, starCode0));
		//var starIdList = glob.staridlist.split(",");
		//var starDef = orgStarDef(glob.stageid, orgStarId(glob.stageid, starIdList[0]));
		var short = starDef0.info.short;
		if (starDef0.alt !== null) short = starDef0.alt.globShort;
		// calculate star name
		var starName = short;
		var ss = stageShort(stageId0);
		if (ss !== null) starName = ss + " " + short;
		if (starCodeList.length > 1) starName = starName + "+";
		// calculate star color
		var starColor = "default";
		if (starDef0.info.catInfo !== null) starColor = getStarColor(starDef0.info.catInfo);
		// calculate player count
		var playerList: number[] = [];
		if (ix < G_HISTORY.data.length) {
			for (const timeList of G_HISTORY.data[ix].times) {
				for (const timeObj of timeList) {
					if (!playerList.includes(timeObj.p_id)) playerList.push(timeObj.p_id);
				}
			}
		}
		return { 'special': false, 'name': starName, 'color': starColor, 'total': playerList.length,
			'stageId': stageId0, 'starId': starCode0,
			'day': ix, 'weekly': glob.weekly };
	});

	playList.sort((a, b) => {
		if (sortId === 1) {
			if (a.special && b.special) return 0;
			else if (a.special) return -1;
			else if (b.special) return 1;
			return b.total - a.total;
		}
		else if (sortId === 3) {
			if (a.special && b.special) return 0;
			else if (a.special) return -1;
			else if (b.special) return 1;
			if (a.weekly === b.weekly) return a.day - b.day;
			if (a.weekly) return -1;
			return 1;
		}
		return a.day - b.day;
	});

	// construct the board
	var playTableNodes: React.ReactNode[] = playList.map((data) => {
		var startDate = dateAndOffset(G_HISTORY.header.season.startdate, data.day);
		if (data.special) {
			return (<tr className="time-row" key={ data.day }>
				<td className="time-cell">Skip</td>
				<td className="time-cell">Day { data.day + 1 }</td>
				<td className="time-cell">-</td>
				<td className="time-cell" key="date">{ dispDate(startDate) }</td>
				<td className="time-cell">-</td>
			</tr>);
		}
		// misc calcs
		var total = "-";
		if (data.total > 0) total = "" + data.total;
		var weekly = "No";
		if (data.weekly) weekly = "Yes";
		// build table row
		var playNodes: React.ReactNode[] = [];
		playNodes.push(<td className="time-cell link-cont" data-active={ true } data-complete={ true }
			data-sc={ data.color } key="star">{ data.name }
			<Link className="link-span" href={ "/home/history?star=" + makeStarSlug(data.stageId, data.starId) }></Link></td>);
		playNodes.push(<td className="time-cell" key="day">Day { data.day + 1 }</td>);
		playNodes.push(<td className="time-cell" key="count">{ total }</td>);
		playNodes.push(<td className="time-cell" key="date">{ dispDate(startDate) }</td>);
		playNodes.push(<td className="time-cell" key="weekly">{ weekly }</td>);
		return (<tr className="time-row" key={ data.day }>{ playNodes }</tr>);
	});

	var imgNodeFun = (active: boolean): React.ReactNode => (<div className="float-frame">
		<img src="/icons/sort-icon.png" data-active={ active.toString() } className="float-icon" alt=""></img></div>);
	return (
		<div className="super-cont">
		<div className="msg-cont">Take the <a className="msg-link" href={ "https://forms.gle/BHpptf6or9hoYXDW9" }>Daily Star Survey</a>!
			(Feedback will be used for scores next season)</div>
		{ msgNode }
		<div className="table-cont">
			<table className="time-table small-table"><tbody>
				<tr className="time-row" key="header">
					<td className="time-cell" width="25%">Star</td>
					<td className="time-cell" width="12%" data-active="true" onClick={ () => setSortId(0) }># { imgNodeFun(sortId === 0) }</td>
					<td className="time-cell" width="15%" data-active="true"
						onClick={ () => setSortId(1) }>Players { imgNodeFun(sortId === 1) }</td>
					<td className="time-cell" data-active="true">Start Date</td>
					<td className="time-cell" width="15%" data-active="true" onClick={ () => setSortId(3) }>Weekly { imgNodeFun(sortId === 3) }</td>
				</tr>
				{ playTableNodes }
			</tbody></table>
		</div>
		</div>
	);
}
				/* { playTableNodes } */