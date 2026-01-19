import React from 'react'

import { lightColList } from '../col_config'
import { FilterState, colListStarDef, fullFilterState, copyFilterState,
	verOffsetStarDef, stratOffsetStarDef } from '../org_star_def'
import { xcamRecordMapBan, sortColList } from '../xcam_record_map'
import { LiveStarTableProps } from '../table_parts/rx_live_table'
import { LiveStarTable } from '../table_parts/rx_live_table'
import { VariantToggle } from '../board_simple/rx_variant_toggle'
import { StratRankTable } from '../board_simple/rx_sr_table'

export function DSSubBoard(props: LiveStarTableProps &
	{ combFlag: boolean, showVar: boolean }): React.ReactNode
{
	const stageId = props.stageId;
	const starDef = props.starDef;
	const fs = props.fs;

	// get the full column list
	var varTotal = 0;
	if (starDef.variants) varTotal = starDef.variants.length;
	var fullFS = fullFilterState([true, true], varTotal);
	var fullColList = colListStarDef(starDef, fullFS);

	// sort the full column list
	var verOffset = verOffsetStarDef(starDef, fullFS);
	var sOffset = stratOffsetStarDef(starDef, fullFS);
	var sortRM = xcamRecordMapBan(fullColList, fullFS, verOffset, sOffset, []);
	sortColList(fullColList, sortRM);

	// standards board
	var rankTableNode: React.ReactNode = <div></div>; 
	if (props.showStd) {
		var stratList: string[][] = [];
		var rColList = lightColList(fullColList, starDef, fs);
		stratList.push(rColList.map((colRef) => colRef[1].name));
		// secondary strat rank table when necessary
		if (props.combFlag) {
			var xFS = copyFilterState(fullFS);
			xFS.altState = [false, true];
			rColList = lightColList(fullColList, starDef, xFS);
			stratList.push(rColList.map((colRef) => colRef[1].name));
		}
		rankTableNode = <StratRankTable stageId={ stageId } starDef={ starDef } stratList={ stratList } showPts={ true }/>;
	}

		// variant display
	var varNode: React.ReactNode = <div></div>;
	if (props.showVar) {
		varNode = <VariantToggle variants={ starDef.variants } extAll={ true }
			state={ fs.varFlagList } toggle={ function () {} }></VariantToggle>;
	}

	return <React.Fragment>
		{ rankTableNode }
		<div className="row-wrap no-space variant-cont">{ varNode }</div>
		<LiveStarTable stageId={ stageId } starDef={ starDef } today={ props.today }
			showStd={ props.showStd } fs={ fs } api={ props.api } playData={ props.playData }
			reloadPlayData={ props.reloadPlayData } updatePlayCount={ props.updatePlayCount }
			playDB={ props.playDB } showRowId={ props.showRowId } extraColList={ props.extraColList }/>
	</React.Fragment>;
}
