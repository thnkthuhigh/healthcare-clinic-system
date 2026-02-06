import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { Patient, MedicalRecord, PrescriptionItem, Medication } from '../types';

// Mock patient data
const mockPatient: Patient = {
  id: 'p1',
  fullName: 'Nguyen Van A',
  phone: '0901234567',
  nationalId: 'VN-8821',
  dateOfBirth: '1979-05-15',
  age: 45,
  gender: 'Male',
  weightKg: 72,
  heightCm: 175,
  allergies: 'Peanuts, Penicillin',
  address: '123 Nguyen Hue, District 1, HCMC',
};

// Mock medical history
const mockHistory: MedicalRecord[] = [
  {
    id: '1',
    bookingId: 'b1',
    patientId: 'p1',
    patientName: 'Nguyen Van A',
    doctorId: 'd1',
    doctorName: 'Dr. Le',
    symptoms: 'Headache, dizziness',
    diagnosis: 'Hypertension',
    conclusion: 'BP stable at 120/80. Continued medication.',
    notes: null,
    serviceName: 'Cardiology',
    createdAt: '2023-10-12T10:00:00Z',
    updatedAt: '2023-10-12T10:30:00Z',
  },
  {
    id: '2',
    bookingId: 'b2',
    patientId: 'p1',
    patientName: 'Nguyen Van A',
    doctorId: 'd2',
    doctorName: 'Dr. Tran',
    symptoms: 'Fever, cough',
    diagnosis: 'General Viral Flu',
    conclusion: 'Rest and medication for 5 days',
    notes: null,
    serviceName: 'General',
    createdAt: '2023-08-05T09:00:00Z',
    updatedAt: '2023-08-05T09:30:00Z',
  },
  {
    id: '3',
    bookingId: 'b3',
    patientId: 'p1',
    patientName: 'Nguyen Van A',
    doctorId: 'd1',
    doctorName: 'Dr. Smith',
    symptoms: 'Annual checkup',
    diagnosis: 'Healthy',
    conclusion: 'All vitals normal',
    notes: null,
    serviceName: 'General',
    createdAt: '2023-02-10T14:00:00Z',
    updatedAt: '2023-02-10T14:45:00Z',
  },
];

// Mock prescription items
const mockPrescriptionItems: (PrescriptionItem & { medicationName: string })[] = [
  {
    id: '1',
    medicationId: 'm1',
    medicationName: 'Amoxicillin',
    unit: 'mg',
    qty: 10,
    dosage: '500mg • 2x Daily',
    note: 'Take after meals for 5 days',
    unitPriceCents: 5000,
    totalCents: 50000,
  },
  {
    id: '2',
    medicationId: 'm2',
    medicationName: 'Paracetamol',
    unit: 'mg',
    qty: 20,
    dosage: '500mg • SOS',
    note: 'For fever > 38.5C',
    unitPriceCents: 2000,
    totalCents: 40000,
  },
];

// Mock medications for search
const _mockMedications: Medication[] = [
  {
    id: 'm1',
    name: 'Amoxicillin',
    unit: 'mg',
    usage: 'Antibiotic',
    defaultDose: '500mg',
    priceCents: 5000,
    availableStock: 100,
  },
  {
    id: 'm2',
    name: 'Paracetamol',
    unit: 'mg',
    usage: 'Pain relief',
    defaultDose: '500mg',
    priceCents: 2000,
    availableStock: 500,
  },
  {
    id: 'm3',
    name: 'Ibuprofen',
    unit: 'mg',
    usage: 'Anti-inflammatory',
    defaultDose: '400mg',
    priceCents: 3000,
    availableStock: 200,
  },
  {
    id: 'm4',
    name: 'Omeprazole',
    unit: 'mg',
    usage: 'Acid reducer',
    defaultDose: '20mg',
    priceCents: 4000,
    availableStock: 150,
  },
];

type HistoryTab = 'history' | 'lab' | 'vitals';

const historyIcons: Record<string, { icon: string; color: string }> = {
  Cardiology: { icon: 'cardiology', color: 'purple' },
  General: { icon: 'coronavirus', color: 'blue' },
  default: { icon: 'check_circle', color: 'green' },
};

