import { Link } from "react-router-dom";
import iconUrl from "../assets/code-icon.svg";

const HeaderLeft = () => {
	return (
		<Link to="/" className="brand" aria-label="PurpleCode Home">
			<img src={iconUrl} alt="PurpleCode" />
		</Link>
	);
};

export default HeaderLeft;
