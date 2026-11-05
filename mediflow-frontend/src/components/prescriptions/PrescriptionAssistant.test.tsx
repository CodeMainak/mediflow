import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { PrescriptionAssistant, validatePrescriptionFile, MAX_FILE_BYTES } from './PrescriptionAssistant';

const service = vi.hoisted(() => ({
  uploadPrescription: vi.fn(),
  extractPrescription: vi.fn(),
  verifyPrescription: vi.fn(),
  listPrescriptionUploads: vi.fn(),
  getPrescriptionFile: vi.fn(),
  deletePrescriptionUpload: vi.fn(),
  searchDoctorsBySpecialization: vi.fn(),
}));
vi.mock('../../services/prescriptionAssistantService', () => service);
vi.mock('../patients/NearbyCareFinder', () => ({
  NearbyCareFinder: ({ keyword }: { keyword: string }) => <p>Nearby search for {keyword}</p>,
}));

const png = () => new File(['png-bytes'], 'scan.png', { type: 'image/png' });

const uploaded = { _id: 'u1', mimeType: 'image/png', status: 'uploaded', extractionFailure: null, extraction: null, verified: null, navigation: null, hasFile: true, createdAt: '2026-11-05T10:00:00Z' };
const extracted = {
  ...uploaded,
  status: 'extracted',
  extraction: {
    isPrescription: true,
    legibility: 'partial',
    medications: [
      { name: 'Salbutamol', confidence: 'high' },
      { name: 'Montel?kast', confidence: 'low' },
    ],
    findings: [{ text: 'wheezing', confidence: 'high' }],
    unreadableMedicationLines: 1,
  },
};
const navigation = {
  suggestions: [
    { specialization: 'Pulmonology', strength: 'stronger', reasons: ['You confirmed this note from your prescription: "wheezing".'] },
    { specialization: 'Cardiology', strength: 'possible', reasons: ['Amlodipine is a medicine often managed by this kind of doctor.'] },
  ],
  uncertainty: ['Your details point to more than one kind of doctor.'],
  urgentNotice: null,
  disclaimer: "It isn't a diagnosis or medical advice.",
};
const verified = { ...uploaded, status: 'verified', hasFile: false, verified: { medications: [{ name: 'Salbutamol' }], findings: ['wheezing'] }, navigation };

const Where = () => {
  const location = useLocation();
  return <p>Now at {location.pathname} with {JSON.stringify(location.state)}</p>;
};

function setup() {
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<PrescriptionAssistant />} />
        <Route path="/appointments" element={<Where />} />
      </Routes>
    </MemoryRouter>
  );
  return { user, ...utils };
}

async function chooseFileAndConsent(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(screen.getByLabelText(/Prescription file/), png());
  await user.click(screen.getByRole('checkbox', { name: /I agree/ }));
}

async function reachVerify(user: ReturnType<typeof userEvent.setup>) {
  service.uploadPrescription.mockResolvedValue({ data: uploaded });
  service.extractPrescription.mockResolvedValue({ data: extracted });
  await chooseFileAndConsent(user);
  await user.click(screen.getByRole('button', { name: 'Upload and read' }));
  await screen.findByRole('heading', { name: 'Check the details' });
}

/** A request the test settles by hand, which rejects when aborted, like axios. */
function pendingRequest() {
  let signal: AbortSignal | undefined;
  const calls: { resolve: (v: unknown) => void }[] = [];
  const impl = (...args: any[]) => new Promise((resolve, reject) => {
    signal = args.find((a) => a instanceof AbortSignal) ?? args.find((a) => a?.signal)?.signal;
    calls.push({ resolve });
    signal?.addEventListener('abort', () => reject(Object.assign(new Error('canceled'), { name: 'CanceledError' })));
  });
  return { impl, calls, signal: () => signal };
}

