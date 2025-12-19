
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
    canEdit: true,
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
    const obj = JSON.parse(localStorage.getItem("authUser") || "{}");
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

        // Format VoucherDate if it exists
        const voucherDate = selectedPurchaseRef.VoucherDate
          ? new Date(selectedPurchaseRef.VoucherDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

        // Format EMIStartDate if it exists
        const emiStartDate = selectedPurchaseRef.EMIStartDate
          ? new Date(selectedPurchaseRef.EMIStartDate).toISOString().split("T")[0]
          : "";

        // Format EMIEndDate if it exists
        const emiEndDate = selectedPurchaseRef.EMIEndDate
          ? new Date(selectedPurchaseRef.EMIEndDate).toISOString().split("T")[0]
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
          EMIStartDate: "",
          EMIEndDate: "",
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
        EMIStartDate: "",
        EMIEndDate: "",
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
    setState((prev) => ({ ...prev, isSaving: true }));
    
    try {
      const obj = JSON.parse(localStorage.getItem("authUser") || "{}");
      const formData = new FormData();
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
        const obj2 = JSON.parse(localStorage.getItem("authUser") || "{}");
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

  const handlePrint = () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

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
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };

      // Header Section
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text('PLOT PURCHASE', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Company Info (if available)
      const obj = JSON.parse(localStorage.getItem("authUser") || "{}");
      if (obj.CompanyName) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'normal');
        pdf.text(obj.CompanyName, pageWidth / 2, yPos, { align: 'center' });
        yPos += 6;
      }

      // Draw line
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Main Information Section
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      
      // Purchase Ref
      pdf.text('Purchase Ref:', margin, yPos);
      pdf.setFont(undefined, 'normal');
      pdf.text(purchaseRefDisplay || '-', margin + 40, yPos);
      yPos += 7;

      // Date
      pdf.setFont(undefined, 'bold');
      pdf.text('Date:', margin, yPos);
      pdf.setFont(undefined, 'normal');
      pdf.text(formatDate(state.formData.VoucherDate), margin + 40, yPos);
      yPos += 7;

      // Scheme
      pdf.setFont(undefined, 'bold');
      pdf.text('Scheme:', margin, yPos);
      pdf.setFont(undefined, 'normal');
      pdf.text(schemeName || '-', margin + 40, yPos);
      yPos += 7;

      // Party
      pdf.setFont(undefined, 'bold');
      pdf.text('Party:', margin, yPos);
      pdf.setFont(undefined, 'normal');
      pdf.text(partyName || '-', margin + 40, yPos);
      yPos += 7;

      // Down Payment
      pdf.setFont(undefined, 'bold');
      pdf.text('Down Payment:', margin, yPos);
      pdf.setFont(undefined, 'normal');
      pdf.text(state.formData.DownPayment ? `${parseFloat(state.formData.DownPayment).toFixed(2)}` : '-', margin + 40, yPos);
      yPos += 7;

      // No. of Installment
      pdf.setFont(undefined, 'bold');
      pdf.text('No. of Installment:', margin, yPos);
      pdf.setFont(undefined, 'normal');
      pdf.text(state.formData.NoOfInstallment || '-', margin + 40, yPos);
      yPos += 7;

      // EMI Start Date
      if (state.formData.EMIStartDate) {
        pdf.setFont(undefined, 'bold');
        pdf.text('EMI Start Date:', margin, yPos);
        pdf.setFont(undefined, 'normal');
        pdf.text(formatDate(state.formData.EMIStartDate), margin + 40, yPos);
        yPos += 7;
      }

      // EMI End Date
      if (state.formData.EMIEndDate) {
        pdf.setFont(undefined, 'bold');
        pdf.text('EMI End Date:', margin, yPos);
        pdf.setFont(undefined, 'normal');
        pdf.text(formatDate(state.formData.EMIEndDate), margin + 40, yPos);
        yPos += 7;
      }

      // EMI Amount
      if (state.formData.EMIAmount) {
        pdf.setFont(undefined, 'bold');
        pdf.text('EMI Amount:', margin, yPos);
        pdf.setFont(undefined, 'normal');
        pdf.text(`${parseFloat(state.formData.EMIAmount).toFixed(2)}`, margin + 40, yPos);
        yPos += 7;
      }

      yPos += 5;
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Table Header
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      const tableHeaders = ['Plot Name', 'Plot Size', 'Tentative Price', 'Qty', 'Actual Price', 'Total Amount'];
      const colWidths = [40, 25, 30, 20, 30, 30];
      const startX = margin;
      let xPos = startX;

      // Draw table header
      pdf.setFillColor(240, 240, 240);
      pdf.rect(startX, yPos - 5, pageWidth - 2 * margin, 8, 'F');
      
      tableHeaders.forEach((header, index) => {
        pdf.text(header, xPos + 2, yPos);
        xPos += colWidths[index];
      });
      yPos += 10;

      // Table Data
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(9);
      
      state.plotData.forEach((item, index) => {
        // Check if we need a new page
        if (yPos > pageHeight - 30) {
          pdf.addPage();
          yPos = margin;
        }

        const plotName = getNameFromOptions(item.F_PlotMaster, state.plotOptions);
        const plotSize = item.PlotSize || '0';
        const tentativePrice = parseFloat(item.TentativePrice) || 0;
        const qty = parseFloat(item.Qty) || 0;
        const actualPrice = parseFloat(item.ActualPrice) || 0;
        const totalAmount = qty * actualPrice;

        xPos = startX;
        pdf.text(plotName || '-', xPos + 2, yPos);
        xPos += colWidths[0];
        pdf.text(plotSize, xPos + 2, yPos);
        xPos += colWidths[1];
        pdf.text(`${tentativePrice.toFixed(2)}`, xPos + 2, yPos);
        xPos += colWidths[2];
        pdf.text(qty.toString(), xPos + 2, yPos);
        xPos += colWidths[3];
        pdf.text(`${actualPrice.toFixed(2)}`, xPos + 2, yPos);
        xPos += colWidths[4];
        pdf.text(`${totalAmount.toFixed(2)}`, xPos + 2, yPos);
        
        yPos += 7;
      });

      yPos += 5;
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      // Totals Section
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      const totalQty = state.formData.TotalQty || 0;
      const totalDueAmount = parseFloat(state.formData.TotalAmt) || 0;
      const netAmount = parseFloat(state.formData.NetAmt) || 0;

      pdf.text('Total Qty:', pageWidth - margin - 60, yPos);
      pdf.setFont(undefined, 'normal');
      pdf.text(totalQty.toString(), pageWidth - margin - 10, yPos, { align: 'right' });
      yPos += 7;

      pdf.setFont(undefined, 'bold');
      pdf.text('Total Due Amount:', pageWidth - margin - 60, yPos);
      pdf.setFont(undefined, 'normal');
      pdf.text(`${totalDueAmount.toFixed(2)}`, pageWidth - margin - 10, yPos, { align: 'right' });
      yPos += 7;

      pdf.setFont(undefined, 'bold');
      pdf.text('Net Amount:', pageWidth - margin - 60, yPos);
      pdf.setFont(undefined, 'normal');
      pdf.text(`${netAmount.toFixed(2)}`, pageWidth - margin - 10, yPos, { align: 'right' });

      // Footer
      const footerY = pageHeight - 10;
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'italic');
      pdf.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, pageWidth / 2, footerY, { align: 'center' });

      // Save PDF
      const fileName = `PlotPurchase_${state.formData.PurchaseRef || 'New'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
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
          EMIStartDate: "",
          EMIEndDate: "",
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
        const obj = JSON.parse(localStorage.getItem("authUser") || "{}");
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
                      onChange={(e) => handleFormChange("EMIStartDate", e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={state.editId > 0 && !state.editMode}
                    />
                  </Col>
                  <Col md="2">
                    <Label className="form-label">EMI End Date</Label>
                    <Input
                      type="date"
                      value={state.formData.EMIEndDate}
                      onChange={(e) => handleFormChange("EMIEndDate", e.target.value)}
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
