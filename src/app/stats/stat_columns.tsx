import { ALTER_RANKS } from '../rx_multi_board'

import { TimeDat } from "../time_dat"
import { Ident, keyIdent } from "../time_table"
import { ExtState } from "../org_star_def"
import { AltType, StarRef, lookupStarMap } from "../star_map"
import { ExColumn } from "../table_parts/ex_column"
import { InfoCell, TimeCell } from "../table_parts/rx_star_cell"
import { getRankValue } from '../standards/strat_ranks'

import { StxStarData, recordStxStarData } from "./stats_star_map"
import { UserScore, IncScore, UserStatMap, calcTopXStats, calcTop100cStats, getStarUserStats, rankPts } from "./stats_user_map"
import { UserScoreMetaMap, calcTopXStats_DS, calcTop100cStats_DS } from "./ds_scoring"
import { ScoreCache, ScoreFilter, newScoreFilter, getUserDataScoreCache, getRankScoreCache, getDSScoreCacheSafe } from "./score_cache"
import { DetColumn } from "./rx_detail_table"

function dsRound(f: number): string
{
	if (f === Math.floor(f)) return f.toFixed(0);
	return f.toFixed(1);
}

	/*
		regular columns [for xcam table]
	*/

function scoreColumnDS(dsScore: UserScoreMetaMap, starRef: StarRef<AltType>)
{
	const scoreFun = (id: Ident): [React.ReactNode, number[]] => {
		// find stats for user
		const userDsx = dsScore[keyIdent(id)];
		if (userDsx === undefined) return [<td className="time-cell" key="score">-</td>, [1]];
		// obtain relevant star
		//const starKey = statKey(stageId, starId, alt);
		//console.log("no:", userDsx);
		//const starScore = userDsx.starMap[starKey];
		const starScore = lookupStarMap(userDsx.starMap, starRef);
		/*if (starScore === null) return [<td className="time-cell" key="score">
			{ starRef.alt === null ? "null" : starRef.alt }</td>, [1]];*/
		if (starScore === null) return [<td className="time-cell" key="score">-</td>, [1]];
		// print score text
		const basePlace = starScore.basePlace;
		const stratPlace = starScore.stratPlace;
		const starText = dsRound(starScore.totalPts);
		// info stuff
		var infoList = [
			"- Base Pts: " + dsRound(starScore.basePts) + " [" + (basePlace[0] + 1) + "/" + basePlace[1] + "]",
			"- Rank Pts: " + dsRound(starScore.rankPts)
		];
		if (starScore.bestStrat !== null) infoList = infoList.concat([
			"- Strat Pts: " + dsRound(starScore.stratPts) + " [" + (stratPlace[0] + 1) + "/" + stratPlace[1] + "]",
			"(" + starScore.bestStrat + ")"
		]);
		return [
			<InfoCell key="score" text={ starText } note={ infoList }/>, [-starScore.totalPts]
		];
	}
	return {
		"name": "Score", "key": "score", "dataFun": scoreFun
	};
}

	/* currently only for debug purposes */
/*function scoreColumnRaw(userMap: UserStatMap | null, stageId: number, starId: string, alt: AltState)
{
	const scoreFun = (id: Ident): [React.ReactNode, number[]] => {
		// find stats for user
		if (userMap === null) return [<td className="time-cell" key="score">-</td>, [1]];
		const userSx = userMap.stats[keyIdent(id)];
		if (userSx === undefined) return [<td className="time-cell" key="score">-</td>, [1]];
		// obtain relevant star
		const starInfo = getStarUserStats(userSx, stageId, starId, alt);
		if (starInfo === null) return [<td className="time-cell" key="score">-</td>, [1]]; 
		return [
			(<td className="time-cell" key="score">
				{ (starInfo.rank[0] + "/" + starInfo.rank[1]) + ", " + (starInfo.scorePts * 90).toFixed(2) }
			</td>), [-starInfo.scorePts]
		];
	}
	return {
		"name": "Score", "key": "score", "dataFun": scoreFun
	};
}*/

