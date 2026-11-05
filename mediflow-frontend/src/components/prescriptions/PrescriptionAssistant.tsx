import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { NearbyCareFinder } from '../patients/NearbyCareFinder';
import { describeError } from '../shared/AiSymptomChat';
import {
  deletePrescriptionUpload,
  extractPrescription,
  getPrescriptionFile,
  listPrescriptionUploads,
  searchDoctorsBySpecialization,
  uploadPrescription,
  verifyPrescription,
} from '../../services/prescriptionAssistantService';
import { AlertTriangle, FileSearch, Loader2, Plus, Trash2 } from 'lucide-react';

type Confidence = 'high' | 'low';

interface Extraction {
  isPrescription: boolean;
  legibility: 'clear' | 'partial' | 'unreadable';
  medications: { name: string; confidence: Confidence }[];
  findings: { text: string; confidence: Confidence }[];
  unreadableMedicationLines: number;
}

interface Navigation {
  suggestions: { specialization: string; strength: 'stronger' | 'possible'; reasons: string[] }[];
  uncertainty: string[];
  urgentNotice: string | null;
  disclaimer: string;
}

interface Upload {
  _id: string;
  mimeType: string;
  status: 'uploaded' | 'extracted' | 'needs_manual' | 'verified';
  extractionFailure: string | null;
  extraction: Extraction | null;
  verified: { medications: { name: string }[]; findings: string[] } | null;
  navigation: Navigation | null;
  hasFile: boolean;
  createdAt: string;
}

interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  experience?: number;
}

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

/** A quick check for instant feedback. The server inspects the file's content and has the final say. */
export function validatePrescriptionFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'Please choose a JPG, PNG or PDF file.';
  if (file.size === 0) return 'That file is empty.';
  if (file.size > MAX_FILE_BYTES) return 'Files can be up to 5 MB.';
  return null;
}

const MANUAL_REASONS: Record<string, string> = {
  not_a_prescription: "This doesn't look like a prescription. If it is one, you can type the details below.",
  unreadable: "We couldn't read this document. You can try a clearer photo, or type the details below.",
  extraction_unavailable: "We couldn't read your document automatically right now. You can type the details below.",
  budget_exceeded: "Automatic reading isn't available right now because today's limit was reached. You can type the details below.",
  budget_unavailable: "We couldn't read your document automatically right now. You can type the details below.",
  file_expired: 'Your original file has been deleted, as it was uploaded over a day ago. You can type the details below.',
};

const STRENGTH_LABEL = { stronger: 'Stronger match', possible: 'Possible match' };

type Row = { key: number; name: string; low: boolean };
type FindingRow = { key: number; text: string; low: boolean };

