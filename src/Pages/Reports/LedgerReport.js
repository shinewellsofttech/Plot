import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { Card, CardBody, Col, Container, Row, Label, Input, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_GetReport, Fn_FillListData } from '../../store/Functions';
import { API_WEB_URLS } from '../../constants/constAPI';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

    // Auto-generate report when filters change
    useEffect(() => {
        if (state.formData.F_SchemeMaster && !isModalView) {
            handleGenerateReport();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.formData.F_SchemeMaster, state.formData.F_LedgerMaster, state.formData.FromDate, state.formData.ToDate]);

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

    // Format currency for PDF/Print (uses Rs. instead of ₹ for compatibility)
    const formatCurrencyPlain = (amount) => {
        if (!amount) return '0.00';
        return parseFloat(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // Export to PDF function
    const handleExportToPDF = () => {
        if (!gridData || gridData.length === 0) {
            alert('No data available to export');
            return;
        }

        const doc = new jsPDF('l', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");

        const selectedScheme = state.schemeOptions.find(s => String(s.Id) === String(state.formData.F_SchemeMaster));
        const selectedLedger = state.partyOptions.find(p => String(p.Id) === String(state.formData.F_LedgerMaster));

        // Function to add header on each page
        const addHeader = (doc) => {
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Ledger Report', pageWidth / 2, 15, { align: 'center' });

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            let yPos = 22;
            doc.text('Company: ' + (obj.CompanyName || 'N/A'), 14, yPos);
            
            let rightInfo = '';
            if (selectedScheme) rightInfo += 'Scheme: ' + selectedScheme.Name;
            if (selectedLedger) rightInfo += (rightInfo ? '  |  ' : '') + 'Party: ' + selectedLedger.Name;
            if (rightInfo) doc.text(rightInfo, pageWidth - 14, yPos, { align: 'right' });
            
            yPos += 5;
            if (state.formData.FromDate || state.formData.ToDate) {
                doc.text('Period: ' + (state.formData.FromDate || 'Start') + ' to ' + (state.formData.ToDate || 'End'), 14, yPos);
                yPos += 3;
            }
            doc.setDrawColor(200);
            doc.line(14, yPos, pageWidth - 14, yPos);
            return yPos + 3;
        };

        // Prepare table data
        const tableData = gridData.map((row, index) => {
            const prevRow = index > 0 ? gridData[index - 1] : null;
            const showSchemeName = !prevRow || prevRow.SchemeName !== row.SchemeName || prevRow.LedgerName !== row.LedgerName;
            
            return [
                index + 1,
                showSchemeName ? (row.SchemeName || '-') : '',
                showSchemeName ? (row.LedgerName || '-') : '',
                formatDate(row.EntryDate),
                row.EntryType || '-',
                row.RefNo || '-',
                row.Remark || '-',
                formatCurrencyPlain(row.Debit),
                formatCurrencyPlain(row.Credit),
                formatCurrencyPlain(row.RunningBalance)
            ];
        });

        // Add totals row
        const finalBalance = gridData.length > 0 ? formatCurrencyPlain(gridData[gridData.length - 1].RunningBalance) : '0.00';
        tableData.push([
            '', '', '', '', '', '', 'Total:',
            formatCurrencyPlain(totals.totalDebit),
            formatCurrencyPlain(totals.totalCredit),
            finalBalance
        ]);

        const startY = addHeader(doc);

        // Generate table with page break handling
        autoTable(doc, {
            startY: startY,
            head: [[
                '#', 'Scheme', 'Ledger', 'Date', 'Entry Type',
                'Ref No', 'Remarks', 'Debit (Rs.)', 'Credit (Rs.)', 'Balance (Rs.)'
            ]],
            body: tableData,
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 30 },
                2: { cellWidth: 35 },
                3: { cellWidth: 22 },
                4: { cellWidth: 25 },
                5: { cellWidth: 20 },
                6: { cellWidth: 38 },
                7: { cellWidth: 25, halign: 'right' },
                8: { cellWidth: 25, halign: 'right' },
                9: { cellWidth: 25, halign: 'right' }
            },
            margin: { top: 35, bottom: 20 },
            didDrawPage: function(data) {
                // Re-add header on every new page
                if (data.pageNumber > 1) {
                    addHeader(doc);
                }
                // Add footer with page number
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(
                    'Page ' + data.pageNumber + ' of ' + pageCount,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            },
            didParseCell: function(data) {
                if (data.row.index === tableData.length - 1 && data.row.section === 'body') {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [230, 230, 230];
                }
            }
        });

        // Update page count on all pages
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(
                'Page ' + i + ' of ' + totalPages,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
        }

        const fileName = 'Ledger_Report_' + new Date().toISOString().split('T')[0] + '.pdf';
        doc.save(fileName);
    };

    // Print function
    const handlePrint = () => {
        if (!gridData || gridData.length === 0) {
            alert('No data available to print');
            return;
        }

        const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
        const selectedScheme = state.schemeOptions.find(s => String(s.Id) === String(state.formData.F_SchemeMaster));
        const selectedLedger = state.partyOptions.find(p => String(p.Id) === String(state.formData.F_LedgerMaster));

        let rows = '';
        gridData.forEach((row, index) => {
            const prevRow = index > 0 ? gridData[index - 1] : null;
            const showSchemeName = !prevRow || prevRow.SchemeName !== row.SchemeName || prevRow.LedgerName !== row.LedgerName;
            const debit = parseFloat(row.Debit || 0);
            const credit = parseFloat(row.Credit || 0);
            const balance = parseFloat(row.RunningBalance || 0);

            rows += '<tr>' +
                '<td style="text-align:center">' + (index + 1) + '</td>' +
                '<td>' + (showSchemeName ? (row.SchemeName || '-') : '') + '</td>' +
                '<td>' + (showSchemeName ? (row.LedgerName || '-') : '') + '</td>' +
                '<td>' + formatDate(row.EntryDate) + '</td>' +
                '<td>' + (row.EntryType || '-') + '</td>' +
                '<td>' + (row.RefNo || '-') + '</td>' +
                '<td>' + (row.Remark || '-') + '</td>' +
                '<td style="text-align:right;color:' + (debit > 0 ? '#dc3545' : '#999') + '">' + (debit > 0 ? formatCurrencyPlain(debit) : '-') + '</td>' +
                '<td style="text-align:right;color:' + (credit > 0 ? '#198754' : '#999') + '">' + (credit > 0 ? formatCurrencyPlain(credit) : '-') + '</td>' +
                '<td style="text-align:right;font-weight:bold;color:' + (balance >= 0 ? '#0d6efd' : '#dc3545') + '">' + formatCurrencyPlain(balance) + '</td>' +
                '</tr>';
        });

        const finalBalance = gridData.length > 0 ? formatCurrencyPlain(gridData[gridData.length - 1].RunningBalance) : '0.00';

        const printContent = '<!DOCTYPE html><html><head><title>Ledger Report</title>' +
            '<style>' +
            '@media print {' +
            '  @page { size: landscape; margin: 10mm; }' +
            '  .no-print { display: none !important; }' +
            '  thead { display: table-header-group; }' +
            '  tfoot { display: table-footer-group; }' +
            '  tr { page-break-inside: avoid; }' +
            '}' +
            'body { font-family: Arial, sans-serif; font-size: 12px; margin: 0; padding: 15px; }' +
            '.header { text-align: center; margin-bottom: 10px; }' +
            '.header h2 { margin: 0 0 5px 0; font-size: 18px; }' +
            '.info { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 5px; }' +
            'table { width: 100%; border-collapse: collapse; font-size: 11px; }' +
            'th, td { border: 1px solid #ccc; padding: 4px 6px; }' +
            'th { background: #2980b9; color: #fff; font-weight: bold; text-align: left; }' +
            'tfoot td { background: #f0f0f0; font-weight: bold; }' +
            '.btn-row { text-align: center; margin: 15px 0; }' +
            '.btn-row button { padding: 8px 24px; font-size: 14px; margin: 0 5px; cursor: pointer; border: none; border-radius: 4px; }' +
            '.btn-print { background: #0d6efd; color: #fff; }' +
            '.btn-close-win { background: #6c757d; color: #fff; }' +
            '</style></head><body>' +
            '<div class="no-print btn-row">' +
            '<button class="btn-print" onclick="window.print()">Print</button>' +
            '<button class="btn-close-win" onclick="window.close()">Close</button>' +
            '</div>' +
            '<div class="header"><h2>Ledger Report</h2></div>' +
            '<div class="info">' +
            '<span>Company: ' + (obj.CompanyName || 'N/A') + '</span>' +
            '<span>' + (selectedScheme ? 'Scheme: ' + selectedScheme.Name : '') +
            (selectedLedger ? '  |  Party: ' + selectedLedger.Name : '') + '</span>' +
            (state.formData.FromDate || state.formData.ToDate ? '<span>Period: ' + (state.formData.FromDate || 'Start') + ' to ' + (state.formData.ToDate || 'End') + '</span>' : '') +
            '</div>' +
            '<table>' +
            '<thead><tr>' +
            '<th>#</th><th>Scheme</th><th>Ledger</th><th>Date</th><th>Entry Type</th><th>Ref No</th><th>Remarks</th>' +
            '<th style="text-align:right">Debit (Rs.)</th><th style="text-align:right">Credit (Rs.)</th><th style="text-align:right">Balance (Rs.)</th>' +
            '</tr></thead>' +
            '<tbody>' + rows + '</tbody>' +
            '<tfoot><tr>' +
            '<td colspan="7" style="text-align:right">Total:</td>' +
            '<td style="text-align:right;color:#dc3545">' + formatCurrencyPlain(totals.totalDebit) + '</td>' +
            '<td style="text-align:right;color:#198754">' + formatCurrencyPlain(totals.totalCredit) + '</td>' +
            '<td style="text-align:right">' + finalBalance + '</td>' +
            '</tr></tfoot>' +
            '</table>' +
            '</body></html>';

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
        }
    };

    // Export to Excel function
    const handleExportToExcel = () => {
        if (!gridData || gridData.length === 0) {
            alert('No data available to export');
            return;
        }

        // Prepare data for Excel
        const excelData = gridData.map((row, index) => {
            const prevRow = index > 0 ? gridData[index - 1] : null;
            const showSchemeName = !prevRow || prevRow.SchemeName !== row.SchemeName || prevRow.LedgerName !== row.LedgerName;
            const showLedgerName = showSchemeName;
            
            return {
                'Sr No': index + 1,
                'Scheme Name': showSchemeName ? (row.SchemeName || '-') : '',
                'Ledger Name': showLedgerName ? (row.LedgerName || '-') : '',
                'Date': formatDate(row.EntryDate),
                'Entry Type': row.EntryType || '-',
                'Ref No': row.RefNo || '-',
                'Remarks': row.Remark || '-',
                'Debit (₹)': parseFloat(row.Debit || 0).toFixed(2),
                'Credit (₹)': parseFloat(row.Credit || 0).toFixed(2),
                'Running Balance (₹)': parseFloat(row.RunningBalance || 0).toFixed(2)
            };
        });

        // Add totals row
        const finalBalance = gridData.length > 0 ? parseFloat(gridData[gridData.length - 1].RunningBalance || 0).toFixed(2) : '0.00';
        excelData.push({
            'Sr No': '',
            'Scheme Name': '',
            'Ledger Name': '',
            'Date': '',
            'Entry Type': '',
            'Ref No': '',
            'Remarks': 'Total:',
            'Debit (₹)': totals.totalDebit.toFixed(2),
            'Credit (₹)': totals.totalCredit.toFixed(2),
            'Running Balance (₹)': finalBalance
        });

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger Report');

        // Set column widths
        worksheet['!cols'] = [
            { wch: 8 },  // Sr No
            { wch: 25 }, // Scheme Name
            { wch: 30 }, // Ledger Name
            { wch: 15 }, // Date
            { wch: 15 }, // Entry Type
            { wch: 15 }, // Ref No
            { wch: 40 }, // Remarks
            { wch: 15 }, // Debit
            { wch: 15 }, // Credit
            { wch: 18 }  // Balance
        ];

        // Save the file
        const fileName = `Ledger_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

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
                                        <Btn color="secondary" className="me-2" onClick={handleReset}>
                                            Reset
                                        </Btn>
                                        <Btn 
                                            color="success" 
                                            className="me-2" 
                                            onClick={handleExportToExcel}
                                            disabled={!gridData || gridData.length === 0}
                                        >
                                            <i className="fa fa-file-excel-o me-1"></i> Export to Excel
                                        </Btn>
                                        <Btn 
                                            color="danger" 
                                            className="me-2"
                                            onClick={handleExportToPDF}
                                            disabled={!gridData || gridData.length === 0}
                                        >
                                            <i className="fa fa-file-pdf-o me-1"></i> Export to PDF
                                        </Btn>
                                        <Btn 
                                            color="info" 
                                            onClick={handlePrint}
                                            disabled={!gridData || gridData.length === 0}
                                        >
                                            <i className="fa fa-print me-1"></i> Print
                                        </Btn>
                                    </Col>
                                </Row>

                                {/* Report Table */}
                                {gridData && gridData.length > 0 && (
                                    <Row className="mt-4">
                                        <Col xs="12">
                                            <Card>
                                                <CardBody className="d-flex justify-content-between align-items-center pb-2">
                                                    <h5 className="mb-0">Ledger Report Details</h5>
                                                    <div>
                                                        <Btn 
                                                            color="success" 
                                                            size="sm"
                                                            className="me-2" 
                                                            onClick={handleExportToExcel}
                                                        >
                                                            <i className="fa fa-file-excel-o me-1"></i> Excel
                                                        </Btn>
                                                        <Btn 
                                                            color="danger" 
                                                            size="sm"
                                                            className="me-2"
                                                            onClick={handleExportToPDF}
                                                        >
                                                            <i className="fa fa-file-pdf-o me-1"></i> PDF
                                                        </Btn>
                                                        <Btn 
                                                            color="info" 
                                                            size="sm"
                                                            onClick={handlePrint}
                                                        >
                                                            <i className="fa fa-print me-1"></i> Print
                                                        </Btn>
                                                    </div>
                                                </CardBody>
                                                <CardBody className="pt-0">
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