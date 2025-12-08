import { MenuItem } from "../../Types/Layout/SidebarType";

export const MenuList: MenuItem[] = [
  {
    title: "Dashboard",
    Items: [],
  },
  {
    title: "Masters",
    Items: [
      // { 
      //   id: 3, 
      //   title: "User Master", 
      //   path: `${process.env.PUBLIC_URL}/userMaster`, 
      //   icon: "User", 
      //   type: "link", 
      //   bookmark: true 
      // },
      // { 
      //   id: 4, 
      //   title: "Department Master", 
      //   path: `${process.env.PUBLIC_URL}/departmentMaster`, 
      //   icon: "Building", 
      //   type: "link", 
      //   bookmark: true 
      // },
      { 
        id: 5, 
        title: "Ledger Master", 
        path: `${process.env.PUBLIC_URL}/ledgerMaster`, 
        icon: "Book", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 6, 
        title: "Country Master", 
        path: `${process.env.PUBLIC_URL}/countryMaster`, 
        icon: "Globe", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 7, 
        title: "State Master", 
        path: `${process.env.PUBLIC_URL}/stateMaster`, 
        icon: "Map", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 8, 
        title: "City Master", 
        path: `${process.env.PUBLIC_URL}/cityMaster`, 
        icon: "Map-pin", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 10, 
        title: "Scheme Master", 
        path: `${process.env.PUBLIC_URL}/schemeMaster`, 
        icon: "Briefcase", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 11, 
        title: "Plot Master", 
        path: `${process.env.PUBLIC_URL}/plotMaster`, 
        type: "link", 
        bookmark: true 
      }
    ],
  },
  {
    title: "Transaction",
    Items: [
      { 
        id: 9, 
        title: "Plot Purchase", 
        path: `${process.env.PUBLIC_URL}/plotPurchase`, 
        icon: "File-text", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 12, 
        title: "Receipt Entry", 
        path: `${process.env.PUBLIC_URL}/receiptEntry`, 
        icon: "Dollar-sign", 
        type: "link", 
        bookmark: true 
      }
    ],
  },
  {
    title: "Reports",
    Items: [
      { 
        id: 13, 
        title: "EMI Report", 
        path: `${process.env.PUBLIC_URL}/emiReport`, 
        icon: "File-text", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 14, 
        title: "Ledger Report", 
        path: `${process.env.PUBLIC_URL}/ledgerReport`, 
        icon: "Book", 
        type: "link", 
        bookmark: true 
      },
      { 
        id: 15, 
        title: "Scheme Wise Report", 
        path: `${process.env.PUBLIC_URL}/schemeWiseReport`, 
        icon: "Briefcase", 
        type: "link", 
        bookmark: true 
      }
    ],
  },

];
