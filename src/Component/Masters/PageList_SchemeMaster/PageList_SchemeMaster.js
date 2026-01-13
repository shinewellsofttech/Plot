import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DeleteData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { toast } from "react-toastify";

const API_URL = API_WEB_URLS.MASTER + "/0/token/SchemeMaster/TBL.F_CompanyMaster/";

const PageList_SchemeMasterContainer = () => {
  const [state, setState] = useState({
    SchemeMasterList: [],
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
     const data = JSON.parse(sessionStorage.getItem("authUser")) || [];
    console.log(data)
    Fn_FillListData(dispatch, setState, "SchemeMasterList", API_URL + data.CompanyId

    );
  };

  const handleEdit = (id) => {
    navigate("/addEdit_SchemeMaster", { state: { Id: id } });
  };

  const handleDelete = async(id) => {
    console.log("handleDelete called with id:", id);
    if (!id || id === 0) {
      toast.error("Invalid ID for deletion");
      return;
    }
    if (window.confirm("Are you sure you want to delete this scheme?")) {
      const deleteUrl = API_WEB_URLS.MASTER + "/0/token/DeleteSchemeMaster/Id/" + id;
      console.log("Calling Fn_DeleteData with:", { id, deleteUrl });
      const res= await  Fn_FillListData(dispatch, setState, "New", deleteUrl);
      console.log("res", res);
      if(res && res.length > 0 && res[0].Id > 0){
        toast.success("Scheme deleted successfully");
        loadData();
      }else{
        toast.error("Failed to delete scheme");
      }
    }
  };

  const handleAdd = () => {
    navigate("/addEdit_SchemeMaster", { state: { Id: 0 } });
  };

  const filteredData = (Array.isArray(state.SchemeMasterList) ? state.SchemeMasterList : []).filter((item) => {
    const searchText = state.filterText.toLowerCase();
    return (
      (item.Name && item.Name.toLowerCase().includes(searchText))
    );
  });

  return (
    <>
      <Breadcrumbs mainTitle="Scheme Master List" parent="Masters" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon
                title="Scheme Master List"
                tagClass="card-title mb-0"
              />
              <CardBody>
                <Row className="mb-3">
                  <Col md="6">
                    <div className="dataTables_filter d-flex align-items-center">
                      <Label className="me-2">Search:</Label>
                      <Input
                        type="search"
                        placeholder="Search by scheme name..."
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
                      <i className="fa fa-plus me-2"></i>Add New Scheme
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
                          <th>Scheme Name</th>
                         
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center p-4">
                              No data found
                            </td>
                          </tr>
                        ) : (
                          filteredData.map((item, index) => (
                            <tr key={item.Id || index}>
                              <td>{index + 1}</td>
                              <td>{item.Name || "-"}</td>
                            
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

export default PageList_SchemeMasterContainer;
