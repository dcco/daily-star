
import React, { useState, useEffect } from 'react'
import orgData from './json/org_data.json'

import { TTLoadType } from './api_live'
import { GlobObj, dateRawEST, dateAndOffset, dispDate } from './api_season'
import { G_SHEET } from './api_xcam'

import { PlayData } from './play_data'
import { newExtFilterState, copyFilterState,
	orgStarId, orgStarDef, verOffsetStarDef } from './org_star_def'
import { PlayDB } from './rx_star_row'
import { MenuOpt } from './rx_menu_opt'
import { LiveStarTable } from './rx_live_table'
import { VerToggle } from './rx_ver_toggle'
import { Countdown } from './rx_countdown'

	/*
		######################
		DAILY STAR LEADERBOARD
		######################
		react element which displays/edits times for
		the current daily star.
	*/

type DSEditBoardProps = {
	"startDate": string,
	"day": number,
	"weekly": boolean,
	"stageId": number,
	"starIdList": string[],
	"playData": PlayData,
	"reloadPlayData": () => void
};

export function DSEditBoard(props: DSEditBoardProps): React.ReactNode {
	const playData = props.playData;
	const reloadPlayData = props.reloadPlayData;
	const stageId = props.stageId;
	const starCodeList = props.starIdList;

	const [playCount, setPlayCount] = useState(0);

	// star definitions from star ids
	var starIdList = starCodeList.map((starCode) => orgStarId(stageId, starCode));
	var starDefList = starIdList.map((starId) => orgStarDef(stageId, starId));
	const [defId, setDefId] = useState(0);
	var starId = starIdList[defId];
	var starDef = starDefList[defId];

	// filter state
	// unlike viewboard, extensions always on
	var initFS = newExtFilterState([true, true], true);
	initFS.verState = [true, true];
	const [fs, setFS] = useState(initFS);
	var verOffset = verOffsetStarDef(starDef, fs);

	// alt view state
	var combFlag = true;
	if (starDef.alt !== null && starDef.alt.status !== "offset" &&
		starDef.alt.status !== "mergeOffset") combFlag = false;
	var [showComb, setShowComb] = useState(true);

	// filter functions
	const toggleVer = (i: number) => {
		var ns = copyFilterState(fs);
		ns.verState[i] = !ns.verState[i];
		if (!ns.verState[i] && !ns.verState[1 - i]) ns.verState[1 - i] = true;
		setFS(ns);
	}

	const toggleAlt = (a: [boolean, boolean]) => {
		var ns = copyFilterState(fs);
		ns.altState = a;
		setFS(ns);
	}

	// version toggle node (enable when relevant)
	var verToggle = <div></div>;
	if (starDef.def !== "na") {
		verToggle = <VerToggle state={ fs.verState } verOffset={ verOffset } toggle={ toggleVer }/>;
	}

	// alt toggle node (enable when relevant)
	var combToggle: React.ReactNode = <div></div>;
	if (starDef.alt !== null && combFlag)
	{
		combToggle = <div className="menu-cont">
			<MenuOpt id={ true } selId={ showComb } setSelId={ () => setShowComb(true) }>Combined</MenuOpt>
			<MenuOpt id={ false } selId={ showComb } setSelId={ () => setShowComb(false) }>Raw</MenuOpt>
		</div>;
	}

	// variant information
	var varCont: React.ReactNode = <div></div>;
	if (starDef.variants && starDef.variants.length > 0) {
		var vstr: React.ReactNode[] = ["Variants: "];
		starDef.variants.map((vName, i) => {
			if (i !== 0) vstr.push(", ");
			vstr.push("[" + (i + 1) + "] - ")
			vstr.push(<i key={ i }>{ vName }</i>); 
		})
		varCont = (<div className="variant-cont">
			<div className="variant-box">{ vstr }</div>
		</div>);
	}

	// week data
	var loadType: TTLoadType = ["today"];
	var dateNode1: React.ReactNode = <div className='label-cont'>
		{ dispDate(dateAndOffset(props.startDate, props.day)) }</div>;
	var dateNode2: React.ReactNode = <Countdown endTime={ dateRawEST(props.startDate, props.day, 1) }/>;
	if (props.weekly) {
		var rawDate = dateAndOffset(props.startDate, props.day);
		loadType = ["week", rawDate.toISOString().split('T')[0]];
		var dt1 = dispDate(rawDate);
		var dt2 = dispDate(dateAndOffset(props.startDate, props.day + 6));
		dateNode1 = <div className="row-wrap ds-cont">
			<div className='label-cont'>{ dt1 + " - " + dt2 + " "}
				<em className="label-em">(Weekly 100 Coin)</em></div>
		</div>;
		var dateNode2: React.ReactNode = <Countdown endTime={ dateRawEST(props.startDate, props.day, 7) }/>;
	}

	// daily star player list (currently we are just using xcam data)
	var playNameList: string[] = [];
	if (G_SHEET.userMap !== null) {
		playNameList = Object.entries(G_SHEET.userMap.stats).map(([k, v]) => v.id.name);
	}
	var playDB: PlayDB = {
		"baseUrl": "/xcam/players",
		"nameList": playNameList
	};

	// create tables
	/*var tableList: React.ReactNode[] = [];
	tableList.push(
		<LiveStarTable stageId={ stageId } starId={ starId } today={ loadType } fs={ fs } setPlayCount={ setPlayCount }
			playData={ playData } reloadPlayData={ reloadPlayData } key={ stageId + "_" + starId }/>
	);*/

	// build tables (in case of multiple tables)
	var tableList: React.ReactNode[] = [];
	// -- main table
	var mainFS = fs;
	if (!combFlag || !showComb) {
		mainFS = copyFilterState(fs);
		mainFS.altState = [true, false];
	}
	tableList.push(
		<LiveStarTable stageId={ stageId } starId={ starId } today={ ["def"] } fs={ mainFS } setPlayCount={ setPlayCount }
			playData={ playData } reloadPlayData={ reloadPlayData } playDB={ playDB } key={ stageId + "_" + starId + "_0" }/>
	);
	// -- variant table
	if (!combFlag || !showComb) {
		var altFS = copyFilterState(fs);
		altFS.altState = [false, true];
		tableList.push(
			<LiveStarTable stageId={ stageId } starId={ starId } today={ ["def"] } fs={ altFS }
				playData={ playData } reloadPlayData={ reloadPlayData } playDB={ playDB } key={ stageId + "_" + starId + "_1" }/>
		);
	}

	/*if (starDef.secondFlag) {
		tableList.push(<LiveStarTable stageId={ stageId } starId={ starId } today={ loadType } fs={ fs } varFlag={ 1 }
			playData={ playData } reloadPlayData={ reloadPlayData } key={ stageId + "_" + starId + "_var" }/>);
	}*/

	return (
		<div className="ds-cont">
		<div className="row-wrap">
			<div>
				<div className="row-wrap no-space">
					<div className='label-cont'>Day { props.day + 1 }</div>
					<div className='label-cont'>{ orgData[stageId].name }</div>
					<div className='label-cont'>{ starDef.name }</div>
				</div>
				<div className="row-wrap no-space">{ dateNode1 } { dateNode2 } </div>
				<div className='label-cont alt-label'>Players: { playCount }</div>
			</div>
			<div className="toggle-sidebar">
				{ verToggle }
			</div>
		</div>	
		{ combToggle }
		{ varCont }
		{ tableList }
		</div>
	);
	/*
		<!-- <LiveStarTable stageId={ stageId } starId={ starId } today={ true } fs={ fs }
			playData={ playData } setPlayData={ setPlayData } key={ stageId + "_" + starId }/> -->
	*/
}