describe('validatePrescriptionFile', () => {
  it.each([
    ['image/jpeg', 'a.jpg', 10, null],
    ['image/png', 'a.png', 10, null],
    ['application/pdf', 'a.pdf', 10, null],
    ['image/gif', 'a.gif', 10, 'Please choose a JPG, PNG or PDF file.'],
    ['text/html', 'a.png', 10, 'Please choose a JPG, PNG or PDF file.'],
    ['image/png', 'a.png', 0, 'That file is empty.'],
    ['image/png', 'a.png', MAX_FILE_BYTES + 1, 'Files can be up to 5 MB.'],
  ])('should check %s named %s of %i bytes', (type, name, size, expected) => {
    const file = new File(['x'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    expect(validatePrescriptionFile(file)).toBe(expected);
  });
});

describe('PrescriptionAssistant', () => {
  beforeEach(() => {
    Object.values(service).forEach((fn) => fn.mockReset());
    service.listPrescriptionUploads.mockResolvedValue({ data: [] });
    service.getPrescriptionFile.mockRejectedValue(new Error('no preview in this test'));
    service.searchDoctorsBySpecialization.mockResolvedValue({ data: [] });
    service.deletePrescriptionUpload.mockResolvedValue({ data: {} });
  });

  describe('upload', () => {
    it('should not allow upload until there is a file and consent', async () => {
      const { user } = setup();
      const submit = screen.getByRole('button', { name: 'Upload and read' });

      expect(submit).toBeDisabled();
      await user.upload(screen.getByLabelText(/Prescription file/), png());
      expect(submit).toBeDisabled();
      await user.click(screen.getByRole('checkbox', { name: /I agree/ }));
      expect(submit).toBeEnabled();
    });

    it('should tell the patient about the third party and retention before they consent', () => {
      setup();

      expect(screen.getByText(/Only upload a prescription.*sent to OpenAI, a third-party AI provider.*uploaded by mistake/)).toBeInTheDocument();
      expect(screen.getByText(/deleted when you confirm the details, or after 24 hours.*deleted straight away/)).toBeInTheDocument();
      expect(screen.getByText(/deleted after 30 days/)).toBeInTheDocument();
    });

    it('should explain a rejected file and link the error to the input', () => {
      setup();
      const input = screen.getByLabelText(/Prescription file/);

      fireEvent.change(input, { target: { files: [new File(['x'], 'a.gif', { type: 'image/gif' })] } });

      expect(screen.getByRole('alert')).toHaveTextContent('JPG, PNG or PDF');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAccessibleDescription(/JPG, PNG or PDF/);
      expect(screen.getByRole('button', { name: 'Upload and read' })).toBeDisabled();
    });

    it('should show upload progress in the live region', async () => {
      const { user } = setup();
      const request = pendingRequest();
      let progress: (n: number) => void = () => {};
      service.uploadPrescription.mockImplementation((_file: File, options: any) => {
        progress = options.onProgress;
        return request.impl(options);
      });
      await chooseFileAndConsent(user);

      await user.click(screen.getByRole('button', { name: 'Upload and read' }));
      act(() => progress(40));

      expect(screen.getByRole('status')).toHaveTextContent('Uploading... 40%');
      expect(screen.getByRole('progressbar', { name: 'Upload progress' })).toBeInTheDocument();
    });

    it('should send only once when submitted twice in the same tick', async () => {
      const { user } = setup();
      const request = pendingRequest();
      service.uploadPrescription.mockImplementation((_f: File, o: any) => request.impl(o));
      await chooseFileAndConsent(user);
      const form = screen.getByRole('button', { name: 'Upload and read' }).closest('form')!;

      fireEvent.submit(form);
      fireEvent.submit(form);

      expect(service.uploadPrescription).toHaveBeenCalledTimes(1);
    });

    it('should abort on Cancel and delete a file that already reached the server', async () => {
      const { user } = setup();
      const request = pendingRequest();
      service.uploadPrescription.mockResolvedValue({ data: uploaded });
      service.extractPrescription.mockImplementation((_id: string, signal: AbortSignal) => request.impl(signal));
      await chooseFileAndConsent(user);
      await user.click(screen.getByRole('button', { name: 'Upload and read' }));
      await screen.findByText(/Reading your document/);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(request.signal()?.aborted).toBe(true);
      expect(service.deletePrescriptionUpload).toHaveBeenCalledWith('u1');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByLabelText(/Prescription file/)).toHaveFocus();
    });

    it('should abort the request when the page unmounts', async () => {
      const { user, unmount } = setup();
      const request = pendingRequest();
      service.uploadPrescription.mockImplementation((_f: File, o: any) => request.impl(o));
      await chooseFileAndConsent(user);
      await user.click(screen.getByRole('button', { name: 'Upload and read' }));

      unmount();

      expect(request.signal()?.aborted).toBe(true);
    });

    it('should retry reading without uploading again', async () => {
      const { user } = setup();
      service.uploadPrescription.mockResolvedValue({ data: uploaded });
      service.extractPrescription.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValue({ data: extracted });
      await chooseFileAndConsent(user);
      await user.click(screen.getByRole('button', { name: 'Upload and read' }));

      expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't reach the server");
      await user.click(screen.getByRole('button', { name: 'Try again' }));

      await screen.findByRole('heading', { name: 'Check the details' });
      expect(service.uploadPrescription).toHaveBeenCalledTimes(1);
      expect(service.extractPrescription).toHaveBeenCalledTimes(2);
    });

    it("should show the server's reason for a rejected file", async () => {
      const { user } = setup();
      service.uploadPrescription.mockRejectedValue({ response: { status: 415, data: { msg: 'Only JPG, PNG and PDF files are supported.' } } });
      await chooseFileAndConsent(user);

      await user.click(screen.getByRole('button', { name: 'Upload and read' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Only JPG, PNG and PDF');
    });
  });

  describe('verification', () => {
    it('should show what was read, with focus on the new step', async () => {
      const { user } = setup();
      await reachVerify(user);

      expect(screen.getByRole('heading', { name: 'Check the details' })).toHaveFocus();
      expect(screen.getByLabelText('Medicine 1 name')).toHaveValue('Salbutamol');
      expect(screen.getByLabelText('Note 1')).toHaveValue('wheezing');
    });

    it("should not ask for doses, and should say to follow the prescription's own", async () => {
      const { user } = setup();
      await reachVerify(user);

      expect(screen.queryByLabelText(/dose/i)).not.toBeInTheDocument();
      expect(screen.getByText(/always follow the dose written on your prescription/)).toBeInTheDocument();
    });

    it('should flag uncertain items and unreadable lines', async () => {
      const { user } = setup();
      await reachVerify(user);

      expect(screen.getByText('Please check')).toBeInTheDocument();
      expect(screen.getByText(/1 medicine line couldn't be read/)).toBeInTheDocument();
    });

    it('should clear the flag once the patient corrects the item', async () => {
      const { user } = setup();
      await reachVerify(user);

      await user.clear(screen.getByLabelText('Medicine 2 name'));
      await user.type(screen.getByLabelText('Medicine 2 name'), 'Montelukast');

      expect(screen.queryByText('Please check')).not.toBeInTheDocument();
    });

    it('should need confirmation, then send the corrected values and show the results', async () => {
      const { user } = setup();
      service.verifyPrescription.mockResolvedValue({ data: verified });
      await reachVerify(user);
      const submit = screen.getByRole('button', { name: 'Show who I could talk to' });
      expect(submit).toBeDisabled();

      await user.clear(screen.getByLabelText('Medicine 1 name'));
      await user.type(screen.getByLabelText('Medicine 1 name'), 'Albuterol');
      await user.click(screen.getByRole('button', { name: 'Remove medicine 2' }));
      await user.click(screen.getByRole('button', { name: 'Add a medicine' }));
      await user.type(screen.getByLabelText('Medicine 2 name'), 'Budesonide');
      await user.click(screen.getByRole('button', { name: 'Add a note' }));
      await user.click(screen.getByRole('checkbox', { name: /I've checked/ }));
      await user.click(submit);

      expect(service.verifyPrescription).toHaveBeenCalledWith(
        'u1',
        {
          medications: [{ name: 'Albuterol' }, { name: 'Budesonide' }],
          findings: ['wheezing'], // the blank new note is dropped
        },
        expect.any(AbortSignal)
      );
      expect(await screen.findByRole('heading', { name: 'Who you could talk to' })).toHaveFocus();
    });

    it.each([
      ['extraction_unavailable', /couldn't read your document automatically/],
      ['budget_exceeded', /today's limit was reached/],
      ['not_a_prescription', /doesn't look like a prescription, so nothing was read/],
      ['unreadable', /try a clearer photo/],
      ['file_expired', /original file has been deleted/],
    ])('should offer manual entry on %s', async (extractionFailure, message) => {
      const { user } = setup();
      service.uploadPrescription.mockResolvedValue({ data: uploaded });
      service.extractPrescription.mockResolvedValue({ data: { ...uploaded, status: 'needs_manual', extractionFailure } });
      await chooseFileAndConsent(user);
      await user.click(screen.getByRole('button', { name: 'Upload and read' }));

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add a medicine' })).toBeInTheDocument();
      expect(screen.getByText('No medicines listed.')).toBeInTheDocument();
    });

    it.each([
      [false, true],
      [true, false],
    ])('should say the file was deleted only when the server confirms it (hasFile %s)', async (hasFile, saysDeleted) => {
      const { user } = setup();
      service.uploadPrescription.mockResolvedValue({ data: uploaded });
      service.extractPrescription.mockResolvedValue({ data: { ...uploaded, status: 'needs_manual', extractionFailure: 'not_a_prescription', hasFile } });
      await chooseFileAndConsent(user);
      await user.click(screen.getByRole('button', { name: 'Upload and read' }));

      const message = await screen.findByText(/doesn't look like a prescription/);
      expect(message.textContent?.includes("We've deleted the file.")).toBe(saysDeleted);
    });

    it('should show the original as an authenticated preview and revoke the URL afterwards', async () => {
      const createObjectURL = vi.fn(() => 'blob:preview');
      const revokeObjectURL = vi.fn();
      vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
      service.getPrescriptionFile.mockResolvedValue({ data: new Blob(['x']) });
      const { user, unmount } = setup();
      await reachVerify(user);

      expect(await screen.findByAltText('Your uploaded prescription')).toHaveAttribute('src', 'blob:preview');
      unmount();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:preview');
      vi.unstubAllGlobals();
    });
  });

  describe('results', () => {
    async function reachResults(user: ReturnType<typeof userEvent.setup>, data = verified) {
      service.verifyPrescription.mockResolvedValue({ data });
      await reachVerify(user);
      await user.click(screen.getByRole('checkbox', { name: /I've checked/ }));
      await user.click(screen.getByRole('button', { name: 'Show who I could talk to' }));
      await screen.findByRole('heading', { name: 'Who you could talk to' });
    }

    it('should explain each suggestion, its strength, the uncertainty and the disclaimer', async () => {
      const { user } = setup();
      await reachResults(user);

      expect(screen.getByRole('heading', { name: 'Pulmonology' })).toBeInTheDocument();
      expect(screen.getByText('Stronger match')).toBeInTheDocument();
      expect(screen.getByText('Possible match')).toBeInTheDocument();
      expect(screen.getByText(/You confirmed this note/)).toBeInTheDocument();
      expect(screen.getByText(/point to more than one kind of doctor/)).toBeInTheDocument();
      expect(screen.getByText(/isn't a diagnosis/)).toBeInTheDocument();
    });

    it('should show an urgent notice first when there is one', async () => {
      const { user } = setup();
      await reachResults(user, { ...verified, navigation: { ...navigation, urgentNotice: 'call your local emergency number' } });

      expect(screen.getByText('call your local emergency number')).toBeInTheDocument();
    });

    it('should search doctors for the top suggestion and link to booking', async () => {
      service.searchDoctorsBySpecialization.mockResolvedValue({ data: [{ _id: 'd1', name: 'Dr. Lung', specialization: 'Pulmonology', experience: 7 }] });
      const { user } = setup();
      await reachResults(user);

      await user.click(await screen.findByRole('button', { name: 'Book with Dr. Lung' }));

      expect(screen.getByText('Now at /appointments with {"bookDoctorId":"d1"}')).toBeInTheDocument();
    });

    it('should switch doctor search to another suggestion', async () => {
      const { user } = setup();
      await reachResults(user);

      await user.click(screen.getByRole('button', { name: 'See Cardiology doctors' }));

      await waitFor(() => expect(service.searchDoctorsBySpecialization).toHaveBeenCalledWith('Cardiology', expect.any(AbortSignal)));
      expect(screen.getByRole('button', { name: 'See Cardiology doctors' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('Nearby search for Cardiology')).toBeInTheDocument();
    });

    it('should offer nearby care when the clinic has nobody, or doctor search fails', async () => {
      const { user } = setup();
      await reachResults(user);
      expect(await screen.findByText(/No doctors for this specialty at this clinic/)).toBeInTheDocument();

      service.searchDoctorsBySpecialization.mockRejectedValue(new Error('down'));
      await user.click(screen.getByRole('button', { name: 'See Cardiology doctors' }));
      expect(await screen.findByText(/couldn't load doctors right now/)).toBeInTheDocument();
      expect(screen.getByText('Nearby search for Cardiology')).toBeInTheDocument();
    });

    it('should let the patient go back and correct the details', async () => {
      const { user } = setup();
      await reachResults(user);

      await user.click(screen.getByRole('button', { name: 'Correct the details' }));

      expect(await screen.findByLabelText('Medicine 1 name')).toHaveValue('Salbutamol');
    });

    it('should delete the data and return to the start', async () => {
      const { user } = setup();
      await reachResults(user);

      await user.click(screen.getByRole('button', { name: 'Delete this data' }));

      expect(service.deletePrescriptionUpload).toHaveBeenCalledWith('u1');
      expect(await screen.findByRole('heading', { name: 'Upload your prescription' })).toBeInTheDocument();
    });
  });

  it('should list saved uploads so they can be reopened or deleted', async () => {
    service.listPrescriptionUploads.mockResolvedValue({ data: [verified] });
    const { user } = setup();
    const date = new Date(verified.createdAt).toLocaleDateString();

    await user.click(await screen.findByRole('button', { name: `Open upload from ${date}` }));
    expect(screen.getByRole('heading', { name: 'Who you could talk to' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: `Delete upload from ${date}` }));
    expect(service.deletePrescriptionUpload).toHaveBeenCalledWith('u1');
  });
});
