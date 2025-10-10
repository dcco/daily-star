
//import playData from './json/player_data.json'
import Link from 'next/link'
import React from 'react'

import { G_SHEET } from '../api_xcam'
import { RANK_NAME_LIST } from '../standards/rank_const'

import { Ver } from '../variant_def'
import { TimeDat, VerOffset, formatTime } from '../time_dat'
import { Ident } from '../time_table'
import { PlayData, strIdNickPD } from '../play_data'

	/* time display auxiliary functions */

/*function verAdjustTime(ver: Ver, rawTime: number, time: number): string {
	var verName = "JP";
	if (ver === "us") verName = "US";
	if (rawTime === time) return "(" + verName + ")";
	return "(" + formatTime(rawTime) + " " + verName + ")";
}*/

function preAdjustTime(timeDat: TimeDat, hideStratOffset: boolean): string {
	var adjText = "";
	var empty = true;
	for (const adj of timeDat.adjustList) {
		if (!empty) adjText = adjText + ", ";
		if (adj === "ver") {
			if (timeDat.rowDef.ver === "jp") adjText = adjText + "JP";
			else adjText = adjText + "US";
		} else adjText = adjText + adj; //"Raw";
		empty = false;
	}
	if (!hideStratOffset && timeDat.rawTime === timeDat.time) return "(" + adjText + ")";
	if (hideStratOffset && timeDat.rawTime === timeDat.verTime) return "(" + adjText + ")"; 
	return "(" + formatTime(timeDat.rawTime) + " " + adjText + ")";
}

	/* time cell vs edit cell
		- shared: timeDat / version offset (w/ variant text)
		- shared: onClick behavior
		- time cell: has flag for "hidden times" (edit interface will never hide times)
		- time cell: has link
		- edit cell: always "active"
		- edit cell: always shows JP/US
		- edit cell: has proofreading / "dirty" tracking
	*/

	/* 
		time_detail: a formatted, version-adjusted time + original time if adjusted
			also includes variant information
	*/

export function timeDetail(timeDat: TimeDat | null, verOffset: VerOffset, hideStratOffset: boolean): [string, string | null] {
	if (timeDat === null) return ["", null];
	var timeText = formatTime(timeDat.time);
	if (hideStratOffset) timeText = formatTime(timeDat.verTime);
	// variant text
	var varText = " ["
	var commaFlag = false;
	timeDat.rowDef.variant_list.map((v) => {
		var vpp = v[0] + 1;
		if (vpp > 0) {
			if (commaFlag) varText = varText + ",";
			varText = varText + vpp;
			commaFlag = true;
		}
	});
	varText = varText + "]";
	if (varText !== " []") timeText = timeText + varText;
	// original text (when applicable)
	var rawText = null;
	if (timeDat.adjustList.length > 0) {
		rawText = preAdjustTime(timeDat, hideStratOffset);
	}
	/*if ((verOffset.focusVer === "jp" && timeDat.rowDef.ver === "us") ||
		(verOffset.focusVer === "us" && timeDat.rowDef.ver === "jp")) {
		rawText = verAdjustTime(timeDat.rowDef.ver, timeDat.rawTime, timeDat.time);
	}*/
	return [timeText, rawText];
}

function getRank(rankKey: string, stratName: string, timeDat: TimeDat): string
{
	// lookup strat ranks
	var stratSet = G_SHEET.srMap[rankKey];
	var ver = timeDat.rowDef.ver;
	/*var altSet = G_SHEET.srMap[rankKey + "#" + ver];
	if (altSet !== undefined) {
		stratSet = altSet;
		altFlag = true;
	}*/
	if (stratSet === undefined || stratSet[stratName] === undefined) return "Unranked";
	var st = stratSet[stratName];
	// iterate through strat ranks
	for (let i = 0; i < RANK_NAME_LIST.length - 1; i++) {
		var rankName = RANK_NAME_LIST[i][0];
		var rankInfo = st.times[rankName];
		if (rankInfo === undefined || rankInfo.sr === "none") continue;
		var rankDat = rankInfo.time;
		// lookup if alt strat should be used
		var altFlag = false;
		var rankTime = rankDat.time;
		if (rankDat.alt !== null && rankDat.alt[1] === ver) rankTime = rankDat.alt[0];
		// if using alt, compare raw time
		//if (altFlag && timeDat.rawTime <= rankTime) return rankName;
		//else if (!altFlag && timeDat.verTime <= rankTime) return rankName;
		if (timeDat.rawTime <= rankTime) return rankName;
	}
	return "Iron";
}

	/* time cell: displays a time w/ version adjustment, variant info, video link, etc */

type TimeCellProps = {
	"timeDat": TimeDat | null,
	"verOffset": VerOffset,
	"active": boolean,
	"onClick": () => void,
	"hiddenFlag": boolean,
	"super"?: string,
	"complete"?: string,
	"hideStratOffset"?: boolean,
	"rankKey"?: string
};

