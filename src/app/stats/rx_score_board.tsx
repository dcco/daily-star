import React, { useState } from 'react'

import { G_HISTORY, GlobObj, getMonthStars, getWeekStars, getLastDay,
	readCodeList, dateAndOffset, dispDate } from '../api_season'

import { PlayData } from '../play_data'
import { RouterMain } from '../router_main'
import { StxStarMap } from './stats_star_map'
import { UserStatMap, filterUserStatMap } from './stats_user_map'
import { PlayerBoard } from './rx_player_board'

type ScoreBoardProps = {
	rm: RouterMain,
	playData: PlayData
};

const SCORE_MODES = [
	"Season", "Monthly", "Weekly"
];

export function ScoreBoard(props: ScoreBoardProps): React.ReactNode
{
	const playData = props.playData;

	// select state
	const [selId, setSelId] = useState(0);

	const dayTotal = getLastDay();
	const weekTotal = Math.ceil(dayTotal / 7);
	const monthTotal = Math.ceil(dayTotal / 28);

	const [monthId, setMonthId] = useState(monthTotal - 1);
	const [weekId, setWeekId] = useState(weekTotal - 1);

	const decFun = function() {
		if (selId === 1 && monthId > 0) setMonthId(monthId - 1);
		else if (selId === 2 && weekId > 0) setWeekId(weekId - 1);
	};

	const incFun = function() {
		if (selId === 1 && monthId < monthTotal - 1) setMonthId(monthId + 1);
		else if (selId === 2 && weekId < weekTotal - 1) setWeekId(weekId + 1);
	};

	// score-type (all, monthly, weekly) select nodes
	var scoreBtnNodes: React.ReactNode[] = SCORE_MODES.map((mode, i) => {
		var flag = (selId === i) ? "true" : "false";
		return <div key={ mode } className="star-name link-cont" data-sel={ flag }
			onClick={ () => { setSelId(i) } }>{ mode }</div>;
	});

	var scoreSelNode = (<div className="star-select">
			{ scoreBtnNodes }
		</div>);

	// score filtering
	var starMap: StxStarMap = G_HISTORY.starMap;
	var userMap: UserStatMap | null = G_HISTORY.userMap;
	var lowNum = 30;
	var midNum = 50;

	if (selId !== 0 && userMap !== null) {
		var subStars: GlobObj[] = [];
		if (selId === 1) {
			subStars = getMonthStars(monthId);
			lowNum = 14;
			midNum = 20;
		} else if (selId === 2) {
			subStars = getWeekStars(weekId);
			lowNum = 3;
			midNum = 5;
		}
		var filterStarMap: StxStarMap = {};
		var codeList: [number, string][] = [];
		for (const globObj of subStars) {
			if (globObj.special === "skip") continue;
			var starList = readCodeList(globObj.stageid, globObj.staridlist);
			codeList = codeList.concat(starList);
			for (const [stageId, starId] of starList) {
				var starKey = stageId + "_" + starId;
				filterStarMap[starKey] = G_HISTORY.starMap[starKey];
				filterStarMap[starKey + "_main"] = G_HISTORY.starMap[starKey + "_main"];
				filterStarMap[starKey + "_alt"] = G_HISTORY.starMap[starKey + "_alt"];
			}
		}
		starMap = filterStarMap;
		userMap = filterUserStatMap(userMap, codeList);
	}

	// date notes
	var startText = G_HISTORY.header.season.startdate;
	var startNode: React.ReactNode = "";
	if (startText !== "") {
		// day calculation
		var startNum = 0;
		var endNum = dayTotal;
		if (selId === 1) {
			endNum = 28;
		} else if (selId === 2) {
			endNum = 7;
		}
		// day display
		var startDate = dispDate(dateAndOffset(startText, 0));
		var endDate = dispDate(dateAndOffset(startText, endNum));
		var dayText = startDate + " - " + endDate;
		var dayWidth = "105px";
		if (selId === 1) dayText = "Month " + (monthId + 1) + ": " + dayText;
		else if (selId === 2) dayText = "Week " + (weekId + 1) + ": " + dayText;
		if (selId !== 0) dayWidth = "160px";
		startNode = <div className="label-cont" style={{ width: dayWidth }} >{ dayText }</div>;
		// activity
		var activeL = (selId === 1 && monthId !== 0) || (selId === 2 && weekId !== 0);
		var activeR = (selId === 1 && monthId !== monthTotal - 1) || (selId === 2 && weekId !== weekTotal - 1);
		// day node
		if (selId === 0) {
			startNode = <div className="row-wrap row-margin no-space">{ startNode }</div>;
		} else {
			startNode = <div className="row-wrap row-margin no-space">
				<div className="label-cont small-label" data-active={ activeL.toString() } onClick={ decFun }>
					<img className="label-image" src="/icons/arrow-l.png" height="14px"></img></div>
				{ startNode }
				<div className="label-cont small-label" data-active={ activeR.toString() } onClick={ incFun }>
					<img className="label-image" src="/icons/arrow-r.png" height="14px"></img></div>
			</div>;
		}
	}

	// board selection

	var board = <PlayerBoard key={ selId } hrefBase={ ["/home/stats", "/home/history"] } slug={ props.rm.core.slug }
			aboutNode={ "" } idType="remote" lowNum={ lowNum } midNum={ midNum } pd={ playData }
			starMap={ starMap } userMap={ userMap } userRankStore={ null }/>;
	/*if (selId === 0 || G_HISTORY.userMap === null) {
		board = <PlayerBoard hrefBase={ ["/home/stats", "/home/history"] } slug={ props.rm.core.slug }
			aboutNode={ "" } idType="remote" lowNum={ 30 } midNum={ 50 } pd={ playData }
			starMap={ G_HISTORY.starMap } userMap={ G_HISTORY.userMap } userRankStore={ null }/>;
	} else if (selId === 1) {
		var monthStars = getMonthStars(0);
		var filterStarMap: StxStarMap = {};
		var codeList: [number, string][] = [];
		for (const globObj of monthStars) {
			if (globObj.special === "skip") continue;
			var starList = readCodeList(globObj.stageid, globObj.staridlist);
			codeList = codeList.concat(starList);
			for (const [stageId, starId] of starList) {
				var starKey = stageId + "_" + starId;
				filterStarMap[starKey] = G_HISTORY.starMap[starKey];
				filterStarMap[starKey + "_main"] = G_HISTORY.starMap[starKey + "_main"];
				filterStarMap[starKey + "_alt"] = G_HISTORY.starMap[starKey + "_alt"];
			}
		}
		var filterUserMap = filterUserStatMap(G_HISTORY.userMap, codeList);
		board = <PlayerBoard hrefBase={ ["/home/stats", "/home/history"] } slug={ props.rm.core.slug }
			aboutNode={ "" } idType="remote" lowNum={ 12 } midNum={ 20 } pd={ playData }
			starMap={ filterStarMap } userMap={ filterUserMap } userRankStore={ null }/>;
	}*/

	return <div>{ scoreSelNode } { startNode } { board }</div>;
}