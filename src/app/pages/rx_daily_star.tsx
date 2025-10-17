import React, { useState } from 'react'

// delete later
import { G_SHEET } from '../api_xcam'

import { PlayData, LocalPD } from '../play_data'
import { G_DAILY, G_HISTORY, GlobNorm, mostRecentWeekly } from '../api_season'

import { RouterMain, navRM } from '../router_main'
import { MenuOpt } from '../board_simple/rx_menu_opt'
import { DailyBoard } from '../board_full/rx_daily_board'
import { HistoryBoard } from '../board_full/rx_history_board'
import { HistoryTable } from './rx_history_table'
import { PlayerBoard } from '../stats/rx_player_board'
import { S3NewsBoard } from '../news_pages/s3_news_board'
import { S3ComingSoon } from '../news_pages/s3_coming_soon'

import { XcamBoard } from '../board_full/rx_xcam_board'

type DailyStarProps = {
	"rm": RouterMain,
	"playData": PlayData,
	"updatePlayData": (ld: LocalPD) => void
	"reloadPlayData": (ld: LocalPD | null) => void
}

export function StatsAbout(props: {}): React.ReactNode
{
	const [about, setAbout] = useState(false);
	if (!about) return (<div className="blurb-cont" onClick={ () => setAbout(true) }><div className="para">
			<div className="h-em">[+] Notes on Season 3 Stats</div>
		</div></div>);

	return(<div className="blurb-cont" onClick={ () => setAbout(false) }>
		<div className="para">
			<div className="h-em">[-] Notes on Season 3 Stats</div>
			<div className="para-inner">
				Daily Star Stats for Season 3 are here! I don't feel like it's fair to call it a
				full-on score system because it hasn't been available the entire time that we've
				been playing. But it's here for interest.
			</div>
		</div>
		<div className="para">
			<p>Scores are currently calculated as they are for xcams - except they include open/extensions times. I plan to add more features Soon™.</p>
			<p>Ex: I know some people played more during specific timeframes, so I want to do breakdowns for specific timeframes.</p>
			<p>I also want to add bonus for people who got really good times in intermediate/beginner strats.</p>
			<p>Those and other stat calcs will show up here when I have time to implement them.</p>
			<p>Daily Star will go on a break for a few weeks once it finishes, but next season will feature a real scoring system.
				(I'll run a survey to get people's input on this at some point).</p>
			<p>Thanks for playing the Daily Star! - Twig</p>
		</div>
	</div>);
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
		else if (i === 4) navRM(props.rm, "home", "stats", "");
		else if (i === 5) navRM(props.rm, "home", "news", "");
		else if (i === 6) navRM(props.rm, "home", "beta_xcam", "");
		else if (i === 7) navRM(props.rm, "home", "beta_player", "");
	};

	// calculate whether season has ended
	var seasonEnd = G_DAILY.status === "none" ||
		(G_DAILY.starGlob !== undefined && G_DAILY.starGlob.day === null);

	// calculate whether the weekly exists
	var weeklyFlag = false;
	var weeklyOptNode: React.ReactNode[] = [];

	var weeklyGlob = mostRecentWeekly();
	if (weeklyGlob !== null && weeklyGlob.day !== G_DAILY.dayOffset) {
		weeklyFlag = true;
		weeklyOptNode.push(<MenuOpt id={ 2 } selId={ menuId }
			setSelId={ updateMenuId } key="week">Weekly</MenuOpt>);
	}

	// check if daily has been skipped
	var noDaily = G_DAILY.starGlob !== undefined &&
		(G_DAILY.starGlob.day === null || G_DAILY.starGlob.special !== null);

	// select board
	var board = null;
	if (!seasonEnd && (menuId === 0 || (menuId === 2 && (!weeklyFlag || noDaily)))) {
		// if there is no actual daily + weekly exists, use the weekly glob
		if (weeklyFlag && noDaily) {
			// safe by definition of weeklyFlag and noDaily flag
			var castGlob = weeklyGlob as GlobNorm;
			var message: string | undefined = undefined;
			if (castGlob.message !== null) message = castGlob.message;
			if (G_DAILY.starGlob !== undefined &&
				G_DAILY.starGlob.day !== null && G_DAILY.starGlob.message !== null) message = G_DAILY.starGlob.message;
			board = <DailyBoard playData={ playData } weekly={ castGlob } overrideMessage={ message }
				reloadPlayData={ () => reloadPlayData(null) } setPlayData={ updatePlayData }/>;
		} else {  
			board = <DailyBoard playData={ playData } weekly={ null }
				reloadPlayData={ () => reloadPlayData(null) } setPlayData={ updatePlayData }/>;
		}
	} else if (menuId === 1) {
		board = <HistoryBoard rm={ props.rm } playData={ playData }/>;
	} else if (!seasonEnd && menuId === 2 && (weeklyGlob === null || weeklyGlob.special === null)) {
		board = <DailyBoard playData={ playData } weekly={ weeklyGlob }
			reloadPlayData={ () => reloadPlayData(null) } setPlayData={ updatePlayData }/>;
	} else if (menuId === 3 || ((menuId === 0 || menuId === 2) && seasonEnd)) {
		board = <HistoryTable/>;
	} else if (menuId === 4) {
		board = <PlayerBoard hrefBase={ ["/home/stats", "/home/history"] } slug={ props.rm.core.slug }
			aboutNode={ <StatsAbout/> }	idType="remote" lowNum={ 30 } midNum={ 50 } pd={ playData }
			starMap={ G_HISTORY.starMap } userMap={ G_HISTORY.userMap } userRankStore={ null }/>;
	} else if (menuId === 5) {
		board = <S3ComingSoon/>;
	} else if (menuId === 6) {
		board = <XcamBoard rm={ props.rm } hrefBase={ ["home", "beta_xcam", "/home/beta_player"] } showStd={ true } beta={ true }/>;
	} else if (menuId === 7) {
		board = <PlayerBoard hrefBase={ ["/home/beta_player", "/home/beta_xcam"] } slug={ props.rm.core.slug }
			starMap={ G_SHEET.starMap } userMap={ G_SHEET.userMap }
			altStarMap={ G_SHEET.extStarMap } altMap={ G_SHEET.altMap } userRankStore={ G_SHEET.userRankStore }
			aboutNode={ "" } lowNum={ 30 } midNum={ 50 } showStd={ true } key={ props.rm.core.slug }/>;
	}

	var dailyOptNode: React.ReactNode = <MenuOpt id={ 0 } selId={ menuId } setSelId={ updateMenuId }>Daily</MenuOpt>;
	if (noDaily && weeklyFlag) {
		dailyOptNode = <MenuOpt id={ 0 } selId={ menuId } setSelId={ updateMenuId }>Weekly</MenuOpt>;
		weeklyOptNode = [];
	}
	if (seasonEnd) {
		dailyOptNode = null;
		weeklyOptNode = [];
	}
	
	return (<React.Fragment>
		<div className="menu-cont">
			{ dailyOptNode }
			{ weeklyOptNode }
			<MenuOpt id={ 5 } selId={ menuId } setSelId={ updateMenuId }>News</MenuOpt>	
			<MenuOpt id={ 3 } selId={ menuId } setSelId={ updateMenuId }>History</MenuOpt>
			<MenuOpt id={ 1 } selId={ menuId } setSelId={ updateMenuId }>Archive</MenuOpt>
			<MenuOpt id={ 4 } selId={ menuId } setSelId={ updateMenuId }>Stats</MenuOpt>
			<MenuOpt id={ 6 } selId={ menuId } setSelId={ updateMenuId }>Xcam Ranks (BETA)</MenuOpt>
			<MenuOpt id={ 7 } selId={ menuId } setSelId={ updateMenuId }>Players (BETA)</MenuOpt>
		</div>
		<div className="sep"><hr/></div>
		{ board }
	</React.Fragment>);
}
