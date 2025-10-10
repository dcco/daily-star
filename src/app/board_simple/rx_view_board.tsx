
import { getStarKey } from '../standards/strat_ranks'
import { DEV } from '../rx_multi_board'

import React, { useState, useEffect } from 'react'

import { VerOffset, StratOffset, formatFrames } from '../time_dat'
import { ColList, filterVarColList } from '../org_strat_def'
import { StarDef, FilterState, newFilterState, copyFilterState, fullFilterState,
	verOffsetStarDef, stratOffsetStarDef, hasExtStarDef, colListStarDef } from '../org_star_def'
import { TimeTable } from '../time_table'
import { PlayData, LocalPD, newPlayData } from '../play_data'
import { ColConfig, newColConfig, primaryColConfig, mergeHeaderColConfig, splitVariantPosColConfig } from '../col_config'
import { xcamRecordMapBan, sortColList } from '../xcam_record_map'
import { MenuOpt, MenuOptX } from './rx_menu_opt'
import { PlayDB } from "../table_parts/rx_star_row"
import { StarTable } from '../table_parts/rx_star_table'
import { LiveStarTable } from '../table_parts/rx_live_table'
import { VerToggle } from './rx_ver_toggle'
import { ExtToggle } from './rx_ext_toggle'
import { VariantToggle } from './rx_variant_toggle'

export type TimeTableFun = ((colList: ColList, vs: VerOffset, ss: StratOffset) => TimeTable);

export type EditProps = {
	"playData": PlayData,
	"updatePlayData": (ld: LocalPD) => void,
	"reloadPlayData": () => void
}

type EditBoardType = {
	kind: "edit",
	edit: EditProps
}

type ViewBoardType = {
	kind: "view",
	ttFun: TimeTableFun
}

type BoardType = ViewBoardType | EditBoardType

type ViewBoardProps = BoardType & {
	stageId: number,
	starDef: StarDef,
	cornerNode: React.ReactNode,
	headerNode: React.ReactNode,
	showStd: boolean,
	mergeRaw?: boolean,
	playData?: PlayData,
	extAll?: boolean,
	playDB?: PlayDB,
}

function filterConfig(stageId: number, starDef: StarDef, fs: FilterState, colList: ColList): ColConfig
{
	// filter alt columns out
	var filterColList = colList;
	if (fs.altState[0] && !fs.altState[1]) filterColList = filterVarColList(colList, null);
	else if (fs.altState[1] && !fs.altState[0]) filterColList = filterVarColList(colList, 1);

	// build column config w/ appropriate open merges
	var cfg = newColConfig(filterColList);
	primaryColConfig(cfg, starDef, fs);

	// apply "rules" when applicable
	/*var starKey = PERM[stageId] + "_" + starDef.id;
	if (RS_DATA[starKey] && RS_DATA[starKey].ban) {
		var banList = RS_DATA[starKey].ban;
		if (banList === undefined) return cfg;
		for (let i = 0; i < banList.length; i++) {
			var banData = banList[i];
			splitVariantPosColConfig(cfg, banData[1], banData[0], banData[2]);
			mergeHeaderColConfig(cfg, banData[3], banData[2]);
		}
	}*/

	return cfg;
}

