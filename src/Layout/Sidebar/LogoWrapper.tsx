import { Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../ReduxToolkit/Hooks';
import { Image, SVG, H6 } from '../../AbstractElements';
import { setToggleSidebar } from '../../ReduxToolkit/Reducers/LayoutSlice';
import { dynamicImage } from '../../Service';
import { Crocs } from '../../utils/Constant';

const LogoWrapper = () => {
    const dispatch = useAppDispatch();
    const {toggleSidebar} = useAppSelector((state)=> state.layout)

    return (
      <>
        <div className="logo-wrapper" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
          <Link to={`${process.env.PUBLIC_URL}/emiReport`} className="text-decoration-none" style={{flex: 1, minWidth: 0}}>
            <div style={{display: 'flex', flexDirection: 'column', lineHeight: '1.2'}}>
              <H6 className="mb-0 text-uppercase fw-bold text-primary" style={{letterSpacing: "0.5px", fontSize: "18px", margin: "0", padding: "0"}}>PLOT</H6>
              <H6 className="mb-0 text-uppercase fw-bold text-primary" style={{letterSpacing: "0.5px", fontSize: "18px", margin: "0", padding: "0"}}>MANAGEMENT</H6>
            </div>
          </Link>
          <div className="toggle-sidebar" style={{flexShrink: 0, marginLeft: '10px'}}>
            <SVG className={`sidebar-toggle`} iconId={`toggle-icon`} onClick={()=>dispatch(setToggleSidebar(!toggleSidebar))}/>
          </div>
        </div>
        <div className="logo-icon-wrapper">
          <Link to={`${process.env.PUBLIC_URL}/emiReport`}>
            <Image className="img-fluid" src={dynamicImage("logo/logo-icon.png")} alt="logo" />
          </Link>
        </div>
      </>
    );
}

export default LogoWrapper