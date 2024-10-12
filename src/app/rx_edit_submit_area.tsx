
import { VarSpace } from './org_variant'
import { DraftDat, stratNameDraftDat, verDraftDat, varSelDraftDat, setVerDraftDat, setVarDraftDat } from './draft_dat'
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
	"editDat": (f: (a: DraftDat) => DraftDat) => void,
	"changeStrat": (a: string) => void,
	"style": ValidStyle,
	"infoText": string | null
};

export function EditSubmitArea(props: ESAProps): React.ReactNode
{
	var cfg = props.cfg;
	var colId = props.colId;
	var vs = props.vs;
	var curDat = props.curDat;
	var editDat = props.editDat;
	var changeStrat = props.changeStrat;

	/* REMEMBER: to do the static/dynamic difference */

	// alt strat node (for when multiple strats are in the same column)
	var curStrat = stratNameDraftDat(curDat);
	var nameList = nameListColConfig(cfg, colId);
	var altNode: React.ReactNode = "";
	if (nameList.length > 1) {
		var altList: React.ReactNode[] = [];
		for (const name of nameList) {
			altList.push(<div className='opt-button for-strat' data-sel={ curStrat === name }
				onClick={ () => changeStrat(name) } key={ name }>{ name }</div>);
		}
		altNode = <OptionGroup title="Strat:" childList={ altList }/>;
	}

	// ver diff node
	var verNode: React.ReactNode = "";
	if (vs.verInfo !== null) {
		var verList = [
				<div className='opt-button for-setting' data-sel={ verDraftDat(curDat) === 'jp' }
					onClick={ () => editDat((dat) => { setVerDraftDat(dat, "jp"); return dat; }) } key="jp">JP</div>,
				<div className='opt-button for-setting' data-sel={ verDraftDat(curDat) === 'us' }
					onClick={ () => editDat((dat) => { setVerDraftDat(dat, "us"); return dat; }) } key="us">US</div>
			];
		verNode = (<div className='opt-cont'><div className='opt-title'>Version:</div>
			<div className='opt-box'>{ verList }</div></div>);
	}

	// variant space nodes
	var varNodeList = vs.varTable.map((varGroup, i) => {
		var selVar = varSelDraftDat(curDat, varGroup.id, varGroup.list);
		var optNodes = varGroup.list.map((v) => {
			var name = vs.nameList[parseInt(v)];
			return <div className='opt-button for-setting' data-sel={ selVar === v }
				onClick={ () => editDat((dat) => { setVarDraftDat(dat, varGroup.id, v); return dat; }) } key={ v }>{ name }</div>;
		})
		optNodes.unshift(<div className='opt-button for-setting' data-sel={ selVar === "-1" }
			onClick={ () => editDat((dat) => { setVarDraftDat(dat, varGroup.id, "-1"); return dat; }) } key="_na">N/A</div>)
		var title = "";
		if (i === 0) title = "Variants:"
		return (<div className='opt-cont'><div className='opt-title'>{ title }</div>
			<div className='opt-box'>{ optNodes }</div></div>);
	});

	return <div className="submit-cont">
		<div className="submit-ex">
			<div className="submit-ex-inner">
				{ altNode } { verNode }
				{ varNodeList }
			</div>
			<div className="submit-ex-form">
				<div className="form-title">Video:</div>
				<input className="form-input" value={ curDat.link }
					onChange={ (e) => editDat((dat) => { dat.link = e.target.value; return dat; }) }/>
			</div> <div className="submit-ex-form">
				<div className="form-title">Note:</div>
				<input className="form-input" value={ curDat.note }
					onChange={ (e) => editDat((dat) => { dat.note = e.target.value; return dat; }) }/>
			</div>
		</div>
		<div className="submit-info" data-style={ props.style }>{ props.infoText }</div>
		<div className="button-area">
			<div className="submit-button">Submit Times</div>
			<div className="cancel-button">Cancel</div>
		</div>
	</div>;
}