import { NextResponse } from "next/server";
import fs from "fs";
import XLSX from "xlsx";
import dayjs from "dayjs";
import admin from "../admin";

export const runtime = "nodejs";

const db = admin.firestore();

function excelDateToDDMMYYYY(serial) {
  if (!serial) return "";
  if (typeof serial === "string") return serial.trim();
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return dayjs(date).format("DD-MM-YYYY");
}

function getAge(dobStr, joinStr) {
  if (!dobStr || !joinStr) return 20;
  const d = dayjs(dobStr, "DD-MM-YYYY");
  const j = dayjs(joinStr, "DD-MM-YYYY");
  const age = j.diff(d, "year");
  return isNaN(age) || age < 0 ? 20 : age;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { filePath, category = "isVivah", targetUids = ["user_rravenger7", "user_veerbalajifoundation"] } = body;

    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json({ success: false, message: `File not found: ${filePath}` }, { status: 400 });
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const rows = rawData.filter(r => r && r.length > 2 && r[1] && r[0] !== "कर्मांक नंबर");

    let totalMigrated = 0;

    for (const uid of targetUids) {
      const progCol = db.collection("users").doc(uid).collection("programs");
      const progSnap = await progCol.where("category", "==", category).get();
      
      let programId = category === "isVivah" ? "prog_vivah_1" : category === "isMamera" ? "prog_mayra_1" : "prog_suraksha_1";
      let programName = category === "isVivah" ? "पुत्र-पुत्री विवाह योजना" : category === "isMamera" ? "मायरा योजना" : "सुरक्षा सहयोग योजना";

      if (!progSnap.empty) {
        programId = progSnap.docs[0].id;
        programName = progSnap.docs[0].data().name || programName;
      }

      let count = 0;
      const batch = db.batch();

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const name = String(r[1] || "").trim();
        if (!name) continue;

        const fatherName = String(r[2] || "").trim();
        const gotra = String(r[3] || "").trim();
        const address = String(r[4] || "").trim();
        const dob = excelDateToDDMMYYYY(r[5]);
        const joinDate = excelDateToDDMMYYYY(r[6]);
        const aadhar = String(r[7] || "").replace(/\s+/g, "").trim();
        const guardian = String(r[8] || "").trim();
        const guardianRelation = String(r[9] || "").trim();
        const phone = String(r[10] || "").replace(/\s+/g, "").trim();
        const agentCode = String(r[11] || "").trim();
        const agentName = String(r[12] || "").trim();
        const fee = Number(r[13]) || 11000;

        const age = getAge(dob, joinDate);

        let ageGroupId = "ag_v3";
        let ageGroupRange = "16-21";
        let payAmount = 300;

        if (category === "isVivah") {
          if (age <= 10) { ageGroupId = "ag_v1"; ageGroupRange = "5-10"; payAmount = 100; }
          else if (age <= 15) { ageGroupId = "ag_v2"; ageGroupRange = "11-15"; payAmount = 200; }
          else if (age <= 21) { ageGroupId = "ag_v3"; ageGroupRange = "16-21"; payAmount = 300; }
          else { ageGroupId = "ag_v4"; ageGroupRange = "21+"; payAmount = 300; }
        } else if (category === "isMamera") {
          if (age <= 10) { ageGroupId = "ag_m1"; ageGroupRange = "5-10"; payAmount = 100; }
          else if (age <= 15) { ageGroupId = "ag_m2"; ageGroupRange = "11-15"; payAmount = 200; }
          else if (age <= 21) { ageGroupId = "ag_m3"; ageGroupRange = "16-21"; payAmount = 400; }
          else { ageGroupId = "ag_m4"; ageGroupRange = "21+"; payAmount = 500; }
        } else if (category === "isSuraksha") {
          if (age <= 50) { ageGroupId = "ag_s1"; ageGroupRange = "40-50"; payAmount = 100; }
          else if (age <= 60) { ageGroupId = "ag_s2"; ageGroupRange = "51-60"; payAmount = 200; }
          else if (age <= 70) { ageGroupId = "ag_s3"; ageGroupRange = "61-70"; payAmount = 300; }
          else { ageGroupId = "ag_s4"; ageGroupRange = "71+"; payAmount = 350; }
        }

        const memberRef = db.collection("users").doc(uid).collection("programs").doc(programId).collection("members").doc();
        batch.set(memberRef, {
          uid: memberRef.id,
          displayName: name,
          fatherName: fatherName,
          gotra: gotra,
          address: address,
          village: address,
          bobDate: dob,
          dateJoin: joinDate,
          aadhaarNo: aadhar,
          guardian: guardian,
          guardianRelation: guardianRelation,
          phone: phone,
          agentCode: agentCode,
          agentName: agentName,
          joinFees: fee,
          kistAmount: payAmount,
          payAmount: payAmount,
          age: age,
          ageGroup: ageGroupId,
          ageGroupRange: ageGroupRange,
          applicationNumber: String(r[0] || "").trim(),
          registrationNumber: String(r[0] || "").trim(),
          memberNumber: i + 1,
          programId: programId,
          programName: programName,
          status: "accepted",
          active_flag: true,
          delete_flag: false,
          joinFeesDone: true,
          joinFeesPaidAmount: fee,
          joinFeesRemainingAmount: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        count++;
      }

      await batch.commit();
      await db.collection("users").doc(uid).collection("programs").doc(programId).set({
        name: programName,
        category: category,
        [category]: true,
        memberCount: count
      }, { merge: true });

      totalMigrated += count;
    }

    return NextResponse.json({ success: true, count: totalMigrated, message: `Successfully imported ${rows.length} members` });
  } catch (err) {
    console.error("Excel import error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
