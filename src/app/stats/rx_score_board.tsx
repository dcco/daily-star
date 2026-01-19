import React, { useState } from 'react'

import { GlobObj, readCodeList } from '../api_season'
import { G_HISTORY, getMonthStars, getWeekStars, getLastDay,
	dateAndOffset, dispDate, findSeason, noVerifSeason } from '../api_history'

import { PlayData } from '../play_data'
import { RouterMain, navRM } from '../router_main'
import { ScoreCache } from './score_cache'
import { UserStatMap, FilterCodeList } from './stats_user_map'
import { DSStatBoard } from './rx_ds_stat_board'
import { SeasonSelProps, SeasonSel } from '../board_full/rx_season_sel'

type ScoreBoardProps = SeasonSelProps & {
	rm: RouterMain,
	playData: PlayData
};

const SCORE_MODES = [
	"Season", "Monthly", "Weekly"
];

export function ScoreBoard(props: ScoreBoardProps): React.ReactNode
{
	// season selection
	var histObj = G_HISTORY.current;
	if (props.seasonId !== null) {
		var fObj = findSeason(props.seasonId);
		if (fObj !== null) histObj = fObj;
	}

	// obtain score data
	if (histObj.scoreData === null) {
		return <div className="blurb-cont"><div className="para">Loading...</div></div>;
	}
	const scoreData = histObj.scoreData;
	const playData = props.playData;

	// slug interpretation (ignores season, because season is parsed earlier already)
	const rawSlug = props.rm.core.slug;
	var idSlug: string | null = null;
	if (rawSlug !== undefined && rawSlug !== "") {
		const sll = rawSlug.split(";");
		if (sll[0] !== "null") idSlug = sll[0];
	}

	// reconstruction of slug (for links)
	var defClickSlug = "";
	if (props.seasonId !== null) {
		if (idSlug === null) defClickSlug = "null;" + props.seasonId;
		else defClickSlug = idSlug + ";" + props.seasonId;
	}
	else if (idSlug !== null) defClickSlug = idSlug;
	else defClickSlug = "";

	// timespan (all, monthly, weekly) menu
	const menuId = props.rm.core.subId;
	var selId = 0;
	var hrefMain = "/home/scores";
	if (menuId === 10) { selId = 1; hrefMain = "/home/scores/monthly"; }
	else if (menuId === 11) { selId = 2; hrefMain = "/home/scores/weekly"; }

	const updateMenuId = (i: number) => {
		if (i === 1) navRM(props.rm, "home", "scores/monthly", defClickSlug);
		else if (i === 2) navRM(props.rm, "home", "scores/weekly", defClickSlug);
		else navRM(props.rm, "home", "scores", defClickSlug);
	};

	// per-month / per-week state
	const dayTotal = getLastDay(props.seasonId) + 1;
	const weekTotal = Math.ceil(dayTotal / 7);
	const monthTotal = Math.ceil(dayTotal / 28);

	const [monthId, setMonthId] = useState(props.seasonId === null ? monthTotal - 1 : 0);
	const [weekId, setWeekId] = useState(props.seasonId === null ? weekTotal - 1 : 0);

	const decFun = function() {
		if (selId === 1 && monthId > 0) setMonthId(monthId - 1);
		else if (selId === 2 && weekId > 0) setWeekId(weekId - 1);
	};

	const incFun = function() {
		if (selId === 1 && monthId < monthTotal - 1) setMonthId(monthId + 1);
		else if (selId === 2 && weekId < weekTotal - 1) setWeekId(weekId + 1);
	};

	// store flag toggles out here
	const [rulesFlag, setRulesFlag] = useState(false);
	const [verifFlag, setVerifFlag] = useState(!noVerifSeason(props.seasonId));

	// timespan select nodes
	var scoreBtnNodes: React.ReactNode[] = SCORE_MODES.map((mode, i) => {
		var flag = (selId === i) ? "true" : "false";
		return <div key={ mode } className="star-name link-cont" data-sel={ flag }
			onClick={ () => { updateMenuId(i) } }>{ mode }</div>;
	});

	var scoreSelNode = (<div className="star-select">
			{ scoreBtnNodes }
		</div>);

	// timespan filter fun
	var filterList: FilterCodeList | undefined = undefined;
	if (selId !== 0) {
		// read stars from timespan
		var subStars: GlobObj[] = [];
		if (selId === 1) {
			subStars = getMonthStars(histObj, monthId);
		} else if (selId === 2) {
			subStars = getWeekStars(histObj, weekId);
		}
		// generate code list
		var codeList: [number, string][] = [];
		for (const globObj of subStars) {
			if (globObj.special === "skip") continue;
			var starList = readCodeList(globObj.stageid, globObj.staridlist);
			codeList = codeList.concat(starList);
		}
		filterList = codeList;
	}

	// date notes
	var startText = histObj.header.season.startdate;
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
	/*
		old nums used
		- season: 30, 50
		- monthly: 14, 20
		- weekly: 3, 5
	*/
	var defNum = 50;
	var num100 = 6;
	if (selId === 1) { defNum = 14; num100 = 2; }
	else if (selId === 2) { defNum = 5; num100 = 1; }

	var hrefEx: string | undefined = undefined;
	if (props.seasonId !== null) hrefEx = "season=" + props.seasonId;

	var board = <DSStatBoard key={ selId } hrefBase={ [hrefMain, "/home/history"] } hrefEx={ hrefEx } idSlug={ idSlug }
			aboutNode={ "" } num={ defNum } num100={ num100 } pd={ playData } starFilter={ filterList }
			scoreData={ scoreData } rulesFlag={ rulesFlag } verifFlag={ verifFlag }
			setRulesFlag={ setRulesFlag } setVerifFlag={ setVerifFlag }/>;

	return <div>
		<div className="row-wrap">
			{ scoreSelNode }
			<SeasonSel seasonId={ props.seasonId } setSeasonId={ props.setSeasonId }/>
		</div>
		{ startNode }
		{ board }
	</div>;
}