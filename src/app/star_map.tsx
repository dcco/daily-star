
import { StarDef } from './org_star_def'

	/*
		TODO - de-duplicate
	*/

export const PERM = ["bob", "wf", "jrb", "ccm", "bbh", "hmc", "lll", "ssl",
	"ddd", "sl", "wdw", "ttm", "thi", "ttc", "rr", "sec", "bow"];

export function starKeyExtern(stageId: number, starDef: StarDef): string
{
	return PERM[stageId] + "_" + starDef.id;
}

	/*
		star ref: identifies the original star + a specific alternate if relevant
	*/

export type StarRef<K> = {
	"stageId": number,
	"starDef": StarDef,
	"alt": K
}

export function specStarRef<K>(star: StarDef, alt: K): StarRef<K> {
	return {
		"stageId": star.stageId,
		"starDef": star,
		"alt": alt
	};
}

export function dropStarRef<K, L>(ref: StarRef<K>, alt: L): StarRef<L> {
	return {
		"stageId": ref.stageId,
		"starDef": ref.starDef,
		"alt": alt
	};
}

	/*
		generic type for mappings of data per-star, treating alts separately
	*/

type BackRef<K, V> = {
	v: V,
	ref: StarRef<K>
};

function dropBackRef<K, L, V>(ref: BackRef<K, V>, alt: L): BackRef<L, V> {
	return {
		"v": ref.v,
		"ref": dropStarRef(ref.ref, alt)
	};
}

export type StarMap<K, V> = {
	keyFun: (k: StarRef<K>) => string,
	dat: { [data: string]: BackRef<K, V> }
}

export function addStarMap<K, V>(m: StarMap<K, V>, k: StarRef<K>, v: V)
{ 
	m.dat[m.keyFun(k)] = {
		"v": v,
		"ref": k
	};
}

export function lookupStarMap<K, V>(m: StarMap<K, V>, k: StarRef<K>, srcAlt?: K): V | null
{
	if (srcAlt) k = dropStarRef(k, srcAlt);
	const key = m.keyFun(k);
	if (m.dat[key] === undefined) return null;
	return m.dat[key].v;
}

export function unsafeLookupStarMap<K, V>(m: StarMap<K, V>, k: StarRef<K>, srcAlt?: K): V
{
	if (srcAlt) k = dropStarRef(k, srcAlt);
	const key = m.keyFun(k);
	if (m.dat[key] === undefined) {
		console.log("map + key: ", m, k);
		throw "Failed unsafe lookup.";
	}
	return m.dat[key].v;
}

export function toListStarMap<K, V>(m: StarMap<K, V>): [StarRef<K>, V][]
{
	return Object.entries(m.dat).map((e) => [e[1].ref, e[1].v]);
}

	/*
		alt type:
		* null - alternate does not exist OR data includes both variants
		* main/alt - information relates to a specific variant
	*/

export type AltType = null | "main" | "alt";
export type AltTypeEx = AltType | "comb";

	// - returns list of alt sub-refs (as relevant to star time storage)

export function altListStarRef(ref: StarDef): StarRef<AltType>[] {
	if (ref.alt === null) return [specStarRef(ref, null)];
	const alt = ref.alt;
	// only main + alt is stored, except in offset + mergeOffset case (where they can be reasonably combined)
	var altList: AltType[] = ["main", "alt"];
	if (alt.status === "offset" || alt.status === "mergeOffset") altList = [null, "main", "alt"];
	return altList.map((alt) => specStarRef(ref, alt));
}

export function canCombStarRef(ref: StarDef): boolean {
	if (ref.alt === null) return false;
	const alt = ref.alt;
	return alt.status === "cutscene" || alt.status === "mergeOffset";
}

export function starCodeFull<K>(k: StarRef<K>): string {
	const baseKey = k.stageId + "_" + k.starDef.id;
	if (k.alt === null) return baseKey;
	return baseKey + "_" + k.alt;
}

export function starCodeBase<K>(k: StarRef<K>): string {
	return k.stageId + "_" + k.starDef.id;
}

	/*
		functions for specific types of star maps
	*/

export function newStarMapAlt<V>(): StarMap<AltType, V>
{
	return {
		"dat": {},
		"keyFun": starCodeFull
	};
}

export function newStarMapAltEx<V>(): StarMap<AltTypeEx, V>
{
	return {
		"dat": {},
		"keyFun": starCodeFull
	};
}

export function tryCombStarMap<K, V>(m: StarMap<K, V>, k: StarDef, f: (a: V, b: V) => V, _def: K)
{
	const baseKey = k.stageId + "_" + k.id;
	const a = m.dat[baseKey + "_main"];
	const b = m.dat[baseKey + "_alt"];
	var v: V | null = null;
	// get combined value
	if (a !== undefined && b !== undefined) v = f(a.v, b.v);
	else if (a !== undefined) v = a.v;
	else if (b !== undefined) v = b.v;
	// if value was found, add to map
	if (v === null) return;
	var newObj: BackRef<K, V> = {
		"v": v,
		"ref": specStarRef(k, _def)
	};
	const newKey = m.keyFun(newObj.ref);
	if (m.dat[newKey] === undefined) m.dat[newKey] = newObj;
	/*if (a !== undefined && b !== undefined) {
	} else if (a !== undefined) {

	}*/
}

