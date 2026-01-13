import { Link, useNavigate } from "react-router-dom";
import { FeatherIcons, LI, UL } from "../../../../AbstractElements";
import { profilesMessage } from "../../../../Data/LayoutData/HeaderData";

const ProfileBox = () => {
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, name: string, link: string) => {
    if (name === "Log Out") {
      event.preventDefault();
      // Clear all authentication data
      sessionStorage.removeItem("login");
      sessionStorage.removeItem("authUser");
      // Use window.location.href for direct navigation to ensure clean state
      window.location.href = `${process.env.PUBLIC_URL}/login`;
    }
  };

  return (
    <UL className="profile-dropdown onhover-show-div simple-list">
      {profilesMessage.map((data, index) => (
        <LI key={index}>
          <Link to={data.link} onClick={(event) => handleClick(event, data.name, data.link)}>
            <FeatherIcons iconName={data.icon} />
            <span>{data.name} </span>
          </Link>
        </LI>
      ))}
    </UL>
  );
};

export default ProfileBox;
