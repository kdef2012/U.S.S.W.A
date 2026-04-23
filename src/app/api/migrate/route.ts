import { NextResponse } from "next/server";
import fs from "fs";
import { supabase } from "@/utils/supabase/client";

// Simple state machine to parse CSV
const parseCSVRow = (text: string) => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

export async function GET() {
  try {
    const csvPath = "C:\\Users\\kdnelson\\OneDrive - Winston-Salem Forsyth County Schools\\Desktop\\war-at-the-watertower-2-export.csv";
    const fileContent = fs.readFileSync(csvPath, "utf-8");
    
    const lines = fileContent.split("\n").filter(line => line.trim().length > 0);
    
    // The actual data starts at line 7 (index 6, but we skipped empty lines so let's find the header)
    const headerIndex = lines.findIndex(line => line.startsWith("Name,Event,Spaces"));
    if (headerIndex === -1) {
      return NextResponse.json({ error: "Could not find CSV headers" }, { status: 400 });
    }

    const dataLines = lines.slice(headerIndex + 1);
    const EVENT_ID = "280f2cea-729c-4340-8daa-0b34f2161da3"; // War at the WaterTower 04/25

    let insertedParents = 0;
    let insertedWrestlers = 0;
    let insertedRegistrations = 0;
    let skippedMultiples = 0;

    for (const line of dataLines) {
      const cols = parseCSVRow(line);
      if (cols.length < 17) continue;

      const spaces = parseInt(cols[2] || "1");
      const parentFirstName = cols[6];
      const parentLastName = cols[7];
      const phone = cols[8];
      const email = cols[9];
      const totalPaidStr = cols[12]?.replace("$", "") || "0";
      const totalPaid = parseFloat(totalPaidStr);
      
      const division = cols[13];
      const team = cols[14];
      const weightClass = cols[15];
      const wrestlerFirst = cols[16];
      const wrestlerLast = cols[17]; // Note: cols array is 0-indexed, so 17 is the 18th item if there's a trailing comma or something. Let's look at the header.
      // Header: 
      // 0: Name
      // 1: Event
      // 2: Spaces
      // 3: Status
      // 4: Total
      // 5: First Name (Wait, in the CSV line 6: "First Name" is 5? Let's count: Name,Event,Spaces,Status,Total,"First Name" -> 0,1,2,3,4,5
      // Actually, looking at line 7:
      // "Michael Boyd", "War at the WaterTower", 1, Approved, $35.00, , Michael, Boyd, 7049180925, boydmichael37@att.net
      // 0="Michael Boyd", 1="War...", 2="1", 3="Approved", 4="$35.00", 5="", 6="Michael", 7="Boyd", 8="704...", 9="email@..."
      // 10="04/25/26", 11="All Day", 12="$0.00" (Wait, 12 is Total Paid, which is $0.00? Total is at 4 which is $35.00). Let's use cols[4].
      // 13="HIGH SCHOOL", 14="Combat Athletics", 15="HS-157", 16="Corben", 17="Boyd"
      
      const actualFee = parseFloat(cols[4]?.replace("$", "") || "35");

      // 1. Upsert Parent
      if (!email) continue;
      
      let parentId;
      const { data: existingParent } = await supabase
        .from("parents")
        .select("id")
        .eq("email", email)
        .single();

      if (existingParent) {
        parentId = existingParent.id;
      } else {
        const { data: newParent, error: parentError } = await supabase
          .from("parents")
          .insert({
            first_name: cols[6],
            last_name: cols[7],
            email: email,
            phone: phone
          })
          .select("id")
          .single();
        
        if (parentError) console.error("Parent Error:", parentError);
        if (newParent) {
          parentId = newParent.id;
          insertedParents++;
        }
      }

      if (!parentId) continue;

      // 2. Handle Multiple Attendees Placeholder
      if (spaces > 1 && wrestlerFirst === "Multiple Attendees") {
        // We just insert a registration linked to the parent, but no wrestler_id
        const { error: regError } = await supabase
          .from("registrations")
          .insert({
            parent_id: parentId,
            event_id: EVENT_ID,
            wrestler_id: null,
            division: "Multiple Attendees",
            weight_class: "Multiple Attendees",
            fee: actualFee,
            status: "approved"
          });
        if (!regError) insertedRegistrations++;
        skippedMultiples++;
        continue; // Skip wrestler insert
      }

      // 3. Upsert Wrestler
      if (!wrestlerFirst || !wrestlerLast) continue;
      
      let wrestlerId;
      const { data: existingWrestler } = await supabase
        .from("wrestlers")
        .select("id")
        .ilike("first_name", wrestlerFirst)
        .ilike("last_name", wrestlerLast)
        .single();

      if (existingWrestler) {
        wrestlerId = existingWrestler.id;
      } else {
        const { data: newWrestler, error: wError } = await supabase
          .from("wrestlers")
          .insert({
            first_name: wrestlerFirst,
            last_name: wrestlerLast,
            team: team,
            parent_id: parentId
          })
          .select("id")
          .single();
        
        if (wError) console.error("Wrestler Error:", wError);
        if (newWrestler) {
          wrestlerId = newWrestler.id;
          insertedWrestlers++;
        }
      }

      if (!wrestlerId) continue;

      // 4. Insert Registration
      const { error: finalRegError } = await supabase
        .from("registrations")
        .insert({
          parent_id: parentId,
          wrestler_id: wrestlerId,
          event_id: EVENT_ID,
          division: division,
          weight_class: weightClass,
          fee: actualFee,
          status: "approved"
        });

      if (!finalRegError) {
        insertedRegistrations++;
      } else {
        console.error("Reg Error:", finalRegError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Migration complete!",
      stats: {
        insertedParents,
        insertedWrestlers,
        insertedRegistrations,
        skippedMultiples
      }
    });

  } catch (error: any) {
    console.error("Migration failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