export function ConsultationPage() {
  const { bookingId: _bookingId } = useParams<{ bookingId: string }>();
  const [activeTab, setActiveTab] = useState<HistoryTab>('history');
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [prescriptionItems, setPrescriptionItems] = useState(mockPrescriptionItems);
  const [medSearch, setMedSearch] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedNote, setNewMedNote] = useState('');

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: '2-digit',
    });
  };

  const handleAddMedication = () => {
    // TODO: Implement medication search and add
    setMedSearch('');
    setNewMedDosage('');
    setNewMedNote('');
  };

  const handleRemoveMedication = (id: string) => {
    setPrescriptionItems(prescriptionItems.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    // TODO: Call API to save medical record and prescription
    alert('Medical record saved successfully!');
  };

  const handleComplete = () => {
    // TODO: Call API to complete consultation
    alert('Consultation completed! Patient sent to cashier!');
  };

  return (
    <div className="flex flex-col min-h-full min-w-0 bg-background-light dark:bg-background-dark relative">
      {/* Top Navigation / Breadcrumbs */}
      <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700 bg-surface-light dark:bg-surface-dark z-10 sticky top-0 flex-shrink-0">
        <div className="flex items-center gap-2 text-sm">
          <Link
            to="/doctor/queue"
            className="flex items-center gap-1 text-slate-500 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Queue
          </Link>
          <span className="material-symbols-outlined text-slate-400 text-[14px]">
            chevron_right
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Examination: {mockPatient.fullName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
            title="Patient History"
          >
            <span className="material-symbols-outlined text-[20px]">history</span>
          </button>
          <button
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
            title="More Options"
          >
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>
      </header>

      {/* Content Grid */}
      <div className="flex p-4 lg:p-6 flex-col lg:flex-row gap-6 pb-24">
        {/* LEFT COLUMN: Patient Info + History */}
        <div className="w-full lg:w-[380px] xl:w-[420px] flex flex-col gap-6 flex-shrink-0">
          {/* Patient Header Card */}
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex-shrink-0">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-start">
                <div className="bg-slate-200 dark:bg-slate-700 rounded-xl size-20 shadow-inner flex-shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-slate-400">person</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight truncate">
                    {mockPatient.fullName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded">
                      {mockPatient.gender}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded">
                      {mockPatient.age} Yrs
                    </span>
                  </div>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 font-mono">
                    ID: #{mockPatient.nationalId}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                    Weight
                  </p>
                  <p className="text-slate-900 dark:text-white font-semibold">
                    {mockPatient.weightKg} kg
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                    Height
                  </p>
                  <p className="text-slate-900 dark:text-white font-semibold">
                    {mockPatient.heightCm} cm
                  </p>
                </div>
                {mockPatient.allergies && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 col-span-2 flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">
                        Allergies
                      </p>
                      <p className="text-red-500 dark:text-red-400 font-semibold text-sm">
                        {mockPatient.allergies}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-red-400">warning</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* History Tabs & Timeline */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 px-2 bg-white dark:bg-surface-dark flex-shrink-0">
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-3 border-b-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  activeTab === 'history'
                    ? 'border-primary text-primary dark:text-primary font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 font-medium'
                }`}
              >
                Medical History
              </button>
              <button
                onClick={() => setActiveTab('lab')}
                className={`flex-1 py-3 border-b-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  activeTab === 'lab'
                    ? 'border-primary text-primary dark:text-primary font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 font-medium'
                }`}
              >
                Lab Results
              </button>
              <button
                onClick={() => setActiveTab('vitals')}
                className={`flex-1 py-3 border-b-2 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                  activeTab === 'vitals'
                    ? 'border-primary text-primary dark:text-primary font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 font-medium'
                }`}
              >
                Vitals
              </button>
            </div>

            {/* Timeline Content */}
            <div className="overflow-y-auto flex-1 p-4">
              {activeTab === 'history' && (
                <div className="relative">
                  {mockHistory.map((record, index) => {
                    const iconConfig =
                      historyIcons[record.serviceName || ''] || historyIcons.default;
                    const colorClasses = {
                      green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
                      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
                      purple:
                        'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
                    };

                    return (
                      <div key={record.id} className="flex gap-4 pb-6 group">
                        <div className="flex flex-col items-center">
                          <div
                            className={`size-8 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm z-10 ${
                              iconConfig
                                ? colorClasses[iconConfig.color as keyof typeof colorClasses]
                                : colorClasses.green
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {iconConfig?.icon ?? 'check_circle'}
                            </span>
                          </div>
                          {index < mockHistory.length - 1 && (
                            <div className="w-0.5 bg-slate-200 dark:bg-slate-700 h-full -my-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pt-1 pb-2">
                          <div className="flex justify-between items-start">
                            <h4 className="text-slate-900 dark:text-white font-semibold text-sm">
                              {record.diagnosis}
                            </h4>
                            <span className="text-slate-400 text-xs whitespace-nowrap">
                              {formatDate(record.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                            {record.doctorName} • {record.serviceName}
                          </p>
                          {record.conclusion && (
                            <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700/50 text-xs text-slate-600 dark:text-slate-300">
                              {record.conclusion}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {activeTab === 'lab' && (
                <div className="text-center py-10 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2">science</span>
                  <p>No lab results available</p>
                </div>
              )}
              {activeTab === 'vitals' && (
                <div className="text-center py-10 text-slate-500">
                  <span className="material-symbols-outlined text-4xl mb-2">monitor_heart</span>
                  <p>No vitals recorded</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Examination Form */}
        <div className="flex-1 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col relative">
          {/* Form Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800 z-10">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-slate-900 dark:text-white text-lg font-bold">
                  Current Examination
                </h2>
                <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-bold px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  In Progress
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                {new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                • {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Expand"
              >
                <span className="material-symbols-outlined">open_in_full</span>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 lg:p-8 pb-32">
            <form className="flex flex-col gap-8 max-w-4xl mx-auto">
              {/* Diagnosis Section */}
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        stethoscope
                      </span>
                      Chief Complaint / Symptoms
                    </label>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-24"
                      placeholder="Describe the patient's symptoms..."
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        clinical_notes
                      </span>
                      Diagnosis
                    </label>
                    <div className="relative">
                      <textarea
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-32"
                        placeholder="Enter clinical diagnosis..."
                      />
                      <div className="absolute bottom-3 right-3 flex gap-2">
                        <button
                          type="button"
                          className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                        >
                          + Acute
                        </button>
                        <button
                          type="button"
                          className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
                        >
                          + Chronic
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-primary">
                        assignment_turned_in
                      </span>
                      Conclusion / Doctor's Notes
                    </label>
                    <textarea
                      value={conclusion}
                      onChange={(e) => setConclusion(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-20"
                      placeholder="Final thoughts and next steps..."
                    />
                  </div>
                </div>
              </div>

              {/* Prescription Section */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="bg-primary/10 text-primary p-1 rounded-md">
                      <span className="material-symbols-outlined text-[20px]">prescriptions</span>
                    </span>
                    Prescription
                  </h3>
                  <button
                    type="button"
                    className="text-primary text-sm font-medium hover:text-primary-dark flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">print</span>
                    Print Rx
                  </button>
                </div>

                {/* Prescription Builder */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-4 px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    <div className="col-span-4">Medicine</div>
                    <div className="col-span-3">Dosage</div>
                    <div className="col-span-4">Note</div>
                    <div className="col-span-1 text-right">Action</div>
                  </div>

                  {/* Prescription Items */}
                  <div className="flex flex-col gap-3 mb-4">
                    {prescriptionItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-12 gap-4 items-center bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-primary/50 transition-colors"
                      >
                        <div className="col-span-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-400 text-[18px]">
                            pill
                          </span>
                          {item.medicationName}
                        </div>
                        <div className="col-span-3 text-sm text-slate-600 dark:text-slate-300">
                          {item.dosage}
                        </div>
                        <div className="col-span-4 text-sm text-slate-500 truncate">
                          {item.note}
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(item.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Input */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
                    <div className="lg:col-span-4">
                      <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                        Medicine Name
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-slate-400 text-[18px]">
                          search
                        </span>
                        <input
                          type="text"
                          value={medSearch}
                          onChange={(e) => setMedSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary focus:border-primary dark:text-white"
                          placeholder="Search..."
                        />
                      </div>
                    </div>
                    <div className="lg:col-span-3">
                      <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                        Dosage & Freq
                      </label>
                      <input
                        type="text"
                        value={newMedDosage}
                        onChange={(e) => setNewMedDosage(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary focus:border-primary dark:text-white"
                        placeholder="e.g. 10mg Daily"
                      />
                    </div>
                    <div className="lg:col-span-4">
                      <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                        Note
                      </label>
                      <input
                        type="text"
                        value={newMedNote}
                        onChange={(e) => setNewMedNote(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary focus:border-primary dark:text-white"
                        placeholder="Instruction"
                      />
                    </div>
                    <div className="lg:col-span-1">
                      <button
                        type="button"
                        onClick={handleAddMedication}
                        className="w-full h-[38px] flex items-center justify-center bg-primary hover:bg-primary-dark text-white rounded transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Sticky Footer Action Bar - Page Level */}
      <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 lg:px-8 lg:py-4 flex items-center justify-between z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link
          to="/doctor/queue"
          className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </Link>
        <div className="flex gap-3">
          <button
            type="button"
            className="px-5 py-2.5 rounded-lg bg-primary/10 text-primary dark:text-primary font-semibold text-sm hover:bg-primary/20 transition-colors border border-transparent"
          >
            Send to Lab
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handleComplete}
            className="px-6 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all shadow-md shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            Save &amp; Complete
          </button>
        </div>
      </div>
    </div>
  );
}
