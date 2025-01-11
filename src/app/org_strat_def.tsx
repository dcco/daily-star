
import { Ver, VerInfo, VarSpace, buildVarList } from './variant_def'
import { RowDef, newRowDef } from './row_def'

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
		PRIVATE ver_map: an abstraction that maps an xcam row (row_id) to a version
			operates normally even if undefined is passed
			(returns "other" if lookup fails, other itself may be null)
	*/
/*
type VerMap = {
	"data": RowIdMap<Ver>,
	"other": Ver | null
};

function newVerMap(ver: Ver | null): VerMap
{
	return {
		"data": {},
		"other": ver
	};
}

function lookupVerMap(verMap: VerMap | undefined, ref: RowId): Ver | null
{
	if (verMap === undefined) return null;
	var ver = lookupRowMap(ref);
	if (ver !== null) return ver;
	return verMap.other;
}

function addVerMap(verMap: VerMap | undefined, ref: RowId, v: Ver)
{
	if (verMap === undefined) throw ("Attempted to add version information for " + ref[0] + "_" + ref[1] + " to uninitialized version map.");
	addRowMap(verMap, ref, v);
}
*/
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
	'id': string 
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
	if (sDef.virtual && sDef.virtId) virtId = { 'kind': virtKind, 'id': sDef.virtId };
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
		"virtId": { 'kind': 'open', 'id': virtId },
		"vs": vs,
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

function filterExtStratDef(sDef: StratDef): StratDef
{
	var newDef = copyStratDef(sDef);
	// it's ok to ignore beg/open, because these only have to be accurate for xcam sheet rows
	newDef.id_list = newDef.id_list.filter((ref) => ref[0] === 'main');
	newDef.row_map = filterRefMap(sDef.row_map, (id, rowDef) => rowDef.sheet === 'main');
	return newDef;
}

/*
function specifyVerStratDef(sDef: StratDef, ver: Ver): StratDef
{
	sDef.ver_map = newVerMap(ver);
	return sDef;
}

function containsRef(l: RowId[], ref: RowId): boolean {
	for (let i = 0; i < l.length; i++) {
		var rx = l[i];
		if (ref[0] === rx[0] && ref[1] === rx[1]) return true;
	}
	return false;
}

function mergeRefListVerMap(l1: RowId[], l2: RowId[]): [RowId[], VerMap] {
	var lx: RowId[] = [];
	var ver_map = newVerMap(null);
	l1.map((ref) => {
		lx.push(ref)
		addVerMap(ver_map, ref, "jp");
	});
	l2.map((ref) => {
		if (!containsRef(lx, ref)) {
			lx.push(ref);
			addVerMap(ver_map, ref, "us");
		} else {
			addVerMap(ver_map, ref, "both");
		}
	});
	return [lx, ver_map];
}

function mergeVariantMap(v1: VariantMap, v2: VariantMap): VariantMap {
	var variant_map: VariantMap = {};
	Object.entries(v1).map((entry) => {
		var [ref, l] = entry;
		variant_map[ref] = l;
	});
	Object.entries(v2).map((entry) => {
		var [ref, l] = entry;
		variant_map[ref] = l;
	});
	return variant_map;
}

export function mergeVerStratDef(sDef1: StratDef, sDef2: StratDef): StratDef
{
	// for simplicity, we assume that this function will only be used to merge
	// raw strats that are JP/US variants. meaning:
	// - they originate from the same strat (same name, etc)
	// - they lack initial versioning
	var newDef = copyStratDef(sDef1);
	var [ref_list, ver_map] = mergeRefListVerMap(sDef1.id_list, sDef2.id_list);
	newDef.id_list = ref_list;
	newDef.variant_map = mergeVariantMap(sDef1.variant_map, sDef2.variant_map);
	newDef.ver_map = ver_map;
	return newDef;
}*/


	/* because the original organizational structure is fractured, this lookup must be done in parts */
/*
function verStratDef(sDef: StratDef, ref: RowId): Ver
{
	var ver = lookupVerMap(sDef.ver_map, ref);
	if (ver === null) return "both";
	return ver;
}

function vListStratDef(sDef: StratDef, ref: RowId): string[]
{
	var key = ref[0] + "_" + ref[1];
	if (sDef.variant_map[key] === undefined) {
		console.log(sDef.variant_map);
		throw("Could not find variant map for " + sDef.name + " for variant " + key);
	}
	return sDef.variant_map[key];
}

export function rowDefStratDef(sDef: StratDef, ref: RowId): RowDef
{
	return newRowDef(sDef.name, verStratDef(sDef, ref), vListStratDef(sDef, ref));
}*/

	/*
		strat_set: a mapping of strat names into strat defs
	*/

export type StratSet = {
	[key: string]: StratDef
}
/*
export function mergeStratSet(vs1: StratSet, vs2: StratSet): StratSet
{
	var vsx: StratSet = {};
	Object.entries(vs1).map((strat) => {
		var [stratName, stratDef] = strat;
		if (vs2[stratName] !== undefined) {
			vsx[stratName] = mergeVerStratDef(stratDef, vs2[stratName]);
		} else {
			vsx[stratName] = specifyVerStratDef(stratDef, "jp");
		}
	});
	Object.entries(vs2).map((strat) => {
		var [stratName, stratDef] = strat;
		if (vs1[stratName] === undefined) {
			vsx[stratName] = specifyVerStratDef(stratDef, "us");
		}
	});
	return vsx;
}*/

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

export function filterExtStratSet(vs: StratSet): StratSet {
	var vsx: StratSet = {};
	Object.entries(vs).map((strat) => {
		var [stratName, stratDef] = strat;
		var fDef = filterExtStratDef(stratDef);
		var emptyOpen = (stratName.startsWith("Open") && stratDef.id_list.length === 0);
		if (!emptyStratDef(fDef) && !emptyOpen) vsx[stratName] = fDef;
	})
	/*Object.entries(vs).map((strat) => {
		//var [stratName, stratDef] = strat;
		var newDef = copyStratDef(stratDef);
		newDef.id_list = newDef.id_list.filter((ref) => ref[0] === 'main');
		vsx[stratName] = newDef;
	});*/
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