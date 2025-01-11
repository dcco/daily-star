
import React, { useState, useEffect } from 'react'
import orgData from './json/org_data.json'

import { StarDef, newExtFilterState, copyFilterState,
	orgStarDef, verOffsetStarDef } from './org_star_def'
//import { newFilterState, orgColList, filterVarColList } from "./org_star_def"
import { Ident } from './time_table'
import { PlayData, LocalPD, } from './play_data'
import { postNick } from './api_live'
import { MenuOpt } from './rx_menu_opt'
import { LiveStarTable } from './table_parts/rx_live_table'
import { VerToggle } from './rx_ver_toggle'
import { AuthArea } from './rx_auth_area'

	/*
		################
		EDIT LEADERBOARD
		################
		react element which displays.edits times for all
		stages/stars/strats. (admin purposes only)
	*/

type EditBoardProps = {
	"playData": PlayData,
	"updatePlayData": (ld: LocalPD) => void,
	"reloadPlayData": () => void
}

function getInitAlt(starDef: StarDef): [boolean, [boolean, boolean]]
{
	var initAlt: [boolean, boolean] = [true, true];
	var combFlag = true;
	if (starDef.alt !== null && starDef.alt.status !== "offset" &&
		starDef.alt.status !== "mergeOffset") combFlag = false;
	if (!combFlag) initAlt = [true, false];
	return [combFlag, initAlt];
}

export function EditBoard(props: EditBoardProps): React.ReactNode {
	const playData = props.playData;
	const updatePlayData = props.updatePlayData;
	const reloadPlayData = props.reloadPlayData;

	// star state
	const [stageId, setStageId] = useState(0);
	const [starIdCache, setStarIdCache] = useState(Array(orgData.length).fill(0));
	const starId = starIdCache[stageId];
	var starDef = orgStarDef(stageId, starId);

	// filter state
	var initFS = newExtFilterState([true, true], true);
	initFS.verState = [true, true];
	const [fs, setFS] = useState(initFS);
	var verOffset = verOffsetStarDef(starDef, fs);

	// alt view state
	var combFlag = true;
	if (starDef.alt !== null && starDef.alt.status !== "offset" &&
		starDef.alt.status !== "mergeOffset") combFlag = false;
	var [showComb, setShowComb] = useState(true);

	// star functions
	const changeStage = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setStageId(parseInt(e.target.value));
		setShowComb(true);
	};

	const changeStar = (i: number) => {
		starIdCache[stageId] = i;
		setStarIdCache(starIdCache.map((x) => x));
		setShowComb(true);
	};

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

	// unlike viewboard, extensions always on

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

	// build tables (in case of multiple tables)
	var tableList = [];
	// -- main table
	var mainFS = fs;
	if (!combFlag || !showComb) {
		mainFS = copyFilterState(fs);
		mainFS.altState = [true, false];
	}
	tableList.push(
		<LiveStarTable stageId={ stageId } starId={ starId } today={ ["def"] } fs={ mainFS }
			playData={ playData } reloadPlayData={ reloadPlayData } key={ stageId + "_" + starId + "_0" }/>
	);
	// -- variant table
	if (!combFlag || !showComb) {
		var altFS = copyFilterState(fs);
		altFS.altState = [false, true];
		tableList.push(
			<LiveStarTable stageId={ stageId } starId={ starId } today={ ["def"] } fs={ altFS }
				playData={ playData } reloadPlayData={ reloadPlayData } key={ stageId + "_" + starId + "_1" }/>
		);
	}
/*
	return (
		<div>
		<div className="stage-select">
			<select value={ stageId }
				onChange={ changeStage }>
				{ stageOptNodes }
			</select>
		</div>
		<div className="star-select">
			{ starBtnNodes }
		</div>
		{ tableList }
		</div>
	);*/

	return (
		<div>
		<div className="row-wrap">
			<div className="stage-select">
				<select value={ stageId }
					onChange={ changeStage }>
					{ stageOptNodes }
				</select>
			</div>
			<div className="toggle-sidebar">
				{ verToggle }
			</div>
		</div>
		<div className="star-select">
			{ starBtnNodes }
		</div>
		{ combToggle }
		{ varCont }
		{ tableList }
		<div className="sep"><hr/></div>
		<AuthArea playData={ playData } setPlayData={ updatePlayData }/>
		</div>
	);

}
