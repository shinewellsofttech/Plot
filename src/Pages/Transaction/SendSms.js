import React, { useState, useEffect } from 'react'
import { Fn_FillListData, Fn_AddEditData } from '../../store/Functions'
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { API_WEB_URLS } from '../../constants/constAPI';
import { Card, CardBody, Col, Container, Row, Label, Input } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { toast } from "react-toastify";

function SendSms() {
    const [state, setState] = useState({
        LedgerMasterOptions: [],
        isProgress: true,
        isSaving: false,
        formData: {
            FromParty: "", // "Direct" or "Party"
            selectedLedgerIds: [],
            DirectMobileNo: "",
            SmsBody: "",
        },
    });
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const API_URL_LedgerMaster = API_WEB_URLS.MASTER + "/0/token/LedgerMaster";
    
    const fetchData = async () => {
        const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
        const response = await Fn_FillListData(
            dispatch,
            setState,
            "LedgerMasterOptions",
            API_URL_LedgerMaster + "/TBL.F_CompanyMaster/" + obj.CompanyId
          );
    }
    
    useEffect(() => {
        fetchData();
    }, [dispatch]);

    const handleLedgerChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions);
        const selectedIds = selectedOptions.map(option => option.value);
        
        setState((prev) => ({
            ...prev,
            formData: {
                ...prev.formData,
                selectedLedgerIds: selectedIds,
            },
        }));
    };

    const handleFormChange = (field, value) => {
        setState((prev) => ({
            ...prev,
            formData: {
                ...prev.formData,
                [field]: value,
            },
        }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!state.formData.FromParty || state.formData.FromParty === "") {
            toast.error("Please select From Party");
            return;
        }

        if (state.formData.FromParty === "Direct") {
            if (!state.formData.DirectMobileNo || state.formData.DirectMobileNo.trim() === "") {
                toast.error("Mobile Number is required");
                return;
            }
        } else if (state.formData.FromParty === "Party") {
            if (!state.formData.selectedLedgerIds || state.formData.selectedLedgerIds.length === 0) {
                toast.error("Please select at least one Ledger");
                return;
            }
        }

        if (!state.formData.SmsBody || state.formData.SmsBody.trim() === "") {
            toast.error("SMS Body is required");
            return;
        }

        setState((prev) => ({ ...prev, isSaving: true }));

        const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
        const API_URL_SAVE = API_WEB_URLS.BASE + "SendSms/0/token";
        
        let successCount = 0;
        let failCount = 0;
        let mobileNumbers = [];

        // Get mobile numbers based on FromParty selection
        if (state.formData.FromParty === "Direct") {
            // Direct mode: use manual mobile number
            mobileNumbers = [state.formData.DirectMobileNo.trim()];
        } else if (state.formData.FromParty === "Party") {
            // Party mode: get mobile numbers from selected ledgers
            for (const ledgerId of state.formData.selectedLedgerIds) {
                const selectedLedger = state.LedgerMasterOptions.find(
                    (ledger) => ledger.Id === parseInt(ledgerId)
                );

                if (!selectedLedger) {
                    failCount++;
                    continue;
                }

                // Use MobileNo if available, else use PhoneNo
                const mobileNumber = selectedLedger.MobileNo || selectedLedger.PhoneNo || "";

                if (!mobileNumber || mobileNumber.trim() === "") {
                    failCount++;
                    continue;
                }

                mobileNumbers.push(mobileNumber);
            }
        }

        // Loop through mobile numbers and send SMS to each
        for (const mobileNumber of mobileNumbers) {
            try {
                const formData = new FormData();
                formData.append("MobileNo", mobileNumber);
                formData.append("Message", state.formData.SmsBody || "");

                const response = await fetch(API_URL_SAVE, {
                    method: "POST",
                    body: formData,
                });

                const data = await response.json();
                console.log("data--------------->", data);

                if (data && data.success === true) {
                    successCount++;
                } else {
                    failCount++;
                }
            } catch (error) {
                console.error("Error sending SMS:", error);
                failCount++;
            }
        }

        // Show summary toast
        if (successCount > 0 && failCount === 0) {
            toast.success(`SMS sent successfully to ${successCount} recipient(s)!`);
        } else if (successCount > 0 && failCount > 0) {
            toast.warning(`SMS sent to ${successCount} recipient(s), ${failCount} failed.`);
        } else {
            toast.error("Failed to send SMS to all recipients.");
        }

        // Reset form
        setState((prev) => ({
            ...prev,
            formData: {
                FromParty: "",
                selectedLedgerIds: [],
                DirectMobileNo: "",
                SmsBody: "",
            },
            isSaving: false,
        }));
    }


    return (
        <div className="page-body">
            <Breadcrumbs mainTitle="Send SMS" parent="Transaction" />
            <Container fluid>
                <Row>
                    <Col xs="12">
                        <Card>
                            <CardHeaderCommon title="Send SMS" tagClass="card-title mb-0" />
                            <CardBody>
                                <Row className="mb-3">
                                    <Col md="12">
                                        <Label className="form-label">
                                            From Party <span className="text-danger">*</span>
                                        </Label>
                                        <select
                                            className="form-select"
                                            value={state.formData.FromParty}
                                            onChange={(e) => {
                                                handleFormChange("FromParty", e.target.value);
                                                // Clear other fields when switching
                                                if (e.target.value === "Direct") {
                                                    setState((prev) => ({
                                                        ...prev,
                                                        formData: {
                                                            ...prev.formData,
                                                            FromParty: "Direct",
                                                            selectedLedgerIds: [],
                                                        },
                                                    }));
                                                } else if (e.target.value === "Party") {
                                                    setState((prev) => ({
                                                        ...prev,
                                                        formData: {
                                                            ...prev.formData,
                                                            FromParty: "Party",
                                                            DirectMobileNo: "",
                                                        },
                                                    }));
                                                }
                                            }}
                                        >
                                            <option value="">Select From Party</option>
                                            <option value="Direct">Direct</option>
                                            <option value="Party">Party</option>
                                        </select>
                                    </Col>
                                </Row>

                                {/* Show Direct Mobile Number field when Direct is selected */}
                                {state.formData.FromParty === "Direct" && (
                                    <Row className="mb-3">
                                        <Col md="12">
                                            <Label className="form-label">
                                                Mobile Number <span className="text-danger">*</span>
                                            </Label>
                                            <Input
                                                type="text"
                                                value={state.formData.DirectMobileNo}
                                                onChange={(e) => handleFormChange("DirectMobileNo", e.target.value)}
                                                placeholder="Enter mobile number"
                                            />
                                        </Col>
                                    </Row>
                                )}

                                {/* Show Ledger dropdown when Party is selected */}
                                {state.formData.FromParty === "Party" && (
                                    <Row className="mb-3">
                                        <Col md="12">
                                            <Label className="form-label">
                                                Select Ledger(s) <span className="text-danger">*</span>
                                                <small className="text-muted ms-2">
                                                    (Hold Ctrl/Cmd to select multiple)
                                                </small>
                                            </Label>
                                            <select
                                                className="form-select"
                                                multiple
                                                style={{ minHeight: '200px' }}
                                                value={state.formData.selectedLedgerIds}
                                                onChange={handleLedgerChange}
                                            >
                                                {state.LedgerMasterOptions.map((ledger) => {
                                                    const mobileNumber = ledger.MobileNo || ledger.PhoneNo || "No mobile";
                                                    return (
                                                        <option key={ledger.Id} value={ledger.Id}>
                                                            {ledger.Name} {ledger.SchemeName ? `(${ledger.SchemeName})` : ''} - {mobileNumber}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                            <small className="text-muted">
                                                Selected: {state.formData.selectedLedgerIds.length} ledger(s)
                                            </small>
                                        </Col>
                                    </Row>
                                )}

                                <Row className="mb-3">
                                    <Col md="12">
                                        <Label className="form-label">SMS Body <span className="text-danger">*</span></Label>
                                        <Input
                                            type="textarea"
                                            rows="5"
                                            value={state.formData.SmsBody}
                                            onChange={(e) => handleFormChange("SmsBody", e.target.value)}
                                            placeholder="Enter SMS message"
                                        />
                                    </Col>
                                </Row>

                                <Row className="mt-4">
                                    <Col>
                                        <Btn
                                            color="primary"
                                            onClick={handleSubmit}
                                            disabled={
                                                state.isSaving || 
                                                !state.formData.FromParty ||
                                                (state.formData.FromParty === "Direct" && !state.formData.DirectMobileNo) ||
                                                (state.formData.FromParty === "Party" && state.formData.selectedLedgerIds.length === 0)
                                            }
                                        >
                                            {state.isSaving 
                                                ? `Sending... ${state.formData.FromParty === "Party" ? `(${state.formData.selectedLedgerIds.length} SMS)` : ""}` 
                                                : `Send SMS ${state.formData.FromParty === "Party" ? `(${state.formData.selectedLedgerIds.length} selected)` : ""}`
                                            }
                                        </Btn>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default SendSms