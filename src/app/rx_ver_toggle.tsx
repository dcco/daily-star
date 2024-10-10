
import React from 'react'

import { VerOffset, formatFrames } from "./time_dat"

type VerButtonProps = {
	"text": string,
	"src": string,
	"active": boolean,
	"toggle": () => void
};

function VerButton(props: VerButtonProps): React.ReactNode {
	return (<div className="toggle-button" data-active={ props.active.toString() } onClick={ props.toggle }>
		<div className="toggle-inner">
			<img src={ props.src } width="15px"></img> { props.text }
		</div>
	</div>);
}

type VerToggleProps = {
	"state": [boolean, boolean],
	"verOffset": VerOffset,
	"toggle": (i: number) => void
};

export function VerToggle(props: VerToggleProps) {
	var state = props.state;
	var verOffset = props.verOffset;
	// version text
	var focusUS = verOffset.focusVer === "us"; 
	var offDef = "US";
	if (focusUS) offDef = "JP";
	// offset node
	var offsetNode: React.ReactNode | null = null;
	var offset = verOffset.offset
	if (!offset.a) {
		var dispOffset = focusUS ? formatFrames(-offset.num) : formatFrames(offset.num);
		offsetNode = (<div className="offset-box">{ offDef } Offset: { dispOffset }</div>);
	} else {
		// complex offset
		var specList: React.ReactNode[] = [];
		Object.entries(offset.data).map((_offset, i) => {
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