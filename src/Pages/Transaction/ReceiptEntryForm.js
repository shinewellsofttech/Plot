import { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Formik, Form, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Card, CardBody, CardFooter, Col, Container, FormGroup, Input, Label, Row, Table } from "reactstrap";
import { Btn } from "../../AbstractElements";
import Breadcrumbs from "../../CommonElements/Breadcrumbs/Breadcrumbs";
import CardHeaderCommon from "../../CommonElements/CardHeaderCommon/CardHeaderCommon";
import { Fn_FillListData, Fn_AddEditData, showToastWithCloseButton } from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const API_URL_RECEIPTH = API_WEB_URLS.MASTER + "/0/token/ReceiptH";
const API_URL_RECEIPTNO = API_WEB_URLS.MASTER + "/0/token/NextReceiptNo";


const API_URL_SCHEME = API_WEB_URLS.MASTER + "/0/token/SchemeMaster";
const API_URL_VOUCHER = API_WEB_URLS.MASTER + "/0/token/VoucherH";
const API_URL_EMI = API_WEB_URLS.MASTER + "/0/token/EMIChartById";
const API_URL_SAVE = "ReceiptEntry/0/token";

const ReceiptEntryForm = () => {
  const [state, setState] = useState({
    ReceiptHArray: [],
    SchemeArray: [],
    VoucherArray: [],
    EMIArray: [],
    selectedEMIs: [],
    selectedEMIIds: [],
    ReceiptLData: "",
    isProgress: true,
    isEditMode: false,
    isSaving: false,
    selectedReceiptId: null,
    receiptSearchTerm: "",
    receiptDropdownOpen: false,
    formData: {
      F_SchemeMaster: "",
      F_VoucherH: "",
      PaymentMode: "",
      ReceiptNo: "",
      ReceiptDate: new Date().toISOString().split('T')[0],
      TotalPaidAmount: 0,
      Penalty: 0,
      Remark: "",
      PaymentRefNo: "",
      PaymentBankName: "",
      PaymentDate: "",
    },
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchData = async () => {
    const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    await Fn_FillListData(dispatch, setState, "SchemeArray", API_URL_SCHEME + "/TBL.F_CompanyMaster/" + obj.CompanyId  );
    const receiptNo = await Fn_FillListData(dispatch, setState, "ReceiptNo", API_URL_RECEIPTNO + "/Id/" + obj.CompanyId);
    console.log("receiptNo--------------->",receiptNo);
    if(receiptNo && receiptNo.length > 0) {
      setState((prev) => ({
        ...prev,
        formData: {
          ...prev.formData,
          ReceiptNo: receiptNo[0].NextReceiptNo,
        },
      }));
    }
    await Fn_FillListData(dispatch, setState, "ReceiptHArray", API_URL_RECEIPTH + "/Id/" + obj.CompanyId);
  };

  useEffect(() => {
    fetchData();
  }, [dispatch]);

  const handleAddNew = async (setFieldValue) => {
    // Reset form to completely initial state - reset everything
    setState((prev) => ({
      ...prev,
      isEditMode: false,
      selectedReceiptId: null,
      receiptSearchTerm: "",
      receiptDropdownOpen: false,
      formData: {
        F_SchemeMaster: "",
        F_VoucherH: "",
        PaymentMode: "",
        ReceiptNo: "",
        ReceiptDate: new Date().toISOString().split('T')[0],
        TotalPaidAmount: 0,
        Penalty: 0,
        Remark: "",
        PaymentRefNo: "",
        PaymentBankName: "",
        PaymentDate: "",
      },
      VoucherArray: [],
      EMIArray: [],
      selectedEMIs: [],
      selectedEMIIds: [],
      ReceiptLData: "",
    }));

    // Reset all Formik values
    setFieldValue("F_SchemeMaster", "");
    setFieldValue("F_VoucherH", "");
    setFieldValue("PaymentMode", "");
    setFieldValue("ReceiptNo", "");
    setFieldValue("ReceiptDate", new Date().toISOString().split('T')[0]);
    setFieldValue("TotalPaidAmount", 0);
    setFieldValue("Penalty", 0);
    setFieldValue("Remark", "");
    setFieldValue("PaymentRefNo", "");
    setFieldValue("PaymentBankName", "");
    setFieldValue("PaymentDate", "");

    // Call fetchData to reload data
    await fetchData();
  };

  const handleCancel = async (setFieldValue) => {
    // Reset form to completely initial state - reset everything
    setState((prev) => ({
      ...prev,
      isEditMode: false,
      selectedReceiptId: null,
      receiptSearchTerm: "",
      receiptDropdownOpen: false,
      formData: {
        F_SchemeMaster: "",
        F_VoucherH: "",
        PaymentMode: "",
        ReceiptNo: "",
        ReceiptDate: new Date().toISOString().split('T')[0],
        TotalPaidAmount: 0,
        Penalty: 0,
        Remark: "",
        PaymentRefNo: "",
        PaymentBankName: "",
        PaymentDate: "",
      },
      VoucherArray: [],
      EMIArray: [],
      selectedEMIs: [],
      selectedEMIIds: [],
      ReceiptLData: "",
    }));

    // Reset all Formik values
    setFieldValue("F_SchemeMaster", "");
    setFieldValue("F_VoucherH", "");
    setFieldValue("PaymentMode", "");
    setFieldValue("ReceiptNo", "");
    setFieldValue("ReceiptDate", new Date().toISOString().split('T')[0]);
    setFieldValue("TotalPaidAmount", 0);
    setFieldValue("Penalty", 0);
    setFieldValue("Remark", "");
    setFieldValue("PaymentRefNo", "");
    setFieldValue("PaymentBankName", "");
    setFieldValue("PaymentDate", "");

    // Call fetchData to reload data
    await fetchData();
  };

  const handleSchemeChange = async (schemeId, setFieldValue) => {
    // Reset entire form except scheme dropdown - keep the new scheme value
    setState((prev) => ({
      ...prev,
      isEditMode: false,
      selectedReceiptId: null,
      formData: {
        F_SchemeMaster: schemeId, // Keep the new scheme value
        F_VoucherH: "",
        PaymentMode: "",
        ReceiptNo: "",
        ReceiptDate: new Date().toISOString().split('T')[0],
        TotalPaidAmount: 0,
        Penalty: 0,
        Remark: "",
        PaymentRefNo: "",
        PaymentBankName: "",
        PaymentDate: "",
      },
      VoucherArray: [],
      EMIArray: [],
      selectedEMIs: [],
      selectedEMIIds: [],
      ReceiptLData: "",
      receiptSearchTerm: "", // Clear receipt search
    }));

    // Update all Formik values
    setFieldValue("F_SchemeMaster", schemeId);
    setFieldValue("F_VoucherH", "");
    setFieldValue("PaymentMode", "");
    setFieldValue("ReceiptNo", "");
    setFieldValue("ReceiptDate", new Date().toISOString().split('T')[0]);
    setFieldValue("TotalPaidAmount", 0);
    setFieldValue("Penalty", 0);
    setFieldValue("Remark", "");
    setFieldValue("PaymentRefNo", "");
    setFieldValue("PaymentBankName", "");
    setFieldValue("PaymentDate", "");

    // Fetch vouchers based on selected scheme
    if (schemeId) {
      const res = await Fn_FillListData(dispatch, setState, "VoucherArray", API_URL_VOUCHER + "/TBL.F_SchemeMaster/" + schemeId);
      console.log(res);
      
      // Fetch new receipt number
      const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
      const receiptNo = await Fn_FillListData(dispatch, setState, "ReceiptNo", API_URL_RECEIPTNO + "/Id/" + obj.CompanyId);
      if(receiptNo && receiptNo.length > 0) {
        setState((prev) => ({
          ...prev,
          formData: {
            ...prev.formData,
            ReceiptNo: receiptNo[0].NextReceiptNo,
          },
        }));
        setFieldValue("ReceiptNo", receiptNo[0].NextReceiptNo);
      }
    }
  };

  const handleVoucherChange = async (voucherId, setFieldValue) => {
    // Reset form except scheme and voucher dropdowns - keep both values
    setState((prev) => ({
      ...prev,
      isEditMode: false,
      selectedReceiptId: null,
      formData: {
        F_SchemeMaster: prev.formData.F_SchemeMaster, // Keep scheme value
        F_VoucherH: voucherId, // Keep the new voucher value
        PaymentMode: "",
        ReceiptNo: "",
        ReceiptDate: new Date().toISOString().split('T')[0],
        TotalPaidAmount: 0,
        Penalty: 0,
        Remark: "",
        PaymentRefNo: "",
        PaymentBankName: "",
        PaymentDate: "",
      },
      EMIArray: [],
      selectedEMIs: [],
      selectedEMIIds: [],
      ReceiptLData: "",
      receiptSearchTerm: "", // Clear receipt search
    }));

    // Update all Formik values except scheme
    setFieldValue("F_VoucherH", voucherId);
    setFieldValue("PaymentMode", "");
    setFieldValue("ReceiptNo", "");
    setFieldValue("ReceiptDate", new Date().toISOString().split('T')[0]);
    setFieldValue("TotalPaidAmount", 0);
    setFieldValue("Penalty", 0);
    setFieldValue("Remark", "");
    setFieldValue("PaymentRefNo", "");
    setFieldValue("PaymentBankName", "");
    setFieldValue("PaymentDate", "");

    // Fetch EMIs based on selected voucher
    if (voucherId) {
      await Fn_FillListData(dispatch, setState, "EMIArray", API_URL_EMI + "/TBL.F_VoucherH/" + voucherId);
      
      // Fetch new receipt number
      const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
      const receiptNo = await Fn_FillListData(dispatch, setState, "ReceiptNo", API_URL_RECEIPTNO + "/Id/" + obj.CompanyId);
      if(receiptNo && receiptNo.length > 0) {
        setState((prev) => ({
          ...prev,
          formData: {
            ...prev.formData,
            ReceiptNo: receiptNo[0].NextReceiptNo,
          },
        }));
        setFieldValue("ReceiptNo", receiptNo[0].NextReceiptNo);
      }
    }
  };

  const generateRemark = (paymentMode, amount, paymentRefNo = "", paymentBankName = "", paymentDate = "") => {
    if (!paymentMode || !amount || parseFloat(amount) <= 0) {
      return "";
    }
    
    // Get payment mode name
    const mode = paymentModeOptions.find(m => m.Id === parseInt(paymentMode));
    const paymentModeName = mode ? mode.Name : "N/A";
    
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(parseFloat(amount));
    
    let remark = `Payment received via ${paymentModeName} for ${formattedAmount}`;
    
    // Add payment details if available
    if (shouldShowPaymentFields(paymentMode)) {
      const labels = getPaymentFieldLabels(paymentMode);
      const details = [];
      
      if (paymentRefNo && paymentRefNo.trim()) {
        details.push(`${labels.refLabel}: ${paymentRefNo.trim()}`);
      }
      if (paymentBankName && paymentBankName.trim()) {
        details.push(`${labels.bankLabel}: ${paymentBankName.trim()}`);
      }
      if (paymentDate && paymentDate.trim()) {
        const formattedDate = new Date(paymentDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        details.push(`${labels.dateLabel}: ${formattedDate}`);
      }
      
      if (details.length > 0) {
        remark += ` (${details.join(', ')})`;
      }
    }
    
    return remark;
  };

  const handleCommonChange = (name, value, handleChange, setFieldValue) => {
    // Update Formik value
    handleChange({ target: { name, value } });
    
    // Update formData in state
    const updatedFormData = {
      ...state.formData,
      [name]: value,
    };
    
    // If PaymentMode changes, clear payment fields if switching to Cash
    if (name === "PaymentMode") {
      const modeId = parseInt(value);
      if (modeId === 1) {
        // Cash mode - clear payment fields
        updatedFormData.PaymentRefNo = "";
        updatedFormData.PaymentBankName = "";
        updatedFormData.PaymentDate = "";
        setFieldValue("PaymentRefNo", "");
        setFieldValue("PaymentBankName", "");
        setFieldValue("PaymentDate", "");
      }
    }
    
    // Auto-generate remark if PaymentMode, TotalPaidAmount, Penalty, or payment fields change
    if (name === "PaymentMode" || name === "TotalPaidAmount" || name === "Penalty" || name === "PaymentRefNo" || name === "PaymentBankName" || name === "PaymentDate") {
      const paymentMode = name === "PaymentMode" ? value : updatedFormData.PaymentMode;
      const totalAmount = name === "TotalPaidAmount" ? value : updatedFormData.TotalPaidAmount;
      const paymentRefNo = name === "PaymentRefNo" ? value : updatedFormData.PaymentRefNo;
      const paymentBankName = name === "PaymentBankName" ? value : updatedFormData.PaymentBankName;
      const paymentDate = name === "PaymentDate" ? value : updatedFormData.PaymentDate;
      const autoRemark = generateRemark(paymentMode, totalAmount, paymentRefNo, paymentBankName, paymentDate);
      
      if (autoRemark) {
        updatedFormData.Remark = autoRemark;
        setFieldValue("Remark", autoRemark);

      }
    }
    
    setState((prev) => ({
      ...prev,
      formData: updatedFormData,
    }));
  };

  const paymentModeOptions = [
    { Id: 1, Name: "Cash" },
    { Id: 2, Name: "Cheque" },
    { Id: 3, Name: "Online Transfer" },
    { Id: 4, Name: "UPI" },
    { Id: 5, Name: "Card" },
  ];

  const getPaymentFieldLabels = (paymentMode) => {
    const modeId = parseInt(paymentMode);
    switch (modeId) {
      case 2: // Cheque
        return {
          refLabel: "Cheque No",
          bankLabel: "Bank Name",
          dateLabel: "Cheque Date"
        };
      case 3: // Online Transfer
      case 4: // UPI
      case 5: // Card
        return {
          refLabel: "Ref No",
          bankLabel: "Bank Name",
          dateLabel: "Transaction Date"
        };
      default:
        return {
          refLabel: "Ref No",
          bankLabel: "Bank Name",
          dateLabel: "Transaction Date"
        };
    }
  };

  const shouldShowPaymentFields = (paymentMode) => {
    const modeId = parseInt(paymentMode);
    // Show fields for Cheque, Online Transfer, UPI, and Card
    return modeId === 2 || modeId === 3 || modeId === 4 || modeId === 5;
  };

  const validationSchema = Yup.object({
    F_SchemeMaster: Yup.string().required("Scheme is required"),
    F_VoucherH: Yup.string().required("Voucher is required"),
    PaymentMode: Yup.string().required("Payment Mode is required"),
    ReceiptNo: Yup.number()
      .required("Receipt No is required")
      .positive("Receipt No must be positive"),
    ReceiptDate: Yup.date().required("Receipt Date is required"),
    TotalPaidAmount: Yup.number()
      .required("Total Paid Amount is required")
      .positive("Amount must be positive"),
    Penalty: Yup.number()
      .min(0, "Penalty must be 0 or positive"),
    Remark: Yup.string(),
  });

  const handleEMISelectChange = (e, setFieldValue) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selectedIds = selectedOptions.map(option => option.value);

    if (!selectedIds || selectedIds.length === 0) {
      // Auto-generate remark with 0 amount (will return empty string)
      const autoRemark = generateRemark(
        state.formData.PaymentMode, 
        0, 
        state.formData.PaymentRefNo || "", 
        state.formData.PaymentBankName || "", 
        state.formData.PaymentDate || ""
      );
      
      setState((prev) => ({
        ...prev,
        selectedEMIs: [],
        selectedEMIIds: [],
        ReceiptLData: "",
        formData: {
          ...prev.formData,
          Penalty: 0,
          TotalPaidAmount: 0,
          Remark: autoRemark || "",
        },
      }));
      setFieldValue("Penalty", 0);
      setFieldValue("TotalPaidAmount", 0);
      setFieldValue("Remark", autoRemark || "");
      return;
    }

    // Get selected EMIs from EMIArray
    // In edit mode, preserve original paid amounts if they exist in previously selected EMIs
    const selectedEMIs = state.EMIArray
      .filter((emi) => selectedIds.includes(String(emi.Id)))
      .map((emi) => {
        // Check if this EMI was previously selected with a custom amount (in edit mode)
        const previouslySelected = state.selectedEMIs.find(prevEmi => prevEmi.F_EMIChart === emi.Id);
        const paidAmount = (state.isEditMode && previouslySelected) 
          ? previouslySelected.PaidAmount 
          : (emi.EMIAmount || 0);
        
        return {
          F_EMIChart: emi.Id,
          PaidAmount: paidAmount,
          EMIAmount: emi.EMIAmount || 0,
        };
      });
      console.log("selectedEMIs==============>",selectedEMIs);
    const receiptLData = generateReceiptLData(selectedEMIs);
    // Sum of PaidAmount from selected EMIs
    const emiTotal = selectedEMIs.reduce((sum, item) => sum + parseFloat(item.PaidAmount || 0), 0);
    // Calculate total penalty from selected EMIs' TotalPenaltyAmount
    const selectedEMIObjects = state.EMIArray.filter((emi) => selectedIds.includes(String(emi.Id)));
    const totalPenaltyFromEMIs = selectedEMIObjects.reduce((sum, emi) => {
      const penaltyAmount = parseFloat(emi.TotalPenaltyAmount || 0);
      return sum + (penaltyAmount > 0 ? penaltyAmount : 0);
    }, 0);
    const penalty = totalPenaltyFromEMIs;
    const totalAmount = emiTotal + penalty;

    // Auto-generate remark based on payment mode, total amount, and payment fields
    const autoRemark = generateRemark(
      state.formData.PaymentMode, 
      totalAmount, 
      state.formData.PaymentRefNo || "", 
      state.formData.PaymentBankName || "", 
      state.formData.PaymentDate || ""
    );

    setState((prev) => ({
      ...prev,
      selectedEMIs: selectedEMIs,
      selectedEMIIds: selectedIds,
      ReceiptLData: receiptLData,
      formData: {
        ...prev.formData,
        Penalty: penalty,
        TotalPaidAmount: totalAmount,
        Remark: autoRemark || prev.formData.Remark,
      },
    }));

    setFieldValue("Penalty", penalty);
    setFieldValue("TotalPaidAmount", totalAmount);
    if (autoRemark) {
      setFieldValue("Remark", autoRemark);
    }
  };

  const generateReceiptLData = (emis) => {
    return emis.map((emi) => `${emi.F_EMIChart}~${emi.EMIAmount}`).join("#");
  };

  const handleSubmit = async (values, setFieldValue) => {
    // Set loading state to true
    setState((prev) => ({ ...prev, isSaving: true }));
    
    try {
      const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
      const voucherData = state.VoucherArray.find(opt => opt.Id === parseInt(state.formData.F_VoucherH));
      const partyName = voucherData?.LedgerName || '';
      const MobileNo = voucherData?.MobileNo || voucherData?.PhoneNo || '';
      const paymentMode = paymentModeOptions.find(opt => opt.Id === parseInt(state.formData.PaymentMode));
      const formData = new FormData();
      console.log(state.ReceiptLData);

      formData.append("Party", partyName || "");
      formData.append("MobileNo", MobileNo || "");
      formData.append("PaymentModeName", paymentMode?.Name || "");
      formData.append("F_SchemeMaster", state.formData.F_SchemeMaster);
      formData.append("F_CompanyMaster", obj.CompanyId || "");
      formData.append("F_VoucherH", state.formData.F_VoucherH);
      formData.append("PaymentMode", state.formData.PaymentMode);
      formData.append("ReceiptNo", state.formData.ReceiptNo);
      formData.append("ReceiptDate", state.formData.ReceiptDate);
      formData.append("TotalPaidAmount", state.formData.TotalPaidAmount);
      formData.append("Penalty", state.formData.Penalty || 0);
      formData.append("Remark", state.formData.Remark);
      if (state.formData.PaymentRefNo && state.formData.PaymentRefNo.trim()) {
        formData.append("PaymentRefNo", state.formData.PaymentRefNo);
      }
      if (state.formData.PaymentBankName && state.formData.PaymentBankName.trim()) {
        formData.append("PaymentBankName", state.formData.PaymentBankName);
      }
      if (state.formData.PaymentDate && state.formData.PaymentDate.trim()) {
        formData.append("PaymentDate", state.formData.PaymentDate);
      }
      formData.append("ReceiptLData", state.ReceiptLData);
      formData.append("UserId", obj.Id || obj.id || "");
      
      const receiptId = state.isEditMode ? state.selectedReceiptId : 0;
      if (receiptId) {
        formData.append("ReceiptId", receiptId);
      }
    
      // Create a no-op navigate function to prevent automatic navigation
      const noOpNavigate = () => {};
      
      const result = await Fn_AddEditData(
        dispatch,
        setState,
        { arguList: { id: 0, formData: formData } },
        API_URL_SAVE,
        true,
        "memberid",
        noOpNavigate, // Don't navigate automatically
        null
      );
    
      console.log("Save result:", result);
      const savedReceiptId = result?.data?.data?.id;
      console.log(savedReceiptId);
      if (savedReceiptId && savedReceiptId > 0) {
        // Refresh ReceiptHArray
        const res = await Fn_FillListData(dispatch, setState, "ReceiptHArray", API_URL_RECEIPTH + "/Id/0");
    
        if(res.length > 0) {
          const selectedReceipt = res.find(r => r.ReceiptId == parseInt(savedReceiptId));
          console.log("selectedReceipt--------------->",selectedReceipt);
          if(selectedReceipt) {
            await handleReceiptUpdate(savedReceiptId, setFieldValue, res);
          }
        }
         
        showToastWithCloseButton("success", "Receipt saved successfully");
      } else {
        showToastWithCloseButton("error", "Receipt save failed - No ID returned");
      }
    } catch (error) {
      console.error("Error saving receipt:", error);
      showToastWithCloseButton("error", "Error saving receipt");
    } finally {
      // Set loading state to false
      setState((prev) => ({ ...prev, isSaving: false }));
    }
  };

  // Helper function to convert number to words
  const numberToWords = (num) => {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    
    if (num === 0) return 'ZERO';
    if (num < 20) return ones[num];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const one = num % 10;
      return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
    }
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      const remainder = num % 100;
      return ones[hundred] + ' HUNDRED' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
    }
    if (num < 100000) {
      const thousand = Math.floor(num / 1000);
      const remainder = num % 1000;
      return numberToWords(thousand) + ' THOUSAND' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
    }
    if (num < 10000000) {
      const lakh = Math.floor(num / 100000);
      const remainder = num % 100000;
      return numberToWords(lakh) + ' LAKH' + (remainder > 0 ? ' ' + numberToWords(remainder) : '');
    }
    return '';
  };

  // Helper function to format date as DD-MMM-YYYY
  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    try {
      // Extract date part (YYYY-MM-DD) to avoid timezone issues
      const datePart = dateStr.split('T')[0];
      const [year, month, day] = datePart.split('-');
      // Create date in local timezone
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const dayStr = String(date.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthStr = months[date.getMonth()];
      const yearStr = date.getFullYear();
      return `${dayStr}-${monthStr}-${yearStr}`;
    } catch {
      return '';
    }
  };

  // Helper function to get print content HTML
  const getReceiptPrintContent = async () => {
    if (!state.selectedReceiptId) {
      return null;
    }
    
    // Ensure EMI data is loaded if not already
    const selectedReceipt = state.ReceiptHArray.find(r => r.ReceiptId === parseInt(state.selectedReceiptId));
    if (selectedReceipt && selectedReceipt.F_VoucherH && state.EMIArray.length === 0) {
      await Fn_FillListData(dispatch, setState, "EMIArray", API_URL_EMI + "/TBL.F_VoucherH/" + selectedReceipt.F_VoucherH);
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Get print data first
    const printData = getReceiptPrintData();
    if (!printData) {
      return null;
    }
    
    const { receipt, emiDetails, company } = printData;
    const paymentModeName = getPaymentModeName(receipt.PaymentMode);
    
    // Get PlotNames from VoucherArray
    const voucherData = state.VoucherArray.find(v => v.Id === parseInt(selectedReceipt.F_VoucherH));
    const plotNames = voucherData?.PlotNames || voucherData?.PlotName || '';
    
    // Generate HTML content for receipt with tables
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${receipt.ReceiptNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            padding: 8px;
            background: #fff;
            color: #000;
            font-size: 13px;
            line-height: 1.2;
          }
          .print-button-container {
            text-align: center;
            margin-bottom: 8px;
          }
          .print-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            font-size: 12px;
            cursor: pointer;
            border-radius: 4px;
          }
          .print-button:hover {
            background: #0056b3;
          }
          @media print {
            .print-button-container { display: none; }
            body { padding: 5mm; background: white; }
            @page { size: A4; margin: 5mm; }
          }
          .receipt-header {
            text-align: center;
            border-bottom: 1.5px solid #2c3e50;
            padding-bottom: 4px;
            margin-bottom: 6px;
          }
          .receipt-header h1 {
            font-size: 26px;
            font-weight: bold;
            text-transform: uppercase;
            color: #2c3e50;
            margin-bottom: 2px;
            line-height: 1.1;
          }
          .company-details {
            font-size: 11px;
            line-height: 1.2;
            margin-top: 2px;
            color: #555;
          }
          .receipt-body {
            margin: 6px 0;
          }
          .receipt-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
            margin: 4px 0;
            text-transform: uppercase;
            line-height: 1.1;
          }
          .receipt-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 20px;
            margin-bottom: 6px;
          }
          .receipt-info-item {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 16px;
            line-height: 1.2;
          }
          .receipt-info-label {
            font-weight: bold;
            color: #000;
            margin-right: 5px;
          }
          .receipt-info-value {
            color: #000;
            text-align: right;
          }
          .emi-table {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0;
            font-size: 16px;
          }
          .emi-table thead {
            background: transparent;
            color: #000;
          }
          .emi-table th {
            padding: 3px 5px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #ddd;
            background: transparent;
            font-size: 16px;
            line-height: 1.2;
          }
          .emi-table td {
            padding: 2px 5px;
            border: 1px solid #ddd;
            background: transparent;
            font-size: 16px;
            line-height: 1.2;
          }
          .emi-table tbody tr:nth-child(even) {
            background: transparent;
          }
          .total-section {
            margin-top: 6px;
            padding: 3px 0;
            border-top: 1px solid #ddd;
            padding-top: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-left {
            flex: 1;
            text-align: left;
          }
          .total-right {
            flex: 1;
            text-align: right;
          }
          .total-label {
            font-size: 13px;
            font-weight: bold;
            display: inline-block;
            margin-right: 6px;
          }
          .total-amount {
            font-size: 15px;
            font-weight: bold;
            display: inline-block;
          }
          .remark-inline {
            font-size: 12px;
            color: #000;
            line-height: 1.2;
          }
          .remark-label-inline {
            font-weight: bold;
            margin-right: 4px;
          }
          .payment-mode-badge {
            font-weight: normal;
            font-size: 11px;
            text-transform: uppercase;
                  }
          .remark-section {
            margin-top: 6px;
            padding: 4px 6px;
            background: #fff3cd;
            border-left: 3px solid #ffc107;
            border-radius: 2px;
            font-size: 11px;
            line-height: 1.2;
          }
          .remark-label {
            font-weight: bold;
            color: #856404;
            margin-bottom: 2px;
                }
          .remark-text {
            color: #856404;
            line-height: 1.2;
          }
          .receipt-footer {
            margin-top: 8px;
            padding-top: 4px;
            border-top: 1px dashed #bdc3c7;
            text-align: center;
            color: #555;
            font-size: 10px;
            line-height: 1.2;
          }
          .payment-date-info {
            font-size: 11px;
            color: #000;
            font-weight: normal;
      }
        </style>
      </head>
      <body>
        <div class="print-button-container">
          <button class="print-button" onclick="window.print()">🖨️ Print Receipt</button>
        </div>
        <div class="receipt-header">
          <h1>${company.CompanyName || "MADHUBAN COLONIZERS"}</h1>
          ${company.CompanyBranchName ? `<h2 style="font-size: 12px; color: #34495e; margin: 2px 0; line-height: 1.1;">${company.CompanyBranchName}</h2>` : ''}
          <div class="company-details">
            ${company.CompanyAddress ? `<div>${company.CompanyAddress}</div>` : ''}
            <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 2px;">
              ${company.CompanyMobileNo ? `<span>📞 ${company.CompanyMobileNo}</span>` : ''}
              ${company.CompanyContactNo ? `<span>📞 ${company.CompanyContactNo}</span>` : ''}
            </div>
            ${company.CompanyRegNo ? `<div style="margin-top: 2px; font-weight: bold;">Reg. No: ${company.CompanyRegNo}</div>` : ''}
          </div>
        </div>
        
        <div class="receipt-body">
          <div class="receipt-title">PAYMENT RECEIPT</div>
          
          <div class="receipt-info-grid">
            <div class="receipt-info-item">
              <span class="receipt-info-label">Receipt No:</span>
              <span class="receipt-info-value">#${receipt.ReceiptNo}</span>
            </div>
            <div class="receipt-info-item">
              <span class="receipt-info-label">Date:</span>
              <span class="receipt-info-value">${formatDate(receipt.ReceiptDate)}</span>
            </div>
            ${receipt.CustomerName ? `
            <div class="receipt-info-item" style="grid-column: 1 / -1;">
              <span class="receipt-info-label">Customer:</span>
              <span class="receipt-info-value">${receipt.CustomerName}</span>
            </div>
            ` : ''}
            ${receipt.SchemeName ? `
            <div class="receipt-info-item" style="grid-column: 1 / -1;">
              <span class="receipt-info-label">Scheme:</span>
              <span class="receipt-info-value">${receipt.SchemeName}</span>
            </div>
            ` : ''}
            ${plotNames ? `
            <div class="receipt-info-item" style="grid-column: 1 / -1;">
              <span class="receipt-info-label">Plot Names:</span>
              <span class="receipt-info-value">${plotNames}</span>
            </div>
            ` : ''}
            <div class="receipt-info-item">
              <span class="receipt-info-label">Payment Mode:</span>
              <span class="receipt-info-value">
                <span class="payment-mode-badge">${paymentModeName}</span>
              </span>
            </div>
            <div class="receipt-info-item">
              <span class="receipt-info-label">Payment Date:</span>
              <span class="receipt-info-value">${formatDate(receipt.ReceiptDate)}</span>
            </div>
          </div>
          
          ${emiDetails.length > 0 ? `
          <div style="margin-top: 15px;">
            <table class="emi-table">
              <thead>
                <tr>
                  <th style="width: 5%;">Sr.</th>
                  <th style="width: 12%;">Inst. No.</th>
                  <th style="width: 18%;">Due Date</th>
                  <th style="width: 18%;">EMI Amount</th>
                  <th style="width: 18%;">Paid Amount</th>
                  <th style="width: 18%;">Payment Date</th>
                  <th style="width: 11%; text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${emiDetails.map((emi, index) => `
                  <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td style="font-weight: bold; text-align: center;">#${emi.InstallmentNo || 'N/A'}</td>
                    <td>${emi.DueDate ? formatDate(emi.DueDate) : 'N/A'}</td>
                    <td>${formatCurrency(emi.EMIAmount)}</td>
                    <td style="text-align: right; font-weight: bold; color: #27ae60;">${formatCurrency(emi.PaidAmount)}</td>
                    <td style="text-align: center; font-size: 16px; color: #27ae60; font-weight: bold;">${formatDate(receipt.ReceiptDate)}</td>
                    <td style="text-align: center; color: #27ae60; font-weight: bold;">✓ Paid</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
          
          <div class="total-section">
            <div class="total-left">
              ${receipt.Remark ? `
              <span class="remark-inline">
                <span class="remark-label-inline">Remarks:</span>
                <span class="remark-text">${receipt.Remark}</span>
              </span>
              ` : ''}
            </div>
            <div class="total-right">
              <span class="total-label">Total Amount Received:</span>
              <span class="total-amount">${formatCurrency(receipt.TotalPaidAmount)}</span>
            </div>
          </div>
          
          <div class="receipt-footer">
            <div style="margin-bottom: 3px; font-weight: bold; font-size: 12px; color: #2c3e50; line-height: 1.2;">
              ✓ Thank you for your payment!
            </div>
            <div style="margin-bottom: 2px; font-size: 10px; line-height: 1.2;">
              This receipt is valid proof of payment. Please keep it safe.
            </div>
            <div style="font-size: 9px; color: #95a5a6; margin-top: 3px; padding-top: 3px; border-top: 1px solid #ecf0f1; line-height: 1.2;">
              <strong>${company.CompanyName || "MADHUBAN COLONIZERS"}</strong>
              ${company.CompanyBranchName ? ` - ${company.CompanyBranchName}` : ''}
              <br />
              Authorized Signatory | Generated: ${new Date().toLocaleString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Helper function to get multi print content HTML (only selected EMIs)
  const getMultiPrintContent = async () => {
    if (!state.selectedReceiptId || !state.selectedEMIIds || state.selectedEMIIds.length === 0) {
      return null;
    }
    
    // Ensure EMI data is loaded if not already
    const selectedReceipt = state.ReceiptHArray.find(r => r.ReceiptId === parseInt(state.selectedReceiptId));
    if (selectedReceipt && selectedReceipt.F_VoucherH) {
      if (state.EMIArray.length === 0) {
        await Fn_FillListData(dispatch, setState, "EMIArray", API_URL_EMI + "/TBL.F_VoucherH/" + selectedReceipt.F_VoucherH);
        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Get receipt and company data
    if (!selectedReceipt) return null;
    const company = JSON.parse(sessionStorage.getItem("authUser") || "{}");
    const paymentModeName = getPaymentModeName(selectedReceipt.PaymentMode);
    
    // Get PlotNames from VoucherArray
    const voucherData = state.VoucherArray.find(v => v.Id === parseInt(selectedReceipt.F_VoucherH));
    const plotNames = voucherData?.PlotNames || voucherData?.PlotName || '';
    
    // Convert selectedEMIIds to numbers for comparison
    const selectedEMIIdsAsNumbers = state.selectedEMIIds.map(id => parseInt(id));
    
    // Build EMI details from selected EMIs in state.EMIArray - use PaidAmount and PaidDate directly from EMI objects
    const filteredEMIDetails = [];
    selectedEMIIdsAsNumbers.forEach(emiId => {
      // Find EMI in EMIArray
      const emi = state.EMIArray.find(e => {
        const eId = typeof e.Id === 'string' ? parseInt(e.Id) : e.Id;
        return eId === emiId;
      });
      
      if (emi) {
        // Use PaidAmount and PaidDate directly from EMI object
        filteredEMIDetails.push({
          ...emi,
          PaidAmount: parseFloat(emi.PaidAmount || emi.EMIAmount || 0),
          PaidDate: emi.PaidDate || emi.DueDate || null
        });
      }
    });
    
    // Calculate total for selected EMIs
    const selectedTotal = filteredEMIDetails.reduce((sum, emi) => sum + parseFloat(emi.PaidAmount || 0), 0);
    
    // Generate HTML content for receipt with tables (same structure as getReceiptPrintContent)
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${selectedReceipt.ReceiptNo} - Multi Print</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            padding: 15px;
            background: #fff;
            color: #000;
            font-size: 16px;
          }
          .print-button-container {
            text-align: center;
            margin-bottom: 10px;
          }
          .print-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            cursor: pointer;
            border-radius: 4px;
          }
          .print-button:hover {
            background: #0056b3;
          }
          @media print {
            .print-button-container { display: none; }
            body { padding: 8mm; background: white; }
            @page { size: A4; margin: 8mm; }
          }
          .receipt-header {
            text-align: center;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .receipt-header h1 {
            font-size: 30px;
            font-weight: bold;
            text-transform: uppercase;
            color: #2c3e50;
            margin-bottom: 5px;
          }
          .company-details {
            font-size: 13px;
            line-height: 1.6;
            margin-top: 5px;
            color: #555;
          }
          .receipt-body {
            margin: 15px 0;
          }
          .receipt-title {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            margin: 10px 0;
            text-transform: uppercase;
          }
          .receipt-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 30px;
            margin-bottom: 15px;
          }
          .receipt-info-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            font-size: 19px;
          }
          .receipt-info-label {
            font-weight: bold;
            color: #000;
            margin-right: 8px;
          }
          .receipt-info-value {
            color: #000;
            text-align: right;
          }
          .emi-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 19px;
          }
          .emi-table thead {
            background: transparent;
            color: #000;
          }
          .emi-table th {
            padding: 8px 10px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #ddd;
            background: transparent;
            font-size: 19px;
          }
          .emi-table td {
            padding: 6px 10px;
            border: 1px solid #ddd;
            background: transparent;
            font-size: 19px;
          }
          .emi-table tbody tr:nth-child(even) {
            background: transparent;
          }
          .total-section {
            margin-top: 15px;
            padding: 5px 0;
            border-top: 1px solid #ddd;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .total-left {
            flex: 1;
            text-align: left;
          }
          .total-right {
            flex: 1;
            text-align: right;
          }
          .total-label {
            font-size: 16px;
            font-weight: bold;
            display: inline-block;
            margin-right: 10px;
          }
          .total-amount {
            font-size: 18px;
            font-weight: bold;
            display: inline-block;
          }
          .remark-inline {
            font-size: 15px;
            color: #000;
          }
          .remark-label-inline {
            font-weight: bold;
            margin-right: 5px;
          }
          .payment-mode-badge {
            font-weight: normal;
            font-size: 13px;
            text-transform: uppercase;
          }
          .receipt-footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px dashed #bdc3c7;
            text-align: center;
            color: #555;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="print-button-container">
          <button class="print-button" onclick="window.print()">🖨️ Print Receipt</button>
        </div>
        <div class="receipt-header">
          <h1>${company.CompanyName || "MADHUBAN COLONIZERS"}</h1>
          ${company.CompanyBranchName ? `<h2 style="font-size: 14px; color: #34495e; margin: 2px 0; line-height: 1.1;">${company.CompanyBranchName}</h2>` : ''}
          <div class="company-details">
            ${company.CompanyAddress ? `<div>${company.CompanyAddress}</div>` : ''}
            <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 2px;">
              ${company.CompanyMobileNo ? `<span>📞 ${company.CompanyMobileNo}</span>` : ''}
              ${company.CompanyContactNo ? `<span>📞 ${company.CompanyContactNo}</span>` : ''}
          </div>
            ${company.CompanyRegNo ? `<div style="margin-top: 2px; font-weight: bold;">Reg. No: ${company.CompanyRegNo}</div>` : ''}
        </div>
        </div>
        
        <div class="receipt-body">
          <div class="receipt-title">PAYMENT RECEIPT</div>
          
          <div class="receipt-info-grid">
            <div class="receipt-info-item">
              <span class="receipt-info-label">Receipt No:</span>
              <span class="receipt-info-value">#${selectedReceipt.ReceiptNo}</span>
              </div>
            <div class="receipt-info-item">
              <span class="receipt-info-label">Date:</span>
              <span class="receipt-info-value">${formatDate(selectedReceipt.ReceiptDate)}</span>
              </div>
            ${selectedReceipt.CustomerName ? `
            <div class="receipt-info-item" style="grid-column: 1 / -1;">
              <span class="receipt-info-label">Customer:</span>
              <span class="receipt-info-value">${selectedReceipt.CustomerName}</span>
              </div>
            ` : ''}
            ${selectedReceipt.SchemeName ? `
            <div class="receipt-info-item" style="grid-column: 1 / -1;">
              <span class="receipt-info-label">Scheme:</span>
              <span class="receipt-info-value">${selectedReceipt.SchemeName}</span>
              </div>
            ` : ''}
            ${plotNames ? `
            <div class="receipt-info-item" style="grid-column: 1 / -1;">
              <span class="receipt-info-label">Plot Names:</span>
              <span class="receipt-info-value">${plotNames}</span>
              </div>
            ` : ''}
            <div class="receipt-info-item">
              <span class="receipt-info-label">Payment Mode:</span>
              <span class="receipt-info-value">
                <span class="payment-mode-badge">${paymentModeName}</span>
              </span>
              </div>
            <div class="receipt-info-item">
              <span class="receipt-info-label">Payment Date:</span>
              <span class="receipt-info-value">${formatDate(selectedReceipt.ReceiptDate)}</span>
              </div>
              </div>
          
          ${filteredEMIDetails.length > 0 ? `
          <div style="margin-top: 15px;">
            <table class="emi-table">
              <thead>
                <tr>
                  <th style="width: 5%;">Sr.</th>
                  <th style="width: 12%;">Inst. No.</th>
                  <th style="width: 18%;">Due Date</th>
                  <th style="width: 18%;">EMI Amount</th>
                  <th style="width: 18%;">Paid Amount</th>
                  <th style="width: 18%;">Payment Date</th>
                  <th style="width: 11%; text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredEMIDetails.map((emi, index) => `
                  <tr>
                    <td style="text-align: center;">${index + 1}</td>
                    <td style="font-weight: bold; text-align: center;">#${emi.InstallmentNo || 'N/A'}</td>
                    <td>${emi.DueDate ? formatDate(emi.DueDate) : 'N/A'}</td>
                    <td>${formatCurrency(emi.EMIAmount)}</td>
                    <td style="text-align: right; font-weight: bold; color: #27ae60;">${formatCurrency(emi.PaidAmount)}</td>
                    <td style="text-align: center; font-size: 19px; color: #27ae60; font-weight: bold;">${emi.PaidDate ? formatDate(emi.PaidDate) : (selectedReceipt.ReceiptDate ? formatDate(selectedReceipt.ReceiptDate) : 'N/A')}</td>
                    <td style="text-align: center; color: #27ae60; font-weight: bold;">✓ Paid</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
              </div>
          ` : ''}
          
          <div class="total-section">
            <div class="total-left">
              ${selectedReceipt.Remark ? `
              <span class="remark-inline">
                <span class="remark-label-inline">Remarks:</span>
                <span class="remark-text">${selectedReceipt.Remark}</span>
              </span>
              ` : ''}
            </div>
            <div class="total-right">
              <span class="total-label">Total Amount Received:</span>
              <span class="total-amount">${formatCurrency(selectedTotal)}</span>
              </div>
              </div>
          
          <div class="receipt-footer">
            <div style="margin-bottom: 3px; font-weight: bold; font-size: 12px; color: #2c3e50; line-height: 1.2;">
              ✓ Thank you for your payment!
              </div>
            <div style="margin-bottom: 2px; font-size: 10px; line-height: 1.2;">
              This receipt is valid proof of payment. Please keep it safe.
              </div>
            <div style="font-size: 9px; color: #95a5a6; margin-top: 3px; padding-top: 3px; border-top: 1px solid #ecf0f1; line-height: 1.2;">
              <strong>${company.CompanyName || "MADHUBAN COLONIZERS"}</strong>
              ${company.CompanyBranchName ? ` - ${company.CompanyBranchName}` : ''}
              <br />
              Authorized Signatory | Generated: ${new Date().toLocaleString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
              </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = async () => {
    if (!state.selectedReceiptId) {
      showToastWithCloseButton("warning", "Please select a receipt to print");
      return;
    }
    
    const receiptHTML = await getReceiptPrintContent();
    if (!receiptHTML) {
      showToastWithCloseButton("error", "Unable to load receipt data for printing");
      return;
    }
    
    // Open new window and write HTML
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
    } else {
      showToastWithCloseButton("error", "Please allow popups to print receipt");
    }
  };

  const handleMultiPrint = async () => {
    if (!state.selectedReceiptId) {
      showToastWithCloseButton("warning", "Please select a receipt to print");
      return;
    }
    
    if (!state.selectedEMIIds || state.selectedEMIIds.length === 0) {
      showToastWithCloseButton("warning", "Please select at least one EMI to print");
      return;
    }
    
    const receiptHTML = await getMultiPrintContent();
    if (!receiptHTML) {
      showToastWithCloseButton("error", "Unable to load receipt data for printing");
      return;
    }
    
    // Open new window and write HTML
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
    } else {
      showToastWithCloseButton("error", "Please allow popups to print receipt");
    }
  };

  const handleDownloadPDF = async () => {
    if (!state.selectedReceiptId) {
      showToastWithCloseButton("warning", "Please select a receipt to download");
      return;
    }
    
    const receiptHTML = await getReceiptPrintContent();
    if (!receiptHTML) {
      showToastWithCloseButton("error", "Unable to load receipt data for PDF");
      return;
    }
    
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      // Wait for content to load
      await new Promise(resolve => setTimeout(resolve, 500));
      // Trigger print dialog with PDF option
      printWindow.print();
      showToastWithCloseButton("success", "PDF download initiated!");
    } else {
      showToastWithCloseButton("error", "Please allow popups to download PDF");
    }
  };

  const handleWhatsAppShare = async () => {
    if (!state.selectedReceiptId) {
      showToastWithCloseButton("warning", "Please select a receipt to share");
      return;
    }
    
    try {
      showToastWithCloseButton("info", "Generating PDF...");
      
      const receiptHTML = await getReceiptPrintContent();
      if (!receiptHTML) {
        showToastWithCloseButton("error", "Unable to load receipt data");
        return;
      }
      
      // Create a temporary container for PDF generation
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm'; // A5 width
      tempDiv.innerHTML = receiptHTML;
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
      
      // Get receipt data for message
      const printData = getReceiptPrintData();
      if (!printData) {
        showToastWithCloseButton("error", "Unable to load receipt data");
        return;
      }
      
      const { receipt, emiDetails } = printData;
      const paymentModeName = getPaymentModeName(receipt.PaymentMode);
      const fileName = `Receipt_${receipt.ReceiptNo || 'Receipt'}_${new Date().getTime()}.pdf`;
      
      // Create message
      
      let message = `*Payment Receipt*\n\n`;
      message += `*Receipt No:* #${receipt.ReceiptNo}\n`;
      message += `*Date:* ${formatDate(receipt.ReceiptDate)}\n`;
      if (receipt.CustomerName) message += `*Customer:* ${receipt.CustomerName}\n`;
      if (receipt.SchemeName) message += `*Scheme:* ${receipt.SchemeName}\n`;
      message += `*Payment Mode:* ${paymentModeName}\n`;
      message += `*Total Amount:* ${formatCurrency(receipt.TotalPaidAmount)}\n`;
      message += `\n📎 PDF file is being downloaded. Please attach it to this message.`;
      
      // Try Web Share API first (for mobile devices)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
        try {
          await navigator.share({
            title: `Receipt #${receipt.ReceiptNo}`,
            text: message,
            files: [new File([pdfBlob], fileName, { type: 'application/pdf' })]
          });
          showToastWithCloseButton("success", "Shared via WhatsApp!");
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
        showToastWithCloseButton("success", "PDF downloaded! Opening WhatsApp... Please attach the downloaded PDF file.");
      }, 500);
      
    } catch (error) {
      console.error("Error sharing PDF on WhatsApp:", error);
      showToastWithCloseButton("error", "Error generating PDF. Please try again.");
    }
  };

  const handleDelete = async() => {
    console.log("handleDelete called with id:", state.selectedReceiptId);
    if (!state.selectedReceiptId || state.selectedReceiptId === 0) {
      toast.error("Please select a receipt record to delete");
      return;
    }
    if (window.confirm("Are you sure you want to delete this receipt?")) {
      const deleteUrl = API_WEB_URLS.MASTER + "/0/token/DeleteReceipt/Id/" + state.selectedReceiptId;
      console.log("Calling delete with:", { id: state.selectedReceiptId, deleteUrl });
      const res = await Fn_FillListData(dispatch, setState, "New", deleteUrl);
      console.log("res", res);
      if(res && res.length > 0 && res[0].Id > 0){
        toast.success("Receipt deleted successfully");
        // Reload receipt list
        const obj = JSON.parse(sessionStorage.getItem("authUser") || "{}");
        await Fn_FillListData(dispatch, setState, "ReceiptHArray", API_URL_RECEIPTH + "/Id/" + obj.CompanyId);
        
        // Reset form after successful deletion
        setState((prev) => ({
          ...prev,
          isEditMode: false,
          selectedReceiptId: null,
          formData: {
            F_SchemeMaster: "",
            F_VoucherH: "",
            PaymentMode: "",
            ReceiptNo: "",
            ReceiptDate: new Date().toISOString().split('T')[0],
            TotalPaidAmount: 0,
            Penalty: 0,
            Remark: "",
            PaymentRefNo: "",
            PaymentBankName: "",
            PaymentDate: "",
          },
          VoucherArray: [],
          EMIArray: [],
          selectedEMIs: [],
          selectedEMIIds: [],
          ReceiptLData: "",
        }));
      }else{
        toast.error("Failed to delete receipt");
      }
    }
  };

  const getPaymentModeName = (modeId) => {
    const mode = paymentModeOptions.find(m => m.Id === parseInt(modeId));
    return mode ? mode.Name : "N/A";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      // Extract date part (YYYY-MM-DD) to avoid timezone issues
      const datePart = dateStr.split('T')[0];
      const [year, month, day] = datePart.split('-');
      // Create date in local timezone
      const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return localDate.toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const getReceiptPrintData = () => {
    if (!state.selectedReceiptId) return null;
    const selectedReceipt = state.ReceiptHArray.find(r => r.ReceiptId === parseInt(state.selectedReceiptId));
    if (!selectedReceipt) return null;

    // Get EMI details for the receipt
    const receiptLData = selectedReceipt.ReceiptLData || "";
    const emiDetails = [];
    if (receiptLData) {
      const emiPairs = receiptLData.split('#').filter(pair => pair.trim());
      emiPairs.forEach((pair, index) => {
        const [emiId, amount] = pair.split('~');
        if (emiId) {
          const emi = state.EMIArray.find(e => e.Id === parseInt(emiId));
          if (emi) {
            // Use PaidAmount from EMI object if available, otherwise use amount from ReceiptLData (which is now EMIAmount)
            emiDetails.push({
              ...emi,
              PaidAmount: parseFloat(emi.PaidAmount) || parseFloat(amount) || 0
            });
          } else {
            // If EMI not found in array, still show it with basic info
            // Amount in ReceiptLData is now EMIAmount, but we'll use it as PaidAmount for display
            emiDetails.push({
              Id: parseInt(emiId),
              InstallmentNo: `EMI-${emiId}`,
              DueDate: null,
              EMIAmount: parseFloat(amount) || 0,
              PaidAmount: parseFloat(amount) || 0
            });
          }
        }
      });
    }

    return {
      receipt: selectedReceipt,
      emiDetails: emiDetails,
      company: JSON.parse(sessionStorage.getItem("authUser") || "{}")
    };
  };

  const populateReceiptForm = async (selectedReceipt, setFieldValue) => {
    // Parse ReceiptDate - convert to YYYY-MM-DD format
    // Extract date directly from ISO string to avoid timezone issues
    const receiptDate = selectedReceipt.ReceiptDate 
      ? (selectedReceipt.ReceiptDate.includes('T') 
          ? selectedReceipt.ReceiptDate.split('T')[0] 
          : selectedReceipt.ReceiptDate)
      : new Date().toISOString().split('T')[0];

    // Parse ReceiptLData to get EMI IDs and amounts
    let selectedEMIIds = [];
    let selectedEMIs = [];
    let receiptLData = selectedReceipt.ReceiptLData || "";

    if (receiptLData) {
      console.log("receiptLData--------------->",receiptLData);
      const emiPairs = receiptLData.split('#');
      selectedEMIs = emiPairs.map(pair => {
        const [emiId, amount] = pair.split('~');
        const emiAmount = parseFloat(amount) || 0;
        return {
          F_EMIChart: parseInt(emiId),
          PaidAmount: emiAmount, // Will be updated from EMI object after EMIArray loads
          EMIAmount: emiAmount, // This is what we save in ReceiptLData now
        };
      });
      selectedEMIIds = selectedEMIs.map(emi => String(emi.F_EMIChart));
    }

    console.log("selectedEMIs--------------->",selectedEMIIds);
    console.log("selectedEMIs--------------->",selectedEMIs);
    // Prepare new form data
    const newFormData = {
      F_SchemeMaster: String(selectedReceipt.F_SchemeMaster || ""),
      F_VoucherH: String(selectedReceipt.F_VoucherH || ""),
      PaymentMode: String(selectedReceipt.PaymentMode || ""),
      ReceiptNo: selectedReceipt.ReceiptNo || "",
      ReceiptDate: receiptDate,
      TotalPaidAmount: selectedReceipt.TotalPaidAmount || 0,
      Penalty: selectedReceipt.Penalty || 0,
      Remark: selectedReceipt.Remark || "",
      PaymentRefNo: selectedReceipt.PaymentRefNo || "",
      PaymentBankName: selectedReceipt.PaymentBankName || "",
      PaymentDate: selectedReceipt.PaymentDate 
        ? (selectedReceipt.PaymentDate.includes('T') 
            ? selectedReceipt.PaymentDate.split('T')[0] 
            : selectedReceipt.PaymentDate)
        : "",
    };

    // Update state with receipt data - this will trigger Formik reinitialize
    setState((prev) => ({
      ...prev,
      isEditMode: true,
      selectedReceiptId: selectedReceipt.ReceiptId,
      formData: newFormData,
      selectedEMIs: selectedEMIs,
      selectedEMIIds: selectedEMIIds,
      ReceiptLData: receiptLData,
      VoucherArray: [], // Clear vouchers first
      EMIArray: [], // Clear EMIs first
    }));

    // Also update Formik values directly to ensure they're set immediately
    // This works in conjunction with enableReinitialize
    setFieldValue("F_SchemeMaster", newFormData.F_SchemeMaster);
    setFieldValue("F_VoucherH", newFormData.F_VoucherH);
    setFieldValue("PaymentMode", newFormData.PaymentMode);
    setFieldValue("ReceiptNo", newFormData.ReceiptNo);
    setFieldValue("ReceiptDate", newFormData.ReceiptDate);
    setFieldValue("TotalPaidAmount", newFormData.TotalPaidAmount);
    setFieldValue("Penalty", newFormData.Penalty);
    setFieldValue("Remark", newFormData.Remark);
    setFieldValue("PaymentRefNo", newFormData.PaymentRefNo);
    setFieldValue("PaymentBankName", newFormData.PaymentBankName);
    setFieldValue("PaymentDate", newFormData.PaymentDate);

    // Fetch vouchers for the scheme
    if (selectedReceipt.F_SchemeMaster) {
      await Fn_FillListData(dispatch, setState, "VoucherArray", API_URL_VOUCHER + "/TBL.F_SchemeMaster/" + selectedReceipt.F_SchemeMaster);
      
      // After vouchers are loaded, fetch EMIs for the voucher
      if (selectedReceipt.F_VoucherH) {
        await Fn_FillListData(dispatch, setState, "EMIArray", API_URL_EMI + "/TBL.F_VoucherH/" + selectedReceipt.F_VoucherH);
        
        // Wait a bit for EMIArray to be populated in state, then update selectedEMIIds and PaidAmount
        setTimeout(() => {
          setState((prev) => {
            // Update PaidAmount from EMI objects if available
            const updatedSelectedEMIs = selectedEMIs.map(selectedEmi => {
              const emiObject = prev.EMIArray.find(emi => emi.Id === selectedEmi.F_EMIChart);
              if (emiObject && emiObject.PaidAmount) {
                return {
                  ...selectedEmi,
                  PaidAmount: parseFloat(emiObject.PaidAmount) || selectedEmi.PaidAmount,
                };
              }
              return selectedEmi;
            });
            
            return {
              ...prev,
              selectedEMIIds: selectedEMIIds,
              selectedEMIs: updatedSelectedEMIs,
            };
          });
        }, 500);
      }
    }
  };

  const handleReceiptSelect = async (receiptId, setFieldValue) => {
    if (!receiptId || receiptId === "") {
      // Reset form if no receipt selected
      setState((prev) => ({
        ...prev,
        isEditMode: false,
        selectedReceiptId: null,
        receiptSearchTerm: "",
        formData: {
          F_SchemeMaster: "",
          F_VoucherH: "",
          PaymentMode: "",
          ReceiptNo: "",
          ReceiptDate: new Date().toISOString().split('T')[0],
          TotalPaidAmount: 0,
          Penalty: 0,
          Remark: "",
          PaymentRefNo: "",
          PaymentBankName: "",
          PaymentDate: "",
        },
        VoucherArray: [],
        EMIArray: [],
        selectedEMIs: [],
        selectedEMIIds: [],
        ReceiptLData: "",
      }));
      setFieldValue("F_SchemeMaster", "");
      setFieldValue("F_VoucherH", "");
      setFieldValue("PaymentMode", "");
      setFieldValue("ReceiptNo", "");
      setFieldValue("ReceiptDate", new Date().toISOString().split('T')[0]);
      setFieldValue("TotalPaidAmount", 0);
      setFieldValue("Penalty", 0);
      setFieldValue("Remark", "");
      setFieldValue("PaymentRefNo", "");
      setFieldValue("PaymentBankName", "");
      setFieldValue("PaymentDate", "");
      return;
    }

    // Find selected receipt from ReceiptHArray
    const selectedReceipt = state.ReceiptHArray.find(r => r.ReceiptId == parseInt(receiptId));
    console.log("selectedReceiptHArray--------------->",state.ReceiptHArray);

    console.log("selectedReceipt--------------->",selectedReceipt);
    if (!selectedReceipt) return;

    // Update search term with selected receipt display text
    const datePart = selectedReceipt.ReceiptDate ? selectedReceipt.ReceiptDate.split('T')[0] : '';
    const formattedDate = datePart ? (() => {
      try {
        const [year, month, day] = datePart.split('-');
        const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return localDate.toLocaleDateString('en-IN');
      } catch {
        return 'N/A';
      }
    })() : 'N/A';
    const displayText = `Receipt #${selectedReceipt.ReceiptNo} - ${selectedReceipt.CustomerName || 'N/A'} - ${selectedReceipt.SchemeName || 'N/A'} - ₹${selectedReceipt.TotalPaidAmount?.toFixed(2) || '0.00'} - ${formattedDate}`;
    
    setState((prev) => ({
      ...prev,
      selectedReceiptId: parseInt(receiptId),
      receiptSearchTerm: displayText
    }));

    await populateReceiptForm(selectedReceipt, setFieldValue);
  };

  const handleReceiptUpdate = async (receiptId, setFieldValue, receiptList = []) => {
    const sourceList = Array.isArray(receiptList) && receiptList.length > 0 ? receiptList : state.ReceiptHArray;
    const selectedReceipt = sourceList.find(r => r.ReceiptId == parseInt(receiptId));
    if (!selectedReceipt) return;
    await populateReceiptForm(selectedReceipt, setFieldValue);
  };

  const initialValues = useMemo(() => ({
    F_SchemeMaster: state.formData.F_SchemeMaster || "",
    F_VoucherH: state.formData.F_VoucherH || "",
    PaymentMode: state.formData.PaymentMode || "",
    ReceiptNo: state.formData.ReceiptNo || "",
    ReceiptDate: state.formData.ReceiptDate || new Date().toISOString().split('T')[0],
    TotalPaidAmount: state.formData.TotalPaidAmount || 0,
    Penalty: state.formData.Penalty || 0,
    Remark: state.formData.Remark || "",
    PaymentRefNo: state.formData.PaymentRefNo || "",
    PaymentBankName: state.formData.PaymentBankName || "",
    PaymentDate: state.formData.PaymentDate || "",
  }), [state.formData]);

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
    <div className="page-body">
      <style>{`
        select.btn-square,
        select.btn-square option {
          font-family: inherit !important;
          color: #000000 !important;
        }
        .theme-form input[type="text"],
        .theme-form input[type="number"],
        .theme-form input[type="date"],
        .theme-form textarea {
          color: #000000 !important;
        }
        body.dark-only select.btn-square,
        body.dark-only select.btn-square option {
          color: #ffffff !important;
        }
        body.dark-only .theme-form input[type="text"],
        body.dark-only .theme-form input[type="number"],
        body.dark-only .theme-form input[type="date"],
        body.dark-only .theme-form textarea {
          color: #ffffff !important;
        }
        
        /* Print Receipt Styles */
        .receipt-print-container {
          display: none;
        }
        
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body {
            background: white !important;
          }
          
          .page-body {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .breadcrumb,
          .card-footer,
          .btn,
          button,
          .card,
          .form-group,
          .theme-form,
          .container-fluid,
          .row:not(.receipt-row),
          .col:not(.receipt-col) {
            display: none !important;
          }
          
          .receipt-print-container {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 8px 12px !important;
            background: white !important;
            font-family: 'Arial', 'Helvetica', sans-serif !important;
            color: #000 !important;
            font-size: 13px !important;
          }
          
          .receipt-header {
            text-align: center !important;
            border-bottom: 2px solid #2c3e50 !important;
            padding-bottom: 8px !important;
            margin-bottom: 10px !important;
          }
          
          .receipt-header h1 {
            font-size: 28px !important;
            font-weight: bold !important;
            color: #2c3e50 !important;
            margin: 4px 0 !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
          }
          
          .receipt-header h2 {
            font-size: 16px !important;
            color: #34495e !important;
            margin: 2px 0 !important;
            font-weight: 600 !important;
          }
          
          .company-details {
            font-size: 11px !important;
            color: #555 !important;
            line-height: 1.4 !important;
            margin-top: 4px !important;
          }
          
          .receipt-body {
            margin: 8px 0 !important;
          }
          
          .receipt-info-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
            margin-bottom: 8px !important;
          }
          
          .receipt-info-item {
            display: flex !important;
            justify-content: space-between !important;
            padding: 6px 6px !important;
            background: #f8f9fa !important;
            border-left: 2px solid #3498db !important;
            font-size: 16px !important;
          }
          
          .receipt-info-label {
            font-weight: bold !important;
            color: #2c3e50 !important;
            font-size: 11px !important;
          }
          
          .receipt-info-value {
            color: #34495e !important;
            text-align: right !important;
            font-size: 12px !important;
          }
          
          .emi-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 8px 0 !important;
            font-size: 16px !important;
          }
          
          .emi-table thead {
            background: #2c3e50 !important;
            color: white !important;
          }
          
          .emi-table th {
            padding: 4px 6px !important;
            text-align: left !important;
            font-weight: bold !important;
            font-size: 16px !important;
            border: 1px solid #34495e !important;
          }
          
          .emi-table td {
            padding: 4px 6px !important;
            border: 1px solid #ddd !important;
            font-size: 16px !important;
          }
          
          .emi-table tbody tr:nth-child(even) {
            background: #f8f9fa !important;
          }
          
          .total-section {
            margin-top: 8px !important;
            padding: 8px 12px !important;
            background: #2c3e50 !important;
            color: white !important;
            border-radius: 4px !important;
            text-align: right !important;
          }
          
          .total-label {
            font-size: 13px !important;
            font-weight: bold !important;
            margin-bottom: 4px !important;
          }
          
          .total-amount {
            font-size: 20px !important;
            font-weight: bold !important;
            letter-spacing: 0.5px !important;
          }
          
          .receipt-footer {
            margin-top: 10px !important;
            padding-top: 8px !important;
            border-top: 1px dashed #bdc3c7 !important;
            text-align: center !important;
            color: #555 !important;
            font-size: 11px !important;
          }
          
          .payment-mode-badge {
            display: inline-block !important;
            padding: 2px 8px !important;
            background: #27ae60 !important;
            color: white !important;
            border-radius: 12px !important;
            font-weight: bold !important;
            font-size: 11px !important;
            text-transform: uppercase !important;
          }
          
          .remark-section {
            margin-top: 8px !important;
            padding: 6px 8px !important;
            background: #fff3cd !important;
            border-left: 3px solid #ffc107 !important;
            border-radius: 3px !important;
            font-size: 11px !important;
          }
          
          .remark-label {
            font-weight: bold !important;
            color: #856404 !important;
            margin-bottom: 4px !important;
            font-size: 11px !important;
          }
          
          .remark-text {
            color: #856404 !important;
            font-size: 11px !important;
          }
          
          .receipt-title {
            text-align: center !important;
            font-size: 16px !important;
            font-weight: bold !important;
            color: #2c3e50 !important;
            margin: 6px 0 !important;
            text-transform: uppercase !important;
          }
          
          .payment-date-info {
            font-size: 10px !important;
            color: #27ae60 !important;
            font-weight: bold !important;
          }
          
          @page {
            size: A4 !important;
            margin: 8mm !important;
          }
        }
      `}</style>
      <Breadcrumbs mainTitle="Receipt Entry" parent="Transaction" />
      <Container fluid>
        <Row>
          <Col xs="12">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={(values, { setFieldValue }) => handleSubmit(values, setFieldValue)}
              enableReinitialize
            >
              {({ values, handleChange, handleBlur, errors, touched, setFieldValue }) => (
                <Form className="theme-form">
                  <Card>
                    <CardHeaderCommon
                      title="Receipt Entry Form"
                      tagClass="card-title mb-0"
                    />
                    <CardBody>
                      <Row>
                        <Col md="12">
                          <FormGroup>
                            <Label>
                              Select Receipt to Edit
                            </Label>
                            <div style={{ position: 'relative' }}>
                              <Input
                                type="text"
                                name="selectedReceipt"
                                placeholder="-- Select Receipt (Optional) --"
                                value={state.receiptSearchTerm || (() => {
                                  if (!state.selectedReceiptId) return "";
                                  const selected = state.ReceiptHArray.find(r => r.ReceiptId == state.selectedReceiptId);
                                  if (!selected) return "";
                                  const datePart = selected.ReceiptDate ? selected.ReceiptDate.split('T')[0] : '';
                                  const formattedDate = datePart ? (() => {
                                    try {
                                      const [year, month, day] = datePart.split('-');
                                      const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                      return localDate.toLocaleDateString('en-IN');
                                    } catch {
                                      return 'N/A';
                                    }
                                  })() : 'N/A';
                                  return `Receipt #${selected.ReceiptNo} - ${selected.CustomerName || 'N/A'} - ${selected.SchemeName || 'N/A'} - ₹${selected.TotalPaidAmount?.toFixed(2) || '0.00'} - ${formattedDate}`;
                                })()}
                                onChange={(e) => {
                                  const searchTerm = e.target.value;
                                  setState(prev => ({
                                    ...prev,
                                    receiptSearchTerm: searchTerm,
                                    receiptDropdownOpen: true,
                                    selectedReceiptId: searchTerm === "" ? null : prev.selectedReceiptId
                                  }));
                                }}
                                onFocus={(e) => {
                                  // Select all text when focused
                                  e.target.select();
                                  setState(prev => ({
                                    ...prev,
                                    receiptDropdownOpen: true
                                  }));
                                }}
                                onBlur={() => {
                                  // Delay to allow click on dropdown items
                                  setTimeout(() => {
                                    setState(prev => ({
                                      ...prev,
                                      receiptDropdownOpen: false
                                    }));
                                  }, 200);
                                }}
                                className="btn-square"
                                style={{ fontFamily: 'inherit' }}
                                disabled={state.isSaving}
                              />
                              {state.receiptDropdownOpen && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    backgroundColor: 'white',
                                    border: '1px solid #ced4da',
                                    borderTop: 'none',
                                    borderRadius: '0 0 4px 4px',
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    zIndex: 1000,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                  }}
                                >
                                  <div
                                    style={{
                                      padding: '8px 12px',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #f0f0f0'
                                    }}
                                    onClick={() => {
                                      handleReceiptSelect("", setFieldValue);
                                      setState(prev => ({
                                        ...prev,
                                        receiptSearchTerm: "",
                                        receiptDropdownOpen: false
                                      }));
                                    }}
                                    onMouseDown={(e) => e.preventDefault()}
                                  >
                                    -- Select Receipt (Optional) --
                                  </div>
                                  {state.ReceiptHArray
                                    .filter((item) => {
                                      if (!state.receiptSearchTerm) return true;
                                      const searchLower = state.receiptSearchTerm.toLowerCase();
                                      const datePart = item.ReceiptDate ? item.ReceiptDate.split('T')[0] : '';
                                      const formattedDate = datePart ? (() => {
                                        try {
                                          const [year, month, day] = datePart.split('-');
                                          const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                          return localDate.toLocaleDateString('en-IN');
                                        } catch {
                                          return 'N/A';
                                        }
                                      })() : 'N/A';
                                      const displayText = `Receipt #${item.ReceiptNo} - ${item.CustomerName || 'N/A'} - ${item.SchemeName || 'N/A'} - ₹${item.TotalPaidAmount?.toFixed(2) || '0.00'} - ${formattedDate}`;
                                      return displayText.toLowerCase().includes(searchLower);
                                    })
                                    .map((item) => {
                                      const datePart = item.ReceiptDate ? item.ReceiptDate.split('T')[0] : '';
                                      const formattedDate = datePart ? (() => {
                                        try {
                                          const [year, month, day] = datePart.split('-');
                                          const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                          return localDate.toLocaleDateString('en-IN');
                                        } catch {
                                          return 'N/A';
                                        }
                                      })() : 'N/A';
                                      const displayText = `Receipt #${item.ReceiptNo} - ${item.CustomerName || 'N/A'} - ${item.SchemeName || 'N/A'} - ₹${item.TotalPaidAmount?.toFixed(2) || '0.00'} - ${formattedDate}`;
                                      return (
                                        <div
                                          key={item.ReceiptId}
                                          style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f0f0f0',
                                            backgroundColor: state.selectedReceiptId == item.ReceiptId ? '#e7f3ff' : 'white'
                                          }}
                                          onClick={() => {
                                            handleReceiptSelect(item.ReceiptId.toString(), setFieldValue);
                                            setState(prev => ({
                                              ...prev,
                                              receiptSearchTerm: displayText,
                                              receiptDropdownOpen: false
                                            }));
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = state.selectedReceiptId == item.ReceiptId ? '#e7f3ff' : 'white';
                                          }}
                                          onMouseDown={(e) => e.preventDefault()}
                                        >
                                          {displayText}
                                        </div>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                            {state.isEditMode && (
                              <small className="text-info">
                                <i className="fa fa-edit me-1"></i>Edit Mode: You can now modify the receipt details
                              </small>
                            )}
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Scheme <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="F_SchemeMaster"
                              value={values.F_SchemeMaster}
                              onChange={(e) => handleSchemeChange(e.target.value, setFieldValue)}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              className="btn-square"
                              style={{ fontFamily: 'inherit' }}
                              invalid={touched.F_SchemeMaster && !!errors.F_SchemeMaster}
                              autoFocus
                            >
                              <option value="">Select Scheme</option>
                              {state.SchemeArray.map((item) => (
                                <option key={item.Id} value={item.Id}>
                                  {item.Name}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_SchemeMaster" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Voucher <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="F_VoucherH"
                              value={values.F_VoucherH}
                              onChange={(e) => handleVoucherChange(e.target.value, setFieldValue)}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              className="btn-square"
                              style={{ fontFamily: 'inherit' }}
                              invalid={touched.F_VoucherH && !!errors.F_VoucherH}
                            >
                              <option value="">Select Voucher</option>
                              {state.VoucherArray.map((item) => (
                                <option key={item.Id} value={item.Id}>
                                  {item.LedgerName} - {item.VoucherNo}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="F_VoucherH" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        {state.formData.F_VoucherH && (
                          <>
                            {!state.isEditMode && state.EMIArray.filter(emi => emi.Status === true).length > 0 && (
                              <Col md="12">
                                <FormGroup>
                                  <Label className="text-success">
                                    <i className="fa fa-check-circle me-2"></i>Paid EMIs
                                  </Label>
                                  <div className="border rounded p-3 bg-light">
                                    {state.EMIArray
                                      .filter(emi => emi.Status === true)
                                      .map((item) => {
                                        const formatDate = (dateStr) => {
                                          if (!dateStr) return 'N/A';
                                          try {
                                            // Extract date part (YYYY-MM-DD) to avoid timezone issues
                                            const datePart = dateStr.split('T')[0];
                                            const [year, month, day] = datePart.split('-');
                                            // Create date in local timezone
                                            const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                            return localDate.toLocaleDateString('en-IN', { 
                                              day: '2-digit', 
                                              month: 'short', 
                                              year: 'numeric' 
                                            });
                                          } catch {
                                            return 'N/A';
                                          }
                                        };
                                        
                                        return (
                                          <div key={item.Id} className="mb-2 text-success">
                                            <i className="fa fa-check me-2"></i>
                                            Installment #{item.InstallmentNo} | Amount: ₹{item.EMIAmount?.toFixed(2) || '0.00'} | Due Date: {formatDate(item.DueDate)} | Status: Paid
                                          </div>
                                        );
                                      })}
                                  </div>
                                </FormGroup>
                              </Col>
                            )}
                            <Col md="12">
                              <FormGroup>
                                <Label>
                                  Select EMIs (Multiple Selection) <span className="text-danger">*</span>
                                  {state.isEditMode && (
                                    <small className="text-info ms-2">
                                      <i className="fa fa-info-circle me-1"></i>All EMIs (including paid) are shown for editing
                                    </small>
                                  )}
                                </Label>
                                <Input
                                  type="select"
                                  multiple
                                  className="btn-square"
                                  style={{ fontFamily: 'inherit', minHeight: '200px' }}
                                  onChange={(e) => handleEMISelectChange(e, setFieldValue)}
                                  value={state.selectedEMIIds}
                                >
                                  {state.EMIArray
                                    .filter(item => {
                                      // In edit mode, show all EMIs. Otherwise, only show unpaid EMIs
                                      if (state.isEditMode) {
                                        return true;
                                      }
                                      return item.Status === false || !item.Status;
                                    })
                                    .map((item) => {
                                      const formatDate = (dateStr) => {
                                        if (!dateStr) return 'N/A';
                                        try {
                                          // Extract date part (YYYY-MM-DD) to avoid timezone issues
                                          const datePart = dateStr.split('T')[0];
                                          const [year, month, day] = datePart.split('-');
                                          // Create date in local timezone
                                          const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                          return localDate.toLocaleDateString('en-IN', { 
                                            day: '2-digit', 
                                            month: 'short', 
                                            year: 'numeric' 
                                          });
                                        } catch {
                                          return 'N/A';
                                        }
                                      };
                                      
                                      const isPaid = item.Status === true;
                                      const statusText = isPaid ? 'Paid' : 'Pending';
                                      const statusIcon = isPaid ? '✓' : '';
                                      const totalPenalty = parseFloat(item.TotalPenaltyAmount || 0);
                                      const penaltyText = totalPenalty > 0 ? ` | Penalty: ₹${totalPenalty.toFixed(2)}` : '';
                                      const emiText = `${statusIcon} Installment #${item.InstallmentNo} | Amount: ₹${item.EMIAmount?.toFixed(2) || '0.00'} | Due Date: ${formatDate(item.DueDate)} | ${isPaid ? 'Paid' : `Pending: ₹${item.PendingAmount?.toFixed(2) || '0.00'}`}${penaltyText} | Status: ${statusText}`;
                                      
                                      return (
                                        <option key={item.Id} value={item.Id}>
                                          {emiText}
                                        </option>
                                      );
                                    })}
                                </Input>
                                <small className="text-muted">
                                  Hold Ctrl (Windows) or Cmd (Mac) to select multiple EMIs
                                </small>
                              </FormGroup>
                            </Col>
                          </>
                        )}
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Payment Mode <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="select"
                              name="PaymentMode"
                              value={values.PaymentMode}
                              onChange={(e) => handleCommonChange("PaymentMode", e.target.value, handleChange, setFieldValue)}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              className="btn-square"
                              style={{ fontFamily: 'inherit' }}
                              invalid={touched.PaymentMode && !!errors.PaymentMode}
                            >
                              <option value="">Select Payment Mode</option>
                              {paymentModeOptions.map((item) => (
                                <option key={item.Id} value={item.Id}>
                                  {item.Name}
                                </option>
                              ))}
                            </Input>
                            <ErrorMessage name="PaymentMode" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        {shouldShowPaymentFields(values.PaymentMode) && (() => {
                          const labels = getPaymentFieldLabels(values.PaymentMode);
                          return (
                            <>
                              <Col md="4">
                                <FormGroup>
                                  <Label>
                                    {labels.refLabel}
                                  </Label>
                                  <Input
                                    type="text"
                                    name="PaymentRefNo"
                                    placeholder={`Enter ${labels.refLabel}`}
                                    value={values.PaymentRefNo}
                                    onChange={(e) => handleCommonChange("PaymentRefNo", e.target.value, handleChange, setFieldValue)}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                  />
                                </FormGroup>
                              </Col>
                              <Col md="4">
                                <FormGroup>
                                  <Label>
                                    {labels.bankLabel}
                                  </Label>
                                  <Input
                                    type="text"
                                    name="PaymentBankName"
                                    placeholder={`Enter ${labels.bankLabel}`}
                                    value={values.PaymentBankName}
                                    onChange={(e) => handleCommonChange("PaymentBankName", e.target.value, handleChange, setFieldValue)}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                  />
                                </FormGroup>
                              </Col>
                              <Col md="4">
                                <FormGroup>
                                  <Label>
                                    {labels.dateLabel}
                                  </Label>
                                  <Input
                                    type="date"
                                    name="PaymentDate"
                                    value={values.PaymentDate}
                                    onChange={(e) => handleCommonChange("PaymentDate", e.target.value, handleChange, setFieldValue)}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                  />
                                </FormGroup>
                              </Col>
                            </>
                          );
                        })()}
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Receipt No <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="number"
                              name="ReceiptNo"
                              placeholder="Enter receipt number"
                              value={values.ReceiptNo}
                              onChange={(e) => handleCommonChange("ReceiptNo", e.target.value, handleChange, setFieldValue)}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              invalid={touched.ReceiptNo && !!errors.ReceiptNo}
                              disabled
                            />
                            <ErrorMessage name="ReceiptNo" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="6">
                          <FormGroup>
                            <Label>
                              Receipt Date <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="date"
                              name="ReceiptDate"
                              value={values.ReceiptDate}
                              onChange={(e) => handleCommonChange("ReceiptDate", e.target.value, handleChange, setFieldValue)}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              invalid={touched.ReceiptDate && !!errors.ReceiptDate}
                            />
                            <ErrorMessage name="ReceiptDate" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="4">
                          <FormGroup>
                            <Label>
                              Penalty
                            </Label>
                            <Input
                              type="number"
                              name="Penalty"
                              placeholder="Enter penalty amount"
                              value={values.Penalty}
                              onChange={(e) => {
                                const penaltyValue = parseFloat(e.target.value) || 0;
                                handleCommonChange("Penalty", penaltyValue, handleChange, setFieldValue);
                                
                                // Recalculate TotalPaidAmount when Penalty changes
                                const emiTotal = state.selectedEMIs.reduce((sum, item) => sum + parseFloat(item.PaidAmount || 0), 0);
                                const newTotal = emiTotal + penaltyValue;
                                setState((prev) => ({
                                  ...prev,
                                  formData: {
                                    ...prev.formData,
                                    Penalty: penaltyValue,
                                    TotalPaidAmount: newTotal,
                                  },
                                }));
                                setFieldValue("TotalPaidAmount", newTotal);
                              }}
                              onBlur={handleBlur}
                              invalid={touched.Penalty && !!errors.Penalty}
                            />
                            <ErrorMessage name="Penalty" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="4">
                          <FormGroup>
                            <Label>
                              Total Paid Amount <span className="text-danger">*</span>
                            </Label>
                            <Input
                              type="number"
                              name="TotalPaidAmount"
                              placeholder="Total amount"
                              value={values.TotalPaidAmount}
                              onChange={(e) => handleCommonChange("TotalPaidAmount", e.target.value, handleChange, setFieldValue)}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              invalid={touched.TotalPaidAmount && !!errors.TotalPaidAmount}
                            />
                            <ErrorMessage name="TotalPaidAmount" component="div" className="text-danger small" />
                          </FormGroup>
                        </Col>
                        <Col md="4">
                          <FormGroup>
                            <Label>Remark</Label>
                            <Input
                              type="textarea"
                              name="Remark"
                              placeholder="Enter remark"
                              value={values.Remark}
                              onChange={(e) => handleCommonChange("Remark", e.target.value, handleChange, setFieldValue)}
                              onBlur={handleBlur}
                              onKeyDown={handleKeyDown}
                              rows={3}
                            />
                          </FormGroup>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter className="text-end">
                      <Btn
                        color="secondary"
                        type="button"
                        className="me-2"
                        onClick={() => handleCancel(setFieldValue)}
                        disabled={state.isSaving}
                      >
                        Cancel
                      </Btn>
                      {state.isEditMode && (
                        <Btn
                          color="success"
                          type="button"
                          className="me-2"
                          onClick={() => handleAddNew(setFieldValue)}
                          disabled={state.isSaving}
                        >
                          <i className="fa fa-plus me-1"></i>Add New
                        </Btn>
                      )}
                      {state.isEditMode && state.selectedReceiptId && (
                        <>
                          <Btn
                            color="info"
                            type="button"
                            className="me-2"
                            onClick={handlePrint}
                            disabled={state.isSaving}
                          >
                            <i className="fa fa-print me-1"></i>Print Receipt
                          </Btn>
                          <Btn
                            color="warning"
                            type="button"
                            className="me-2"
                            onClick={handleMultiPrint}
                            disabled={state.isSaving || !state.selectedEMIIds || state.selectedEMIIds.length === 0}
                            title={!state.selectedEMIIds || state.selectedEMIIds.length === 0 ? "Please select EMIs from the dropdown above" : `Print ${state.selectedEMIIds.length} selected EMI(s)`}
                          >
                            <i className="fa fa-print me-1"></i>Multi Print ({state.selectedEMIIds?.length || 0})
                          </Btn>
                          <Btn
                            color="success"
                            type="button"
                            className="me-2"
                            onClick={handleDownloadPDF}
                            disabled={state.isSaving}
                          >
                            <i className="fa fa-download me-1"></i>PDF
                          </Btn>
                          <Btn
                            color="success"
                            type="button"
                            className="me-2"
                            onClick={handleWhatsAppShare}
                            style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                            disabled={state.isSaving}
                          >
                            <i className="fa fa-whatsapp me-1"></i>WhatsApp
                          </Btn>
                          <Btn
                            color="danger"
                            type="button"
                            className="me-2"
                            onClick={handleDelete}
                            disabled={state.isSaving}
                          >
                            <i className="fa fa-trash me-1"></i>Delete
                          </Btn>
                        </>
                      )}
                      {state.isEditMode && (
                        <Btn color="primary" type="submit" disabled={state.isSaving}>
                          {state.isSaving ? "Updating..." : "Update Receipt"}
                        </Btn>
                      )}
                      {!state.isEditMode && (
                        <Btn color="primary" type="submit" disabled={state.isSaving}>
                          {state.isSaving ? "Saving..." : "Submit Receipt"}
                        </Btn>
                      )}
                    </CardFooter>
                  </Card>
                </Form>
              )}
            </Formik>
          </Col>
        </Row>
      </Container>
      
      {/* Print Receipt Section - Hidden, only used for data reference */}
      {false && (() => {
        const printData = getReceiptPrintData();
        if (!printData) return null;
        
        const { receipt, emiDetails, company } = printData;
        const paymentModeName = getPaymentModeName(receipt.PaymentMode);
        
        return (
          <div className="receipt-print-container">
            <div className="receipt-header">
              <h1>{company.CompanyName || "MADHUBAN COLONIZERS"}</h1>
              {company.CompanyBranchName && (
                <h2>{company.CompanyBranchName}</h2>
              )}
              <div className="company-details">
                {company.CompanyAddress && (
                  <div>{company.CompanyAddress}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '2px' }}>
                  {company.CompanyMobileNo && (
                    <span>📞 {company.CompanyMobileNo}</span>
                  )}
                  {company.CompanyContactNo && (
                    <span>📞 {company.CompanyContactNo}</span>
                  )}
                </div>
                {company.CompanyRegNo && (
                  <div style={{ marginTop: '2px', fontWeight: 'bold' }}>
                    Reg. No: {company.CompanyRegNo}
                  </div>
                )}
              </div>
            </div>
            
            <div className="receipt-body">
              <div className="receipt-title">PAYMENT RECEIPT</div>
              
              <div className="receipt-info-grid">
                <div className="receipt-info-item">
                  <span className="receipt-info-label">Receipt No:</span>
                  <span className="receipt-info-value" style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                    #{receipt.ReceiptNo}
                  </span>
                </div>
                <div className="receipt-info-item">
                  <span className="receipt-info-label">Date:</span>
                  <span className="receipt-info-value">{formatDate(receipt.ReceiptDate)}</span>
                </div>
                {receipt.CustomerName && (
                  <div className="receipt-info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="receipt-info-label">Customer:</span>
                    <span className="receipt-info-value" style={{ fontWeight: 'bold' }}>
                      {receipt.CustomerName}
                    </span>
                  </div>
                )}
                {receipt.SchemeName && (
                  <div className="receipt-info-item" style={{ gridColumn: '1 / -1' }}>
                    <span className="receipt-info-label">Scheme:</span>
                    <span className="receipt-info-value">{receipt.SchemeName}</span>
                  </div>
                )}
                <div className="receipt-info-item">
                  <span className="receipt-info-label">Payment Mode:</span>
                  <span className="receipt-info-value">
                    <span className="payment-mode-badge">{paymentModeName}</span>
                  </span>
                </div>
                <div className="receipt-info-item">
                  <span className="receipt-info-label">Payment Date:</span>
                  <span className="receipt-info-value payment-date-info">{formatDate(receipt.ReceiptDate)}</span>
                </div>
              </div>
              
              {emiDetails.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '4px', padding: '4px', background: '#e8f4f8', borderLeft: '3px solid #3498db' }}>
                    📋 EMI PAYMENT DETAILS - {emiDetails.length} Installment{emiDetails.length > 1 ? 's' : ''} Paid
                  </div>
                  <table className="emi-table">
                    <thead>
                      <tr>
                        <th style={{ width: '6%' }}>Sr.</th>
                        <th style={{ width: '12%' }}>Inst. No.</th>
                        <th style={{ width: '18%' }}>Due Date</th>
                        <th style={{ width: '18%' }}>EMI Amount</th>
                        <th style={{ width: '18%' }}>Paid Amount</th>
                        <th style={{ width: '18%' }}>Payment Date</th>
                        <th style={{ width: '10%', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emiDetails.map((emi, index) => (
                        <tr key={emi.Id || index}>
                          <td style={{ textAlign: 'center' }}>{index + 1}</td>
                          <td style={{ fontWeight: 'bold', textAlign: 'center' }}>#{emi.InstallmentNo || 'N/A'}</td>
                          <td>{emi.DueDate ? formatDate(emi.DueDate) : 'N/A'}</td>
                          <td>{formatCurrency(emi.EMIAmount)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#27ae60' }}>
                            {formatCurrency(emi.PaidAmount)}
                          </td>
                          <td style={{ textAlign: 'center', fontSize: '8px', color: '#27ae60', fontWeight: 'bold' }}>
                            {formatDate(receipt.ReceiptDate)}
                          </td>
                          <td style={{ textAlign: 'center', color: '#27ae60', fontWeight: 'bold' }}>✓ Paid</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="total-section">
                <div className="total-label">Total Amount Received</div>
                <div className="total-amount">{formatCurrency(receipt.TotalPaidAmount)}</div>
              </div>
              
              {receipt.Remark && (
                <div className="remark-section">
                  <div className="remark-label">Remarks:</div>
                  <div className="remark-text">{receipt.Remark}</div>
                </div>
              )}
              
              <div className="receipt-footer">
                <div style={{ marginBottom: '6px', fontWeight: 'bold', fontSize: '10px', color: '#2c3e50' }}>
                  ✓ Thank you for your payment!
                </div>
                <div style={{ marginBottom: '4px', fontSize: '8px' }}>
                  This receipt is valid proof of payment. Please keep it safe.
                </div>
                <div style={{ fontSize: '8px', color: '#95a5a6', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #ecf0f1' }}>
                  <strong>{company.CompanyName || "MADHUBAN COLONIZERS"}</strong>
                  {company.CompanyBranchName && ` - ${company.CompanyBranchName}`}
                  <br />
                  Authorized Signatory | Generated: {new Date().toLocaleString('en-IN', { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      
      {/* Loading Overlay */}
      {state.isSaving && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          flexDirection: 'column'
        }}>
          <div className="spinner-border text-light" role="status" style={{ width: '4rem', height: '4rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="text-light mt-3">Saving Receipt...</h4>
          <p className="text-light">Please wait, do not close or refresh this page</p>
        </div>
      )}
    </div>
  );
};

export default ReceiptEntryForm;
