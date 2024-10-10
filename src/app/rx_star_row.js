
import { hasSubTimes } from "./time_dat"
import { strIdNick } from "./play_wrap"
import { TimeCell, NameCell, EditCell } from "./rx_star_cell"

	/* data row: name cell + set of time cells */

export function DataRow(props) {
	var userDat = props.userDat;
	var verOffset = props.verOffset;
	var action = props.action;
	var rowId = props.rowId;
	var onClick = props.onClick;
	var datarow = props.datarow;
	// get text for initializing edit row
	//var timeText = userDat.timeRow.map(formatMultiDat);
	//timeText.unshift(strIdNick(userDat.id));
	// active (clickable)
	var active = (action !== "none");
	// build time cells
	var timeRowNodes = userDat.timeRow.map((multiDat, j) => {
		return <TimeCell timeDat={ timeDat } verOffset={ verOffset } active={ active }
			onClick={ () => onClick(action, rowId, j, timeText) } hiddenFlag={ hasSubTimes(multiDat) } key={ j }/>; 
	})
	// name cell
	timeRowNodes.unshift(<NameCell id={ userDat.id } key="user"/>);
	return (<tr className="time-row" datarow={ datarow }>
		{ timeRowNodes }
	</tr>);
}
