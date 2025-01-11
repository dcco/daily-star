import React, { useState } from 'react'

import { PlayData, LocalPD } from './play_data'
import { G_DAILY, mostRecentWeekly } from './api_season'

import { RouterMain, navRM } from './router_main'
import { MenuOpt } from './rx_menu_opt'
import { DailyBoard } from './rx_daily_board'
import { HistoryBoard } from './rx_history_board'
import { HistoryTable } from './rx_history_table'

type DailyStarProps = {
	"rm": RouterMain,
	"playData": PlayData,
	"updatePlayData": (ld: LocalPD) => void
	"reloadPlayData": (ld: LocalPD | null) => void
}

export function DailyStar(props: DailyStarProps): React.ReactNode
{
	const playData = props.playData;
	const updatePlayData = props.updatePlayData;
	const reloadPlayData = props.reloadPlayData;

	const menuId = props.rm.core.subId;

	// menu update
	const updateMenuId = (i: number) => {
		if (i === 0) navRM(props.rm, "home", "", "");
		else if (i === 1) navRM(props.rm, "home", "history", "def")
		else if (i === 2) navRM(props.rm, "home", "weekly", "");
		else if (i === 3) navRM(props.rm, "home", "history", "");
	};

	// calculate whether the weekly exists
	var weeklyFlag = false;
	var weeklyOptNode: React.ReactNode[] = [];

	var weeklyGlob = mostRecentWeekly();
	if (weeklyGlob !== null && weeklyGlob.day !== G_DAILY.dayOffset) {
		weeklyFlag = true;
		weeklyOptNode.push(<MenuOpt id={ 2 } selId={ menuId }
			setSelId={ updateMenuId } key="week">Weekly</MenuOpt>);
	}

	// select board
	var board = null;
	if (menuId === 0 || (menuId === 2 && !weeklyFlag)) {
		board = <DailyBoard playData={ playData } weekly={ null }
			reloadPlayData={ () => reloadPlayData(null) } setPlayData={ updatePlayData }/>;
	} else if (menuId === 1) {
		board = <HistoryBoard rm={ props.rm } playData={ playData }/>;
	} else if (menuId === 2) {
		board = <DailyBoard playData={ playData } weekly={ weeklyGlob }
			reloadPlayData={ () => reloadPlayData(null) } setPlayData={ updatePlayData }/>;
	} else if (menuId === 3) {
		board = <HistoryTable/>;
	}

	return (<React.Fragment>
		<div className="menu-cont">
			<MenuOpt id={ 0 } selId={ menuId } setSelId={ updateMenuId }>Daily</MenuOpt>
			{ weeklyOptNode }
			<MenuOpt id={ 3 } selId={ menuId } setSelId={ updateMenuId }>History</MenuOpt>
			<MenuOpt id={ 1 } selId={ menuId } setSelId={ updateMenuId }>Archive</MenuOpt>
		</div>
		<div className="sep"><hr/></div>
		{ board }
	</React.Fragment>);
}