export function scoreColumn(scoreData: ScoreCache | null,
	starRef: StarRef<AltType>, extFlag: ExtState, verifFlag: boolean): ExColumn
{
	var dsScore: UserScoreMetaMap | null = null;
	var userMap: UserStatMap | null = null;
	if (scoreData !== null) {
		var fsx = newScoreFilter(extFlag, starRef.alt === null ? false : true, verifFlag);
		dsScore = getDSScoreCacheSafe(scoreData, fsx);
		//console.log("col:", fsx, alt, dsScore);
		if (dsScore === null) {
			var [_starMap, _userMap] = getUserDataScoreCache(scoreData, fsx);
			userMap = _userMap;
		}
	}
	if (dsScore !== null) return scoreColumnDS(dsScore, starRef);
	return {
		"name": "Score", "key": "score",
		"dataFun": () => { return [<td className="time-cell" key="score">-</td>, [1]]; }
	};
	//return scoreColumnRaw(userMap, stageId, starId, alt);
}

	/*
		regular columns [for summary scoring]
	*/

export function totalColumn(userMap: UserStatMap | null, w: number): ExColumn
{
	return {
		"name": "Fill", "key": "fill", "dataFun": (id: Ident) => {
			if (userMap === null) return [<td className="time-cell" key="fill">-</td>, [1]];
			const userSx = userMap.stats[keyIdent(id)];
			return [<td className="time-cell" key="fill">{ userSx.starList.length }</td>, [-userSx.starList.length]];
		},
		"widthRec": w
	}
}

export function percentColumn(userMap: UserStatMap | null, w: number): ExColumn
{
	return {
		"name": "%", "key": "perc", "dataFun": (id: Ident) => {
			if (userMap === null) return [<td className="time-cell" key="perc">-</td>, [1]];
			const starTotal = userMap.starTotal;
			const userSx = userMap.stats[keyIdent(id)];
			const perc = (userSx.starList.length * 100 / starTotal).toFixed(1);
			return [<td className="time-cell" key="perc">{ perc }</td>, [-userSx.starList.length]];
		},
		"widthRec": w
	}
}

export function bestOfXColumn(userMap: UserStatMap | null, name: string, key: string, num: number): ExColumn
{
	const bestOfFun = (id: Ident): [React.ReactNode, number[]] => {
		if (userMap === null) return [<td className="time-cell" key={ key }>-</td>, [1]];
		const userSx = userMap.stats[keyIdent(id)];
		const score = calcTopXStats(userSx, num, ALTER_RANKS);
		const scoreText = score.toFixed(2);
		return [<td className="time-cell" key={ key }>{ scoreText }</td>, [-score]];
	};
	return {
		"name": name, "key": key, "dataFun": bestOfFun
	}
}

export function bestOfXColumn_DS(userMap: UserScoreMetaMap | null, name: string, key: string, num: number, mult: number): ExColumn
{
	const bestOfFun = (id: Ident): [React.ReactNode, number[]] => {
		if (userMap === null) return [<td className="time-cell" key={ key }>-</td>, [1]];
		const userSx = userMap[keyIdent(id)];
		if (userSx === undefined) return [<td className="time-cell" key={ key }>-</td>, [1]];
		const score = calcTopXStats_DS(userSx, num);
		const scoreText = dsRound(score * mult);
		if (mult === 1 || score === 0) return [<td className="time-cell" key={ key }>{ scoreText }</td>, [-score]];
		return [<InfoCell key={ key } text={ scoreText } note={ [] } subText={ "(" + dsRound(score) + ")" }/>, [-score]];
	};
	return {
		"name": name, "key": key, "dataFun": bestOfFun
	}
}

export function best100cColumn_DS(userMap: UserScoreMetaMap | null, name: string, key: string, num: number, mult: number): ExColumn
{
	const bestOfFun = (id: Ident): [React.ReactNode, number[]] => {
		if (userMap === null) return [<td className="time-cell" key={ key }>-</td>, [1]];
		const userSx = userMap[keyIdent(id)];
		if (userSx === undefined) return [<td className="time-cell" key={ key }>-</td>, [1]];
		const score = calcTop100cStats_DS(userSx, num);
		return [<td className="time-cell" key={ key }>{ dsRound(score * mult) }</td>, [-score]];
	};
	return {
		"name": name, "key": key, "dataFun": bestOfFun
	}
}

	/*
		TODO: implement DS caching
	*/

