
import React, { useState, useEffect, useRef } from 'react'
import orgData from '../json/org_data.json'

import { TTLoadType } from '../api_live'
import { GlobObj, dateRawEST, dateAndOffset, dispDate } from '../api_season'
import { G_SHEET } from '../api_xcam'

import { Ident, keyIdent } from '../time_table'
import { PlayData } from '../play_data'
import { newExtFilterState, copyFilterState,
	orgStarId, orgStarDef, verOffsetStarDef } from '../org_star_def'
import { PlayDB } from '../table_parts/rx_star_row'
import { LiveStarTable } from '../table_parts/rx_live_table'
import { MenuOpt } from '../board_simple/rx_menu_opt'
import { VerToggle } from '../board_simple/rx_ver_toggle'
import { VariantToggle } from '../board_simple/rx_variant_toggle'
import { Countdown } from './rx_countdown'

type CountMap = {
	[key: string]: Ident[]
};

function newCountMap(): CountMap {
	return {};
}

function updateCountMap(cm: CountMap, key: string, idList: Ident[]): CountMap {
	var nm: CountMap = {};
	for (const [k, v] of Object.entries(cm)) {
		nm[k] = v;
	}
	nm[key] = idList;
	return nm;
}

function totalCountMap(cm: CountMap): number {
	var nm: { [key: string]: number } = {};
	for (const [k, v] of Object.entries(cm)) {
		for (const id of v) {
			nm[keyIdent(id)] = 0;
		}
	}
	return Object.entries(nm).length;
}

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
	"starCodeList": [number, string][],
	//"stageId": number,
	//"starIdList": string[],
	"playData": PlayData,
	"reloadPlayData": () => void
};

	/*
		when a star has multiple variants
		- if they can be directly compared, they are split into Combined / Raw tabs
		- if they cannot be directly compared, only the Raw tab is displayed

		when a day has multiple stars (glob star)
		- all stars are displayed in sequence, on both Combined / Raw tabs
	*/

