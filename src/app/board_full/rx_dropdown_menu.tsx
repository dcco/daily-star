import React, { useState, useEffect, useRef } from 'react'

	/* special function for detecting clicks outside an element */

const useOutsideClick = (ref: any, f: () => void) =>
{
	const onClick = (e: any) => {
		if (ref.current && !ref.current.contains(e.target)) f();
	};

	useEffect(() => {
		document.addEventListener("click", onClick);
		return () => {
			document.removeEventListener("click", onClick);
		};
	});
};

	/* dropdown image menu */

type DropDownMenuProps = {
	"src": string,
	"backupSrc": string,
	"textList": string[],
	"actList": ((() => void) | null)[]
};

export function DropDownImgMenu(props: DropDownMenuProps): React.ReactNode
{
	var src = props.src;
	var backupSrc = props.backupSrc;
	var textList = props.textList;
	var actList = props.actList;

	// backup image state
	const [curSrc, setSrc] = useState(src);

	// menu open state
	const [active, setActive] = useState(false);
	const ref = useRef(null);

	// on outside click
	useOutsideClick(ref, () => setActive(false));

	// build option nodes w/ actions
	var menuNode = null;
	if (active) {
		var optNodes: React.ReactNode[] = [];
		for (let i = 0; i < textList.length; i++) {
			var optActive = false;
			var f = () => {};
			var ax = actList[i];
			if (ax !== null) {
				var axFinal: () => void = ax;
				optActive = true;
				f = (() => { setActive(false); axFinal(); });
			}
			optNodes.push(<div className="dropdown-opt" data-active={ optActive.toString() }
				onClick={ f } key={ i }>{ textList[i] }</div>);
		}
		menuNode = (<div className="dropdown-menu-inner">{ optNodes }</div>);
	}

	// add pic + absolutely positioned options
	return (<div className="dropdown-cont" ref={ ref }>
		<img className="login-pic" height="25px" src={ curSrc !== '' ? curSrc : backupSrc }
			onError={ (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.onerror = null; setSrc(backupSrc); } }
			onClick={ () => setActive(!active) }></img>
		<div className="dropdown-menu">
			{ menuNode }
		</div>
	</div>)
}