export function bestCompColumn_DS(userMap: UserScoreMetaMap | null, name: string, key: string,
	weight: [number, number], weight100: [number, number]): ExColumn
{
	const [num, m1] = weight;
	const [num100, m2] = weight100;
	const bestOfFun = (id: Ident): [React.ReactNode, number[]] => {
		if (userMap === null) return [<td className="time-cell" key={ key }>-</td>, [1]];
		const userSx = userMap[keyIdent(id)];
		if (userSx === undefined) return [<td className="time-cell" key={ key }>-</td>, [1]];
		const score = calcTopXStats_DS(userSx, num);
		const score100 = calcTop100cStats_DS(userSx, num100);
		const total = (score * m1) + (score100 * m2);
		return [<td className="time-cell" key={ key }>{ dsRound(total) }</td>, [-total]];
	};
	return {
		"name": name, "key": key, "dataFun": bestOfFun
	}
}

	/*
		detail star score columns
	*/

export function numDetCol(name: string, w: number): DetColumn
{
	return {
		"name": name, "key": "no", "widthRec": w,
		"mainFun": (_: UserScore, i: number) => {
			return [<td className="time-cell" key="no">{ i + 1 }</td>, [i, 0]];
		},
		"incFun": (_: IncScore, i: number) => {
			return [<td className="time-cell" key="no">-</td>, [i, 1]];
		}
	};
}

export function placementDetCol(name: string, w: number): DetColumn
{
	return {
		"name": name, "key": "place", "widthRec": w,
		"mainFun": (score: UserScore, i: number) => {
			var rankNo = score.rank[0] + 1;
			return [<td className="time-cell" key="rank">{ rankNo + "/" + score.rank[1] }</td>, [i, 0]];
		},
		"incFun": (score: IncScore, i: number) => {
			var rankText = "?/" + score.playTotal;
			if (score.rank !== null) {
				var rankNo = score.rank + 1;
				rankText = rankNo + "/" + score.playTotal;
			}
			return [<td className="time-cell" data-complete="false" key="rank">{ rankText }</td>, [i, 1]];
		}
	};
}

export function otherPlaceDetCol(name: string, w: number, rival: Ident, userMap: UserStatMap, altFlag: boolean): DetColumn
{
	const rivalSx = userMap.stats[keyIdent(rival)];
	const compFun = (score: UserScore | IncScore, i: number): [React.ReactNode, number[]] => {
		// build time node	
		var rivalScore = getStarUserStats(rivalSx, score, altFlag);
		if (rivalScore === null || !rivalScore.comp) {
			return [<td className="time-cell" data-complete="false" key="o-place">-</td>, [-1, i]];
		}
		var rankNo = rivalScore.rank[0] + 1;
		return [<td className="time-cell" key="o-place">{ rankNo + "/" + rivalScore.rank[1] }</td>, [rivalScore.scorePts, 0]];
	}
	return {
		"name": name, "key": "o-place", "widthRec": w,
		"mainFun": compFun,
		"incFun": compFun
	};
}

export function scoreDetCol(name: string, w: number, dsScore?: UserScoreMetaMap): DetColumn
{
	return {
		"name": name, "key": "score", "widthRec": w,
		"mainFun": (score: UserScore, i: number) => {
			var basePts = score.scorePts * 100;
			if (dsScore) {
				//const starKey = statKey(score);
				const starScore = lookupStarMap(dsScore[keyIdent(score.id)].starMap, score);
				if (starScore !== null) basePts = starScore.basePts;
			}
			// daily star rounds to 1 decimal point, 0 if integer
			const baseText = dsScore ? dsRound(basePts) : basePts.toFixed(2);
			return [<td className="time-cell" key="score">{ baseText }</td>, [i, 0]];
		},
		"incFun": (score: IncScore, i: number) => {
			var s = "-";
			if (score.rank !== null) {
				var rs = rankPts([score.rank, score.playTotal]) * 100;
				s = dsScore ? dsRound(rs) : rs.toFixed(2);
			}
			return [<td className="time-cell" data-complete="false" key="score">{ s }</td>, [i, 1]];
		}
	};
}

