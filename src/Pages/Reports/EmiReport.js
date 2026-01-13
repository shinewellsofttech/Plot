import React, { useEffect, useState, useMemo } from 'react'
import { useDispatch } from 'react-redux';
import { Card, CardBody, Col, Container, Row, Label, Input, Table, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import ReactApexChart from "react-apexcharts";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_GetReport, Fn_FillListData } from '../../store/Functions';
import { API_WEB_URLS } from "../../constants/constAPI";

function EmiReport() {
    const dispatch = useDispatch();
    const [gridData, setGridData] = useState([]);
    const [hasInitialLoad, setHasInitialLoad] = useState(false);
    
    // API URLs for dropdowns
    const API_URL_SCHEME = API_WEB_URLS.MASTER + "/0/token/SchemeMaster";
    const API_URL_VOUCHER = API_WEB_URLS.MASTER + "/0/token/VoucherH";
    const API_URL_PARTY = API_WEB_URLS.MASTER + "/0/token/LedgerMaster";
    const API_URL_REPORT = 'EmiReport/0/token';

    // Helper to get first and last date of current month
    const getCurrentMonthDates = () => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        return {
            firstDate: formatDate(firstDay),
            lastDate: formatDate(lastDay)
        };
    };

    const currentMonthDates = getCurrentMonthDates();

    const [state, setState] = useState({
        schemeOptions: [],
        voucherOptions: [],
        partyOptions: [],
        isProgress: false,
        trendPeriod: 'monthly', // 'monthly', 'yearly', '5years', 'max'
        barChartPage: 0, // For pagination - 6 months at a time
        formData: {
            F_SchemeMaster: "",
            F_VoucherH: "",
            F_LedgerMaster: "",
            EMIStatus: "",
            FromDate: currentMonthDates.firstDate,
            ToDate: currentMonthDates.lastDate,
            OverdueOnly: false,
        },
        modalData: {
            isOpen: false,
            title: "",
            filteredData: [],
            filterType: "", // 'pie-status', 'donut-amount', 'bar-month'
            filterValue: "",
        },
    });

    // Helper to ensure array mapping
    const safeArray = arr => Array.isArray(arr) ? arr : [];

    // Load initial data
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

    // Auto-generate report on page load with default values
    useEffect(() => {
        const generateReportOnLoad = async () => {
            // Only generate if schemes are loaded and we haven't generated yet
            if (state.schemeOptions.length === 0 || hasInitialLoad) return;
            
            const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
            const formData = new FormData();
            
            // Always append F_CompanyMaster (required)
            formData.append("F_CompanyMaster", obj.CompanyId || "");
            
            // Append default dates (current month)
            const dates = getCurrentMonthDates();
            formData.append("FromDate", dates.firstDate);
            formData.append("ToDate", dates.lastDate);
            
            setHasInitialLoad(true);
            setState((prev) => ({ ...prev, isProgress: true }));

            await Fn_GetReport(
                dispatch,
                setGridData,
                "gridData",
                API_URL_REPORT,
                { arguList: { id: 0, formData: formData } },
                true
            );

            setState((prev) => ({ ...prev, isProgress: false, barChartPage: 0 }));
        };

        generateReportOnLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.schemeOptions.length]);

    // Handle Ctrl + Scroll for bar chart pagination
    useEffect(() => {
        const handleWheel = (e) => {
            if (e.ctrlKey && gridData && gridData.length > 0) {
                e.preventDefault();
                const sortedMonths = Object.keys(
                    gridData.reduce((acc, item) => {
                        const dueDate = item.DueDate || item.VoucherDate;
                        if (!dueDate) return acc;
                        try {
                            const date = new Date(dueDate);
                            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                            acc[monthKey] = true;
                        } catch (e) {}
                        return acc;
                    }, {})
                ).sort();
                
                const totalPages = Math.ceil(sortedMonths.length / 6);
                const currentPage = state.barChartPage;
                
                if (e.deltaY > 0) {
                    // Scroll down - next page
                    if (currentPage < totalPages - 1) {
                        setState(prev => ({ ...prev, barChartPage: currentPage + 1 }));
                    }
                } else {
                    // Scroll up - previous page
                    if (currentPage > 0) {
                        setState(prev => ({ ...prev, barChartPage: currentPage - 1 }));
                    }
                }
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [gridData, state.barChartPage]);

    // Handle Scheme change - load vouchers and parties
    const handleSchemeChange = async (schemeId) => {
        const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
        
        setState((prev) => ({
            ...prev,
            formData: {
                ...prev.formData,
                F_SchemeMaster: schemeId,
                F_VoucherH: "", // Reset voucher when scheme changes
                F_LedgerMaster: "", // Reset ledger when scheme changes
            },
            voucherOptions: [], // Clear voucher options
            partyOptions: [], // Clear party options
        }));

        if (schemeId) {
            // Fetch vouchers based on selected scheme
            await Fn_FillListData(
                dispatch,
                setState,
                "voucherOptions",
                API_URL_VOUCHER + "/TBL.F_SchemeMaster/" + schemeId
            );
            
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

    // Generate report
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
        const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
        const formData = new FormData();
        
        // Always append F_CompanyMaster (required)
        formData.append("F_CompanyMaster", obj.CompanyId || "");
        
        // Only append filters that have values
        if (state.formData.F_SchemeMaster) {
            formData.append("F_SchemeMaster", state.formData.F_SchemeMaster);
        }
        if (state.formData.F_VoucherH) {
            formData.append("F_VoucherH", state.formData.F_VoucherH);
        }
        if (state.formData.F_LedgerMaster) {
            formData.append("F_LedgerMaster", state.formData.F_LedgerMaster);
        }
        if (state.formData.EMIStatus) {
            formData.append("EMIStatus", state.formData.EMIStatus);
        }
        if (state.formData.FromDate) {
            formData.append("FromDate", state.formData.FromDate);
        }
        if (state.formData.ToDate) {
            formData.append("ToDate", state.formData.ToDate);
        }
        if (state.formData.OverdueOnly) {
            formData.append("OverdueOnly", "true");
        }

        setState((prev) => ({ ...prev, isProgress: true }));

        await Fn_GetReport(
            dispatch,
            setGridData,
            "gridData",
            API_URL_REPORT,
            { arguList: { id: 0, formData: formData } },
            true
        );

        setState((prev) => ({ ...prev, isProgress: false, barChartPage: 0 }));
    };

    // Reset filters
    const handleReset = () => {
        setState((prev) => ({
            ...prev,
            formData: {
                F_SchemeMaster: "",
                F_VoucherH: "",
                F_LedgerMaster: "",
                EMIStatus: "",
                FromDate: "",
                ToDate: "",
                OverdueOnly: false,
            },
            voucherOptions: [],
            partyOptions: [],
            barChartPage: 0,
        }));
        setGridData([]);
    };

    // EMI Status options
    const emiStatusOptions = [
        { Id: "", Name: "All" },
        { Id: "0", Name: "Pending" },
        { Id: "1", Name: "Paid" },
    ];

    // Calculate summary statistics
    const summaryStats = useMemo(() => {
        if (!gridData || gridData.length === 0) {
            return {
                totalEMIs: 0,
                totalEMIAmount: 0,
                totalPaidAmount: 0,
                totalPendingAmount: 0,
                paidCount: 0,
                pendingCount: 0,
                overdueCount: 0,
                totalOverdueDays: 0,
            };
        }

        const stats = gridData.reduce((acc, item) => {
            const emiAmount = parseFloat(item.EMIAmount) || 0;
            const pendingAmount = parseFloat(item.PendingAmount) || 0;
            const paidAmount = emiAmount - pendingAmount;
            const overdueDays = parseFloat(item.OverdueDays) || 0;

            acc.totalEMIs += 1;
            acc.totalEMIAmount += emiAmount;
            acc.totalPaidAmount += paidAmount;
            acc.totalPendingAmount += pendingAmount;
            
            if (item.EMIStatus === "Paid") {
                acc.paidCount += 1;
            } else if (item.EMIStatus === "Pending") {
                acc.pendingCount += 1;
            }
            
            if (overdueDays > 0) {
                acc.overdueCount += 1;
                acc.totalOverdueDays += overdueDays;
            }

            return acc;
        }, {
            totalEMIs: 0,
            totalEMIAmount: 0,
            totalPaidAmount: 0,
            totalPendingAmount: 0,
            paidCount: 0,
            pendingCount: 0,
            overdueCount: 0,
            totalOverdueDays: 0,
        });

        return stats;
    }, [gridData]);

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount);
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
            return 'N/A';
        }
    };

    // Pie Chart Data for EMI Status
    const pieChartOptions = useMemo(() => ({
        chart: {
            type: 'pie',
            height: 350,
            events: {
                dataPointSelection: function(event, chartContext, config) {
                    const selectedIndex = config.dataPointIndex;
                    const status = selectedIndex === 0 ? 'Paid' : 'Pending';
                    const filteredData = gridData.filter(item => {
                        if (status === 'Paid') {
                            return item.EMIStatus === 'Paid';
                        } else {
                            return item.EMIStatus === 'Pending' || !item.EMIStatus;
                        }
                    });
                    
                    setState(prev => ({
                        ...prev,
                        modalData: {
                            isOpen: true,
                            title: `${status} EMIs Details`,
                            filteredData: filteredData,
                            filterType: 'pie-status',
                            filterValue: status,
                        }
                    }));
                }
            }
        },
        labels: ['Paid', 'Pending'],
        series: [summaryStats.paidCount, summaryStats.pendingCount],
        colors: ['#51bb25', '#f8d62b'],
        legend: {
            position: 'bottom',
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    width: 200
                },
                legend: {
                    position: 'bottom'
                }
            }
        }]
    }), [summaryStats, gridData]);

    // Donut Chart for Amount Distribution
    const donutChartOptions = useMemo(() => ({
        chart: {
            type: 'donut',
            height: 350,
            events: {
                dataPointSelection: function(event, chartContext, config) {
                    const selectedIndex = config.dataPointIndex;
                    const amountType = selectedIndex === 0 ? 'Paid' : 'Pending';
                    let filteredData = [];
                    
                    if (amountType === 'Paid') {
                        filteredData = gridData.filter(item => {
                            const emiAmount = parseFloat(item.EMIAmount) || 0;
                            const pendingAmount = parseFloat(item.PendingAmount) || 0;
                            const paidAmount = emiAmount - pendingAmount;
                            return paidAmount > 0;
                        });
                    } else {
                        filteredData = gridData.filter(item => {
                            const pendingAmount = parseFloat(item.PendingAmount) || 0;
                            return pendingAmount > 0;
                        });
                    }
                    
                    setState(prev => ({
                        ...prev,
                        modalData: {
                            isOpen: true,
                            title: `${amountType} Amount EMIs Details`,
                            filteredData: filteredData,
                            filterType: 'donut-amount',
                            filterValue: amountType,
                        }
                    }));
                }
            }
        },
        labels: ['Paid Amount', 'Pending Amount'],
        series: [summaryStats.totalPaidAmount, summaryStats.totalPendingAmount],
        colors: ['#51bb25', '#dc3545'],
        legend: {
            position: 'bottom',
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '65%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                        },
                        value: {
                            show: true,
                            formatter: (val) => formatCurrency(val)
                        },
                        total: {
                            show: true,
                            label: 'Total',
                            formatter: () => formatCurrency(summaryStats.totalEMIAmount)
                        }
                    }
                }
            }
        }
    }), [summaryStats, gridData]);

    // Monthly Bar Chart - Expected vs Received Amount by Month
    const barChartOptions = useMemo(() => {
        if (!gridData || gridData.length === 0) return null;

        // Group data by month based on DueDate
        const monthlyData = {};
        
        gridData.forEach(item => {
            const dueDate = item.DueDate || item.VoucherDate;
            if (!dueDate) return;
            
            try {
                const date = new Date(dueDate);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const monthLabel = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                
                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = {
                        label: monthLabel,
                        expectedAmount: 0,
                        receivedAmount: 0,
                        count: 0
                    };
                }
                
                const emiAmount = parseFloat(item.EMIAmount) || 0;
                const pendingAmount = parseFloat(item.PendingAmount) || 0;
                const paidAmount = emiAmount - pendingAmount;
                
                monthlyData[monthKey].expectedAmount += emiAmount;
                monthlyData[monthKey].receivedAmount += paidAmount;
                monthlyData[monthKey].count += 1;
            } catch (e) {
                console.error('Error parsing date:', dueDate, e);
            }
        });

        // Sort by month key (chronologically)
        const sortedMonths = Object.keys(monthlyData).sort();
        
        // Show only 6 months at a time with pagination
        const monthsPerPage = 6;
        const startIndex = state.barChartPage * monthsPerPage;
        const endIndex = startIndex + monthsPerPage;
        const paginatedMonths = sortedMonths.slice(startIndex, endIndex);
        
        const monthLabels = paginatedMonths.map(key => monthlyData[key].label);
        const expectedData = paginatedMonths.map(key => monthlyData[key].expectedAmount);
        const receivedData = paginatedMonths.map(key => monthlyData[key].receivedAmount);

        // Store monthlyData and paginatedMonths for use in event handler
        const chartMonthlyData = monthlyData;
        const chartPaginatedMonths = paginatedMonths;

        return {
            chart: {
                type: 'bar',
                height: 600,
                toolbar: {
                    show: false,
                },
                stacked: false, // Grouped bars for comparison
                events: {
                    dataPointSelection: function(event, chartContext, config) {
                        const dataPointIndex = config.dataPointIndex;
                        const seriesIndex = config.seriesIndex;
                        const monthKey = chartPaginatedMonths[dataPointIndex];
                        const monthLabel = chartMonthlyData[monthKey]?.label || 'Unknown Month';
                        
                        // Filter data for the selected month
                        const filteredData = gridData.filter(item => {
                            const dueDate = item.DueDate || item.VoucherDate;
                            if (!dueDate) return false;
                            try {
                                const date = new Date(dueDate);
                                const itemMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                                return itemMonthKey === monthKey;
                            } catch (e) {
                                return false;
                            }
                        });
                        
                        const barType = seriesIndex === 0 ? 'Expected' : 'Received';
                        
                        setState(prev => ({
                            ...prev,
                            modalData: {
                                isOpen: true,
                                title: `${monthLabel} - ${barType} Amount EMIs`,
                                filteredData: filteredData,
                                filterType: 'bar-month',
                                filterValue: `${monthKey}-${barType}`,
                            }
                        }));
                    }
                }
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '85%',
                    barHeight: '100%',
                    dataLabels: {
                        position: 'center',
                    },
                },
            },
            dataLabels: {
                enabled: true,
                formatter: function(val, opts) {
                    if (val > 0) {
                        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                        if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
                        return `₹${Math.round(val)}`;
                    }
                    return '';
                },
                offsetY: 0,
                style: {
                    fontSize: '14px',
                    fontWeight: 700,
                    colors: ['#ffffff']
                },
                background: {
                    enabled: false
                }
            },
            series: [
                {
                    name: 'Expected Amount (Due)',
                    data: expectedData,
                    dataLabels: {
                        offsetY: 0,
                        style: {
                            fontSize: '14px',
                            fontWeight: 700,
                            colors: ['#ffffff']
                        },
                        background: {
                            enabled: false
                        }
                    }
                },
                {
                    name: 'Received Amount (Paid)',
                    data: receivedData,
                    dataLabels: {
                        offsetY: 0,
                        style: {
                            fontSize: '14px',
                            fontWeight: 700,
                            colors: ['#ffffff']
                        },
                        background: {
                            enabled: false
                        }
                    }
                }
            ],
            xaxis: {
                categories: monthLabels,
                title: {
                    text: 'Month',
                    style: {
                        fontSize: '14px',
                        fontWeight: 600
                    }
                },
                labels: {
                    style: {
                        fontSize: '12px'
                    },
                    rotate: -45,
                    rotateAlways: false
                }
            },
            yaxis: {
                title: {
                    text: 'Amount (₹)',
                    style: {
                        fontSize: '14px',
                        fontWeight: 600
                    }
                },
                labels: {
                    formatter: (val) => {
                        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                        if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
                        return `₹${val.toLocaleString('en-IN')}`;
                    },
                    style: {
                        fontSize: '11px'
                    }
                }
            },
            colors: ['#5C61F2', '#51bb25'], // Blue for Expected, Green for Received
            legend: {
                position: 'top',
                horizontalAlign: 'center',
                fontSize: '14px',
                fontWeight: 600,
                markers: {
                    width: 12,
                    height: 12,
                    radius: 6
                }
            },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: (val) => formatCurrency(val)
                },
                custom: function({series, seriesIndex, dataPointIndex, w}) {
                    const expected = series[0][dataPointIndex];
                    const received = series[1][dataPointIndex];
                    const pending = expected - received;
                    const receivedPercent = expected > 0 ? ((received / expected) * 100).toFixed(1) : 0;
                    const pendingPercent = expected > 0 ? ((pending / expected) * 100).toFixed(1) : 0;
                    const monthData = monthlyData[paginatedMonths[dataPointIndex]];
                    
                    return `
                        <div style="padding: 10px; background: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                            <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px; color: #5C61F2;">
                                ${w.globals.categoryLabels[dataPointIndex]}
                            </div>
                            <div style="margin-bottom: 5px;">
                                <span style="color: #5C61F2; font-weight: 600;">Expected (Due):</span> 
                                <span style="font-weight: 600;">${formatCurrency(expected)}</span>
                            </div>
                            <div style="margin-bottom: 5px;">
                                <span style="color: #51bb25; font-weight: 600;">Received (Paid):</span> 
                                <span style="font-weight: 600;">${formatCurrency(received)} (${receivedPercent}%)</span>
                            </div>
                            <div style="margin-bottom: 5px;">
                                <span style="color: #dc3545; font-weight: 600;">Pending:</span> 
                                <span style="font-weight: 600;">${formatCurrency(pending)} (${pendingPercent}%)</span>
                            </div>
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 11px; color: #666;">
                                Total EMIs: ${monthData.count} | Collection Rate: ${receivedPercent}%
                            </div>
                        </div>
                    `;
                }
            },
            grid: {
                padding: {
                    top: 20,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            },
            fill: {
                opacity: 0.9
            },
            monthlyData: monthlyData,
            paginatedMonths: paginatedMonths
        };
    }, [gridData, state.barChartPage]);

    // Area Chart for Trends Over Time with different time periods
    const areaChartOptions = useMemo(() => {
        if (!gridData || gridData.length === 0) return null;

        const trendPeriod = state.trendPeriod;
        const now = new Date();
        let filteredData = [...gridData];

        // Filter data based on selected period
        if (trendPeriod === '5years') {
            const fiveYearsAgo = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
            filteredData = gridData.filter(item => {
                const date = new Date(item.DueDate || item.VoucherDate);
                return date >= fiveYearsAgo;
            });
        } else if (trendPeriod === 'yearly') {
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
            filteredData = gridData.filter(item => {
                const date = new Date(item.DueDate || item.VoucherDate);
                return date >= oneYearAgo;
            });
        } else if (trendPeriod === 'monthly') {
            const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            filteredData = gridData.filter(item => {
                const date = new Date(item.DueDate || item.VoucherDate);
                return date >= oneMonthAgo;
            });
        }
        // 'max' uses all data, no filtering needed

        // Group data based on period
        const groupedData = {};
        
        filteredData.forEach(item => {
            const date = new Date(item.DueDate || item.VoucherDate);
            if (isNaN(date.getTime())) return;

            let key, label;
            
            if (trendPeriod === 'monthly') {
                // Group by day
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                label = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
            } else if (trendPeriod === 'yearly') {
                // Group by month
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                label = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            } else if (trendPeriod === '5years') {
                // Group by year
                key = `${date.getFullYear()}`;
                label = date.getFullYear().toString();
            } else {
                // Max - group by month for all data
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                label = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
            }

            if (!groupedData[key]) {
                groupedData[key] = {
                    label: label,
                    emiAmount: 0,
                    pendingAmount: 0,
                    paidAmount: 0,
                    count: 0
                };
            }

            const emiAmount = parseFloat(item.EMIAmount) || 0;
            const pendingAmount = parseFloat(item.PendingAmount) || 0;
            const paidAmount = emiAmount - pendingAmount;

            groupedData[key].emiAmount += emiAmount;
            groupedData[key].pendingAmount += pendingAmount;
            groupedData[key].paidAmount += paidAmount;
            groupedData[key].count += 1;
        });

        // Sort by key (chronologically)
        const sortedKeys = Object.keys(groupedData).sort();
        const categories = sortedKeys.map(key => groupedData[key].label);
        const emiData = sortedKeys.map(key => groupedData[key].emiAmount);
        const pendingData = sortedKeys.map(key => groupedData[key].pendingAmount);
        const paidData = sortedKeys.map(key => groupedData[key].paidAmount);

        // Determine period label
        let periodLabel = 'Date';
        if (trendPeriod === 'monthly') periodLabel = 'Day';
        else if (trendPeriod === 'yearly') periodLabel = 'Month';
        else if (trendPeriod === '5years') periodLabel = 'Year';
        else periodLabel = 'Month';

        return {
            chart: {
                type: 'area',
                height: 400,
                toolbar: {
                    show: false,
                },
                zoom: {
                    enabled: true,
                    type: 'x',
                    autoScaleYaxis: true
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth',
                width: 2
            },
            series: [
                {
                    name: 'Total EMI Amount',
                    data: emiData
                },
                {
                    name: 'Paid Amount',
                    data: paidData
                },
                {
                    name: 'Pending Amount',
                    data: pendingData
                }
            ],
            xaxis: {
                categories: categories,
                title: {
                    text: periodLabel
                },
                labels: {
                    rotate: -45,
                    rotateAlways: false,
                    style: {
                        fontSize: '11px'
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Amount (₹)'
                },
                labels: {
                    formatter: (val) => {
                        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
                        if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
                        return `₹${val.toLocaleString('en-IN')}`;
                    },
                    style: {
                        fontSize: '11px'
                    }
                }
            },
            colors: ['#5C61F2', '#51bb25', '#dc3545'],
            legend: {
                position: 'top',
                horizontalAlign: 'center',
            },
            tooltip: {
                shared: true,
                intersect: false,
                y: {
                    formatter: (val) => formatCurrency(val)
                },
                custom: function({series, seriesIndex, dataPointIndex, w}) {
                    const totalEMI = series[0][dataPointIndex];
                    const paid = series[1][dataPointIndex];
                    const pending = series[2][dataPointIndex];
                    const paidPercent = totalEMI > 0 ? ((paid / totalEMI) * 100).toFixed(1) : 0;
                    const pendingPercent = totalEMI > 0 ? ((pending / totalEMI) * 100).toFixed(1) : 0;
                    const key = sortedKeys[dataPointIndex];
                    const data = groupedData[key];
                    
                    return `
                        <div style="padding: 10px; background: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">
                            <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px; color: #5C61F2;">
                                ${w.globals.categoryLabels[dataPointIndex]}
                            </div>
                            <div style="margin-bottom: 5px;">
                                <span style="color: #5C61F2; font-weight: 600;">Total EMI:</span> 
                                <span style="font-weight: 600;">${formatCurrency(totalEMI)}</span>
                            </div>
                            <div style="margin-bottom: 5px;">
                                <span style="color: #51bb25; font-weight: 600;">Paid:</span> 
                                <span style="font-weight: 600;">${formatCurrency(paid)} (${paidPercent}%)</span>
                            </div>
                            <div style="margin-bottom: 5px;">
                                <span style="color: #dc3545; font-weight: 600;">Pending:</span> 
                                <span style="font-weight: 600;">${formatCurrency(pending)} (${pendingPercent}%)</span>
                            </div>
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-size: 11px; color: #666;">
                                Total EMIs: ${data.count}
                            </div>
                        </div>
                    `;
                }
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.9,
                    stops: [0, 90, 100]
                }
            },
            grid: {
                padding: {
                    top: 10,
                    right: 10,
                    bottom: 10,
                    left: 10
                }
            }
        };
    }, [gridData, state.trendPeriod]);

    return (
        <div className="page-body">
            <Breadcrumbs mainTitle="EMI Report" parent="Reports" />
            <Container fluid>
                <Row>
                    <Col xs="12">
                        <Card>
                            <CardHeaderCommon title="EMI Report Filters" tagClass="card-title mb-0" />
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
                                        <Label className="form-label">Voucher</Label>
                                        <select
                                            className="form-select"
                                            value={state.formData.F_VoucherH}
                                            onChange={(e) => handleFormChange("F_VoucherH", e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            disabled={!state.formData.F_SchemeMaster}
                                        >
                                            <option value="">Select Voucher</option>
                                            {safeArray(state.voucherOptions).map((option) => (
                                                <option key={option.Id} value={option.Id}>
                                                    {option.LedgerName || `Voucher #${option.Id}`}
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
                                        <Label className="form-label">EMI Status</Label>
                                        <select
                                            className="form-select"
                                            value={state.formData.EMIStatus}
                                            onChange={(e) => handleFormChange("EMIStatus", e.target.value)}
                                            onKeyDown={handleKeyDown}
                                        >
                                            {emiStatusOptions.map((option) => (
                                                <option key={option.Id} value={option.Id}>
                                                    {option.Name}
                                                </option>
                                            ))}
                                        </select>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
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
                                    <Col md="3">
                                        <Label className="form-label mt-4">
                                            <Input
                                                type="checkbox"
                                                checked={state.formData.OverdueOnly}
                                                onChange={(e) => handleFormChange("OverdueOnly", e.target.checked)}
                                                className="me-2"
                                            />
                                            Show Overdue Only
                                        </Label>
                                    </Col>
                                    <Col md="3" className="d-flex align-items-end">
                                        <Btn color="primary" className="me-2" onClick={handleGenerateReport} disabled={state.isProgress}>
                                            {state.isProgress ? "Loading..." : "Generate Report"}
                                        </Btn>
                                        <Btn color="secondary" onClick={handleReset}>
                                            Reset
                                        </Btn>
                                    </Col>
                                </Row>

                                {/* Summary Cards */}
                                {gridData && gridData.length > 0 && (
                                    <Row className="mt-4">
                                        <Col md="3" sm="6">
                                            <Card className="text-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                                                <CardBody>
                                                    <h5 className="mb-2">Total EMIs</h5>
                                                    <h2 className="mb-0">{summaryStats.totalEMIs}</h2>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md="3" sm="6">
                                            <Card className="text-center" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                                                <CardBody>
                                                    <h5 className="mb-2">Total EMI Amount</h5>
                                                    <h4 className="mb-0">{formatCurrency(summaryStats.totalEMIAmount)}</h4>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md="3" sm="6">
                                            <Card className="text-center" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                                                <CardBody>
                                                    <h5 className="mb-2">Paid Amount</h5>
                                                    <h4 className="mb-0">{formatCurrency(summaryStats.totalPaidAmount)}</h4>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md="3" sm="6">
                                            <Card className="text-center" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                                                <CardBody>
                                                    <h5 className="mb-2">Pending Amount</h5>
                                                    <h4 className="mb-0">{formatCurrency(summaryStats.totalPendingAmount)}</h4>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>
                                )}

                                {/* Additional Summary Cards */}
                                {gridData && gridData.length > 0 && (
                                    <Row className="mt-3">
                                        <Col md="3" sm="6">
                                            <Card className="text-center border-success">
                                                <CardBody>
                                                    <h6 className="text-success mb-2">
                                                        <i className="fa fa-check-circle me-2"></i>Paid EMIs
                                                    </h6>
                                                    <h3 className="mb-0 text-success">{summaryStats.paidCount}</h3>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md="3" sm="6">
                                            <Card className="text-center border-warning">
                                                <CardBody>
                                                    <h6 className="text-warning mb-2">
                                                        <i className="fa fa-clock me-2"></i>Pending EMIs
                                                    </h6>
                                                    <h3 className="mb-0 text-warning">{summaryStats.pendingCount}</h3>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md="3" sm="6">
                                            <Card className="text-center border-danger">
                                                <CardBody>
                                                    <h6 className="text-danger mb-2">
                                                        <i className="fa fa-exclamation-triangle me-2"></i>Overdue EMIs
                                                    </h6>
                                                    <h3 className="mb-0 text-danger">{summaryStats.overdueCount}</h3>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                        <Col md="3" sm="6">
                                            <Card className="text-center border-info">
                                                <CardBody>
                                                    <h6 className="text-info mb-2">
                                                        <i className="fa fa-calendar me-2"></i>Avg Overdue Days
                                                    </h6>
                                                    <h3 className="mb-0 text-info">
                                                        {summaryStats.overdueCount > 0 
                                                            ? Math.round(summaryStats.totalOverdueDays / summaryStats.overdueCount)
                                                            : 0}
                                                    </h3>
                                                </CardBody>
                                            </Card>
                                        </Col>
                                    </Row>
                                )}

                                {/* Charts Section */}
                                {gridData && gridData.length > 0 && (
                                    <Row className="mt-4">
                                        {/* Pie Chart - EMI Status */}
                                        <Col md="6" className="mb-4">
                                            <Card>
                                                <CardHeaderCommon title="EMI Status Distribution" tagClass="card-title mb-0" />
                                                <CardBody>
                                                    <ReactApexChart
                                                        options={pieChartOptions}
                                                        series={pieChartOptions.series}
                                                        type="pie"
                                                        height={350}
                                                    />
                                                </CardBody>
                                            </Card>
                                        </Col>

                                        {/* Donut Chart - Amount Distribution */}
                                        <Col md="6" className="mb-4">
                                            <Card>
                                                <CardHeaderCommon title="Amount Distribution" tagClass="card-title mb-0" />
                                                <CardBody>
                                                    <ReactApexChart
                                                        options={donutChartOptions}
                                                        series={donutChartOptions.series}
                                                        type="donut"
                                                        height={350}
                                                    />
                                                </CardBody>
                                            </Card>
                                        </Col>

                                        {/* Monthly Bar Chart - Expected vs Received Amount */}
                                        {barChartOptions && (
                                            <Col md="12" className="mb-4">
                                                <Card>
                                                    <CardHeaderCommon 
                                                        title="Monthly EMI Collection Report (Expected vs Received)" 
                                                        tagClass="card-title mb-0" 
                                                    />
                                                    <CardBody>
                                                        <div className="mb-3 d-flex justify-content-between align-items-center">
                                                            <small className="text-muted">
                                                                <i className="fa fa-info-circle me-1"></i>
                                                                Blue bars show Expected Amount (Due), Green bars show Received Amount (Paid). Amounts shown inside bars.
                                                            </small>
                                                            {barChartOptions && (() => {
                                                                const totalMonths = Object.keys(
                                                                    gridData.reduce((acc, item) => {
                                                                        const dueDate = item.DueDate || item.VoucherDate;
                                                                        if (!dueDate) return acc;
                                                                        try {
                                                                            const date = new Date(dueDate);
                                                                            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                                                                            acc[monthKey] = true;
                                                                        } catch (e) {}
                                                                        return acc;
                                                                    }, {})
                                                                ).length;
                                                                const totalPages = Math.ceil(totalMonths / 6);
                                                                const currentPage = state.barChartPage + 1;
                                                                return (
                                                                    <div className="d-flex align-items-center gap-3">
                                                                        <small className="text-muted">
                                                                            Page {currentPage} of {totalPages} | 
                                                                            <span className="ms-2">
                                                                                <i className="fa fa-mouse me-1"></i>
                                                                                Ctrl + Scroll to navigate
                                                                            </span>
                                                                        </small>
                                                                        <div className="btn-group btn-group-sm">
                                                                            <Btn 
                                                                                color="secondary" 
                                                                                onClick={() => setState(prev => ({ ...prev, barChartPage: Math.max(0, prev.barChartPage - 1) }))}
                                                                                disabled={state.barChartPage === 0}
                                                                            >
                                                                                <i className="fa fa-chevron-left"></i> Prev
                                                                            </Btn>
                                                                            <Btn 
                                                                                color="secondary" 
                                                                                onClick={() => setState(prev => ({ ...prev, barChartPage: Math.min(totalPages - 1, prev.barChartPage + 1) }))}
                                                                                disabled={state.barChartPage >= totalPages - 1}
                                                                            >
                                                                                Next <i className="fa fa-chevron-right"></i>
                                                                            </Btn>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                        <ReactApexChart
                                                            options={barChartOptions}
                                                            series={barChartOptions.series}
                                                            type="bar"
                                                            height={600}
                                                        />
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        )}

                                        {/* Area Chart - Trends Over Time */}
                                        {areaChartOptions && (
                                            <Col md="12" className="mb-4">
                                                <Card>
                                                    <CardHeaderCommon title="EMI Trends Over Time" tagClass="card-title mb-0" />
                                                    <CardBody>
                                                        <Row className="mb-3">
                                                            <Col md="4">
                                                                <Label className="form-label">
                                                                    <i className="fa fa-calendar me-2"></i>Select Time Period
                                                                </Label>
                                                                <select
                                                                    className="form-select"
                                                                    value={state.trendPeriod}
                                                                    onChange={(e) => setState(prev => ({ ...prev, trendPeriod: e.target.value }))}
                                                                >
                                                                    <option value="monthly">Last 1 Month (Daily View)</option>
                                                                    <option value="yearly">Last 1 Year (Monthly View)</option>
                                                                    <option value="5years">Last 5 Years (Yearly View)</option>
                                                                    <option value="max">All Time (Monthly View)</option>
                                                                </select>
                                                            </Col>
                                                            <Col md="8" className="d-flex align-items-end">
                                                                <small className="text-muted">
                                                                    <i className="fa fa-info-circle me-1"></i>
                                                                    Shows Total EMI Amount, Paid Amount, and Pending Amount trends over selected period
                                                                </small>
                                                            </Col>
                                                        </Row>
                                                        <ReactApexChart
                                                            options={areaChartOptions}
                                                            series={areaChartOptions.series}
                                                            type="area"
                                                            height={400}
                                                        />
                                                    </CardBody>
                                                </Card>
                                            </Col>
                                        )}
                                    </Row>
                                )}

                                {/* Enhanced Report Table */}
                                {gridData && gridData.length > 0 && (
                                    <Row className="mt-4">
                                        <Col xs="12">
                                            <Card>
                                                <CardHeaderCommon title="EMI Report Details" tagClass="card-title mb-0" />
                                                <CardBody>
                                                    <div className="table-responsive">
                                                        <Table striped hover bordered className="table-hover">
                                                            <thead className="table-dark">
                                                                <tr>
                                                                    <th>#</th>
                                                                    <th>Installment #</th>
                                                                    <th>Customer Name</th>
                                                                    <th>Voucher Date</th>
                                                                    <th>Due Date</th>
                                                                    <th>EMI Amount</th>
                                                                    <th>Paid Amount</th>
                                                                    <th>Pending Amount</th>
                                                                    <th>Status</th>
                                                                    <th>Overdue Days</th>
                                                                    <th>Mobile No</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {gridData.map((row, rowIndex) => {
                                                                    const emiAmount = parseFloat(row.EMIAmount) || 0;
                                                                    const pendingAmount = parseFloat(row.PendingAmount) || 0;
                                                                    const paidAmount = emiAmount - pendingAmount;
                                                                    const isOverdue = (parseFloat(row.OverdueDays) || 0) > 0;
                                                                    const statusClass = row.EMIStatus === "Paid" 
                                                                        ? "badge bg-success" 
                                                                        : isOverdue 
                                                                        ? "badge bg-danger" 
                                                                        : "badge bg-warning";

                                                                    return (
                                                                        <tr key={rowIndex}>
                                                                            <td>{rowIndex + 1}</td>
                                                                            <td><strong>{row.InstallmentNo || '-'}</strong></td>
                                                                            <td>{row.CustomerName || '-'}</td>
                                                                            <td>{formatDate(row.VoucherDate)}</td>
                                                                            <td>{formatDate(row.DueDate)}</td>
                                                                            <td className="text-end"><strong>{formatCurrency(emiAmount)}</strong></td>
                                                                            <td className="text-end text-success"><strong>{formatCurrency(paidAmount)}</strong></td>
                                                                            <td className="text-end text-danger"><strong>{formatCurrency(pendingAmount)}</strong></td>
                                                                            <td>
                                                                                <span className={statusClass}>
                                                                                    {row.EMIStatus || 'Pending'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="text-center">
                                                                                {isOverdue ? (
                                                                                    <span className="badge bg-danger">
                                                                                        {row.OverdueDays} days
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-success">-</span>
                                                                                )}
                                                                            </td>
                                                                            <td>{row.MobileNo || '-'}</td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                            <tfoot className="table-secondary">
                                                                <tr>
                                                                    <td colSpan="5" className="text-end"><strong>Total:</strong></td>
                                                                    <td className="text-end"><strong>{formatCurrency(summaryStats.totalEMIAmount)}</strong></td>
                                                                    <td className="text-end text-success"><strong>{formatCurrency(summaryStats.totalPaidAmount)}</strong></td>
                                                                    <td className="text-end text-danger"><strong>{formatCurrency(summaryStats.totalPendingAmount)}</strong></td>
                                                                    <td colSpan="3"></td>
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

            {/* Modal for Chart Details */}
            <Modal isOpen={state.modalData.isOpen} toggle={() => setState(prev => ({ ...prev, modalData: { ...prev.modalData, isOpen: false } }))} size="xl">
                <ModalHeader toggle={() => setState(prev => ({ ...prev, modalData: { ...prev.modalData, isOpen: false } }))}>
                    <i className="fa fa-info-circle me-2"></i>
                    {state.modalData.title}
                </ModalHeader>
                <ModalBody>
                    {state.modalData.filteredData && state.modalData.filteredData.length > 0 ? (
                        <>
                            <div className="mb-3">
                                <strong>Total Records: {state.modalData.filteredData.length}</strong>
                            </div>
                            <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                <Table striped hover bordered size="sm">
                                    <thead className="table-dark sticky-top">
                                        <tr>
                                            <th>#</th>
                                            <th>Installment #</th>
                                            <th>Customer Name</th>
                                            <th>Voucher Date</th>
                                            <th>Due Date</th>
                                            <th>EMI Amount</th>
                                            <th>Paid Amount</th>
                                            <th>Pending Amount</th>
                                            <th>Status</th>
                                            <th>Overdue Days</th>
                                            <th>Mobile No</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {state.modalData.filteredData.map((row, rowIndex) => {
                                            const emiAmount = parseFloat(row.EMIAmount) || 0;
                                            const pendingAmount = parseFloat(row.PendingAmount) || 0;
                                            const paidAmount = emiAmount - pendingAmount;
                                            const isOverdue = (parseFloat(row.OverdueDays) || 0) > 0;
                                            const statusClass = row.EMIStatus === "Paid" 
                                                ? "badge bg-success" 
                                                : isOverdue 
                                                ? "badge bg-danger" 
                                                : "badge bg-warning";

                                            return (
                                                <tr key={rowIndex}>
                                                    <td>{rowIndex + 1}</td>
                                                    <td><strong>{row.InstallmentNo || '-'}</strong></td>
                                                    <td>{row.CustomerName || '-'}</td>
                                                    <td>{formatDate(row.VoucherDate)}</td>
                                                    <td>{formatDate(row.DueDate)}</td>
                                                    <td className="text-end"><strong>{formatCurrency(emiAmount)}</strong></td>
                                                    <td className="text-end text-success"><strong>{formatCurrency(paidAmount)}</strong></td>
                                                    <td className="text-end text-danger"><strong>{formatCurrency(pendingAmount)}</strong></td>
                                                    <td>
                                                        <span className={statusClass}>
                                                            {row.EMIStatus || 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        {isOverdue ? (
                                                            <span className="badge bg-danger">
                                                                {row.OverdueDays} days
                                                            </span>
                                                        ) : (
                                                            <span className="text-success">-</span>
                                                        )}
                                                    </td>
                                                    <td>{row.MobileNo || '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="table-secondary">
                                        <tr>
                                            <td colSpan="5" className="text-end"><strong>Total:</strong></td>
                                            <td className="text-end">
                                                <strong>
                                                    {formatCurrency(
                                                        state.modalData.filteredData.reduce((sum, item) => sum + (parseFloat(item.EMIAmount) || 0), 0)
                                                    )}
                                                </strong>
                                            </td>
                                            <td className="text-end text-success">
                                                <strong>
                                                    {formatCurrency(
                                                        state.modalData.filteredData.reduce((sum, item) => {
                                                            const emiAmount = parseFloat(item.EMIAmount) || 0;
                                                            const pendingAmount = parseFloat(item.PendingAmount) || 0;
                                                            return sum + (emiAmount - pendingAmount);
                                                        }, 0)
                                                    )}
                                                </strong>
                                            </td>
                                            <td className="text-end text-danger">
                                                <strong>
                                                    {formatCurrency(
                                                        state.modalData.filteredData.reduce((sum, item) => sum + (parseFloat(item.PendingAmount) || 0), 0)
                                                    )}
                                                </strong>
                                            </td>
                                            <td colSpan="3"></td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-4">
                            <p className="text-muted">No data found for the selected filter.</p>
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Btn color="secondary" onClick={() => setState(prev => ({ ...prev, modalData: { ...prev.modalData, isOpen: false } }))}>
                        Close
                    </Btn>
                </ModalFooter>
            </Modal>
        </div>
  )
}

export default EmiReport