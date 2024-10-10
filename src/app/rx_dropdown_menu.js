import React, { useState, useEffect, useRef } from 'react'

	/* special function for detecting clicks outside an element */

const useOutsideClick = (ref, f) =>
{
	const onClick = (e) => {
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

export function DropDownImgMenu(props)
{
	var src = props.src;
	var backupSrc = props.backupSrc;
	var textList = props.textList;
	var actList = props.actList;

	// backup image state
	const [curSrc, setSrc] = useState(src);

	// menu open state
	const [active, setActive] = useState(false);
	const ref = useRef();

	// on outside click
	useOutsideClick(ref, () => setActive(false));

	// build option nodes w/ actions
	var menuNode = null;
	if (active) {
		var optNodes = [];
		for (let i = 0; i < textList.length; i++) {
			var optActive = false;
			var f = () => {};
			if (actList[i] !== null) {
				optActive = true;
				f = (() => { setActive(false); actList[i](); });
			}
			optNodes.push(<div className="dropdown-opt" active={ optActive.toString() }
				onClick={ f } key={ i }>{ textList[i] }</div>);
		}
		menuNode = (<div className="dropdown-menu-inner">{ optNodes }</div>);
	}

	// add pic + absolutely positioned options
	return (<div className="dropdown-cont" ref={ ref }>
		<img className="login-pic" height="25px" src={ curSrc }
			onError={ (e) => { e.currentTarget.onError = null; setSrc(backupSrc); } }
			onClick={ () => setActive(!active) }></img>
		<div className="dropdown-menu">
			{ menuNode }
		</div>
	</div>)
}