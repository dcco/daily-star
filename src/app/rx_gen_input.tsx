import React, { useState } from 'react'

type GenInputProps = {
	"value": string | null,
	"inputWidth"?: string,
	"validFun": (a: string) => boolean,
	"setValue": (a: string) => void
};

export function GenInput(props: GenInputProps): React.ReactNode
{	
	// edit state + functions
	const [eState, setEState] = useState({
		"active": false,
		"text": ""
	});

	const startEdit = () => {
		var initText = "";
		if (props.value !== null) initText = props.value;
		setEState({ "active": true, "text": initText });
	};

	const textEdit = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEState({ "active": true, "text": e.target.value });
	};

	const stopEdit = (v: string | null) => {
		// stops editing, if invalid goes back to default
		if (v !== null && props.validFun(v)) { props.setValue(v); }
		setEState({ "active": false, "text": "" });
	}

	// display node
	var dispNode: React.ReactNode = "";
	var sWidth = props.inputWidth;
	if (!eState.active) {
		if (props.value === null) dispNode = <div className="input-disp" style={{ width: sWidth }} data-state="none">---</div>;
		else dispNode = <div className="input-disp" style={{ width: sWidth }} data-state="display">{ props.value }</div>;
	} else {
		dispNode = <input className="input-disp" style={{ width: sWidth }} data-state="edit" value={ eState.text } onChange={ textEdit }/>;
	}

	// action node
	var actNode: React.ReactNode = <img src="/icons/edit-icon.png" className="edit-icon" onClick={ startEdit }></img>;
	if (eState.active) {
		actNode = [
			<div className="plain-button" onClick={ () => stopEdit(eState.text) } key="1">Set</div>,
			<div className="cancel-button" onClick={ () => stopEdit(null) } key="2">X</div>
		];
	}

	return (<div className="input-cont">
		{ dispNode } { actNode }
	</div>);
}