export function TimeCell(props: TimeCellProps): React.ReactNode {
	var timeDat = props.timeDat;
	var verOffset = props.verOffset;
	var active = props.active;
	var onClick = props.onClick;
	var hiddenFlag = props.hiddenFlag;
	var hideStratOffset = false;
	if (props.hideStratOffset !== undefined) hideStratOffset = props.hideStratOffset;
	// get detailed time
	var [cellText, rawText] = timeDetail(timeDat, verOffset, hideStratOffset);
	// link if link is relevant
	var timeNode: React.ReactNode = cellText;
	if (props.super) timeNode = <React.Fragment>{ timeNode }<sup data-k={ props.super }>{ props.super }</sup></React.Fragment>;
	if (timeDat !== null && timeDat.link !== null && timeDat.link !== "") {
		timeNode = (<a href={ timeDat.link } target="_blank">{ timeNode }</a>);
	}
	// note if note is relevant
	var noteNodes: React.ReactNode[] = [];
	if (timeDat !== null && timeDat.note !== null && timeDat.note !== "") {
		noteNodes = [<div className="triangle" key="tri"></div>,
			<span className="note-text" key="note">{ timeDat.note }</span>];
	}
	// remaining annotations
	var spanNodes: React.ReactNode[] = [];
	if (rawText !== null) spanNodes.push(<em key="e">{ rawText }</em>);
	if (hiddenFlag) spanNodes.push(<div className="na" key="a">*</div>);
	// add rank node if necessary
	var hasRankNode = props.rankKey && timeDat !== null && cellText !== "";
	timeNode = (<td className="time-cell tooltip" data-active={ active.toString() } data-complete={ props.complete }
		colSpan={ hasRankNode ? 1 : 2 } onClick={ onClick }>{ timeNode } { spanNodes } { noteNodes }</td>);
	// -- do this again to appease typescript
	if (props.rankKey && timeDat !== null && cellText !== "") {
		var rankName = getRank(props.rankKey, timeDat.rowDef.name, timeDat);
		return <React.Fragment>
			{ timeNode }
			<td className="time-rank" data-ps={ rankName }>
				<div className="time-rank-inner">{ rankName }</div>
				<div className="time-rank-hat"></div>
			</td>
		</React.Fragment>;
	}
	return timeNode;
}

type SimpleCellProps = {
	"time": number,
	"alter"?: boolean,
	"altTime"?: [number, string]
};

export function SimpleTimeCell(props: SimpleCellProps): React.ReactNode {
	var timeText = formatTime(props.time);
	var alter = props.alter === true;
	var spanText: React.ReactNode = "";
	if (props.altTime) {
		var sText = "(" + formatTime(props.altTime[0]) + " " + props.altTime[1].toUpperCase() + ")";
		spanText = <em>{ sText }</em>;
	}
	return (<td className="time-cell tooltip" data-active={ "false" } data-alter={ alter.toString() }>{ timeText } { spanText }</td>);
}

	/* record cell: similar to time cell, but with no interactivity */

type RecordCellProps = {
	"timeDat": TimeDat,
	"verOffset": VerOffset,
	"hideStratOffset"?: boolean
};

export function RecordCell(props: RecordCellProps): React.ReactNode {
	var timeDat = props.timeDat;
	var verOffset = props.verOffset;
	var hideStratOffset = false;
	if (props.hideStratOffset !== undefined) hideStratOffset = props.hideStratOffset;
	var [cellText, rawText] = timeDetail(timeDat, verOffset, hideStratOffset);
	// link if link is relevant
	var timeNode: React.ReactNode = cellText;
	if (timeDat !== null && timeDat.link !== null && timeDat.link !== "") {
		timeNode = (<a href={ timeDat.link } target="_blank">{ timeNode }</a>);
	}
	return (<td className="record-cell" colSpan={ 2 }>{ timeNode } { rawText }</td>);
}

	/* name cell: displays a player name */

type NameCellProps = {
	"id": Ident,
	"pd": PlayData,
	"active": boolean,
	"onClick": () => void,
	"href"?: string
};

export function NameCell(props: NameCellProps): React.ReactNode {
	// get play standard when applicable
	var playStd = "Unranked";
	var name = strIdNickPD(props.pd, props.id);
	/*var UNSAFE_playDat = (playData as any)[name];
	if (UNSAFE_playDat !== undefined && UNSAFE_playDat.standard) {
		playStd = UNSAFE_playDat.standard;
	}*/
	if (G_SHEET.userMap !== null) {
		var playDat = G_SHEET.userMap.stats["xcam@" + name];
		if (playDat !== undefined) playStd = playDat.standard;
	}
	// atmpas star
	var imgNode = null;
	if (playStd === "Atmpas") {
		playStd = "Mario";
		imgNode = <img src="/icons/star.png" width="10px"></img>;
	}
	// name + ending cell
	if (props.href !== undefined) {
		return (<td className="name-cell link-cont" data-active={ "true" }
			onClick={ props.onClick } data-ps={ playStd }>{ name } { imgNode }
				<Link className="link-span" href={ props.href }></Link></td>);
	}
	return (<td className="name-cell" data-active={ props.active.toString() }
		onClick={ props.onClick } data-ps={ playStd }>{ name } { imgNode }</td>);
}