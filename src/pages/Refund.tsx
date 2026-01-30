import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight, FileText, Printer, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import html2pdf from "html2pdf.js";

type Emirate = 'Dubai'|'Sharjah'|'Ajman'|'Umm Al Quwain'|'Ras Al Khaimah'|'Fujairah'|'Abu Dhabi';
type Nationality = 'Philippines'|'Indonesia'|'Ethiopia'|'Uganda'|'Kenya'|'Myanmar'|'India'|'Other';
type Location = 'Inside Country'|'Outside Country';
type YesNo = 'Yes'|'No';
type Stage = 'None'|'OEC Issued'|'Contract Attested'|'Medical Done';
type Reason = '— Not applicable / <= 6 months —'|'Client does not need her'|'Runaway'|'Refused to work (no reason)'|'Medically Unfit'|'Maid Backed Out'|'Client Cancelled'|'Medical Failed outside country'|'Late Delivery'|'Maid want to travel to home country'|'Maid wants to work outside home/domestic'|'Maid Abused Family'|'Family Accused of Mistreatment'|'Food/Shelter/Basics Claim'|'Other';
type AbscondClassification = ''|'NON_INSURED'|'INSURED'|'AGENT_COVERED';

interface FormData {
  // Step 1
  preparedBy: string;
  contractNo: string;
  clientName: string;
  clientMobile: string;
  emirate: Emirate;
  workerName: string;
  nationality: Nationality;
  salaryAED: string;
  priceInclVAT: string;
  vatPercent: string;

  // Step 2
  location: Location;
  directHire: YesNo;
  failBring: YesNo;
  atFault: YesNo;
  enoughTime: YesNo;
  stage: Stage;
  cashAssistanceAED: string;
  govVisaAED: string;
  reason: Reason;
  otherReason: string;
  medicalVisaCostAED: string;

  // Step 3
  deliveredDate: Date | undefined;
  returnedDate: Date | undefined;
  docPhone: YesNo;
  docPassport: YesNo;
  docCancel: YesNo;
  abuDhabiInsuranceCancelled: YesNo;
  abscondReport: YesNo;
  abscondDate: Date | undefined;
  unpaidSalaryDays: string;
  additionalDeductionAmount: string;
  additionalDeductionDescription: string;

  // Step 4
  visaVpaDone: YesNo;
  optionB: YesNo;
  standardTadbeerFeesAED: string;
  
  // Abscond Classification (for Runaway cases)
  abscondClassification: AbscondClassification;
  insuranceProvider: string;
}

interface CVWorker {
  id: string;
  name: string;
  nationality_code: string;
  salary: number | null;
}

interface Client {
  id: string;
  client_name: string;
  mobile_number: string;
  email: string | null;
  emirate: string | null;
  nationality_code: string | null;
  lead_id: string | null;
}

