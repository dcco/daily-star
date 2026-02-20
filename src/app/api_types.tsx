
import { Ver, serialVarList } from './variant_def'
import { TimeDat } from './time_dat'
import { AuthIdent, Ident } from './time_table'
import { StarDef } from './org_star_def'

	/*
		@ api_live object types
	*/

	// read_time_unit / read_time_obj: object returned from a time query

export type ReadTimeUnit = {
	"submit_id": number,
	"p_id": number,
	"time": number,
	"stratname": string,
	"ver": Ver,
	"variants": string,
	"link": string,
	"note": string,
	"recvtime": string,
	"verifflag": string
};

export type ReadTimeObj = ReadTimeUnit[];

export function addTimeObj(readObj: ReadTimeObj, id: Ident, starDef: StarDef, timeDat: TimeDat) {
	var p_id = 0;
	if (/^\d+$/.test(id.name)) {
		p_id = parseInt(id.name);
	}
	var variants = starDef.variants ? starDef.variants : [];
	readObj.push({
		"submit_id": -1,
		"p_id": p_id,
		"time": timeDat.rawTime,
		"stratname": timeDat.rowDef.name,
		"ver": timeDat.rowDef.ver,
		"variants": serialVarList(variants, timeDat.rowDef.variant_list),
		"link": timeDat.link === null ? "" : timeDat.link,
		"note": timeDat.note === null ? "" : timeDat.note,
		"recvtime": timeDat.recvTime === null ? "" : timeDat.recvTime,
		"verifflag": "maybe"
	});
}

export function delTimeObj(readObj: ReadTimeObj, timeDat: TimeDat) {
	if (timeDat.origin === null) return;
	var d_id = timeDat.origin;
	const i = readObj.findIndex((obj) => obj.submit_id === d_id);
	if (i !== -1) readObj.splice(i, 1);
}

export type ReadAnyTimeUnit = ReadTimeUnit & {
	"stageid": number,
	"starid": string,
	"recvtime": string
};

export type ReadAnyTimeObj = ReadAnyTimeUnit[];

	// submit_time_unit / submit_time_obj: object expected by a time submission

export type SubmitTimeUnit = {
	"stageId": number,
	"starId": string,
	"stratName": string,
	"ver": Ver,
	"variantStr": string
	"time": number,
	"submitTime": number,
	"link": string,
	"note": string
}

export type SubmitTimeObj = {
	"player": AuthIdent,
	"nick": string | null,
	"accessToken": number,
	"submitList": SubmitTimeUnit[],
	"delList": number[],
	"verifList"?: [number, string][]
}

	// read_nick_unit / read_nick_obj: object returned from a nickname query

export type ReadNickUnit = {
	"p_id": number,
	"nick": string | null,
	"perm": string | null,
	"favcolor": string | null
};

export type ReadNickObj = ReadNickUnit[];

	// submit_nick_obj: object expected by a nickname submission

export type SubmitNickObj = {
	"player": AuthIdent,
	"accessToken": number,
	"nick": string,
	"favColor"?: string | null
};