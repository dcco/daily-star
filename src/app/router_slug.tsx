
import orgData from './json/org_data.json'

const PERM = ["bob", "wf", "jrb", "ccm", "bbh", "hmc", "lll", "ssl",
	"ddd", "sl", "wdw", "ttm", "thi", "ttc", "rr", "sec", "bow"];

export function stageShort(stageId: number): string | null
{
	if (stageId < 0 || stageId > 14) return null;
	return PERM[stageId].toUpperCase();
}

export function procStarSlug(slug?: string): [number, string, number]
{
	if (slug === undefined) return [0, "", 0];
	var ss = slug.split("_");
	if (ss.length < 2) return [0, "", 0];
	// get stage id
	var stageId = 0;
	PERM.map((p, i) => { if (p === ss[0]) stageId = i });
	// get star id
	var starList = orgData[stageId].starList;
	var starId = 0;
	starList.map((starDef, i) => { if (starDef.id === ss[1]) starId = i });
	return [stageId, ss[1], starId]; 
}

export function makeStarSlug(stageId: number, starId: string): string
{
	return PERM[stageId] + "_" + starId;
}