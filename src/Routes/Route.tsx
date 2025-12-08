import AddEdit_userMaster from "../Pages/Masters/AddEdit_UserMaster";
import PageList_UserMaster from "../Pages/Masters/PageList_UserMaster";
import AddEdit_DepartmentMaster from "../Pages/Masters/AddEdit_DepartmentMaster";
import PageList_DepartmentMaster from "../Pages/Masters/PageList_DepartmentMaster";
import AddEdit_LedgerMaster from "../Pages/Masters/AddEdit_LedgerMaster";
import PageList_LedgerMaster from "../Pages/Masters/PageList_LedgerMaster";
import AddEdit_CountryMaster from "../Pages/Masters/AddEdit_CountryMaster";
import PageList_CountryMaster from "../Pages/Masters/PageList_CountryMaster";
import AddEdit_StateMaster from "../Pages/Masters/AddEdit_StateMaster";
import PageList_StateMaster from "../Pages/Masters/PageList_StateMaster";
import AddEdit_CityMaster from "../Pages/Masters/AddEdit_CityMaster";
import PageList_CityMaster from "../Pages/Masters/PageList_CityMaster";
import AddEdit_SchemeMaster from "../Pages/Masters/AddEdit_SchemeMaster";
import PageList_SchemeMaster from "../Pages/Masters/PageList_SchemeMaster";
import AddEdit_PlotMaster from "../Pages/Masters/AddEdit_PlotMaster";
import PageList_PlotMaster from "../Pages/Masters/PageList_PlotMaster";
import Report from "../Pages/Dashboard/Report";
import PlotPurchase from "../Pages/Transaction/PlotPurchase";
import ReceiptEntryForm from "../Pages/Transaction/ReceiptEntryForm";
import EmiReport from "../Pages/Reports/EmiReport";
import LedgerReport from "../Pages/Reports/LedgerReport";
import SchemeWiseReport from "../Pages/Reports/SchemeWiseReport";
export const routes = [
  // Sample Page
  { path: `${process.env.PUBLIC_URL}/reports`, Component: <Report /> },
  { path: `${process.env.PUBLIC_URL}/addEdit_UserMaster`, Component: <AddEdit_userMaster /> },
  { path: `${process.env.PUBLIC_URL}/userMaster`, Component: <PageList_UserMaster /> },
  { path: `${process.env.PUBLIC_URL}/addEdit_DepartmentMaster`, Component: <AddEdit_DepartmentMaster /> },
  { path: `${process.env.PUBLIC_URL}/departmentMaster`, Component: <PageList_DepartmentMaster /> },
  { path: `${process.env.PUBLIC_URL}/addEdit_LedgerMaster`, Component: <AddEdit_LedgerMaster /> },
  { path: `${process.env.PUBLIC_URL}/ledgerMaster`, Component: <PageList_LedgerMaster /> },
  { path: `${process.env.PUBLIC_URL}/addEdit_CountryMaster`, Component: <AddEdit_CountryMaster /> },
  { path: `${process.env.PUBLIC_URL}/countryMaster`, Component: <PageList_CountryMaster /> },
  { path: `${process.env.PUBLIC_URL}/addEdit_StateMaster`, Component: <AddEdit_StateMaster /> },
  { path: `${process.env.PUBLIC_URL}/stateMaster`, Component: <PageList_StateMaster /> },
  { path: `${process.env.PUBLIC_URL}/addEdit_CityMaster`, Component: <AddEdit_CityMaster /> },
  { path: `${process.env.PUBLIC_URL}/cityMaster`, Component: <PageList_CityMaster /> },
  { path: `${process.env.PUBLIC_URL}/addEdit_SchemeMaster`, Component: <AddEdit_SchemeMaster /> },
  { path: `${process.env.PUBLIC_URL}/schemeMaster`, Component: <PageList_SchemeMaster /> },
  { path: `${process.env.PUBLIC_URL}/addEdit_PlotMaster`, Component: <AddEdit_PlotMaster /> },
  { path: `${process.env.PUBLIC_URL}/plotMaster`, Component: <PageList_PlotMaster /> },
  { path: `${process.env.PUBLIC_URL}/plotPurchase`, Component: <PlotPurchase /> },
  { path: `${process.env.PUBLIC_URL}/receiptEntry`, Component: <ReceiptEntryForm /> },
  { path: `${process.env.PUBLIC_URL}/emiReport`, Component: <EmiReport /> },
  { path: `${process.env.PUBLIC_URL}/ledgerReport`, Component: <LedgerReport /> },
  { path: `${process.env.PUBLIC_URL}/schemeWiseReport`, Component: <SchemeWiseReport /> },
];
