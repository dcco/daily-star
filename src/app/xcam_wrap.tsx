
import localRowData from './json/row_data.json'
import localXcamData from './json/xcam_dump.json'

export type SheetData = {
	"rowData": any,
	"xcamData": any
}

export const G_SHEET: SheetData = {
	"rowData": localRowData,
	"xcamData": localXcamData
}

export async function updateGSheet(callback: (a: boolean) => void)
{
	//const getReq = await fetch("http://ec2-52-15-55-53.us-east-2.compute.amazonaws.com:5505/dump_xcams");
	const getReq = await fetch("https://g6u2bjvfoh.execute-api.us-east-2.amazonaws.com/dump_xcams");
	var res = await getReq.json();
	if (res.response === "Error") {
		console.log(res.err);
		return;
	}
	var [newRD, newXD] = res.res;
	G_SHEET.rowData = newRD;
	G_SHEET.xcamData = newXD;
	console.log("Succesfully loaded online xcam data.");
	callback(true);
}