const VerifyForm: React.FC<{
  upload: Upload;
  busy: boolean;
  onSubmit: (details: { medications: { name: string }[]; findings: string[] }) => void;
}> = ({ upload, busy, onSubmit }) => {
  const nextKey = useRef(1000);
  const [medications, setMedications] = useState<Row[]>(() => {
    if (upload.verified) return upload.verified.medications.map((m, key) => ({ key, name: m.name, low: false }));
    return (upload.extraction?.medications ?? []).map((m, key) => ({ key, name: m.name, low: m.confidence === 'low' }));
  });
  const [findings, setFindings] = useState<FindingRow[]>(() => {
    if (upload.verified) return upload.verified.findings.map((text, key) => ({ key, text, low: false }));
    return (upload.extraction?.findings ?? []).map((f, key) => ({ key, text: f.text, low: f.confidence === 'low' }));
  });
  const [confirmed, setConfirmed] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const ids = useId();

  useEffect(() => {
    if (!upload.hasFile) return;
    const controller = new AbortController();
    let url: string | null = null;
    getPrescriptionFile(upload._id, controller.signal)
      .then((res) => {
        url = URL.createObjectURL(res.data);
        setPreview(url);
      })
      .catch(() => {}); // the preview helps, but checking can go on without it
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [upload._id, upload.hasFile]);

  const updateMedication = (key: number, name: string) =>
    setMedications((rows) => rows.map((r) => (r.key === key ? { ...r, name, low: false } : r)));
  const updateFinding = (key: number, text: string) =>
    setFindings((rows) => rows.map((r) => (r.key === key ? { ...r, text, low: false } : r)));

  const unreadable = upload.extraction?.unreadableMedicationLines ?? 0;
  const failureMessage = upload.extractionFailure ? MANUAL_REASONS[upload.extractionFailure] : null;
  const lowCount = medications.filter((m) => m.low).length + findings.filter((f) => f.low).length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      medications: medications.map((m) => ({ name: m.name.trim() })).filter((m) => m.name),
      findings: findings.map((f) => f.text.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {failureMessage && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-900">{failureMessage}</AlertDescription>
        </Alert>
      )}
      {!failureMessage && (
        <p className="text-sm text-gray-600">
          This was read automatically. Any of it can be wrong, even if it isn't marked, so please compare every line with
          your prescription and fix anything that doesn't match. We don't read doses: always follow the dose written on
          your prescription. Nothing is used until you confirm.
        </p>
      )}
      {(upload.extraction?.legibility === 'partial' || unreadable > 0) && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-700" aria-hidden="true" />
          <AlertDescription className="text-amber-900">
            {unreadable > 0
              ? `${unreadable} medicine ${unreadable === 1 ? 'line' : 'lines'} couldn't be read, so ${unreadable === 1 ? "it isn't" : "they aren't"} listed. Add ${unreadable === 1 ? 'it' : 'them'} below if you can read ${unreadable === 1 ? 'it' : 'them'}.`
              : 'Parts of this document were hard to read.'}
            {lowCount > 0 && ` ${lowCount} ${lowCount === 1 ? 'item is' : 'items are'} marked "Please check".`}
          </AlertDescription>
        </Alert>
      )}

      {preview &&
        (upload.mimeType === 'application/pdf' ? (
          <a href={preview} target="_blank" rel="noreferrer" className="text-sm text-green-700 underline">
            Open your PDF to compare
          </a>
        ) : (
          <img src={preview} alt="Your uploaded prescription" className="max-h-80 rounded-md border border-gray-200" />
        ))}

      <fieldset className="space-y-3">
        <legend className="font-medium text-gray-900 mb-2">Medicines</legend>
        {medications.length === 0 && <p className="text-sm text-gray-500">No medicines listed.</p>}
        {medications.map((m, i) => (
          <div key={m.key} className="rounded-md border border-gray-200 p-3 space-y-2">
            {m.low && <Badge className="bg-amber-100 text-amber-900 border-amber-200">Please check</Badge>}
            <div>
              <label htmlFor={`${ids}-med-${m.key}`} className="text-sm text-gray-700">
                Medicine {i + 1} name
              </label>
              <Input id={`${ids}-med-${m.key}`} value={m.name} maxLength={80} onChange={(e) => updateMedication(m.key, e.target.value)} />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setMedications((rows) => rows.filter((r) => r.key !== m.key))}>
              Remove medicine {i + 1}
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMedications((rows) => [...rows, { key: nextKey.current++, name: '', low: false }])}
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add a medicine
        </Button>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-medium text-gray-900 mb-2">Notes on your prescription (symptoms or conditions it mentions)</legend>
        {findings.length === 0 && <p className="text-sm text-gray-500">No notes listed.</p>}
        {findings.map((f, i) => (
          <div key={f.key} className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[12rem]">
              <label htmlFor={`${ids}-find-${f.key}`} className="text-sm text-gray-700">
                Note {i + 1} {f.low && <Badge className="bg-amber-100 text-amber-900 border-amber-200 ml-1">Please check</Badge>}
              </label>
              <Input id={`${ids}-find-${f.key}`} value={f.text} maxLength={200} onChange={(e) => updateFinding(f.key, e.target.value)} />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => setFindings((rows) => rows.filter((r) => r.key !== f.key))}>
              Remove note {i + 1}
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setFindings((rows) => [...rows, { key: nextKey.current++, text: '', low: false }])}
        >
          <Plus className="h-4 w-4" aria-hidden="true" /> Add a note
        </Button>
      </fieldset>

      <label className="flex items-start gap-2 text-sm text-gray-800">
        <input type="checkbox" className="mt-1" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
        I've checked these details against my prescription.
      </label>
      <Button type="submit" disabled={busy || !confirmed} className="bg-green-700 hover:bg-green-800 text-white">
        Show who I could talk to
      </Button>
    </form>
  );
};

const DoctorList: React.FC<{ specialization: string }> = ({ specialization }) => {
  const navigate = useNavigate();
  const [state, setState] = useState<{ status: 'loading' } | { status: 'error' } | { status: 'done'; doctors: Doctor[] }>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    searchDoctorsBySpecialization(specialization, controller.signal)
      .then((res) => setState({ status: 'done', doctors: res.data }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      });
    return () => controller.abort();
  }, [specialization]);

  if (state.status === 'loading') return <p className="text-sm text-gray-500">Looking for doctors...</p>;
  if (state.status === 'error') return <p className="text-sm text-gray-600">We couldn't load doctors right now. You can still search nearby below.</p>;
  if (state.doctors.length === 0) return <p className="text-sm text-gray-600">No doctors for this specialty at this clinic yet. You can search nearby below.</p>;

  return (
    <ul className="space-y-2">
      {state.doctors.map((d) => (
        <li key={d._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 p-3">
          <span className="text-sm text-gray-800">
            <span className="font-medium">{d.name}</span> · {d.specialization}
            {d.experience ? ` · ${d.experience} years` : ''}
          </span>
          <Button type="button" size="sm" variant="outline" onClick={() => navigate('/appointments', { state: { bookDoctorId: d._id } })}>
            Book with {d.name}
          </Button>
        </li>
      ))}
    </ul>
  );
};

