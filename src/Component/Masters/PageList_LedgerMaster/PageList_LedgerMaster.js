import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DeleteData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

const API_URL = API_WEB_URLS.MASTER + "/0/token/LedgerMaster/TBL.F_CompanyMaster/";

const PageList_LedgerMasterContainer = () => {
  const [state, setState] = useState({
    LedgerMasterList: [],
    isProgress: true,
    filterText: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = () => {
    const data = JSON.parse(localStorage.getItem("authUser")) || [];
    console.log(data)
    Fn_FillListData(dispatch, setState, "LedgerMasterList", API_URL + data.CompanyId);
  };

  const handleEdit = (id) => {
    navigate("/addEdit_LedgerMaster", { state: { Id: id } });
  };

  const handleDelete = (id) => {
    console.log("handleDelete called with id:", id);
    if (!id || id === 0) {
      alert("Invalid ID for deletion");
      return;
    }
    if (window.confirm("Are you sure you want to delete this ledger?")) {
      const deleteUrl = API_WEB_URLS.MASTER + "/0/token/LedgerMaster/Id";
      console.log("Calling Fn_DeleteData with:", { id, deleteUrl });
      Fn_DeleteData(dispatch, setState, id, deleteUrl, API_URL)
        .then(() => {
          console.log("Delete successful, reloading data");
          loadData();
        })
        .catch((error) => {
          console.error("Delete error:", error);
          alert("Failed to delete. Please check console for details.");
        });
    }
  };

  const handleAdd = () => {
    navigate("/addEdit_LedgerMaster", { state: { Id: 0 } });
  };

  const filteredData = (Array.isArray(state.LedgerMasterList) ? state.LedgerMasterList : []).filter((item) => {
    const searchText = state.filterText.toLowerCase();
    return (
      (item.Name && item.Name.toLowerCase().includes(searchText)) ||
      (item.RelationPersonName && item.RelationPersonName.toLowerCase().includes(searchText)) ||
      (item.RelationTypeName && item.RelationTypeName.toLowerCase().includes(searchText))
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
                        placeholder="Search by name, relation type, or person name..."
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
                         
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center p-4">
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
                             
                              <td>
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
    </>
  );
};

export default PageList_LedgerMasterContainer;
