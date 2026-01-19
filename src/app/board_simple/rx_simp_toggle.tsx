
type SimpToggleProps = {
	"name": string,
	"state": boolean,
	"toggle": () => void
}

export function SimpToggle(props: SimpToggleProps): React.ReactNode {
	var state = props.state;
	return (
		<div className="toggle-box slight-margin">
			<div className="toggle-button" data-plain="true" data-active={ state.toString() } onClick={ props.toggle }>
				<div className="toggle-inner">{ props.name }</div>
			</div>
		</div>
	);
}