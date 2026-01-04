/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and authorization endpoints
 *   - name: Patients
 *     description: Patient management endpoints
 *   - name: ANC
 *     description: Antenatal Care (ANC) record management
 *   - name: Delivery
 *     description: Delivery and newborn record management
 *   - name: PNC
 *     description: Postnatal Care (PNC) visit management
 *   - name: GBV Screening
 *     description: Gender-Based Violence screening and registration
 *   - name: SRH
 *     description: Sexual and Reproductive Health registration
 *   - name: Visits
 *     description: General visit management
 *   - name: Ultrasound
 *     description: Ultrasound scan management
 *   - name: GBV Reports
 *     description: GBV report management
 *   - name: Referrals
 *     description: Patient referral management
 *   - name: Roles
 *     description: Role management
 *   - name: Pregnancy
 *     description: Pregnancy management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Patient:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         fullName:
 *           type: string
 *         unfpId:
 *           type: string
 *         cardNo:
 *           type: string
 *           nullable: true
 *         phone:
 *           type: string
 *           nullable: true
 *         email:
 *           type: string
 *           nullable: true
 *         age:
 *           type: integer
 *           nullable: true
 *         address:
 *           type: string
 *           nullable: true
 *         subCity:
 *           type: string
 *           nullable: true
 *         woreda:
 *           type: string
 *           nullable: true
 *         kebele:
 *           type: string
 *           nullable: true
 *         houseNo:
 *           type: string
 *           nullable: true
 *         facility:
 *           type: string
 *           nullable: true
 *         maritalStatus:
 *           type: string
 *           nullable: true
 *         idNumber:
 *           type: string
 *           nullable: true
 *         emergencyContact:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     ANCRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *         lmp:
 *           type: string
 *           format: date
 *           nullable: true
 *         edd:
 *           type: string
 *           format: date
 *           nullable: true
 *         gravida:
 *           type: integer
 *           nullable: true
 *         para:
 *           type: integer
 *           nullable: true
 *         diabetesMellitus:
 *           type: boolean
 *           nullable: true
 *         hiv:
 *           type: string
 *           nullable: true
 *         bloodGroupRh:
 *           type: string
 *           nullable: true
 *
 *     Delivery:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *         deliveryDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         amtsl:
 *           type: string
 *           enum: [Ergomtrine, Oxytocine, Misoprostol]
 *           nullable: true
 *         placenta:
 *           type: string
 *           enum: [Completed, Incomplete, CCT, MRP]
 *           nullable: true
 *         newborns:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Newborn'
 *
 *     Newborn:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         quantity:
 *           type: string
 *           enum: [Single, Multiple]
 *           nullable: true
 *         sex:
 *           type: string
 *           enum: [Male, Female]
 *           nullable: true
 *         termStatus:
 *           type: string
 *           enum: [Term, Preterm]
 *           nullable: true
 *         alive:
 *           type: boolean
 *           nullable: true
 *         apgarScore:
 *           type: integer
 *           nullable: true
 *         birthWeightGm:
 *           type: number
 *           nullable: true
 *         lengthCm:
 *           type: number
 *           nullable: true
 *
 *     PNCVisit:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *         deliveryId:
 *           type: string
 *           nullable: true
 *         bloodPressure:
 *           type: string
 *           nullable: true
 *         temperature:
 *           type: number
 *           nullable: true
 *         babyBreathing:
 *           type: string
 *           nullable: true
 *         babyBreastFeeding:
 *           type: string
 *           nullable: true
 *         hivTested:
 *           type: string
 *           nullable: true
 *
 *     GBVScreening:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *         gbvHistory:
 *           type: string
 *           nullable: true
 *         temperature:
 *           type: string
 *           nullable: true
 *         weightKg:
 *           type: number
 *           nullable: true
 *         heightCm:
 *           type: number
 *           nullable: true
 *         bmiIndex:
 *           type: number
 *           nullable: true
 *         workingDiagnosis:
 *           type: string
 *           nullable: true
 *         treatmentPlan:
 *           type: string
 *           nullable: true
 *
 *     SRHRegistration:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *         history:
 *           type: string
 *           nullable: true
 *         temperature:
 *           type: string
 *           nullable: true
 *         weightKg:
 *           type: number
 *           nullable: true
 *         heightCm:
 *           type: number
 *           nullable: true
 *         bmiIndex:
 *           type: number
 *           nullable: true
 *         workingDiagnosis:
 *           type: string
 *           nullable: true
 *         treatmentPlan:
 *           type: string
 *           nullable: true
 */

