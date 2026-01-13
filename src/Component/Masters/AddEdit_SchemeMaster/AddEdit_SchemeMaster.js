import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn } from "../../../AbstractElements";
import Breadcrumbs from "../../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_DisplayData, Fn_AddEditData } from "../../../store/Functions";
import { API_WEB_URLS } from "../../../constants/constAPI";
import { toast } from "react-toastify";
import { API_HELPER } from "../../../helpers/ApiHelper";

const API_URL_SAVE = "SchemeMaster/0/token";
const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/SchemeMaster/Id";

const AddEdit_SchemeMasterContainer = () => {
  const [state, setState] = useState({
    id: 0,
    formData: {},
    isProgress: true,
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
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
    Name: Yup.string().required("Scheme Name is required"),
  });

  const checkDuplicate = async (schemeName) => {
    try {
      const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
      const checkUrl = API_WEB_URLS.BASE + API_WEB_URLS.MASTER + "/0/token/SchemeMaster/TBL.F_CompanyMaster/" + obj.CompanyId;
      const response = await API_HELPER.apiGET(checkUrl);
      
      if (response && response.data && response.data.dataList) {
        const existingSchemes = response.data.dataList;
        const duplicate = existingSchemes.find(
          (scheme) => scheme.Name && scheme.Name.toLowerCase().trim() === schemeName.toLowerCase().trim() && scheme.Id !== state.id
        );
        return duplicate !== undefined;
      }
      return false;
    } catch (error) {
      console.error("Error checking duplicate:", error);
      return false;
    }
  };

  const handleSubmit = async (values) => {
    // Check for duplicate only in Add mode
    if (state.id === 0) {
      const isDuplicate = await checkDuplicate(values.Name);
      if (isDuplicate) {
        toast.warning("Scheme name already exists! Please use a different name.", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        return;
      }
    }

    const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    let vformData = new FormData();

    vformData.append("Name", values.Name);
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
      "/schemeMaster"
    );
  };

  const isEditMode = state.id > 0;
  const initialValues = {
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
        .theme-form input[type="text"] {
          color: #000000 !important;
        }
        body.dark-only .theme-form input[type="text"] {
          color: #ffffff !important;
        }
      `}</style>
      <Breadcrumbs mainTitle="Scheme Master" parent="Masters" />
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
                      title={`${isEditMode ? "Edit" : "Add"} Scheme Master`}
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Row>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Scheme Name <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="text"
                              name="Name"
                              placeholder="Enter scheme name"
                              value={values.Name}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              invalid={touched.Name && !!errors.Name}
                              autoFocus
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
                        onClick={() => navigate("/schemeMaster")}
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

export default AddEdit_SchemeMasterContainer;