export function ViewBoard(props: ViewBoardProps): React.ReactNode
{
	var stageId = props.stageId;
	var starDef = props.starDef;

	var playData = newPlayData();
	if (props.playData !== undefined) playData = props.playData;

	// init alt state
	var initAlt: [boolean, boolean] = [true, true];
	// -- combFlag: whether strats can logically be combined
	var combFlag = true;
	if (starDef.alt !== null && starDef.alt.status !== "offset" &&
		starDef.alt.status !== "mergeOffset") combFlag = false;
	if (!combFlag) initAlt = [true, false];

	// init filter state
	var varTotal = 0;
	if (starDef.variants) varTotal = starDef.variants.length;
	var initFS = newFilterState(initAlt, false, varTotal);
	if (props.extAll !== undefined) {
		initFS.virtFlag = true;
		initFS.verState = [true, true];
		initFS.extFlag = true;
	}
	
	// filter state
	const [fs, setFS] = useState(initFS);
	var verOffset = verOffsetStarDef(starDef, fs);
	var sOffset = stratOffsetStarDef(starDef, fs);

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

	// alt state
	const toggleAlt = (a: [boolean, boolean]) => {
		var ns = copyFilterState(fs);
		ns.altState = a;
		setFS(ns);
	}

	// variant state
	const toggleVar = (i: number) => {
		var ns = copyFilterState(fs);
		ns.varFlagList[i] = !ns.varFlagList[i];
		setFS(ns);
	}

	// if star def changes, reset alt state + filter state
	useEffect(() => {
		var ns = copyFilterState(fs);
		ns.altState = initAlt;
		ns.varFlagList = initFS.varFlagList.map((b) => b);
		setFS(ns);
	}, [starDef]);

	// version toggle node (enable when relevant)
	var verToggle: React.ReactNode = <div></div>;
	if (!props.extAll && starDef.def !== "na") {
		verToggle = <VerToggle state={ fs.verState } verOffset={ verOffset } toggle={ toggleVer }/>;
	}

	// extension toggle node (enable when relevant)
	var extToggle: React.ReactNode = <div></div>;
	if (!props.extAll && hasExtStarDef(starDef)) {
		extToggle = <ExtToggle state={ fs.extFlag } toggle={ toggleExt }/>;
	}

	// strat offset display
	var stratNode: React.ReactNode = <div></div>;
	if (starDef.alt !== null && starDef.alt.offset !== undefined) {
		var optName = starDef.alt.info.option;
		var offVal = starDef.alt.offset;
		if (starDef.alt.status !== "mergeOffset" && offVal < 0) {
			optName = starDef.info.option;
			offVal = -offVal;
		}
		stratNode = (<div className="variant-title slight-margin">{ optName } Offset: { formatFrames(offVal) }</div>);
	}

	// alt toggle node (enable when relevant)
	const eqAlt = (a: [boolean, boolean], b: [boolean, boolean]): boolean => { return a[0] === b[0] && a[1] === b[1] }
	var altToggle: React.ReactNode = <div></div>;
	if (starDef.alt !== null)
	{
		var altNode: React.ReactNode = <div></div>;
		if (props.mergeRaw && combFlag) {
			altToggle = <div className="menu-cont">
				<MenuOptX eqFun={ eqAlt } id={ [true, true] }
					selId={ fs.altState } setSelId={ () => toggleAlt([true, true]) }>Combined</MenuOptX>
				<MenuOptX eqFun={ eqAlt } id={ [true, false] }
					selId={ fs.altState } setSelId={ () => toggleAlt([true, false]) }>Raw</MenuOptX>
			</div>;
		} else if (!props.mergeRaw) {
			if (combFlag) altNode = <MenuOptX eqFun={ eqAlt } id={ [true, true] }
					selId={ fs.altState } setSelId={ () => toggleAlt([true, true]) }>Combined</MenuOptX>;
			altToggle = (<div className="menu-cont bot-margin">
				{ altNode }
				<MenuOptX eqFun={ eqAlt } id={ [true, false] }
					selId={ fs.altState } setSelId={ () => toggleAlt([true, false]) }>{ starDef.info.option }</MenuOptX>
				<MenuOptX eqFun={ eqAlt } id={ [false, true] }
					selId={ fs.altState } setSelId={ () => toggleAlt([false, true]) }>{ starDef.alt.info.option }</MenuOptX>
			</div>);
		}
	}

	// variant information
	var varCont: React.ReactNode = <VariantToggle variants={ starDef.variants } extAll={ props.extAll }
		state={ fs.varFlagList } toggle={ toggleVar }></VariantToggle>;

	// load time table from xcam data
	var colList = colListStarDef(starDef, fs);

	// add sort record + relevant records
	var banList: string[][] = [];
	var starKey = getStarKey(stageId, starDef);
	/*if (DEV && RS_DATA[starKey]) {
		var rs = RS_DATA[starKey];
		if (rs.ban)	banList = rs.ban;
	}*/
	var sortRM = xcamRecordMapBan(colList, fullFilterState([true, true], varTotal), verOffset, sOffset, banList);
	var relRM = xcamRecordMapBan(colList, fs, verOffset, sOffset, banList);
	sortColList(colList, sortRM);

	// create tables
	var tableList: React.ReactNode[] = [];

	// -- edit mode
	var rankKey: string | undefined = undefined;
	if (props.showStd) rankKey = stageId + "_" + starDef.id;
	if (props.kind === "edit") {
		var edit = props.edit;
		// -- main table
		tableList.push(
			<LiveStarTable stageId={ stageId } starDef={ starDef } today={ ["def"] } fs={ fs }
				playData={ edit.playData } reloadPlayData={ edit.reloadPlayData } key={ stageId + "_" + starDef.name + "_0" }/>
		);
		// -- alt table
		if (props.mergeRaw && (!combFlag || !fs.altState[1])) {
			var altFS = copyFilterState(fs);
			altFS.altState = [false, true];
			tableList.push(
				<LiveStarTable stageId={ stageId } starDef={ starDef } today={ ["def"] } fs={ altFS }
					playData={ edit.playData } reloadPlayData={ edit.reloadPlayData } key={ stageId + "_" + starDef.name + "_1" }/>
			);
		}
	// -- view mode
	} else {
		var timeTable = props.ttFun(colList, verOffset, sOffset);
		var cfg = filterConfig(stageId, starDef, fs, colList);
		// -- main table
		tableList.push(<StarTable cfg={ cfg } playData={ playData } timeTable={ timeTable } verOffset={ verOffset }
			recordMap={ relRM } playDB={ props.playDB } rankKey={ rankKey } key={ stageId + "_" + starDef.name + "_0" }></StarTable>);
		// -- alt table
		if (props.mergeRaw && (!combFlag || !fs.altState[1])) {
			var altFS = copyFilterState(fs);
			altFS.altState = [false, true];
			var altCFG = filterConfig(stageId, starDef, altFS, colList);
			tableList.push(<StarTable cfg={ altCFG } playData={ playData } timeTable={ timeTable } verOffset={ verOffset }
				recordMap={ relRM } playDB={ props.playDB } rankKey={ rankKey } key={ stageId + "_" + starDef.name + "_1" }></StarTable>);
		}
	}

	return (<div>
		<div className="row-wrap">
			{ props.cornerNode }
			<div className="toggle-sidebar">
				{ extToggle }
				{ verToggle }
			</div>
		</div>
		{ props.headerNode }
		{ altToggle }
		<div className="row-wrap no-space variant-cont">{ stratNode } { varCont }</div>
		{ tableList }
	</div>);
}