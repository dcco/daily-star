
import orgData from './json/org_data.json'

const PERM = ["bob", "wf", "jrb", "ccm", "bbh", "hmc", "lll", "ssl",
	"ddd", "sl", "wdw", "ttm", "thi", "ttc", "rr", "sec", "bow"];

export function stageShort(stageId: number): string | null
{
	if (stageId < 0 || stageId > 14) return null;
	return PERM[stageId].toUpperCase();
}

	/*
		returns stage_id (0-16), star slug, and star_id (0-?)
		- default behavior is (0, "", 0)
		- ex: "bob_1" might return 0, "1", 0
	*/

function procRawStarSlug(slug: string): [number, string, number]
{
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

export function procStarSlug(slug?: string): [number, string, number]
{
	if (slug === undefined) return [0, "", 0];
	if (slug.includes(";")) return procRawStarSlug(slug.split(';')[0]);
	return procRawStarSlug(slug);
}

export function makeStarSlug(stageId: number, starId: string): string
{
	return PERM[stageId] + "_" + starId;
}

	/*
		combined season + star slug related actions 
	*/

export function splitSlug(fullSlug: string): [string, number | null]
{
	// dissect history slug
	var slug1 = fullSlug;
	var slug2 = "";
	if (fullSlug.includes(';')) {
		const sll = fullSlug.split(';');
		if (sll[0] !== "null") slug1 = sll[0];
		else slug1 = "";
		slug2 = sll[1];
	}
	// parse season id if real
	var sId: number | null = null;
	if (slug2 !== "" && /^\d+$/.test(slug2)) sId = parseInt(slug2);
	return [slug1, sId];
}

export function prependSeasonSlug(seasonId: number | null, slug: string): string
{
	if (seasonId === null) return slug;
	if (slug === "") return "null;" + seasonId;
	return slug + ";" + seasonId;
}