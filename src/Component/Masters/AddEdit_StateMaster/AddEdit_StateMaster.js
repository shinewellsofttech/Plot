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

const API_URL_COUNTRY = API_WEB_URLS.MASTER + "/0/token/CountryMaster";
const API_URL_SAVE = "StateMaster/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/StateMaster/Id";

const AddEdit_StateMasterContainer = () => {
  const [state, setState] = useState({
    id: 0,
    CountryArray: [],
    formData: {},
    isProgress: true,
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    Fn_FillListData(dispatch, setState, "CountryArray", API_URL_COUNTRY + "/Id/0");

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
    F_CountryMaster: Yup.string().required("Country is required"),
    Name: Yup.string().required("State Name is required"),
  });

  const handleSubmit = (values) => {
    const obj = JSON.parse(localStorage.getItem("authUser") || "{}");
    let vformData = new FormData();

    vformData.append("F_CountryMaster", values.F_CountryMaster);
    vformData.append("Name", values.Name);
    vformData.append("UserId", obj.Id || obj.id || "");

    Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData: vformData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/stateMaster"
    );
  };

  const isEditMode = state.id > 0;
  const initialValues = {
    F_CountryMaster: state.formData?.F_CountryMaster || "",
    Name: state.formData?.Name || "",
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
      <Breadcrumbs mainTitle="State Master" parent="Masters" />
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
                      title={`${isEditMode ? "Edit" : "Add"} State Master`}
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Country <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="F_CountryMaster"
                              value={values.F_CountryMaster}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              className="btn-square"
                              style={{ fontFamily: 'inherit' }}
                              invalid={touched.F_CountryMaster && !!errors.F_CountryMaster}
                              autoFocus
                            >
                              <option value="">Select Country</option>
                              {state.CountryArray.map((item) => (
                                <option key={item.Id} value={item.Id}>
                                  {item.Name}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_CountryMaster" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              State Name <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="text"
                              name="Name"
                              placeholder="Enter state name"
                              value={values.Name}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              invalid={touched.Name && !!errors.Name}
                            />
                            <ErrorMessage name="Name" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn
                        color="secondary"
                        type="button"
                        className="me-2"
                        onClick={() => navigate("/stateMaster")}
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

export default AddEdit_StateMasterContainer;