export function otherScoreDetCol(name: string, w: number, rival: Ident, userMap: UserStatMap, altFlag: boolean): DetColumn
{
	const rivalSx = userMap.stats[keyIdent(rival)];
	const compFun = (score: UserScore | IncScore, i: number, starData: StxStarData): [React.ReactNode, number[]] => {
		// build time node	
		var rivalScore = getStarUserStats(rivalSx, score, altFlag);
		if (rivalScore === null) {
			return [<td className="time-cell" data-complete="false" key="o-score">-</td>, [-1, i]];
		}
		var basePts = rivalScore.scorePts * 100;
		return [<td className="time-cell" key="o-score">{ basePts.toFixed(2) }</td>, [-basePts, 0]];
	}
	return {
		"name": name, "key": "o-score", "widthRec": w,
		"mainFun": compFun,	"incFun": compFun
	};
}

export function diffScoreDetCol(name: string, w: number, rival: Ident, userMap: UserStatMap, altFlag: boolean): DetColumn
{
	const rivalSx = userMap.stats[keyIdent(rival)];
	const compFun = (score: UserScore | IncScore, i: number, starData: StxStarData): [React.ReactNode, number[]] => {
		// find normal pts
		var anyTime = false;
		var bothTime = true;
		var myPts = 0;
		if (score.comp) {
			myPts = score.scorePts * 100;
			anyTime = true
		} else bothTime = false;
		// find rival pts
		var rivalScore = getStarUserStats(rivalSx, score, altFlag);
		var rivalPts = 0;
		if (rivalScore !== null) {
			rivalPts = rivalScore.scorePts * 100;
			anyTime = true;
		} else bothTime = false;
		// build time node
		if (!anyTime) return [<td className="time-cell" data-complete="false" key="diff-score">-</td>, [999, i]];
		var diff = myPts - rivalPts;
		// calculate color -- (table neutral) #C0C0E8
		// -- (full blue) #6060E8 - (lowest blue) #B0B0E8
		// -- (lowest red) #C8C0E0 -- (full red) #C86060
		var [r, g, b] = [192, 192, 232];
		if (diff > 0) {
			r = Math.ceil(((diff * 96) + ((100 - diff) * 176)) / 100);
			g = Math.ceil(((diff * 96) + ((100 - diff) * 176)) / 100);
		} else if (diff < 0) {
			r = 200;
			g = Math.ceil(((-diff * 96) + ((100 + diff) * 176)) / 100);
			b = Math.ceil(((-diff * 96) + ((100 + diff) * 224)) / 100);
		}
		var color = "#" + (r.toString(16).padStart(2, '0')) + (g.toString(16).padStart(2, '0')) + (b.toString(16).padStart(2, '0'));
		return [<td className="time-cell" style={{ backgroundColor: color }}
			data-complete={ bothTime.toString() } key="diff-score">{ diff.toFixed(2) }</td>, [-diff, 0]];
	}
	return {
		"name": name, "key": "diff-score", "widthRec": w,
		"mainFun": compFun,	"incFun": compFun
	};
}

export function timeDetCol(name: string, w: number, altFlag: boolean, cSpan?: number): DetColumn
{
	var colSpan = 2;
	if (cSpan !== undefined) colSpan = cSpan;
	return {
		"name": name, "key": "time", "colSpan": colSpan, "widthRec": w,
		"mainFun": (score: UserScore, i: number, starData: StxStarData) => {
			// do not display offset for cutscene / mergeOffset stars unless show alternates is on
			var starDef = score.starDef;
			var showOffset = true;
			if (starDef.alt !== null && !altFlag &&
				(starDef.alt.status === "cutscene" || starDef.alt.status === "mergeOffset")) showOffset = false;
			// build time node
			const timeNode = <TimeCell timeDat={ score.timeDat } verOffset={ starData.vs } hideStratOffset={ !showOffset }
				colSpan={ colSpan } active={ false } onClick={ () => {} } hiddenFlag={ false } key="time"/>
			return [timeNode, [score.timeDat.rawTime, 0]];
		},
		"incFun": (score: IncScore, i: number, starData: StxStarData) => {
			// do not display offset for cutscene / mergeOffset stars unless show alternates is on
			var starDef = score.starDef;
			var showOffset = true;
			if (starDef.alt !== null && !altFlag &&
				(starDef.alt.status === "cutscene" || starDef.alt.status === "mergeOffset")) showOffset = false;
			// build time node
			var timeNode: React.ReactNode = <td className="time-cell" colSpan={ colSpan } key="time">-</td>;
			if (score.timeDat !== null) {
				timeNode = (<TimeCell timeDat={ score.timeDat } verOffset={ starData.vs } hideStratOffset={ !showOffset }
					colSpan={ colSpan } complete={ "false" } active={ false }
					onClick={ () => {} } hiddenFlag={ false } key="time"/>);
			}
			return [timeNode, [999999, i]];
		}
	};
}

