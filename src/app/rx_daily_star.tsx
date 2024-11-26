import React, { useState } from 'react'

import { PlayData, LocalPD } from './play_data'
import { G_DAILY, mostRecentWeekly } from './api_season'

import { MenuOpt } from './rx_menu_opt'
import { DailyBoard } from './rx_daily_board'
import { HistoryBoard } from './rx_history_board'
import { HistoryTable } from './rx_history_table'

type DailyStarProps = {
	"playData": PlayData,
	"updatePlayData": (ld: LocalPD) => void
	"reloadPlayData": (ld: LocalPD | null) => void
}

export function DailyStar(props: DailyStarProps): React.ReactNode
{
	const playData = props.playData;
	const updatePlayData = props.updatePlayData;
	const reloadPlayData = props.reloadPlayData;

	const [menuId, setMenuId] = useState(0);

	// calculate whether the weekly exists
	var weeklyOptNode: React.ReactNode[] = [];

	var weeklyGlob = mostRecentWeekly();
	if (weeklyGlob !== null && weeklyGlob.day !== G_DAILY.dayOffset) {
		weeklyOptNode.push(<MenuOpt id={ 2 } selId={ menuId }
			setSelId={ setMenuId } key="week">Weekly</MenuOpt>);
	}

	// select board
	var board = null;
	if (menuId === 0) {
		board = <DailyBoard playData={ playData } weekly={ null }
			reloadPlayData={ () => reloadPlayData(null) } setPlayData={ updatePlayData }/>;
	} else if (menuId === 1) {
		board = <HistoryBoard playData={ playData }/>;
	} else if (menuId === 2) {
		board = <DailyBoard playData={ playData } weekly={ weeklyGlob }
			reloadPlayData={ () => reloadPlayData(null) } setPlayData={ updatePlayData }/>;
	} else if (menuId === 3) {
		board = <HistoryTable/>;
	}

	return (<React.Fragment>
		<div className="menu-cont">
			<MenuOpt id={ 0 } selId={ menuId } setSelId={ setMenuId }>Daily</MenuOpt>
			{ weeklyOptNode }
			<MenuOpt id={ 3 } selId={ menuId } setSelId={ setMenuId }>History</MenuOpt>
			<MenuOpt id={ 1 } selId={ menuId } setSelId={ setMenuId }>Archive</MenuOpt>
		</div>
		<div className="sep"><hr/></div>
		{ board }
	</React.Fragment>);
}