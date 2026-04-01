import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are an expert campus emergency dispatcher. Analyze the provided text and image of an ongoing campus crisis. Return a strict JSON object with the following keys: 'threat_level' (Low, Medium, High, Critical), 'incident_type' (e.g., Medical, Fire, Intruder, Facility, Natural Disaster, Hazmat, Violence, Accident), 'immediate_action_for_user' (1-2 sentences telling the student exactly what to do right now to stay safe, be very specific about evacuation routes and safety measures based on the location), 'brief_for_security' (a concise, tactical summary for campus responders including recommended units to dispatch), 'estimated_severity_score' (1-10 integer), 'recommended_units' (array of strings like 'Fire Department', 'Ambulance', 'Campus Security', 'Police', 'Hazmat Team'). Return ONLY the JSON object, no markdown formatting, no code fences.`;

// Smart fallback analysis when Gemini API is unavailable
function analyzeLocally(description: string, location: string) {
  const desc = description.toLowerCase();
  const loc = location.toLowerCase();

  // Incident type detection
  let incident_type = "General Emergency";
  let threat_level: "Low" | "Medium" | "High" | "Critical" = "Medium";
  let immediate_action = "";
  let brief = "";
  let severity = 5;
  let units: string[] = ["Campus Security"];

  if (desc.match(/fire|smoke|burn|flame|blaze/)) {
    incident_type = "Fire";
    threat_level = "Critical";
    severity = 9;
    units = ["Fire Department", "Campus Security", "Ambulance"];
    immediate_action = `EVACUATE ${location} immediately using the nearest stairwell. Do NOT use elevators. Move to the assembly point and stay low if there is smoke.`;
    brief = `Fire/smoke reported at ${location}. Initiate fire evacuation protocol. Dispatch fire response unit. Clear adjacent areas. Alert local fire department.`;
  } else if (desc.match(/collapse|unconscious|faint|heart|breathing|seizure|bleed|injur|hurt|pain|medical|ambulance|chest/)) {
    incident_type = "Medical";
    threat_level = "High";
    severity = 8;
    units = ["Ambulance", "Campus Security", "Campus Medical Team"];
    immediate_action = `Do NOT move the person unless they are in immediate danger at ${location}. Check for breathing, clear the area, and wait for medical responders. Call 108 if possible.`;
    brief = `Medical emergency at ${location}. Unresponsive/injured person reported. Dispatch campus medical team and ambulance immediately. Secure the area for paramedic access.`;
  } else if (desc.match(/intruder|weapon|gun|knife|threat|attack|fight|violen|assault|stab|shoot|armed|suspicio/)) {
    incident_type = "Intruder / Security Threat";
    threat_level = "Critical";
    severity = 10;
    units = ["Police", "Campus Security", "Ambulance"];
    immediate_action = `LOCKDOWN: Lock all doors at ${location}, hide behind solid furniture, silence your phone, and stay away from windows. Do NOT confront the threat.`;
    brief = `Security threat at ${location}. Possible armed/hostile individual reported. Activate campus lockdown protocol. Dispatch armed security and coordinate with local police immediately.`;
  } else if (desc.match(/flood|water|pipe|leak|burst|drain/)) {
    incident_type = "Facility - Water Damage";
    threat_level = "Medium";
    severity = 5;
    units = ["Facilities/Maintenance", "Campus Security"];
    immediate_action = `Leave ${location} through the nearest dry exit. Avoid standing water — there may be electrical hazard. Move to higher ground if flooding is severe.`;
    brief = `Water/flooding incident at ${location}. Cut water supply to affected area. Deploy maintenance team. Check electrical panels for safety. Evacuate if electrical risk detected.`;
  } else if (desc.match(/chemical|gas|smell|fume|toxic|hazard|spill|ventilation/)) {
    incident_type = "Hazmat / Chemical";
    threat_level = "High";
    severity = 8;
    units = ["Hazmat Team", "Fire Department", "Campus Security", "Ambulance"];
    immediate_action = `Leave ${location} immediately and move to open air. Cover your nose and mouth with a wet cloth. Do NOT touch any spilled substances.`;
    brief = `Chemical/hazmat incident at ${location}. Evacuate the floor and shut down HVAC to prevent spread. Deploy hazmat assessment team. Alert nearby blocks for precautionary evacuation.`;
  } else if (desc.match(/earthquake|tremor|quake|shak/)) {
    incident_type = "Natural Disaster";
    threat_level = "Critical";
    severity = 9;
    units = ["Fire Department", "Ambulance", "Campus Security", "Police"];
    immediate_action = `DROP, COVER, and HOLD ON at ${location}. Stay away from windows and heavy objects. After shaking stops, evacuate calmly and move to open ground.`;
    brief = `Earthquake/tremor reported. Campus-wide alert recommended. Check structural integrity of all blocks. Dispatch all available units for search and assessment.`;
  } else if (desc.match(/power|electric|shock|wire|spark|outage|blackout/)) {
    incident_type = "Electrical / Power";
    threat_level = "Medium";
    severity = 6;
    units = ["Facilities/Maintenance", "Campus Security"];
    immediate_action = `Stay away from any exposed wires or electrical panels at ${location}. Use your phone flashlight and calmly move to a safe, well-lit area.`;
    brief = `Electrical issue at ${location}. Possible exposed wiring or power failure. Cut power to affected zone. Deploy electrical maintenance team. Check for fire risk.`;
  } else if (desc.match(/stuck|elevator|trapped|locked|door/)) {
    incident_type = "Rescue / Entrapment";
    threat_level = "High";
    severity = 7;
    units = ["Fire Department", "Campus Security", "Facilities/Maintenance"];
    immediate_action = `Stay calm at ${location}. If trapped in an elevator, press the emergency button and wait for help. Do NOT try to force doors open. Conserve your phone battery.`;
    brief = `Person trapped/stuck at ${location}. Dispatch rescue team and facilities maintenance. Assess structural safety before extraction.`;
  } else if (desc.match(/accident|crash|vehicle|car|bike|hit|road|traffic/)) {
    incident_type = "Accident";
    threat_level = "High";
    severity = 7;
    units = ["Ambulance", "Campus Security", "Police"];
    immediate_action = `Stay clear of the accident scene at ${location}. Do not move injured persons. Direct traffic away from the area if safe to do so.`;
    brief = `Vehicle/road accident at ${location}. Possible injuries. Dispatch ambulance and secure the scene. Direct traffic away from the incident area.`;
  } else {
    // Generic but still useful
    immediate_action = `Stay alert and move away from any danger at ${location}. Inform others around you and proceed to the nearest safe zone. Follow campus emergency signs.`;
    brief = `Unclassified incident reported at ${location}: "${description}". Dispatch nearest security unit for immediate assessment. Await further details from reporter.`;
  }

  return {
    threat_level,
    incident_type,
    immediate_action_for_user: immediate_action,
    brief_for_security: brief,
    estimated_severity_score: severity,
    recommended_units: units,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, imageBase64, location } = body;

    if (!description) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If no valid API key, use smart local analysis
    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      console.log("No Gemini API key — using smart local analysis");
      const localResult = analyzeLocally(description, location || "Unknown location");
      return NextResponse.json(localResult);
    }

    const ai = new GoogleGenAI({ apiKey });

    const userPrompt = `Emergency Report:
Location: ${location || "Unknown"}
Description: ${description}

Analyze this campus emergency and provide your JSON assessment.`;

    // Build the parts array
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: userPrompt },
    ];

    // If an image was provided, add it as inline data
    if (imageBase64) {
      const base64Match = imageBase64.match(
        /^data:(image\/\w+);base64,(.+)$/
      );
      if (base64Match) {
        parts.push({
          inlineData: {
            mimeType: base64Match[1],
            data: base64Match[2],
          },
        });
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const text = response.text ?? "";

    const cleaned = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Crisis evaluation error:", error);

    // Even on error, try smart local analysis
    try {
      const body = await request.clone().json();
      const localResult = analyzeLocally(
        body.description || "unknown emergency",
        body.location || "Unknown location"
      );
      return NextResponse.json(localResult);
    } catch {
      return NextResponse.json({
        threat_level: "High",
        incident_type: "General Emergency",
        immediate_action_for_user:
          "Stay calm and move to the nearest safe zone. Alert others around you and follow campus emergency signs.",
        brief_for_security:
          "Incident reported. Dispatch nearest unit for assessment. Manual review required.",
        estimated_severity_score: 6,
        recommended_units: ["Campus Security"],
      });
    }
  }
}
