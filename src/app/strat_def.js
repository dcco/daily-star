
	/*
		strat_id: [string, int] - a tuple referencing an xcam sheet + row id
		ver: { jp, us, both }

		ver_map: an abstraction that maps an xcam row (strat_id) to its
			version information (may be undefined)
	*/

export function newVerMap(ver)
{
	return {
		"data": {},
		"other": ver
	};
}

export function lookupVerMap(verMap, ref)
{
	if (verMap === undefined) return null;
	var ver = verMap.data[ref[0] + "_" + ref[1]]
	if (ver !== undefined) return ver;
	return verMap.other;
}

export function addVerMap(verMap, ref, v)
{
	if (verMap === undefined) throw ("Attempted to add version information for " + ref[0] + "_" + ref[1] + " to uninitialized version map.");
	verMap.data[ref[0] + "_" + ref[1]] = v;
}

	/*
		strat_def: defines a strat, encompassing its xcam rows + information about them
		* name: string - name of the strat
		* diff: string - difficulty identifier (purely visual)
		* virtual: bool - indicates whether the strat comes from an xcam sheet or not
		* virtId: string? - if the strat is virtual, gives a key for the virtual sheet
		* id_list: array[strat_id] - a list of xcam row references
		* variant_map: strat_id => array[int] - maps an xcam row to a list of its variants 
		* ver_map: ver_map 
	*/

export function newStratDef(name, diff, virtual, virtId, id_list, variant_map)
{
	return {
		"name": name,
		"diff": diff,
		"virtual": virtual,
		"virtId": virtId,
		"id_list": id_list,
		"variant_map": variant_map
	}
}

export function copyStratDef(stratDef)
{
	return {
		"name": stratDef.name,
		"diff": stratDef.diff,
		"virtual": stratDef.virtual,
		"virtId": stratDef.virtId,
		"id_list": stratDef.id_list,
		"variant_map": stratDef.variant_map
	}
}

export function specifyVerStratDef(sDef, ver)
{
	sDef.ver_map = newVerMap(ver);
	return sDef;
}

function containsRef(l, ref) {
	for (let i = 0; i < l.length; i++) {
		var rx = l[i];
		if (ref[0] === rx[0] && ref[1] === rx[1]) return true;
	}
	return false;
}

function mergeRefListVerMap(l1, l2) {
	var lx = [];
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

export function mergeVerStratDef(sDef1, sDef2)
{
	// for simplicity, we assume that this function will only be used to merge
	// - strats originating from the same strat (same name, etc)
	// - strats lacking an initial version
	var newDef = copyStratDef(sDef1);
	var [ref_list, ver_map] = mergeRefListVerMap(sDef1.id_list, sDef2.id_list);
	newDef.id_list = ref_list;
	newDef.ver_map = ver_map;
	return newDef;
}

	/*
		strat_set: a mapping of strat naemes into strat defs
	*/

export function mergeStratSet(vs1, vs2)
{
	var vsx = {};
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

export function filterExtStratSet(vs) {
	var vsx = {};
	Object.entries(vs).map((strat) => {
		var [stratName, stratDef] = strat;
		var newDef = copyStratDef(stratDef);
		newDef.id_list = newDef.id_list.filter((ref) => ref[0] === 'main');
		vsx[stratName] = newDef;
	});
	return vsx;
}
