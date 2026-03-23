
import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, CardBody, Col, Container, Row, Label, Input } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import PlotPurchaseTable from "./PlotPurchaseTable";
import { Fn_AddEditData, Fn_FillListData } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Total calculation function
const TotalCalculation = (plotData, formData, setState) => {
  // Example: Calculate totalQty and totalAmount
  console.log("Calculating totals with plotData:", plotData);
  const totalQty = plotData.reduce((sum, item) => sum + (parseFloat(item.Qty) || 0), 0);
  const totalAmount = plotData.reduce((sum, item) => sum + ((parseFloat(item.Qty) || 0) * (parseFloat(item.ActualPrice) || 0)), 0);
  const downPayment = parseFloat(formData?.DownPayment) || 0;
  const NetAmt = totalAmount ;
  const TotalAmt = NetAmt - downPayment;
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

const PlotPurchase = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
    formData: {
      PurchaseRef: "",
      VoucherNo: "",
      VoucherDate: new Date().toISOString().split("T")[0],
      F_SchemeMaster: "",
      F_LedgerMaster: "",
      DownPayment: "",
      NoOfInstallment: "",
      EMIStartDate: "",
      EMIEndDate: "",
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
  const API_URL_VOUCHER_NO = API_WEB_URLS.MASTER + "/0/token/NextVoucherNo";
  const API_URL_PARTY = API_WEB_URLS.MASTER + "/0/token/LedgerMaster";
  const API_URL_PLOT = API_WEB_URLS.MASTER + "/0/token/PlotMasterById";
  const API_URL_PLOT1 = API_WEB_URLS.MASTER + "/0/token/PlotMaster";
  const API_URL_VOUCHERL = API_WEB_URLS.MASTER + "/0/token/VoucherL";
  // If you have a PurchaseRef master, set its API here
  const API_URL_PURCHASE_REF = API_WEB_URLS.MASTER + "/0/token/VoucherH";

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

  // Handler for EMI date changes
  const handleEMIDateChange = (field, value) => {
    handleFormChange(field, value);
  };

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
        API_URL_PLOT + "/Id/" + value
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
          API_URL_VOUCHERL + "/TBL.F_VoucherH/" + value
        );

        // Helper function to format date without timezone issues
        const formatDateLocal = (dateStr) => {
          if (!dateStr) return "";
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Format VoucherDate if it exists
        const voucherDate = selectedPurchaseRef.VoucherDate
          ? formatDateLocal(selectedPurchaseRef.VoucherDate)
          : formatDateLocal(new Date());

        // Format EMIStartDate if it exists
        const emiStartDate = selectedPurchaseRef.EMIStartDate
          ? formatDateLocal(selectedPurchaseRef.EMIStartDate)
          : "";

        // Format EMIEndDate if it exists
        const emiEndDate = selectedPurchaseRef.EMIEndDate
          ? formatDateLocal(selectedPurchaseRef.EMIEndDate)
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
          DownPayment: selectedPurchaseRef.DownPayment?.toString() || "",
          NoOfInstallment: selectedPurchaseRef.NoOfInstallment?.toString() || "",
          EMIStartDate: emiStartDate,
          EMIEndDate: emiEndDate,
          EMIAmount: selectedPurchaseRef.EMIAmount?.toString() || "",
          Penalty: selectedPurchaseRef.Penalty?.toString() || "0",
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

        // Update state with new form data and plot data after options are loaded
        // Don't set editMode to true here - only load the data
        setState((prev) => ({
          ...prev,
          formData: newFormData,
          plotData: mappedPlotData,
          editMode: false, // Keep editMode false when selecting from dropdown
          editId: parseInt(value), // Store the ID for later use when Edit is clicked
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
          EMIStartDate: "",
          EMIEndDate: "",
          EMIAmount: "",
          Penalty: "0",
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
    // Reload the page
    window.location.reload();
  };

  const handleEdit = () => {
    // Enable edit mode when Edit button is clicked
    if (state.formData.PurchaseRef && state.editId > 0) {
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

    if (!state.formData.F_LedgerMaster || state.formData.F_LedgerMaster === "") {
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

    if (!state.formData.EMIStartDate || !state.formData.EMIStartDate.trim()) {
      toast.error("EMI Start Date is required");
      return;
    }

    if (!state.formData.EMIEndDate || !state.formData.EMIEndDate.trim()) {
      toast.error("EMI End Date is required");
      return;
    }

    // Validate that EMI End Date is after EMI Start Date
    if (new Date(state.formData.EMIEndDate) < new Date(state.formData.EMIStartDate)) {
      toast.error("EMI End Date must be after EMI Start Date");
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
    // 🔹 Get comma separated Plot Names from plotData
const plotNames = state.plotData
.map(plot => {
  const plotObj = state.plotOptions.find(
    opt => opt.Id === parseInt(plot.F_PlotMaster)
  );
  return plotObj?.Name || "";
})
.filter(name => name !== "")
.join(", ");


    const partyData = state.partyOptions.find(opt => opt.Id === parseInt(state.formData.F_LedgerMaster));
    const partyName = partyData?.Name || '';
    const MobileNo = partyData?.MobileNo || partyData?.PhoneNo || '';
    const schemeData = state.schemeOptions.find(opt => opt.Id === parseInt(state.formData.F_SchemeMaster));
    const schemeName = schemeData?.Name || '';
    
    try {
      const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
      const formData = new FormData();
      formData.append("Party", partyName || "");
      formData.append("Scheme", schemeName || "");
      formData.append("MobileNo", MobileNo || "");
      formData.append("PlotNames", plotNames || "");
      formData.append("F_CompanyMaster", obj.CompanyId || "");
      formData.append("VoucherNo", state.formData.VoucherNo || "");
      formData.append("VoucherDate", state.formData.VoucherDate || "");
      formData.append("F_SchemeMaster", state.formData.F_SchemeMaster || "");
      formData.append("F_LedgerMaster", state.formData.F_LedgerMaster || "");
      formData.append("DownPayment", state.formData.DownPayment || "");
      formData.append("NoOfInstallment", state.formData.NoOfInstallment || "");
      formData.append("EMIStartDate", state.formData.EMIStartDate || "");
      formData.append("EMIEndDate", state.formData.EMIEndDate || "");
      formData.append("EMIAmount", state.formData.EMIAmount || "");
      formData.append("Penalty", state.formData.Penalty || "0");
      
      // Append totals from formData
      formData.append("TotalQty", state.formData.TotalQty || "0");
      formData.append("TotalAmt", state.formData.TotalAmt || "0.00");
      formData.append("NetAmt", state.formData.NetAmt || "0.00");
      
      // Use editId if in edit mode, otherwise use 0 for new record
      const recordId = state.editMode ? state.editId : 0;
      
      const res = await Fn_AddEditData(dispatch, setState, 
        { arguList: { id: recordId, formData: formData } }, 
        'VoucherH/0/token', true, "memberid", navigate, "#");
      
      if(res && res.data && res.data.data && res.data.data.id > 0){
        const voucherHId = res.data.data.id;
        const plotData = new FormData();
        plotData.append("F_VoucherH", voucherHId);
        plotData.append("Data", JSON.stringify(state.plotData));
        
        const res2 = await Fn_AddEditData(dispatch, setState, 
          { arguList: { id: 0, formData: plotData } }, 
          'VoucherL/0/token', true, "memberid", navigate, "#");
        
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
  const getPrintContent = () => {
    // Helper function to get name from options
    const getNameFromOptions = (id, options) => {
      if (!id || !options) return '';
      const option = options.find(opt => opt.Id === parseInt(id));
      return option ? option.Name : '';
    };

    // Get names for display
    const schemeName = getNameFromOptions(state.formData.F_SchemeMaster, state.schemeOptions);
    const partyName = getNameFromOptions(state.formData.F_LedgerMaster, state.partyOptions);
    const purchaseRefName = state.purchaseRefOptions.find(opt => opt.Id === parseInt(state.formData.PurchaseRef));
    const purchaseRefDisplay = purchaseRefName ? `${purchaseRefName.LedgerName} (${purchaseRefName.SchemeName})` : '';

    // Format date
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    // Get company details from sessionStorage
    const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    const companyName = obj.CompanyName || '';
    const companyAddress = obj.CompanyAddress || '';
    const companyContactNo = obj.CompanyContactNo || '';
    const companyEmail = obj.CompanyEmail || '';
    const companyRegNo = obj.CompanyRegNo || '';

    // Calculate totals from actual plotData rows
    const totalQty = state.plotData.reduce((sum, item) => sum + (parseFloat(item.Qty) || 0), 0);
    const totalDueAmount = parseFloat(state.formData.TotalAmt) || 0;
    const netAmount = parseFloat(state.formData.NetAmt) || 0;

    // Generate HTML content
    return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Plot Purchase - Print</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; }
              .no-print { display: none !important; }
              @page { size: A5; margin: 10mm; }
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              padding: 15px 25px;
              max-width: 100%;
              margin: 0 auto;
              background: #fff;
            }
            @media print {
              body {
                padding: 15px 25px;
                margin-left: 15px;
                margin-right: 15px;
              }
            }
            .print-header {
              display: flex;
              gap: 20px;
              margin-bottom: 12px;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
            }
            .company-column {
              flex: 1;
            }
            .company-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .company-details {
              font-size: 10px;
              line-height: 1.5;
              color: #333;
              margin-bottom: 3px;
            }
            .document-title {
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              margin: 10px 0;
              text-transform: uppercase;
            }
            .info-section {
              margin-bottom: 12px;
              display: flex;
              gap: 20px;
            }
            .info-column {
              flex: 1;
            }
            .info-row {
              display: flex;
              margin-bottom: 4px;
              font-size: 11px;
            }
            .info-label {
              font-weight: bold;
              width: 110px;
              flex-shrink: 0;
            }
            .info-value {
              flex: 1;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 12px 0;
              font-size: 10px;
            }
            table th {
              background-color: #f0f0f0;
              border: 1px solid #000;
              padding: 6px 4px;
              text-align: left;
              font-weight: bold;
            }
            table td {
              border: 1px solid #000;
              padding: 5px 4px;
            }
            .totals-section {
              margin-top: 12px;
              text-align: right;
            }
            .total-row {
              margin-bottom: 4px;
              font-size: 11px;
            }
            .total-label {
              display: inline-block;
              width: 130px;
              text-align: right;
              font-weight: bold;
              margin-right: 10px;
            }
            .total-value {
              display: inline-block;
              width: 90px;
              text-align: right;
            }
            .footer {
              margin-top: 15px;
              padding-top: 8px;
              border-top: 1px solid #000;
              font-size: 9px;
              text-align: center;
              color: #666;
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
            <div class="company-column">
              <div class="company-name">${companyName}</div>
              ${companyAddress ? `<div class="company-details">${companyAddress}</div>` : ''}
              ${companyRegNo ? `<div class="company-details">Reg. No: ${companyRegNo}</div>` : ''}
            </div>
            <div class="company-column">
              ${companyContactNo ? `<div class="company-details">Ph: ${companyContactNo}</div>` : ''}
              ${companyEmail ? `<div class="company-details">Email: ${companyEmail}</div>` : ''}
            </div>
          </div>

          <div class="document-title">Plot Purchase</div>

          <div class="info-section">
            <div class="info-column">
              <div class="info-row">
                <span class="info-label">Voucher No:</span>
                <span class="info-value">${state.formData.VoucherNo || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${formatDate(state.formData.VoucherDate)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Scheme:</span>
                <span class="info-value">${schemeName || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Party:</span>
                <span class="info-value">${partyName || '-'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Down Payment:</span>
                <span class="info-value">₹${state.formData.DownPayment ? parseFloat(state.formData.DownPayment).toFixed(2) : '0.00'}</span>
              </div>
            </div>
            <div class="info-column">
              <div class="info-row">
                <span class="info-label">No. of Installment:</span>
                <span class="info-value">${state.formData.NoOfInstallment || '-'}</span>
              </div>
              ${state.formData.EMIAmount ? `
              <div class="info-row">
                <span class="info-label">EMI Amount:</span>
                <span class="info-value">₹${parseFloat(state.formData.EMIAmount).toFixed(2)}</span>
              </div>
              ` : ''}
              ${state.formData.Penalty ? `
              <div class="info-row">
                <span class="info-label">Penalty:</span>
                <span class="info-value">₹${parseFloat(state.formData.Penalty).toFixed(2)}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30%;">Plot Name</th>
                <th style="width: 12%;">Size</th>
                <th style="width: 15%;">Tent. Price</th>
                <th style="width: 8%;">Qty</th>
                <th style="width: 15%;">Actual Price</th>
                <th style="width: 20%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${state.plotData.map((item) => {
                const plotName = getNameFromOptions(item.F_PlotMaster, state.plotOptions);
                const plotSize = item.PlotSize || '0';
                const tentativePrice = parseFloat(item.TentativePrice) || 0;
                const qty = parseFloat(item.Qty) || 0;
                const actualPrice = parseFloat(item.ActualPrice) || 0;
                const totalAmount = qty * actualPrice;
                return `
                  <tr>
                    <td>${plotName || '-'}</td>
                    <td>${plotSize}</td>
                    <td>₹${tentativePrice.toFixed(2)}</td>
                    <td>${qty}</td>
                    <td>₹${actualPrice.toFixed(2)}</td>
                    <td>₹${totalAmount.toFixed(2)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="total-row">
              <span class="total-label">Total Qty:</span>
              <span class="total-value">${totalQty}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Total Due Amount:</span>
              <span class="total-value">₹${totalDueAmount.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span class="total-label">Net Amount:</span>
              <span class="total-value">₹${netAmount.toFixed(2)}</span>
            </div>
          </div>

          <div class="footer">
            Generated on: ${new Date().toLocaleString('en-IN')}
          </div>
        </body>
        </html>
      `;
  };

  const handlePrint = () => {
    try {
      const printContent = getPrintContent();
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
      const printContent = getPrintContent();
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
      
      const printContent = getPrintContent();
      
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
      const fileName = `PlotPurchase_${state.formData.VoucherNo || 'Purchase'}_${new Date().getTime()}.pdf`;
      
      // Create message
      const getNameFromOptions = (id, options) => {
        if (!id || !options) return '';
        const option = options.find(opt => opt.Id === parseInt(id));
        return option ? option.Name : '';
      };
      const schemeName = getNameFromOptions(state.formData.F_SchemeMaster, state.schemeOptions);
      const partyName = getNameFromOptions(state.formData.F_LedgerMaster, state.partyOptions);
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      };
      
      let message = `*Plot Purchase Receipt*\n\n`;
      message += `*Voucher No:* ${state.formData.VoucherNo || 'N/A'}\n`;
      message += `*Date:* ${formatDate(state.formData.VoucherDate)}\n`;
      message += `*Scheme:* ${schemeName || 'N/A'}\n`;
      message += `*Party:* ${partyName || 'N/A'}\n`;
      message += `*Down Payment:* ₹${state.formData.DownPayment ? parseFloat(state.formData.DownPayment).toFixed(2) : '0.00'}\n`;
      message += `*No. of Installments:* ${state.formData.NoOfInstallment || 'N/A'}\n`;
      message += `*EMI Amount:* ₹${state.formData.EMIAmount ? parseFloat(state.formData.EMIAmount).toFixed(2) : '0.00'}\n`;
      message += `*Total Qty:* ${state.formData.TotalQty || 0}\n`;
      message += `*Total Due Amount:* ₹${parseFloat(state.formData.TotalAmt || 0).toFixed(2)}\n`;
      message += `*Net Amount:* ₹${parseFloat(state.formData.NetAmt || 0).toFixed(2)}\n`;
      message += `\n📎 PDF file is being downloaded. Please attach it to this message.`;
      
      // Try Web Share API first (for mobile devices)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
        try {
          await navigator.share({
            title: `Plot Purchase - Voucher ${state.formData.VoucherNo}`,
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
    // Reload the page
    window.location.reload();
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
            EMIStartDate: "",
            EMIEndDate: "",
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
              <CardHeaderCommon title="Purchase" tagClass="card-title mb-0" />
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
                          {option.LedgerName} ({option.SchemeName})
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
                    <select
                      className="form-select"
                      value={state.formData.F_LedgerMaster}
                      onChange={(e) => handleFormChange("F_LedgerMaster", e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={state.editId > 0 && !state.editMode}
                    >
                      <option value="">Select Party</option>
                      {safeArray(state.partyOptions).map((option) => (
                        <option key={option.Id} value={option.Id}>
                          {option.Name}
                        </option>
                      ))}
                    </select>
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
                    <Label className="form-label">EMI Start Date</Label>
                    <Input
                      type="date"
                      value={state.formData.EMIStartDate}
                      onChange={(e) => handleEMIDateChange("EMIStartDate", e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={state.editId > 0 && !state.editMode}
                    />
                  </Col>
                  <Col md="2">
                    <Label className="form-label">EMI End Date</Label>
                    <Input
                      type="date"
                      value={state.formData.EMIEndDate}
                      onChange={(e) => handleEMIDateChange("EMIEndDate", e.target.value)}
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
                  <Col md="2">
                    <Label className="form-label">Penalty</Label>
                    <Input
                      type="number"
                      value={state.formData.Penalty}
                      onChange={(e) => handleFormChange("Penalty", e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="0"
                      disabled={state.editId > 0 && !state.editMode}
                    />
                  </Col>
                </Row>

                {/* Plot Table */}
                <PlotPurchaseTable
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

                {/* Totals Table Section (same design as PlotPurchaseTable) */}
                <div className="row mt-3">
                  <div className="col-md-4 offset-md-8">
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
                          disabled={state.isSaving || state.isAdding || state.editMode}
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

export default PlotPurchase;

