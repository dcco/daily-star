import { RANK_NAME_LIST } from "../standards/rank_const"
import { G_SHEET } from "../api_xcam"

import React from 'react'

import { TimeDat, zeroVerOffset } from "../time_dat"
import { StarDef } from "../org_star_def"
import { SimpleTimeCell, TimeCell } from "../table_parts/rx_star_cell"

type SRTableProps = {
	"stageId": number,
	"starDef": StarDef
}

export function StratRankTableRaw(props: SRTableProps)
{
	var starDef = props.starDef;
	// lookup strat map for star
	var starKey = props.stageId + "_" + starDef.id;
	if (G_SHEET.srMap[starKey] === undefined) return <div></div>;
	var stratSet = G_SHEET.srMap[starKey];
	// check if there's an alt version
	/*var altSet: StratTimeSet | null = null;
	var altVer: string = "US";
	if (G_SHEET.srMap[starKey + "#us"]) altSet = G_SHEET.srMap[starKey + "#us"];
	else if (G_SHEET.srMap[starKey + "#jp"]) { altVer = "JP"; altSet = G_SHEET.srMap[starKey + "#jp"]; }*/
	// build a standard table for each strat
	var stNodeList: React.ReactNode[] = [];
	Object.entries(stratSet).map((sx) => {
		var [stratName, rankSet] = sx;
		if (rankSet === undefined) return;
		var rowNodeList: React.ReactNode[] = [];
		for (const rankDef of RANK_NAME_LIST) {
			var [rankName] = rankDef;
			var rankObj = rankSet.times[rankName];
			// get alt version when relevant
			var altTime: [number, string] | undefined = undefined;
			if (rankObj.sr !== "none" && rankObj.time.alt !== null) {
				altTime = rankObj.time.alt;
				/*var altInfo = altSet[stratName].times[rankName];
				if (altInfo.sr !== "none") altTime = [altInfo.time.verTime, altVer];*/
			}
			// display time
			if (rankObj.sr === "none") {
				rowNodeList.push(<tr key={ rankName }>
					<td className="rank-name" data-ps={ rankName }>{ rankName }</td>
					<td className="dark-cell"></td>
				</tr>);
			} else {
				// extra time data
				var rankEx = "";
				var alter = false;
				if (rankObj.method.m === "force") alter = true;
				else if (rankObj.method.m === "interpolate") rankEx = "*";
				else rankEx = "(" + rankObj.method.rankId + ")";
				// show time cell
				rowNodeList.push(<tr key={ rankName }>
					<td className="rank-name" data-ps={ rankName }>{ rankName } { rankEx }</td>
					<SimpleTimeCell time={ rankObj.time.time } alter={ alter } altTime={ altTime }></SimpleTimeCell>
				</tr>);
			}
					/* <TimeCell timeDat={ rankInfo.time } verOffset={ zeroVerOffset() } active={ false }
						onClick={ () => {} } hiddenFlag={ false } ></TimeCell> */
		}
		stNodeList.push(<div key={ stratName } className="rank-table-cont"><div data-method={ rankSet.rankMethod }
			className="rank-table">
			<div>{ rankSet.name }</div>
			<div>Skill Metric: { rankSet.skillMetric.toFixed(3) }</div>
			<table><tbody>{ rowNodeList }</tbody></table>
		</div></div>);
	});
	return <div className="rank-cont">Standards:
		{ stNodeList }
	</div>;
}
