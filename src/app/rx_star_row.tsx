
import React from "react"

import { VerOffset, hasSubTimes } from "./time_dat"
import { TimeRow, UserDat } from "./time_table"
import { strIdNick } from "./play_wrap"
import { TimeCell, NameCell } from "./rx_star_cell"

	/* data row: name cell + set of time cells */

export type CellAct = "none" | "edit" | "stop-edit" | "view-toggle";

type DataRowProps = {
	"userDat": UserDat,
	"verOffset": VerOffset,
	"expand": boolean,
	"action": CellAct,
	"rowId": number,
	"onClick": (a: CellAct, i: number, j: number, k: number) => void
	"endRow": boolean
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
	var verOffset = props.verOffset;
	var expand = props.expand;
	var action = props.action;
	var rowId = props.rowId;
	var onClick = props.onClick;
	var endRow = props.endRow;
	// get text for initializing edit row
	//var timeText = userDat.timeRow.map(formatMultiDat);
	//timeText.unshift(strIdNick(userDat.id));
	// active (clickable)
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
			return <TimeCell timeDat={ timeDat } verOffset={ verOffset } active={ false }
				onClick={ () => onClick(action, rowId, j, i) } hiddenFlag={ !expand && hasSubTimes(multiDat) } key={ j }/>; 
		})
		if (i === 0) timeRowNodes.unshift(<NameCell id={ userDat.id } key="user"/>);
		else timeRowNodes.unshift(<td className="dark-cell" key="user"></td>);
		rowNodeList.push(<tr className="time-row" data-row-active={ active.toString() } data-end-row={ endRow } key={ i }>
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
