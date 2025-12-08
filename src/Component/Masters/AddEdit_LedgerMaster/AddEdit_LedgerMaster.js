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

const API_URL = API_WEB_URLS.MASTER + "/0/token/RelationType";
const API_URL_SAVE = "LedgerMaster/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/LedgerMaster/Id";

const AddEdit_LedgerMasterContainer = () => {
  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    formData: {},
    OtherDataScore: [],
    isProgress: true,
    SchemeArray: [], // For scheme dropdown options
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    Fn_FillListData(dispatch, setState, "FillArray", API_URL + "/Id/0");
    // Fetch scheme dropdown data (replace API endpoint as needed)
    Fn_FillListData(dispatch, setState, "SchemeArray", API_WEB_URLS.MASTER + "/0/token/SchemeMaster/Id/0");

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
    Name: Yup.string().required("Name is required"),
    F_RelationType: Yup.string().required("Relation Type is required"),
    RelationPersonName: Yup.string().required("Relation Person Name is required"),
  });

  const handleSubmit = (values) => {
    const obj = JSON.parse(localStorage.getItem("authUser") || "{}");
    let vformData = new FormData();

    vformData.append("F_SchemeMaster", values.F_SchemeMaster);
    vformData.append("Name", values.Name);
    vformData.append("F_RelationType", values.F_RelationType);
    vformData.append("RelationPersonName", values.RelationPersonName);
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
      "/ledgerMaster"
    );
  };

  const isEditMode = state.id > 0;
  const initialValues = {
    F_SchemeMaster: state.formData?.F_SchemeMaster || "",
    Name: state.formData?.Name || "",
    F_RelationType: state.formData?.F_RelationType || "",
    RelationPersonName: state.formData?.RelationPersonName || "",
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
        .theme-form input[type="text"] {
          color: #000000 !important;
        }
        body.dark-only select.btn-square,
        body.dark-only select.btn-square option {
          color: #ffffff !important;
        }
        body.dark-only .theme-form input[type="text"] {
          color: #ffffff !important;
        }
      `}</style>
      <Breadcrumbs mainTitle="Ledger Master" parent="Masters" />
      <Container flId>
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
                      title={`${isEditMode ? "Edit" : "Add"} Ledger Master`}
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
                                    {item.Name || item.SchemeName}
                                  </option>
                                ))}
                              </Input>
                              <ErrorMessage name="F_SchemeMaster" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Name <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="Name"
                                placeholder="Enter name"
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
                                Relation Type <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="select"
                                name="F_RelationType"
                                value={values.F_RelationType}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                className="btn-square"
                                style={{ fontFamily: 'inherit' }}
                                invalid={touched.F_RelationType && !!errors.F_RelationType}
                              >
                                <option value="">Select Relation Type</option>
                                {state.FillArray.map((item) => (
                                  <option key={item.Id} value={item.Id}>
                                    {item.Name || item.RelationTypeName}
                                  </option>
                                ))}
                              </Input>
                              <ErrorMessage name="F_RelationType" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                          <Col md="6">
                            <FormGroup>
                              <Label>
                                Relation Person Name <span className="text-danger">*</span>
                              </Label>
                              <Input
                                type="text"
                                name="RelationPersonName"
                                placeholder="Enter relation person name"
                                value={values.RelationPersonName}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                invalid={touched.RelationPersonName && !!errors.RelationPersonName}
                              />
                              <ErrorMessage name="RelationPersonName" component="div" className="text-danger small" />
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardBody>
                    <CardFooter className="text-end">
                      <Btn
                        color="secondary"
                        type="button"
                        className="me-2"
                        onClick={() => navigate("/ledgerMaster")}
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

export default AddEdit_LedgerMasterContainer;
