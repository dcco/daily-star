import React, { useState } from 'react'

type SearchInputProps = {
	"searchList": string[],
	"value": string | null,
	"inputWidth"?: string,
	"validFun": (a: string) => boolean,
	"setValue": (a: string) => void
};

export function SearchInput(props: SearchInputProps): React.ReactNode
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

	// search option
	var searchNode: React.ReactNode = "";
	if (eState.active && eState.text !== "") {
		var sstr = eState.text.toLowerCase();
		var filterList = props.searchList.map((name: string): [string, number] => {
			const lName = name.toLowerCase();
			const ix = lName.indexOf(sstr);
			return [name, ix];
		}).filter((res, i) => res[1] !== -1);
		filterList.sort((a, b) => a[1] - b[1]);
		filterList = filterList.filter((res, i) => i < 10);
		//props.searchList
		const itemList = filterList.map((res, i) => {
			const [name, ix] = res;
			return <li key={ i } onClick={ () => stopEdit(name) }>{ name }</li>;
		});
		if (itemList.length !== 0) searchNode = <span className="search-res"><ul>{ itemList }</ul></span>
	}

	return (<div className="search-cont">
		<div className="input-cont">
			{ dispNode } { actNode }
		</div>
		{ searchNode }
	</div>);
}