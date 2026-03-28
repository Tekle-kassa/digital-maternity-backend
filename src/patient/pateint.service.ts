import crypto from "crypto";
import { createLinkedCaseVisit } from "../common/caseVisit";
import { AppError } from "../utils/AppError";
import { CreatePatientDTO, PatientRepository } from "./patient.repository";
import prisma from "../config/prisma";
import type {
  AncBasicInformationPayload,
  RegisterClientPayload,
} from "./patient.validators";

const PATIENT_KEYS = [
  "fullName",
  "cardNo",
  "phone",
  "email",
  "age",
  "address",
  "subCity",
  "woreda",
  "kebele",
  "houseNo",
  "facility",
  "maritalStatus",
  "idNumber",
  "emergencyContact",
  "emergencyPhone",
] as const;

function pick<T extends Record<string, unknown>, K extends string>(
  obj: T,
  keys: readonly K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const k of keys) {
    if (k in obj) (result as Record<string, unknown>)[k] = obj[k];
  }
  return result;
}

function omit<T extends Record<string, unknown>, K extends string>(
  obj: T,
  keys: readonly K[]
): Omit<T, K> {
  const set = new Set(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !set.has(k as K))
  ) as Omit<T, K>;
}

/** 8-digit card number for ANC basic-information flow (server-generated, not from UI). */
async function allocateUniqueCardNo(): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const cardNo = String(crypto.randomInt(10_000_000, 100_000_000));
    const taken = await PatientRepository.findByCardNo(cardNo);
    if (!taken) return cardNo;
  }
  throw new AppError("Could not allocate a unique card number", 503);
}

export class PatientService {
  /**
   * ANC flow step 1: persist only patient demographics (matches Basic Information UI).
   */
  static async createFromAncBasicInformation(
    payload: AncBasicInformationPayload,
    userId: string
  ) {
    const phone = payload.phone?.trim() || undefined;
    if (phone) {
      const exists = await PatientRepository.findByPhone(phone);
      if (exists)
        throw new AppError("Patient with this phone already exists", 400);
    }
    const cardNo = await allocateUniqueCardNo();
    const dto: CreatePatientDTO = {
      fullName: payload.fullName.trim(),
      age: payload.age,
      cardNo,
      facility: payload.facility,
      maritalStatus: payload.maritalStatus,
      subCity: payload.subCity,
      woreda: payload.woreda,
      kebele: payload.kebele,
      houseNo: payload.houseNo,
      phone,
      emergencyContact: payload.emergencyContact,
      emergencyPhone: payload.emergencyPhone,
      createdById: userId,
    };
    return this.createPatient(dto);
  }

