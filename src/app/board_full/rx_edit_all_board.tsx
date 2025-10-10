import React, { useState, useEffect } from 'react'
import orgData from '../json/org_data.json'

import { StarDef, newExtFilterState, copyFilterState,
	orgStarDef, verOffsetStarDef } from '../org_star_def'
import { Ident } from '../time_table'
import { PlayData, LocalPD } from '../play_data'
import { postNick } from '../api_live'
import { LiveStarTable } from '../table_parts/rx_live_table'
import { MenuOpt } from '../board_simple/rx_menu_opt'
import { VerToggle } from '../board_simple/rx_ver_toggle'
import { VariantToggle } from '../board_simple/rx_variant_toggle'
import { AuthArea } from './rx_auth_area'
import { EditProps, ViewBoard } from "../board_simple/rx_view_board"

	/*
		################
		EDIT LEADERBOARD
		################
		react element which displays.edits times for all
		stages/stars/strats. (admin purposes only)
	*/


	// we have to prevent extension toggles
	// we have to change combined + <many tabs> TO combined + raw

export function EditBoard(props: EditProps): React.ReactNode {
	// star state
	const [stageId, setStageId] = useState(0);
	const [starIdCache, setStarIdCache] = useState(Array(orgData.length).fill(0));
	const starId = starIdCache[stageId];
	var starDef = orgStarDef(stageId, starId);

	// filter state
	/*var varTotal = 0;
	if (starDef.variants) varTotal = starDef.variants.length;
	var initFS = newExtFilterState([true, true], true, varTotal);
	initFS.verState = [true, true];
	const [fs, setFS] = useState(initFS);
	var verOffset = verOffsetStarDef(starDef, fs);*/

	// alt view state
	/*var combFlag = true;
	if (starDef.alt !== null && starDef.alt.status !== "offset" &&
		starDef.alt.status !== "mergeOffset") combFlag = false;
	var [showComb, setShowComb] = useState(true);*/

	// star functions
	const changeStage = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setStageId(parseInt(e.target.value));
		//setShowComb(true);
	};

	const changeStar = (i: number) => {
		starIdCache[stageId] = i;
		setStarIdCache(starIdCache.map((x) => x));
		//setShowComb(true);
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

	// -- main table
	/*var mainFS = fs;
	if (!combFlag || !showComb) {
		mainFS = copyFilterState(fs);
		mainFS.altState = [true, false];
	}*/

	var stageSelNode: React.ReactNode = 
		<div className="stage-select">
			<select value={ stageId }
				onChange={ changeStage }>
				{ stageOptNodes }
			</select>
		</div>;

	var starSelNode: React.ReactNode =
		<div className="star-select">
			{ starBtnNodes }
		</div>;

	return (
		<div>
		<ViewBoard kind="edit" extAll={ true } edit={ props } stageId={ stageId } starDef={ starDef }
			cornerNode={ stageSelNode } headerNode={ starSelNode } showStd={ false } mergeRaw={ true }></ViewBoard>
		<div className="sep"><hr/></div>
		<AuthArea playData={ props.playData } setPlayData={ props.updatePlayData }/>
		</div>
	);

}
