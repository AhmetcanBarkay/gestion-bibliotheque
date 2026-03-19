import "./Loading.css";
import Spinner from "./ui/Spinner";
function Loading() {
    return <div id="loading" className="center">
        <Spinner size={50} color={"#FFFFFF"} />
        <span>Chargement...</span>
    </div>
};

export default Loading;