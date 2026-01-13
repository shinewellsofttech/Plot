import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_DisplayData, Fn_AddEditData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";

const API_URL_SCHEME = API_WEB_URLS.MASTER + "/0/token/SchemeMaster";
const API_URL_SAVE = "PlotMaster/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/PlotMaster/Id";

const AddEdit_PlotMasterContainer = () => {
  const [state, setState] = useState({
    id: 0,
    SchemeArray: [],
    formData: {},
    isProgress: true,
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    Fn_FillListData(dispatch, setState, "SchemeArray", API_URL_SCHEME + "/TBL.F_CompanyMaster/"+obj.CompanyId);

    const Id = (location.state && location.state.Id) || 0;

    if (Id > 0) {
      setState((prevState) => ({
        ...prevState,
        id: Id,
      }));
      Fn_DisplayData(dispatch, setState, Id, API_URL_EDIT);
    }
  }, [dispatch, location.state]);

  const validationSchema = Yup.object({
    F_SchemeMaster: Yup.string().required("Scheme is required"),
    Name: Yup.string().required("Plot Name is required"),
    BlockNo: Yup.string().required("Block No is required"),
    PlotSize: Yup.string().required("Plot Size is required"),
    Qty: Yup.number()
      .required("Quantity is required")
      .positive("Quantity must be positive")
      .integer("Quantity must be an integer"),
    TentativePrice: Yup.number()
      .required("Tentative Price is required")
      .positive("Price must be positive"),
  });

  const handleSubmit = (values) => {
    const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    let vformData = new FormData();

    vformData.append("F_SchemeMaster", values.F_SchemeMaster);
    vformData.append("Name", values.Name);
    vformData.append("BlockNo", values.BlockNo);
    vformData.append("PlotSize", values.PlotSize);
    vformData.append("Qty", values.Qty);
    vformData.append("TentativePrice", values.TentativePrice);
    vformData.append("F_CompanyMaster", obj.CompanyId || "");
    vformData.append("UserId", obj.Id || obj.id || "");

    Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData: vformData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/plotMaster"
    );
  };

  const isEditMode = state.id > 0;
  const initialValues = {
    F_SchemeMaster: state.formData?.F_SchemeMaster || "",
    Name: state.formData?.Name || "",
    BlockNo: state.formData?.BlockNo || "",
    PlotSize: state.formData?.PlotSize || "",
    Qty: state.formData?.Qty || "",
    TentativePrice: state.formData?.TentativePrice || "",
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) {
        const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
        const currentIndex = inputs.indexOf(e.currentTarget);
        if (currentIndex < inputs.length - 1) {
          inputs[currentIndex + 1].focus();
        } else {
          const submitButton = form.querySelector('button[type="submit"]');
          if (submitButton) {
            submitButton.focus();
          }
        }
      }
    }
  };

  return (
    <>
      <style>{`
        select.btn-square,
        select.btn-square option {
          font-family: inherit !important;
          color: #000000 !important;
        }
        .theme-form input[type="text"],
        .theme-form input[type="number"] {
          color: #000000 !important;
        }
        body.dark-only select.btn-square,
        body.dark-only select.btn-square option {
          color: #ffffff !important;
        }
        body.dark-only .theme-form input[type="text"],
        body.dark-only .theme-form input[type="number"] {
          color: #ffffff !important;
        }
      `}</style>
      <Breadcrumbs mainTitle="Plot Master" parent="Masters" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, handleChange, handleBlur, errors, touched }) => (
                <Form className="theme-form">
                  <Card>
                    <CardHeaderCommon
                      title={`${isEditMode ? "Edit" : "Add"} Plot Master`}
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Scheme <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="F_SchemeMaster"
                              value={values.F_SchemeMaster}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              className="btn-square"
                              style={{ fontFamily: 'inherit' }}
                              invalid={touched.F_SchemeMaster && !!errors.F_SchemeMaster}
                              autoFocus
                            >
                              <option value="">Select Scheme</option>
                              {state.SchemeArray.map((item) => (
                                <option key={item.Id} value={item.Id}>
                                  {item.Name}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_SchemeMaster" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Plot Name <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="text"
                              name="Name"
                              placeholder="Enter plot name"
                              value={values.Name}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              invalid={touched.Name && !!errors.Name}
                            />
                            <ErrorMessage name="Name" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Block No <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="text"
                              name="BlockNo"
                              placeholder="Enter block number"
                              value={values.BlockNo}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              invalid={touched.BlockNo && !!errors.BlockNo}
                            />
                            <ErrorMessage name="BlockNo" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Plot Size <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="text"
                              name="PlotSize"
                              placeholder="Enter plot size (e.g., 1000 sq ft)"
                              value={values.PlotSize}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              invalid={touched.PlotSize && !!errors.PlotSize}
                            />
                            <ErrorMessage name="PlotSize" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Quantity <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="number"
                              name="Qty"
                              placeholder="Enter quantity"
                              value={values.Qty}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              invalid={touched.Qty && !!errors.Qty}
                            />
                            <ErrorMessage name="Qty" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Tentative Price <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="number"
                              name="TentativePrice"
                              placeholder="Enter tentative price"
                              value={values.TentativePrice}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              invalid={touched.TentativePrice && !!errors.TentativePrice}
                            />
                            <ErrorMessage name="TentativePrice" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn
                        color="secondary"
                        type="button"
                        className="me-2"
                        onClick={() => navigate("/plotMaster")}
                      >
                        Cancel
                      </Btn>
                      <Btn color="primary" type="submit">
                        {isEditMode ? "Update" : "Submit"}
                      </Btn>
                    </CardFooter>
                  </Card>
                </Form>
              )}
            </Formik>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AddEdit_PlotMasterContainer;
