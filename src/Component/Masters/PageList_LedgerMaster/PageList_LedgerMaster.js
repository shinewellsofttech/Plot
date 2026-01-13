import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DeleteData, Fn_GetReport } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { toast } from "react-toastify";
import LedgerReport from "../../../Pages/Reports/LedgerReport";

const API_URL = API_WEB_URLS.MASTER + "/0/token/LedgerMasterList/TBL.F_CompanyMaster/";
const API_URL_REPORT = 'LedgerRegister/0/token';

const PageList_LedgerMasterContainer = () => {
  const [state, setState] = useState({
    LedgerMasterList: [],
    isProgress: true,
    filterText: "",
    modalData: {
      isOpen: false,
      ledgerId: null,
      ledgerName: "",
      schemeId: null,
      schemeName: "",
    },
  });

  // Helper to get first and last date of current month
  const getCurrentMonthDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      firstDate: formatDate(firstDay),
      lastDate: formatDate(lastDay)
    };
  };

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = () => {
    const data = JSON.parse(sessionStorage.getItem("authUser")) || [];
    console.log(data)
    Fn_FillListData(dispatch, setState, "LedgerMasterList", API_URL + data.CompanyId);
  };

  const handleEdit = (id) => {
    navigate("/addEdit_LedgerMaster", { state: { Id: id } });
  };

  const handleDelete = async(id) => {
    console.log("handleDelete called with id:", id);
    if (!id || id === 0) {
      toast.error("Invalid ID for deletion");
      return;
    }
    if (window.confirm("Are you sure you want to delete this ledger?")) {
      const deleteUrl = API_WEB_URLS.MASTER + "/0/token/DeleteLedgerMaster/Id/" + id;
      console.log("Calling Fn_DeleteData with:", { id, deleteUrl });
      const res= await  Fn_FillListData(dispatch, setState, "New", deleteUrl);
      console.log("res", res);
      if(res && res.length > 0 && res[0].Id > 0){
        toast.success("Ledger deleted successfully");
        loadData();
      }else{
        toast.error("Failed to delete ledger");
      }
    }
  };

  const handleAdd = () => {
    navigate("/addEdit_LedgerMaster", { state: { Id: 0 } });
  };

  const handleViewReport = (ledgerId, ledgerName, schemeId, schemeName) => {
    setState((prev) => ({
      ...prev,
      modalData: {
        isOpen: true,
        ledgerId: ledgerId,
        ledgerName: ledgerName,
        schemeId: schemeId,
        schemeName: schemeName,
      },
    }));
  };

  const closeModal = () => {
    setState((prev) => ({
      ...prev,
      modalData: {
        isOpen: false,
        ledgerId: null,
        ledgerName: "",
        schemeId: null,
        schemeName: "",
      },
    }));
  };

  const filteredData = (Array.isArray(state.LedgerMasterList) ? state.LedgerMasterList : []).filter((item) => {
    const searchText = state.filterText.toLowerCase();
    return (
      (item.Name && item.Name.toLowerCase().includes(searchText)) ||
      (item.RelationPersonName && item.RelationPersonName.toLowerCase().includes(searchText)) ||
      (item.RelationTypeName && item.RelationTypeName.toLowerCase().includes(searchText)) ||
      (item.SchemeName && item.SchemeName.toLowerCase().includes(searchText)) ||
      (item.PlotNames && item.PlotNames.toLowerCase().includes(searchText))
    );
  });

  return (
    <>
      <Breadcrumbs mainTitle="Ledger Master List" parent="Masters" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Ledger Master List"
                tagClass="card-title mb-0"
              />
              <CardBody>
                <Row className="mb-3">
                  <Col md="6">
                    <div className="dataTables_filter d-flex align-items-center">
                      <Label className="me-2">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by scheme name, name, relation type, person name, or plot names..."
                        value={state.filterText}
                        onChange={(e) =>
                          setState((prev) => ({
                            ...prev,
                            filterText: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </Col>
                  <Col md="6" className="text-end">
                    <Btn
                      color="primary"
                      onClick={handleAdd}
                    >
                      <i className="fa fa-plus me-2"></i>Add New Ledger
                    </Btn>
                  </Col>
                </Row>
                {state.isProgress ? (
                  <div className="text-center p-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table striped hover>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>SchemeName</th>
                          <th>Name</th>
                          <th>Relation Type</th>
                          <th>Relation Person Name</th>
                          <th>Mobile No</th>
                          <th>Phone No</th>
                          <th>Plot Names</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="text-center p-4">
                              No data found
                            </td>
                          </tr>
                        ) : (
                          filteredData.map((item, index) => (
                            <tr key={item.Id || index}>
                              <td>{index + 1}</td>
                              <td>{item.SchemeName || "-"}</td>
                              <td>{item.Name || "-"}</td>
                              <td>{item.RelationTypeName || item.F_RelationType || "-"}</td>
                              <td>{item.RelationPersonName || "-"}</td>
                              <td>{item.MobileNo || "-"}</td>
                              <td>{item.PhoneNo || "-"}</td>
                              <td>{item.PlotNames || "-"}</td>
                              <td>
                                <Btn
                                  color="info"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleViewReport(item.Id, item.Name, item.F_SchemeMaster, item.SchemeName)}
                                  title="View Ledger Report"
                                >
                                  <i className="fa fa-eye"></i>
                                </Btn>
                                <Btn
                                  color="primary"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleEdit(item.Id)}
                                >
                                  <i className="fa fa-edit"></i>
                                </Btn>
                                <Btn
                                  color="danger"
                                  size="sm"
                                  onClick={() => handleDelete(item.Id)}
                                >
                                  <i className="fa fa-trash"></i>
                                </Btn>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal for Ledger Report */}
      <Modal isOpen={state.modalData.isOpen} toggle={closeModal} size="xl" style={{ maxWidth: '95%' }}>
        <ModalHeader toggle={closeModal}>
          <i className="fa fa-file-text me-2"></i>
          Ledger Report - {state.modalData.ledgerName} ({state.modalData.schemeName})
        </ModalHeader>
        <ModalBody style={{ padding: 0, maxHeight: '80vh', overflow: 'auto' }}>
          {state.modalData.isOpen && state.modalData.ledgerId && state.modalData.schemeId && (
            <LedgerReport
              initialSchemeId={state.modalData.schemeId}
              initialLedgerId={state.modalData.ledgerId}
              initialFromDate=""
              initialToDate=""
              isModalView={true}
            />
          )}
        </ModalBody>
        <ModalFooter>
          <Btn color="secondary" onClick={closeModal}>
            Close
          </Btn>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default PageList_LedgerMasterContainer;
