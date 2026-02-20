
import { Ver, VerInfo, VarSpace, buildVarList } from './variant_def'
import { RowDef, newRowDef } from './row_def'

import { allowStratRule, disallowStratRule } from './org_rules'

	/*
		row_id: [string, int] - a tuple referencing an xcam sheet + row id
	*/

export type RowId = [string, number];
export type RefMap<T> = {
	[key: string]: T
}

export function copyRefMap<T>(m: RefMap<T>): RefMap<T>
{
	var mx: RefMap<T> = {};
	for (const [k, v] of Object.entries(m)) {
		mx[k] = v;
	}
	return mx;
}

export function lookupRefMap<T>(m: RefMap<T>, ref: RowId): T | null
{
	var v = m[ref[0] + "_" + ref[1]];
	if (v === undefined) return null;
	return v;
}

export function readRefMap<T>(m: RefMap<T>, ref: RowId, s: string): T
{
	var v = m[ref[0] + "_" + ref[1]];
	if (v === undefined) throw ('Could not find row definition for row ' + ref[0] + "_" + ref[1] +
		' for some strat [' + s + '].');
	return v;
}

export function addRefMap<T>(m: RefMap<T>, ref: RowId, v: T)
{
	m[ref[0] + "_" + ref[1]] = v;
}

export function mergeRefMap<T>(m1: RefMap<T>, m2: RefMap<T>): RefMap<T>
{
	var mx: RefMap<T> = {};
	for (const [k, v] of Object.entries(m1)) {
		mx[k] = v;
	}
	for (const [k, v] of Object.entries(m2)) {
		mx[k] = v;
	}
	return mx;
}

export function filterRefMap<T>(m: RefMap<T>, f: (k: string, v: T) => boolean): RefMap<T>
{
	var mx: RefMap<T> = {};
	for (const [k, v] of Object.entries(m)) {
		if (f(k, v)) mx[k] = v;
	}
	return mx;
}

	/*
		raw_strat_def: a strat, as defined in the imported json,
			encompassing its xcam rows + information about them
		* name: string - name of the strat
		* diff: string - difficulty identifier (purely visual)
		* ver_diff: bool - flag stating whether JP/US have a difference
		* virtual: bool - indicates whether the strat comes from an xcam sheet or not
		* virtId: string? - if the strat is virtual, gives a key for the virtual sheet
		* id_list: array[row_id] - a list of xcam row references
		* variant_map: row_id => array[string] -
			maps an xcam row to a list of its variants (as string-ified numeric ids)

		the most notable thing is that as originally output, strats do not contain version information
	*/

export type RawVariantMap = RefMap<string[]>;

export type RawStratDef = {
	"name": string,
	"diff": string,
	"ver_diff": boolean,
	"virtual": boolean,
	"virtId": string | undefined,
	"id_list": RowId[],
	"variant_map": RawVariantMap
};

	/*
		virt_id: slightly more detailed version of the virtual id
	*/

export type VirtId = {
	'kind': string,
	'id': string,
	"ver_diff": boolean
}

	/*
		strat_def: a strat after post-processing has been done on it
	*/

export type StratDef = {
	"name": string,
	"diff": string,
	"virtId": VirtId | null,
	"vs": VarSpace,
	"id_list": RowId[],
	"row_map": RefMap<RowDef>
}

export function buildStratDef(sDef: RawStratDef, virtKind: string, ver: Ver, vs: VarSpace): StratDef {
	var rowMap: RefMap<RowDef> = {};
	for (const ref of sDef.id_list) {
		var rowVarList = lookupRefMap(sDef.variant_map, ref);
		if (rowVarList === null) throw('No variant map found for row reference for strat ' + sDef.name);
		var rowDef = newRowDef(sDef.name, ref[0], ver, buildVarList(vs, rowVarList));
		addRefMap(rowMap, ref, rowDef);
	}
	var virtId: VirtId | null = null;
	if (sDef.virtual && sDef.virtId) virtId = { 'kind': virtKind, 'id': sDef.virtId, 'ver_diff': sDef.ver_diff };
	return {
		"name": sDef.name,
		"diff": sDef.diff,
		"virtId": virtId,
		"vs": vs,
		"id_list": sDef.id_list,
		"row_map": rowMap
	};
}

export function openStratDef(virtId: string, second: boolean, vs: VarSpace): StratDef {
	return {
		"name": second ? "Open#Alt" : "Open",
		"diff": second ? "second" : "hard",
		"virtId": { 'kind': 'open', 'id': virtId, 'ver_diff': vs.verInfo !== null },
		"vs": vs,
		"id_list": [],
		"row_map": {}
	};
}

