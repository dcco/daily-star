
import React, { useState, useEffect } from 'react'

import { VerOffset, StratOffset, formatFrames } from '../time_dat'
import { ColList, filterVarColList } from '../org_strat_def'
import { StarDef, FilterState, newFilterState, copyFilterState, fullFilterState,
	verOffsetStarDef, stratOffsetStarDef, hasExtStarDef, colListStarDef } from '../org_star_def'
import { TimeTable } from '../time_table'
import { PlayData, newPlayData } from '../play_data'
import { newColConfig, primaryColConfig } from '../col_config'
import { xcamRecordMap, sortColList } from '../xcam_record_map'
import { MenuOptX } from './rx_menu_opt'
import { PlayDB } from "../table_parts/rx_star_row"
import { StarTable } from '../table_parts/rx_star_table'
import { VerToggle } from './rx_ver_toggle'
import { ExtToggle } from './rx_ext_toggle'

export type TimeTableFun = ((colList: ColList, vs: VerOffset, ss: StratOffset) => TimeTable);

type ViewBoardProps = {
	stageId: number,
	starDef: StarDef,
	ttFun: TimeTableFun,
	cornerNode: React.ReactNode,
	headerNode: React.ReactNode,
	playData?: PlayData,
	extAll?: boolean,
	playDB?: PlayDB
}

export function ViewBoard(props: ViewBoardProps): React.ReactNode
{
	var stageId = props.stageId;
	var starDef = props.starDef;
	var ttFun = props.ttFun;

	var playData = newPlayData();
	if (props.playData !== undefined) playData = props.playData;

	// init alt state
	var initAlt: [boolean, boolean] = [true, true];
	var combFlag = true;
	if (starDef.alt !== null && starDef.alt.status !== "offset" &&
		starDef.alt.status !== "mergeOffset") combFlag = false;
	if (!combFlag) initAlt = [true, false];

	// init filter state
	var initFS = newFilterState(initAlt, false);
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

	// if star def changes, reset alt state
	useEffect(() => {
		toggleAlt(initAlt);
	}, [starDef]);

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

	// strat offset display
	var stratNode: React.ReactNode = <div></div>;
	if (starDef.alt !== null && starDef.alt.offset !== undefined) {
		var optName = starDef.alt.info.option;
		var offVal = starDef.alt.offset;
		if (starDef.alt.status !== "mergeOffset" && offVal < 0) {
			optName = starDef.info.option;
			offVal = -offVal;
		}
		stratNode = (<div className="variant-box slight-margin">{ optName } Offset: { formatFrames(offVal) }</div>);
	}

	// alt toggle node (enable when relevant)
	const eqAlt = (a: [boolean, boolean], b: [boolean, boolean]): boolean => { return a[0] === b[0] && a[1] === b[1] }
	var altToggle: React.ReactNode = <div></div>;
	if (starDef.alt !== null)
	{
		var altNode: React.ReactNode = <div></div>;
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

	// variant information
	var varCont: React.ReactNode = <div></div>;
	if (starDef.variants && starDef.variants.length > 0) {
		var vstr: React.ReactNode[] = ["Variants: "];
		starDef.variants.map((vName, i) => {
			if (i !== 0) vstr.push(", ");
			vstr.push("[" + (i + 1) + "] - ")
			vstr.push(<i key={ i }>{ vName }</i>); 
		})
		varCont = (<div className="variant-box">{ vstr }</div>);
	}

	// load time table from xcam data
	var colList = colListStarDef(starDef, fs);
	var timeTable = ttFun(colList, verOffset, sOffset);
	//var timeTable = xcamTimeTable(colList, fs, verOffset);

	// add sort record + relevant records
	var sortRM = xcamRecordMap(colList, fullFilterState([true, true]), verOffset, sOffset);
	var relRM = xcamRecordMap(colList, fs, verOffset, sOffset);
	sortColList(colList, sortRM);

	// create tables
	var tableList: React.ReactNode[] = [];

	// build filter
	var filterColList = colList;
	if (fs.altState[0] && !fs.altState[1]) filterColList = filterVarColList(colList, null);
	else if (fs.altState[1] && !fs.altState[0]) filterColList = filterVarColList(colList, 1);

	var cfg = newColConfig(filterColList);
	primaryColConfig(cfg, starDef, fs);
	// merge open colums w/ designated semi-open columns
	/*if (fs.altState[0]) mergeListColConfig(cfg, "Open", false, starDef.open);
	if (fs.altState[1]) mergeListColConfig(cfg, "Open#Alt", true, starDef.open);
	// merge alternative columns when required
	if (starDef.alt !== null && fs.altState[0] && fs.altState[1]) {
		if (starDef.alt.status === "mergeOffset") {
			if (starDef.alt.specMerge !== undefined) {
				mergeNamesColConfig(cfg, starDef.alt.specMerge);
			} else {
				mergeTagsColConfig(cfg, "(" + starDef.info.option + ")", "(" + starDef.alt.info.option + ")");
			}
		} else {
			mergeTagsColConfig(cfg, "XXXXXX", "YYYYYY");
		}
	}*/

	tableList.push(<StarTable cfg={ cfg } playData={ playData } timeTable={ timeTable } verOffset={ verOffset }
		recordMap={ relRM } playDB={ props.playDB } key={ stageId + "_" + starDef.name + "_0" }></StarTable>);

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