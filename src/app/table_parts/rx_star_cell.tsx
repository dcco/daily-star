
//import playData from './json/player_data.json'
import Link from 'next/link'
import React from 'react'

import { G_SHEET } from '../api_xcam'

import { Ver } from '../variant_def'
import { TimeDat, VerOffset, formatTime } from '../time_dat'
import { Ident } from '../time_table'
import { PlayData, strIdNickPD, lookupDatPD } from '../play_data'

import { getRank } from '../standards/strat_ranks'
import { DS_COLOR_LIST } from '../board_full/rx_color_pick'

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

	/* time cell: displays a time w/ version adjustment, variant info, video link, etc */

type TimeCellProps = {
	"timeDat": TimeDat | null,
	"verOffset": VerOffset,
	"active": boolean,
	"onClick": () => void,
	"hiddenFlag": boolean,
	"colSpan"?: number,
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
		var verifFlag = timeDat.verifFlag !== 'no';
		timeNode = (<a href={ timeDat.link } data-verif={ verifFlag.toString() } target="_blank">{ timeNode }</a>);
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
	var hasRankNode = false;
	var rankNode: React.ReactNode = "";
	// add annotations / wrap time + rank info in bubbles when relevant
	if (props.rankKey && timeDat !== null && cellText !== "") {
		hasRankNode = true;
		var rankName = getRank(G_SHEET.srMap, props.rankKey, timeDat);
		var abName = rankName;
		if (rankName === "Grandmaster") abName = "GM";
		timeNode = <div className="time-bubble">{ timeNode } { spanNodes }</div>
		rankNode = <div className="rank-bubble-ex">
			<div className="rank-bubble" data-ps={ rankName }></div>
			<div className="rank-bubble-text" data-ps={ rankName }>{ abName }</div>
		</div>;
	} else {
		timeNode = <React.Fragment>
			{ timeNode } { spanNodes }
		</React.Fragment>;
	}

	// re-wrap time in the actual time cell
	var cSpan = hasRankNode ? 1 : 2;
	if (props.colSpan) cSpan = props.colSpan;
	timeNode = (<td className="time-cell tooltip" data-active={ active.toString() } data-complete={ props.complete }
		colSpan={ cSpan } onClick={ onClick }>{ timeNode } { hasRankNode ? "" : noteNodes }</td>);
	if (hasRankNode) {
		timeNode = <React.Fragment>
			{ timeNode }
			<td className="time-cell tooltip invis-rank-cell" data-active={ active.toString() } onClick={ onClick }
				colSpan={ cSpan }>{ rankNode } { noteNodes }</td>
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
	return (<td className="time-cell tooltip" data-active={ "false" } data-alter={ alter.toString() }>
		<div className="buffer-cont">{ timeText } { spanText }</div></td>);
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
	if (timeDat.rawTime >= 900000) return <td className="record-cell" colSpan={ 2 }>-</td>;
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
	if (G_SHEET.scoreData !== null) {
		const userMap = G_SHEET.scoreData.user[""];
		var playDat = userMap.stats["xcam@" + name];
		if (playDat !== undefined) playStd = playDat.standard;
	}
	// atmpas star
	var imgNode = null;
	if (playStd === "Atmpas") {
		playStd = "Mario";
		imgNode = <img src="/icons/star.png" width="10px"></img>;
	}
	// custom color when applicable
	var style: any = {};
	var myDat = lookupDatPD(props.pd, props.id);
	if (myDat !== null && myDat.favColor !== null) {
		// -- for typescript
		var _myDat = myDat;
		var i = DS_COLOR_LIST.findIndex((elem) => elem[0] === _myDat.favColor);
		if (i !== -1) {
			const colorDef = DS_COLOR_LIST[i];
			style = {
				"backgroundColor": "#" + colorDef[1],
				"color": "#" + colorDef[2],
				"fontStyle": "normal"
			};
		}
	}
	// name + ending cell
	if (props.href !== undefined) {
		return (<td className="name-cell link-cont" data-active={ "true" }
			onClick={ props.onClick } style={ style } data-ps={ playStd }>{ name } { imgNode }
				<Link className="link-span" href={ props.href }></Link></td>);
	}
	return (<td className="name-cell" data-active={ props.active.toString() }
		onClick={ props.onClick } style={ style } data-ps={ playStd }>{ name } { imgNode }</td>);
}

type InfoCellProps = {
	text: string,
	note: string[],
	subText?: string,
	super?: [string, string]
}

export function InfoCell(props: InfoCellProps): React.ReactNode {
	var text = props.text;
	var subText = props.subText;
	var note = props.note;

	var timeNode: React.ReactNode = text;
	// superscript node when relevant
	if (props.super) {
		var [_super, sKind] = props.super;
		timeNode = <React.Fragment>{ timeNode }<sup data-k={ sKind }>{ _super }</sup></React.Fragment>;
	}
	// sub text node when relevant
	var spanNode: React.ReactNode = "";
	if (props.subText) spanNode = <em>{ props.subText }</em>
	// note node when relevant
	var noteNodes: React.ReactNode[] = [];
	if (props.note.length === 1) {
		noteNodes = [<div className="triangle" key="tri"></div>,
			<span className="note-text" key="note">{ props.note[0] }</span>];
	} else if (props.note.length > 0) {
		var itemNodes = props.note.map((n, i) =>
				<li className="note-item" key={ i }>{ n }</li>
			);
		noteNodes = [<div className="triangle" key="tri"></div>,
			<span className="note-text note-expand" key="note"><ul className="note-list">{ itemNodes }</ul></span>];
	}
	// wrap together
	return <td className="time-cell tooltip">
		{ timeNode } { spanNode } { noteNodes }
	</td>;
}
