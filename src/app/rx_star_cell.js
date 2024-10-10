
import playData from './json/player_data.json'

import { formatTime, copyTimeDat } from './time_dat'
import { strIdNick } from "./play_wrap"

	/* time display auxiliary functions */

export function verAdjustTime(ver, rawTime, time) {
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

function timeDetail(timeDat, verOffset) {
	if (timeDat === null) return ["", null];
	var timeText = formatTime(timeDat.time);
	// variant text
	if (timeDat.rowDef.variant_list.length > 0) {
		timeText = timeText + " [";
		timeDat.rowDef.variant_list.map((v, i) => {
			if (i !== 0) timeText = timeText + ",";
			var vpp = parseInt(v) + 1;
			timeText = timeText + vpp;
		});
		timeText = timeText + "]";
	}
	// original text (when applicable)
	var rawText = null;
	if ((verOffset.focusVer === "jp" && timeDat.rowDef.ver === "us") ||
		(verOffset.focusVer === "us" && timeDat.rowDef.ver === "jp")) {
		rawText = verAdjustTime(timeDat.rowDef.ver, timeDat.rawTime, timeDat.time);
	}
	return [timeText, rawText];
}

	/* time cell: displays a time w/ version adjustment, variant info, video link, etc */

export function TimeCell(props) {
	var timeDat = props.timeDat;
	var verOffset = props.verOffset;
	var active = props.active;
	var onClick = props.onClick;
	var hiddenFlag = props.hiddenFlag;
	// get detailed time
	var [cellText, rawText] = timeDetail(timeDat, verOffset);
	// link if link is relevant
	var timeNode = cellText;
	if (timeDat !== null && timeDat.link !== null) {
		timeNode = (<a href={ timeDat.link }>{ timeNode }</a>);
	}
	// remaining annotations
	var spanNodes = [];
	if (rawText !== null) spanNodes.push(<em>{ rawText }</em>);
	if (hiddenFlag) spanNodes.push("*");
	return (<td className="time-cell" active={ active.toString() } onClick={ onClick }>{ timeNode } { spanNodes }</td>);
}

	/* record cell: similar to time cell, but with no interactivity */

export function RecordCell(props) {
	var timeDat = props.timeDat;
	var verOffset = props.verOffset;
	var [cellText, rawText] = timeDetail(timeDat, verOffset);
	return (<td className="record-cell">{ cellText } { rawText }</td>);
}

	/* name cell: displays a player name */

export function NameCell(props) {
	// get play standard when applicable
	var playStd = "Unranked";
	var name = strIdNick(props.id);
	if (playData[name] !== undefined && playData[name].standard) {
		playStd = playData[name].standard;
	}
	// name + ending cell
	return(<td ps={ playStd }>{ name }</td>);
}