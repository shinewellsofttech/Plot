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
const API_URL_STATE = API_WEB_URLS.MASTER + "/0/token/StateMaster";
const API_URL_SAVE = "CityMaster/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/CityMaster/Id";

const AddEdit_CityMasterContainer = () => {
  const [state, setState] = useState({
    id: 0,
    CountryArray: [],
    StateArray: [],
    FilteredStateArray: [],
    formData: {},
    isProgress: true,
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    Fn_FillListData(dispatch, setState, "CountryArray", API_URL_COUNTRY + "/Id/0");
    Fn_FillListData(dispatch, setState, "StateArray", API_URL_STATE + "/Id/0");

    const Id = (location.state && location.state.Id) || 0;

    if (Id > 0) {
      setState((prevState) => ({
        ...prevState,
        id: Id,
      }));
      Fn_DisplayData(dispatch, setState, Id, API_URL_EDIT);
    }
  }, [dispatch, location.state]);

  // Filter states when country changes
  useEffect(() => {
    if (state.formData?.F_CountryMaster && state.StateArray.length > 0) {
      const filtered = state.StateArray.filter(
        (item) => item.F_CountryMaster == state.formData.F_CountryMaster
      );
      setState((prevState) => ({
        ...prevState,
        FilteredStateArray: filtered,
      }));
    }
  }, [state.formData?.F_CountryMaster, state.StateArray]);

  const validationSchema = Yup.object({
    F_CountryMaster: Yup.string().required("Country is required"),
    F_StateMaster: Yup.string().required("State is required"),
    Name: Yup.string().required("City Name is required"),
  });

  const handleSubmit = (values) => {
    const obj = JSON.parse(localStorage.getItem("authUser") || "{}");
    let vformData = new FormData();

    vformData.append("F_CountryMaster", values.F_CountryMaster);
    vformData.append("F_StateMaster", values.F_StateMaster);
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
      "/cityMaster"
    );
  };

  const handleCountryChange = (e, setFieldValue) => {
    const countryId = e.target.value;
    setFieldValue("F_CountryMaster", countryId);
    setFieldValue("F_StateMaster", ""); // Reset state when country changes

    if (countryId) {
      const filtered = state.StateArray.filter(
        (item) => item.F_CountryMaster == countryId
      );
      setState((prevState) => ({
        ...prevState,
        FilteredStateArray: filtered,
      }));
    } else {
      setState((prevState) => ({
        ...prevState,
        FilteredStateArray: [],
      }));
    }
  };

  const isEditMode = state.id > 0;
  const initialValues = {
    F_CountryMaster: state.formData?.F_CountryMaster || "",
    F_StateMaster: state.formData?.F_StateMaster || "",
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
      <Breadcrumbs mainTitle="City Master" parent="Masters" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              enableReinitialize
            >
              {({ values, handleChange, handleBlur, errors, touched, setFieldValue }) => (
                <Form className="theme-form">
                  <Card>
                    <CardHeaderCommon
                      title={`${isEditMode ? "Edit" : "Add"} City Master`}
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
                              onChange={(e) => handleCountryChange(e, setFieldValue)}
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
                              State <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="F_StateMaster"
                              value={values.F_StateMaster}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              className="btn-square"
                              style={{ fontFamily: 'inherit' }}
                              invalid={touched.F_StateMaster && !!errors.F_StateMaster}
                              disabled={!values.F_CountryMaster}
                            >
                              <option value="">Select State</option>
                              {state.FilteredStateArray.map((item) => (
                                <option key={item.Id} value={item.Id}>
                                  {item.Name}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_StateMaster" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              City Name <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="text"
                              name="Name"
                              placeholder="Enter city name"
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
                        onClick={() => navigate("/cityMaster")}
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

export default AddEdit_CityMasterContainer;
