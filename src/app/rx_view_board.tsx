
import React, { useState, useEffect } from 'react'
import orgData from './json/org_data.json'

import { filterVarColList } from './org_strat_def'
import { newFilterState, copyFilterState, fullFilterState,
	orgStarDef, verOffsetStarDef, hasExtStarDef, colListStarDef } from './org_star_def'
import { newPlayData } from './play_data'
import { xcamTimeTable } from './xcam_time_table'
import { xcamRecordMap, sortColList } from './xcam_record_map'
import { openListColConfig } from './col_config'
//import { hasExt, addTimePool, buildTimeTable } from './timetable'
//import { rawMS, formatFrames, addFrames, readVerOffset, applyVerOffset,
//	stratRowVer, starVerData, orgRecordMap, applyRecordMap } from './vercalc'
import { StarTable } from './rx_star_table'
import { AuthArea } from './rx_auth_area'
import { ExtToggle } from './rx_ext_toggle'
import { VerToggle } from './rx_ver_toggle'

export function ViewBoard(props: {}): React.ReactNode {
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
	const [fs, setFS] = useState(newFilterState(false));
	var verOffset = verOffsetStarDef(starDef, fs);

	const toggleVer = (i: number) => {
		var ns = copyFilterState(fs);
		ns.verState[i] = !ns.verState[i];
		if (!ns.verState[i] && !ns.verState[1 - i]) ns.verState[1 - i] = true;
		setFS(ns);
	}

	// extension state
	const toggleExt = () => {
		var ns = copyFilterState(fs);
		ns.extFlag = !ns.extFlag;
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

	// version toggle node (enable when relevant)
	var verToggle: React.ReactNode = <div></div>;
	if (starDef.def !== "na") {
		verToggle = <VerToggle state={ fs.verState } verOffset={ verOffset } toggle={ toggleVer }/>;
	}

	// extension toggle node (enable when relevant)
	var extToggle: React.ReactNode = <div></div>;
	if (hasExtStarDef(starDef)) {
		extToggle = <ExtToggle state={ fs.extFlag } toggle={ toggleExt }/>;
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
	var colList = colListStarDef(starDef, fs);
	var timeTable = xcamTimeTable(colList, fs, verOffset);
	
	// add sort record + relevant records
	var sortRM = xcamRecordMap(colList, fullFilterState(), verOffset);
	var relRM = xcamRecordMap(colList, fs, verOffset);
	sortColList(colList, sortRM);

	// create tables
	var tableList: React.ReactNode[] = [];

	var mainColList = filterVarColList(colList, null);
	var mainCFG = openListColConfig(mainColList, starDef.open);
	tableList.push(<StarTable cfg={ mainCFG } playData={ newPlayData() } timeTable={ timeTable } verOffset={ verOffset }
		recordMap={ relRM } key={ stageId + "_" + starId + "_0" }></StarTable>);

	var varColList = filterVarColList(colList, 1);
	if (varColList.length > 0) {
		var varCFG = openListColConfig(varColList, starDef.open);
		tableList.push(<StarTable cfg={ varCFG } playData={ newPlayData() } timeTable={ timeTable } verOffset={ verOffset }
			recordMap={ relRM }	key={ stageId + "_" + starId + "_1" }></StarTable>);
	}	

	return (<div>
		<div className="row-wrap">
			<div className="stage-select">
				<select value={ stageId }
					onChange={ changeStage }>
					{ stageOptNodes }
				</select>
			</div>
			<div className="toggle-sidebar">
				{ extToggle }
				{ verToggle }
			</div>
		</div>
		<div className="star-select">
			{ starBtnNodes }
		</div>
		{ varCont }
		{ tableList }
	</div>);

	/* 
		{ formatMergeView(mainMV) }
		{ "   " + formatMergeView(varMV) } */
}