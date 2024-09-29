
import { formatFrames } from "./startable"

export function VerButton(props) {
	return (<div className="toggle-button" active={ props.active.toString() } onClick={ props.toggle }>
		<div className="toggle-inner">
			<img src={ props.src } width="15px"></img> { props.text }
		</div>
	</div>);
}

export function VerToggle(props) {
	var state = props.state;
	var verData = props.verData;
	// version text
	var focusUS = verData.focusVer === "us"; 
	var offDef = "US";
	if (focusUS) offDef = "JP";
	// offset node
	var offsetNode = null;
	if (!verData.complexOff) {
		var dispOffset = focusUS ? formatFrames(-verData.offset) : formatFrames(verData.offset);
		offsetNode = (<div className="offset-box">{ offDef } Offset: { dispOffset }</div>);
	} else {
		// complex offset
		var specList = [];
		Object.entries(verData.offset).map((_offset, i) => {
			var [strat, offset] = _offset;
			if (focusUS) offset = -offset;
			if (offset !== 0) specList.push(<p key={ i }>{ strat + ": " + formatFrames(offset) }</p>);
		})
		offsetNode = (<div className="offset-box">{ offDef } Offset { specList }</div>);
	}
	return (<div className="ver-cont">
		<div className="toggle-box">
			<VerButton src="/icons/jp.svg" active={ state[0] } text="JP" toggle={ () => props.toggle(0) }/>
			<VerButton src="/icons/us.svg" active={ state[1] } text="US" toggle={ () => props.toggle(1) }/>
		</div>
		{ offsetNode }
	</div>);
}