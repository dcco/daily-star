
import { VerOffset, hasSubTimes } from "./time_dat"
import { UserDat } from "./time_table"
import { strIdNick } from "./play_wrap"
import { TimeCell, NameCell } from "./rx_star_cell"

	/* data row: name cell + set of time cells */

export type CellAct = "none" | "edit" | "view-toggle";

type DataRowProps = {
	"userDat": UserDat,
	"verOffset": VerOffset,
	"action": CellAct,
	"rowId": number,
	"onClick": (a: CellAct, i: number, j: number, k: number) => void
	"endRow": boolean
};

export function DataRow(props: DataRowProps): React.ReactNode {
	var userDat = props.userDat;
	var verOffset = props.verOffset;
	var action = props.action;
	var rowId = props.rowId;
	var onClick = props.onClick;
	var endRow = props.endRow;
	// get text for initializing edit row
	//var timeText = userDat.timeRow.map(formatMultiDat);
	//timeText.unshift(strIdNick(userDat.id));
	// active (clickable)
	var active = (action !== "none");
	// build time cells
	var timeRowNodes = userDat.timeRow.map((multiDat, j) => {
		var timeDat = null;
		if (multiDat !== null) timeDat = multiDat[0];
		return <TimeCell timeDat={ timeDat } verOffset={ verOffset } active={ active }
			onClick={ () => onClick(action, rowId, j, 0) } hiddenFlag={ hasSubTimes(multiDat) } key={ j }/>; 
	})
	// name cell
	timeRowNodes.unshift(<NameCell id={ userDat.id } key="user"/>);
	return (<tr className="time-row" data-endRow={ endRow }>
		{ timeRowNodes }
	</tr>);
}