  static async registerClient(payload: RegisterClientPayload, userId: string) {
    if (payload.phone) {
      const exists = await PatientRepository.findByPhone(payload.phone);
      if (exists)
        throw new AppError("Patient with this phone already exists", 400);
    }
    const unfpId = `UNFPA-${Date.now()}`;
    const patientData = {
      ...pick(payload, PATIENT_KEYS),
      createdById: userId,
    };
    return await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: { ...patientData, unfpId },
      });
      const ancPayload = omit(payload, PATIENT_KEYS);
      const ancRecord = await tx.aNCRecord.create({
        data: {
          patientId: patient.id,
          clientConsentSignature: ancPayload.clientConsentSignature,
          healthProfessionalConsentSignature:
            ancPayload.healthProfessionalConsentSignature,
          lmp: ancPayload.lmp,
          edd: ancPayload.edd,
          gravida: ancPayload.gravida,
          para: ancPayload.para,
          abortion: ancPayload.abortion,
          ectopicPreg: ancPayload.ectopicPreg,
          childrenAlive: ancPayload.childrenAlive,
          pastObstetricHistory: ancPayload.pastObstetricHistory ?? undefined,
          diabetesMellitus: ancPayload.diabetesMellitus,
          diabetesMellitusMoreInfo: ancPayload.diabetesMellitusMoreInfo,
          cardiacDisease: ancPayload.cardiacDisease,
          cardiacDiseaseMoreInfo: ancPayload.cardiacDiseaseMoreInfo,
          chronicHypertension: ancPayload.chronicHypertension,
          chronicHypertensionMoreInfo: ancPayload.chronicHypertensionMoreInfo,
          otherMedicalCondition: ancPayload.otherMedicalCondition,
          otherMedicalConditionText: ancPayload.otherMedicalConditionText,
          vdrl: ancPayload.vdrl,
          hiv: ancPayload.hiv,
          hbsAg: ancPayload.hbsAg,
          rbs: ancPayload.rbs,
          fbs: ancPayload.fbs,
          bloodGroupRh: ancPayload.bloodGroupRh,
          ua: ancPayload.ua,
          td: ancPayload.td,
          generalExamGeneral: ancPayload.generalExamGeneral,
          generalExamPallor: ancPayload.generalExamPallor,
          jaundice: ancPayload.jaundice,
          chestAbnormality: ancPayload.chestAbnormality,
          chestAbnormalityMoreInfo: ancPayload.chestAbnormalityMoreInfo,
          heartAbnormality: ancPayload.heartAbnormality,
          heartAbnormalityMoreInfo: ancPayload.heartAbnormalityMoreInfo,
          vulvarUlcer: ancPayload.vulvarUlcer,
          vaginalDischarge: ancPayload.vaginalDischarge,
          pelvicMass: ancPayload.pelvicMass,
          cervicalLesion: ancPayload.cervicalLesion,
          uterineSizeWks: ancPayload.uterineSizeWks,
          dangerSignsAdvised: ancPayload.dangerSignsAdvised,
          birthPreparednessAdvised: ancPayload.birthPreparednessAdvised,
          motherHivTestAccepted: ancPayload.motherHivTestAccepted,
          hivTestResult: ancPayload.hivTestResult,
          hivTestResultReceived: ancPayload.hivTestResultReceived,
          counseledInfantFeeding: ancPayload.counseledInfantFeeding,
          referredForCare: ancPayload.referredForCare,
          partnerHivTestResult: ancPayload.partnerHivTestResult,
          gaLmp: ancPayload.gaLmp,
          complaints: ancPayload.complaints,
          bloodPressure: ancPayload.bloodPressure,
          weightKg: ancPayload.weightKg,
          pallor: ancPayload.pallor,
          hemoglobin: ancPayload.hemoglobin,
          uterineHeightWks: ancPayload.uterineHeightWks,
          presentation: ancPayload.presentation,
          descent: ancPayload.descent,
          fetalHeartRate: ancPayload.fetalHeartRate,
          remarks: ancPayload.remarks,
          nextFollowUpDate: ancPayload.nextFollowUpDate,
          dangerSignsIdentified: ancPayload.dangerSignsIdentified,
          actionAdviceCounselling: ancPayload.actionAdviceCounselling,
        },
        include: { patient: true },
      });
      await createLinkedCaseVisit(tx, {
        patientId: patient.id,
        recordedById: userId,
        link: { category: "ANC", ancRecordId: ancRecord.id },
      });
      return { patient, ancRecord };
    });
  }

  static async createPatient(dto: CreatePatientDTO) {
    const unfpId = `UNFPA-${Date.now()}`;
    if (dto.phone) {
      const exists = await PatientRepository.findByPhone(dto.phone);
      if (exists)
        throw new AppError("Patient with this phone already exists", 400);
    }
    return await PatientRepository.create(dto, unfpId);
  }
  static async listPatients() {
    return await PatientRepository.findAll();
  }
  static async getPatient(id: string) {
    const patient = await PatientRepository.findById(id);
    if (!patient) throw new AppError("Patient not found", 404);
    return patient;
  }
  static async updatePatient(id: string, dto: Partial<CreatePatientDTO>) {
    const exists = await PatientRepository.findById(id);
    if (!exists) throw new AppError("Patient not found", 404);

    return await PatientRepository.update(id, dto);
  }
  static async deletePatient(id: string) {
    const exists = await PatientRepository.findById(id);
    if (!exists) throw new AppError("Patient not found", 404);

    return await PatientRepository.delete(id);
  }
}
