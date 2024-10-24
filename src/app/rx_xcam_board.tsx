
import React, { useState } from 'react'
import orgData from './json/org_data.json'

import { orgStarDef } from './org_star_def'
import { xcamTimeTable } from './xcam_time_table'
import { ViewBoard } from './rx_view_board'

export function XcamBoard(props: {}): React.ReactNode {
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

	// main nodes to pass into viewer
	var stageSelNode = (
		<div className="stage-select">
			<select value={ stageId }
				onChange={ changeStage }>
				{ stageOptNodes }
			</select>
		</div>);

	var starSelNode = (
		<div className="star-select">
			{ starBtnNodes }
		</div>);

	return <ViewBoard stageId={ stageId } starDef={ starDef }
		ttFun= { xcamTimeTable } cornerNode={ stageSelNode } headerNode={ starSelNode }/>;

	// load time table from xcam data
	/*var colList = colListStarDef(starDef, fs);
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
*/
	/* 
		{ formatMergeView(mainMV) }
		{ "   " + formatMergeView(varMV) } */
}