export function eitherCombStarMap<K, V>(m: StarMap<K, V>, k: StarDef, f: (a: V, b: V) => V, _def: K)
{
	// check availability of key
	const newRef = specStarRef(k, _def);
	const newKey = m.keyFun(newRef);
	if (m.dat[newKey] !== undefined) return;
	// get combined value
	const baseKey = k.stageId + "_" + k.id;
	const a = m.dat[baseKey + "_main"];
	const b = m.dat[baseKey + "_alt"];
	var v: V | null = null;
	if (a !== undefined && b !== undefined) v = f(a.v, b.v);
	else if (a !== undefined) v = a.v;
	else if (b !== undefined) v = b.v;
	// if value was found, add to map
	if (v === null) return;
	var newObj: BackRef<K, V> = {
		"v": v,
		"ref": newRef
	};
	m.dat[newKey] = newObj;
}

	/*
		removes stars that we dont want to use
		- doesn't strictly need star-set, but makes it esaier for us
	*/

export function cleanupStarMap<V>(starSet: StarDef[], m: StarMap<AltTypeEx, V>, split: boolean, dsFlag: boolean): StarMap<AltType, V>
{
	var newMap: StarMap<AltType, V> = { "dat": {}, "keyFun": starCodeFull };
	for (const starDef of starSet) {
		const baseKey = starDef.stageId + "_" + starDef.id;
		// no alt case
		if (starDef.alt === null) {
			if (m.dat[baseKey]) newMap.dat[baseKey] = dropBackRef(m.dat[baseKey], null);
		} else if (starDef.alt.status === "offset" || (starDef.alt.status === "mergeOffset" && dsFlag)) {
			// offset case clean up based on splitting
			if (split) {
				if (m.dat[baseKey + "_main"]) newMap.dat[baseKey + "_main"] = dropBackRef(m.dat[baseKey + "_main"], "main");
				if (m.dat[baseKey + "_alt"]) newMap.dat[baseKey + "_alt"] = dropBackRef(m.dat[baseKey + "_alt"], "alt");
			} else if (m.dat[baseKey]) newMap.dat[baseKey] = dropBackRef(m.dat[baseKey], null);
		} else if (starDef.alt.status === "cutscene" || starDef.alt.status === "mergeOffset") {
			// for combination cases, we always want only the combination
			if (m.dat[baseKey + "_comb"]) newMap.dat[baseKey] = dropBackRef(m.dat[baseKey + "_comb"], null);
		} else if (starDef.alt.status === "diff") {
			// diff case always keeps both
			if (m.dat[baseKey + "_main"]) newMap.dat[baseKey + "_main"] = dropBackRef(m.dat[baseKey + "_main"], "main");
			if (m.dat[baseKey + "_alt"]) newMap.dat[baseKey + "_alt"] = dropBackRef(m.dat[baseKey + "_alt"], "alt");
		}
	}
	// removes phantom keys (this is necessary to remove explicit "undefined" mappings)
	/*for (const key of Object.keys(newMap.dat)) {
		if (newMap.dat[key] === undefined) delete newMap.dat[key];
	}*/
	return newMap;
}

	/*
		a simpler star map that maps data to stars wholesale (used to nest strat maps)
	*/

type WeakRef<T> = {
	v: T,
	star: StarDef
}

export type WeakStarMap<T> = {
	dat: { [data: string]: WeakRef<T> }
}

export function starCodeW(k: StarDef): string {
	return k.stageId + "_" + k.id;
}

export function lookupStarMapW<T>(m: WeakStarMap<T>, k: StarDef): T | null
{
	const key = k.stageId + "_" + k.id;
	if (m.dat[key] === undefined) return null;
	return m.dat[key].v;
}

export function rawLookupStarMapW<T>(m: WeakStarMap<T>, key: string): T | null
{
	if (m.dat[key] === undefined) return null;
	return m.dat[key].v;
}

export function addStarMapW<T>(m: WeakStarMap<T>, k: StarDef, v: T)
{
	m.dat[k.stageId + "_" + k.id] = {
		"v": v,
		"star": k
	};
}

	/*
		alt state: represents both what variant of a star is being used
			and what variants it was compared against.
		* state - whether the data represents the alt or the main (null = no alternates originally)
		* source - the original comparison this alt comes from
	*/
/*
export type AltState = {
	"state": null | "main" | "alt",
	"source": "all" | "self"
}

export function nullAlt(source: "all" | "self"): AltState {
	return { "state": null, "source": source }
}

export function mainAlt(): AltState {
	return { "state": "main", "source": "self" }
}

export function secondAlt(): AltState {
	return { "state": "alt", "source": "self" }
}
*/







	/*
		type for mappings of data per-star (variant blind)

type BackRef<T> = {
	v: T,
	starDef: StarDef
};

export type StarMap<T> = {
	dat: { [data: string]: BackRef<T> }
};

function starCode(k: StarDef): string {
	return k.stageId + "_" + k.id;
}

export function addStarMap<T>(m: StarMap<T>, k: StarDef, v: T)
{ 
	m.dat[starCode(k)] = {
		"v": v,
		"starDef": k
	};
}

export function lookupStarMap<T>(m: StarMap<T>, k: StarDef): T | null
{
	const key = starCode(k);
	if (m.dat[key] === undefined) return null;
	return m.dat[key].v;
}
	*/