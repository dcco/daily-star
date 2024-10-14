
import playData from './json/player_data.json'

import { Ver } from './variant_def'
import { TimeDat, VerOffset, formatTime } from './time_dat'
import { Ident } from './time_table'
import { strIdNick } from './play_wrap'

	/* time display auxiliary functions */

function verAdjustTime(ver: Ver, rawTime: number, time: number): string {
	var verName = "JP";
	if (ver === "us") verName = "US";
	if (rawTime === time) return "(" + verName + ")";
	return "(" + formatTime(rawTime) + " " + verName + ")";
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

export function timeDetail(timeDat: TimeDat | null, verOffset: VerOffset): [string, string | null] {
	if (timeDat === null) return ["", null];
	var timeText = formatTime(timeDat.time);
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
	if ((verOffset.focusVer === "jp" && timeDat.rowDef.ver === "us") ||
		(verOffset.focusVer === "us" && timeDat.rowDef.ver === "jp")) {
		rawText = verAdjustTime(timeDat.rowDef.ver, timeDat.rawTime, timeDat.time);
	}
	return [timeText, rawText];
}

	/* time cell: displays a time w/ version adjustment, variant info, video link, etc */

type TimeCellProps = {
	"timeDat": TimeDat | null,
	"verOffset": VerOffset,
	"active": boolean,
	"onClick": () => void,
	"hiddenFlag": boolean
};

export function TimeCell(props: TimeCellProps): React.ReactNode {
	var timeDat = props.timeDat;
	var verOffset = props.verOffset;
	var active = props.active;
	var onClick = props.onClick;
	var hiddenFlag = props.hiddenFlag;
	// get detailed time
	var [cellText, rawText] = timeDetail(timeDat, verOffset);
	// link if link is relevant
	var timeNode: React.ReactNode = cellText;
	if (timeDat !== null && timeDat.link !== null) {
		timeNode = (<a href={ timeDat.link }>{ timeNode }</a>);
	}
	// remaining annotations
	var spanNodes: React.ReactNode[] = [];
	if (rawText !== null) spanNodes.push(<em key="e">{ rawText }</em>);
	if (hiddenFlag) spanNodes.push(<div className="na" key="a">*</div>);
	return (<td className="time-cell" data-active={ active.toString() } onClick={ onClick }>{ timeNode } { spanNodes }</td>);
}

	/* record cell: similar to time cell, but with no interactivity */

type RecordCellProps = {
	"timeDat": TimeDat,
	"verOffset": VerOffset
};

export function RecordCell(props: RecordCellProps): React.ReactNode {
	var timeDat = props.timeDat;
	var verOffset = props.verOffset;
	var [cellText, rawText] = timeDetail(timeDat, verOffset);
	return (<td className="record-cell">{ cellText } { rawText }</td>);
}

	/* name cell: displays a player name */

type NameCellProps = {
	"id": Ident
};

export function NameCell(props: NameCellProps): React.ReactNode {
	// get play standard when applicable
	var playStd = "Unranked";
	var name = strIdNick(props.id);
	var UNSAFE_playDat = (playData as any)[name];
	if (UNSAFE_playDat !== undefined && UNSAFE_playDat.standard) {
		playStd = UNSAFE_playDat.standard;
	}
	// name + ending cell
	return(<td data-ps={ playStd }>{ name }</td>);
}