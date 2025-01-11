
type ExtToggleProps = {
	"state": boolean,
	"toggle": () => void
}

export function ExtToggle(props: ExtToggleProps): React.ReactNode {
	var state = props.state;
	return (<div className="ver-cont">
		<div className="toggle-box">
			<div className="toggle-button" data-plain="true" data-active={ state.toString() } onClick={ props.toggle }>
				<div className="toggle-inner">Show Extensions</div>
			</div>
		</div>
	</div>);
}