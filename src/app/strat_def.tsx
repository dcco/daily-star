
	/*
		row_id: [string, int] - a tuple referencing an xcam sheet + row id
		ver: "jp" | "us" | "both" - original version of an xcam row
			null - unknown

		row_def: definition of an xcam row
		* name: string - parent strat name
		* ver: ver - version
		* variant_list: array[string] - list of variants used by row
	*/

export type VerF = "jp" | "us";
export type Ver = "jp" | "us" | "both";
export type RowId = [string, number];

export type RowDef = {
	"name": string,
	"ver": Ver,
	"variant_list": string[]
};

export function newRowDef(name: string, ver: Ver, v_list: string[]): RowDef
{
	if (v_list === undefined) throw("Attempted to create row definition for " + name + " with undefined variant list.");
	return {
		"name": name,
		"ver": ver,
		"variant_list": v_list
	};
}

export function zeroRowDef(name: string): RowDef
{
	return newRowDef(name, "jp", []);
}

export function begRowDef(name: string): RowDef
{
	return newRowDef(name, "both", []);
}

	/*
		PRIVATE ver_map: an abstraction that maps an xcam row (row_id) to a version
			operates normally even if undefined is passed
			(returns "other" if lookup fails, other itself may be null)
	*/

type VerMap = {
	"data": { [key: string]: Ver },
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
	var ver = verMap.data[ref[0] + "_" + ref[1]]
	if (ver !== undefined) return ver;
	return verMap.other;
}

function addVerMap(verMap: VerMap | undefined, ref: RowId, v: Ver)
{
	if (verMap === undefined) throw ("Attempted to add version information for " + ref[0] + "_" + ref[1] + " to uninitialized version map.");
	verMap.data[ref[0] + "_" + ref[1]] = v;
}

	/*
		strat_def: defines a strat, encompassing its xcam rows + information about them
		* name: string - name of the strat
		* diff: string - difficulty identifier (purely visual)
		* ver_diff: bool - flag stating whether JP/US have a difference
		* virtual: bool - indicates whether the strat comes from an xcam sheet or not
		* virtId: string? - if the strat is virtual, gives a key for the virtual sheet
		* id_list: array[row_id] - a list of xcam row references
		* variant_map: strat_id => array[string] - maps an xcam row to a list of its variants 
		* ver_map: ver_map 
	*/

type VariantMap = {
	[key: string]: string[]
}

export type StratDef = {
	"name": string,
	"diff": string,
	"ver_diff": boolean,
	"virtual": boolean,
	"virtId": string | undefined,
	"id_list": RowId[],
	"variant_map": VariantMap,
	"ver_map": VerMap | undefined
};

export function newStratDef(name: string, diff: string, ver_diff: boolean,
	virtual: boolean, virtId: string | undefined, id_list: RowId[], variant_map: VariantMap): StratDef
{
	return {
		"name": name,
		"diff": diff,
		"ver_diff": ver_diff,
		"virtual": virtual,
		"virtId": virtId,
		"id_list": id_list,
		"variant_map": variant_map,
		"ver_map": undefined
	}
}

export function copyStratDef(stratDef: StratDef): StratDef
{
	return {
		"name": stratDef.name,
		"diff": stratDef.diff,
		"ver_diff": stratDef.ver_diff,
		"virtual": stratDef.virtual,
		"virtId": stratDef.virtId,
		"id_list": stratDef.id_list,
		"variant_map": stratDef.variant_map,
		"ver_map": stratDef.ver_map
	}
}

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
}

	/* because the original organizational structure is fractured, this lookup must be done in parts */

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
}

	/* functions for specific rows of a strat_def */
/*

export function rowTimeDatStratDef(sDef, ref, time)
{
	var ver = rowVerStratDef(sDef, ref);
	var vList = rowVariantListStratDef(sDef, ref);
	return newTimeDat(sDef.name, time, ver, vList);
}*/

	/*
		strat_set: a mapping of strat names into strat defs
	*/

export type StratSet = {
	[key: string]: StratDef
}

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
}

export function hasExtStratSet(vs: [string, StratDef][]): boolean {
	for (const [name, strat] of vs) {
		for (const ref of strat.id_list) {
			if (ref[0] === "ext") return true;
		}
	}
	return false;
}

export function filterExtStratSet(vs: StratSet): StratSet {
	var vsx: StratSet = {};
	Object.entries(vs).map((strat) => {
		var [stratName, stratDef] = strat;
		var newDef = copyStratDef(stratDef);
		newDef.id_list = newDef.id_list.filter((ref) => ref[0] === 'main');
		vsx[stratName] = newDef;
	});
	return vsx;
}

	/*
		column_list: a list of [index, strat definition] tuples
	*/

export type ColList = [number, StratDef][];

export type IndexSet = { [key: string]: number };

export function stratSetToColList(vs: StratSet): ColList {
	var colList: ColList = [];
	Object.entries(vs).map((strat, i) => {
		var [stratName, stratDef] = strat;
		if (stratDef.virtual || stratDef.id_list.length !== 0) colList.push([i, stratDef]);
	});
	return colList;
}

export function toStratSet(list: ColList): [StratSet, IndexSet] {
	var vs: StratSet = {};
	var is: IndexSet = {};
	for (let i = 0; i < list.length; i++) {
		var [ix, obj] = list[i];
		vs[obj.name] = obj;
		// special parameter to remember column id
		is[obj.name] = i;
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