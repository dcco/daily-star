import React, { useState } from 'react'

import { G_SHEET } from '../api_xcam'

import { RouterMain, navRM } from '../router_main'
import { MenuOpt } from '../board_simple/rx_menu_opt'
import { XcamBoard } from '../board_full/rx_xcam_board'
import { DetailAbout, PlayerBoard } from '../stats/rx_player_board'

export function XcamFull(props: { rm: RouterMain }): React.ReactNode
{
	const [menuId, setMenuId] = useState(props.rm.core.subId);
	//const router = useRouter();

	var board = null;
	if (menuId === 0) {
		board = <XcamBoard rm={ props.rm } showStd={ false } beta={ false }/>;
	} else if (menuId === 1) {
		board = <PlayerBoard hrefBase={ ["/xcam/players", "/xcam"] } slug={ props.rm.core.slug }
			starMap={ G_SHEET.starMap } userMap={ G_SHEET.userMap }
			altStarMap={ G_SHEET.extStarMap } altMap={ G_SHEET.altMap }
			aboutNode={ <DetailAbout/> } lowNum={ 30 } midNum={ 50 } key={ props.rm.core.slug }/>;
	}

	const updateMenuId = (i: number) => {
		setMenuId(i);
		if (i === 0) navRM(props.rm, "xcam", "", "");
		else if (i === 1) navRM(props.rm, "xcam", "players", "");
	};

	return (<React.Fragment>
		<div className="menu-cont">
			<MenuOpt id={ 0 } selId={ menuId } setSelId={ updateMenuId }>Times</MenuOpt>
			<MenuOpt id={ 1 } selId={ menuId } setSelId={ updateMenuId }>Players</MenuOpt>
		</div>
		<div className="sep"><hr/></div>
		{ board }	
	</React.Fragment>);
}