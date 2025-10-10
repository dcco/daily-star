
import { VerF } from "../variant_def"

	/*
		used instead of time dats in order to make rank time manipulation more straightforward
			(can store both "versions" of a time, ignores strat offsets)
	*/

export type RankDat = {
	time: number,
	alt: [number, VerF] | null
}

export function newRankDat(time: number): RankDat
{
	return { "time": time, "alt": null };
}

export function maxRankDat(): RankDat
{
	return { "time": 999900, "alt": null };
}

	/*
		rank object data
	*/

type PercRM = { "m": "perc", "rankId": number, "total": number };

export type LocalRankMethod = PercRM | { "m": "interpolate" } | { "m": "force" };

type StratRankTime = {
	"sr": "time",
	"time": RankDat,
	"method": LocalRankMethod
}

type StratRankEmpty = {
	"sr": "none"
}

export type StratRankObj = StratRankTime | StratRankEmpty

export function newRankObj(time: number, rm: LocalRankMethod): StratRankObj
{
	return { "sr": "time", "time": newRankDat(time), "method": rm };
}

export function maxRankObj(rm: LocalRankMethod): StratRankObj
{
	return { "sr": "time", "time": maxRankDat(), "method": rm };
}

export function copyRankObj(obj: StratRankObj): StratRankObj
{
	if (obj.sr === "none") return { "sr": "none" };
	return { "sr": "time", "time": obj.time, "method": obj.method };
}

export function fillAltRankObj(obj: StratRankObj, alt: [number, VerF])
{
	if (obj.sr !== "none") obj.time.alt = alt;
}