
import React from "react"

import { VerOffset, hasSubTimes } from "./time_dat"
import { TimeRow, UserDat, hasSubRows } from "./time_table"
import { PlayData, strIdNickPD } from "./play_data"
import { TimeCell, NameCell } from "./rx_star_cell"

	/* data row: name cell + set of time cells */

export type CellAct = "none" | "edit" | "stop-edit" | "view-toggle";

export type PlayDB = {
	"baseUrl": string,
	"nameList": string[]
};

function getPlayUrl(playDB: PlayDB, name: string): string | null
{
	if (playDB.nameList.includes(name)) return playDB.baseUrl + "?name=" + name;
	return null;
}

type DataRowProps = {
	"userDat": UserDat,
	"pd": PlayData,
	"verOffset": VerOffset,
	"expand": boolean,
	"action": CellAct,
	"rowId": number,
	"showRowId": boolean,
	"onClick": (a: CellAct, i: number, j: number, k: number) => void
	"endRow": boolean,
	"playDB"?: PlayDB
};

function heightColRow(timeRow: TimeRow, colId: number): number
{
	var multiDat = timeRow[colId];
	if (multiDat === null) return 0;
	return multiDat.length;
}

function heightRow(timeRow: TimeRow): [number, number[]]
{
	var height = 0;
	var heightList: number[] = [];
	for (let i = 0; i < timeRow.length; i++) {
		var h = heightColRow(timeRow, i);
		height = Math.max(height, h);
		heightList.push(h);
	}
	return [height, heightList];
}


export function DataRow(props: DataRowProps): React.ReactNode {
	var userDat = props.userDat;
	var pd = props.pd;
	var verOffset = props.verOffset;
	var expand = props.expand;
	var action = props.action;
	var rowId = props.rowId;
	var showRowId = props.showRowId;
	var onClick = props.onClick;
	var endRow = props.endRow;
	var playDB = props.playDB;
	// get text for initializing edit row
	//var timeText = userDat.timeRow.map(formatMultiDat);
	//timeText.unshift(strIdNick(userDat.id));
	// active (clickable)
	var rowActive = (action === "view-toggle");
	var active = (action !== "none");
	// build all rows
	var height = 1;
	if (expand) height = heightRow(userDat.timeRow)[0];
	var rowNodeList: React.ReactNode[] = [];
	for (let i = 0; i < height; i++) {
		// build time cells in row
		var timeRowNodes = userDat.timeRow.map((multiDat, j) => {
			var timeDat = null;
			if (multiDat !== null && i < multiDat.length) timeDat = multiDat[i];
			if (timeDat === null && i !== 0) return <td className="dark-cell" key={ j }></td>;
			return <TimeCell timeDat={ timeDat } verOffset={ verOffset } active={ active }
				onClick={ () => onClick(action, rowId, j, i) } hiddenFlag={ !expand && hasSubTimes(multiDat) } key={ j }/>; 
		})
		var nameAct: CellAct = "none";
		if (hasSubRows(userDat.timeRow)) nameAct="view-toggle";
		// get player link when applicable
		var href: string | undefined = undefined;
		if (playDB !== undefined) {
			var name = strIdNickPD(props.pd, userDat.id);
			var url = getPlayUrl(playDB, name);
			if (url !== null) href = url;
		} 
		if (i === 0) timeRowNodes.unshift(<NameCell id={ userDat.id } pd={ pd } active={ nameAct !== "none" }
			onClick={ () => {} } href={ href } key="user"/>);
		else timeRowNodes.unshift(<td className="dark-cell" key="user"></td>);
		if (showRowId) timeRowNodes.unshift(<td className="time-cell" key="num">{ rowId + 1 }</td>);
		rowNodeList.push(<tr className="time-row" data-row-active={ rowActive.toString() } data-end-row={ endRow } key={ i }>
			{ timeRowNodes }
		</tr>);
	}
	// row separators if expanded
	if (expand) {
		var sepList1 = [];
		var sepList2 = [];
		for (let i = 0; i < userDat.timeRow.length + 1; i++) {
			sepList1.push(<td className="sep-cell" key={ i }></td>);
			sepList2.push(<td className="sep-cell" key={ i }></td>);
		};
		rowNodeList.unshift(<tr className="sep-row" key={ rowId + "#A" }>{ sepList1 }</tr>);
		rowNodeList.push(<tr className="sep-row" key={ rowId + "#B" }>{ sepList2 }</tr>);
	}
	// name cell
	return (<React.Fragment>
		{ rowNodeList }
	</React.Fragment>);
}