function blankStratDef(sDef: StratDef): StratDef
{
	return {
		"name": sDef.name,
		"diff": sDef.diff,
		"virtId": sDef.virtId,
		"vs": sDef.vs,
		"id_list": [],
		"row_map": {}
	};
}

function copyStratDef(sDef: StratDef): StratDef
{
	return {
		"name": sDef.name,
		"diff": sDef.diff,
		"virtId": sDef.virtId,
		"vs": sDef.vs,
		"id_list": sDef.id_list.map((x) => x),
		"row_map": copyRefMap(sDef.row_map)
	};
}

function emptyStratDef(sDef: StratDef): boolean
{
	return sDef.virtId === null && Object.entries(sDef.row_map).length === 0;
}

function mergeStratDef(sDef1: StratDef, sDef2: StratDef): StratDef
{
	if (sDef1.name !== sDef2.name) throw('Attempted to merge unrelated strat definitions ' + sDef1.name + ' & ' + sDef2.name + '.');
	var newDef = copyStratDef(sDef1);
	for (const ref of sDef2.id_list) {
		if (lookupRefMap(sDef1.row_map, ref) === null) newDef.id_list.push(ref);
	}
	newDef.row_map = mergeRefMap(sDef1.row_map, sDef2.row_map);
	return newDef;
}

function hasExtStratDef(sDef: StratDef): boolean
{
	for (const [k, rowDef] of Object.entries(sDef.row_map)) {
		if (rowDef.sheet === 'ext') return true;
	}
	return false;
}

type PartRes = "yes" | "no" | "maybe"

function isExtOnlyStratDef(sDef: StratDef): PartRes
{
	var rowMapList = Object.entries(sDef.row_map);
	if (rowMapList.length === 0) return "maybe";
	for (const [k, rowDef] of rowMapList) {
		if (rowDef.sheet !== 'ext') return "no";
	}
	return "yes";
}

function filterExtStratDef(sDef: StratDef): StratDef
{
	var newDef = copyStratDef(sDef);
	// it's ok to ignore beg/open, because these only have to be accurate for xcam sheet rows
	newDef.id_list = newDef.id_list.filter((ref) => ref[0] === 'main');
	newDef.row_map = filterRefMap(sDef.row_map, (id, rowDef) => rowDef.sheet === 'main');
	return newDef;
}

function filterVariantStratDef(sDef: StratDef, varFlagList: boolean[]): StratDef
{
	var newDef = copyStratDef(sDef);
	var newIdList = [];
	var newRowMap: RefMap<RowDef> = {};
	for (let i = 0; i < sDef.id_list.length; i++) {
		var rowId = sDef.id_list[i];
		var rowDef = lookupRefMap(sDef.row_map, rowId);
		if (rowDef === null) continue;
		var badRow = false;
		for (const variant of rowDef.variant_list) {
			if (variant[0] !== -1 && !varFlagList[variant[0]]) {
				badRow = true;
			}
		}
		if (!badRow) {
			newIdList.push(rowId);
			addRefMap(newRowMap, rowId, rowDef);
		}
	}
	newDef.id_list = newIdList;
	newDef.row_map = newRowMap;
	return newDef;
}
/*
	this is basically not helpful
export function splitVariantStratDef(sDef: StratDef, vName: string): [StratDef, StratDef]
{
	var def1 = blankStratDef(sDef);
	var def2 = blankStratDef(sDef);
	var vs = sDef.vs;
	for (let i = 0; i < sDef.id_list.length; i++) {
		var rowId = sDef.id_list[i];
		var rowDef = lookupRefMap(sDef.row_map, rowId);
		if (rowDef === null) continue;
		var badRow = false;
		for (const variant of rowDef.variant_list) {
			var [vId, groupName] = variant;
			if (vId === -1) continue;
			if (vs.variants[vId] === vName) badRow = true;
		}
		if (badRow) {
			def2.id_list.push(rowId);
			addRefMap(def2.row_map, rowId, rowDef);
		} else {
			def1.id_list.push(rowId);
			addRefMap(def1.row_map, rowId, rowDef);
		}
	}
	return [def1, def2];
}*/

	/*
		strat_set: a mapping of strat names into strat defs
	*/

export type StratSet = {
	[key: string]: StratDef
}

