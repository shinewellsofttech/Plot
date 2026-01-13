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
const API_URL_COUNTRY = API_WEB_URLS.MASTER + "/0/token/CountryMaster";
const API_URL_STATE = API_WEB_URLS.MASTER + "/0/token/StateMaster";
const API_URL_CITY = API_WEB_URLS.MASTER + "/0/token/CityMaster";
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
    CountryArray: [],
    StateArray: [],
    CityArray: [],
    FilteredStateArray: [],
    FilteredCityArray: [],
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    Fn_FillListData(dispatch, setState, "FillArray", API_URL + "/Id/0");
    // Fetch scheme dropdown data (replace API endpoint as needed)
    Fn_FillListData(dispatch, setState, "SchemeArray", API_WEB_URLS.MASTER + "/0/token/SchemeMaster/TBL.F_CompanyMaster/"+obj.CompanyId);
    Fn_FillListData(dispatch, setState, "CountryArray", API_URL_COUNTRY + "/Id/0");
    Fn_FillListData(dispatch, setState, "StateArray", API_URL_STATE + "/Id/0");
    Fn_FillListData(dispatch, setState, "CityArray", API_URL_CITY + "/Id/0");

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
    } else {
      setState((prevState) => ({
        ...prevState,
        FilteredStateArray: [],
      }));
    }
  }, [state.formData?.F_CountryMaster, state.StateArray]);

  // Filter cities when state changes
  useEffect(() => {
    if (state.formData?.F_StateMaster && state.CityArray.length > 0) {
      const filtered = state.CityArray.filter(
        (item) => item.F_StateMaster == state.formData.F_StateMaster
      );
      setState((prevState) => ({
        ...prevState,
        FilteredCityArray: filtered,
      }));
    } else {
      setState((prevState) => ({
        ...prevState,
        FilteredCityArray: [],
      }));
    }
  }, [state.formData?.F_StateMaster, state.CityArray]);


  const validationSchema = Yup.object({
    F_SchemeMaster: Yup.string().required("Scheme is required"),
    Name: Yup.string().required("Name is required"),
    F_RelationType: Yup.string().required("Relation Type is required"),
    RelationPersonName: Yup.string().required("Relation Person Name is required"),
  });

  const handleSubmit = (values) => {
    const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    let vformData = new FormData();

    // Required fields - always append
    vformData.append("F_SchemeMaster", values.F_SchemeMaster);
    vformData.append("Name", values.Name);
    vformData.append("F_RelationType", values.F_RelationType);
    vformData.append("RelationPersonName", values.RelationPersonName);
    vformData.append("F_CompanyMaster", obj.CompanyId || "");
    vformData.append("UserId", obj.Id || obj.id || "");

    // Optional fields - only append if they have values
    if (values.PANNo && typeof values.PANNo === 'string' && values.PANNo.trim()) {
      vformData.append("PANNo", values.PANNo);
    }
    if (values.GSTNo && typeof values.GSTNo === 'string' && values.GSTNo.trim()) {
      vformData.append("GSTNo", values.GSTNo);
    }
    if (values.CreditDays && values.CreditDays !== "0" && values.CreditDays !== 0) {
      vformData.append("CreditDays", values.CreditDays);
    }
    if (values.PhoneNo && typeof values.PhoneNo === 'string' && values.PhoneNo.trim()) {
      vformData.append("PhoneNo", values.PhoneNo);
    }
    if (values.MobileNo && typeof values.MobileNo === 'string' && values.MobileNo.trim()) {
      vformData.append("MobileNo", values.MobileNo);
    }
    if (values.Email && typeof values.Email === 'string' && values.Email.trim()) {
      vformData.append("Email", values.Email);
    }
    if (values.Pincode && values.Pincode !== "0" && values.Pincode !== 0) {
      vformData.append("Pincode", values.Pincode);
    }
    if (values.F_CountryMaster && values.F_CountryMaster !== "" && values.F_CountryMaster !== "0" && values.F_CountryMaster !== 0) {
      vformData.append("F_CountryMaster", values.F_CountryMaster);
    }
    if (values.F_StateMaster && values.F_StateMaster !== "" && values.F_StateMaster !== "0" && values.F_StateMaster !== 0) {
      vformData.append("F_StateMaster", values.F_StateMaster);
    }
    if (values.F_CityMaster && values.F_CityMaster !== "" && values.F_CityMaster !== "0" && values.F_CityMaster !== 0) {
      vformData.append("F_CityMaster", values.F_CityMaster);
    }
    if (values.Address && typeof values.Address === 'string' && values.Address.trim()) {
      vformData.append("Address", values.Address);
    }
    if (values.AadharNo && typeof values.AadharNo === 'string' && values.AadharNo.trim()) {
      vformData.append("AadharNo", values.AadharNo);
    }

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

  const handleCountryChange = (e, setFieldValue) => {
    const countryId = e.target.value;
    setFieldValue("F_CountryMaster", countryId);
    setFieldValue("F_StateMaster", ""); // Reset state when country changes
    setFieldValue("F_CityMaster", ""); // Reset city when country changes

    // Filter states based on selected country - don't update formData to avoid resetting other fields
    setState((prevState) => {
      let filteredStates = [];
      let filteredCities = [];
      
      if (countryId && prevState.StateArray.length > 0) {
        filteredStates = prevState.StateArray.filter(
          (item) => item.F_CountryMaster == countryId
        );
      }

      return {
        ...prevState,
        FilteredStateArray: filteredStates,
        FilteredCityArray: filteredCities,
      };
    });
  };

  const handleStateChange = (e, setFieldValue) => {
    const stateId = e.target.value;
    setFieldValue("F_StateMaster", stateId);
    setFieldValue("F_CityMaster", ""); // Reset city when state changes

    // Filter cities based on selected state - don't update formData to avoid resetting other fields
    setState((prevState) => {
      let filteredCities = [];
      
      if (stateId && prevState.CityArray.length > 0) {
        filteredCities = prevState.CityArray.filter(
          (item) => item.F_StateMaster == stateId
        );
      }

      return {
        ...prevState,
        FilteredCityArray: filteredCities,
      };
    });
  };

  const isEditMode = state.id > 0;
  const initialValues = {
    F_SchemeMaster: state.formData?.F_SchemeMaster || "",
    Name: state.formData?.Name || "",
    F_RelationType: state.formData?.F_RelationType || "",
    RelationPersonName: state.formData?.RelationPersonName || "",
    PANNo: state.formData?.PANNo || "",
    GSTNo: state.formData?.GSTNo || "",
    CreditDays: state.formData?.CreditDays || "0",
    PhoneNo: state.formData?.PhoneNo || "",
    MobileNo: state.formData?.MobileNo || "",
    Email: state.formData?.Email || "",
    Pincode: state.formData?.Pincode || "0",
    F_CountryMaster: state.formData?.F_CountryMaster || "",
    F_StateMaster: state.formData?.F_StateMaster || "",
    F_CityMaster: state.formData?.F_CityMaster || "",
    Address: state.formData?.Address || "",
    AadharNo: state.formData?.AadharNo || "",
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
              {({ values, handleChange, handleBlur, errors, touched, setFieldValue }) => (
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
                          <Col md="4">
                            <FormGroup>
                              <Label>PAN No.</Label>
                              <Input
                                type="text"
                                name="PANNo"
                                placeholder="PAN No..."
                                value={values.PANNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Aadhar No.</Label>
                              <Input
                                type="text"
                                name="AadharNo"
                                placeholder="Aadhar No..."
                                value={values.AadharNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>GST NO.</Label>
                              <Input
                                type="text"
                                name="GSTNo"
                                placeholder="GST No..."
                                value={values.GSTNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Credit Days</Label>
                              <Input
                                type="number"
                                name="CreditDays"
                                placeholder="0"
                                value={values.CreditDays}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Phone</Label>
                              <Input
                                type="text"
                                name="PhoneNo"
                                placeholder="Phone..."
                                value={values.PhoneNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Mobile</Label>
                              <Input
                                type="text"
                                name="MobileNo"
                                placeholder="Mobile..."
                                value={values.MobileNo}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Email</Label>
                              <Input
                                type="email"
                                name="Email"
                                placeholder="Email..."
                                value={values.Email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Pincode</Label>
                              <Input
                                type="number"
                                name="Pincode"
                                placeholder="0"
                                value={values.Pincode}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>Country</Label>
                              <Input
                                type="select"
                                name="F_CountryMaster"
                                value={values.F_CountryMaster}
                                onChange={(e) => handleCountryChange(e, setFieldValue)}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                className="btn-square"
                                style={{ fontFamily: 'inherit' }}
                              >
                                <option value="">Select Country</option>
                                {state.CountryArray.map((item) => (
                                  <option key={item.Id} value={item.Id}>
                                    {item.Name}
                                  </option>
                                ))}
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>State</Label>
                              <Input
                                type="select"
                                name="F_StateMaster"
                                value={values.F_StateMaster}
                                onChange={(e) => handleStateChange(e, setFieldValue)}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                className="btn-square"
                                style={{ fontFamily: 'inherit' }}
                                disabled={!values.F_CountryMaster}
                              >
                                <option value="">Select State</option>
                                {state.FilteredStateArray.map((item) => (
                                  <option key={item.Id} value={item.Id}>
                                    {item.Name}
                                  </option>
                                ))}
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Label>City</Label>
                              <Input
                                type="select"
                                name="F_CityMaster"
                                value={values.F_CityMaster}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                                className="btn-square"
                                style={{ fontFamily: 'inherit' }}
                                disabled={!values.F_StateMaster}
                              >
                                <option value="">Select City</option>
                                {state.FilteredCityArray.map((item) => (
                                  <option key={item.Id} value={item.Id}>
                                    {item.Name}
                                  </option>
                                ))}
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col md="8">
                            <FormGroup>
                              <Label>Address</Label>
                              <Input
                                type="text"
                                name="Address"
                                placeholder="Address..."
                                value={values.Address}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                onKeyDown={handleKeyDown}
                              />
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
