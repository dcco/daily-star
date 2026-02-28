import { G_SHEET } from '../api_xcam'

import React, { useState, useEffect, useRef } from 'react'

import { AuthIdent, dropIdent } from '../time_table'
import { PlayData, LocalPD, strIdNickPD, setUserFavLD, setUserCustomFavLD } from '../play_data'
import { useOutsideClick } from './rx_dropdown_menu'

	/*
	["mario", "CC2424"],
	["gm", "851313"],
	["master", "70125E"],
	["diam", "8080D0"],
	["plat", "80D080"],
	["gold", "E0D490"],
	["silver", "CCD4D0"],
	["bronze", "C48865"],
	["iron", "A0A0A6"],
	*/

const stdColorList: [string, string][] = [
	["Mario", "CC2424"],
	["Grandmaster", "851313"],
	["Master", "70125E"],
	["Diamond", "8080D0"],
	["Platinum", "80D080"],
	["Gold", "E0D490"],
	["Silver", "CCD4D0"],
	["Bronze", "C48865"],
	["Iron", "A0A0A6"],
	["Unranked", "C0C0E8"]
]

export const DS_COLOR_LIST: [string, string, string][] = [
	["red", "C04050", "FFE0E0"],
	["citron", "D08030", "202020"],
	["daisy", "D0C030", "202020"],
	["chartr", "80B830", "202020"],
	["leaf", "30B030", "202020"],
	["teal", "30A0B0", "202020"],
	["ocean", "4050D0", "D0D0F0"],
	["lav", "8058D0", "E0D0FF"],
	["purple", "9040D0", "E0D0FF"],
	["berry", "B85090", "FFE0E0"],
	["pink", "D868D8", "202020"],
	["brown", "907050", "2C1003"],
	["dark", "484048", "D0D0D0"],
	["light", "E0E0E8", "202020"]
]

type ColorPickProps = {
	"userId": AuthIdent,
	"playData": PlayData,
	"setPlayData": (a: LocalPD) => void
};

function getColorSel(pd: PlayData): number {
	if (pd.local.favColor === null) return -1;
	return DS_COLOR_LIST.findIndex((elem) => elem[0] === pd.local.favColor);
}

function idToColorSel(id: number): string | null {
	if (id === -1) return null;
	return DS_COLOR_LIST[id][0];
}

function idToColorHex(id: number): string | null {
	if (id === -1) return null;
	return DS_COLOR_LIST[id][1];
}