export function mergeStratSet(vs1: StratSet, vs2: StratSet): StratSet {
	var vsx: StratSet = {};
	for (const [stratName, stratDef] of Object.entries(vs1)) {
		if (vs2[stratName] !== undefined) {
			vsx[stratName] = mergeStratDef(stratDef, vs2[stratName]);
		} else {
			vsx[stratName] = stratDef;
		}
	}
	for (const [stratName, stratDef] of Object.entries(vs2)) {
		if (vs1[stratName] === undefined) {
			vsx[stratName] = stratDef;
		}
	}
	return vsx;
}

export function hasExtStratSet(vs: StratSet): boolean {
	for (const [name, strat] of Object.entries(vs)) {
		if (hasExtStratDef(strat)) return true;
	}
	return false;
}

export function hasExtOnlyStratSet(vs1: StratSet, vs2: StratSet): boolean {
	for (const [name, strat] of Object.entries(vs1)) {
		var r1 = isExtOnlyStratDef(strat);
		if (r1 === "yes" && vs2[name] === undefined) return true;
		if (vs2[name] === undefined) continue;
		var r2 = isExtOnlyStratDef(vs2[name]);
		if ((r1 === "yes" || r2 === "yes") && r1 !== "no" && r2 !== "no") return true;
	}
	var v1Keys = Object.keys(vs1);
	for (const [name, strat] of Object.entries(vs2)) {
		if (!v1Keys.includes(name) && isExtOnlyStratDef(strat) === "yes") return true;
	}
	return false;
}

export function filterExtStratSet(vs: StratSet): StratSet {
	var vsx: StratSet = {};
	Object.entries(vs).map((strat) => {
		var [stratName, stratDef] = strat;
		var fDef = filterExtStratDef(stratDef);
		// keep the strat if not empty + not the auto-generated open column
		var emptyOpen = (stratName.startsWith("Open") && stratDef.id_list.length === 0);
		if (!emptyStratDef(fDef) && !emptyOpen) vsx[stratName] = fDef;
	})
	return vsx;
}

export function filterRulesStratSet(ruleCode: string, vs: StratSet): StratSet {
	var vsx: StratSet = {};
	Object.entries(vs).map((strat) => {
		var [stratName, stratDef] = strat;
		if (disallowStratRule(ruleCode, stratName)) return;
		var fDef =
			allowStratRule(ruleCode, stratName) ? copyStratDef(stratDef) :
			filterExtStratDef(stratDef);
		// keep the strat if not empty + not the auto-generated open column
		var emptyOpen = (stratName.startsWith("Open") && stratDef.id_list.length === 0);
		if (!emptyStratDef(fDef) && !emptyOpen) vsx[stratName] = fDef;
	})
	return vsx;
}

export function filterVirtStratSet(vs: StratSet): StratSet {
	var vsx: StratSet = {};
	Object.entries(vs).map((strat) => {
		var [stratName, stratDef] = strat;
		if (!stratDef.virtId) vsx[stratName] = stratDef;
	})
	return vsx;
}

export function filterVariantStratSet(vs: StratSet, varFlagList: boolean[]): StratSet {
	var vsx: StratSet = {};
	Object.entries(vs).map((strat) => {
		var [stratName, stratDef] = strat;
		var fDef = filterVariantStratDef(stratDef, varFlagList);
		if (!emptyStratDef(fDef)) vsx[stratName] = fDef;
	});
	return vsx;
}

	/*
		column_list: a list of [index, strat definition] tuples
	*/

export type ColList = [number, StratDef][];

export type IndexSet = { [key: string]: number };

export function toListStratSet(vs: StratSet): ColList {
	var colList: ColList = [];
	Object.entries(vs).map((strat, i) => {
		var [stratName, stratDef] = strat;
		colList.push([i, stratDef]);
	});
	return colList;
}

export function findIdColList(list: ColList, name: string): number {
	for (let i = 0; i < list.length; i++) {
		if (list[i][1].name === name) return i;
	}
	return -1;
}

export function toSetColList(list: ColList): [StratSet, IndexSet] {
	var vs: StratSet = {};
	var is: IndexSet = {};
	for (let i = 0; i < list.length; i++) {
		var [ix, obj] = list[i];
		vs[obj.name] = obj;
		// special parameter to remember column id
		is[obj.name] = ix;
	}
	return [vs, is];
}

export function filterVarColList(colList: ColList, variant: number | null): ColList {
	var vList: ColList = [];
	colList.map((_strat) => {
		var [i, strat] = _strat;
		var second = strat.diff.includes("second");
		if ((variant === null) === !second) {
			vList.push([i, strat]);
		}
	})
	return vList;
}