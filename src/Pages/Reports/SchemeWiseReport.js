import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { Card, CardBody, Col, Container, Row, Label, Input, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_GetReport } from '../../store/Functions';
import { API_WEB_URLS } from '../../constants/constAPI';

function SchemeWiseReport() {
    const dispatch = useDispatch();
    const [gridData, setGridData] = useState([]);
    
    // API URL for report
    const API_URL_REPORT = 'PlotSalesReport/0/token';

    // Helper function to get date in YYYY-MM-DD format
    const getDateString = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Get default dates (last 1 year)
    const getDefaultDates = () => {
        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        return {
            FromDate: getDateString(oneYearAgo),
            ToDate: getDateString(today),
        };
    };

    const defaultDates = getDefaultDates();

    const [state, setState] = useState({
        isProgress: false,
        formData: {
            FromDate: defaultDates.FromDate,
            ToDate: defaultDates.ToDate,
        },
    });

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

    const handleGenerateReport = async () => {
        const obj = JSON.parse(localStorage.getItem("authUser") || "{}");
        
        setState((prev) => ({ ...prev, isProgress: true }));

        const formData = new FormData();
        formData.append("F_CompanyMaster", obj.CompanyId || "");
        
        // Always append date filters (they have default values)
        formData.append("FromDate", state.formData.FromDate || defaultDates.FromDate);
        formData.append("ToDate", state.formData.ToDate || defaultDates.ToDate);

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

    // Auto-load report on component mount
    useEffect(() => {
        handleGenerateReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reset filters
    const handleReset = () => {
        setState((prev) => ({
            ...prev,
            formData: {
                FromDate: defaultDates.FromDate,
                ToDate: defaultDates.ToDate,
            },
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

    // Calculate totals
    const calculateTotals = () => {
        if (!gridData || gridData.length === 0) {
            return { 
                totalPlots: 0, 
                totalPlotsSold: 0, 
                totalPendingPlots: 0,
                totalPlotsSoldAmount: 0,
                totalReceivedAmount: 0,
                totalAmountPending: 0
            };
        }
        const totals = gridData.reduce((acc, row) => {
            acc.totalPlots += parseFloat(row.TotalPlots || 0);
            acc.totalPlotsSold += parseFloat(row.TotalPlotsSold || 0);
            acc.totalPendingPlots += parseFloat(row.PendingPlots || 0);
            acc.totalPlotsSoldAmount += parseFloat(row.TotalPlotsSoldAmount || 0);
            acc.totalReceivedAmount += parseFloat(row.TotalReceivedAmount || 0);
            acc.totalAmountPending += parseFloat(row.AmountPending || 0);
            return acc;
        }, { 
            totalPlots: 0, 
            totalPlotsSold: 0, 
            totalPendingPlots: 0,
            totalPlotsSoldAmount: 0,
            totalReceivedAmount: 0,
            totalAmountPending: 0
        });
        return totals;
    };

    const totals = calculateTotals();

    return (
        <div className="page-body">
            <Breadcrumbs mainTitle="Scheme Wise Report" parent="Reports" />
            <Container fluid>
                <Row>
                    <Col xs="12">
                        <Card>
                            <CardHeaderCommon title="Scheme Wise Report Filters" tagClass="card-title mb-0" />
                            <CardBody>
                                {/* Filter Form */}
                                <Row className="mb-3">
                                    <Col md="4">
                                        <Label className="form-label">From Date</Label>
                                        <Input
                                            type="date"
                                            value={state.formData.FromDate}
                                            onChange={(e) => handleFormChange("FromDate", e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            autoFocus
                                        />
                                    </Col>
                                    <Col md="4">
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
                                                <CardHeaderCommon title="Scheme Wise Report Details" tagClass="card-title mb-0" />
                                                <CardBody>
                                                    <div className="table-responsive">
                                                        <Table striped hover bordered className="table-hover">
                                                            <thead className="table-dark">
                                                                <tr>
                                                                    <th>#</th>
                                                                    <th>Scheme Name</th>
                                                                    <th className="text-center">Total Plots</th>
                                                                    <th className="text-center">Plots Sold</th>
                                                                    <th className="text-center">Pending Plots</th>
                                                                    <th className="text-end">Total Sold Amount (₹)</th>
                                                                    <th className="text-end">Total Received (₹)</th>
                                                                    <th className="text-end">Amount Pending (₹)</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {gridData.map((row, rowIndex) => {
                                                                    const totalPlotsSoldAmount = parseFloat(row.TotalPlotsSoldAmount || 0);
                                                                    const totalReceivedAmount = parseFloat(row.TotalReceivedAmount || 0);
                                                                    const amountPending = parseFloat(row.AmountPending || 0);
                                                                    return (
                                                                        <tr key={rowIndex}>
                                                                            <td>{rowIndex + 1}</td>
                                                                            <td>
                                                                                <strong>{row.Name || '-'}</strong>
                                                                            </td>
                                                                            <td className="text-center">
                                                                                <span className="badge bg-info">{row.TotalPlots || 0}</span>
                                                                            </td>
                                                                            <td className="text-center">
                                                                                <span className="badge bg-success">{row.TotalPlotsSold || 0}</span>
                                                                            </td>
                                                                            <td className="text-center">
                                                                                <span className="badge bg-warning">{row.PendingPlots || 0}</span>
                                                                            </td>
                                                                            <td className="text-end">
                                                                                <strong className="text-primary">
                                                                                    {formatCurrency(totalPlotsSoldAmount)}
                                                                                </strong>
                                                                            </td>
                                                                            <td className="text-end">
                                                                                <strong className="text-success">
                                                                                    {formatCurrency(totalReceivedAmount)}
                                                                                </strong>
                                                                            </td>
                                                                            <td className="text-end">
                                                                                <strong className={amountPending >= 0 ? 'text-danger' : 'text-success'}>
                                                                                    {formatCurrency(amountPending)}
                                                                                </strong>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                            <tfoot className="table-secondary">
                                                                <tr>
                                                                    <td colSpan="2" className="text-end"><strong>Total:</strong></td>
                                                                    <td className="text-center">
                                                                        <strong>{totals.totalPlots}</strong>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <strong>{totals.totalPlotsSold}</strong>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <strong>{totals.totalPendingPlots}</strong>
                                                                    </td>
                                                                    <td className="text-end">
                                                                        <strong className="text-primary">{formatCurrency(totals.totalPlotsSoldAmount)}</strong>
                                                                    </td>
                                                                    <td className="text-end">
                                                                        <strong className="text-success">{formatCurrency(totals.totalReceivedAmount)}</strong>
                                                                    </td>
                                                                    <td className="text-end">
                                                                        <strong className={totals.totalAmountPending >= 0 ? 'text-danger' : 'text-success'}>
                                                                            {formatCurrency(totals.totalAmountPending)}
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

export default SchemeWiseReport