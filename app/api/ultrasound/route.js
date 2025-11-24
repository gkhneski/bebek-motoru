import Replicate from "replicate";
import Jimp from "jimp";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { image, gender } = body || {}; // gender kommt von v0 (girl/boy)

    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Base64 aus Data-URL herauslösen
    let base64 = image;
    if (base64.startsWith("data:")) {
      base64 = base64.split(",")[1];
    }

    // Mit Jimp auf 768x768 bringen
    const buffer = Buffer.from(base64, "base64");
    const jimg = await Jimp.read(buffer);
    jimg.scaleToFit(768, 768);
    const processed = await jimg.getBufferAsync(Jimp.MIME_PNG);
    const dataUri = `data:image/png;base64,${processed.toString("base64")}`;

    // Replicate-Client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // ---------- Gender-Text: aber immer NEWBORN ----------
    let genderPrefix = "newborn baby, ";
    if (gender === "girl" || gender === "kiz") {
      genderPrefix = "newborn baby girl, ";
    } else if (gender === "boy" || gender === "erkek") {
      genderPrefix = "newborn baby boy, ";
    }

    // Basis-Prompt: echtes Neugeborenes, kaum Haare
    const basePrompt =
      "0-3 days old, highly realistic close-up photograph, almost bald or very fine fuzzy hair, closed eyes, tiny nose, plump newborn cheeks, soft natural skin texture, wrapped in a simple soft blanket, neutral background, gentle hospital or studio lighting, looks like a real camera photo, no makeup, no accessories";

    const fullPrompt = `${genderPrefix}${basePrompt}`;

    const output = await replicate.run(
      "fofr/latent-consistency-model:683d19dc312f7a9f0428b04429a9ccefd28dbf7785fef083ad5cf991b65f406f",
      {
        input: {
          image: dataUri,
          width: 768,
          height: 768,

          // immer newborn, mit Gender-Präfix
          prompt: fullPrompt,

          // VERBIETEN: große Augen, Haare, ältere Kinder, Cartoon etc.
          negative_prompt:
            "toddler, 6 months, 1 year old, child, thick hair, long hair, curly hair, hairstyle, ponytail, fringe, bangs, bow, headband, hat, earrings, teeth, anime, pixar, disney style, cartoon, illustration, painting, 3d render, cgi, doll, toy, glass eyes, porcelain skin, plastic skin, ultrasound, 3d ultrasound, medical scan, orange sepia tone, horror, deformed face",

          num_images: 1,

          // stärker Richtung Prompt (newborn)
          guidance_scale: 4.0,
          prompt_strength: 0.9,

          archive_outputs: false,
          sizing_strategy: "width/height",
          lcm_origin_steps: 50,
          num_inference_steps: 12,
        },
      }
    );

    const first = Array.isArray(output) ? output[0] : output;
    const imageUrl =
      first && typeof first.url === "function" ? first.url() : first;

    return new Response(
      JSON.stringify({ success: true, result: output, imageUrl }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Generation error:", err);
    return new Response(
      JSON.stringify({
        error: "Generation failed",
        details: String(err),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
