
import { Ver } from './variant_def'
import { AuthIdent } from './time_table'

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
	"verifflag": string
};

export type ReadTimeObj = ReadTimeUnit[];

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
	"favColor"?: string
};