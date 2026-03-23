
import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Row, Label, Input } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import TokenReceiptTable from "./TokenReceiptTable";
import { Fn_AddEditData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { toast } from "react-toastify";
import { API_HELPER } from "../../helpers/ApiHelper";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Total calculation function
const TotalCalculation = (plotData, formData, setState) => {
  // Example: Calculate totalQty and totalAmount
  console.log("Calculating totals with plotData:", plotData);
  const totalQty = plotData.reduce((sum, item) => sum + (parseFloat(item.Qty) || 0), 0);
  const totalAmount = plotData.reduce((sum, item) => sum + ((parseFloat(item.Qty) || 0) * (parseFloat(item.ActualPrice) || 0)), 0);
  const downPayment = parseFloat(formData?.DownPayment) || 0;
  const TotalAmt = totalAmount - downPayment;
  const NetAmt = totalAmount - downPayment;
  console.log("Total Qty:", totalQty, "Total Amount:", totalAmount, "Total Amt:", TotalAmt, "Net Amt:", NetAmt);
  setState((prev) => ({
    ...prev,
    formData: {
      ...prev.formData,
      TotalQty: totalQty.toString(),
      TotalAmt: TotalAmt.toFixed(2),
      NetAmt: NetAmt.toFixed(2),
    },
    totals: {
      totalQty,
      totalAmount,
      TotalAmt,
    },
  }));
};

// EMI calculation function
const EmiCalculation = (plotData, formData, setState) => {
    console.log("Calculating EMI with:", { plotData, formData });
  const totalDueAmount = plotData.reduce((sum, item) => {
    
      const qty = parseFloat(item.Qty) || 0;
      const actualPrice = parseFloat(item.ActualPrice) || 0;
      return sum + qty * actualPrice;
  }, 0);
  console.log("Total Due Amount calculated:", totalDueAmount);
  const downPayment = parseFloat(formData.DownPayment) || 0;
  const noOfInstallment = parseFloat(formData.NoOfInstallment) || 1;
  const remainingAmount = totalDueAmount - downPayment;
  const emiAmount = remainingAmount > 0 ? remainingAmount / noOfInstallment : 0;
  console.log("EMI Amount calculated:", emiAmount);
  setState((prev) => ({
    ...prev,
    formData: {
      ...prev.formData,
      EMIAmount: emiAmount.toFixed(2),
    },
  }));
};

const TokenReceipt = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Normalize date string for date inputs without timezone shift
  const formatDateForInput = (value) => {
    if (!value) return "";
    const d = new Date(value);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  // Dynamic dropdown arrays in state object
  const [state, setState] = useState({
    voucherLOptions: [],
    purchaseRefOptions: [],
    schemeOptions: [],
    partyOptions: [],
    plotOptions: [],
    isProgress: true,
    filterText: "",
    editMode: false,
    editId: 0,
    isSaving: false,
    isAdding: false,
    canEdit: true,
    formData: {
      PurchaseRef: "",
      Party: "",
      VoucherNo: "",
      VoucherDate: new Date().toISOString().split("T")[0],
      F_SchemeMaster: "",
      F_LedgerMaster: "",
      DownPayment: "",
      NoOfInstallment: "",
      AllotmentDate: "",
      AdvanceAmount: "",
      EMIAmount: "",
      TotalQty: "0",
      TotalAmt: "0.00",
      NetAmt: "0.00",
    },
    plotData: [
      {
        F_PlotMaster: "",
        PlotSize: "0",
        TentativePrice: "0",
        Qty: "0",
        ActualPrice: "0",
        isNew: true,
      },
    ],
  });

  const dateInputRef = useRef(null);
  const purchaseRefSelectRef = useRef(null);
  // Refs for table fields - using a map to store refs by row index
  const plotDropdownRefs = useRef({});
  const actualPriceRefs = useRef({});
  const addButtonRefs = useRef({});
   

    // Helper to ensure array mapping
    const safeArray = arr => Array.isArray(arr) ? arr : [];
  // API URLs for dropdowns
  const API_URL_SCHEME = API_WEB_URLS.MASTER + "/0/token/SchemeMaster";
  const API_URL_VOUCHER_NO = API_WEB_URLS.MASTER + "/0/token/NextVoucherNoNew";
  const API_URL_PARTY = API_WEB_URLS.MASTER + "/0/token/LedgerMaster";
  const API_URL_PLOT = API_WEB_URLS.MASTER + "/0/token/PlotMaster";
  const API_URL_PLOT1 = API_WEB_URLS.MASTER + "/0/token/PlotMaster";
  const API_URL_VOUCHERL = API_WEB_URLS.MASTER + "/0/token/VoucherLNew";
  // If you have a PurchaseRef master, set its API here
  const API_URL_PURCHASE_REF = API_WEB_URLS.MASTER + "/0/token/VoucherHNew";

  useEffect(() => {
    const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    const loadDropdowns = async () => {
      await Fn_FillListData(
        dispatch,
        setState,
        "schemeOptions",
        API_URL_SCHEME + "/TBL.F_CompanyMaster/" + obj.CompanyId
      );
    const voucherNoOptions = await Fn_FillListData(
        dispatch,
        setState,
        "VoucherNoOptions",
        API_URL_VOUCHER_NO + "/TBL.F_CompanyMaster/" + obj.CompanyId
      );
      console.log("voucherNoOptions--------------->",voucherNoOptions);
     if(voucherNoOptions && voucherNoOptions.length > 0) {
      const VoucherNo = voucherNoOptions[0].NextVoucherNo;
      handleFormChange("VoucherNo", VoucherNo);
     }
      await Fn_FillListData(
        dispatch,
        setState,
        "purchaseRefOptions",
        API_URL_PURCHASE_REF + "/TBL.F_CompanyMaster/" + obj.CompanyId
      );
    };

    loadDropdowns();
  }, [dispatch]);

  // ...existing code...

  // Unified handler for all form inputs
  const handleFormChange = async (field, value) => {
    setState((prev) => {
      const newFormData = {
        ...prev.formData,
        [field]: value,
      };
      return {
        ...prev,
        formData: newFormData,
      };
    });
    if (["DownPayment", "NoOfInstallment"].includes(field)) {
      EmiCalculation(state.plotData, { ...state.formData, [field]: value }, setState);
    }
    TotalCalculation(state.plotData, { ...state.formData, [field]: value }, setState);
    if (field === "F_SchemeMaster") {
      Fn_FillListData(
        dispatch,
        setState,
        "partyOptions",
        API_URL_PARTY + "/TBL.F_SchemeMaster/" + value
      );
      Fn_FillListData(
        dispatch,
        setState,
        "plotOptions",
        API_URL_PLOT1 + "/TBL.F_SchemeMaster/" + value
      );
    }
    if (field === "PurchaseRef" && value) {
      // Find the selected purchase ref option to get form data
      const selectedPurchaseRef = state.purchaseRefOptions.find(
        (option) => option.Id === parseInt(value)
      );

      if (selectedPurchaseRef) {
        // Fetch VoucherL data (plot details)
        const voucherLData = await Fn_FillListData(
          dispatch,
          setState,
          "voucherLOptions",
          API_URL_VOUCHERL + "/TBL.F_VoucherHNew/" + value
        );

        // Format VoucherDate if it exists
        const voucherDate = selectedPurchaseRef.VoucherDate
          ? formatDateForInput(selectedPurchaseRef.VoucherDate)
          : formatDateForInput(new Date());

        // Format AllotmentDate if it exists
        const allotmentDate = selectedPurchaseRef.AllotmentDate
          ? formatDateForInput(selectedPurchaseRef.AllotmentDate)
          : "";

        // Map VoucherL data to plotData format
        // Keep isNew as true so dropdown remains editable
        const mappedPlotData = Array.isArray(voucherLData) && voucherLData.length > 0
          ? voucherLData.map((item, index) => ({
              F_PlotMaster: item.F_PlotMaster?.toString() || "",
              PlotSize: item.PlotSize?.toString() || "0",
              TentativePrice: item.TentativePrice?.toString() || "0",
              Qty: item.Qty?.toString() || "0",
              ActualPrice: item.ActualPrice?.toString() || "0",
              isNew: true, // Keep as true to show dropdown
            }))
          : [
              {
                F_PlotMaster: "",
                PlotSize: "0",
                TentativePrice: "0",
                Qty: "0",
                ActualPrice: "0",
                isNew: true,
              },
            ];

        // Prepare new form data
        const newFormData = {
          PurchaseRef: value,
          VoucherDate: voucherDate,
          F_SchemeMaster: selectedPurchaseRef.F_SchemeMaster?.toString() || "",
          F_LedgerMaster: selectedPurchaseRef.F_LedgerMaster?.toString() || "",
          Party: selectedPurchaseRef.Party || selectedPurchaseRef.LedgerName || "",
          DownPayment: selectedPurchaseRef.DownPayment?.toString() || "",
          NoOfInstallment: selectedPurchaseRef.NoOfInstallment?.toString() || "",
          AllotmentDate: allotmentDate,
          AdvanceAmount: selectedPurchaseRef.AdvanceAmount?.toString() || "",
          EMIAmount: selectedPurchaseRef.EMIAmount?.toString() || "",
          VoucherNo: selectedPurchaseRef.VoucherNo?.toString() || "",
          TotalQty: selectedPurchaseRef.TotalQty?.toString() || "",
          TotalAmt: selectedPurchaseRef.TotalAmt?.toString() || "",
          NetAmt: selectedPurchaseRef.NetAmt?.toString() || "",
        };
        console.log("newFormData--------------->",newFormData);
        // Fetch party and plot options based on scheme (await to ensure they're loaded first)
        if (selectedPurchaseRef.F_SchemeMaster) {
          await Fn_FillListData(
            dispatch,
            setState,
            "partyOptions",
            API_URL_PARTY + "/TBL.F_SchemeMaster/" + selectedPurchaseRef.F_SchemeMaster
          );
          await Fn_FillListData(
            dispatch,
            setState,
            "plotOptions",
            API_URL_PLOT1 + "/TBL.F_SchemeMaster/" + selectedPurchaseRef.F_SchemeMaster
          );
        }

        // Check if TotalAmt and NetAmt are same to determine if editing is allowed
        const totalAmt = parseFloat(newFormData.TotalAmt) || 0;
        const netAmt = parseFloat(newFormData.NetAmt) || 0;
        const canEdit = totalAmt === netAmt;
        
        // Update state with new form data and plot data after options are loaded
        // Don't set editMode to true here - only load the data
        setState((prev) => ({
          ...prev,
          formData: newFormData,
          plotData: mappedPlotData,
          editMode: false, // Keep editMode false when selecting from dropdown
          editId: parseInt(value), // Store the ID for later use when Edit is clicked
          canEdit: canEdit, // Set whether editing is allowed based on amount match
        }));

        // Calculate totals and EMI with new data
        // TotalCalculation(mappedPlotData, newFormData, setState);
        // EmiCalculation(mappedPlotData, newFormData, setState);
      }
    } else if (field === "PurchaseRef" && !value) {
      // Reset form when PurchaseRef is cleared
      setState((prev) => ({
        ...prev,
        formData: {
          PurchaseRef: "",
          VoucherDate: new Date().toISOString().split("T")[0],
          F_SchemeMaster: "",
          F_LedgerMaster: "",
          DownPayment: "",
          NoOfInstallment: "",
          AllotmentDate: "",
          AdvanceAmount: "",
          EMIAmount: "",
        },
        plotData: [
          {
            F_PlotMaster: "",
            PlotSize: "0",
            TentativePrice: "0",
            Qty: "0",
            ActualPrice: "0",
            isNew: true,
          },
        ],
        editMode: false,
        editId: 0,
        voucherLOptions: [],
      }));
    }
  };

  // Function to handle all table row input changes
  const EditTableRow = (index, field, value) => {
    const newPlotData = [...state.plotData];
    newPlotData[index][field] = value;
    if (field === "F_PlotMaster" && value) {
      const selectedPlot = state.plotOptions.find((p) => {
        // Handle both string and number comparison
        const plotId = typeof p.Id === 'string' ? parseInt(p.Id) : p.Id;
        const valueId = typeof value === 'string' ? parseInt(value) : value;
        return plotId === valueId;
      });
      if (selectedPlot) {
        newPlotData[index].PlotSize = selectedPlot.PlotSize || "";
        const tentativePrice = selectedPlot.TentativePrice ? selectedPlot.TentativePrice.toString() : "";
        newPlotData[index].TentativePrice = tentativePrice;
        newPlotData[index].ActualPrice = tentativePrice;
        newPlotData[index].Qty = selectedPlot.Qty ? selectedPlot.Qty.toString() : "0";
      }
    }
    setState((prev) => ({
      ...prev,
      plotData: newPlotData,
    }));
    EmiCalculation(newPlotData, state.formData, setState);
    TotalCalculation(newPlotData, state.formData, setState);
  };

  // Handler for plot table changes (now uses EditTableRow)
  const handlePlotDataChange = EditTableRow;

  const handleAddPlot = (index) => {
    const newPlotData = [...state.plotData];
    const newRow = {
      F_PlotMaster: "",
      PlotSize: "0",
      TentativePrice: "0",
      Qty: "0",
      ActualPrice: "0",
      isNew: true,
    };
    
    // If index is provided, insert after that index, otherwise add at the end
    const insertIndex = index !== undefined && index !== null ? index + 1 : newPlotData.length;
    if (index !== undefined && index !== null) {
      newPlotData.splice(insertIndex, 0, newRow);
    } else {
      newPlotData.push(newRow);
    }
    
    setState((prev) => ({
      ...prev,
      plotData: newPlotData,
    }));

    // Focus on the new row's Plot dropdown after state update
    setTimeout(() => {
      const newRowPlotRef = plotDropdownRefs.current[insertIndex];
      if (newRowPlotRef && newRowPlotRef.current) {
        newRowPlotRef.current.focus();
      }
    }, 100);
  };

  const handleRemovePlot = (index) => {
    const newPlotData = state.plotData.filter((_, i) => i !== index);
    setState((prev) => ({
      ...prev,
      plotData: newPlotData,
    }));
  };

  const handleAdd = () => {
    setState((prev) => ({
      ...prev,
      isAdding: true,
      formData: {
        PurchaseRef: "",
        VoucherDate: new Date().toISOString().split("T")[0],
        F_SchemeMaster: "",
        F_LedgerMaster: "",
        DownPayment: "",
        NoOfInstallment: "",
          AllotmentDate: "",
          AdvanceAmount: "",
        EMIAmount: "",
        Penalty: "0",
        TotalQty: "0",
        TotalAmt: "0.00",
        NetAmt: "0.00",
      },
      plotData: [
        {
          F_PlotMaster: "",
          PlotSize: "0",
          TentativePrice: "0",
          Qty: "0",
          ActualPrice: "0",
          isNew: true,
        },
      ],
      editMode: false,
      editId: 0,
      canEdit: true,
      voucherLOptions: [],
    }));
    
    // Focus on Date field after reset
    setTimeout(() => {
      if (dateInputRef.current) {
        dateInputRef.current.focus();
      }
    }, 100);
    
    setTimeout(() => {
      setState((prev) => ({ ...prev, isAdding: false }));
    }, 500);
  };

  const handleEdit = () => {
    // Enable edit mode when Edit button is clicked
    if (state.formData.PurchaseRef && state.editId > 0) {
      // Check if TotalAmt and NetAmt match
      if (!state.canEdit) {
        toast.error("Total Amount and Net Amount do not match! You have created receipt against it so can not edit.");
        return;
      }
      setState((prev) => ({
        ...prev,
        editMode: true,
      }));
      toast.success("Edit mode enabled. You can now modify the record.");
    } else {
      toast.warning("Please select a purchase record first.");
    }
  };

  const handleSave = async () => {
    // Validation: Check all required fields
    if (!state.formData.VoucherDate || !state.formData.VoucherDate.trim()) {
      toast.error("Voucher Date is required");
      return;
    }

    if (!state.formData.F_SchemeMaster || state.formData.F_SchemeMaster === "") {
      toast.error("Scheme is required");
      return;
    }

    if (!state.formData.Party || state.formData.Party === "") {
      toast.error("Party is required");
      return;
    }

    if (!state.formData.DownPayment || state.formData.DownPayment === "" || parseFloat(state.formData.DownPayment) < 0) {
      toast.error("Down Payment is required and must be 0 or greater");
      return;
    }

    if (!state.formData.NoOfInstallment || state.formData.NoOfInstallment === "" || parseFloat(state.formData.NoOfInstallment) <= 0) {
      toast.error("Number of Installments is required and must be greater than 0");
      return;
    }

    if (!state.formData.AllotmentDate || !state.formData.AllotmentDate.trim()) {
      toast.error("Allotment Date is required");
      return;
    }

    if (state.formData.AdvanceAmount === "" || state.formData.AdvanceAmount === null) {
      toast.error("Advance Amount is required");
      return;
    }

    const advanceAmount = parseFloat(state.formData.AdvanceAmount);
    if (isNaN(advanceAmount) || advanceAmount < 0) {
      toast.error("Advance Amount must be 0 or greater");
      return;
    }

    // Validate plotData - must have at least one row with valid plot
    if (!state.plotData || state.plotData.length === 0) {
      toast.error("At least one plot entry is required");
      return;
    }

    // Validate each plot entry
    const invalidPlots = state.plotData.filter((plot, index) => {
      if (!plot.F_PlotMaster || plot.F_PlotMaster === "") {
        return true;
      }
      const qty = parseFloat(plot.Qty) || 0;
      if (qty <= 0) {
        return true;
      }
      const actualPrice = parseFloat(plot.ActualPrice) || 0;
      if (actualPrice <= 0) {
        return true;
      }
      return false;
    });

    if (invalidPlots.length > 0) {
      toast.error("All plot entries must have Plot Name, Quantity (greater than 0), and Actual Price (greater than 0)");
      return;
    }

    // Validate totals
    const totalQty = parseFloat(state.formData.TotalQty) || 0;
    if (totalQty <= 0) {
      toast.error("Total Quantity must be greater than 0");
      return;
    }

    const totalAmt = parseFloat(state.formData.TotalAmt) || 0;
    if (totalAmt <= 0) {
      toast.error("Total Amount must be greater than 0");
      return;
    }

    setState((prev) => ({ ...prev, isSaving: true }));
    
    try {
      const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
      const formData = new FormData();
      formData.append("F_CompanyMaster", obj.CompanyId || "");
      formData.append("VoucherNo", state.formData.VoucherNo || "");
      formData.append("VoucherDate", state.formData.VoucherDate || "");
      formData.append("F_SchemeMaster", state.formData.F_SchemeMaster || "");
      formData.append("Party", state.formData.Party || "");
      formData.append("DownPayment", state.formData.DownPayment || "");
      formData.append("NoOfInstallment", state.formData.NoOfInstallment || "");
      formData.append("AllotmentDate", state.formData.AllotmentDate || "");
      formData.append("AdvanceAmount", state.formData.AdvanceAmount || "");
      formData.append("EMIAmount", state.formData.EMIAmount || ""); 
      // Append totals from formData
      formData.append("TotalQty", state.formData.TotalQty || "0");
      formData.append("TotalAmt", state.formData.TotalAmt || "0.00");
      formData.append("NetAmt", state.formData.NetAmt || "0.00");
      
      // Use editId if in edit mode, otherwise use 0 for new record
      const recordId = state.editMode ? state.editId : 0;
      
      const res = await Fn_AddEditData(dispatch, setState, 
        { arguList: { id: recordId, formData: formData } }, 
        'VoucherHNew/0/token', true, "memberid", navigate, "#");
      
      if(res && res.data && res.data.data && res.data.data.id > 0){
        const voucherHId = res.data.data.id;
        const plotData = new FormData();
        plotData.append("F_VoucherH", voucherHId);
        plotData.append("Data", JSON.stringify(state.plotData));
        
        const res2 = await Fn_AddEditData(dispatch, setState, 
          { arguList: { id: 0, formData: plotData } }, 
          'VoucherLNew/0/token', true, "memberid", navigate, "#");
        
        // Reload purchaseRefOptions to get the newly saved record
        const obj2 = JSON.parse(sessionStorage.getItem("authUser") || "{}");
        await Fn_FillListData(dispatch, setState, "purchaseRefOptions", API_URL_PURCHASE_REF + "/TBL.F_CompanyMaster/" + obj2.CompanyId);
        
        // Show success message
        toast.success("Record saved successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Wait for state to update with new purchaseRefOptions, then select and load the saved record
        setTimeout(async () => {
          // Use a callback to ensure state is updated
          setState((prev) => {
            // Trigger the PurchaseRef change to load the saved data
            setTimeout(() => {
              handleFormChange("PurchaseRef", voucherHId.toString());
            }, 100);
            
            return {
              ...prev,
              formData: {
                ...prev.formData,
                PurchaseRef: voucherHId.toString(),
              },
              editMode: true,
              editId: voucherHId,
            };
          });
          
          // Show print option after a short delay
          setTimeout(() => {
            if (window.confirm("Record saved successfully! Do you want to print?")) {
              handlePrint();
            }
          }, 500);
        }, 500);
      } else {
        toast.error("Error saving record. Please try again.");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Error saving record. Please try again.");
    } finally {
      setState((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Helper function to get print content HTML
  const getPrintContent = async () => {
    // Helper function to get name from options
    const getNameFromOptions = (id, options) => {
      if (!id || !options) return '';
      const option = options.find(opt => opt.Id === parseInt(id));
      return option ? option.Name : '';
    };

    // Get customer details - try from partyOptions first, then fetch full record if needed

    const customerName = state.formData.Party  || '';

    
    // Get all plot details - map through all plots
    const allPlots = state.plotData && state.plotData.length > 0 ? state.plotData : [];
    
    // Format date in DD.MM.YYYY format
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };

    // Get company details from sessionStorage
    const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    const companyName = obj.CompanyName || '';
    const companyAddress = obj.CompanyAddress || '';
    const companyContactNo = obj.CompanyContactNo || '';
    const companyEmail = obj.CompanyEmail || '';
    const companyRegNo = obj.CompanyRegNo || '';
    
    // Calculate advance amount (if down payment has multiple parts, show breakdown)
    const downPayment = parseFloat(state.formData.DownPayment) || 0;
    const advanceAmount = parseFloat(state.formData.AdvanceAmount) || downPayment;
    const emiAmount = parseFloat(state.formData.EMIAmount) || 0;

    // Generate HTML content matching the image format
    return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Token Receipt - Print</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
              @page { size: A5; margin: 20mm 15mm 10mm 15mm; }
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              padding: 8px 15px;
              max-width: 100%;
              margin: 0 auto;
              background: #fff;
              line-height: 1.3;
            }
            .print-header {
              text-align: center;
              margin-bottom: 6px;
              border-bottom: 1px solid #000;
              padding-bottom: 4px;
            }
            .company-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 2px;
              text-transform: uppercase;
              color: #d32f2f;
            }
            .company-details {
              font-size: 11px;
              line-height: 1.3;
              color: #333;
              margin-bottom: 2px;
            }
            .receipt-date {
              text-align: right;
              margin-bottom: 5px;
              font-size: 12px;
            }
            .customer-section {
              margin-bottom: 6px;
              border: 1px solid #000;
              padding: 4px 6px;
            }
            .customer-row {
              display: flex;
              margin-bottom: 2px;
              font-size: 12px;
            }
            .customer-label {
              font-weight: bold;
              width: 80px;
              flex-shrink: 0;
            }
            .customer-value {
              flex: 1;
              border-bottom: 1px dotted #000;
              min-height: 14px;
            }
            .plot-details-section {
              margin-bottom: 6px;
            }
            .plot-details-title {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 4px;
              text-align: center;
              text-decoration: underline;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 5px 0;
              font-size: 11px;
            }
            table th {
              background-color: #f0f0f0;
              border: 1px solid #000;
              padding: 4px 4px;
              text-align: left;
              font-weight: bold;
            }
            table td {
              border: 1px solid #000;
              padding: 3px 4px;
            }
            .documents-section {
              margin-bottom: 6px;
              border: 1px solid #000;
              padding: 4px 6px;
            }
            .documents-title {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 3px;
            }
            .documents-list {
              font-size: 11px;
              line-height: 1.4;
              padding-left: 15px;
            }
            .signature-section {
              margin-top: 10px;
              text-align: right;
            }
            .signature-line {
              border-top: 1px solid #000;
              width: 120px;
              margin: 15px auto 2px;
              display: block;
            }
            .signature-label {
              font-size: 11px;
              text-align: center;
              margin-top: 2px;
            }
            .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              padding: 10px 20px;
              background-color: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              font-weight: bold;
              z-index: 1000;
              box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
            .print-button:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <button class="print-button no-print" onclick="window.print()">🖨️ Print</button>
          
          <div class="print-header">
            <div class="company-name">${companyName}</div>
            ${companyRegNo ? `<div class="company-details">Reg.No. ${companyRegNo}</div>` : ''}
            ${companyAddress ? `<div class="company-details">Office:- ${companyAddress}</div>` : ''}
            ${companyContactNo ? `<div class="company-details">Mob:-${companyContactNo} ${companyEmail ? `(Off) ${companyEmail}` : ''}</div>` : ''}
          </div>

          <div class="receipt-date">
            <strong>Date:</strong> ${formatDate(state.formData.VoucherDate)}
          </div>

          <div class="customer-section">
            <div class="customer-row">
              <span class="customer-label">Name:</span>
              <span class="customer-value">${customerName || ''}</span>
            </div>
          </div>

          <div class="plot-details-section">
            <div class="plot-details-title">*Plot Details*</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 28%;">Plot Name</th>
                  <th style="width: 10%;">Size</th>
                  <th style="width: 15%;">Tent. Price</th>
                  <th style="width: 8%;">Qty</th>
                  <th style="width: 15%;">Actual Price</th>
                  <th style="width: 18%;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${allPlots.map((plot) => {
                  const plotName = plot.F_PlotMaster ? getNameFromOptions(plot.F_PlotMaster, state.plotOptions) : '';
                  const plotSize = plot.PlotSize || '0';
                  const tentativePrice = parseFloat(plot.TentativePrice) || 0;
                  const plotQty = parseFloat(plot.Qty) || 0;
                  const plotActualPrice = parseFloat(plot.ActualPrice) || 0;
                  const plotTotal = plotQty * plotActualPrice;
                  
                  return `
                    <tr>
                      <td>${plotName || '-'}</td>
                      <td>${plotSize}</td>
                      <td>₹${tentativePrice.toFixed(2)}</td>
                      <td>${plotQty}</td>
                      <td>₹${plotActualPrice.toFixed(2)}</td>
                      <td>₹${plotTotal.toFixed(2)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <div style="margin-top: 8px; font-size: 12px;">
              <div style="display: flex; margin-bottom: 3px;">
                <span style="font-weight: bold; width: 120px;">Down Payment:</span>
                <span>₹${downPayment.toFixed(2)}</span>
              </div>
              <div style="display: flex; margin-bottom: 3px;">
                <span style="font-weight: bold; width: 120px;">EMI Amount:</span>
                <span>₹${emiAmount.toFixed(2)}/-</span>
              </div>
              <div style="display: flex; margin-bottom: 3px;">
                <span style="font-weight: bold; width: 120px;">Advance Amount:</span>
                <span>₹${advanceAmount.toFixed(2)}/-</span>
              </div>
              <div style="display: flex; margin-bottom: 3px;">
                <span style="font-weight: bold; width: 120px;">Date of Allotment:</span>
                <span>${state.formData.AllotmentDate ? formatDate(state.formData.AllotmentDate) : ''}</span>
              </div>
            </div>
          </div>

          <div class="documents-section">
            <div class="documents-title">Documents Required for Allotment:</div>
            <div class="documents-list">
              <div>1. Aadhar Card Copy</div>
              <div>2. PAN Card Copy</div>
              <div>3. 3 Passport Size Photos</div>
              <div>4. Nominee: Aadhar Card Copy, PAN Card Copy</div>
            </div>
          </div>

          <div class="signature-section">
            <div class="signature-line"></div>
            <div class="signature-label">CASHIER</div>
            <div class="signature-label">${companyName} BRANCH-BANSWARA</div>
            <div class="signature-label" style="margin-top: 3px;">Signature</div>
          </div>
        </body>
        </html>
      `;
  };

  const handlePrint = async () => {
    try {
      const printContent = await getPrintContent();
      // Open new window with print content
      const printWindow = window.open('', '_blank', 'width=600,height=800');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        // Auto-focus on the new window
        printWindow.focus();
        toast.success("Print preview opened in new tab!");
      } else {
        toast.error("Please allow popups to open print preview");
      }
    } catch (error) {
      console.error("Error generating print preview:", error);
      toast.error("Error generating print preview. Please try again.");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const printContent = await getPrintContent();
      const printWindow = window.open('', '_blank', 'width=600,height=800');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 500));
        // Trigger print dialog with PDF option
        printWindow.print();
        toast.success("PDF download initiated!");
      } else {
        toast.error("Please allow popups to download PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Error downloading PDF. Please try again.");
    }
  };

  const handleWhatsAppShare = async () => {
    try {
      toast.info("Generating PDF...");
      
      const printContent = await getPrintContent();
      
      // Create a temporary container for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '148mm'; // A5 width
      tempDiv.innerHTML = printContent;
      document.body.appendChild(tempDiv);
      
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a5');
      const imgWidth = 148; // A5 width in mm
      const pageHeight = 210; // A5 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Remove temporary div
      document.body.removeChild(tempDiv);
      
      // Generate PDF blob
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const fileName = `TokenReceipt_${state.formData.VoucherNo || 'Receipt'}_${new Date().getTime()}.pdf`;
      
      // Create message
      const getNameFromOptions = (id, options) => {
        if (!id || !options) return '';
        const option = options.find(opt => opt.Id === parseInt(id));
        return option ? option.Name : '';
      };
      
   
      
      const customerName = state.formData.Party || '';
      const allPlots = state.plotData && state.plotData.length > 0 ? state.plotData : [];
      const downPayment = parseFloat(state.formData.DownPayment) || 0;
      const advanceAmount = parseFloat(state.formData.AdvanceAmount) || downPayment;
      const emiAmount = parseFloat(state.formData.EMIAmount) || 0;
      
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      };
      
      let message = `*Token Receipt*\n\n`;
      message += `*Date:* ${formatDate(state.formData.VoucherDate)}\n`;
      message += `*Customer:* ${customerName}\n\n`;
      
      // Add all plots
      if (allPlots.length > 0) {
        message += `*Plot Details:*\n`;
        allPlots.forEach((plot, index) => {
          const plotName = plot.F_PlotMaster ? getNameFromOptions(plot.F_PlotMaster, state.plotOptions) : 'N/A';
          const plotSize = plot.PlotSize || '0';
          const plotQty = plot.Qty || '0';
          const plotActualPrice = parseFloat(plot.ActualPrice) || 0;
          const plotTotal = plotActualPrice * parseFloat(plotQty);
          
          message += `\n*Plot ${index + 1}:*\n`;
          message += `  Plot No: ${plotName}\n`;
          message += `  Plot Size: ${plotSize} Sqft\n`;
          message += `  Quantity: ${plotQty}\n`;
          message += `  Actual Price: ₹${plotActualPrice.toFixed(2)}\n`;
          message += `  Total: ₹${plotTotal.toFixed(2)}\n`;
        });
      }
      
      message += `\n*Payment Details:*\n`;
      message += `  Down Payment: ₹${downPayment.toFixed(2)}\n`;
      message += `  Advance Amount: ₹${advanceAmount.toFixed(2)}\n`;
      message += `  EMI Amount: ₹${emiAmount.toFixed(2)}\n`;
      message += `  Allotment Date: ${state.formData.AllotmentDate ? formatDate(state.formData.AllotmentDate) : 'N/A'}\n`;
      message += `\n📎 PDF file is being downloaded. Please attach it to this message.`;
      
      // Try Web Share API first (for mobile devices)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
        try {
          await navigator.share({
            title: `Token Receipt - ${state.formData.VoucherNo}`,
            text: message,
            files: [new File([pdfBlob], fileName, { type: 'application/pdf' })]
          });
          toast.success("Shared via WhatsApp!");
          return;
        } catch (err) {
          console.log("Web Share API failed, falling back to download + WhatsApp");
        }
      }
      
      // Fallback: Download PDF and open WhatsApp
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
      
      // Open WhatsApp with message
      setTimeout(() => {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        toast.success("PDF downloaded! Opening WhatsApp... Please attach the downloaded PDF file.");
      }, 500);
      
    } catch (error) {
      console.error("Error sharing PDF on WhatsApp:", error);
      toast.error("Error generating PDF. Please try again.");
    }
  };

  const handleCancel = () => {
    // If in edit mode, just disable edit mode (go back to view mode)
    if (state.editMode && state.editId > 0) {
      // Reload the original data
      handleFormChange("PurchaseRef", state.formData.PurchaseRef);
      setState((prev) => ({
        ...prev,
        editMode: false,
      }));
      toast.info("Edit mode cancelled. View mode enabled.");
    } else {
      // If no purchase selected, reset the form completely
      setState((prev) => ({
        ...prev,
        formData: {
          PurchaseRef: "",
          VoucherDate: new Date().toISOString().split("T")[0],
          F_SchemeMaster: "",
          F_LedgerMaster: "",
          DownPayment: "",
          NoOfInstallment: "",
          AllotmentDate: "",
          AdvanceAmount: "",
          EMIAmount: "",
          TotalQty: "0",
          TotalAmt: "0.00",
          NetAmt: "0.00",
        },
        plotData: [
          {
            F_PlotMaster: "",
            PlotSize: "0",
            TentativePrice: "0",
            Qty: "0",
            ActualPrice: "0",
            isNew: true,
          },
        ],
        editMode: false,
        editId: 0,
        canEdit: true,
        voucherLOptions: [],
      }));
      
      // Focus on Date field after reset
      setTimeout(() => {
        if (dateInputRef.current) {
          dateInputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleDelete = async() => {
    console.log("handleDelete called with id:", state.editId);
    if (!state.editId || state.editId === 0) {
      toast.error("Please select a purchase record to delete");
      return;
    }
    if (window.confirm("Are you sure you want to delete this purchase?")) {
      const deleteUrl = API_WEB_URLS.MASTER + "/0/token/DeletePlotPurchase/Id/" + state.editId;
      console.log("Calling delete with:", { id: state.editId, deleteUrl });
      const res = await Fn_FillListData(dispatch, setState, "New", deleteUrl);
      console.log("res", res);
      if(res && res.length > 0 && res[0].Id > 0){
        toast.success("Purchase deleted successfully");
        // Reset form after successful deletion
        const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
        await Fn_FillListData(dispatch, setState, "purchaseRefOptions", API_URL_PURCHASE_REF + "/TBL.F_CompanyMaster/" + obj.CompanyId);
        
        setState((prev) => ({
          ...prev,
          formData: {
            PurchaseRef: "",
            VoucherDate: new Date().toISOString().split("T")[0],
            F_SchemeMaster: "",
            F_LedgerMaster: "",
            DownPayment: "",
            NoOfInstallment: "",
            AllotmentDate: "",
            AdvanceAmount: "",
            EMIAmount: "",
            Penalty: "0",
            TotalQty: "0",
            TotalAmt: "0.00",
            NetAmt: "0.00",
          },
          plotData: [
            {
              F_PlotMaster: "",
              PlotSize: "0",
              TentativePrice: "0",
              Qty: "0",
              ActualPrice: "0",
              isNew: true,
            },
          ],
          editMode: false,
          editId: 0,
          canEdit: true,
          voucherLOptions: [],
        }));
      }else{
        toast.error("Failed to delete purchase");
      }
    }
  };

  const handleView = () => {
    console.log("View clicked");
    // Add your view logic here
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
          const saveButton = card.querySelector('button[onClick*="handleSave"]');
          if (saveButton) {
            saveButton.focus();
          }
        }
      }
    }
  };



  return (
    <div className="page-body">
      <Container fluid>
        <Row>
          <Col xs="12">
            <Card>
              <CardHeaderCommon title="Token Receipt" tagClass="card-title mb-0" />
              <CardBody>
                {/* First Row */}
                <Row className="mb-3">
                  <Col md="3">
                    <Label className="form-label">Purchase</Label>
                    <select
                      className="form-select"
                      value={state.formData.PurchaseRef}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        console.log("Selected PurchaseRef Id:", selectedId);
                        handleFormChange("PurchaseRef", selectedId);
                      }}
                      onKeyDown={handleKeyDown}
                      autoFocus
                    >
                      <option value="">Purchase Ref..</option>
                      {safeArray(state.purchaseRefOptions).map((option) => (
                        <option key={option.Id} value={option.Id}>
                          {option.Party || option.LedgerName || 'N/A'} ({option.SchemeName})
                        </option>
                      ))}
                    </select>
                  </Col>
                  <Col md="1">
                    <Label className="form-label">V.No</Label>
                    <Input
                      type="text"
                      value={state.formData.VoucherNo}
                      disabled
                    />
                  </Col>
                  <Col md="2">
                    <Label className="form-label">Date</Label>
                    <Input
                      type="date"
                      innerRef={dateInputRef}
                      value={state.formData.VoucherDate}
                      onChange={(e) => handleFormChange("VoucherDate", e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={state.editId > 0 && !state.editMode}
                    />
                  </Col>
                  <Col md="3">
                    <Label className="form-label">Scheme</Label>
                    <select
                      className="form-select"
                      value={state.formData.F_SchemeMaster}
                      onChange={(e) => handleFormChange("F_SchemeMaster", e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={state.editId > 0 && !state.editMode}
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
                    <Label className="form-label">Party</Label>
                    <Input
                      type="text"
                      value={state.formData.Party}
                      onChange={(e) =>
                        handleFormChange("Party", e.target.value)
                      }
                      disabled={state.editId > 0 && !state.editMode}
                    />
                  </Col>
                </Row>

                {/* Second Row */}
                <Row className="mb-3">
                  <Col md="2">
                    <Label className="form-label">Down Payment</Label>
                    <Input
                      type="number"
                      value={state.formData.DownPayment}
                      onChange={(e) => handleFormChange("DownPayment", e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder=""
                      disabled={state.editId > 0 && !state.editMode}
                    />
                  </Col>
                  <Col md="2">
                    <Label className="form-label">No.Of Installment</Label>
                    <Input
                      type="number"
                      value={state.formData.NoOfInstallment}
                      onChange={(e) => handleFormChange("NoOfInstallment", e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder=""
                      disabled={state.editId > 0 && !state.editMode}
                    />
                  </Col>
                  <Col md="2">
                    <Label className="form-label">Allotment Date</Label>
                    <Input
                      type="date"
                      value={state.formData.AllotmentDate}
                      onChange={(e) => handleFormChange("AllotmentDate", e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={state.editId > 0 && !state.editMode}
                    />
                  </Col>
                  <Col md="2">
                    <Label className="form-label">Advance Amount</Label>
                    <Input
                      type="number"
                      value={state.formData.AdvanceAmount}
                      onChange={(e) => handleFormChange("AdvanceAmount", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          // Focus on first row's Plot dropdown in table
                          setTimeout(() => {
                            const firstPlotRef = plotDropdownRefs.current[0];
                            if (firstPlotRef && firstPlotRef.current) {
                              firstPlotRef.current.focus();
                            }
                          }, 100);
                        }
                      }}
                      disabled={state.editId > 0 && !state.editMode}
                    />
                  </Col>
                  <Col md="2">
                    <Label className="form-label">EMI Amount</Label>
                    <Input
                      type="number"
                      value={state.formData.EMIAmount}
                      disabled
                    />
                  </Col>
                </Row>

                {/* Plot Table */}
                <TokenReceiptTable
                  plotData={state.plotData}
                  plotOptions={state.plotOptions}
                  onRemove={handleRemovePlot}
                  onAdd={handleAddPlot}
                  onDataChange={handlePlotDataChange}
                  isEditMode={state.editMode}
                  isReadOnly={state.editId > 0 && !state.editMode}
                  plotDropdownRefs={plotDropdownRefs}
                  actualPriceRefs={actualPriceRefs}
                  addButtonRefs={addButtonRefs}
                />

                {/* Totals Table Section (same design as TokenReceiptTable) */}
                <div className="row mt-3">
                  <div className="col-md-8">
                    {state.editId > 0 && !state.canEdit && (
                      <div className="alert alert-warning" role="alert">
                        <i className="icon-alert-triangle"></i> <strong>Warning:</strong> Total Amount and Net Amount do not match! You have created receipt against it so can not edit.
                      </div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <table className="table table-bordered">
                      <tbody>
                        <tr>
                          <td><strong>Total Qty:</strong></td>
                          <td className="text-end">{state.formData.TotalQty || 0}</td>
                        </tr>
                        <tr>
                          <td><strong>Total Due Amount:</strong></td>
                          <td className="text-end">{parseFloat(state.formData.TotalAmt || 0).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td><strong>Net Amount:</strong></td>
                          <td className="text-end">{parseFloat(state.formData.NetAmt || 0).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Action Buttons */}
                <Row className="mt-4">
                  <Col>
                    <Btn 
                      color="success" 
                      className="me-2" 
                      onClick={handleAdd}
                      disabled={state.isSaving || state.isAdding}
                    >
                      {state.isAdding ? "Adding..." : "Add"}
                    </Btn>
                    <Btn 
                      color="primary" 
                      className="me-2" 
                      onClick={handleSave}
                      disabled={state.isSaving || state.isAdding}
                    >
                      {state.isSaving ? "Saving..." : "Save"}
                    </Btn>
                    <Btn 
                      color="warning" 
                      className="me-2" 
                      onClick={handleCancel}
                      disabled={state.isSaving || state.isAdding}
                    >
                      Cancel
                    </Btn>
                    {/* Show Edit, Print, Delete buttons when a purchase is selected */}
                    {state.editId > 0 && (
                      <>
                        <Btn 
                          color="info" 
                          className="me-2" 
                          onClick={handleEdit}
                          disabled={state.isSaving || state.isAdding || state.editMode || !state.canEdit}
                          title={!state.canEdit ? "Total Amount and Net Amount do not match! You have created receipt against it so can not edit" : ""}
                        >
                          {state.editMode ? "Editing..." : "Edit"}
                        </Btn>
                        <Btn 
                          color="secondary" 
                          className="me-2" 
                          onClick={handlePrint}
                          disabled={state.isSaving || state.isAdding}
                        >
                          Print
                        </Btn>
                        <Btn 
                          color="success" 
                          className="me-2" 
                          onClick={handleDownloadPDF}
                          disabled={state.isSaving || state.isAdding}
                        >
                          <i className="fa fa-download me-1"></i>PDF
                        </Btn>
                        <Btn 
                          color="success" 
                          className="me-2" 
                          onClick={handleWhatsAppShare}
                          disabled={state.isSaving || state.isAdding}
                          style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                        >
                          <i className="fa fa-whatsapp me-1"></i>WhatsApp
                        </Btn>
                        <Btn 
                          color="danger" 
                          onClick={handleDelete}
                          disabled={state.isSaving || state.isAdding}
                        >
                          Delete
                        </Btn>
                      </>
                    )}
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default TokenReceipt;
