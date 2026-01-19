
import { DEV } from '../rx_multi_board'

import React, { useState, useEffect } from 'react'

import { VerOffset, StratOffset, formatFrames } from '../time_dat'
import { ColList, filterVarColList } from '../org_strat_def'
import { StarDef, FilterState, newFilterState, copyFilterState, fullFilterState,
	verOffsetStarDef, stratOffsetStarDef, hasExtStarDef, colListStarDef } from '../org_star_def'
import { AltType, starKeyExtern } from '../star_map'
import { TimeTable } from '../time_table'
import { PlayData, LocalPD, newPlayData } from '../play_data'
import { ColConfig, newColConfig, primaryColConfig, lightColList,
	mergeHeaderColConfig, splitVariantPosColConfig } from '../col_config'
import { xcamRecordMapBan, sortColList } from '../xcam_record_map'
import { MenuOpt, MenuOptX } from './rx_menu_opt'
import { ExColumn } from '../table_parts/ex_column'
import { PlayDB } from "../table_parts/rx_star_row"
import { StarTable } from '../table_parts/rx_star_table'
import { LiveStarIface, LiveStarTable } from '../table_parts/rx_live_table'
import { VerToggle } from './rx_ver_toggle'
import { ExtToggle } from './rx_ext_toggle'
import { VariantToggle } from './rx_variant_toggle'

import { StratRankTable } from '../board_simple/rx_sr_table'
//import { StratRankTableRaw } from '../board_simple/rx_sr_table_raw'

import { TTLoadType } from '../api_live'
import { G_SHEET } from "../api_xcam"

export type TimeTableFun = ((colList: ColList, vs: VerOffset, ss: StratOffset) => TimeTable);

export type EditProps = {
	"playData": PlayData,
	"updatePlayData": (ld: LocalPD) => void,
	"reloadPlayData": () => void
}

type EditBoardType = {
	kind: "edit",
	edit: EditProps,
	loadType: TTLoadType,
	api: LiveStarIface
}

	// loads are drawn from a cached ttFun (usually with caching)
	// and so do not need a "load type"
type ViewBoardType = {
	kind: "view",
	ttFun: TimeTableFun
}

type BoardType = ViewBoardType | EditBoardType

	/*
		-- data parameters
		stageId - stage to display
		starDef - star to display
		-- extra react elements
		cornerNode - top left corner (used for star name display, stage select dropdown, etc)
		headerNode - directly above table (used for star select, etc)
		? toggleNode - top right corner (used for toggles)
		-- rank / standard table
		showStd - whether to show rank table
		? showPts - show strat rank table pts
		-- alt star settings
		? mergeRaw - whether alt stars should be combined, or get their own page
		-- filter settings
		? extAll - disable version / extension toggles
		? rulesFlag - use rules filters
		-- extra columns
		? showRowId - show the # col
		? extraColFun - extra columns
		-- name cell settings
		? playData - ids to nicknames, names to colors, etc
		? playDB - player name external links
		-- misc settings
		? emptyWarn - whether to warn for empty tables
	*/

