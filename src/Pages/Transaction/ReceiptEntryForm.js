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

const API_URL_RECEIPTH = API_WEB_URLS.MASTER + "/0/token/ReceiptH";
const API_URL_RECEIPTNO = API_WEB_URLS.MASTER + "/0/token/NextReceiptNo";


const API_URL_SCHEME = API_WEB_URLS.MASTER + "/0/token/SchemeMaster";
const API_URL_VOUCHER = API_WEB_URLS.MASTER + "/0/token/VoucherH";
const API_URL_EMI = API_WEB_URLS.MASTER + "/0/token/EMIChart";
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
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const fetchData = async () => {
    const obj = JSON.parse(localStorage.getItem("authUser") || "{}");
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
    // Reset form to initial state
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

    // Reset Formik values
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
    // Update formData in state
    setState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        F_SchemeMaster: schemeId,
        F_VoucherH: "", // Reset voucher when scheme changes
      },
      VoucherArray: [], // Clear voucher array
      EMIArray: [], // Clear EMI array
      selectedEMIs: [], // Clear selected EMIs
      selectedEMIIds: [], // Clear selected EMI IDs
      ReceiptLData: "", // Clear receipt line data
    }));

    // Update Formik value
    setFieldValue("F_SchemeMaster", schemeId);
    setFieldValue("F_VoucherH", "");
    setFieldValue("TotalPaidAmount", 0);

    // Fetch vouchers based on selected scheme
    if (schemeId) {
    const res = await Fn_FillListData(dispatch, setState, "VoucherArray", API_URL_VOUCHER + "/TBL.F_SchemeMaster/" + schemeId);
    console.log(res);
    }
  };

  const handleVoucherChange = async (voucherId, setFieldValue) => {
    // Update formData in state
    setState((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        F_VoucherH: voucherId,
      },
      EMIArray: [], // Clear EMI array
      selectedEMIs: [], // Clear selected EMIs
      selectedEMIIds: [], // Clear selected EMI IDs
      ReceiptLData: "", // Clear receipt line data
    }));

    // Update Formik value
    setFieldValue("F_VoucherH", voucherId);
    setFieldValue("TotalPaidAmount", 0);

    // Fetch EMIs based on selected voucher
    if (voucherId) {
      await Fn_FillListData(dispatch, setState, "EMIArray", API_URL_EMI + "/TBL.F_VoucherH/" + voucherId);
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
          TotalPaidAmount: 0,
          Remark: autoRemark || "",
        },
      }));
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
        };
      });

    const receiptLData = generateReceiptLData(selectedEMIs);
    // Sum of PaidAmount from selected EMIs
    const emiTotal = selectedEMIs.reduce((sum, item) => sum + parseFloat(item.PaidAmount || 0), 0);
    const penalty = parseFloat(state.formData.Penalty) || 0;
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
        TotalPaidAmount: totalAmount,
        Remark: autoRemark || prev.formData.Remark,
      },
    }));

    setFieldValue("TotalPaidAmount", totalAmount);
    if (autoRemark) {
      setFieldValue("Remark", autoRemark);
    }
  };

  const generateReceiptLData = (emis) => {
    return emis.map((emi) => `${emi.F_EMIChart}~${emi.PaidAmount}`).join("#");
  };

  const handleSubmit = async (values, setFieldValue) => {
    const obj = JSON.parse(localStorage.getItem("authUser") || "{}");
    
    const formData = new FormData();
    console.log(state.ReceiptLData);
    formData.append("F_SchemeMaster", state.formData.F_SchemeMaster);
    formData.append("F_CompanyMaster", obj.CompanyId || "");
    formData.append("F_VoucherH", state.formData.F_VoucherH);
    formData.append("PaymentMode", state.formData.PaymentMode);
    formData.append("ReceiptNo", state.formData.ReceiptNo);
    formData.append("ReceiptDate", state.formData.ReceiptDate);
    formData.append("TotalPaidAmount", state.formData.TotalPaidAmount);
    formData.append("Penalty", state.formData.Penalty || 0);
    formData.append("Remark", state.formData.Remark);
    formData.append("PaymentRefNo", state.formData.PaymentRefNo || "");
    formData.append("PaymentBankName", state.formData.PaymentBankName || "");
    formData.append("PaymentDate", state.formData.PaymentDate || "");
    formData.append("ReceiptLData", state.ReceiptLData);
    formData.append("UserId", obj.Id || obj.id || "");
    
    const receiptId = state.isEditMode ? state.selectedReceiptId : 0;
    if (receiptId) {
      formData.append("ReceiptId", receiptId);
    }
  
    try {
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
    const res =    await Fn_FillListData(dispatch, setState, "ReceiptHArray", API_URL_RECEIPTH + "/Id/0");
  
  
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
    }
  };

  const handlePrint = async () => {
    if (!state.selectedReceiptId) {
      showToastWithCloseButton("warning", "Please select a receipt to print");
      return;
    }
    
    // Ensure EMI data is loaded if not already
    const selectedReceipt = state.ReceiptHArray.find(r => r.ReceiptId === parseInt(state.selectedReceiptId));
    if (selectedReceipt && selectedReceipt.F_VoucherH && state.EMIArray.length === 0) {
      await Fn_FillListData(dispatch, setState, "EMIArray", API_URL_EMI + "/TBL.F_VoucherH/" + selectedReceipt.F_VoucherH);
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    window.print();
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
        const obj = JSON.parse(localStorage.getItem("authUser") || "{}");
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
      return new Date(dateStr).toLocaleDateString('en-IN', { 
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
            emiDetails.push({
              ...emi,
              PaidAmount: parseFloat(amount) || 0
            });
          } else {
            // If EMI not found in array, still show it with basic info
            emiDetails.push({
              Id: parseInt(emiId),
              InstallmentNo: `EMI-${emiId}`,
              DueDate: null,
              EMIAmount: 0,
              PaidAmount: parseFloat(amount) || 0
            });
          }
        }
      });
    }

    return {
      receipt: selectedReceipt,
      emiDetails: emiDetails,
      company: JSON.parse(localStorage.getItem("authUser") || "{}")
    };
  };

  const populateReceiptForm = async (selectedReceipt, setFieldValue) => {
    // Parse ReceiptDate - convert to YYYY-MM-DD format
    const receiptDate = selectedReceipt.ReceiptDate 
      ? new Date(selectedReceipt.ReceiptDate).toISOString().split('T')[0]
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
        return {
          F_EMIChart: parseInt(emiId),
          PaidAmount: parseFloat(amount) || 0,
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
      PaymentDate: selectedReceipt.PaymentDate ? new Date(selectedReceipt.PaymentDate).toISOString().split('T')[0] : "",
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
        
        // Wait a bit for EMIArray to be populated in state, then update selectedEMIIds
        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            selectedEMIIds: selectedEMIIds,
            selectedEMIs: selectedEMIs,
          }));
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
            font-size: 11px !important;
          }
          
          .receipt-header {
            text-align: center !important;
            border-bottom: 2px solid #2c3e50 !important;
            padding-bottom: 8px !important;
            margin-bottom: 10px !important;
          }
          
          .receipt-header h1 {
            font-size: 18px !important;
            font-weight: bold !important;
            color: #2c3e50 !important;
            margin: 4px 0 !important;
            text-transform: uppercase !important;
            letter-spacing: 1px !important;
          }
          
          .receipt-header h2 {
            font-size: 14px !important;
            color: #34495e !important;
            margin: 2px 0 !important;
            font-weight: 600 !important;
          }
          
          .company-details {
            font-size: 9px !important;
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
            gap: 6px !important;
            margin-bottom: 8px !important;
          }
          
          .receipt-info-item {
            display: flex !important;
            justify-content: space-between !important;
            padding: 4px 6px !important;
            background: #f8f9fa !important;
            border-left: 2px solid #3498db !important;
            font-size: 10px !important;
          }
          
          .receipt-info-label {
            font-weight: bold !important;
            color: #2c3e50 !important;
            font-size: 9px !important;
          }
          
          .receipt-info-value {
            color: #34495e !important;
            text-align: right !important;
            font-size: 10px !important;
          }
          
          .emi-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 8px 0 !important;
            font-size: 9px !important;
          }
          
          .emi-table thead {
            background: #2c3e50 !important;
            color: white !important;
          }
          
          .emi-table th {
            padding: 4px 6px !important;
            text-align: left !important;
            font-weight: bold !important;
            font-size: 9px !important;
            border: 1px solid #34495e !important;
          }
          
          .emi-table td {
            padding: 4px 6px !important;
            border: 1px solid #ddd !important;
            font-size: 9px !important;
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
            font-size: 11px !important;
            font-weight: bold !important;
            margin-bottom: 4px !important;
          }
          
          .total-amount {
            font-size: 18px !important;
            font-weight: bold !important;
            letter-spacing: 0.5px !important;
          }
          
          .receipt-footer {
            margin-top: 10px !important;
            padding-top: 8px !important;
            border-top: 1px dashed #bdc3c7 !important;
            text-align: center !important;
            color: #555 !important;
            font-size: 9px !important;
          }
          
          .payment-mode-badge {
            display: inline-block !important;
            padding: 2px 8px !important;
            background: #27ae60 !important;
            color: white !important;
            border-radius: 12px !important;
            font-weight: bold !important;
            font-size: 9px !important;
            text-transform: uppercase !important;
          }
          
          .remark-section {
            margin-top: 8px !important;
            padding: 6px 8px !important;
            background: #fff3cd !important;
            border-left: 3px solid #ffc107 !important;
            border-radius: 3px !important;
            font-size: 9px !important;
          }
          
          .remark-label {
            font-weight: bold !important;
            color: #856404 !important;
            margin-bottom: 4px !important;
            font-size: 9px !important;
          }
          
          .remark-text {
            color: #856404 !important;
            font-size: 9px !important;
          }
          
          .receipt-title {
            text-align: center !important;
            font-size: 14px !important;
            font-weight: bold !important;
            color: #2c3e50 !important;
            margin: 6px 0 !important;
            text-transform: uppercase !important;
          }
          
          .payment-date-info {
            font-size: 8px !important;
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
                            <Input
                              type="select"
                              name="selectedReceipt"
                              value={state.selectedReceiptId || ""}
                              onChange={(e) => handleReceiptSelect(e.target.value, setFieldValue)}
                              className="btn-square"
                              style={{ fontFamily: 'inherit' }}
                            >
                              <option value="">-- Select Receipt (Optional) --</option>
                              {state.ReceiptHArray.map((item) => (
                                <option key={item.ReceiptId} value={item.ReceiptId}>
                                  Receipt #{item.ReceiptNo} - {item.CustomerName || 'N/A'} - {item.SchemeName || 'N/A'} - ₹{item.TotalPaidAmount?.toFixed(2) || '0.00'} - {item.ReceiptDate ? new Date(item.ReceiptDate).toLocaleDateString('en-IN') : 'N/A'}
                                </option>
                              ))}
                            </Input>
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
                                            return new Date(dateStr).toLocaleDateString('en-IN', { 
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
                                          return new Date(dateStr).toLocaleDateString('en-IN', { 
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
                                      const emiText = `${statusIcon} Installment #${item.InstallmentNo} | Amount: ₹${item.EMIAmount?.toFixed(2) || '0.00'} | Due Date: ${formatDate(item.DueDate)} | ${isPaid ? 'Paid' : `Pending: ₹${item.PendingAmount?.toFixed(2) || '0.00'}`} | Status: ${statusText}`;
                                      
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
                              invalid={touched.TotalPaidAmount && !!errors.TotalPaidAmount}
                              readOnly
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
                        onClick={() => navigate("/receiptEntry")}
                      >
                        Cancel
                      </Btn>
                      {state.isEditMode && (
                        <Btn
                          color="success"
                          type="button"
                          className="me-2"
                          onClick={() => handleAddNew(setFieldValue)}
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
                          >
                            <i className="fa fa-print me-1"></i>Print Receipt
                          </Btn>
                          <Btn
                            color="danger"
                            type="button"
                            className="me-2"
                            onClick={handleDelete}
                          >
                            <i className="fa fa-trash me-1"></i>Delete
                          </Btn>
                        </>
                      )}
                      <Btn color="primary" type="submit">
                        {state.isEditMode ? "Update Receipt" : "Submit Receipt"}
                      </Btn>
                    </CardFooter>
                  </Card>
                </Form>
              )}
            </Formik>
          </Col>
        </Row>
      </Container>
      
      {/* Print Receipt Section */}
      {(() => {
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
                  <div style={{ fontSize: '9px', marginTop: '4px', padding: '4px', background: '#f0f0f0', textAlign: 'right' }}>
                    <strong>Total EMIs Paid: {emiDetails.length} | </strong>
                    <strong>Total Amount: {formatCurrency(receipt.TotalPaidAmount)}</strong>
                  </div>
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
    </div>
  );
};

export default ReceiptEntryForm;
