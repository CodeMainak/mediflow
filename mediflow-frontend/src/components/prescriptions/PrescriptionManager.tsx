import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  FileText,
  Pill,
  Download,
  Plus,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { mockPrescriptions, mockPatients, mockUsers } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import { PrescriptionForm } from "./PrescriptionForm";
import { getMyPrescriptions, getPatientPrescriptions } from "../../services/prescriptionService";
import { toast } from "sonner";

export const PrescriptionManager: React.FC = () => {
  const { user } = useAuth();
  const [selectedPrescription, setSelectedPrescription] = useState<string | null>(
    null
  );
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrescription, setEditingPrescription] = useState<any | null>(null);

  // Fetch prescriptions from API
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const response = await getMyPrescriptions();
        const prescriptionsData = Array.isArray(response.data) ? response.data : [];
        setPrescriptions(prescriptionsData);
      } catch (err: any) {
        toast.error('Failed to load prescriptions');
        // Fallback to mock data if API fails
        const filtered = mockPrescriptions.filter((presc) => {
          if (user?.role?.toLowerCase() === "doctor") {
            return presc.doctorId === user.id;
          } else if (user?.role?.toLowerCase() === "patient") {
            return presc.patientId === user.id;
          }
          return false;
        });
        setPrescriptions(filtered);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPrescriptions();
    }
  }, [user]);

  // Refresh prescriptions
  const refreshPrescriptions = async () => {
    try {
      const response = await getMyPrescriptions();
      const prescriptionsData = Array.isArray(response.data) ? response.data : [];
      setPrescriptions(prescriptionsData);
    } catch (err) {
    }
  };

  // Download prescription as PDF/text
  const handleDownloadPDF = (prescription: any) => {
    try {
      const patient = typeof prescription.patient === 'object' ? prescription.patient : { name: 'Unknown Patient' };
      const doctor = typeof prescription.doctor === 'object' ? prescription.doctor : { name: 'Unknown Doctor' };
      const medicines = prescription.medicines || prescription.medications || [];

      // Create prescription text content
      let content = `PRESCRIPTION\n`;
      content += `${'='.repeat(50)}\n\n`;
      content += `Date: ${new Date(prescription.createdAt || prescription.date).toLocaleDateString()}\n`;
      content += `Patient: ${patient.name || 'Unknown'}\n`;
      content += `Doctor: Dr. ${doctor.name || 'Unknown'}\n`;
      if (doctor.specialization) content += `Specialization: ${doctor.specialization}\n`;
      content += `\n${'='.repeat(50)}\n\n`;

      if (prescription.diagnosis) {
        content += `DIAGNOSIS:\n${prescription.diagnosis}\n\n`;
      }

      content += `MEDICATIONS:\n`;
      content += `${'-'.repeat(50)}\n`;
      medicines.forEach((med: any, index: number) => {
        content += `\n${index + 1}. ${med.name}\n`;
        content += `   Dosage: ${med.dosage}\n`;
        if (med.frequency) content += `   Frequency: ${med.frequency}\n`;
        content += `   Duration: ${med.duration}\n`;
        if (med.instructions) content += `   Instructions: ${med.instructions}\n`;
      });

      if (prescription.notes) {
        content += `\n${'='.repeat(50)}\n`;
        content += `NOTES:\n${prescription.notes}\n`;
      }

      content += `\n${'='.repeat(50)}\n`;
      content += `\nThis is a digitally generated prescription.\n`;

      // Create and download file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription_${patient.name?.replace(/\s+/g, '_')}_${new Date().getTime()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Prescription downloaded successfully!');
    } catch (err) {
      toast.error('Failed to download prescription');
    }
  };

  // Handle edit prescription
  const handleEditPrescription = (prescription: any) => {
    setEditingPrescription(prescription);
    setPrescriptionDialogOpen(true);
  };

  // Sort prescriptions by date
  const sortedPrescriptions = [...prescriptions].sort(
    (a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
  );

  const selectedPrescriptionData = selectedPrescription
    ? prescriptions.find((p) => p._id === selectedPrescription || p.id === selectedPrescription)
    : null;

  const getStatusBadge = (prescription: any) => {
    const prescDate = new Date(prescription.createdAt || prescription.date);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - prescDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 7) {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center">
          <CheckCircle className="h-3 w-3 mr-1" />
          Recent
        </Badge>
      );
    } else if (daysDiff <= 30) {
      return (
        <Badge className="bg-blue-100 text-blue-800 flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gray-100 text-gray-700 flex items-center">
          <FileText className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-green-700 flex items-center">
            <Pill className="h-7 w-7 text-green-600 mr-2" />
            {user?.role?.toLowerCase() === "patient"
              ? "My Prescriptions"
              : "Prescription Management"}
          </h2>
          <p className="text-gray-500 mt-1">
            {user?.role?.toLowerCase() === "patient"
              ? "View your current and past prescriptions"
              : "Create, track, and manage patient prescriptions"}
          </p>
        </div>

        {user?.role?.toLowerCase() === "doctor" && (
          <Dialog
            open={prescriptionDialogOpen}
            onOpenChange={(open) => {
              setPrescriptionDialogOpen(open);
              if (!open) {
                setEditingPrescription(null); // Reset editing state when closing
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="flex items-center bg-green-600 text-white hover:bg-green-700 shadow-md mt-4 md:mt-0">
                <Plus className="mr-2 h-4 w-4" />
                New Prescription
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center text-xl text-emerald-700">
                  <Pill className="mr-2 h-5 w-5" />
                  {editingPrescription ? 'Edit Prescription' : 'Create New Prescription'}
                </DialogTitle>
                <DialogDescription>
                  {editingPrescription ? 'Update medications and instructions' : 'Add medications and instructions for your patient'}
                </DialogDescription>
              </DialogHeader>
              <PrescriptionForm
                prescription={editingPrescription}
                onSuccess={() => {
                  setPrescriptionDialogOpen(false);
                  setEditingPrescription(null);
                  refreshPrescriptions(); // Refresh the prescriptions list
                }}
                onCancel={() => {
                  setPrescriptionDialogOpen(false);
                  setEditingPrescription(null);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PRESCRIPTION LIST */}
        <div className="lg:col-span-2">
          <Card className="shadow-md border border-gray-200 rounded-xl overflow-hidden">
            <CardHeader className="bg-green-50 rounded-t-xl p-4">
              <CardTitle className="flex items-center text-green-900">
                <Pill className="h-6 w-6 text-green-600 mr-2" />
                Medical Prescriptions
              </CardTitle>
              <CardDescription className="text-green-700">
                {loading ? 'Loading...' : `${sortedPrescriptions.length} total prescriptions`}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              ) : sortedPrescriptions.map((prescription) => {
                // Handle both populated objects and IDs
                const patient = typeof prescription.patient === 'object' && prescription.patient !== null
                  ? prescription.patient
                  : mockPatients.find((p) => p.id === prescription.patient || p._id === prescription.patient);

                const doctor = typeof prescription.doctor === 'object' && prescription.doctor !== null
                  ? prescription.doctor
                  : mockUsers.find((u) => u.id === prescription.doctor || u._id === prescription.doctor);

                const prescriptionId = prescription._id || prescription.id;
                const isSelected = selectedPrescription === prescriptionId;

                return (
                  <div
                    key={prescriptionId}
                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md transform hover:scale-[1.01] ${isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                      }`}
                    onClick={() => setSelectedPrescription(prescriptionId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                          <Pill className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-800">
                              {prescription.diagnosis || prescription.notes?.substring(0, 50) || 'Prescription'}
                            </h3>
                            {getStatusBadge(prescription)}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-2">
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {user?.role?.toLowerCase() === "patient"
                                ? `Dr. ${doctor?.name || 'Unknown'}`
                                : patient?.name || 'Unknown Patient'}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(prescription.createdAt || prescription.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Pill className="h-3 w-3 mr-1" />
                              {prescription.medicines?.length || prescription.medications?.length || 0} meds
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        {prescription.followUpDate && (
                          <div className="text-xs text-center">
                            <div className="text-gray-400">Follow-up</div>
                            <div className="font-medium text-gray-700">
                              {new Date(
                                prescription.followUpDate
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(prescription);
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            PDF
                          </Button>
                          {user?.role?.toLowerCase() === "doctor" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex items-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditPrescription(prescription);
                              }}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!loading && sortedPrescriptions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <p>
                    {user?.role?.toLowerCase() === "patient"
                      ? "No prescriptions found"
                      : "No prescriptions created yet"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* PRESCRIPTION DETAILS */}
        <div className="lg:col-span-1">
          {selectedPrescriptionData ? (
            <Card className="shadow-lg rounded-xl border border-gray-200 animate-fadeIn">
              <CardHeader className="p-4 border-b border-gray-200">
                <CardTitle className="flex items-center text-gray-800">
                  <FileText className="mr-2 h-5 w-5 text-green-600" />
                  Prescription Details
                </CardTitle>
                <CardDescription className="text-gray-500">
                  {new Date(
                    selectedPrescriptionData.createdAt || selectedPrescriptionData.date
                  ).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {/* Diagnosis / Notes */}
                {(selectedPrescriptionData.diagnosis || selectedPrescriptionData.notes) && (
                  <div>
                    <h4 className="font-semibold text-gray-700 text-sm mb-2">
                      {selectedPrescriptionData.diagnosis ? 'Diagnosis' : 'Notes'}
                    </h4>
                    <p className="text-sm p-3 bg-green-50 rounded border-l-4 border-green-400">
                      {selectedPrescriptionData.diagnosis || selectedPrescriptionData.notes}
                    </p>
                  </div>
                )}

                {/* Doctor */}
                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">
                    Prescribed By
                  </h4>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8 ring-2 ring-green-400">
                      <AvatarFallback className="bg-green-100 text-green-700 font-bold">
                        {(() => {
                          const doctor = typeof selectedPrescriptionData.doctor === 'object' && selectedPrescriptionData.doctor !== null
                            ? selectedPrescriptionData.doctor
                            : mockUsers.find((u) => u.id === selectedPrescriptionData.doctor || u._id === selectedPrescriptionData.doctor);

                          return doctor?.name?.split(" ").map((n: string) => n[0]).join("") || 'DR';
                        })()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Dr. {(() => {
                          const doctor = typeof selectedPrescriptionData.doctor === 'object' && selectedPrescriptionData.doctor !== null
                            ? selectedPrescriptionData.doctor
                            : mockUsers.find((u) => u.id === selectedPrescriptionData.doctor || u._id === selectedPrescriptionData.doctor);
                          return doctor?.name || 'Unknown Doctor';
                        })()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(() => {
                          const doctor = typeof selectedPrescriptionData.doctor === 'object' && selectedPrescriptionData.doctor !== null
                            ? selectedPrescriptionData.doctor
                            : mockUsers.find((u) => u.id === selectedPrescriptionData.doctor || u._id === selectedPrescriptionData.doctor);
                          return doctor?.specialization || 'General Practitioner';
                        })()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <h4 className="font-semibold text-gray-700 text-sm mb-2">
                    Medications
                  </h4>
                  <div className="space-y-2">
                    {(selectedPrescriptionData.medicines || selectedPrescriptionData.medications || []).map((med: any, index: number) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                      >
                        <div className="font-medium text-gray-800">
                          {med.name}
                        </div>
                        <div className="text-xs text-gray-500 space-y-1 mt-1">
                          <div>💊 Dosage: {med.dosage}</div>
                          {med.frequency && <div>⏰ Frequency: {med.frequency}</div>}
                          <div>📅 Duration: {med.duration}</div>
                          {med.instructions && (
                            <div className="text-blue-600">
                              📌 {med.instructions}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Notes (only if we have both diagnosis and notes) */}
                {selectedPrescriptionData.diagnosis && selectedPrescriptionData.notes && (
                  <div>
                    <h4 className="font-semibold text-gray-700 text-sm mb-2">
                      Additional Notes
                    </h4>
                    <p className="text-sm p-3 bg-yellow-50 rounded border-l-4 border-yellow-400 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
                      {selectedPrescriptionData.notes}
                    </p>
                  </div>
                )}

                {/* Follow-up */}
                {selectedPrescriptionData.followUpDate && (
                  <div>
                    <h4 className="font-semibold text-gray-700 text-sm mb-2">
                      Follow-up Date
                    </h4>
                    <div className="flex items-center text-sm p-3 bg-blue-50 rounded">
                      <Clock className="h-4 w-4 mr-2 text-blue-600" />
                      {new Date(
                        selectedPrescriptionData.followUpDate
                      ).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-4">
                  <Button
                    className="flex-1 flex items-center justify-center bg-green-600 text-white hover:bg-green-700 shadow-md"
                    onClick={() => handleDownloadPDF(selectedPrescriptionData)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download PDF
                  </Button>
                  {user?.role?.toLowerCase() === "patient" && (
                    <Button
                      variant="outline"
                      className="flex-1 flex items-center justify-center"
                      onClick={() => toast.info('Request refill functionality coming soon!')}
                    >
                      <Calendar className="h-4 w-4 mr-1" />
                      Request Refill
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-md rounded-xl border border-gray-200 h-64 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p>Select a prescription to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