export function otherTimeDetCol(name: string, w: number, altFlag: boolean, rival: Ident, userMap: UserStatMap): DetColumn
{
	const rivalSx = userMap.stats[keyIdent(rival)];
	const compFun = (score: UserScore | IncScore, i: number, starData: StxStarData): [React.ReactNode, number[]] => {
		// do not display offset for cutscene / mergeOffset stars unless show alternates is on
		var starDef = score.starDef;
		var showOffset = true;
		if (starDef.alt !== null && !altFlag &&
			(starDef.alt.status === "cutscene" || starDef.alt.status === "mergeOffset")) showOffset = false;
		// build time node	
		var rivalScore = getStarUserStats(rivalSx, score, altFlag);
		if (rivalScore === null) return [<td className="time-cell" colSpan={ 2 } key="o-time">-</td>, [999999, i]];
		const timeNode = <TimeCell timeDat={ rivalScore.timeDat } verOffset={ starData.vs } hideStratOffset={ !showOffset }
			active={ false } onClick={ () => {} } hiddenFlag={ false } key="o-time"/>
		return [timeNode, [rivalScore.timeDat.rawTime, 0]];
	}
	return {
		"name": name, "key": "o-time", "colSpan": 2, "widthRec": w,
		"mainFun": compFun,	"incFun": compFun
	};
}

export function recordDetCol(name: string, w: number, altFlag: boolean): DetColumn
{
	const recFun = (starData: StxStarData, comp: boolean, alt: AltType): [TimeDat, React.ReactNode] => {
		// do not display offset for cutscene / mergeOffset stars unless show alternates is on
		var starDef = starData.starDef;
		var showOffset = true;
		if (starDef.alt !== null && !altFlag &&
			(starDef.alt.status === "cutscene" || starDef.alt.status === "mergeOffset")) showOffset = false;
		// read record data
		var recordDat = recordStxStarData(starData, alt);
		return [recordDat, <TimeCell timeDat={ recordDat } verOffset={ starData.vs } hideStratOffset={ !showOffset }
			complete={ comp.toString() } active={ false } onClick={ () => {} } hiddenFlag={ false } key="best"/>];
	};

	return {
		"name": name, "key": "best", "colSpan": 2, "widthRec": w,
		"mainFun": (score: UserScore, i: number, starData: StxStarData) => {
			const [recordDat, node] = recFun(starData, true, score.alt);
			return [node, [recordDat.rawTime]];
		},
		"incFun": (score: IncScore, i: number, starData: StxStarData) => {
			const [recordDat, node] = recFun(starData, false, score.alt);
			return [node, [recordDat.rawTime]];
		}
	};
}

export function rankDetCol(scoreData: ScoreCache, scoreFilter: ScoreFilter, id: Ident, name: string, w: number): DetColumn
{
	const userKey = keyIdent(id);
	const rankFun = (score: StarRef<AltType>, comp: boolean): [string, React.ReactNode] => {
		var rankName = "Unranked";
		// get user rank data
		const userRankMap = getRankScoreCache(scoreData, scoreFilter);
		var userStarMap = userRankMap[userKey];
		if (userStarMap !== undefined) {
			// get star rank
			var _rankName = lookupStarMap(userStarMap, score);
			if (_rankName != null) rankName = _rankName;
			//var [starKey, alt] = starOnlyKey(score);
			//var rankData = userStarMap[starKey];
			/*if (rankData !== undefined) {
				if (alt.state === null && rankData.combRank) rankName = rankData.combRank;
				else if (alt.state === "alt" && rankData.altRank) rankName = rankData.altRank;
				else if (alt.state !== "alt") rankName = rankData.mainRank;
			}*/
		}
		// styling
		var dc = comp;
		var style: any = { "opacity": "0.875" } ;
		if (!dc) {
			style.opacity = "0.7";
			style["fontStyle"] = "italic";
		}
		return [rankName, <td className="time-cell" style={ style } data-ps={ rankName } key="bestRank">{ rankName }</td>];
	};

	return {
		"name": name, "key": "bestRank", "widthRec": w,
		"mainFun": (score: UserScore) => {
			const [rankName, node] = rankFun(score, score.comp);
			return [node, [getRankValue(rankName), 0]];
		},
		"incFun": (score: IncScore) => {
			const [rankName, node] = rankFun(score, score.comp);
			return [node, [getRankValue(rankName), 1]];
		}
	};
}

