
import { VarSpace } from './org_variant'
import { DraftDat, stratNameDraftDat, verDraftDat, varSelDraftDat } from './draft_dat'
import { ColConfig, nameListColConfig } from './col_config'

export type ValidStyle = "init" | "warning" | "error" | "valid";

type OptionGroupProps = {
	"title": string,
	"childList": React.ReactNode[]
};

function OptionGroup(props: OptionGroupProps): React.ReactNode
{
	return <div className='opt-cont'><div className='opt-title'>{ props.title }</div>
		<div className='opt-list'>{ props.childList }</div></div>;
}

type ESAProps = {
	"cfg": ColConfig,
	"colId": number,
	"vs": VarSpace
	"curDat": DraftDat,
	"style": ValidStyle,
	"infoText": string | null
};

export function EditSubmitArea(props: ESAProps): React.ReactNode
{
	var cfg = props.cfg;
	var colId = props.colId;
	var vs = props.vs;
	var curDat = props.curDat;

	/* REMEMBER: to do the static/dynamic difference */

	// alt strat node (for when multiple strats are in the same column)
	var curStrat = stratNameDraftDat(curDat);
	var nameList = nameListColConfig(cfg, colId);
	var altNode: React.ReactNode = "";
	if (nameList.length > 1) {
		var altList: React.ReactNode[] = [];
		for (const name of nameList) {
			altList.push(<div className='strat-name' data-sel={ curStrat === name } key={ name }>{ name }</div>);
		}
		altNode = <OptionGroup title="Strat:" childList={ altList }/>;
	}

	// ver diff node
	var verNode: React.ReactNode = "";
	if (vs.verInfo !== null) {
		var verList = [
				<div className='strat-name' data-sel={ verDraftDat(curDat) === 'jp' } key="jp">JP</div>,
				<div className='strat-name' data-sel={ verDraftDat(curDat) === 'us' } key="us">US</div>
			];
		verNode = <OptionGroup title="Version:" childList={ verList }/>;
	}

	// variant space nodes
	var varNodeList = vs.varTable.map((varList, i) => {
		var selVar = varSelDraftDat(curDat, i, varList);
		var optNodes = varList.map((v) => {
			var name = vs.nameList[parseInt(v)];
			return <div className='strat-name' data-sel={ selVar === v } key={ v }>{ name }</div>;
		})
		optNodes.unshift(<div className='strat-name' data-sel={ selVar === "-1" } key="_na">N/A</div>)
		var title = "";
		if (i === 0) title = "Variants:"
		return <OptionGroup title={ title } childList={ optNodes }/>;
	});

	return <div className="submit-cont">
		<div className="submit-ex">
			<div className="submit-ex-inner">
				{ altNode } { verNode }
				{ varNodeList }
			</div>
		</div>
		<div className="submit-info" data-style={ props.style }>{ props.infoText }</div>
		<div className="button-area">
			<div className="submit-button">Submit Times</div>
			<div className="cancel-button">Cancel</div>
		</div>
	</div>;
}