const Results: React.FC<{ navigation: Navigation }> = ({ navigation }) => {
  const [selected, setSelected] = useState(navigation.suggestions[0]?.specialization ?? 'General Physician');

  return (
    <div className="space-y-5">
      {navigation.urgentNotice && (
        <Alert className="border-red-300 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" aria-hidden="true" />
          <AlertDescription className="text-red-800 font-medium">{navigation.urgentNotice}</AlertDescription>
        </Alert>
      )}

      <ul className="space-y-3">
        {navigation.suggestions.map((s) => (
          <li key={s.specialization} className="rounded-md border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="font-semibold text-gray-900">{s.specialization}</h3>
              <Badge variant="outline" className="border-gray-300 text-gray-700">{STRENGTH_LABEL[s.strength]}</Badge>
            </div>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              {s.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3"
              aria-pressed={selected === s.specialization}
              onClick={() => setSelected(s.specialization)}
            >
              See {s.specialization} doctors
            </Button>
          </li>
        ))}
      </ul>

      {navigation.uncertainty.length > 0 && (
        <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
          <h3 className="text-sm font-medium text-gray-900 mb-1">What we're unsure about</h3>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            {navigation.uncertainty.map((u) => <li key={u}>{u}</li>)}
          </ul>
        </div>
      )}

      <section aria-label={`${selected} doctors`} className="space-y-3">
        <h3 className="font-medium text-gray-900">{selected} doctors</h3>
        <DoctorList specialization={selected} />
        <NearbyCareFinder key={selected} category="general" keyword={selected} label={`Find ${selected} care nearby`} />
      </section>

      <p className="text-xs text-gray-600">{navigation.disclaimer}</p>
    </div>
  );
};

export const PrescriptionAssistant: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [fileError, setFileError] = useState('');
  const [current, setCurrent] = useState<Upload | null>(null);
  const [editing, setEditing] = useState(false);
  const [progress, setProgress] = useState<{ phase: 'uploading' | 'reading' | 'saving'; percent: number } | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Upload[]>([]);
  // The in-flight lock and the cancel handle, as in the symptom chat.
  const controllerRef = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ids = useId();

  const busy = progress !== null;
  const view = !current ? 'start' : current.status === 'verified' && !editing ? 'result' : current.status === 'uploaded' ? 'start' : 'verify';

  const refreshHistory = useCallback(() => {
    listPrescriptionUploads()
      .then((res) => setHistory(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshHistory();
    return () => controllerRef.current?.abort();
  }, [refreshHistory]);

  // A new step replaces most of the page, so move focus to its heading.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [view]);

  // The input is disabled while busy and can't take focus until the next render.
  const focusFileInputWhenEnabled = useRef(false);
  useEffect(() => {
    if (!busy && focusFileInputWhenEnabled.current) {
      focusFileInputWhenEnabled.current = false;
      fileInputRef.current?.focus();
    }
  }, [busy]);

  const startRequest = () => {
    if (controllerRef.current) return null;
    const controller = new AbortController();
    controllerRef.current = controller;
    setError('');
    return controller;
  };

  const readDocument = async (upload: Upload, controller: AbortController) => {
    setProgress({ phase: 'reading', percent: 100 });
    const res = await extractPrescription(upload._id, controller.signal);
    if (controller.signal.aborted) return;
    setCurrent(res.data);
    refreshHistory();
  };

  const run = async (work: (controller: AbortController) => Promise<void>) => {
    const controller = startRequest();
    if (!controller) return;
    try {
      await work(controller);
    } catch (err) {
      if (!controller.signal.aborted) setError(describeError(err));
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      if (!controller.signal.aborted) setProgress(null);
    }
  };

  const submitFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !consent) return;
    run(async (controller) => {
      setProgress({ phase: 'uploading', percent: 0 });
      const res = await uploadPrescription(file, {
        signal: controller.signal,
        onProgress: (percent: number) => setProgress({ phase: 'uploading', percent }),
      });
      if (controller.signal.aborted) return;
      setCurrent(res.data);
      await readDocument(res.data, controller);
    });
  };

  // After a failed read the file is already stored, so a retry resumes there.
  const retry = () => {
    if (current?.status === 'uploaded') run((controller) => readDocument(current, controller));
    else if (!current) submitFile({ preventDefault() {} } as React.FormEvent);
  };

  const remove = async (id: string) => {
    setError('');
    try {
      await deletePrescriptionUpload(id);
      if (current?._id === id) reset();
      refreshHistory();
    } catch (err) {
      setError(describeError(err));
    }
  };

  const cancel = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setProgress(null);
    // If the file already reached the server, don't leave it behind.
    if (current) {
      deletePrescriptionUpload(current._id).catch(() => {});
      setCurrent(null);
    }
    refreshHistory();
    focusFileInputWhenEnabled.current = true;
  };

  const reset = () => {
    setCurrent(null);
    setEditing(false);
    setFile(null);
    setConsent(false);
    setError('');
    setFileError('');
  };

  const submitVerification = (details: { medications: { name: string }[]; findings: string[] }) => {
    if (!current) return;
    const id = current._id;
    run(async (controller) => {
      setProgress({ phase: 'saving', percent: 100 });
      const res = await verifyPrescription(id, details, controller.signal);
      if (controller.signal.aborted) return;
      setCurrent(res.data);
      setEditing(false);
      refreshHistory();
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0] ?? null;
    const problem = chosen ? validatePrescriptionFile(chosen) : null;
    setFileError(problem ?? '');
    setFile(problem ? null : chosen);
  };

  const heading = view === 'start' ? 'Upload your prescription' : view === 'verify' ? 'Check the details' : 'Who you could talk to';

  return (
    <div className="space-y-6">
      <Card className="border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <FileSearch className="h-5 w-5 text-green-700" aria-hidden="true" />
            Prescription Assistant
          </CardTitle>
          <CardDescription>
            Upload a prescription, check what we read from it, and see which kind of doctor you could talk to. This
            doesn't diagnose anything or recommend medicines.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h2 ref={headingRef} tabIndex={-1} className="text-lg font-semibold text-gray-900 outline-none">
            {heading}
          </h2>

          {view === 'start' && (
            <form onSubmit={submitFile} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor={`${ids}-file`} className="text-sm font-medium text-gray-800">
                  Prescription file (JPG, PNG or PDF, up to 5 MB)
                </label>
                <input
                  ref={fileInputRef}
                  id={`${ids}-file`}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={onFileChange}
                  disabled={busy}
                  aria-invalid={!!fileError}
                  aria-describedby={fileError ? `${ids}-file-error` : undefined}
                  className="block w-full text-sm text-gray-700"
                />
                {fileError && <p id={`${ids}-file-error`} role="alert" className="text-sm text-red-700">{fileError}</p>}
              </div>

              <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 space-y-2">
                <p className="font-medium text-gray-900">Before you upload</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Your document is sent to OpenAI, a third-party AI provider, to read it.</li>
                  <li>Only you can open it here. Clinic staff can't.</li>
                  <li>The original is deleted when you confirm the details, or after 24 hours at the latest.</li>
                  <li>The details you confirm are deleted after 30 days. You can delete them sooner at any time.</li>
                  <li>This is a demo. Please don't upload real personal or medical documents.</li>
                </ul>
                <label className="flex items-start gap-2 pt-1 text-gray-900">
                  <input type="checkbox" className="mt-1" checked={consent} disabled={busy} onChange={(e) => setConsent(e.target.checked)} />
                  I agree to my document being processed this way.
                </label>
              </div>

              <Button type="submit" disabled={busy || !file || !consent} className="bg-green-700 hover:bg-green-800 text-white">
                Upload and read
              </Button>
            </form>
          )}

          {view === 'verify' && current && <VerifyForm key={current._id} upload={current} busy={busy} onSubmit={submitVerification} />}

          {view === 'result' && current?.navigation && (
            <div className="space-y-4">
              <Results navigation={current.navigation} />
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>Correct the details</Button>
                <Button type="button" variant="outline" size="sm" onClick={reset}>Upload another</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => remove(current._id)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete this data
                </Button>
              </div>
            </div>
          )}

          {/* Always rendered: a live region only announces changes to content it already contains. */}
          <div role="status" aria-live="polite" className="space-y-2">
            {progress && (
              <p className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 text-green-700 animate-spin" aria-hidden="true" />
                {progress.phase === 'uploading' && `Uploading... ${progress.percent}%`}
                {progress.phase === 'reading' && 'Reading your document. This can take up to 30 seconds...'}
                {progress.phase === 'saving' && 'Saving your details...'}
              </p>
            )}
          </div>
          {progress?.phase === 'uploading' && <Progress value={progress.percent} aria-label="Upload progress" />}
          {busy && progress?.phase !== 'saving' && (
            <Button type="button" variant="outline" size="sm" onClick={cancel}>Cancel</Button>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                <span>{error}</span>
                {view === 'start' && <Button type="button" variant="outline" size="sm" onClick={retry}>Try again</Button>}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card className="border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base text-gray-900">Your saved uploads</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {history.map((h) => {
                const date = new Date(h.createdAt).toLocaleDateString();
                return (
                  <li key={h._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-100 p-2 text-sm">
                    <span className="text-gray-700">
                      {date} · {h.navigation?.suggestions[0]?.specialization ?? 'Not finished'}
                    </span>
                    <span className="flex gap-2">
                      <Button type="button" size="sm" variant="ghost" onClick={() => { setError(''); setEditing(false); setCurrent(h); }}>
                        Open upload from {date}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => remove(h._id)}>
                        Delete upload from {date}
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
