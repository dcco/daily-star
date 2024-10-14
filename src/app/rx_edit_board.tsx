
import React, { useState, useEffect } from 'react'
import orgData from './json/org_data_x.json'

import { newExtFilterState, copyFilterState,
	orgStarDef, verOffsetStarDef } from './org_star_def'
//import { newFilterState, orgColList, filterVarColList } from "./org_star_def"
import { Ident } from './time_table'
import { LiveStarTable } from './rx_live_table'
import { VerToggle } from './rx_ver_toggle'
import { AuthArea } from './rx_auth_area'

	/*
		################
		EDIT LEADERBOARD
		################
		react element which displays.edits times for all
		stages/stars/strats. (admin purposes only)
	*/

export function EditBoard(): React.ReactNode {
	// star state
	const [stageId, setStageId] = useState(0);
	const [starIdCache, setStarIdCache] = useState(Array(orgData.length).fill(0));
	const starId = starIdCache[stageId];
	var starDef = orgStarDef(stageId, starId);

	// star functions
	const changeStage = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setStageId(parseInt(e.target.value));
	};

	const changeStar = (i: number) => {
		starIdCache[stageId] = i;
		setStarIdCache(starIdCache.map((x) => x));
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

	// user identity	
	const [userId, setUserId] = useState(null as Ident | null);
	const [relFlag, setRelFlag] = useState(0);

	const reload = () => {
		setRelFlag(1 - relFlag);
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

	// load time table from xcam data
	//var colList = colListStarDef(starDef, fs);
	//var timeTable = xcamTimeTable(colList, fs, verOffset);

/*
	// build tables (in case of multiple tables)
	var tableList = [];
	// -- main column list
	//var mainColList = orgVarColList(colList, null);
	tableList.push(<LiveStarTable key={ stageId + "_" + starId + "_0" }
		stageId={ stageId } starId={ starId } fs={ fs } variant={ null }> </LiveStarTable>
	);
	// -- variant table
	var colList = orgColList(stageId, starId, fs);
	var varColList = filterVarColList(colList, 1);
	if (varColList.length !== 0) {
		tableList.push(<LiveStarTable key={ stageId + "_" + starId + "_1" }
			stageId={ stageId } starId={ starId } fs={ fs } variant={ 1 }> </LiveStarTable>
		);
	}

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
		{ varCont }
		<LiveStarTable stageId={ stageId } starId={ starId } fs={ fs } userId={ userId } key={ stageId + "_" + starId }/>
		<div className="sep"><hr/></div>
		<AuthArea userId={ userId } setUserId={ setUserId } setNick={ reload }/>
		</div>
	);

}
