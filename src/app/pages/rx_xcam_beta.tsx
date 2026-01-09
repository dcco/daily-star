import React, { useState } from 'react'

import { G_SHEET } from '../api_xcam'

import { RouterMain, navRM } from '../router_main'
import { MenuOpt } from '../board_simple/rx_menu_opt'
import { XcamBoard } from '../board_full/rx_xcam_board'
import { XcamStatBoard } from '../stats/rx_xcam_stat_board'

export function XcamBeta(props: { rm: RouterMain }): React.ReactNode
{
	const [menuId, setMenuId] = useState(props.rm.core.subId);
	//const router = useRouter();

	var board = null;
	if (menuId === 0) {
		board = <XcamBoard rm={ props.rm }  hrefBase={ ["beta", "", "/beta/players"] } showStd={ true } beta={ true }/>;
	} else if (menuId === 1) {
		board = <XcamStatBoard hrefBase={ ["/beta/players", "/beta"] } slug={ props.rm.core.slug }
			scoreData={ G_SHEET.scoreData }
			/*starMap={ G_SHEET.starMap } userMap={ G_SHEET.userMap } userRankStore={ G_SHEET.userRankStore }
			altStarMap={ G_SHEET.extStarMap } altMap={ G_SHEET.altMap }*/
			aboutNode={ <BetaAbout/> } showStd={ true } key={ props.rm.core.slug }/>;
	} 

	const updateMenuId = (i: number) => {
		setMenuId(i);
		if (i === 0) navRM(props.rm, "beta", "", "");
		else if (i === 1) navRM(props.rm, "beta", "players", "");
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

export function BetaAbout(props: {}): React.ReactNode
{
	const [about, setAbout] = useState(false);
	if (!about) return (<div className="blurb-cont" onClick={ () => setAbout(true) }><div className="para">
			<div className="h-em">[+] About</div>
		</div></div>);

	return(<div className="blurb-cont" onClick={ () => setAbout(false) }>
		<div className="para">
			<div className="h-em">[-] About</div>
			<div className="para-inner">
				Ranks for Stars / Strats were developed for the Daily Star competition.
				They are not thoroughly vetted by anyone but myself (Twig), an intermediate-level
				player, and should not be taken too seriously. They were not made to seriously
				evaluate people's times in the Xcam Viewer (although data from the Xcam sheet was
				partially used to make them), and I have no plans to permanently integrate them there.
			</div>
			<div className="para-inner">
				That being said, they are applied to the Xcam sheet times / player data
				here for interested parties.
			</div>
		</div>
	</div>);
}
