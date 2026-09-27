import { Link } from "react-router-dom";
import iconUrl from "../assets/pdsa-icon.svg";

const HeaderLeft = () => {
	return (
		<Link to="/" className="brand" aria-label="PurpleDSA Home">
			<img src={iconUrl} alt="Purple DSA" />
		</Link>
	);
};

export default HeaderLeft;
