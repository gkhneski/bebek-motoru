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

    // Replicate-Client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Modell-Aufruf
    const output = await replicate.run(
      "fofr/latent-consistency-model:683d19dc312f7a9f0428b04429a9ccefd28dbf7785fef083ad5cf991b65f406f",
      {
        input: {
          image: dataUri,
          width: 768,
          height: 768,

          // Ziel: echtes Babyfoto, normale Augen
          prompt:
            "ultra realistic studio photograph of a 1-year-old baby, normal facial proportions, smaller almond-shaped eyes, clearly defined eyelids and eyelashes, natural brown irises, subtle catchlight in the eyes, soft but real skin texture, light blush on the cheeks, softly focused background, shot with a DSLR camera, no makeup, no fantasy",

          // alles verbieten, was Puppen-/Anime-Augen macht
          negative_prompt:
            "ultrasound, 3d ultrasound, clay, wax, sculpture, plastic, doll, toy, anime, pixar, disney style, cartoon, illustration, painting, 3d render, cg, cgi, plastic skin, porcelain doll, toy photo, glass eyes, glossy doll eyes, huge eyes, big anime eyes, oversized pupils, creepy eyes, horror, deformed face, medical scan, orange sepia tone",

          num_images: 1,

          // stärker Richtung Prompt, weniger Richtung Ultraschall
          guidance_scale: 3.5,
          prompt_strength: 0.85,

          archive_outputs: false,
          sizing_strategy: "width/height",
          lcm_origin_steps: 50,
          num_inference_steps: 10,
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