export function ColorPick(props: ColorPickProps): React.ReactNode
{
	// menu open state
	const [active, setActive] = useState(false);
	const ref = useRef(null);

	// menu selection
	const defSel = getColorSel(props.playData);
	const [curSel, setSel] = useState(defSel);
	
	// custom color initialization
	var defCustom = idToColorHex(defSel);
	var defCustom2 = "";
	const defFav = props.playData.local.favColor;
	if (defFav !== null && defFav[0] === '#') {
		defCustom = defFav.replace('#', '');
		const defTextFav = props.playData.local.textColor;
		if (defTextFav !== null) defCustom2 = defTextFav.replace('#', '');
	}
	const [customText, setCustomText] = useState(defCustom === null ? "" : defCustom);
	const [customText2, setCustomText2] = useState(defCustom2);

	useEffect(() => {
		setSel(getColorSel(props.playData));
	}, [props.playData]);

	// on outside click
	useOutsideClick(ref, () => {
		setSel(getColorSel(props.playData));
		setActive(false);
	});

	// explicit set selection + reset custom selection
	const manualSetSel = (i: number) => {
		setSel(i);
		const newCustom = idToColorHex(i);
		setCustomText(newCustom === null ? "" : newCustom);
		setCustomText2("");
	} 

	// read custom color from text (if valid)
	var customColor: string | null = null;
	if (/^([0-9A-Fa-f]{6})$/.test(customText)) customColor = customText;
	var customTextColor: string = "000000";
	if (customColor !== null && /^([0-9A-Fa-f]{6})$/.test(customText2)) {
		customTextColor = customText2;
	}

	// color save protocol
	const saveColor = () => {
		var selColor = idToColorHex(curSel);
		var validTextColor: string | null = null;
		if (/^([0-9A-Fa-f]{6})$/.test(customText2)) validTextColor = "#" + customText2;
		// only save custom color if distinct from main selection OR custom text color
		if (customColor !== null && (customColor !== selColor || validTextColor !== null)) {
			var newLocal = setUserCustomFavLD(props.playData.local, "#" + customColor, validTextColor, true);
			props.setPlayData(newLocal);
		} else {
			var newLocal = setUserFavLD(props.playData.local, idToColorSel(curSel), true);
			props.setPlayData(newLocal);
		}
		setActive(false);
	}

	var menuNode = null;
	if (active) {
		// read custom color (if it exists)
		// color bubbles
		var colorNodes: React.ReactNode[] = [];
		DS_COLOR_LIST.map((colorDef, i) => {
			const c = colorDef[1];
			var style: any = { "backgroundColor": "#" + c };
			if (customColor === null && curSel === i) style["boxShadow"] = "0 0 10px #" + c + "B3";
			colorNodes.push(
				<div className="color-bubble-small" key={ colorDef[0] }
					style={ style } onClick={ () => manualSetSel(i) }/>
			);
		});
		var eStyle: any = {};
		if (curSel === -1) eStyle["boxShadow"] = "0 0 10px #D0D0D0B3";
		colorNodes.push(<div className="color-bubble-empty" key="empty"
			style={ eStyle } onClick={ () => manualSetSel(-1) }></div>);
		// paid only custom color
		var customNode: React.ReactNode = null;
		if (props.playData.local.status === 'paid') {
			var innerBubble = customColor === null
				? <div className="color-bubble-empty"></div>
				: <div className="color-bubble-small" style={{
						"backgroundColor": "#" + customColor,
						"color": "#" + customTextColor
					}}> <div className="color-bubble-text">a</div></div>
			customNode = <div className="input-color-cont">
				<div className="color-align">{ innerBubble }</div>
				<div>
					<div className="input-color-cont">
						#<input className="input-color" value={ customText }
							onChange={ (e) => setCustomText(e.target.value) }/>
					</div>
					<div className="input-color-cont">
						#<input className="input-color" value={ customText2 }
							onChange={ (e) => setCustomText2(e.target.value) }/>
					</div>
				</div>
			</div>;
		}
		menuNode = <div className="dropdown-menu-inner">
			<div className="color-box">{ colorNodes }</div>
			{ customNode }
			<div className="dropdown-opt" data-active="true"
				onClick={ saveColor }>Save Color</div>
		</div>;
	}

	var curColor = "FFFFFF";
	if (customColor !== null) curColor = customColor;
	else if (curSel !== -1) curColor = DS_COLOR_LIST[curSel][1];
	else {
		// get play standard if it exists
		var playStd = "Unranked";
		var name = strIdNickPD(props.playData, dropIdent(props.userId));
		if (G_SHEET.scoreData !== null) {
			const userMap = G_SHEET.scoreData.user[""];
			var playDat = userMap.stats["xcam@" + name];
			if (playDat !== undefined) playStd = playDat.standard;
		}
		// lookup play standard in color list
		var i = stdColorList.findIndex((elem) => elem[0] === playStd);
		if (i !== -1) curColor = stdColorList[i][1];
	}

	var fStyle: any = { "backgroundColor": "#" + curColor };
	return (<div className="dropdown-cont" ref={ ref }>
		<div className="color-bubble" onClick={ () => setActive(!active) }
			style={ fStyle }></div>
		<div className="dropcolor-menu">
			{ menuNode }
		</div>
	</div>);
}