export function DSEditBoard(props: DSEditBoardProps): React.ReactNode {
	const playData = props.playData;
	const reloadPlayData = props.reloadPlayData;
	//const stageId = props.stageId;
	//const starCodeList = props.starIdList;
	const starCodeList = props.starCodeList;

	const playCountMap = useRef(newCountMap());
	const [playCount, setPlayCount] = useState(0);

	// star definitions from star ids
	var starIdList = starCodeList.map((starPx) => [starPx[0], orgStarId(starPx[0], starPx[1])]);
	var starDefList = starIdList.map((starPx) => orgStarDef(starPx[0], starPx[1]));
	
	// stores the first star for convenience when interacting with variant stars
	// WARNING: not designed to work with "glob star days" (days that have multiple unrelated stars on the same day)
	//var [stageId0, starId0] = starIdList[0];
	//var starDef0 = starDefList[0];

	// filter state
	// unlike viewboard, extensions always on
	// WARNING: versions always on (too much of a pain to change), may want to fix eventually but idk
	var initFS = newExtFilterState([true, true], true, 0);
	initFS.verState = [true, true];
	const [fs, setFS] = useState(initFS);
	
	var verOffsetList = starDefList.map((starDef) =>
		verOffsetStarDef(starDef, fs));

	// checks whether any stars have a combine-able alt
	var combFlagList = starDefList.map((starDef) => {
		return starDef.alt !== null && (starDef.alt.status == "offset" || starDef.alt.status == "mergeOffset");
	});
	var hasCombFlag = false;
	starDefList.map((starDef, i) => {
		if (combFlagList[i]) hasCombFlag = true;	
	})
	// alt view state
	var [showComb, setShowComb] = useState(true);

	// filter functions
	/*const toggleVer = (i: number) => {
		var ns = copyFilterState(fs);
		ns.verState[i] = !ns.verState[i];
		if (!ns.verState[i] && !ns.verState[1 - i]) ns.verState[1 - i] = true;
		setFS(ns);
	}*/

	const toggleAlt = (a: [boolean, boolean]) => {
		var ns = copyFilterState(fs);
		ns.altState = a;
		setFS(ns);
	}

	// version toggle node (enable when relevant)
	/*var verToggle = <div></div>;
	if (starDef0.def !== "na") {
		verToggle = <VerToggle state={ fs.verState } verOffset={ verOffsetList[0] } toggle={ toggleVer }/>;
	}*/

	// alt toggle node (enable when relevant)
	var combToggle: React.ReactNode = <div></div>;
	if (hasCombFlag)
	{
		combToggle = <div className="menu-cont">
			<MenuOpt id={ true } selId={ showComb } setSelId={ () => setShowComb(true) }>Combined</MenuOpt>
			<MenuOpt id={ false } selId={ showComb } setSelId={ () => setShowComb(false) }>Raw</MenuOpt>
		</div>;
	}

	// variant information
	var varContList = starDefList.map((starDef, i) => {
		/*var varContNode: React.ReactNode = <div></div>;
		if (starDef.variants && starDef.variants.length > 0) {
			var vstr: React.ReactNode[] = ["Variants: "];
			starDef.variants.map((vName, i) => {
				if (i !== 0) vstr.push(", ");
				vstr.push("[" + (i + 1) + "] - ")
				vstr.push(<i key={ i }>{ vName }</i>); 
			})
			varContNode = (<div className="variant-cont" key={ i }>
				<div className="variant-box">{ vstr }</div>
			</div>);
		}
		return varContNode;*/
		return <VariantToggle variants={ starDef.variants }
			state={ fs.varFlagList } toggle={ function() {} }></VariantToggle>;
	});

	/*var varTotal = 0;
	if (starDef.variants) varTotal = starDef.variants.length;*/

	// player count functionality
	const updatePlayCount = (key: string) => (idList: Ident[]) => {
		var nm = updateCountMap(playCountMap.current, key, idList);
		playCountMap.current = nm;
		setPlayCount(totalCountMap(nm));
	};

	const reloadPlayDataEx = () => {
		playCountMap.current = newCountMap();
		reloadPlayData();
	};

	// week data (changes the countdown for the weekly 100c)
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

	// build tables (in case of multiple tables)
	var tableList: React.ReactNode[] = [];
	// print each glob star sequentially
	starDefList.map((starDef, i) => {
		var [stageIdX, starIdX] = starIdList[i];
		// main table
		var mainFS = fs;
		if (!combFlagList[i] || !showComb) {
			mainFS = copyFilterState(fs);
			mainFS.altState = [true, false];
		}
		// -- separator if not the first node
		var sepNode: React.ReactNode = <div></div>;
		if (i !== 0) {
			sepNode = <React.Fragment><div className="sep"><hr/></div>
				<div className="row-wrap no-space">
					<div className='label-cont'>{ orgData[stageIdX].name }</div>
					<div className='label-cont'>{ starDefList[i].name }</div>
				</div></React.Fragment>;
		}
		tableList.push(<React.Fragment key={ stageIdX + "_" + starIdX + "_" + i }>
			{ sepNode } { varContList[i] }
			<LiveStarTable stageId={ stageIdX } starId={ starIdX } today={ ["def"] } fs={ mainFS }
				updatePlayCount={ updatePlayCount("" + i) } playData={ playData } reloadPlayData={ reloadPlayDataEx } playDB={ playDB }/>
		</React.Fragment>);
		// variant tables
		if (starDefList[i].alt !== null && (!combFlagList[i] || !showComb)) {
			var altFS = copyFilterState(fs);
			altFS.altState = [false, true];
			tableList.push(
				<LiveStarTable stageId={ stageIdX } starId={ starIdX } today={ ["def"] } fs={ altFS }
					updatePlayCount={ updatePlayCount("" + i) } playData={ playData } reloadPlayData={ reloadPlayDataEx }
					playDB={ playDB } key={ stageIdX + "_" + starIdX + "_" + i + "_alt" }/>
			);
		}
	});

	// build tables (in case of multiple tables)
	/*var tableList: React.ReactNode[] = [];
	// -- main table
	var mainFS = fs;
	if (hasCombFlag || !showComb) {
		mainFS = copyFilterState(fs);
		mainFS.altState = [true, false];
	}
	tableList.push(<React.Fragment>
		<LiveStarTable stageId={ stageId0 } starId={ starId0 } today={ ["def"] } fs={ mainFS } setPlayCount={ setPlayCount }
			playData={ playData } reloadPlayData={ reloadPlayData } playDB={ playDB } key={ stageId0 + "_" + starId0 + "_0" }/>
	</React.Fragment>);
	// -- variant table OR glob star tables
	// WARNING: currently these features are mutually exclusive
	if (hasCombFlag || !showComb) {
		var altFS = copyFilterState(fs);
		altFS.altState = [false, true];
		tableList.push(
			<LiveStarTable stageId={ stageId0 } starId={ starId0 } today={ ["def"] } fs={ altFS }
				playData={ playData } reloadPlayData={ reloadPlayData } playDB={ playDB } key={ stageId0 + "_" + starId0 + "_1" }/>
		);
	} else if (starIdList.length > 1) {
		for (let i = 1; i < starIdList.length; i++) {
			var [stageIdX, starIdX] = starIdList[i];
			tableList.push(<div>
				<div className="sep"><hr/></div>
				<div className="row-wrap no-space">
					<div className='label-cont'>{ orgData[stageIdX].name }</div>
					<div className='label-cont'>{ starDefList[i].name }</div>
				</div>
				<LiveStarTable stageId={ stageIdX } starId={ starIdX } today={ ["def"] } fs={ mainFS } setPlayCount={ setPlayCount }
					playData={ playData } reloadPlayData={ reloadPlayData } playDB={ playDB } key={ stageIdX + "_" + starIdX }/>
			</div>);
		}
	}*/

	var starName = starDefList[0].name;
	if (starIdList.length > 1) starName = starDefList[0].name + "+";

	return (
		<div className="ds-cont">
		<div className="row-wrap">
			<div>
				<div className="row-wrap no-space">
					<div className='label-cont'>Day { props.day + 1 }</div>
					<div className='label-cont'>{ orgData[starIdList[0][0]].name }</div>
					<div className='label-cont'>{ starName }</div>
				</div>
				<div className="row-wrap no-space">{ dateNode1 } { dateNode2 } </div>
				<div className='label-cont alt-label'>Players: { playCount }</div>
			</div>
		</div>	
		{ combToggle }
		{ tableList }
		</div>
	);
	/*

			<div className="toggle-sidebar">
				{ verToggle }
			</div>
		<!-- <LiveStarTable stageId={ stageId } starId={ starId } today={ true } fs={ fs }
			playData={ playData } setPlayData={ setPlayData } key={ stageId + "_" + starId }/> -->
	*/
}
