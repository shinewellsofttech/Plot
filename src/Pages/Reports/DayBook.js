import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { Card, CardBody, Col, Container, Row, Label, Input, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_GetReport, Fn_FillListData } from '../../store/Functions';
import { API_WEB_URLS } from '../../constants/constAPI';

function DayBook() {
    const dispatch = useDispatch();
    const [gridData, setGridData] = useState([]);
    
    // API URLs for dropdowns
    const API_URL_SCHEME = API_WEB_URLS.MASTER + "/0/token/SchemeMaster";
    const API_URL_PARTY = API_WEB_URLS.MASTER + "/0/token/LedgerMaster";
    const API_URL_REPORT = 'DayBook/0/token';

    // Helper function to format date as YYYY-MM-DD without timezone issues
    const formatDateToString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Helper function to get current month start and end dates
    const getCurrentMonthDates = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        // First day of current month
        const firstDay = new Date(year, month, 1);
        const fromDate = formatDateToString(firstDay);
        
        // Last day of current month
        const lastDay = new Date(year, month + 1, 0);
        const toDate = formatDateToString(lastDay);
        
        return { fromDate, toDate };
    };

    const { fromDate: currentMonthStart, toDate: currentMonthEnd } = getCurrentMonthDates();

    const [state, setState] = useState({
        schemeOptions: [],
        partyOptions: [],
        isProgress: false,
        formData: {
            F_SchemeMaster: "",
            F_LedgerMaster: "",
            FromDate: currentMonthStart,
            ToDate: currentMonthEnd,
        },
    });

    // Helper to ensure array mapping
    const safeArray = arr => Array.isArray(arr) ? arr : [];

    useEffect(() => {
        const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
        // Load schemes
        Fn_FillListData(
            dispatch,
            setState,
            "schemeOptions",
            API_URL_SCHEME + "/TBL.F_CompanyMaster/" + obj.CompanyId
        );
    }, [dispatch]);

    // Auto-generate report on component mount with default values
    useEffect(() => {
        const generateInitialReport = async () => {
            const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
            
            setState((prev) => ({ ...prev, isProgress: true }));

            const formData = new FormData();
            formData.append("F_CompanyMaster", obj.CompanyId || "");
            
            // Append default date values (current month)
            formData.append("FromDate", currentMonthStart);
            formData.append("ToDate", currentMonthEnd);

            await Fn_GetReport(
                dispatch,
                setGridData,
                "gridData",
                API_URL_REPORT,
                { arguList: { id: 0, formData: formData } },
                true
            );

            setState((prev) => ({ ...prev, isProgress: false }));
        };

        generateInitialReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const card = e.currentTarget.closest('.card');
            if (card) {
                const inputs = Array.from(card.querySelectorAll('input, select, textarea'));
                const currentIndex = inputs.indexOf(e.currentTarget);
                if (currentIndex < inputs.length - 1) {
                    inputs[currentIndex + 1].focus();
                } else {
                    const generateButton = card.querySelector('button[onClick]');
                    if (generateButton) {
                        generateButton.focus();
                    }
                }
            }
        }
    };

    const handleSchemeChange = async (schemeId) => {
        setState((prev) => ({
            ...prev,
            formData: {
                ...prev.formData,
                F_SchemeMaster: schemeId,
                F_LedgerMaster: "", // Reset ledger when scheme changes
            },
            partyOptions: [], // Clear party options
        }));

        if (schemeId) {
            // Fetch parties based on selected scheme
            await Fn_FillListData(
                dispatch,
                setState,
                "partyOptions",
                API_URL_PARTY + "/TBL.F_SchemeMaster/" + schemeId
            );
        }
    };

    // Handle form field changes
    const handleFormChange = (field, value) => {
        setState((prev) => ({
            ...prev,
            formData: {
                ...prev.formData,
                [field]: value,
            },
        }));
    };

    const handleGenerateReport = async () => {
        const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
        
        setState((prev) => ({ ...prev, isProgress: true }));

        const formData = new FormData();
        formData.append("F_CompanyMaster", obj.CompanyId || "");
        
        // Only append filters that have values
        if (state.formData.F_SchemeMaster) {
            formData.append("F_SchemeMaster", state.formData.F_SchemeMaster);
        }
        if (state.formData.F_LedgerMaster) {
            formData.append("F_LedgerMaster", state.formData.F_LedgerMaster);
        }
        if (state.formData.FromDate) {
            formData.append("FromDate", state.formData.FromDate);
        }
        if (state.formData.ToDate) {
            formData.append("ToDate", state.formData.ToDate);
        }

        await Fn_GetReport(
            dispatch,
            setGridData,
            "gridData",
            API_URL_REPORT,
            { arguList: { id: 0, formData: formData } },
            true
        );

        setState((prev) => ({ ...prev, isProgress: false }));
    };

    // Reset filters
    const handleReset = () => {
        const { fromDate, toDate } = getCurrentMonthDates();
        setState((prev) => ({
            ...prev,
            formData: {
                F_SchemeMaster: "",
                F_LedgerMaster: "",
                FromDate: fromDate,
                ToDate: toDate,
            },
            partyOptions: [],
        }));
        setGridData([]);
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount) return '0.00';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(parseFloat(amount));
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    // Calculate totals
    const calculateTotals = () => {
        if (!gridData || gridData.length === 0) {
            return { totalReceivedAmount: 0 };
        }
        const totals = gridData.reduce((acc, row) => {
            acc.totalReceivedAmount += parseFloat(row.ReceivedAmount || 0);
            return acc;
        }, { totalReceivedAmount: 0 });
        return totals;
    };

    const totals = calculateTotals();

    return (
        <div className="page-body">
            <Breadcrumbs mainTitle="Day Book" parent="Reports" />
            <Container fluid>
                <Row>
                    <Col xs="12">
                        <Card>
                            <CardHeaderCommon title="Day Book Filters" tagClass="card-title mb-0" />
                            <CardBody>
                                {/* Filter Form */}
                                <Row className="mb-3">
                                    <Col md="3">
                                        <Label className="form-label">Scheme</Label>
                                        <select
                                            className="form-select"
                                            value={state.formData.F_SchemeMaster}
                                            onChange={(e) => handleSchemeChange(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            autoFocus
                                        >
                                            <option value="">Select Scheme</option>
                                            {safeArray(state.schemeOptions).map((option) => (
                                                <option key={option.Id} value={option.Id}>
                                                    {option.Name}
                                                </option>
                                            ))}
                                        </select>
                                    </Col>
                                    <Col md="3">
                                        <Label className="form-label">Party (Ledger)</Label>
                                        <select
                                            className="form-select"
                                            value={state.formData.F_LedgerMaster}
                                            onChange={(e) => handleFormChange("F_LedgerMaster", e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            disabled={!state.formData.F_SchemeMaster}
                                        >
                                            <option value="">Select Party</option>
                                            {safeArray(state.partyOptions).map((option) => (
                                                <option key={option.Id} value={option.Id}>
                                                    {option.Name}
                                                </option>
                                            ))}
                                        </select>
                                    </Col>
                                    <Col md="3">
                                        <Label className="form-label">From Date</Label>
                                        <Input
                                            type="date"
                                            value={state.formData.FromDate}
                                            onChange={(e) => handleFormChange("FromDate", e.target.value)}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </Col>
                                    <Col md="3">
                                        <Label className="form-label">To Date</Label>
                                        <Input
                                            type="date"
                                            value={state.formData.ToDate}
                                            onChange={(e) => handleFormChange("ToDate", e.target.value)}
                                            onKeyDown={handleKeyDown}
                                        />
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md="12" className="d-flex justify-content-end">
                                        <Btn color="primary" className="me-2" onClick={handleGenerateReport} disabled={state.isProgress}>
                                            {state.isProgress ? "Loading..." : "Generate Report"}
                                        </Btn>
                                        <Btn color="secondary" onClick={handleReset}>
                                            Reset
                                        </Btn>
                                    </Col>
                                </Row>

                                {/* Report Table */}
                                {gridData && gridData.length > 0 && (
                                    <Row className="mt-4">
                                        <Col xs="12">
                                            <Card>
                                                <CardHeaderCommon title="Day Book Details" tagClass="card-title mb-0" />
                                                <CardBody>
                                                    <div className="table-responsive">
                                                        <Table striped hover bordered className="table-hover">
                                                            <thead className="table-dark">
                                                                <tr>
                                                                    <th>#</th>
                                                                    <th>Receipt No</th>
                                                                    <th>Receipt Date</th>
                                                                    <th>Ledger Name</th>
                                                                    <th>Plot Names</th>
                                                                    <th className="text-end">Received Amount (₹)</th>
                                                                    <th>EMI Numbers</th>
                                                                    <th>Remark</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {gridData.map((row, rowIndex) => {
                                                                    const receivedAmount = parseFloat(row.ReceivedAmount || 0);
                                                                    
                                                                    return (
                                                                        <tr key={rowIndex}>
                                                                            <td>{rowIndex + 1}</td>
                                                                            <td>{row.ReceiptNo || '-'}</td>
                                                                            <td>{formatDate(row.ReceiptDate)}</td>
                                                                            <td>{row.LedgerName || '-'}</td>
                                                                            <td>{row.PlotNames || '-'}</td>
                                                                            <td className="text-end">
                                                                                <strong className="text-success">{formatCurrency(receivedAmount)}</strong>
                                                                            </td>
                                                                            <td>{row.EMI_Numbers || '-'}</td>
                                                                            <td>{row.Remark || '-'}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                            <tfoot className="table-secondary">
                                                                <tr>
                                                                    <td colSpan="5" className="text-end"><strong>Total:</strong></td>
                                                                    <td className="text-end">
                                                                        <strong className="text-success">{formatCurrency(totals.totalReceivedAmount)}</strong>
                                                                    </td>
                                                                    <td colSpan="2"></td>
                                                                </tr>
                                                            </tfoot>
                                                        </Table>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>
                                )}

                                {gridData && gridData.length === 0 && !state.isProgress && (
                                    <Row className="mt-4">
                                        <Col xs="12">
                                            <div className="text-center p-4">
                                                <p className="text-muted">No data found. Please apply filters and generate report.</p>
                                            </div>
                                        </Col>
                                    </Row>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    )
}

export default DayBook