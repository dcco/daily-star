
import React, { useState, useEffect } from 'react'
import orgData from './json/org_data.json'
import xcamData from './json/xcam_dump.json'
import rowData from './json/row_data.json'

import { hasExt, addTimePool, orgColList, orgVarColList, buildTimeTable } from './timetable'
import { rawMS, formatFrames, addFrames, readVerOffset, applyVerOffset,
	stratRowVer, starVerData, orgRecordMap, applyRecordMap } from './vercalc'
import { StarTable } from './startable'
import { ExtToggle } from './exttoggle'
import { VerToggle } from './vertoggle'

function xcamTimeTable(stageId, starId, verState, verData, extFlag) {
	// for every xcam column
	//var focusVer = verData.focusVer;
	var colList = orgColList(stageId, starId, verState, extFlag);
	const timePool = {};
	for (let i = 0; i < colList.length; i++) {
		var stratDef = colList[i];
		// for every relevant row in the xcam sheet
		for (const xcamRef of stratDef.id_list) {
			var [xs, xcamId] = xcamRef;
			if (xcamData[xs][xcamId] === undefined) continue;
			var record = rowData[xs][xcamId].record;
			var timeList = xcamData[xs][xcamId].times;
			// check whether the xcam row is relevant to both versions 
			var rowVer = stratRowVer(stratDef, xcamRef);
			// iterate through every time listed for the xcam row
			for (const data of timeList) {
				// use offset when not default + the alt version is enabled
				var ms = applyVerOffset(verData, rowVer, data.ms, stratDef.name);
				if (record === undefined || data.ms >= rawMS(record)) {
					addTimePool(timePool, data.player, i, {
						"rawTime": data.ms,
						"time": ms,
						"ver": rowVer,
						"variant_list": stratDef.variant_map[xs + "_" + xcamId]
					});
				}
			}
		}
	}
	return buildTimeTable(timePool, colList.length);
	//timeTable.sort(function(a, b) { return a.bestTime - b.bestTime });
}

export function ViewBoard(props) {
	// star state
	const [stageId, setStageId] = useState(0);
	const [starIdCache, setStarIdCache] = useState(Array(orgData.length).fill(0));
	const starId = starIdCache[stageId];

	// star functions
	const changeStage = (e) => {
		setStageId(e.target.value);
	};

	const changeStar = (i) => {
		starIdCache[stageId] = i;
		setStarIdCache(starIdCache.map((x) => x));
	};

	// version state
	const [verState, setVerState] = useState([true, false]);
	var starDef = orgData[stageId].starList[starId];
	var verData = starVerData(starDef, verState);

	const toggleVer = (i) => {
		var newState = [verState[0], verState[1]];
		newState[i] = !newState[i];
		if (!newState[i] && !newState[1 - i]) newState[1 - i] = true;
		setVerState(newState); 
	}

	// extension state
	const [extState, setExtState] = useState(true);

	const toggleExt = () => {
		setExtState(!extState);
	}

	// stage select option nodes
	var stageOptNodes = orgData.map((stage, i) =>
		<option key={ stage.name } value={ i }>{ stage.name }</option>
	);

	// star select nodes
	var starList = orgData[stageId].starList;
	var starBtnNodes = starList.map((star, i) => {
		var flag = (starIdCache[stageId] === i) ? "true" : "false";
		return <div key={ star.name } className="star-name" sel={ flag }
			onClick={ () => { changeStar(i) } }>{ star.name }</div>;
	});

	// version toggle node (enable when relevant)
	var verToggle = <div></div>;
	if (starDef.def !== "na") {
		verToggle = <VerToggle state={ verState } verData={ verData }
			toggle={ toggleVer }/>;
	}

	// extension toggle node (enable when relevant)
	var extToggle = <div></div>;
	if (hasExt(starDef)) {
		extToggle = <ExtToggle state={ extState } toggle={ toggleExt }/>;
	}

	// variant information
	var varCont = <div></div>;
	if (starDef.variants && starDef.variants.length > 0) {
		var vstr = ["Variants: "];
		starDef.variants.map((vName, i) => {
			if (i !== 0) vstr.push(", ");
			vstr.push("[" + (i + 1) + "] - ")
			vstr.push(<i>{ vName }</i>); 
		})
		varCont = (<div className="variant-cont">
			<div className="variant-box">{ vstr }</div>
		</div>);
	}

	// load time table from xcam data
	var timeTable = xcamTimeTable(stageId, starId, verState, verData, extState);
;
	// create tables
	var tableList = [];
	var colList = orgColList(stageId, starId, verState, extState);
	
	// add sort record + relevant records
	var sortRM = orgRecordMap(stageId, starId, [true, true]);
	var relRM = orgRecordMap(stageId, starId, verState);
	applyRecordMap(colList, "sortRecord", sortRM);
	applyRecordMap(colList, "record", relRM);

	var mainColList = orgVarColList(colList, null);
	tableList.push(<StarTable colList={ mainColList } verData={ verData } timeTable={ timeTable }
		canWrite="false" key={ stageId + "_" + starId + "_0" }></StarTable>);

	var varColList = orgVarColList(colList, 1);
	if (varColList.length > 0) {
		tableList.push(<StarTable colList={ varColList } verData={ verData } timeTable={ timeTable }
			canWrite="false" key={ stageId + "_" + starId + "_1" }></StarTable>);
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

		/* { tableList } */
}