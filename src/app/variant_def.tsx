
	/*
		verf: "jp" | "us" - definite version
		ver: "jp" | "us" | "both" - original version of an xcam row ("both" if version not applicable)

		variant: [number, string] - a tuple of the format [0, "name"]
			comprising of a (0-indexed) variant index, and a variant group name
			[-1] is used to explicitly specify "N/A" option
		
		-- we choose to use the JSON numeric id for the variant for convenience,
			the actual strat name doesnt matter until actually sending the information to the database
	*/

export type VerF = "jp" | "us";
export type Ver = "jp" | "us" | "both";
export type Variant = [number, string];

	/*
		ver_info: explicitly states version info about a strat (when a version difference exists)
		  * def: default version (must have either "jp" or "us")
		  * jpFlag: relevant to JP
		  * usFlag: relevant to US
	*/

export type VerInfo = {
	"def": VerF,
	"jpFlag": boolean,
	"usFlag": boolean
}

	/*
		variant_set: a mapping of numeric ids to booleans

		variant_group: a list of variants to select from
		  * name: group name, used for submission to the database 
		  * list: numeric list of variant ids
		  		(N/A option exists but is included implicitly)
	*/

export type VarSet = {
	[key: string]: boolean
};

export type VarGroup = {
	"name": string,
	"list": number[]
}

export function buildVarGroups(variants: string[], varGroups: string[][]): VarGroup[]
{
	// start with pre-existing groups
	var usedVars: string[] = [];
	var allGroups = varGroups.map((l) => {
		// split the group name from the var ids
		var numList = l.map((v) => v);
		var groupName = numList.shift();
		if (groupName === undefined) {
			console.log(varGroups);
			throw('Undefined group name while generating variants.');
		}
		// add group to the list
		usedVars = usedVars.concat(numList);
		return { "name": groupName, "list": numList.map((i) => parseInt(i)) };
	}); 
	// add remaining variables as individual groups
	variants.map((x, i) => {
		if (!usedVars.includes("" + i)) {
			allGroups.push({ "name": variants[i], "list": [i] });
		}
	})
	return allGroups;
}

export function filterVarGroups(varTable: VarGroup[], varSet: VarSet): VarGroup[]
{
	return varTable.filter((group) => {
		var varFlag = false;
		group.list.map((x) => { if (varSet["" + x] !== undefined) varFlag = true });
		return varFlag;
	})
}

	/*
		variant_space: abstract definition of all possible version + variant combinations for a strat.
		  * stratName: stored in the variant space for convenience
		  * variants: raw list of variant names taken from the star def
		  * verInfo: version information about the strat (null if it doesn't matter)
		  * varTable: table of groups representing options for a variant
	*/

export type VarSpace = {
	"stratName": string,
	"variants": string[],
	"verInfo": VerInfo | null,
	"varTable": VarGroup[]
}

export function defVerVarSpace(vs: VarSpace): Ver
{
	if (vs.verInfo === null) return "both";
	return vs.verInfo.def;
}

export function findGroupVarSpace(vs: VarSpace, i: number): VarGroup {
	for (const group of vs.varTable) {
		if (group.list.includes(i)) return group;
	}
	throw('Could not find variant ' + i + ' in variant space ' + vs.stratName + '.');
}

	/*
		variant_list: a list of variants. may not necessarily be complete,
			missing entries must be treated as missing (differs from the xcam sheet defs)
	*/

export function buildVarList(vs: VarSpace, rawList: string[]): Variant[]
{
	return rawList.map((rawId) => {
		var i = parseInt(rawId);
		var group = findGroupVarSpace(vs, i);
		return [i, group.name];
	});
}

	/*
		variant_map: stores currently selected variants,
			maps groups to variants
	*/

export type VariantMap = { [key: string]: Variant };

export function toListVarMap(sel: VariantMap): Variant[]
{
	return Object.entries(sel).map((entry) => entry[1]);
}

	/* -- extra conversions */

export function toMapVarList(vList: Variant[]): VariantMap
{
	var sel: VariantMap = {};
	for (const [i, groupName] of vList) {
		sel[groupName] = [i, groupName];
	}
	return sel;
}