type ViewBoardProps = BoardType & {
	stageId: number,
	starDef: StarDef,
	cornerNode: React.ReactNode,
	headerNode: React.ReactNode,
	toggleNode?: React.ReactNode,
	showStd: boolean,
	mergeRaw?: boolean,
	emptyWarn?: boolean,
	extAll?: boolean,
	rulesFlag?: boolean,
	showRowId?: boolean,
	showPts?: boolean,
	extraColFun?: (alt: AltType) => ExColumn[],
	playData?: PlayData,
	playDB?: PlayDB
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
	/*
		typing a bunch of stuff here to stave off sublime text crash
	*/

	// init filter state
	var varTotal = 0;
	if (starDef.variants) varTotal = starDef.variants.length;
	var initFS = newFilterState(initAlt, false, varTotal);
	if (props.rulesFlag !== undefined) {
		initFS.virtFlag = true;
		initFS.verState = [true, true];
		initFS.extFlag = "ext";
		if (!props.rulesFlag) initFS.extFlag = "rules";
	} else if (props.extAll !== undefined) {
		initFS.virtFlag = true;
		initFS.verState = [true, true];
		initFS.extFlag = "ext";
	}
	
	// filter state
	const [fs, setFS] = useState(initFS);
	var verOffset = verOffsetStarDef(starDef, fs);
	var sOffset = stratOffsetStarDef(starDef, fs);

	useEffect(() => {
		setFS(initFS);
	}, [props.rulesFlag])

	const toggleVer = (i: number) => {
		var ns = copyFilterState(fs);
		ns.verState[i] = !ns.verState[i];
		if (!ns.verState[i] && !ns.verState[1 - i]) ns.verState[1 - i] = true;
		setFS(ns);
	}

	// extension state
	const toggleExt = () => {
		var ns = copyFilterState(fs);
		ns.extFlag = ns.extFlag === null ? "ext" : null;
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
		extToggle = <ExtToggle state={ fs.extFlag === "ext" } toggle={ toggleExt }/>;
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
	var fullFS = fullFilterState([true, true], varTotal);
	var fullColList = colListStarDef(starDef, fullFS);

	// add sort record + relevant records
	var banList: string[][] = [];
	var starKey = starKeyExtern(stageId, starDef);
	/*if (DEV && RS_DATA[starKey]) {
		var rs = RS_DATA[starKey];
		if (rs.ban)	banList = rs.ban;
	}*/
	var sortRM = xcamRecordMapBan(fullColList, fullFS, verOffset, sOffset, banList);
	var relRM = xcamRecordMapBan(colList, fs, verOffset, sOffset, banList);
	sortColList(colList, sortRM);
	sortColList(fullColList, sortRM);

	// create tables
	var tableList: React.ReactNode[] = [];

	// -- edit mode
	var rankKey: string | undefined = undefined;
	if (props.showStd) rankKey = stageId + "_" + starDef.id;
	if (props.kind === "edit") {
		var edit = props.edit;
		// -- main table
		tableList.push(
			<LiveStarTable stageId={ stageId } starDef={ starDef } today={ props.loadType } fs={ fs } showStd={ props.showStd } api={ props.api } 
				playData={ edit.playData } reloadPlayData={ edit.reloadPlayData } showRowId={ props.showRowId } key={ stageId + "_" + starDef.name + "_0" }/>
		);
		// -- alt table
		if (props.mergeRaw && (!combFlag || !fs.altState[1])) {
			var altFS = copyFilterState(fs);
			altFS.altState = [false, true];
			tableList.push(
				<LiveStarTable stageId={ stageId } starDef={ starDef } today={ props.loadType } fs={ altFS } showStd={ props.showStd } api={ props.api }
					playData={ edit.playData } reloadPlayData={ edit.reloadPlayData } showRowId={ props.showRowId } key={ stageId + "_" + starDef.name + "_1" }/>
			);
		}
	// -- view mode
	} else {
		var timeTable = props.ttFun(colList, verOffset, sOffset);
		var cfg = filterConfig(stageId, starDef, fs, colList);
		// scoring columns
		var exColList: ExColumn[] | undefined = undefined;
		if (props.extraColFun) {
			if (starDef.alt !== null && !fs.altState[1]) {
				//var exAlt: AltType = fs.altState[1] ? "alt" : "main";
				//exColList = props.extraColFun(exAlt);
				exColList = props.extraColFun("main");
			}
			else exColList = props.extraColFun(null);
		}

		// -- main table < can be either main / alt >
		tableList.push(<StarTable cfg={ cfg } playData={ playData } timeTable={ timeTable }
			verOffset={ verOffset } recordMap={ relRM } emptyWarn={ props.emptyWarn }
			playDB={ props.playDB } rankKey={ rankKey }
			showRowId={ props.showRowId } extraColList={ exColList } key={ stageId + "_" + starDef.name + "_0" }></StarTable>);
		// -- alt table < this version only shows up on combination >
		if (props.mergeRaw && (!combFlag || !fs.altState[1])) {
			var altFS = copyFilterState(fs);
			altFS.altState = [false, true];
			var altCFG = filterConfig(stageId, starDef, altFS, colList);

			var exAltList: ExColumn[] | undefined = undefined;
			if (props.extraColFun) exAltList = props.extraColFun("alt");

			tableList.push(<StarTable cfg={ altCFG } playData={ playData } timeTable={ timeTable }
				verOffset={ verOffset } recordMap={ relRM } emptyWarn={ props.emptyWarn }
				playDB={ props.playDB } rankKey={ rankKey }
				showRowId={ props.showRowId } extraColList={ exAltList } key={ stageId + "_" + starDef.name + "_1" }></StarTable>);
		}
	}

	// standards board
	var rankTableNode: React.ReactNode = <div></div>; 
	if (props.showStd) {
		// collect columns
		/*var xFS = copyFilterState(fullFS);
		xFS.altState = fs.altState;
		cfgStore.push(filterConfig(stageId, starDef, xFS, fullColList));*/
		/*if (props.mergeRaw && (!combFlag || !fs.altState[1])) {
		xFS.altState = [false, true];
			cfgStore.push(filterConfig(stageId, starDef, xFS, fullColList));
		}*/
		var stratList: string[][] = []; //cfgStore.map(pureStratListColConfig);
		var rColList = lightColList(fullColList, starDef, fs);
		stratList.push(rColList.map((colRef) => colRef[1].name));
		// secondary strat rank table when necessary
		if (props.mergeRaw && (!combFlag || !fs.altState[1])) {
			var xFS = copyFilterState(fullFS);
			xFS.altState = [false, true];
			rColList = lightColList(fullColList, starDef, xFS);
			stratList.push(rColList.map((colRef) => colRef[1].name));
		}
		rankTableNode = <StratRankTable stageId={ stageId } starDef={ starDef } stratList={ stratList } showPts={ props.showPts }/>;
		//rankTableNode  = <StratRankTableRaw stageId={ stageId } starDef={ starDef }/>;
	}

	var extraToggle: React.ReactNode = "";
	if (props.toggleNode) extraToggle = props.toggleNode;

	return (<div>
		<div className="row-wrap">
			{ props.cornerNode }
			<div className="toggle-sidebar">
				{ extraToggle }
				{ extToggle }
				{ verToggle }
			</div>
		</div>
		<div>{ props.headerNode } { rankTableNode }</div>
		{ altToggle }
		<div className="row-wrap no-space variant-cont">{ stratNode } { varCont }</div>
		{ tableList }
	</div>);
}