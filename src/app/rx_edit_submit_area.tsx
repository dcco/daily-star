
import { VerF, VarSpace } from './variant_def'
import { TimeDat } from './time_dat'
import { DraftDat, stratNameDraftDat, verDraftDat, getVarDraftDat, setVerDraftDat, setVarDraftDat } from './draft_dat'
import { ColConfig, nameListColConfig } from './col_config'

export type ValidStyle = "init" | "warning" | "error" | "valid";
/*
type OptionGroupProps = {
	"title": string,
	"active": boolean,
	"childList": React.ReactNode[]
};

function OptionGroup(props: OptionGroupProps): React.ReactNode
{
	return <div className='opt-cont' data-active={ props.active }><div className='opt-title'>{ props.title }</div>
		<div className='opt-list'>{ props.childList }</div></div>;
}*/

type OptionGroupProps = {
	"title": string,
	"connected": boolean,
	"active": boolean,
	"textList": string[],
	"selList": string[],
	"curSel": string | null,
	"actFun": (a: number) => void
};

function OptionGroup(props: OptionGroupProps): React.ReactNode
{
	// class name for connected VS split button types
	var childClass = "opt-button for-strat";
	if (props.connected) childClass = "opt-button for-setting";
	// build child list
	var childList = props.textList.map((text, i) => {
		return (<div className={ childClass } data-sel={ props.selList[i] === props.curSel }
			onClick={ () => { if (props.active) props.actFun(i) } } key={ i }>{ text }</div>);
	});
	// class container
	var contClass = "opt-list";
	if (props.connected) contClass = "opt-box";
	return <div className='opt-cont' data-active={ props.active.toString() }><div className='opt-title'>{ props.title }</div>
		<div className={ contClass }>{ childList }</div></div>;
}

type ESAProps = {
	"cfg": ColConfig,
	"colId": number,
	"vs": VarSpace
	"curDat": DraftDat,
	"oldDat": TimeDat | null,
	"editDat": (f: (a: DraftDat) => DraftDat) => void,
	"changeStrat": (a: string) => void,
	"submit": () => void,
	"cancel": () => void,
	"delToggle": () => void,
	"style": ValidStyle,
	"infoText": string | null
};

export function EditSubmitArea(props: ESAProps): React.ReactNode
{
	var cfg = props.cfg;
	var colId = props.colId;
	var vs = props.vs;
	var curDat = props.curDat;
	var oldDat = props.oldDat;
	var editDat = props.editDat;
	var changeStrat = props.changeStrat;

	var dynFlag = curDat.rowInfo.dyn;

	// alt strat node (for when multiple strats are in the same column)
	var curStrat = stratNameDraftDat(curDat);
	var nameList = nameListColConfig(cfg, colId);
	var altNode: React.ReactNode = "";
	if (nameList.length > 1) {
		altNode = <OptionGroup title="Strat:" connected={ false } active={ dynFlag }
			textList={ nameList } selList={ nameList } curSel={ curStrat }
			actFun={ (i) => changeStrat(nameList[i]) } key="opt-strat"/>;
	}

	// ver diff node
	var verNode: React.ReactNode = "";
	if (vs.verInfo !== null) {
		var ax: VerF[] = ["jp", "us"];
		verNode = <OptionGroup title="Version:" connected={ true } active={ dynFlag }
			textList={ ["JP", "US"] } selList={ ax } curSel={ verDraftDat(curDat) }
			actFun={ (i) => editDat((dat) => { setVerDraftDat(dat, ax[i]); return dat; }) } key="opt-ver"/>;
	}

	// variant space nodes
	var varNodeList = vs.varTable.map((varGroup, i) => {
		// build name and selection list
		var nameList = varGroup.list.map((v) => vs.variants[v]);
		var selList = varGroup.list.map((v) => v);
		nameList.unshift("N/A");
		selList.unshift(-1);
		// read selection id
		var selId: string | null = null;
		var selVar = getVarDraftDat(curDat, varGroup.name);
		if (selVar !== null) selId = "" + selVar[0];
		// title for first group
		var title = "";
		if (i === 0) title = "Variants";
		// create the option nodes, using selVar to highlight
		return <OptionGroup title={ title } connected={ true } active={ dynFlag }
			textList={ nameList } selList={ selList.map((i) => i.toString()) } curSel={ selId }
			actFun={ (i) => editDat((dat) => { setVarDraftDat(dat, varGroup.name, selList[i]); return dat; }) }
			key={ i }/>;
	});

	// delete button (if relevant)
	var delNode: React.ReactNode = "";
	if (oldDat !== null) {
		var delText = "Delete Time";
		if (curDat.delFlag !== null) delText = "Revert Time";
		delNode = <div className="cancel-button" onClick={ props.delToggle }>{ delText }</div>
	}

	var validFlag = props.style === "valid" || props.style === "warning";
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
			<div>
				<div className="submit-button" data-active={ validFlag }
					onClick={ () => { if (validFlag) props.submit() } }>Submit Times</div>
				<div className="cancel-button" onClick={ props.cancel }>Cancel</div>
			</div>
			{ delNode }
		</div>
	</div>;
}