const Refund = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin } = useAdminCheck();
  const [currentStep, setCurrentStep] = useState(1);
  const [authorizedUsers, setAuthorizedUsers] = useState<Array<{ id: string; full_name: string }>>([]);
  const [cvWorkers, setCVWorkers] = useState<CVWorker[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [workerSearch, setWorkerSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [linkedDealId, setLinkedDealId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    preparedBy: '',
    contractNo: '',
    clientName: '',
    clientMobile: '',
    emirate: 'Dubai',
    workerName: '',
    nationality: 'Philippines',
    salaryAED: '',
    priceInclVAT: '',
    vatPercent: '5',
    location: 'Inside Country',
    directHire: 'No',
    failBring: 'No',
    atFault: 'No',
    enoughTime: 'Yes',
    stage: 'None',
    cashAssistanceAED: '0',
    govVisaAED: '0',
    reason: '— Not applicable / <= 6 months —',
    otherReason: '',
    medicalVisaCostAED: '0',
    deliveredDate: undefined,
    returnedDate: undefined,
    docPhone: 'No',
    docPassport: 'No',
    docCancel: 'No',
    abuDhabiInsuranceCancelled: 'No',
    abscondReport: 'No',
    abscondDate: undefined,
    unpaidSalaryDays: '0',
    additionalDeductionAmount: '0',
    additionalDeductionDescription: '',
    visaVpaDone: 'No',
    optionB: 'No',
    standardTadbeerFeesAED: '0',
    abscondClassification: '',
    insuranceProvider: '',
  });

  // Pre-fill form from URL params (when coming from a deal)
  useEffect(() => {
    const dealId = searchParams.get('deal_id');
    const contractNo = searchParams.get('contract_no');
    const clientName = searchParams.get('client_name');
    const clientPhone = searchParams.get('client_phone');
    const workerName = searchParams.get('worker_name');
    const totalAmount = searchParams.get('total_amount');

    if (dealId) {
      setLinkedDealId(dealId);
    }

    if (contractNo || clientName || clientPhone || workerName || totalAmount) {
      setFormData(prev => ({
        ...prev,
        contractNo: contractNo || prev.contractNo,
        clientName: clientName || prev.clientName,
        clientMobile: clientPhone || prev.clientMobile,
        workerName: workerName || prev.workerName,
        priceInclVAT: totalAmount || prev.priceInclVAT,
      }));

      toast({
        title: "Deal linked",
        description: `Pre-filled from deal ${contractNo}`,
      });
    }
  }, [searchParams]);

  // Load users with refund.create permission
  useEffect(() => {
    const loadAuthorizedUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, permissions')
        .not('full_name', 'is', null);

      if (!error && data) {
        // Filter users who have refund.create permission
        const refundUsers = data.filter(user => 
          user.permissions && 
          typeof user.permissions === 'object' &&
          'refund' in user.permissions &&
          (user.permissions as any).refund?.create === true
        );
        setAuthorizedUsers(refundUsers as Array<{ id: string; full_name: string }>);
      }
    };

    loadAuthorizedUsers();
  }, []);

  // Load CV Wizard workers
  useEffect(() => {
    const loadWorkers = async () => {
      const { data, error } = await supabase
        .from('workers')
        .select('id, name, nationality_code, salary')
        .order('name');

      if (!error && data) {
        setCVWorkers(data as CVWorker[]);
      }
    };

    loadWorkers();
  }, []);

  // Load clients (from submissions with complete data)
  useEffect(() => {
    const loadClients = async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setClients(data as Client[]);
      }
    };

    loadClients();
  }, []);

  // Auto-disable direct hire for Inside Country
  useEffect(() => {
    if (formData.location === 'Inside Country') {
      setFormData(prev => ({ ...prev, directHire: 'No' }));
    }
  }, [formData.location]);

  // Calculation functions
  const calculateVAT = () => {
    const price = parseFloat(formData.priceInclVAT) || 0;
    const vatPct = parseFloat(formData.vatPercent) || 5;
    const exVAT = Math.round((price / (1 + vatPct / 100)) * 100) / 100;
    const vatAmt = Math.round((price - exVAT) * 100) / 100;
    return { exVAT, vatAmt };
  };

  const calculateDays = () => {
    const endDate = formData.reason === 'Runaway' && formData.abscondDate 
      ? formData.abscondDate 
      : formData.returnedDate;
    
    if (!formData.deliveredDate || !endDate) return 0;
    return differenceInDays(endDate, formData.deliveredDate);
  };

  const isReturnedBeforeNextVATFiling = () => {
    const endDate = formData.reason === 'Runaway' && formData.abscondDate 
      ? formData.abscondDate 
      : formData.returnedDate;
    
    if (!endDate) return false;

    // For Inside Country, use returnedDate as reference if no deliveredDate
    // This handles cases where worker was delivered but date wasn't recorded
    const referenceDate = formData.deliveredDate || 
      (formData.location === 'Inside Country' ? endDate : null);
    
    if (!referenceDate) return false;

    const filingDates = [
      new Date(new Date().getFullYear(), 1, 29), // Feb 29
      new Date(new Date().getFullYear(), 4, 29), // May 29
      new Date(new Date().getFullYear(), 7, 29), // Aug 29
      new Date(new Date().getFullYear(), 10, 29), // Nov 29
    ];

    const nextFiling = filingDates.find(date => date > referenceDate) || 
                       new Date(new Date().getFullYear() + 1, 1, 29);

    return endDate < nextFiling;
  };

  const getStageDeduction = (nationality: Nationality, stage: Stage): number => {
    if (nationality === 'Indonesia') return 6000;
    
    if (nationality === 'Philippines') {
      switch (stage) {
        case 'OEC Issued': return 6000;
        case 'Contract Attested': return 1800;
        case 'Medical Done': return 5000;
        default: return 0;
      }
    }
    
    return 0;
  };

  const calculateRefund = () => {
    const { exVAT, vatAmt } = calculateVAT();
    const days = calculateDays();
    const salary = parseFloat(formData.salaryAED) || 0;
    const cashAssistance = parseFloat(formData.cashAssistanceAED) || 0;
    const govVisa = parseFloat(formData.govVisaAED) || 0;
    const unpaidDays = parseFloat(formData.unpaidSalaryDays) || 0;
    const medicalVisaCost = parseFloat(formData.medicalVisaCostAED) || 0;
    const totalPaid = parseFloat(formData.priceInclVAT) || 0;

    let refundEx = 0;
    let vatRefund = 0;
    let deductions: Array<{label: string, amount: number, rule: string}> = [];
    let additions: Array<{label: string, amount: number, rule: string}> = [];
    let dueDate: string | Date = '';
    let noRefund = false;

    // Special case: Medically Unfit - no deductions, only total paid + Medical Visa Cost
    if (formData.reason === 'Medically Unfit') {
      // For Medically Unfit, refund base price + VAT + Medical Visa Cost
      refundEx = exVAT;
      vatRefund = vatAmt;
      
      additions.push({ label: 'Base Price (excl. VAT)', amount: exVAT, rule: 'Medically Unfit - Full Refund' });
      additions.push({ label: 'VAT to Refund', amount: vatAmt, rule: 'Medically Unfit - Full Refund' });
      
      if (medicalVisaCost > 0) {
        additions.push({ label: 'Medical Visa Cost', amount: medicalVisaCost, rule: 'Medically Unfit' });
      }
      
      const totalRefund = exVAT + vatAmt + medicalVisaCost;
      
      // Due date logic for Medically Unfit
      const missing = [];
      if (formData.docPhone !== 'Yes') missing.push('Phone');
      if (formData.docPassport !== 'Yes') missing.push('Passport');
      if (formData.docCancel !== 'Yes') missing.push('Visa cancellation');
      
      if (missing.length === 0 && formData.returnedDate) {
        dueDate = addDays(formData.returnedDate, 14);
      } else {
        dueDate = `Pending: ${missing.join(', ')}`;
      }

      return {
        exVAT,
        vatAmt,
        vatRefund,
        refundEx,
        totalRefund,
        deductions: [],
        additions,
        dueDate,
        days,
        noRefund: false
      };
    }

    // VAT refund logic
    if (formData.location === 'Outside Country' && !formData.deliveredDate) {
      vatRefund = vatAmt;
    } else if (isReturnedBeforeNextVATFiling()) {
      vatRefund = vatAmt;
    }

    // Outside Country logic
    if (formData.location === 'Outside Country') {
      if (formData.directHire === 'Yes' && formData.deliveredDate) {
        // NO REFUND case
        noRefund = true;
        refundEx = 0;
        vatRefund = 0;
      } else if (formData.directHire === 'Yes' && formData.failBring === 'Yes') {
        // Full refund
        refundEx = exVAT;
        additions.push({ label: 'Base Price (excl. VAT)', amount: exVAT, rule: 'Outside not delivered' });
        
        if (govVisa > 0) {
          additions.push({ label: 'Gov. Visa Issuance', amount: govVisa, rule: 'Direct hire failed' });
          refundEx += govVisa;
        }
        
        if (cashAssistance > 0) {
          deductions.push({ label: 'Cash Assistance Paid', amount: cashAssistance, rule: 'Direct hire' });
          refundEx -= cashAssistance;
        }
      } else if (formData.directHire === 'Yes') {
        // Stage deductions
        refundEx = exVAT;
        additions.push({ label: 'Base Price (excl. VAT)', amount: exVAT, rule: 'Outside not delivered' });
        
        const stageDed = getStageDeduction(formData.nationality, formData.stage);
        if (stageDed > 0) {
          deductions.push({ label: 'Stage Deduction', amount: stageDed, rule: `${formData.nationality} - ${formData.stage}` });
          refundEx -= stageDed;
        }
        
        if (cashAssistance > 0) {
          deductions.push({ label: 'Cash Assistance Paid', amount: cashAssistance, rule: 'Direct hire' });
          refundEx -= cashAssistance;
        }
      } else {
        // Not direct hire
        refundEx = exVAT;
        const baseRule = formData.failBring === 'Yes' ? 'Outside not delivered' : 'Outside Country - Delivered';
        additions.push({ label: 'Base Price (excl. VAT)', amount: exVAT, rule: baseRule });
        
        if (formData.failBring === 'Yes' && formData.atFault === 'Yes' && govVisa > 0) {
          additions.push({ label: 'Gov. Visa Issuance', amount: govVisa, rule: 'Center at fault' });
          refundEx += govVisa;
        } else {
          const stageDed = getStageDeduction(formData.nationality, formData.stage);
          if (stageDed > 0) {
            deductions.push({ label: 'Stage Deduction', amount: stageDed, rule: `${formData.nationality} - ${formData.stage}` });
            refundEx -= stageDed;
          }
        }
      }

      dueDate = addDays(new Date(), 14);
    }
    // Inside Country logic
    else {
      refundEx = exVAT;
      additions.push({ label: 'Base Price (excl. VAT)', amount: exVAT, rule: 'Inside country delivered' });

      if (days < 5) {
        // Daily charges only (includes salary, so no separate salary deduction)
        const dailyDed = 105 * Math.min(days, 5) + 210 * Math.max(0, days - 5);
        deductions.push({ label: 'Daily Contract Charges', amount: dailyDed, rule: `${days} days < 5` });
        refundEx -= dailyDed;
      } else if (days >= 30) {
        // Monthly deduction: Calculate based on actual base price / 24 months
        const fullMonths = Math.floor(days / 30);
        const remainingDays = days % 30;
        const monthlyRate = exVAT / 24; // Calculate monthly rate from actual base price
        const monthlyDed = (fullMonths * monthlyRate) + ((monthlyRate / 30) * remainingDays);
        deductions.push({
          label: 'Monthly Deduction',
          amount: Math.round(monthlyDed * 100) / 100,
          rule: `${fullMonths} month(s) + ${remainingDays} day(s) @ ${Math.round(monthlyRate * 100) / 100} AED/month`
        });
        refundEx -= monthlyDed;
      } else {
        // 5-29 days
        if (formData.visaVpaDone === 'Yes') {
          // No other deductions when Visa/VPA done - unpaid salary will be handled by master deduction
        } else {
          if (formData.optionB === 'Yes') {
            const penalty = formData.emirate === 'Dubai' ? 1750 : 1300;
            const tadbeerFees = parseFloat(formData.standardTadbeerFeesAED) || 0;
            deductions.push({ label: 'Option B Penalty', amount: penalty, rule: formData.emirate });
            deductions.push({ label: 'Standard Tadbeer Fees', amount: tadbeerFees, rule: 'Option B' });
            refundEx -= (penalty + tadbeerFees);
          } else {
            // Daily charges (includes salary, so no separate salary deduction)
            const dailyDed = 105 * Math.min(days, 5) + 210 * Math.max(0, days - 5);
            deductions.push({ label: 'Daily Contract Charges', amount: dailyDed, rule: `${days} days (no visa)` });
            refundEx -= dailyDed;
          }
        }
      }

      // Due date logic for inside
      const missing = [];
      if (formData.docPhone !== 'Yes') missing.push('Phone');
      if (formData.docPassport !== 'Yes') missing.push('Passport');
      if (formData.docCancel !== 'Yes') missing.push('Visa cancellation');
      
      // For Runaway, also check Abscond Report
      if (formData.reason === 'Runaway' && formData.abscondReport !== 'Yes') {
        missing.push('Abscond Report');
      }

      if (missing.length === 0 && (formData.returnedDate || formData.abscondDate)) {
        const baseDate = formData.reason === 'Runaway' && formData.abscondDate 
          ? formData.abscondDate 
          : formData.returnedDate!;
        dueDate = addDays(baseDate, 14);
      } else {
        dueDate = `Pending: ${missing.join(', ')}`;
      }
    }

    // MASTER UNPAID SALARY DEDUCTION - Applies to all scenarios except Outside Country + Center Failed to Deliver
    const shouldApplyUnpaidSalary = !(formData.location === 'Outside Country' && formData.failBring === 'Yes');
    
    if (shouldApplyUnpaidSalary && unpaidDays > 0 && salary > 0) {
      const salaryDed = (salary / 30) * unpaidDays;
      deductions.push({ 
        label: 'Unpaid Salary', 
        amount: Math.round(salaryDed * 100) / 100, 
        rule: `${unpaidDays} days × ${salary}/30` 
      });
      refundEx -= salaryDed;
    }

    if (vatRefund > 0) {
      additions.push({ label: 'VAT to Refund', amount: vatRefund, rule: 'Returned before VAT filing' });
    }

    const totalRefund = Math.max(0, refundEx) + vatRefund;

    return {
      exVAT,
      vatAmt,
      vatRefund,
      refundEx: Math.max(0, refundEx),
      totalRefund,
      deductions,
      additions,
      dueDate,
      days,
      noRefund
    };
  };

  const shouldSkipToSummary = () => {
    return formData.location === 'Outside Country' && formData.failBring === 'Yes';
  };

  const handleNext = () => {
    if (shouldSkipToSummary() && currentStep === 2) {
      setCurrentStep(6);
    } else {
      setCurrentStep(Math.min(6, currentStep + 1));
    }
  };

  const handleBack = () => {
    if (shouldSkipToSummary() && currentStep === 6) {
      setCurrentStep(2);
    } else {
      setCurrentStep(Math.max(1, currentStep - 1));
    }
  };

  const exportPDF = () => {
    const element = document.getElementById('summary-content');
    const opt = {
      margin: 10,
      filename: `Tadmaids-Refund-${format(new Date(), 'yyyy-MM-dd')}-${formData.clientName || 'Client'}-${formData.contractNo || 'Contract'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const printCalculation = () => {
    window.print();
  };

  const handleFinalize = async () => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can finalize refunds",
        variant: "destructive",
      });
      return;
    }

    if (!formData.contractNo || !formData.clientName || !formData.workerName) {
      toast({
        title: "Incomplete Data",
        description: "Please fill in all required fields before finalizing",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const result = calculateRefund();
      
      // Parse due date
      let dueDate = null;
      if (result.dueDate && typeof result.dueDate !== 'string') {
        dueDate = format(result.dueDate, 'yyyy-MM-dd');
      }

      const refundData = {
        prepared_by: formData.preparedBy || null,
        finalized_by: user.id,
        contract_no: formData.contractNo,
        client_name: formData.clientName,
        client_mobile: formData.clientMobile,
        emirate: formData.emirate,
        worker_name: formData.workerName,
        nationality: formData.nationality,
        salary_aed: parseFloat(formData.salaryAED) || null,
        price_incl_vat: parseFloat(formData.priceInclVAT),
        vat_percent: parseFloat(formData.vatPercent),
        location: formData.location,
        direct_hire: formData.directHire === 'Yes',
        fail_bring: formData.failBring === 'Yes',
        at_fault: formData.atFault === 'Yes',
        enough_time: formData.enoughTime === 'Yes',
        stage: formData.stage,
        cash_assistance_aed: parseFloat(formData.cashAssistanceAED) || 0,
        gov_visa_aed: parseFloat(formData.govVisaAED) || 0,
        reason: formData.reason,
        other_reason: formData.otherReason,
        medical_visa_cost_aed: parseFloat(formData.medicalVisaCostAED) || 0,
        delivered_date: formData.deliveredDate ? format(formData.deliveredDate, 'yyyy-MM-dd') : null,
        returned_date: formData.returnedDate ? format(formData.returnedDate, 'yyyy-MM-dd') : null,
        doc_phone: formData.docPhone === 'Yes',
        doc_passport: formData.docPassport === 'Yes',
        doc_cancel: formData.docCancel === 'Yes',
        abu_dhabi_insurance_cancelled: formData.abuDhabiInsuranceCancelled === 'Yes',
        abscond_report: formData.abscondReport === 'Yes',
        abscond_date: formData.abscondDate ? format(formData.abscondDate, 'yyyy-MM-dd') : null,
        unpaid_salary_days: parseInt(formData.unpaidSalaryDays) || 0,
        visa_vpa_done: formData.visaVpaDone === 'Yes',
        option_b: formData.optionB === 'Yes',
        standard_tadbeer_fees_aed: parseFloat(formData.standardTadbeerFeesAED) || 0,
        base_price_ex_vat: result.exVAT,
        vat_amount: result.vatAmt,
        vat_refund: result.vatRefund,
        refund_ex_vat: result.refundEx,
        total_refund_amount: result.totalRefund,
        days_worked: result.days,
        due_date: dueDate,
        calculation_details: {
          deductions: result.deductions,
          additions: result.additions,
          noRefund: result.noRefund,
        },
        // Abscond classification (for Runaway cases)
        abscond_classification: formData.reason === 'Runaway' && formData.abscondClassification ? formData.abscondClassification : null,
        insurance_provider: formData.abscondClassification === 'INSURED' ? formData.insuranceProvider : null,
        deal_id: linkedDealId || null,
        status: 'finalized',
      };

      const { error } = await supabase
        .from('refunds')
        .insert([refundData]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Refund has been finalized and saved",
      });

      // Navigate to refunds list after a short delay
      setTimeout(() => {
        navigate('/refundslist');
      }, 1000);

    } catch (error: any) {
      console.error("Error saving refund:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const { exVAT, vatAmt } = calculateVAT();
  const result = calculateRefund();

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          #summary-content { padding: 20px; }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Stepper */}
            <div className="lg:col-span-1 no-print">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="text-lg">Refund Calculator</CardTitle>
                  <CardDescription>Step {currentStep} of 6</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { num: 1, label: 'Basics' },
                      { num: 2, label: 'Scenario' },
                      { num: 3, label: 'Delivery & Docs' },
                      { num: 4, label: 'Visa/VPA' },
                      { num: 5, label: 'Reason' },
                      { num: 6, label: 'Summary' },
                    ].map((step) => (
                      <button
                        key={step.num}
                        onClick={() => setCurrentStep(step.num)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all",
                          currentStep === step.num
                            ? "bg-primary text-white shadow-md"
                            : "bg-slate-100 hover:bg-slate-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-semibold",
                            currentStep === step.num ? "bg-white text-primary" : "bg-slate-300 text-slate-700"
                          )}>
                            {step.num}
                          </div>
                          <span className="font-medium">{step.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>
                    {currentStep === 1 && "Step 1: Basics"}
                    {currentStep === 2 && "Step 2: Scenario"}
                    {currentStep === 3 && "Step 3: Delivery & Documents"}
                    {currentStep === 4 && "Step 4: Visa/VPA & Fees"}
                    {currentStep === 5 && "Step 5: Reason for Return"}
                    {currentStep === 6 && "Step 6: Summary & Export"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Step 1: Basics */}
                  {currentStep === 1 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Prepared By</Label>
                          <Select value={formData.preparedBy} onValueChange={(v) => setFormData({...formData, preparedBy: v})}>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Select authorized user..." />
                            </SelectTrigger>
                            <SelectContent className="bg-background z-50">
                              {authorizedUsers.length > 0 ? (
                                authorizedUsers.map((user) => (
                                  <SelectItem key={user.id} value={user.full_name}>
                                    {user.full_name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="none" disabled>No authorized users found</SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Contract Number</Label>
                          <Input 
                            value={formData.contractNo}
                            onChange={(e) => setFormData({...formData, contractNo: e.target.value})}
                            placeholder="Enter contract number"
                          />
                        </div>

                        <div className="col-span-2 p-4 bg-muted/50 rounded-lg border">
                          <Label className="mb-2 block">SELECT CLIENT FROM DATABASE</Label>
                          <Input 
                            placeholder="Search clients..."
                            value={clientSearch}
                            onChange={(e) => setClientSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                              }
                            }}
                            className="mb-2"
                          />
                          <Select 
                            value=""
                            onValueChange={(clientId) => {
                              const client = clients.find(c => c.id === clientId);
                              if (client) {
                                const emirateMap: Record<string, Emirate> = {
                                  'Dubai': 'Dubai',
                                  'Sharjah': 'Sharjah',
                                  'Ajman': 'Ajman',
                                  'Umm Al Quwain': 'Umm Al Quwain',
                                  'Ras Al Khaimah': 'Ras Al Khaimah',
                                  'Fujairah': 'Fujairah',
                                  'Abu Dhabi': 'Abu Dhabi',
                                };
                                
                                setFormData({
                                  ...formData,
                                  clientName: client.client_name,
                                  clientMobile: client.mobile_number,
                                  emirate: (emirateMap[client.emirate || ''] || 'Dubai') as Emirate,
                                });
                                
                                toast({
                                  title: "Client data loaded",
                                  description: `Loaded details for ${client.client_name}`,
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client from database" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.filter(client => 
                                client.client_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                                client.mobile_number.includes(clientSearch)
                              ).length === 0 ? (
                                <SelectItem value="none" disabled>No clients found</SelectItem>
                              ) : (
                                clients
                                  .filter(client => 
                                    client.client_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                                    client.mobile_number.includes(clientSearch)
                                  )
                                  .map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                      {client.client_name} - {client.mobile_number} {client.lead_id ? '(converted lead)' : ''}
                                    </SelectItem>
                                  ))
                              )}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-2">
                            Clients from the database will auto-fill name, phone, and emirate
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Client Name</Label>
                          <Input 
                            value={formData.clientName}
                            onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                            placeholder="Enter client name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Client Phone</Label>
                          <Input 
                            type="tel"
                            value={formData.clientMobile}
                            onChange={(e) => setFormData({...formData, clientMobile: e.target.value})}
                            placeholder="971501234567"
                            pattern="971[0-9]{9}"
                            title="Phone format: 971XXXXXXXXX"
                          />
                          <p className="text-xs text-muted-foreground">Format: 971XXXXXXXXX</p>
                        </div>

                        <div className="space-y-2">
                          <Label>Client Emirate</Label>
                          <Select value={formData.emirate} onValueChange={(v) => setFormData({...formData, emirate: v as Emirate})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Dubai">Dubai</SelectItem>
                              <SelectItem value="Sharjah">Sharjah</SelectItem>
                              <SelectItem value="Ajman">Ajman</SelectItem>
                              <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
                              <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                              <SelectItem value="Fujairah">Fujairah</SelectItem>
                              <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Worker Name</Label>
                          <Input 
                            placeholder="Search workers..."
                            value={workerSearch}
                            onChange={(e) => setWorkerSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                              }
                            }}
                            className="mb-2"
                          />
                          <Select 
                            value={formData.workerName} 
                            onValueChange={(workerId) => {
                              const worker = cvWorkers.find(w => w.id === workerId);
                              if (worker) {
                                // Map nationality code to full name
                                const nationalityMap: Record<string, Nationality> = {
                                  'PH': 'Philippines',
                                  'ID': 'Indonesia',
                                  'ET': 'Ethiopia',
                                  'UG': 'Uganda',
                                  'KE': 'Kenya',
                                  'MY': 'Myanmar',
                                  'IN': 'India',
                                };
                                
                                setFormData({
                                  ...formData, 
                                  workerName: worker.name,
                                  nationality: nationalityMap[worker.nationality_code] || 'Other',
                                  salaryAED: worker.salary ? worker.salary.toString() : ''
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a worker from CV Wizard" />
                            </SelectTrigger>
                            <SelectContent>
                              {cvWorkers.filter(worker => 
                                worker.name.toLowerCase().includes(workerSearch.toLowerCase())
                              ).length === 0 ? (
                                <SelectItem value="none" disabled>No workers found</SelectItem>
                              ) : (
                                cvWorkers
                                  .filter(worker => 
                                    worker.name.toLowerCase().includes(workerSearch.toLowerCase())
                                  )
                                  .map((worker) => (
                                    <SelectItem key={worker.id} value={worker.id}>
                                      {worker.name} ({worker.nationality_code})
                                    </SelectItem>
                                  ))
                              )}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            Workers from CV Wizard will auto-fill nationality and salary
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Worker Nationality</Label>
                          <Select value={formData.nationality} onValueChange={(v) => setFormData({...formData, nationality: v as Nationality})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Philippines">Philippines</SelectItem>
                              <SelectItem value="Indonesia">Indonesia</SelectItem>
                              <SelectItem value="Ethiopia">Ethiopia</SelectItem>
                              <SelectItem value="Uganda">Uganda</SelectItem>
                              <SelectItem value="Kenya">Kenya</SelectItem>
                              <SelectItem value="Myanmar">Myanmar</SelectItem>
                              <SelectItem value="India">India</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Worker Salary (AED)</Label>
                          <Input 
                            type="number" 
                            value={formData.salaryAED}
                            onChange={(e) => setFormData({...formData, salaryAED: e.target.value})}
                            placeholder="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Commission (incl. VAT)</Label>
                          <Input 
                            type="number" 
                            value={formData.priceInclVAT}
                            onChange={(e) => setFormData({...formData, priceInclVAT: e.target.value})}
                            placeholder="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>VAT %</Label>
                          <Input 
                            type="number" 
                            value={formData.vatPercent}
                            onChange={(e) => setFormData({...formData, vatPercent: e.target.value})}
                            placeholder="5"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Scenario */}
                  {currentStep === 2 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Worker Location</Label>
                          <Select value={formData.location} onValueChange={(v) => setFormData({...formData, location: v as Location})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inside Country">Inside Country</SelectItem>
                              <SelectItem value="Outside Country">Outside Country</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Direct Hire?</Label>
                          <Select 
                            value={formData.directHire} 
                            onValueChange={(v) => setFormData({...formData, directHire: v as YesNo})}
                            disabled={formData.location === 'Inside Country'}
                          >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.location === 'Outside Country' && (
                          <>
                            <div className="space-y-2">
                              <Label>Did Center fail to bring worker?</Label>
                              <Select value={formData.failBring} onValueChange={(v) => setFormData({...formData, failBring: v as YesNo})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Yes">Yes</SelectItem>
                                  <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {!(formData.directHire === 'Yes' && formData.deliveredDate) && (
                              <>
                                <div className="space-y-2">
                                  <Label>Was Center at fault?</Label>
                                  <Select value={formData.atFault} onValueChange={(v) => setFormData({...formData, atFault: v as YesNo})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Yes">Yes</SelectItem>
                                      <SelectItem value="No">No</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Stage of cancellation</Label>
                                  <Select value={formData.stage} onValueChange={(v) => setFormData({...formData, stage: v as Stage})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="None">None</SelectItem>
                                      <SelectItem value="OEC Issued">OEC Issued</SelectItem>
                                      <SelectItem value="Contract Attested">Contract Attested</SelectItem>
                                      <SelectItem value="Medical Done">Medical Done</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}

                            <div className="space-y-2">
                              <Label>Gov. Visa issuance paid by client (AED)</Label>
                              <Input 
                                type="number"
                                value={formData.govVisaAED}
                                onChange={(e) => setFormData({...formData, govVisaAED: e.target.value})}
                                placeholder="0"
                              />
                            </div>
                          </>
                        )}

                        {formData.directHire === 'Yes' && (
                          <div className="space-y-2">
                            <Label>Cash assistance paid to worker (AED)</Label>
                            <Input 
                              type="number"
                              value={formData.cashAssistanceAED}
                              onChange={(e) => setFormData({...formData, cashAssistanceAED: e.target.value})}
                              placeholder="0"
                            />
                          </div>
                        )}

                        <div className="space-y-2 md:col-span-2">
                          <Label>Reason for return (for statistics)</Label>
                          <Select value={formData.reason} onValueChange={(v) => setFormData({...formData, reason: v as Reason})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="— Not applicable / <= 6 months —">— Not applicable / &lt;= 6 months —</SelectItem>
                              <SelectItem value="Client does not need her">Client does not need her</SelectItem>
                              <SelectItem value="Runaway">Runaway</SelectItem>
                              <SelectItem value="Refused to work (no reason)">Refused to work (no reason)</SelectItem>
                              <SelectItem value="Medically Unfit">Medically Unfit</SelectItem>
                              <SelectItem value="Maid Backed Out">Maid Backed Out</SelectItem>
                              <SelectItem value="Client Cancelled">Client Cancelled</SelectItem>
                              <SelectItem value="Medical Failed outside country">Medical Failed outside country</SelectItem>
                              <SelectItem value="Late Delivery">Late Delivery</SelectItem>
                              <SelectItem value="Maid want to travel to home country">Maid want to travel to home country</SelectItem>
                              <SelectItem value="Maid wants to work outside home/domestic">Maid wants to work outside home/domestic</SelectItem>
                              <SelectItem value="Maid Abused Family">Maid Abused Family</SelectItem>
                              <SelectItem value="Family Accused of Mistreatment">Family Accused of Mistreatment</SelectItem>
                              <SelectItem value="Food/Shelter/Basics Claim">Food/Shelter/Basics Claim</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.reason === 'Other' && (
                          <div className="space-y-2 md:col-span-2">
                            <Label>Other reason</Label>
                            <Input 
                              value={formData.otherReason}
                              onChange={(e) => setFormData({...formData, otherReason: e.target.value})}
                              placeholder="Please specify"
                            />
                          </div>
                        )}

                        {formData.reason === 'Medically Unfit' && (
                          <div className="space-y-2">
                            <Label>Medical Visa Cost (AED)</Label>
                            <Input 
                              type="number"
                              value={formData.medicalVisaCostAED}
                              onChange={(e) => setFormData({...formData, medicalVisaCostAED: e.target.value})}
                              placeholder="0"
                            />
                          </div>
                        )}
                      </div>

                      {formData.location === 'Outside Country' && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                          <p className="text-sm font-medium text-blue-900">
                            EN: For Outside Country, the only no-refund case is Direct Hire + Delivered to client. In all other outside scenarios (not delivered), a refund applies per rules.
                          </p>
                          <p className="text-sm text-blue-800" dir="rtl">
                            AR: للخارج: حالة عدم الاسترجاع الوحيدة هي التوظيف المباشر مع التسليم للعميل. في غير ذلك، يُطبق الاسترجاع حسب القواعد.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Delivery & Documents */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Date worker DELIVERED to client</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.deliveredDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.deliveredDate ? format(formData.deliveredDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={formData.deliveredDate}
                                onSelect={(date) => setFormData({...formData, deliveredDate: date})}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Date worker RETURNED to Tadmaids</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.returnedDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.returnedDate ? format(formData.returnedDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={formData.returnedDate}
                                onSelect={(date) => setFormData({...formData, returnedDate: date})}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Days in employment (calculated)</Label>
                          <Input value={calculateDays()} readOnly className="bg-slate-100" />
                        </div>

                        <div className="space-y-2">
                          <Label>Docs: Phone</Label>
                          <Select value={formData.docPhone} onValueChange={(v) => setFormData({...formData, docPhone: v as YesNo})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Docs: Passport</Label>
                          <Select value={formData.docPassport} onValueChange={(v) => setFormData({...formData, docPassport: v as YesNo})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Docs: Visa Cancellation</Label>
                          <Select value={formData.docCancel} onValueChange={(v) => setFormData({...formData, docCancel: v as YesNo})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Yes">Yes</SelectItem>
                              <SelectItem value="No">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.emirate === 'Abu Dhabi' && calculateDays() >= 5 && (
                          <div className="space-y-2">
                            <Label>Insurance cancelled?</Label>
                            <Select value={formData.abuDhabiInsuranceCancelled} onValueChange={(v) => setFormData({...formData, abuDhabiInsuranceCancelled: v as YesNo})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Yes">Yes</SelectItem>
                                <SelectItem value="No">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {formData.reason === 'Runaway' && (
                          <>
                            <div className="space-y-2">
                              <Label>Abscond Report</Label>
                              <Select value={formData.abscondReport} onValueChange={(v) => setFormData({...formData, abscondReport: v as YesNo})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Yes">Yes</SelectItem>
                                  <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2 md:col-span-2">
                              <Label>Abscond report date (if Runaway)</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.abscondDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.abscondDate ? format(formData.abscondDate, "PPP") : "Pick a date"}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={formData.abscondDate}
                                    onSelect={(date) => setFormData({...formData, abscondDate: date})}
                                    initialFocus
                                    className="pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <p className="text-xs text-muted-foreground">
                                EN: Use the official MoHRE abscond report filing date.<br />
                                <span dir="rtl">AR: استخدم تاريخ تقديم بلاغ الهروب الرسمي لدى وزارة الموارد البشرية.</span>
                              </p>
                            </div>

                            {/* Abscond Classification */}
                            <div className="space-y-2 md:col-span-2">
                              <Label className="text-base font-semibold text-destructive">Abscond Classification *</Label>
                              <Select 
                                value={formData.abscondClassification} 
                                onValueChange={(v) => setFormData({...formData, abscondClassification: v as AbscondClassification})}
                              >
                                <SelectTrigger className="border-destructive">
                                  <SelectValue placeholder="Select classification" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="NON_INSURED">Non-Insured (Company Loss)</SelectItem>
                                  <SelectItem value="INSURED">Insured (Insurance Claim)</SelectItem>
                                  <SelectItem value="AGENT_COVERED">Agent Covered (Supplier Claim)</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Select how this abscond loss will be covered
                              </p>
                            </div>

                            {formData.abscondClassification === 'INSURED' && (
                              <div className="space-y-2">
                                <Label>Insurance Provider</Label>
                                <Input 
                                  value={formData.insuranceProvider}
                                  onChange={(e) => setFormData({...formData, insuranceProvider: e.target.value})}
                                  placeholder="e.g., Emirates Insurance"
                                />
                              </div>
                            )}
                          </>
                        )}

                        <div className="space-y-2">
                          <Label>Unpaid salary days</Label>
                          <Input 
                            type="number"
                            value={formData.unpaidSalaryDays}
                            onChange={(e) => setFormData({...formData, unpaidSalaryDays: e.target.value})}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Additional Deduction Section */}
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-semibold mb-4 text-base">Additional Deduction</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Amount (AED)</Label>
                            <Input 
                              type="number"
                              value={formData.additionalDeductionAmount}
                              onChange={(e) => setFormData({...formData, additionalDeductionAmount: e.target.value})}
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input 
                              value={formData.additionalDeductionDescription}
                              onChange={(e) => setFormData({...formData, additionalDeductionDescription: e.target.value})}
                              placeholder="Reason for additional deduction"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Visa/VPA & Fees */}
                  {currentStep === 4 && (
                    <div className="space-y-6">
                      {formData.location === 'Inside Country' && calculateDays() >= 5 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <Label>Client did Visa & VPA?</Label>
                            <Select value={formData.visaVpaDone} onValueChange={(v) => setFormData({...formData, visaVpaDone: v as YesNo})}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Yes">Yes</SelectItem>
                                <SelectItem value="No">No</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {formData.visaVpaDone === 'No' && (
                            <>
                              <div className="space-y-2">
                                <Label>Option B</Label>
                                <Select value={formData.optionB} onValueChange={(v) => setFormData({...formData, optionB: v as YesNo})}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  Penalty: AED {formData.emirate === 'Dubai' ? '1,750' : '1,300'} ({formData.emirate})
                                </p>
                              </div>

                              {formData.optionB === 'Yes' && (
                                <div className="space-y-2">
                                  <Label>Standard Tadbeer Fees (AED)</Label>
                                  <Input 
                                    type="number"
                                    value={formData.standardTadbeerFeesAED}
                                    onChange={(e) => setFormData({...formData, standardTadbeerFeesAED: e.target.value})}
                                    placeholder="0"
                                  />
                                </div>
                              )}

                              <div className="md:col-span-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-sm text-amber-900">
                                  If no Visa&VPA and Option B = {formData.emirate === 'Dubai' ? '1,750' : '1,300'} + Standard Tadbeer fees. Otherwise, daily charge: 105/day first 5 days → 210/day after.
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                          <p className="text-sm text-slate-700">
                            {formData.location === 'Outside Country' 
                              ? "Visa & VPA questions are not applicable for Outside Country scenarios."
                              : `Days in employment (${calculateDays()}) is less than 5. VPA/insurance questions skipped. Daily charges apply.`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 5: Reason */}
                  {currentStep === 5 && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                        <p className="text-sm text-blue-900">
                          EN: For records only — does not affect the refund outcome.
                        </p>
                        <p className="text-sm text-blue-800" dir="rtl">
                          AR: لأغراض التوثيق فقط — لا يؤثر على نتيجة الاسترجاع.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Reason for return</Label>
                        <p className="text-sm text-muted-foreground">
                          Current reason: <strong>{formData.reason}</strong>
                          {formData.reason === 'Other' && formData.otherReason && ` (${formData.otherReason})`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          This information is kept for statistical purposes. You can change it in Step 2 if needed.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 6: Summary */}
                  {currentStep === 6 && (
                    <div id="summary-content" className="space-y-6">
                      {/* Header Pills */}
                      <div className="flex flex-wrap gap-2">
                        {formData.preparedBy && <Badge variant="default">Prepared By: {formData.preparedBy}</Badge>}
                        {formData.contractNo && <Badge variant="outline">Contract: {formData.contractNo}</Badge>}
                        {formData.clientName && <Badge variant="outline">{formData.clientName}</Badge>}
                        {formData.clientMobile && <Badge variant="outline">{formData.clientMobile}</Badge>}
                        <Badge variant="secondary">{formData.emirate}</Badge>
                        {formData.workerName && <Badge variant="outline">Worker: {formData.workerName}</Badge>}
                        <Badge variant="secondary">{formData.nationality}</Badge>
                        <Badge variant="secondary">{formData.location}</Badge>
                        <Badge variant="secondary">Direct: {formData.directHire}</Badge>
                        <Badge variant="secondary">Days: {result.days}</Badge>
                      </div>

                      {/* No Refund Case */}
                      {result.noRefund && (
                        <div className="p-6 bg-red-50 border-2 border-red-300 rounded-lg">
                          <h3 className="text-xl font-bold text-red-900 mb-2">No Refund</h3>
                          <p className="text-red-800">
                            EN: This is a Direct Hire + Delivered case (Outside Country). No refund applies.
                          </p>
                          <p className="text-red-800 mt-2" dir="rtl">
                            AR: هذه حالة توظيف مباشر مع التسليم (خارج الدولة). لا ينطبق الاسترجاع.
                          </p>
                        </div>
                      )}

                      {/* Financials */}
                      {!result.noRefund && (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Price excl. VAT</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-2xl font-bold">AED {result.exVAT.toFixed(2)}</p>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">VAT Collected</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-2xl font-bold">AED {result.vatAmt.toFixed(2)}</p>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">VAT to Refund</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-2xl font-bold text-green-600">AED {result.vatRefund.toFixed(2)}</p>
                              </CardContent>
                            </Card>
                          </div>

                          {/* Itemized Table */}
                          <div>
                            <h3 className="font-semibold text-lg mb-3">Calculation Details</h3>
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-100">
                                  <tr>
                                    <th className="text-left p-3 font-semibold">Item</th>
                                    <th className="text-right p-3 font-semibold">Amount (AED)</th>
                                    <th className="text-left p-3 font-semibold">Rule</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.additions.map((item, idx) => (
                                    <tr key={`add-${idx}`} className="border-t">
                                      <td className="p-3 text-green-700 font-medium">+ {item.label}</td>
                                      <td className="p-3 text-right text-green-700 font-medium">+{item.amount.toFixed(2)}</td>
                                      <td className="p-3 text-muted-foreground">{item.rule}</td>
                                    </tr>
                                  ))}
                                  {result.deductions.map((item, idx) => (
                                    <tr key={`ded-${idx}`} className="border-t">
                                      <td className="p-3 text-red-700 font-medium">− {item.label}</td>
                                      <td className="p-3 text-right text-red-700 font-medium">−{item.amount.toFixed(2)}</td>
                                      <td className="p-3 text-muted-foreground">{item.rule}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-slate-50 border-t-2">
                                  <tr>
                                    <td className="p-3 font-bold">Refund (excl. VAT)</td>
                                    <td className="p-3 text-right font-bold">AED {result.refundEx.toFixed(2)}</td>
                                    <td></td>
                                  </tr>
                                  <tr className="bg-green-50">
                                    <td className="p-3 font-bold text-lg">Total Refund (incl. VAT)</td>
                                    <td className="p-3 text-right font-bold text-lg text-green-700">AED {result.totalRefund.toFixed(2)}</td>
                                    <td></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>

                          {/* Due Date */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Due Date</CardTitle>
                            </CardHeader>
                            <CardContent>
                              {typeof result.dueDate === 'string' && result.dueDate.startsWith('Pending') ? (
                                <div className="space-y-3">
                                  <p className="text-red-600 font-semibold">{result.dueDate}</p>
                                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                                    <p className="text-sm text-amber-900">
                                      EN: We completed the calculation, but we will confirm the due date only after all steps are met. Please return all required items.
                                    </p>
                                    <p className="text-sm text-amber-800" dir="rtl">
                                      AR: تم إجراء الحسبة ولكن لن يتم تأكيد تاريخ السداد إلا بعد استيفاء جميع المتطلبات. يرجى إعادة جميع العناصر المطلوبة.
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xl font-bold text-green-600">
                                  {typeof result.dueDate === 'string' ? result.dueDate : format(result.dueDate, 'PPP')}
                                </p>
                              )}
                            </CardContent>
                          </Card>

                          {/* Explanation Block */}
                          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                            <div>
                              <h4 className="font-semibold text-blue-900 mb-2">Explanation (EN)</h4>
                              <p className="text-sm text-blue-800">
                                This calculation reflects your refund based on the information provided. The due date is confirmed only after all required items are returned: phone, passport, visa cancellation. If any item is pending, the due date is not set. Please complete the steps and return to recalculate.
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-blue-900 mb-2" dir="rtl">الشرح (AR)</h4>
                              <p className="text-sm text-blue-800" dir="rtl">
                                هذه الحسبة توضح الاسترجاع الخاص بك بناءً على المعلومات المقدمة. يتم تأكيد تاريخ الاستحقاق فقط بعد استلام جميع المتطلبات: الهاتف، جواز السفر، إلغاء الفيزا. إذا كان هناك عنصر معلق، لن يتم تحديد التاريخ. يرجى إكمال الخطوات والعودة لإعادة الحساب.
                              </p>
                            </div>
                          </div>

                          {/* Signature Blocks */}
                          <div className="space-y-4 print:mt-8">
                            <h3 className="font-semibold text-lg">Signatures</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Client Acceptance / قبول العميل</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div>
                                    <Label className="text-xs">Name/الاسم:</Label>
                                    <div className="border-b border-slate-300 py-2 text-sm">{formData.clientName || '_________________'}</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">ID/Phone الهوية/الهاتف:</Label>
                                    <div className="border-b border-slate-300 py-2 text-sm">{formData.clientMobile || '_________________'}</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Signature/التوقيع:</Label>
                                    <div className="border-b border-slate-300 py-6"></div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Date/التاريخ:</Label>
                                    <div className="border-b border-slate-300 py-2 text-sm">_________________</div>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Worker Acceptance / قبول العاملة</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div>
                                    <Label className="text-xs">Name/الاسم:</Label>
                                    <div className="border-b border-slate-300 py-2 text-sm">_________________</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">ID/Phone الهوية/الهاتف:</Label>
                                    <div className="border-b border-slate-300 py-2 text-sm">_________________</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Signature/التوقيع:</Label>
                                    <div className="border-b border-slate-300 py-6"></div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Date/التاريخ:</Label>
                                    <div className="border-b border-slate-300 py-2 text-sm">_________________</div>
                                  </div>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader>
                                  <CardTitle className="text-sm">Manager Sign-off / توقيع المدير</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div>
                                    <Label className="text-xs">Name/الاسم:</Label>
                                    <div className="border-b border-slate-300 py-2 text-sm">_________________</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">ID/Phone الهوية/الهاتف:</Label>
                                    <div className="border-b border-slate-300 py-2 text-sm">_________________</div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Signature/التوقيع:</Label>
                                    <div className="border-b border-slate-300 py-6"></div>
                                  </div>
                                  <div>
                                    <Label className="text-xs">Date/التاريخ:</Label>
                                    <div className="border-b border-slate-300 py-2 text-sm">_________________</div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-3 no-print">
                            <Button onClick={printCalculation} variant="outline" className="flex-1">
                              <Printer className="mr-2 h-4 w-4" />
                              Print Calculation
                            </Button>
                            <Button onClick={exportPDF} variant="outline" className="flex-1">
                              <FileText className="mr-2 h-4 w-4" />
                              Export PDF
                            </Button>
                            {isAdmin && (
                              <Button 
                                onClick={handleFinalize} 
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <>Saving...</>
                                ) : (
                                  <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Finalize & Save
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </>
                      )}

                      {/* Reason Display */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Reason for Return (Statistics)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="font-medium">{formData.reason}</p>
                          {formData.reason === 'Other' && formData.otherReason && (
                            <p className="text-sm text-muted-foreground mt-1">{formData.otherReason}</p>
                          )}
                          {formData.reason === 'Runaway' && formData.abscondDate && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Abscond report date: {format(formData.abscondDate, 'PPP')}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8 pt-6 border-t no-print">
                    <Button
                      onClick={handleBack}
                      disabled={currentStep === 1}
                      variant="outline"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={currentStep === 6}
                    >
                      Next
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Refund;
