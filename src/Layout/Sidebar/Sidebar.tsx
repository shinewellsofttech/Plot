import { Link } from 'react-router-dom'
import { H6, Image, LI, UL } from '../../AbstractElements'
import { useAppDispatch, useAppSelector } from '../../ReduxToolkit/Hooks'
import LogoWrapper from './LogoWrapper';
import SimpleBar from 'simplebar-react';
import { Back, Pinned } from '../../utils/Constant';
import { dynamicImage } from '../../Service';
import { ArrowLeft, ArrowRight } from 'react-feather';
import SidebarMenuList from './SidebarMenuList';
import { scrollToLeft, scrollToRight } from '../../ReduxToolkit/Reducers/LayoutSlice';

const Sidebar = () => {
  const dispatch = useAppDispatch();
  const { layout } = useAppSelector((state) => state.themeCustomizer);
  const { toggleSidebar,margin } = useAppSelector((state) => state.layout);
  const { pinedMenu } = useAppSelector((state) => state.layout);
  return (
    <div className={`sidebar-wrapper ${toggleSidebar ? "close_icon" : ""}`} style={{ maxHeight: "100vh", overflow: "hidden" }}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <LogoWrapper />
        <nav className="sidebar-main" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div className={`left-arrow ${margin === 0 ? "disabled" : ""}`} onClick={()=>dispatch(scrollToLeft())}><ArrowLeft /></div>
          <div id="sidebar-menu" style={{ marginLeft : layout === "horizontal-wrapper" ? `${margin}px` : "0px", flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <UL className="sidebar-links" id="simple-bar" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              <SimpleBar style={{ maxHeight: "calc(100vh - 220px)", height: "100%", overflowY: "auto", flex: 1 }}>
                <LI className="back-btn">
                  <Link to={`${process.env.PUBLIC_URL}/emiReport`}>
                    <Image className="img-fluid" src={dynamicImage("logo/logo-icon.png")} alt="logo" />
                  </Link>
                  <div className="mobile-back text-end ">
                    <span>{Back}</span>
                    <i className="fa fa-angle-right ps-2" aria-hidden="true"></i>
                  </div>
                </LI>
                <LI className={`pin-title sidebar-main-title ${pinedMenu.length > 1 ? "show" : ""} `}>
                  <div>
                    <H6>{Pinned}</H6>
                  </div>
                </LI>
              <SidebarMenuList />
              </SimpleBar>
            </UL> 
          </div>
          <div className={`right-arrow ${margin === -3500 ? "disabled" : ""}`} onClick={()=>dispatch(scrollToRight())}><ArrowRight /></div>
        </nav>
      </div>
    </div>
  )
}

export default Sidebar