
import React, { useState, useEffect } from 'react'
import orgData from './json/org_data.json'

import { PlayData } from './play_data'
import { newExtFilterState, copyFilterState,
	orgStarId, orgStarDef, verOffsetStarDef } from './org_star_def'
import { TTLoadType } from './api_live'
import { GlobObj, dateRawEST, dateAndOffset, dispDate } from './api_season'
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
	const [fs, setFS] = useState(newExtFilterState(true));
	var verOffset = verOffsetStarDef(starDef, fs);

	const toggleVer = (i: number) => {
		var ns = copyFilterState(fs);
		ns.verState[i] = !ns.verState[i];
		if (!ns.verState[i] && !ns.verState[1 - i]) ns.verState[1 - i] = true;
		setFS(ns);
	}

	// version toggle node (enable when relevant)
	var verToggle = <div></div>;
	if (starDef.def !== "na") {
		verToggle = <VerToggle state={ fs.verState } verOffset={ verOffset } toggle={ toggleVer }/>;
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

	// star state
	/*const [stageId, setStageId] = useState(-1);
	const [starId, setStarId] = useState("0");
	var starDef: StarDef | null = null;
	if (stageId !== -1) orgStarDef(stageId, starId);

	// star functions
	const initStage = (stage: number, star: string) => {
		setStageId(stage);
		setStarId(star);
	};

	// filter state
	const [fs, setFS] = useState(newExtFilterState(true));
	var verOffset = verOffsetStarDef(starDef, fs);

	const toggleVer = (i: number) => {
		var ns = copyFilterState(fs);
		ns.verState[i] = !ns.verState[i];
		if (!ns.verState[i] && !ns.verState[1 - i]) ns.verState[1 - i] = true;
		setFS(ns);
	}


	// stage select option nodes
	var stageOptNodes = orgData.map((stage, i) =>
		<option key={ stage.name } value={ i }>{ stage.name }</option>
	);

	// star select nodes
	var starList = orgData[stageId].starList;
	var starBtnNodes = starList.map((star, i) => {
		var flag = (starIdCache[stageId] === i) ? "true" : "false";
		return <div key={ star.name } className="star-name" data-sel={ flag }
			onClick={ () => { changeStar(i) } }>{ star.name }</div>;
	});

	// main display content toggle
	var mainNode: React.ReactNode = <div>Loading the Daily Star...</div>;
	if (stageId !== -1) {
		mainNode = (<React.Fragment>
		<div className="row-wrap">
			<div> </div>
				<div className="toggle-sidebar">
				{ verToggle }
				</div>
			</div>
			{ varCont }
			<LiveStarTable stageId={ stageId } starId={ starId } fs={ fs }
				playData={ playData } setPlayData={ setPlayData } key={ stageId + "_" + starId }/>
		</React.Fragment>;
	}

	return (
		<div>
		{ mainNode }
		<div className="sep"><hr/></div>
		<AuthArea playData={ playData } setPlayData={ setPlayData }/>
		</div>
	);*/

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
	/*if (weekly) {
		dateNode = <div className='label-cont'>Weekly 100 Coin</div>; 
	}*/

	// create tables
	var tableList: React.ReactNode[] = [];
	tableList.push(
		<LiveStarTable stageId={ stageId } starId={ starId } today={ loadType } fs={ fs } varFlag={ null } setPlayCount={ setPlayCount }
			playData={ playData } reloadPlayData={ reloadPlayData } key={ stageId + "_" + starId }/>
	);

	if (starDef.secondFlag) {
		tableList.push(<LiveStarTable stageId={ stageId } starId={ starId } today={ loadType } fs={ fs } varFlag={ 1 }
			playData={ playData } reloadPlayData={ reloadPlayData } key={ stageId + "_" + starId + "_var" }/>);
	}

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
		{ varCont }
		{ tableList }
		</div>
	);
	/*
		<!-- <LiveStarTable stageId={ stageId } starId={ starId } today={ true } fs={ fs }
			playData={ playData } setPlayData={ setPlayData } key={ stageId + "_" + starId }/> -->
	*/
}
