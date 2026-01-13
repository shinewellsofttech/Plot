import { useEffect, useState } from "react";
import { Image, LI, P } from "../../../../AbstractElements";
import { dynamicImage } from "../../../../Service";
import ProfileBox from "./ProfileBox";
import { API_HELPER } from "../../../../helpers/ApiHelper";
import { API_WEB_URLS } from "../../../../constants/constAPI";

const UserProfile = () => {
  const [userName, setUserName] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const authUser = JSON.parse(sessionStorage.getItem("authUser") || "{}");
        
        // Set User Name
        if (authUser.Name) {
          setUserName(authUser.Name);
        } else if (authUser.UserName) {
          setUserName(authUser.UserName);
        } else {
          setUserName("User");
        }

        // Fetch Company Name
        if (authUser.CompanyId) {
          try {
            const companyUrl = API_WEB_URLS.BASE + API_WEB_URLS.MASTER + "/0/token/CompanyMaster/Id/" + authUser.CompanyId;
            const companyResponse = await API_HELPER.apiGET(companyUrl);
            if (companyResponse && companyResponse.data && companyResponse.data.dataList && companyResponse.data.dataList.length > 0) {
              setCompanyName(companyResponse.data.dataList[0].Name || "");
            } else if (authUser.CompanyName) {
              setCompanyName(authUser.CompanyName);
            } else {
              setCompanyName("");
            }
          } catch (error) {
            console.error("Error fetching company name:", error);
            if (authUser.CompanyName) {
              setCompanyName(authUser.CompanyName);
            } else {
              setCompanyName("");
            }
          }
        } else if (authUser.CompanyName) {
          setCompanyName(authUser.CompanyName);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setUserName("User");
        setCompanyName("");
      }
    };

    loadUserData();
  }, []);

  return (
    <LI className="profile-nav onhover-dropdown p-0">
      <div className="d-flex profile-media align-items-center">
        <Image className="b-r-10 img-40" src={dynamicImage("dashboard/profile.png")} alt="user" />
        <div className="flex-grow-1">
          <span>{userName || "User"}</span>
          <P className="mb-0">{companyName || ""}</P>
        </div>
      </div>
      <ProfileBox />
    </LI>
  );
};

export default UserProfile;
