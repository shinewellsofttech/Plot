import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { Card, CardBody, Col, Container, Row, Label, Input, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_GetReport, Fn_FillListData } from '../../store/Functions';
import { API_WEB_URLS } from '../../constants/constAPI';

function LedgerReport({ 
    initialSchemeId = "", 
    initialLedgerId = "", 
    initialFromDate = "", 
    initialToDate = "",
    isModalView = false 
}) {
    const dispatch = useDispatch();
    const [gridData, setGridData] = useState([]);
    
    // API URLs for dropdowns
    const API_URL_SCHEME = API_WEB_URLS.MASTER + "/0/token/SchemeMaster";
    const API_URL_PARTY = API_WEB_URLS.MASTER + "/0/token/LedgerMaster";
    const API_URL_REPORT = 'LedgerRegister/0/token';

    const [state, setState] = useState({
        schemeOptions: [],
        partyOptions: [],
        isProgress: false,
        formData: {
            F_SchemeMaster: initialSchemeId || "",
            F_LedgerMaster: initialLedgerId || "",
            FromDate: initialFromDate || "",
            ToDate: initialToDate || "",
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

    // Separate effect for auto-loading report when initial values are provided
    useEffect(() => {
        if (initialSchemeId && initialLedgerId && isModalView) {
            loadPartyOptionsAndGenerateReport(initialSchemeId, initialLedgerId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSchemeId, initialLedgerId, isModalView]);

    const loadPartyOptionsAndGenerateReport = async (schemeId, ledgerId) => {
        // Load party options for the scheme
        await Fn_FillListData(
            dispatch,
            setState,
            "partyOptions",
            API_URL_PARTY + "/TBL.F_SchemeMaster/" + schemeId
        );

        // Auto-generate report with initial values (without dates)
        setTimeout(() => {
            handleGenerateReportWithValues(schemeId, ledgerId);
        }, 500);
    };

    const handleGenerateReportWithValues = async (schemeId, ledgerId) => {
        const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
        
        setState((prev) => ({ ...prev, isProgress: true }));

        const formData = new FormData();
        formData.append("F_CompanyMaster", obj.CompanyId || "");
        formData.append("F_SchemeMaster", schemeId);
        formData.append("F_LedgerMaster", ledgerId);
        // FromDate and ToDate are not being sent (empty)

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
        setState((prev) => ({
            ...prev,
            formData: {
                F_SchemeMaster: "",
                F_LedgerMaster: "",
                FromDate: "",
                ToDate: "",
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
            return { totalDebit: 0, totalCredit: 0 };
        }
        const totals = gridData.reduce((acc, row) => {
            acc.totalDebit += parseFloat(row.Debit || 0);
            acc.totalCredit += parseFloat(row.Credit || 0);
            return acc;
        }, { totalDebit: 0, totalCredit: 0 });
        return totals;
    };

    const totals = calculateTotals();

    // If modal view, don't show breadcrumbs and adjust container
    if (isModalView) {
        return (
            <div style={{ padding: '15px' }}>
                {state.isProgress ? (
                    <div className="text-center p-4">
                        <div className="spinner-border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2">Loading report data...</p>
                    </div>
                ) : (
                    <div className="table-responsive" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <Table striped hover bordered className="table-hover">
                            <thead className="table-dark sticky-top">
                                <tr>
                                    <th>#</th>
                                    <th>Scheme Name</th>
                                    <th>Ledger Name</th>
                                    <th>Date</th>
                                    <th>Entry Type</th>
                                    <th>Ref No</th>
                                    <th>Remarks</th>
                                    <th className="text-end">Debit (₹)</th>
                                    <th className="text-end">Credit (₹)</th>
                                    <th className="text-end">Running Balance (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gridData && gridData.length > 0 ? (
                                    gridData.map((row, rowIndex) => {
                                        const debit = parseFloat(row.Debit || 0);
                                        const credit = parseFloat(row.Credit || 0);
                                        const balance = parseFloat(row.RunningBalance || 0);
                                        
                                        const prevRow = rowIndex > 0 ? gridData[rowIndex - 1] : null;
                                        const showSchemeName = !prevRow || 
                                            prevRow.SchemeName !== row.SchemeName || 
                                            prevRow.LedgerName !== row.LedgerName;
                                        const showLedgerName = showSchemeName;
                                        
                                        return (
                                            <tr key={rowIndex}>
                                                <td>{rowIndex + 1}</td>
                                                <td>{showSchemeName ? (row.SchemeName || '-') : ''}</td>
                                                <td>{showLedgerName ? (row.LedgerName || '-') : ''}</td>
                                                <td>{formatDate(row.EntryDate)}</td>
                                                <td>
                                                    <span className={`badge ${
                                                        row.EntryType === 'RECEIPT' ? 'bg-success' :
                                                        row.EntryType === 'VOUCHER' ? 'bg-primary' :
                                                        row.EntryType === 'DOWN PAYMENT' ? 'bg-info' :
                                                        'bg-secondary'
                                                    }`}>
                                                        {row.EntryType || '-'}
                                                    </span>
                                                </td>
                                                <td>{row.RefNo || '-'}</td>
                                                <td>{row.Remark || '-'}</td>
                                                <td className="text-end">
                                                    {debit > 0 ? (
                                                        <strong className="text-danger">{formatCurrency(debit)}</strong>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td className="text-end">
                                                    {credit > 0 ? (
                                                        <strong className="text-success">{formatCurrency(credit)}</strong>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td className="text-end">
                                                    <strong className={balance >= 0 ? 'text-primary' : 'text-danger'}>
                                                        {formatCurrency(balance)}
                                                    </strong>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="10" className="text-center p-4">
                                            <p className="text-muted">No data found. Please apply filters and generate report.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {gridData && gridData.length > 0 && (
                                <tfoot className="table-secondary">
                                    <tr>
                                        <td colSpan="7" className="text-end"><strong>Total:</strong></td>
                                        <td className="text-end">
                                            <strong className="text-danger">{formatCurrency(totals.totalDebit)}</strong>
                                        </td>
                                        <td className="text-end">
                                            <strong className="text-success">{formatCurrency(totals.totalCredit)}</strong>
                                        </td>
                                        <td className="text-end">
                                            <strong>
                                                {gridData.length > 0 ? formatCurrency(gridData[gridData.length - 1].RunningBalance) : '0.00'}
                                            </strong>
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </Table>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="page-body">
            <Breadcrumbs mainTitle="Ledger Report" parent="Reports" />
            <Container fluid>
                <Row>
                    <Col xs="12">
                        <Card>
                            <CardHeaderCommon title="Ledger Report Filters" tagClass="card-title mb-0" />
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
                                                <CardHeaderCommon title="Ledger Report Details" tagClass="card-title mb-0" />
                                                <CardBody>
                                                    <div className="table-responsive">
                                                        <Table striped hover bordered className="table-hover">
                                                            <thead className="table-dark">
                                                                <tr>
                                                                    <th>#</th>
                                                                    <th>Scheme Name</th>
                                                                    <th>Ledger Name</th>
                                                                    <th>Date</th>
                                                                    <th>Entry Type</th>
                                                                    <th>Ref No</th>
                                                                    <th>Remarks</th>
                                                                    <th className="text-end">Debit (₹)</th>
                                                                    <th className="text-end">Credit (₹)</th>
                                                                    <th className="text-end">Running Balance (₹)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {gridData.map((row, rowIndex) => {
                                                                    const debit = parseFloat(row.Debit || 0);
                                                                    const credit = parseFloat(row.Credit || 0);
                                                                    const balance = parseFloat(row.RunningBalance || 0);
                                                                    
                                                                    // Check if previous row has same SchemeName and LedgerName
                                                                    const prevRow = rowIndex > 0 ? gridData[rowIndex - 1] : null;
                                                                    const showSchemeName = !prevRow || 
                                                                        prevRow.SchemeName !== row.SchemeName || 
                                                                        prevRow.LedgerName !== row.LedgerName;
                                                                    const showLedgerName = showSchemeName; // Same logic for both
                                                                    
                                                                    return (
                                                                        <tr key={rowIndex}>
                                                                            <td>{rowIndex + 1}</td>
                                                                            <td>{showSchemeName ? (row.SchemeName || '-') : ''}</td>
                                                                            <td>{showLedgerName ? (row.LedgerName || '-') : ''}</td>
                                                                            <td>{formatDate(row.EntryDate)}</td>
                                                                            <td>
                                                                                <span className={`badge ${
                                                                                    row.EntryType === 'RECEIPT' ? 'bg-success' :
                                                                                    row.EntryType === 'VOUCHER' ? 'bg-primary' :
                                                                                    row.EntryType === 'DOWN PAYMENT' ? 'bg-info' :
                                                                                    'bg-secondary'
                                                                                }`}>
                                                                                    {row.EntryType || '-'}
                                                                                </span>
                                                                            </td>
                                                                            <td>{row.RefNo || '-'}</td>
                                                                            <td>{row.Remark || '-'}</td>
                                                                            <td className="text-end">
                                                                                {debit > 0 ? (
                                                                                    <strong className="text-danger">{formatCurrency(debit)}</strong>
                                                                                ) : (
                                                                                    <span className="text-muted">-</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="text-end">
                                                                                {credit > 0 ? (
                                                                                    <strong className="text-success">{formatCurrency(credit)}</strong>
                                                                                ) : (
                                                                                    <span className="text-muted">-</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="text-end">
                                                                                <strong className={balance >= 0 ? 'text-primary' : 'text-danger'}>
                                                                                    {formatCurrency(balance)}
                                                                                </strong>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                            <tfoot className="table-secondary">
                                                                <tr>
                                                                    <td colSpan="7" className="text-end"><strong>Total:</strong></td>
                                                                    <td className="text-end">
                                                                        <strong className="text-danger">{formatCurrency(totals.totalDebit)}</strong>
                                                                    </td>
                                                                    <td className="text-end">
                                                                        <strong className="text-success">{formatCurrency(totals.totalCredit)}</strong>
                                                                    </td>
                                                                    <td className="text-end">
                                                                        <strong>
                                                                            {gridData.length > 0 ? formatCurrency(gridData[gridData.length - 1].RunningBalance) : '0.00'}
                                                                        </strong>
                                                                    </td>
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

export default LedgerReport