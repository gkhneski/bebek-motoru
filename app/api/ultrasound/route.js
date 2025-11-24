import Replicate from "replicate";
import Jimp from "jimp";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const body = await req.json();
    const { image } = body || {};

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

    // >>> HIER wird "replicate" definiert <<<
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Aufruf des Modells mit DEINER Version
    const output = await replicate.run(
      "fofr/latent-consistency-model:683d19dc312f7a9f0428b04429a9ccefd28dbf7785fef083ad5cf991b65f406f",
      {
        input: {
          image: dataUri,
          width: 768,
          height: 768,

          // Realistischere Baby-Beschreibung
          prompt:
            "highly realistic photograph of a real baby, natural skin texture, normal sized eyes, soft studio lighting, gentle warm tones, looks like a real photo, not a painting, not a 3D render, not a doll",

          num_images: 1,

          // Weniger aggressives Styling
          guidance_scale: 5,
          prompt_strength: 0.3,

          archive_outputs: false,
          sizing_strategy: "width/height",
          lcm_origin_steps: 50,
          canny_low_threshold: 100,
          num_inference_steps: 6,
          canny_high_threshold: 200,
          control_guidance_end: 1,
          control_guidance_start: 0,
          controlnet_conditioning_scale: 1.5,
        },
      }
    );

    // output[0] ist ein File-Objekt mit .url()
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