export function rankPtsDetCol(name: string, w: number, dsScore?: UserScoreMetaMap): DetColumn
{
	return {
		"name": name, "key": "rankPts", "widthRec": w,
		"mainFun": (score: UserScore, i: number) => {
			var rankPts = 0;
			if (dsScore) {
				//const starKey = statKey(score);
				//const starScore = dsScore[keyIdent(score.id)].starMap[starKey];
				const starScore = lookupStarMap(dsScore[keyIdent(score.id)].starMap, score);
				if (starScore !== null) rankPts = starScore.rankPts;
			}
			return [<td className="time-cell" key="rankPts">{ rankPts }</td>, [-rankPts, 0]];
		},
		"incFun": (score: IncScore, i: number) => {
			return [<td className="time-cell" data-complete="false" key="rankPts">-</td>, [1, i]];
		}
	};
}

export function bestStratDetCol(name: string, w: number, dsScore?: UserScoreMetaMap): DetColumn
{
	return {
		"name": name, "key": "bestStrat", "widthRec": w,
		"mainFun": (score: UserScore, i: number) => {
			var bestStrat = "-";
			var sortId = i;
			if (dsScore) {
				//const starKey = statKey(score);
				//const starScore = dsScore[keyIdent(score.id)].starMap[starKey];
				const starScore = lookupStarMap(dsScore[keyIdent(score.id)].starMap, score);
				if (starScore !== null && starScore.bestStrat !== null) {
					bestStrat = starScore.bestStrat;
					sortId = -starScore.stratPts;
				}
			}
			return [<td className="time-cell" key="bestStrat">{ bestStrat }</td>, [sortId, 0]];
		},
		"incFun": (score: IncScore, i: number) => {
			return [<td className="time-cell" data-complete="false" key="bestStrat">-</td>, [i, 1]];
		}
	};
}

export function stratPtsDetCol(name: string, w: number, dsScore?: UserScoreMetaMap): DetColumn
{
	return {
		"name": name, "key": "stratScore", "widthRec": w,
		"mainFun": (score: UserScore, i: number) => {
			var stratPts = 0;
			var placeNote: string[] = [];
			if (dsScore) {
				//const starKey = statKey(score);
				//const starScore = dsScore[keyIdent(score.id)].starMap[starKey];
				const starScore = lookupStarMap(dsScore[keyIdent(score.id)].starMap, score);
				if (starScore) {
					if (starScore.bestStrat === null) {
						return [<td className="time-cell" data-complete="false" key="stratScore">-</td>, [1, i]];
					}
					stratPts = starScore.stratPts;
					placeNote = [(starScore.stratPlace[0] + 1) + "/" + starScore.stratPlace[1]];
				}
			}
			return [<InfoCell key="stratScore" text={ dsRound(stratPts) } note={ placeNote }/>, [-stratPts, 0]];
		},
		"incFun": (score: IncScore, i: number) => {
			return [<td className="time-cell" data-complete="false" key="stratScore">-</td>, [1, i]];
		}
	};
}

export function totalPtsDetCol(name: string, w: number, dsScore?: UserScoreMetaMap): DetColumn
{
	return {
		"name": name, "key": "totalPts", "widthRec": w,
		"mainFun": (score: UserScore, i: number) => {
			var totalPts = 0;
			if (dsScore) {
				//const starKey = statKey(score);
				//const starScore = dsScore[keyIdent(score.id)].starMap[starKey];
				const starScore = lookupStarMap(dsScore[keyIdent(score.id)].starMap, score);
				if (starScore) totalPts = starScore.totalPts;
			}
			return [<td className="time-cell" key="totalPts">{ dsRound(totalPts) }</td>, [-totalPts, 0]];
		},
		"incFun": (score: IncScore, i: number) => {
			return [<td className="time-cell" data-complete="false" key="totalPts">-</td>, [1, i]];
		}
	};
}