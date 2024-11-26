import React, { useState } from 'react'

import { orgStarId, orgStarDef } from './org_star_def'
import { G_HISTORY, dateAndOffset, dispDate } from './api_season'
import { getStarColor } from './rx_player_board'

const PERM = ["bob", "wf", "jrb", "ccm", "bbh", "hmc", "lll", "ssl",
	"ddd", "sl", "wdw", "ttm", "thi", "ttc", "rr", "sec", "bow"];

type ShortData = {
	'name': string,
	'color': string,
	'total': number,
	'day': number,
	'weekly': boolean
};

export function HistoryTable(props: {}): React.ReactNode
{
	const [sortId, setSortId] = useState(0);

	// calculate star data
	var playList: ShortData[] = [];
	if (G_HISTORY.header.status === "active" && G_HISTORY.data.length !== 0) {
		playList = G_HISTORY.header.starList.map((glob, ix) => {
			// short code
			var starIdList = glob.staridlist.split(",");
			var starDef = orgStarDef(glob.stageid, orgStarId(glob.stageid, starIdList[0]));
			var short = starDef.short[0];
			if (starDef.short.length > 2) short = starDef.short[2];
			// calculate star name
			var starName = short;
			if (glob.stageid >= 0 && glob.stageid <= 14) {
				starName = PERM[glob.stageid].toUpperCase() + " " + short;
			}
			// calculate star color
			var starColor = "default";
			if (starDef.catInfo !== undefined) starColor = getStarColor(starDef.catInfo[0]);
			// calculate player count
			var playerList: number[] = [];
			if (ix < G_HISTORY.data.length) {
				var timeList = G_HISTORY.data[ix].times[0];
				for (const timeObj of timeList) {
					if (!playerList.includes(timeObj.p_id)) playerList.push(timeObj.p_id);
				}
			}
			return { 'name': starName, 'color': starColor, 'total': playerList.length,
				'day': ix, 'weekly': glob.weekly };
		});
	}

	playList.sort((a, b) => {
		if (sortId === 1) return b.total - a.total;
		else if (sortId === 3) {
			if (a.weekly === b.weekly) return a.day - b.day;
			if (a.weekly) return -1;
			return 1;
		}
		return a.day - b.day;
	});

	// construct the board
	var playTableNodes: React.ReactNode[] = playList.map((data) => {
		// misc calcs
		var total = "-";
		if (data.total > 0) total = "" + data.total;
		var startDate = dateAndOffset(G_HISTORY.header.season.startdate, data.day);
		var weekly = "No";
		if (data.weekly) weekly = "Yes";
		// build table row
		var playNodes: React.ReactNode[] = [];
		playNodes.push(<td className="time-cell link-cont" data-active={ true } data-complete={ true }
			data-sc={ data.color } key="star">{ data.name }</td>);
		playNodes.push(<td className="time-cell" key="day">Day { data.day + 1 }</td>);
		playNodes.push(<td className="time-cell" key="count">{ total }</td>);
		playNodes.push(<td className="time-cell" key="date">{ dispDate(startDate) }</td>);
		playNodes.push(<td className="time-cell" key="weekly">{ weekly }</td>);
		return (<tr className="time-row" key={ data.day }>{ playNodes }</tr>);
	});

	var imgNodeFun = (active: boolean): React.ReactNode => (<div className="float-frame">
		<img src="/icons/sort-icon.png" data-active={ active.toString() } className="float-icon" alt=""></img></div>);
	return (
		<div>
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